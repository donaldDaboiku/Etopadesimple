import assert from 'node:assert/strict'
import { test } from 'node:test'
import { defaultSchedule, monthCells, slotsOn, type WeekSchedule } from './availability.ts'
import { validateBooking, emptyBooking } from './validation.ts'

const closedSunday: WeekSchedule = {
  weekdays: [1, 2, 3, 4, 5],
  slots: ['10:15'],
  blockedDates: ['2026-11-11'],
}

test('offers weekday hours and skips closed or blocked days', () => {
  assert.deepEqual(slotsOn(closedSunday, '2026-11-12'), ['10:15'])
  assert.deepEqual(slotsOn(closedSunday, '2026-11-15'), [])
  assert.deepEqual(slotsOn(closedSunday, '2026-11-11'), [])
})

test('builds a Sunday-first month', () => {
  const november = monthCells(2026, 10)
  assert.equal(november.length, 42)
  assert.equal(november[0].date, '2026-11-01')
  assert.equal(november[0].inMonth, true)
  const december = monthCells(2026, 11)
  assert.equal(december[0].date, '2026-11-29')
  assert.equal(december[0].inMonth, false)
})

test('rejects a day or time outside the pastor schedule', () => {
  const now = new Date(2026, 10, 3, 8, 0, 0)
  const draft = {
    ...emptyBooking(),
    date: '2026-11-11',
    slot: '09:00',
    fullName: 'Miriam Oduro',
    email: 'miriam@example.com',
  }
  assert.equal(validateBooking({ ...draft, date: '2026-11-15' }, now, [], undefined, closedSunday).date, 'That pastor is not available on this day.')
  assert.equal(validateBooking(draft, now, [], undefined, closedSunday).date, 'That pastor is not available on this day.')
  assert.equal(
    validateBooking({ ...draft, date: '2026-11-12', slot: '09:00' }, now, [], undefined, closedSunday).slot,
    'That time is outside this pastor’s hours.',
  )
  assert.deepEqual(validateBooking({ ...draft, date: '2026-11-12', slot: '10:15' }, now, [], undefined, defaultSchedule()), {})
})
