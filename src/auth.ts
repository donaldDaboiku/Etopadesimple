export const staffRoles = ['super_admin', 'church_admin', 'pastor', 'assistant_pastor', 'secretary', 'read_only_staff'] as const

export type StaffRole = (typeof staffRoles)[number]

export type StaffAccount = {
  email: string
  name: string
  role: StaffRole
  profileId: string
}

export const roleLabels: Record<StaffRole, string> = {
  super_admin: 'Super admin',
  church_admin: 'Church admin',
  pastor: 'Pastor',
  assistant_pastor: 'Assistant pastor',
  secretary: 'Secretary',
  read_only_staff: 'Read-only staff',
}

// ponytail: one shared local password until Supabase Auth replaces authenticate().
export const LOCAL_STAFF_PASSWORD = 'etopade-demo'

export const staffDirectory: StaffAccount[] = [
  {
    email: 'james.adebayo@grace.example',
    name: 'Pastor James Adebayo',
    role: 'pastor',
    profileId: 'c1111111-1111-4111-8111-111111111111',
  },
  {
    email: 'esther.moyo@grace.example',
    name: 'Pastor Esther Moyo',
    role: 'pastor',
    profileId: 'c2222222-2222-4222-8222-222222222222',
  },
  {
    email: 'daniel.okafor@grace.example',
    name: 'Pastor Daniel Okafor',
    role: 'pastor',
    profileId: 'c3333333-3333-4333-8333-333333333333',
  },
  {
    email: 'ama.mensah@grace.example',
    name: 'Ama Mensah',
    role: 'secretary',
    profileId: 'c4444444-4444-4444-8444-444444444444',
  },
  {
    email: 'ruth.owusu@grace.example',
    name: 'Ruth Owusu',
    role: 'church_admin',
    profileId: 'c5555555-5555-4555-8555-555555555555',
  },
]

export function isStaffRole(role: string | null | undefined): role is StaffRole {
  return staffRoles.includes(role as StaffRole)
}

export function reportView(role: string | null | undefined): 'own' | 'church' | null {
  if (role === 'pastor' || role === 'assistant_pastor') return 'own'
  if (role === 'secretary' || role === 'church_admin' || role === 'super_admin' || role === 'read_only_staff') return 'church'
  return null
}

export function authenticate(email: string, password: string): StaffAccount | null {
  const account = staffDirectory.find((item) => item.email === email.trim().toLowerCase())
  if (!account || password !== LOCAL_STAFF_PASSWORD) return null
  return account
}
