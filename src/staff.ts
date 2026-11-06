const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type StaffInvite = {
  name: string
  email: string
  role: 'pastor' | 'secretary' | 'church_admin'
  password: string
}

export type StaffInviteErrors = Partial<Record<'name' | 'email' | 'role' | 'password', string>>

export function staffEmailKey(email: string) {
  return email.trim().toLowerCase()
}

export function validateStaffInvite(invite: StaffInvite): StaffInviteErrors {
  const errors: StaffInviteErrors = {}
  const name = invite.name.trim()
  const email = staffEmailKey(invite.email)
  if (name.length < 2 || name.length > 120) errors.name = 'Enter the person’s name.'
  if (!emailPattern.test(email) || email.length > 254) errors.email = 'Enter a valid email address.'
  if (invite.role !== 'pastor' && invite.role !== 'secretary' && invite.role !== 'church_admin') {
    errors.role = 'Choose pastor, secretary, or church admin.'
  }
  if (invite.password.trim().length < 6) errors.password = 'Use at least 6 characters.'
  return errors
}
