import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import type { StaffAccount } from './auth'
import { loadAccount } from './churchApi'
import { auth } from './firebaseApp'

export function useStaffSession() {
  const [ready, setReady] = useState(false)
  const [account, setAccount] = useState<StaffAccount | null>(null)

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (!user) {
        setAccount(null)
        setReady(true)
        return
      }
      loadAccount(user)
        .then((next) => {
          setAccount(next)
          setReady(true)
        })
        .catch(() => {
          setAccount(null)
          setReady(true)
        })
    })
  }, [])

  return { ready, account }
}
