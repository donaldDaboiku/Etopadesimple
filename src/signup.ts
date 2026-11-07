import { staffEmailKey } from './staff.ts'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const organisationIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const GRACE_CHURCH_ID = 'grace'

export type ChurchSignup = {
  churchName: string
  adminName: string
  email: string
  password: string
  confirmPassword: string
}

export type ChurchSignupErrors = Partial<
  Record<'churchName' | 'adminName' | 'email' | 'password' | 'confirmPassword', string>
>

export function isOrganisationId(value: string) {
  return value.length >= 2 && value.length <= 64 && organisationIdPattern.test(value)
}

export function newOrganisationId(churchName: string) {
  const slug = churchName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '')
  const body = slug && slug !== GRACE_CHURCH_ID ? slug : 'church'
  return `${body}-${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`
}

export function validateChurchSignup(input: ChurchSignup): ChurchSignupErrors {
  const errors: ChurchSignupErrors = {}
  const churchName = input.churchName.trim()
  const adminName = input.adminName.trim()
  const email = staffEmailKey(input.email)
  if (churchName.length < 2 || churchName.length > 120) errors.churchName = 'Enter the church name.'
  if (adminName.length < 2 || adminName.length > 120) errors.adminName = 'Enter your name.'
  if (!emailPattern.test(email) || email.length > 254) errors.email = 'Enter a valid email address.'
  if (input.password.trim().length < 6) errors.password = 'Use at least 6 characters.'
  if (input.password !== input.confirmPassword) errors.confirmPassword = 'Those passwords do not match.'
  return errors
}

export function churchSignupMember(input: { name: string; email: string; uid: string; role?: string }) {
  if (input.role === 'super_admin' || !input.uid) return null
  return {
    email: staffEmailKey(input.email),
    name: input.name.trim(),
    role: 'church_admin' as const,
    pastorId: null,
    uid: input.uid,
    status: 'active' as const,
  }
}

export function canOpenChurch(input: {
  orgAdminEmail: string
  memberEmail: string
  memberRole: string
  memberUid: string
  authEmail: string
  authUid: string
  alreadyHasAdmin: boolean
}) {
  if (input.alreadyHasAdmin) return false
  if (input.memberRole !== 'church_admin') return false
  const admin = staffEmailKey(input.orgAdminEmail)
  const member = staffEmailKey(input.memberEmail)
  const auth = staffEmailKey(input.authEmail)
  if (!auth || admin !== auth || member !== auth) return false
  if (!input.authUid || input.memberUid !== input.authUid) return false
  return true
}
