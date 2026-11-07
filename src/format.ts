const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const TITLE = /^(pastor|pst|rev|reverend)\.?$/i

export function formatTime(slot: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(slot.trim())
  if (!match) return slot
  const hour24 = Number(match[1])
  const minute = Number(match[2])
  if (hour24 > 23 || minute > 59) return slot
  const suffix = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 || 12
  return `${hour12}:${match[2]} ${suffix}`
}

export function formatLongDate(iso: string) {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  const value = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(iso)
  if (Number.isNaN(value.getTime())) return iso
  return `${WEEKDAYS[value.getDay()]}, ${value.getDate()} ${MONTHS[value.getMonth()]} ${value.getFullYear()}`
}

export function initials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => part && !TITLE.test(part))
  if (parts.length === 0) return ''
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : (parts[0]?.[1] ?? '')
  return `${first}${last}`.toUpperCase()
}
