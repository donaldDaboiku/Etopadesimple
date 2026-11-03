import { isStaffRole, type StaffRole } from './auth'

export type StaffSession = {
  email: string
  name: string
  role: StaffRole
}

const KEY = 'etopade.staff.session'

export function readStaffSession(): StaffSession | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StaffSession>
    if (typeof parsed.email !== 'string' || typeof parsed.name !== 'string' || !isStaffRole(parsed.role)) return null
    return { email: parsed.email, name: parsed.name, role: parsed.role }
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
