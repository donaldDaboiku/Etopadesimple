import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isChurchAdmin, pastorDashboard, reportView, visitorBooking } from './auth.ts'

test('reports and dashboards follow the signed-in role', () => {
  assert.equal(reportView('pastor'), 'own')
  assert.equal(reportView('assistant_pastor'), 'own')
  assert.equal(reportView('secretary'), 'church')
  assert.equal(reportView('church_admin'), 'church')
  assert.equal(reportView('super_admin'), 'church')
  assert.equal(reportView('read_only_staff'), null)
  assert.equal(reportView('visitor'), null)
  assert.equal(reportView(null), null)
  assert.equal(pastorDashboard('pastor'), true)
  assert.equal(pastorDashboard('assistant_pastor'), true)
  assert.equal(pastorDashboard('secretary'), false)
  assert.equal(visitorBooking(null), true)
  assert.equal(visitorBooking('secretary'), true)
  assert.equal(visitorBooking('pastor'), false)
  assert.equal(visitorBooking('assistant_pastor'), false)
  assert.equal(visitorBooking('church_admin'), false)
  assert.equal(visitorBooking('super_admin'), false)
  assert.equal(isChurchAdmin('church_admin'), true)
  assert.equal(isChurchAdmin('pastor'), false)
  assert.equal(isChurchAdmin('secretary'), false)
})
