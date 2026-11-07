import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatLongDate, formatTime, initials } from './format.ts'

test('formatTime renders a 12-hour clock', () => {
  assert.equal(formatTime('13:30'), '1:30 PM')
  assert.equal(formatTime('09:00'), '9:00 AM')
  assert.equal(formatTime('00:05'), '12:05 AM')
  assert.equal(formatTime('12:00'), '12:00 PM')
  assert.equal(formatTime('15:45'), '3:45 PM')
})

test('formatLongDate spells a calendar date', () => {
  assert.equal(formatLongDate('2026-11-09'), 'Monday, 9 November 2026')
})

test('initials skip a pastoral title and use the first and last name', () => {
  assert.equal(initials('Pastor James Adebayo'), 'JA')
  assert.equal(initials('Pst Esther Moyo'), 'EM')
  assert.equal(initials('Rev. Daniel Okafor'), 'DO')
  assert.equal(initials('Reverend Adaeze Nwosu'), 'AN')
})
