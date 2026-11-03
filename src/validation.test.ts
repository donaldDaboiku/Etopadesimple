import assert from 'node:assert/strict'
import { test } from 'node:test'
import { emptyBooking, slotKey, validateBooking, validateSignIn } from './validation.ts'

const now = new Date(2026, 10, 3, 8, 0, 0)

function validDraft() {
  return {
    ...emptyBooking(),
    date: '2026-11-11',
    slot: '09:00',
    fullName: 'Miriam Oduro',
    email: 'miriam@example.com',
    phone: '+233 20 000 0000',
    notes: 'Family counselling and prayer support.',
  }
}

test('accepts a complete future booking', () => {
  assert.deepEqual(validateBooking(validDraft(), now), {})
})

test('rejects missing visitor details and a past date', () => {
  const errors = validateBooking({ ...validDraft(), fullName: ' ', email: 'not-an-email', date: '2026-11-02' }, now)
  assert.equal(errors.fullName, 'Enter the visitor’s full name.')
  assert.equal(errors.email, 'Enter a valid email address.')
  assert.match(errors.slot ?? '', /at least 30 minutes/)
})

test('requires a phone number for WhatsApp and SMS', () => {
  const errors = validateBooking({ ...validDraft(), contactMethod: 'sms', phone: '' }, now)
  assert.equal(errors.phone, 'Enter a phone number for this contact method.')
})

test('rejects a slot inside the notice window and a date past the booking window', () => {
  const soon = validateBooking({ ...validDraft(), date: '2026-11-03', slot: '09:00' }, new Date(2026, 10, 3, 8, 50, 0))
  assert.match(soon.slot ?? '', /at least 30 minutes/)

  const distant = validateBooking({ ...validDraft(), date: '2027-03-03' }, now)
  assert.match(distant.date ?? '', /90 days/)
})

test('rejects a slot already requested for the same pastor', () => {
  const draft = validDraft()
  const errors = validateBooking(draft, now, [slotKey(draft.pastorId, draft.date, draft.slot)])
  assert.equal(errors.slot, 'That time is already requested for this pastor.')
})

test('sign-in checks email and password shape', () => {
  assert.deepEqual(validateSignIn('pastor@grace.example', 'correct-horse'), {})
  const errors = validateSignIn('pastor', 'short')
  assert.ok(errors.email)
  assert.ok(errors.password)
})
