import { useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import type { StaffAccount } from './auth'
import { loadAccount } from './churchApi'
import { auth } from './firebaseApp'
import { isOrganisationId } from './signup'

const OPEN_ORG_KEY = 'etopade.openOrg'

export function openOrganisation(orgId: string) {
  if (!isOrganisationId(orgId)) return
  sessionStorage.setItem(OPEN_ORG_KEY, orgId)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function reloadStaffSession() {
  window.dispatchEvent(new Event('etopade-session'))
}

export function organisationFor(account: StaffAccount | null, search: string) {
  if (account?.role === 'super_admin') {
    try {
      const chosen = sessionStorage.getItem(OPEN_ORG_KEY)
      if (chosen && isOrganisationId(chosen)) return chosen
    } catch {
      // Private browsing can block storage. The home church still opens.
    }
    return account.organisationId
  }
  if (account) return account.organisationId
  const requested = new URLSearchParams(search).get('org')
  if (requested && isOrganisationId(requested)) return requested
  return 'grace'
}

export function useStaffSession() {
  const [ready, setReady] = useState(false)
  const [account, setAccount] = useState<StaffAccount | null>(null)
  const [search, setSearch] = useState(() => window.location.search)
  const [opened, setOpened] = useState(0)

  useEffect(() => {
    const sync = () => {
      setSearch(window.location.search)
      setOpened((value) => value + 1)
    }
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  useEffect(() => {
    let generation = 0
    const apply = (user: User | null) => {
      const ticket = ++generation
      if (!user) {
        setAccount(null)
        setReady(true)
        return
      }
      loadAccount(user)
        .then((next) => {
          if (ticket !== generation) return
          setAccount(next)
          setReady(true)
        })
        .catch(() => {
          if (ticket !== generation) return
          setAccount(null)
          setReady(true)
        })
    }
    const unsub = onAuthStateChanged(auth, apply)
    const onReload = () => apply(auth.currentUser)
    window.addEventListener('etopade-session', onReload)
    return () => {
      generation += 1
      unsub()
      window.removeEventListener('etopade-session', onReload)
    }
  }, [])

  const organisationId = useMemo(() => organisationFor(account, search), [account, search, opened])
  return { ready, account, organisationId }
}
