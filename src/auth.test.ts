import assert from 'node:assert/strict'
import { test } from 'node:test'
import { LOCAL_STAFF_PASSWORD, authenticate, reportView } from './auth.ts'

test('staff sign-in returns the role stored for that email', () => {
  const pastor = authenticate('james.adebayo@grace.example', LOCAL_STAFF_PASSWORD)
  const secretary = authenticate('ama.mensah@grace.example', LOCAL_STAFF_PASSWORD)
  assert.equal(pastor?.role, 'pastor')
  assert.equal(secretary?.role, 'secretary')
  assert.equal(authenticate('james.adebayo@grace.example', 'wrong-password'), null)
  assert.equal(authenticate('visitor@example.com', LOCAL_STAFF_PASSWORD), null)
})

test('reports follow the signed-in role', () => {
  assert.equal(reportView('pastor'), 'own')
  assert.equal(reportView('assistant_pastor'), 'own')
  assert.equal(reportView('secretary'), 'church')
  assert.equal(reportView('church_admin'), 'church')
  assert.equal(reportView('visitor'), null)
  assert.equal(reportView(null), null)
})
