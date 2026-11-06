export const SUPER_ADMIN = {
  email: 'superadmin@etopade.local',
  password: 'etopade-admin',
  name: 'Super admin',
}

export function isSuperAdminEmail(email: string) {
  return email.trim().toLowerCase() === SUPER_ADMIN.email
}
