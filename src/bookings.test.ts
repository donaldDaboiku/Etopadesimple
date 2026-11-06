import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addBooking, bookingsVisibleTo, countBookings, decideBooking, type BookingRecord } from './bookings.ts'
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

test('a pastor sees only their own bookings', () => {
  const james = addBooking([], draft())
  assert.ok(!('error' in james))
  if ('error' in james) return
  const esther = addBooking(james.records, {
    ...draft(),
    pastorId: 'd2222222-2222-4222-8222-222222222222',
    slot: '11:00',
  })
  assert.ok(!('error' in esther))
  if ('error' in esther) return
  const jamesRows = bookingsVisibleTo(esther.records, 'pastor', draft().pastorId)
  const estherRows = bookingsVisibleTo(esther.records, 'pastor', 'd2222222-2222-4222-8222-222222222222')
  assert.equal(jamesRows.length, 1)
  assert.equal(jamesRows[0]?.visitor_name, 'Miriam Oduro')
  assert.equal(estherRows.length, 1)
  assert.equal(estherRows[0]?.pastor_id, 'd2222222-2222-4222-8222-222222222222')
  assert.equal(bookingsVisibleTo(esther.records, 'pastor', null).length, 0)
  assert.equal(bookingsVisibleTo(esther.records, 'secretary', null).length, 2)
  assert.equal(bookingsVisibleTo(esther.records, 'church_admin', null).length, 2)
  assert.equal(bookingsVisibleTo(esther.records, 'read_only_staff', null).length, 0)
})

test('a pastor confirms only their own pending request', () => {
  const james = addBooking([], draft())
  assert.ok(!('error' in james))
  if ('error' in james) return
  const estherId = 'd2222222-2222-4222-8222-222222222222'
  const blocked = decideBooking(james.records, james.record.id, estherId, 'confirmed')
  assert.deepEqual(blocked, { error: 'forbidden' })
  const confirmed = decideBooking(james.records, james.record.id, draft().pastorId, 'confirmed')
  assert.ok(!('error' in confirmed))
  if ('error' in confirmed) return
  assert.equal(confirmed.records[0]?.status, 'confirmed')
  const again = addBooking(confirmed.records, draft())
  assert.deepEqual(again, { error: 'taken' })
  const declined = decideBooking(james.records, james.record.id, draft().pastorId, 'declined')
  assert.ok(!('error' in declined))
  if ('error' in declined) return
  const reopened = addBooking(declined.records, draft())
  assert.ok(!('error' in reopened))
})
