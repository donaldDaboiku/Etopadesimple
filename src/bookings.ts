import { reportView } from './auth.ts'
import { pastors, slotKey, formatIsoDate, type BookingDraft } from './validation.ts'

export const ORGANISATION_ID = '11111111-1111-4111-8111-111111111111'
export const BRANCH_ID = '22222222-2222-4222-8222-222222222222'
export type BookingRecord = {
  id: string
  organisation_id: string
  branch_id: string
  pastor_id: string
  appointment_type_id: string
  visitor_name: string
  visitor_email: string
  visitor_phone: string | null
  contact_method: string
  meeting_mode: string
  scheduled_for: string
  status: 'pending' | 'confirmed' | 'declined'
  notes: string | null
  booking_reference: string
  created_at: string
}

export function scheduledFor(date: string, slot: string) {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = slot.split(':').map(Number)
  return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString()
}

export function holdDocumentId(pastorId: string, date: string, slot: string) {
  return `${pastorId}_${date}_${slot.replace(':', '-')}`
}

export function slotKeyFromRecord(record: BookingRecord) {
  const when = new Date(record.scheduled_for)
  const slot = `${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}`
  return slotKey(record.pastor_id, formatIsoDate(when), slot)
}

export function activeSlotKeys(records: BookingRecord[]) {
  return records.filter((record) => record.status === 'pending' || record.status === 'confirmed').map(slotKeyFromRecord)
}

export function decideBooking(
  records: BookingRecord[],
  bookingId: string,
  pastorId: string,
  status: 'confirmed' | 'declined',
) {
  const index = records.findIndex((record) => record.id === bookingId)
  const record = records[index]
  if (!record || record.pastor_id !== pastorId || record.status !== 'pending') return { error: 'forbidden' as const }
  const next = records.slice()
  next[index] = { ...record, status }
  return { records: next }
}

function bookingReference() {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase()
}

export function buildBooking(draft: BookingDraft, now = new Date()): BookingRecord {
  const notes = [draft.membership.trim() ? `Membership: ${draft.membership.trim()}` : '', draft.notes.trim()]
    .filter(Boolean)
    .join('\n')
  return {
    id: crypto.randomUUID(),
    organisation_id: ORGANISATION_ID,
    branch_id: BRANCH_ID,
    pastor_id: draft.pastorId,
    appointment_type_id: draft.appointmentTypeId,
    visitor_name: draft.fullName.trim(),
    visitor_email: draft.email.trim(),
    visitor_phone: draft.phone.trim() || null,
    contact_method: draft.contactMethod,
    meeting_mode: draft.meetingMode,
    scheduled_for: scheduledFor(draft.date, draft.slot),
    status: 'pending',
    notes: notes || null,
    booking_reference: bookingReference(),
    created_at: now.toISOString(),
  }
}

export function addBooking(records: BookingRecord[], draft: BookingDraft, now = new Date()) {
  const record = buildBooking(draft, now)
  if (activeSlotKeys(records).includes(slotKeyFromRecord(record))) return { error: 'taken' as const }
  return { records: [...records, record], record }
}

export function describeBooking(record: BookingRecord, pastorNames: { id: string; name: string }[] = pastors) {
  const when = new Date(record.scheduled_for)
  const pastor = pastorNames.find((item) => item.id === record.pastor_id)?.name ?? 'Pastor'
  const slot = `${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}`
  return {
    pastor,
    when: `${formatIsoDate(when)} at ${slot}`,
  }
}

export function bookingsVisibleTo(
  records: BookingRecord[],
  role: string | null | undefined,
  pastorId: string | null | undefined,
) {
  const view = reportView(role)
  if (view === 'church') return records
  if (view === 'own' && pastorId) return records.filter((record) => record.pastor_id === pastorId)
  return []
}

export function countBookings(records: BookingRecord[], pastorId?: string | null) {
  const rows = pastorId ? records.filter((record) => record.pastor_id === pastorId) : records
  const today = formatIsoDate(new Date())
  return {
    total: rows.length,
    pending: rows.filter((record) => record.status === 'pending').length,
    today: rows.filter((record) => formatIsoDate(new Date(record.scheduled_for)) === today).length,
  }
}
