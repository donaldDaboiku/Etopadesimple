import type { User } from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import type { StaffAccount, StaffRole } from './auth.ts'
import { isStaffRole } from './auth.ts'
import { BRANCH_ID, buildBooking, holdDocumentId, ORGANISATION_ID, type BookingRecord } from './bookings.ts'
import { auth, createPasswordAccount, db } from './firebaseApp.ts'
import { noticeDocumentId, type NoticeKind, type NoticeScope } from './notices.ts'
import { auditDocumentId, type AuditAction } from './reports.ts'
import { staffEmailKey, validateStaffInvite, type StaffInvite } from './staff.ts'
import { defaultSchedule, normalizeSchedule, scheduleError, slotsOn, type WeekSchedule } from './availability.ts'
import type { BookingDraft } from './validation.ts'

export const CHURCH_ID = 'grace'

function churchCollection(name: string) {
  return collection(db, 'organisations', CHURCH_ID, name)
}

function toRecord(id: string, data: Record<string, unknown>): BookingRecord {
  const scheduled = data.scheduledFor instanceof Timestamp ? data.scheduledFor.toDate() : new Date()
  const created = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : scheduled
  return {
    id,
    organisation_id: ORGANISATION_ID,
    branch_id: BRANCH_ID,
    pastor_id: String(data.pastorId ?? ''),
    appointment_type_id: String(data.appointmentTypeId ?? ''),
    visitor_name: String(data.visitorName ?? ''),
    visitor_email: String(data.visitorEmail ?? ''),
    visitor_phone: typeof data.visitorPhone === 'string' ? data.visitorPhone : null,
    contact_method: String(data.contactMethod ?? 'email'),
    meeting_mode: String(data.meetingMode ?? 'physical'),
    scheduled_for: scheduled.toISOString(),
    status: data.status === 'confirmed' || data.status === 'declined' ? data.status : 'pending',
    notes: typeof data.notes === 'string' ? data.notes : null,
    booking_reference: String(data.bookingReference ?? ''),
    created_at: created.toISOString(),
  }
}

export async function listPastors() {
  const snap = await getDocs(churchCollection('pastors'))
  return snap.docs
    .filter((item) => item.data().active !== false)
    .map((item) => ({ id: item.id, name: String(item.data().name ?? 'Pastor') }))
    .sort((left, right) => left.name.localeCompare(right.name))
}

function toSchedule(data: Record<string, unknown>): WeekSchedule {
  return normalizeSchedule({
    weekdays: Array.isArray(data.weekdays) ? data.weekdays.filter((day): day is number => typeof day === 'number') : [],
    slots: Array.isArray(data.slots) ? data.slots.filter((slot): slot is string => typeof slot === 'string') : [],
    blockedDates: Array.isArray(data.blockedDates)
      ? data.blockedDates.filter((date): date is string => typeof date === 'string')
      : [],
  })
}

export async function listSchedules() {
  const snap = await getDocs(churchCollection('availability'))
  return Object.fromEntries(snap.docs.map((item) => [item.id, toSchedule(item.data())]))
}

export async function saveSchedule(
  pastorId: string,
  schedule: WeekSchedule,
): Promise<{ error: string } | { schedule: WeekSchedule }> {
  const clean = normalizeSchedule(schedule)
  const problem = scheduleError(clean)
  if (problem !== null) return { error: problem }
  await setDoc(doc(db, 'organisations', CHURCH_ID, 'availability', pastorId), clean)
  return { schedule: clean }
}

export async function listOpenSlotKeys() {
  const snap = await getDocs(churchCollection('slotHolds'))
  return snap.docs
    .filter((item) => item.data().status === 'pending' || item.data().status === 'confirmed')
    .map((item) => {
      const data = item.data()
      return `${data.pastorId}|${data.date}|${data.slot}`
    })
}

// Standard where() rather than a Firestore pipeline: these screens need one equality filter, and the local emulator serves that API.
export async function listBookings(pastorId: string | null) {
  const bookings = churchCollection('bookings')
  const snap = pastorId ? await getDocs(query(bookings, where('pastorId', '==', pastorId))) : await getDocs(bookings)
  return snap.docs.map((item) => toRecord(item.id, item.data()))
}

export type NoticeItem = {
  id: string
  kind: NoticeKind
  visitorName: string
  date: string
  slot: string
  createdAt: string
}

async function writeNotice(input: {
  bookingId: string
  scope: NoticeScope
  kind: NoticeKind
  pastorId: string
  visitorName: string
  date: string
  slot: string
}) {
  const id = noticeDocumentId(input.bookingId, input.scope, input.kind)
  try {
    await setDoc(doc(db, 'organisations', CHURCH_ID, 'notices', id), {
      scope: input.scope,
      pastorId: input.scope === 'pastor' ? input.pastorId : null,
      bookingId: input.bookingId,
      kind: input.kind,
      visitorName: input.visitorName,
      date: input.date,
      slot: input.slot,
      createdAt: serverTimestamp(),
    })
  } catch {
    // The booking is already stored. A repeat write is denied, and a missed notice can be sent again later.
  }
}

export async function listNotices(pastorId: string | null) {
  const notices = churchCollection('notices')
  const snap = pastorId
    ? await getDocs(query(notices, where('pastorId', '==', pastorId)))
    : await getDocs(query(notices, where('scope', '==', 'office')))
  return snap.docs
    .map((item) => {
      const data = item.data()
      const created = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(0)
      const kind: NoticeKind = data.kind === 'confirmed' || data.kind === 'declined' ? data.kind : 'requested'
      return {
        id: item.id,
        kind,
        visitorName: String(data.visitorName ?? ''),
        date: String(data.date ?? ''),
        slot: String(data.slot ?? ''),
        createdAt: created.toISOString(),
      }
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

export async function listSeenNoticeIds() {
  const email = auth.currentUser?.email ? staffEmailKey(auth.currentUser.email) : ''
  if (!email) return []
  const snap = await getDocs(query(churchCollection('noticeReads'), where('email', '==', email)))
  return snap.docs.map((item) => String(item.data().noticeId ?? ''))
}

export type AuditItem = {
  id: string
  action: AuditAction
  actor: string
  visitorName: string
  bookingReference: string
  createdAt: string
}

async function writeAudit(input: {
  bookingId: string
  pastorId: string
  action: AuditAction
  actor: string
  visitorName: string
  bookingReference: string
}) {
  try {
    await setDoc(doc(db, 'organisations', CHURCH_ID, 'audits', auditDocumentId(input.bookingId, input.action)), {
      bookingId: input.bookingId,
      pastorId: input.pastorId,
      action: input.action,
      actor: input.actor,
      visitorName: input.visitorName,
      bookingReference: input.bookingReference,
      createdAt: serverTimestamp(),
    })
  } catch {
    // The booking change is already stored. A repeat write is denied.
  }
}

export async function listAudits(pastorId: string | null) {
  const audits = churchCollection('audits')
  const snap = pastorId ? await getDocs(query(audits, where('pastorId', '==', pastorId))) : await getDocs(audits)
  return snap.docs
    .map((item) => {
      const data = item.data()
      const created = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(0)
      const action: AuditAction = data.action === 'confirmed' || data.action === 'declined' ? data.action : 'requested'
      return {
        id: item.id,
        action,
        actor: String(data.actor ?? ''),
        visitorName: String(data.visitorName ?? ''),
        bookingReference: String(data.bookingReference ?? ''),
        createdAt: created.toISOString(),
      }
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

export async function markNoticeRead(noticeId: string) {
  const email = auth.currentUser?.email ? staffEmailKey(auth.currentUser.email) : ''
  if (!email) return
  await setDoc(doc(db, 'organisations', CHURCH_ID, 'noticeReads', `${email}__${noticeId}`), { email, noticeId })
}

export async function createBooking(draft: BookingDraft) {
  const scheduleSnap = await getDoc(doc(db, 'organisations', CHURCH_ID, 'availability', draft.pastorId))
  if (scheduleSnap.exists() && !slotsOn(toSchedule(scheduleSnap.data()), draft.date).includes(draft.slot)) {
    return { error: 'closed' as const }
  }
  const record = buildBooking(draft)
  const holdId = holdDocumentId(draft.pastorId, draft.date, draft.slot)
  const holdRef = doc(db, 'organisations', CHURCH_ID, 'slotHolds', holdId)
  const bookingRef = doc(db, 'organisations', CHURCH_ID, 'bookings', record.id)
  try {
    await runTransaction(db, async (transaction) => {
      const hold = await transaction.get(holdRef)
      if (hold.exists()) throw new Error('taken')
      transaction.set(holdRef, {
        pastorId: draft.pastorId,
        date: draft.date,
        slot: draft.slot,
        status: 'pending',
        bookingId: record.id,
      })
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'taken') return { error: 'taken' as const }
    throw error
  }

  await setDoc(bookingRef, {
    pastorId: record.pastor_id,
    appointmentTypeId: record.appointment_type_id,
    visitorName: record.visitor_name,
    visitorEmail: record.visitor_email,
    visitorPhone: record.visitor_phone,
    contactMethod: record.contact_method,
    meetingMode: record.meeting_mode,
    date: draft.date,
    slot: draft.slot,
    scheduledFor: Timestamp.fromDate(new Date(record.scheduled_for)),
    status: 'pending',
    notes: record.notes,
    bookingReference: record.booking_reference,
    createdAt: serverTimestamp(),
    holdId,
  })
  const notice = {
    bookingId: record.id,
    pastorId: record.pastor_id,
    visitorName: record.visitor_name,
    date: draft.date,
    slot: draft.slot,
  }
  await writeNotice({ ...notice, scope: 'pastor', kind: 'requested' })
  await writeNotice({ ...notice, scope: 'office', kind: 'requested' })
  await writeAudit({
    bookingId: record.id,
    pastorId: record.pastor_id,
    action: 'requested',
    actor: 'visitor',
    visitorName: record.visitor_name,
    bookingReference: record.booking_reference,
  })
  return { record }
}

export async function decideRemote(bookingId: string, status: 'confirmed' | 'declined') {
  const bookingRef = doc(db, 'organisations', CHURCH_ID, 'bookings', bookingId)
  const snap = await getDoc(bookingRef)
  const data = snap.exists() ? snap.data() : null
  const holdId = data ? String(data.holdId ?? '') : ''
  await updateDoc(bookingRef, { status })
  if (holdId) {
    const holdRef = doc(db, 'organisations', CHURCH_ID, 'slotHolds', holdId)
    if (status === 'confirmed') await updateDoc(holdRef, { status: 'confirmed' })
    else await deleteDoc(holdRef)
  }
  if (!data) return
  await writeNotice({
    bookingId,
    scope: 'office',
    kind: status,
    pastorId: String(data.pastorId ?? ''),
    visitorName: String(data.visitorName ?? ''),
    date: String(data.date ?? ''),
    slot: String(data.slot ?? ''),
  })
  const actor = auth.currentUser?.email ? staffEmailKey(auth.currentUser.email) : ''
  if (!actor) return
  await writeAudit({
    bookingId,
    pastorId: String(data.pastorId ?? ''),
    action: status,
    actor,
    visitorName: String(data.visitorName ?? ''),
    bookingReference: String(data.bookingReference ?? ''),
  })
}

export async function loadAccount(user: User): Promise<StaffAccount | null> {
  const email = user.email ? staffEmailKey(user.email) : ''
  if (!email) return null
  const memberRef = doc(db, 'organisations', CHURCH_ID, 'members', email)
  const snap = await getDoc(memberRef)
  if (!snap.exists()) return null
  const data = snap.data()
  if (!isStaffRole(data.role)) return null
  if (data.uid == null) {
    try {
      await updateDoc(memberRef, { uid: user.uid, status: 'active' })
    } catch {
      const again = await getDoc(memberRef)
      if (!again.exists() || again.data().uid !== user.uid) throw new Error('This email could not be linked.')
    }
  }
  return {
    email,
    name: String(data.name ?? user.displayName ?? email),
    role: data.role as StaffRole,
    pastorId: typeof data.pastorId === 'string' ? data.pastorId : null,
  }
}

export type DirectoryMember = StaffAccount & { status: string }

export async function listStaff(): Promise<DirectoryMember[]> {
  const snap = await getDocs(churchCollection('members'))
  return snap.docs
    .map((item) => {
      const data = item.data()
      if (!isStaffRole(data.role)) return null
      return {
        email: String(data.email ?? item.id),
        name: String(data.name ?? ''),
        role: data.role as StaffRole,
        pastorId: typeof data.pastorId === 'string' ? data.pastorId : null,
        status: String(data.status ?? 'invited'),
      }
    })
    .filter((item): item is DirectoryMember => item !== null)
    .sort((left, right) => left.name.localeCompare(right.name))
}

export async function createStaff(invite: StaffInvite) {
  const errors = validateStaffInvite(invite)
  if (errors.name || errors.email || errors.role || errors.password) return { error: 'invalid' as const }
  const email = staffEmailKey(invite.email)
  const memberRef = doc(db, 'organisations', CHURCH_ID, 'members', email)
  const existing = await getDoc(memberRef)
  if (existing.exists()) return { error: 'exists' as const }
  try {
    await createPasswordAccount(email, invite.password)
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : ''
    if (code === 'auth/email-already-in-use' || code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      return { error: 'exists' as const }
    }
    return { error: 'invalid' as const }
  }
  // ponytail: two creates with the same password can both pass this read. The second member write is rejected by the rules; an extra pastor doc can remain. Upgrade path: reserve the member id before writing the pastor.
  if ((await getDoc(memberRef)).exists()) return { error: 'exists' as const }
  const pastorId = invite.role === 'pastor' ? crypto.randomUUID() : null
  if (pastorId) {
    await setDoc(doc(db, 'organisations', CHURCH_ID, 'pastors', pastorId), {
      name: invite.name.trim(),
      active: true,
    })
    await setDoc(doc(db, 'organisations', CHURCH_ID, 'availability', pastorId), defaultSchedule())
  }
  await setDoc(memberRef, {
    email,
    name: invite.name.trim(),
    role: invite.role,
    pastorId,
    uid: null,
    status: 'invited',
  })
  return { email }
}
