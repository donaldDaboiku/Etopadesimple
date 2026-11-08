import assert from 'node:assert/strict'
import { test } from 'node:test'
import { headerLinks, normalizePath, pageTitle, signedInDestination } from './route.ts'

test('each address has its own page title', () => {
  assert.equal(pageTitle('/'), 'Overview')
  assert.equal(pageTitle('/booking/'), 'Booking')
  assert.equal(pageTitle('/pastors'), 'Pastors')
  assert.equal(pageTitle('/reports'), 'Reports')
  assert.equal(pageTitle('/dashboard'), 'Dashboard')
  assert.equal(pageTitle('/requests'), 'Requests')
  assert.equal(pageTitle('/settings'), 'Settings')
  assert.equal(pageTitle('/admin'), 'Admin')
  assert.equal(pageTitle('/login'), 'Log in')
  assert.equal(pageTitle('/signup'), 'Register your church')
  assert.equal(pageTitle('/booking?pastor=d1111111-1111-4111-8111-111111111111'), 'Booking')
  assert.equal(pageTitle('/somewhere-else'), 'Page not found')
  assert.equal(normalizePath('/reports/'), '/reports')
})

test('the header follows who is signed in', () => {
  assert.deepEqual(
    headerLinks(null).map((link) => link.label),
    ['Overview', 'Booking', 'Pastors'],
  )
  assert.deepEqual(
    headerLinks('pastor').map((link) => link.label),
    ['Dashboard', 'Requests', 'Settings'],
  )
  assert.deepEqual(
    headerLinks('assistant_pastor').map((link) => link.href),
    ['/dashboard', '/requests', '/settings'],
  )
  assert.deepEqual(
    headerLinks('secretary').map((link) => link.label),
    ['Dashboard'],
  )
  assert.equal(headerLinks('secretary').some((link) => link.href === '/booking'), false)
  assert.equal(headerLinks('pastor').some((link) => link.href === '/admin'), false)
  assert.deepEqual(
    headerLinks('church_admin').map((link) => link.label),
    ['Dashboard', 'Admin'],
  )
  assert.deepEqual(
    headerLinks('super_admin').map((link) => link.label),
    ['Dashboard', 'Admin'],
  )
  assert.equal(headerLinks('pastor').some((link) => link.label === 'Overview'), false)
})

test('a signed-in visit opens the page for that role', () => {
  assert.equal(signedInDestination(null, '/booking'), null)
  assert.equal(signedInDestination('pastor', '/booking'), '/requests')
  assert.equal(signedInDestination('pastor', '/booking?pastor=1'), '/requests')
  assert.equal(signedInDestination('assistant_pastor', '/'), '/dashboard')
  assert.equal(signedInDestination('pastor', '/pastors'), '/dashboard')
  assert.equal(signedInDestination('pastor', '/admin'), '/dashboard')
  assert.equal(signedInDestination('pastor', '/requests'), null)
  assert.equal(signedInDestination('pastor', '/settings'), null)
  assert.equal(signedInDestination('pastor', '/no-such-page'), null)
  assert.equal(signedInDestination('secretary', '/booking'), null)
  assert.equal(signedInDestination('secretary', '/'), '/dashboard')
  assert.equal(signedInDestination('secretary', '/settings'), '/dashboard')
  assert.equal(signedInDestination('church_admin', '/booking'), '/dashboard')
  assert.equal(signedInDestination('church_admin', '/admin'), null)
  assert.equal(signedInDestination('super_admin', '/admin'), null)
  assert.equal(signedInDestination('pastor', '/login'), '/dashboard')
})
