const titles: Record<string, string> = {
  '/': 'Overview',
  '/booking': 'Booking',
  '/pastors': 'Pastors',
  '/reports': 'Reports',
  '/dashboard': 'Dashboard',
  '/admin': 'Admin',
  '/login': 'Log in',
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
