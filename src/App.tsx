import { useEffect, useState } from 'react'
import './App.css'
import { AppLink } from './AppLink'
import { BookingPage } from './pages/BookingPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { MissingPage } from './pages/MissingPage'
import { OverviewPage } from './pages/OverviewPage'
import { PastorsPage } from './pages/PastorsPage'
import { ReportsPage } from './pages/ReportsPage'
import { AdminPage } from './pages/AdminPage'
import { visitorBooking } from './auth'
import { pageTitle } from './route'
import { signOutStaff } from './firebaseApp'
import { usePath, navigate } from './usePath'
import { useStaffSession } from './useStaffSession'

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
      <header className="topbar">
        <AppLink className="brand" to="/" >
          <span className="brand-mark">E</span>
          <span className="brand-copy">
            <span>ETOPADE</span>
            <small>Pastoral appointment system</small>
          </span>
        </AppLink>

        <nav className="main-nav" aria-label="Main navigation">
          <AppLink to="/">Overview</AppLink>
          {visitorBooking(account?.role) ? <AppLink to="/booking">Booking</AppLink> : null}
          <AppLink to="/pastors">Pastors</AppLink>
          {showDashboard ? <AppLink to="/dashboard">Dashboard</AppLink> : null}
        </nav>

        {ready && account ? (
          <div className="session-box">
            <span>{account.name}</span>
            <button
              type="button"
              className="secondary-button"
              onClick={() => void logOut()}
            >
              Log out
            </button>
          </div>
        ) : (
          <AppLink className="primary-button" to="/login">
            Log in
          </AppLink>
        )}
      </header>
      {signOutError ? (
        <p className="form-banner error sign-out-error" role="alert">
          {signOutError}
        </p>
      ) : null}

      <main className="page">{Page ? <Page /> : <MissingPage />}</main>
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
