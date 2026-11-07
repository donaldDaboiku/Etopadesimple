import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  canOpenChurch,
  churchSignupMember,
  isOrganisationId,
  newOrganisationId,
  validateChurchSignup,
} from './signup.ts'

const open = {
  orgAdminEmail: 'ada@hope.example',
  memberEmail: 'ada@hope.example',
  memberRole: 'church_admin',
  memberUid: 'uid-1',
  authEmail: 'ada@hope.example',
  authUid: 'uid-1',
  alreadyHasAdmin: false,
}

test('church signup checks the form and the first admin is never a super admin', () => {
  const errors = validateChurchSignup({
    churchName: 'A',
    adminName: 'B',
    email: 'not-an-email',
    password: 'short',
    confirmPassword: 'other-secret',
  })
  assert.equal(errors.churchName, 'Enter the church name.')
  assert.equal(errors.adminName, 'Enter your name.')
  assert.equal(errors.email, 'Enter a valid email address.')
  assert.equal(errors.password, 'Use at least 6 characters.')
  assert.equal(errors.confirmPassword, 'Those passwords do not match.')
  assert.equal(JSON.stringify(errors).includes('other-secret'), false)

  assert.deepEqual(
    validateChurchSignup({
      churchName: 'Hope Chapel',
      adminName: 'Ada Mensah',
      email: 'Ada@Hope.Example',
      password: 'chapel-pass',
      confirmPassword: 'chapel-pass',
    }),
    {},
  )

  const member = churchSignupMember({ name: 'Ada Mensah', email: 'Ada@Hope.Example', uid: 'uid-1' })
  assert.equal(member?.role, 'church_admin')
  assert.equal(member?.email, 'ada@hope.example')
  assert.equal(member?.uid, 'uid-1')
  assert.equal(churchSignupMember({ name: 'Ada Mensah', email: 'ada@hope.example', uid: 'uid-1', role: 'pastor' })?.role, 'church_admin')
  assert.equal(churchSignupMember({ name: 'Ada Mensah', email: 'ada@hope.example', uid: 'uid-1', role: 'super_admin' }), null)

  assert.equal(canOpenChurch(open), true)
  assert.equal(canOpenChurch({ ...open, memberRole: 'super_admin' }), false)
  assert.equal(canOpenChurch({ ...open, alreadyHasAdmin: true }), false)
  assert.equal(canOpenChurch({ ...open, memberEmail: 'other@hope.example' }), false)
  assert.equal(canOpenChurch({ ...open, memberUid: 'someone-else' }), false)

  const orgId = newOrganisationId('Grace Fellowship')
  assert.notEqual(orgId, 'grace')
  assert.equal(isOrganisationId(orgId), true)
  assert.notEqual(newOrganisationId('grace'), 'grace')
})
