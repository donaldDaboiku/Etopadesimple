import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addBooking, countBookings, type BookingRecord } from './bookings.ts'
import { emptyBooking } from './validation.ts'

function draft() {
  return {
    ...emptyBooking(),
    date: '2026-11-11',
    slot: '09:00',
    fullName: 'Miriam Oduro',
    email: 'miriam@example.com',
    membership: 'Main Campus',
    notes: 'Prayer support',
  }
}

test('a public request becomes a pending booking row', () => {
  const saved = addBooking([], draft(), new Date(2026, 10, 3, 8, 0, 0))
  assert.ok(!('error' in saved))
  if ('error' in saved) return
  const record: BookingRecord = saved.record
  assert.equal(record.status, 'pending')
  assert.equal(record.organisation_id, '11111111-1111-4111-8111-111111111111')
  assert.equal(record.pastor_id, draft().pastorId)
  assert.equal(record.visitor_name, 'Miriam Oduro')
  assert.match(record.notes ?? '', /Membership: Main Campus/)
  assert.equal(record.booking_reference.length, 12)
})

test('the same pastor and time cannot be booked twice', () => {
  const first = addBooking([], draft())
  assert.ok(!('error' in first))
  if ('error' in first) return
  const second = addBooking(first.records, draft())
  assert.deepEqual(second, { error: 'taken' })
  assert.equal(countBookings(first.records).pending, 1)
  assert.equal(countBookings(first.records, 'd2222222-2222-4222-8222-222222222222').total, 0)
})
