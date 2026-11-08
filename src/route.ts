const titles: Record<string, string> = {
  '/': 'Overview',
  '/booking': 'Booking',
  '/pastors': 'Pastors',
  '/reports': 'Reports',
  '/dashboard': 'Dashboard',
  '/requests': 'Requests',
  '/settings': 'Settings',
  '/admin': 'Admin',
  '/login': 'Log in',
  '/signup': 'Register your church',
}

const knownPaths = new Set(Object.keys(titles))

const rolePaths: Record<string, readonly string[]> = {
  pastor: ['/dashboard', '/requests', '/settings', '/reports'],
  assistant_pastor: ['/dashboard', '/requests', '/settings', '/reports'],
  secretary: ['/dashboard', '/booking', '/reports'],
  church_admin: ['/dashboard', '/admin', '/reports'],
  super_admin: ['/dashboard', '/admin', '/reports'],
  read_only_staff: ['/dashboard'],
}

export type HeaderLink = { href: string; label: string }

export function headerLinks(role: string | null | undefined): HeaderLink[] {
  if (role === 'pastor' || role === 'assistant_pastor') {
    return [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/requests', label: 'Requests' },
      { href: '/settings', label: 'Settings' },
    ]
  }
  if (role === 'secretary') return [{ href: '/dashboard', label: 'Dashboard' }]
  if (role === 'church_admin' || role === 'super_admin') {
    return [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/admin', label: 'Admin' },
    ]
  }
  if (role) return [{ href: '/dashboard', label: 'Dashboard' }]
  return [
    { href: '/', label: 'Overview' },
    { href: '/booking', label: 'Booking' },
    { href: '/pastors', label: 'Pastors' },
  ]
}

export function signedInDestination(role: string | null | undefined, path: string) {
  if (!role) return null
  const key = normalizePath(path).split('?')[0]
  if (!knownPaths.has(key)) return null
  const allowed = rolePaths[role] ?? ['/dashboard']
  if (allowed.includes(key)) return null
  if ((role === 'pastor' || role === 'assistant_pastor') && key === '/booking') return '/requests'
  return '/dashboard'
}

export function normalizePath(path: string) {
  const [pathname, search] = path.split('?')
  const clean = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  return search ? `${clean}?${search}` : clean
}

export function pageTitle(path: string) {
  const key = normalizePath(path).split('?')[0]
  return titles[key] ?? 'Page not found'
}
