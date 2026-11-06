import assert from 'node:assert/strict'
import { test } from 'node:test'
import { staffEmailKey, validateStaffInvite } from './staff.ts'

test('a church administrator invite needs a name, email, role, and password', () => {
  assert.equal(staffEmailKey('  Pastor@Grace.Example '), 'pastor@grace.example')
  const errors = validateStaffInvite({ name: 'A', email: 'not-an-email', role: 'pastor', password: 'short' })
  assert.equal(errors.name, 'Enter the person’s name.')
  assert.equal(errors.email, 'Enter a valid email address.')
  assert.equal(errors.password, 'Use at least 6 characters.')
  assert.deepEqual(
    validateStaffInvite({ name: 'Grace Mensah', email: 'grace.mensah@grace.example', role: 'church_admin', password: 'church-pass' }),
    {},
  )
})
