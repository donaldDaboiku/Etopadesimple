import assert from 'node:assert/strict'
import { test } from 'node:test'
import { normalizePath, pageTitle } from './route.ts'

test('each address has its own page title', () => {
  assert.equal(pageTitle('/'), 'Overview')
  assert.equal(pageTitle('/booking/'), 'Booking')
  assert.equal(pageTitle('/pastors'), 'Pastors')
  assert.equal(pageTitle('/reports'), 'Reports')
  assert.equal(pageTitle('/dashboard'), 'Dashboard')
  assert.equal(pageTitle('/admin'), 'Admin')
  assert.equal(pageTitle('/login'), 'Log in')
  assert.equal(pageTitle('/booking?pastor=d1111111-1111-4111-8111-111111111111'), 'Booking')
  assert.equal(pageTitle('/somewhere-else'), 'Page not found')
  assert.equal(normalizePath('/reports/'), '/reports')
})
