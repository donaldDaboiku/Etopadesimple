import assert from 'node:assert/strict'
import { test } from 'node:test'
import { staffEmailKey, validateStaffInvite } from './staff.ts'

test('a church administrator invite needs a name, Gmail, and role', () => {
  assert.equal(staffEmailKey('  Pastor@Grace.Example '), 'pastor@grace.example')
  const errors = validateStaffInvite({ name: 'A', email: 'not-an-email', role: 'pastor' })
  assert.equal(errors.name, 'Enter the person’s name.')
  assert.equal(errors.email, 'Enter a valid Gmail address.')
  assert.deepEqual(validateStaffInvite({ name: 'Grace Mensah', email: 'grace.mensah@grace.example', role: 'secretary' }), {})
})
