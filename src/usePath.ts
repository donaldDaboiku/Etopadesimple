import { useEffect, useState } from 'react'
import { normalizePath } from './route'

export function usePath() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname))

  useEffect(() => {
    const sync = () => setPath(normalizePath(window.location.pathname))
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  return path
}

export function navigate(to: string) {
  const next = normalizePath(to)
  const current = `${window.location.pathname}${window.location.search}`
  if (current === next) return
  window.history.pushState({}, '', next)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
