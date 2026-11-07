import { lazy, Suspense, useEffect, useState } from 'react'
import './App.css'
import { AppLink } from './AppLink'
import { visitorBooking } from './auth'
import { initials } from './format'
import { MissingPage } from './pages/MissingPage'
import { OverviewPage } from './pages/OverviewPage'
import { pageTitle } from './route'
import { signOutStaff } from './firebaseApp'
import { navigate, usePath } from './usePath'
import { useStaffSession } from './useStaffSession'

const BookingPage = lazy(() => import('./pages/BookingPage').then((module) => ({ default: module.BookingPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })))
const PastorsPage = lazy(() => import('./pages/PastorsPage').then((module) => ({ default: module.PastorsPage })))
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((module) => ({ default: module.ReportsPage })))
const AdminPage = lazy(() => import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })))

const pages = {
  '/': OverviewPage,
  '/booking': BookingPage,
  '/pastors': PastorsPage,
  '/reports': ReportsPage,
  '/dashboard': DashboardPage,
  '/admin': AdminPage,
  '/login': LoginPage,
}

function App() {
  const path = usePath()
  const { ready, account } = useStaffSession()
  const [signOutError, setSignOutError] = useState('')
  const [menuPath, setMenuPath] = useState<string | null>(null)
  const menuOpen = menuPath === path
  const Page = pages[path as keyof typeof pages]
  const showDashboard = path !== '/login' && Boolean(account)

  async function logOut() {
    setSignOutError('')
    try {
      await signOutStaff()
    } catch {
      setSignOutError('Sign-out did not finish. You are still signed in.')
      return
    }
    if (path === '/reports' || path === '/dashboard' || path === '/admin') navigate('/')
  }

  useEffect(() => {
    const title = pageTitle(path)
    document.title = title === 'Overview' ? 'ETOPADE' : `${title} · ETOPADE`
    window.scrollTo(0, 0)
  }, [path])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <AppLink className="brand" to="/">
          <img className="brand-mark" src="/logo.png" alt="ETOPADE" width={42} height={42} />
          <span className="brand-copy">
            <span>ETOPADE</span>
            <small>Pastoral appointment system</small>
          </span>
        </AppLink>

        <button
          type="button"
          className="secondary-button btn-sm menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="main-menu"
          onClick={() => setMenuPath(menuOpen ? null : path)}
        >
          {menuOpen ? 'Close' : 'Menu'}
        </button>

        <nav id="main-menu" className={menuOpen ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation">
          <AppLink to="/">Overview</AppLink>
          {visitorBooking(account?.role) ? <AppLink to="/booking">Booking</AppLink> : null}
          <AppLink to="/pastors">Pastors</AppLink>
          {showDashboard ? <AppLink to="/dashboard">Dashboard</AppLink> : null}
        </nav>

        {ready && account ? (
          <div className="session-box">
            <span className="avatar" aria-hidden="true">
              {initials(account.name)}
            </span>
            <span className="session-name" title={account.name}>
              {account.name}
            </span>
            <button type="button" className="secondary-button btn-sm" onClick={() => void logOut()}>
              Log out
            </button>
          </div>
        ) : (
          <AppLink className="primary-button btn-sm staff-login" to="/login">
            Staff log in
          </AppLink>
        )}
      </header>
      {signOutError ? (
        <p className="form-banner error sign-out-error" role="alert">
          {signOutError}
        </p>
      ) : null}

      <main id="main" className="page" tabIndex={-1}>
        <Suspense fallback={<p className="auth-copy">Loading...</p>}>
          {Page ? <Page /> : <MissingPage />}
        </Suspense>
      </main>
      <footer className="site-footer">
        <span>© 2026 ETOPADE</span>
        <span>
          Built by{' '}
          <a href="https://gitsystemng.com" target="_blank" rel="noopener noreferrer">
            gitsystemng.com
          </a>
        </span>
      </footer>
    </div>
  )
}

export default App
