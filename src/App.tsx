import { useEffect } from 'react'
import './App.css'
import { AppLink } from './AppLink'
import { BookingPage } from './pages/BookingPage'
import { LoginPage } from './pages/LoginPage'
import { MissingPage } from './pages/MissingPage'
import { OverviewPage } from './pages/OverviewPage'
import { PastorsPage } from './pages/PastorsPage'
import { ReportsPage } from './pages/ReportsPage'
import { pageTitle } from './route'
import { clearStaffSession, isReportRole } from './staffSession'
import { usePath, navigate } from './usePath'
import { useStaffSession } from './useStaffSession'

const pages = {
  '/': OverviewPage,
  '/booking': BookingPage,
  '/pastors': PastorsPage,
  '/reports': ReportsPage,
  '/login': LoginPage,
}

function App() {
  const path = usePath()
  const session = useStaffSession()
  const Page = pages[path as keyof typeof pages]
  const showReports = path !== '/login' && isReportRole(session?.role)

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
          <AppLink to="/booking">Booking</AppLink>
          <AppLink to="/pastors">Pastors</AppLink>
          {showReports ? <AppLink to="/reports">Reports</AppLink> : null}
        </nav>

        {session ? (
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              clearStaffSession()
              if (path === '/reports') navigate('/')
            }}
          >
            Log out
          </button>
        ) : (
          <AppLink className="primary-button" to="/login">
            Log in
          </AppLink>
        )}
      </header>

      <main className="page">{Page ? <Page /> : <MissingPage />}</main>
    </div>
  )
}

export default App
