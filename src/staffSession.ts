export type StaffRole = 'pastor' | 'secretary'

export type StaffSession = {
  email: string
  role: StaffRole
}

const KEY = 'etopade.staff.session'

export function isReportRole(role: string | null | undefined): role is StaffRole {
  return role === 'pastor' || role === 'secretary'
}

export function readStaffSession(): StaffSession | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StaffSession>
    if (typeof parsed.email !== 'string' || !isReportRole(parsed.role)) return null
    return { email: parsed.email, role: parsed.role }
  } catch {
    return null
  }
}

export function writeStaffSession(session: StaffSession) {
  sessionStorage.setItem(KEY, JSON.stringify(session))
  window.dispatchEvent(new Event('etopade-staff'))
}

export function clearStaffSession() {
  sessionStorage.removeItem(KEY)
  window.dispatchEvent(new Event('etopade-staff'))
}
