export const staffRoles = ['super_admin', 'church_admin', 'pastor', 'assistant_pastor', 'secretary', 'read_only_staff'] as const

export type StaffRole = (typeof staffRoles)[number]

export type StaffAccount = {
  email: string
  name: string
  role: StaffRole
  pastorId: string | null
  organisationId: string
}

export const roleLabels: Record<StaffRole, string> = {
  super_admin: 'Super admin',
  church_admin: 'Church admin',
  pastor: 'Pastor',
  assistant_pastor: 'Assistant pastor',
  secretary: 'Secretary',
  read_only_staff: 'Read-only staff',
}

export function isStaffRole(role: string | null | undefined): role is StaffRole {
  return staffRoles.includes(role as StaffRole)
}

export function isChurchAdmin(role: string | null | undefined) {
  return role === 'church_admin' || role === 'super_admin'
}

export function pastorDashboard(role: string | null | undefined) {
  return role === 'pastor' || role === 'assistant_pastor'
}

export function visitorBooking(role: string | null | undefined) {
  return role !== 'secretary'
}

export function reportView(role: string | null | undefined): 'own' | 'church' | null {
  if (role === 'pastor' || role === 'assistant_pastor') return 'own'
  if (role === 'secretary' || role === 'church_admin' || role === 'super_admin') return 'church'
  return null
}

