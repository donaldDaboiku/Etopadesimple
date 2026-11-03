export const SLOT_TIMES = ['09:00', '09:30', '10:15', '11:00', '13:30', '15:00', '15:45'] as const

export const MAX_DAYS_AHEAD = 90
export const MIN_NOTICE_MINUTES = 30

export const pastors = [
  { id: 'd1111111-1111-4111-8111-111111111111', name: 'Pastor James Adebayo' },
  { id: 'd2222222-2222-4222-8222-222222222222', name: 'Pastor Esther Moyo' },
  { id: 'd3333333-3333-4333-8333-333333333333', name: 'Pastor Daniel Okafor' },
]

export const appointmentTypes = [
  { id: '33333333-3333-4333-8333-333333333333', name: 'Prayer' },
  { id: '44444444-4444-4444-8444-444444444444', name: 'Counselling' },
  { id: '55555555-5555-4555-8555-555555555555', name: 'Spiritual Guidance' },
  { id: 'e1111111-1111-4111-8111-111111111111', name: 'Marriage counselling' },
  { id: 'e2222222-2222-4222-8222-222222222222', name: 'Wedding preparation' },
  { id: 'e3333333-3333-4333-8333-333333333333', name: 'Hospital visitation' },
]

export type BookingDraft = {
  pastorId: string
  appointmentTypeId: string
  date: string
  slot: string
  contactMethod: string
  meetingMode: string
  fullName: string
  email: string
  phone: string
  membership: string
  notes: string
}

export type BookingErrors = Partial<Record<keyof BookingDraft, string>>

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function emptyBooking(): BookingDraft {
  return {
    pastorId: pastors[0].id,
    appointmentTypeId: appointmentTypes[0].id,
    date: '',
    slot: '',
    contactMethod: 'email',
    meetingMode: 'physical',
    fullName: '',
    email: '',
    phone: '',
    membership: '',
    notes: '',
  }
}

export function slotKey(pastorId: string, date: string, slot: string) {
  return `${pastorId}|${date}|${slot}`
}

export function formatIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function scheduledAt(date: string, slot: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(slot)) return null
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = slot.split(':').map(Number)
  const value = new Date(year, month - 1, day, hour, minute, 0, 0)
  if (value.getFullYear() !== year || value.getMonth() !== month - 1 || value.getDate() !== day) return null
  if (value.getHours() !== hour || value.getMinutes() !== minute) return null
  return value
}

function digitCount(value: string) {
  return (value.match(/\d/g) ?? []).length
}

export function validateBooking(draft: BookingDraft, now = new Date(), taken: string[] = []): BookingErrors {
  const errors: BookingErrors = {}
  const name = draft.fullName.trim()
  const email = draft.email.trim()
  const phone = draft.phone.trim()
  const notes = draft.notes.trim()
  const membership = draft.membership.trim()

  if (!pastors.some((pastor) => pastor.id === draft.pastorId)) errors.pastorId = 'Choose a pastor.'
  if (!appointmentTypes.some((type) => type.id === draft.appointmentTypeId)) {
    errors.appointmentTypeId = 'Choose an appointment category.'
  }
  if (!['email', 'whatsapp', 'sms'].includes(draft.contactMethod)) {
    errors.contactMethod = 'Choose email, WhatsApp, or SMS.'
  }
  if (!['physical', 'virtual'].includes(draft.meetingMode)) errors.meetingMode = 'Choose physical or virtual.'

  if (name.length < 2) errors.fullName = 'Enter the visitor’s full name.'
  else if (name.length > 120) errors.fullName = 'Name must be 120 characters or fewer.'

  if (!emailPattern.test(email) || email.length > 254) errors.email = 'Enter a valid email address.'

  const phoneRequired = draft.contactMethod === 'whatsapp' || draft.contactMethod === 'sms'
  if (phone && !/^[+\d\s().-]+$/.test(phone)) errors.phone = 'Use digits and phone punctuation only.'
  else if (phoneRequired && digitCount(phone) < 7) errors.phone = 'Enter a phone number for this contact method.'
  else if (phone && digitCount(phone) < 7) errors.phone = 'Enter a phone number with at least 7 digits.'

  if (membership.length > 120) errors.membership = 'Membership must be 120 characters or fewer.'
  if (notes.length > 1000) errors.notes = 'Notes must be 1,000 characters or fewer.'

  if (!draft.date) errors.date = 'Choose a date.'
  if (!draft.slot) errors.slot = 'Choose a time slot.'
  else if (!SLOT_TIMES.includes(draft.slot as (typeof SLOT_TIMES)[number])) errors.slot = 'Choose one of the listed time slots.'

  if (draft.date && draft.slot && !errors.slot) {
    const when = scheduledAt(draft.date, draft.slot)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const latest = new Date(today)
    latest.setDate(latest.getDate() + MAX_DAYS_AHEAD)
    if (!when) errors.date = 'Choose a real calendar date.'
    else if (when.getTime() < now.getTime() + MIN_NOTICE_MINUTES * 60_000) {
      errors.slot = `Choose a time at least ${MIN_NOTICE_MINUTES} minutes from now.`
    } else if (when > new Date(latest.getFullYear(), latest.getMonth(), latest.getDate(), 23, 59, 59, 999)) {
      errors.date = `Bookings can be made up to ${MAX_DAYS_AHEAD} days ahead.`
    } else if (taken.includes(slotKey(draft.pastorId, draft.date, draft.slot))) {
      errors.slot = 'That time is already requested for this pastor.'
    }
  }

  return errors
}

export function validateSignIn(email: string, password: string, role: string) {
  const errors: { email?: string; password?: string; role?: string } = {}
  if (!emailPattern.test(email.trim()) || email.trim().length > 254) errors.email = 'Enter a valid email address.'
  if (password.length < 8) errors.password = 'Use at least 8 characters.'
  if (role !== 'pastor' && role !== 'secretary') errors.role = 'Choose pastor or secretary.'
  return errors
}
