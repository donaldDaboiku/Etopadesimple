import assert from 'node:assert/strict'
import { test } from 'node:test'
import { noticeDocumentId, noticeText, unseenIds } from './notices.ts'

test('a notification names the visitor and the time', () => {
  assert.equal(noticeText('requested', 'Miriam Oduro', '2026-12-01', '09:00'), 'Miriam Oduro requested 2026-12-01 at 09:00.')
  assert.equal(noticeText('confirmed', 'Miriam Oduro', '2026-12-01', '09:00'), 'Miriam Oduro on 2026-12-01 at 09:00 was confirmed.')
  assert.equal(noticeText('declined', 'Miriam Oduro', '2026-12-01', '10:15'), 'Miriam Oduro on 2026-12-01 at 10:15 was declined.')
})

test('each booking event has one document id', () => {
  assert.equal(noticeDocumentId('booking-1', 'pastor', 'requested'), 'booking-1_pastor_requested')
  assert.equal(noticeDocumentId('booking-1', 'office', 'confirmed'), 'booking-1_office_confirmed')
})

test('dismissed notifications stay hidden', () => {
  assert.deepEqual(unseenIds(['a', 'b', 'c'], ['b']), ['a', 'c'])
})
