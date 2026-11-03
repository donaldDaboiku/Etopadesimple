import { useEffect, useState } from 'react'
import { readStaffSession, type StaffSession } from './staffSession'

export function useStaffSession() {
  const [session, setSession] = useState<StaffSession | null>(readStaffSession)

  useEffect(() => {
    const sync = () => setSession(readStaffSession())
    window.addEventListener('etopade-staff', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('etopade-staff', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return session
}
