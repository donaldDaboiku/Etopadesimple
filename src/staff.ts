const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type StaffInvite = {
  name: string
  email: string
  role: 'pastor' | 'secretary'
}

export type StaffInviteErrors = Partial<Record<'name' | 'email' | 'role', string>>

export function staffEmailKey(email: string) {
  return email.trim().toLowerCase()
}

export function validateStaffInvite(invite: StaffInvite): StaffInviteErrors {
  const errors: StaffInviteErrors = {}
  const name = invite.name.trim()
  const email = staffEmailKey(invite.email)
  if (name.length < 2 || name.length > 120) errors.name = 'Enter the person’s name.'
  if (!emailPattern.test(email) || email.length > 254) errors.email = 'Enter a valid Gmail address.'
  if (invite.role !== 'pastor' && invite.role !== 'secretary') errors.role = 'Choose pastor or secretary.'
  return errors
}
