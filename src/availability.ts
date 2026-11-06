import { SLOT_TIMES, formatIsoDate } from './validation.ts'

export type WeekSchedule = {
  weekdays: number[]
  slots: string[]
  blockedDates: string[]
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const MONTH_LABELS = [
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

export function defaultSchedule(): WeekSchedule {
  return { weekdays: [1, 2, 3, 4, 5], slots: [...SLOT_TIMES], blockedDates: [] }
}

export function weekdayOf(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
  const [year, month, day] = iso.split('-').map(Number)
  const value = new Date(year, month - 1, day)
  if (value.getFullYear() !== year || value.getMonth() !== month - 1 || value.getDate() !== day) return null
  return value.getDay()
}

export function normalizeSchedule(input: WeekSchedule): WeekSchedule {
  const weekdays = [...new Set(input.weekdays.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))].sort(
    (left, right) => left - right,
  )
  const slots = SLOT_TIMES.filter((slot) => input.slots.includes(slot))
  const blockedDates = [...new Set(input.blockedDates.filter((date) => weekdayOf(date) !== null))].sort()
  return { weekdays, slots, blockedDates }
}

export function scheduleError(schedule: WeekSchedule) {
  if (schedule.weekdays.length === 0) return 'Choose at least one day.'
  if (schedule.slots.length === 0) return 'Choose at least one time.'
  if (schedule.blockedDates.length > 90) return 'Block at most 90 dates.'
  return null
}

export function slotsOn(schedule: WeekSchedule, iso: string) {
  const weekday = weekdayOf(iso)
  if (weekday === null || !schedule.weekdays.includes(weekday) || schedule.blockedDates.includes(iso)) return []
  return schedule.slots.filter((slot) => (SLOT_TIMES as readonly string[]).includes(slot))
}

export function monthKey(cursor: { year: number; month: number }) {
  return `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}`
}

export function shiftMonth(cursor: { year: number; month: number }, delta: number) {
  const next = new Date(cursor.year, cursor.month + delta, 1)
  return { year: next.getFullYear(), month: next.getMonth() }
}

export function monthLabel(year: number, month: number) {
  return `${MONTH_LABELS[month]} ${year}`
}

export function monthCells(year: number, month: number) {
  const first = new Date(year, month, 1)
  const start = new Date(year, month, 1 - first.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return { date: formatIsoDate(day), inMonth: day.getMonth() === month }
  })
}
