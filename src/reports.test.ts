import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addBooking } from './bookings.ts'
import { auditDocumentId, auditText, pastorTallies, statusCounts } from './reports.ts'
import { emptyBooking } from './validation.ts'

function draft() {
  return {
    ...emptyBooking(),
    date: '2026-11-11',
    slot: '09:00',
    fullName: 'Miriam Oduro',
    email: 'miriam@example.com',
  }
}

test('a report counts each status and each pastor', () => {
  const james = addBooking([], draft(), new Date(2026, 10, 3, 8, 0, 0))
  assert.ok(!('error' in james))
  if ('error' in james) return
  const estherId = 'd2222222-2222-4222-8222-222222222222'
  const esther = addBooking(james.records, { ...draft(), pastorId: estherId, slot: '11:00' })
  assert.ok(!('error' in esther))
  if ('error' in esther) return
  const confirmed = esther.records.map((record) =>
    record.pastor_id === estherId ? { ...record, status: 'confirmed' as const } : record,
  )
  assert.deepEqual(statusCounts(confirmed), { pending: 1, confirmed: 1, declined: 0 })
  const tallies = pastorTallies(confirmed, [
    { id: estherId, name: 'Pastor Esther Moyo' },
    { id: draft().pastorId, name: 'Pastor James Adebayo' },
  ])
  assert.deepEqual(
    tallies.map((row) => row.name),
    ['Pastor Esther Moyo', 'Pastor James Adebayo'],
  )
  assert.equal(tallies[0]?.confirmed, 1)
  assert.equal(tallies[1]?.pending, 1)
})

test('an activity line names the action without a second document id', () => {
  const id = auditDocumentId('booking-1', 'confirmed')
  assert.equal(id, 'booking-1_confirmed')
  assert.equal(auditText('requested', 'visitor', 'Kwame Mensah', '013870CBDCAF'), 'A visitor requested Kwame Mensah (013870CBDCAF).')
  assert.equal(
    auditText('declined', 'james.adebayo@grace.example', 'Kwame Mensah', '013870CBDCAF'),
    'james.adebayo@grace.example declined Kwame Mensah (013870CBDCAF).',
  )
})
