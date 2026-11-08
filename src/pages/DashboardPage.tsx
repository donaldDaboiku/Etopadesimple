import { useEffect, useState } from 'react'
import { isChurchAdmin, pastorDashboard } from '../auth'
import { AppointmentList } from '../AppointmentList'
import { AppLink } from '../AppLink'
import { WEEKDAY_LABELS, type WeekSchedule } from '../availability'
import type { BookingRecord } from '../bookings'
import { decideRemote, listBookings, listPastors, listSchedules } from '../churchApi'
import { formatTime } from '../format'
import { NoticeList } from '../NoticeList'
import { ReportsPage } from './ReportsPage'
import { useStaffSession } from '../useStaffSession'

function PastorHome({ organisationId, pastorId, name }: { organisationId: string; pastorId: string; name: string }) {
  const [records, setRecords] = useState<BookingRecord[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    listBookings(organisationId, pastorId)
      .then(setRecords)
      .catch(() => setError('Appointments could not be loaded.'))
  }, [organisationId, pastorId])

  const pending = records.filter((record) => record.status === 'pending').length
  const confirmed = records.filter((record) => record.status === 'confirmed').length
  const declined = records.filter((record) => record.status === 'declined').length

  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Your appointments</p>
        <h1>{name}</h1>
        <p className="auth-copy">Totals for requests booked with you. Open Requests to confirm or decline one.</p>
      </header>
      {error ? (
        <p className="form-banner error" role="alert">
          {error}
        </p>
      ) : null}
      <section className="stats-grid" aria-label="Your appointment totals">
        <article className="stat-card gold">
          <span>Needs your reply</span>
          <strong>{pending}</strong>
        </article>
        <article className="stat-card green">
          <span>Confirmed</span>
          <strong>{confirmed}</strong>
        </article>
        <article className="stat-card rose">
          <span>Declined</span>
          <strong>{declined}</strong>
        </article>
      </section>
      <NoticeList organisationId={organisationId} pastorId={pastorId} />
    </>
  )
}

function SecretaryHome({ organisationId }: { organisationId: string }) {
  const [records, setRecords] = useState<BookingRecord[]>([])
  const [pastors, setPastors] = useState<{ id: string; name: string }[]>([])
  const [schedules, setSchedules] = useState<Record<string, WeekSchedule>>({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    Promise.all([listBookings(organisationId, null), listPastors(organisationId), listSchedules(organisationId)])
      .then(([rows, names, hours]) => {
        setRecords(rows)
        setPastors(names)
        setSchedules(hours)
      })
      .catch(() => setError('Appointments could not be loaded.'))
  }, [organisationId])

  async function decide(bookingId: string, status: 'confirmed' | 'declined') {
    setNotice('')
    await decideRemote(organisationId, bookingId, status)
    setRecords(await listBookings(organisationId, null))
    setNotice(status === 'confirmed' ? 'Request approved.' : 'Request declined.')
  }

  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Church office</p>
        <h1>Dashboard</h1>
        <p className="auth-copy">Every pastor’s requests. Approve or decline them, check who is free, and read reminders.</p>
      </header>
      {error ? (
        <p className="form-banner error" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="form-banner success" role="status">
          {notice}
        </p>
      ) : null}
      <NoticeList organisationId={organisationId} pastorId={null} title="Reminders" />
      <AppointmentList records={records} onDecide={decide} confirmLabel="Approve" pastorNames={pastors} />
      <section className="card report-list">
        <h2>Time available</h2>
        {pastors.length === 0 ? (
          <p className="auth-copy">No pastors are listed yet.</p>
        ) : (
          <ul className="data-list">
            {pastors.map((pastor) => {
              const schedule = schedules[pastor.id]
              const days = schedule ? schedule.weekdays.map((day) => WEEKDAY_LABELS[day]).join(', ') : ''
              const times = schedule ? schedule.slots.map((slot) => formatTime(slot)).join(', ') : ''
              return (
                <li key={pastor.id}>
                  <div className="data-main">
                    <strong>{pastor.name}</strong>
                    <span>
                      {schedule
                        ? `${days} · ${times}`
                        : 'No custom hours saved. Visitors can request any catalog time.'}
                    </span>
                    {schedule && schedule.blockedDates.length > 0 ? <span>Closed: {schedule.blockedDates.join(', ')}</span> : null}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </>
  )
}

export function DashboardPage() {
  const { ready, account, organisationId } = useStaffSession()

  if (!ready) return <p className="auth-copy">Checking sign-in...</p>
  if (!account) {
    return (
      <section className="card login-card">
        <p className="eyebrow">Staff only</p>
        <h1>Dashboard</h1>
        <p className="auth-copy">Sign in to open the work for your role.</p>
        <AppLink className="primary-button" to="/login">
          Log in
        </AppLink>
      </section>
    )
  }
  if (isChurchAdmin(account.role)) return <ReportsPage />
  if (account.role === 'secretary') return <SecretaryHome organisationId={organisationId} />
  if (!pastorDashboard(account.role) || !account.pastorId) {
    return (
      <section className="card login-card">
        <p className="eyebrow">Signed in</p>
        <h1>{account.name}</h1>
        <p className="auth-copy">This account can sign in. Appointment records open for a pastor, a secretary, or a church administrator.</p>
      </section>
    )
  }

  return <PastorHome organisationId={organisationId} pastorId={account.pastorId} name={account.name} />
}
