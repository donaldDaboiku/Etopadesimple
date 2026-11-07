import { useEffect, useState } from 'react'
import { reportView, roleLabels } from '../auth'
import { bookingsVisibleTo, countBookings, describeBooking, type BookingRecord } from '../bookings'
import { listAudits, listBookings, listPastors, type AuditItem } from '../churchApi'
import { formatLongDate, formatTime, initials } from '../format'
import { auditText, pastorTallies, statusCounts } from '../reports'
import { AppLink } from '../AppLink'
import { NoticeList } from '../NoticeList'
import { useStaffSession } from '../useStaffSession'
import { formatIsoDate } from '../validation'

function appointmentWhen(iso: string) {
  const when = new Date(iso)
  const slot = `${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}`
  return `${formatLongDate(formatIsoDate(when))} at ${formatTime(slot)}`
}

export function ReportsPage() {
  const { ready, account, organisationId } = useStaffSession()
  const view = reportView(account?.role)
  const [records, setRecords] = useState<BookingRecord[]>([])
  const [pastorNames, setPastorNames] = useState<{ id: string; name: string }[]>([])
  const [audits, setAudits] = useState<AuditItem[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!account || !view) return
    const pastorId = view === 'own' ? account.pastorId : null
    if (view === 'own' && !pastorId) return
    Promise.all([listPastors(organisationId), listBookings(organisationId, pastorId), listAudits(organisationId, pastorId)])
      .then(([names, rows, activity]) => {
        setPastorNames(names)
        setRecords(rows)
        setAudits(activity)
      })
      .catch(() => setError('Reports could not be loaded.'))
  }, [account, view, organisationId])

  if (!ready) return <p className="auth-copy">Checking sign-in...</p>
  if (!account || !view) {
    return (
      <section className="card login-card">
        <p className="eyebrow">Staff only</p>
        <h1>Reports</h1>
        <p className="auth-copy">Reports are for a pastor, a secretary, or a church administrator.</p>
        <AppLink className="primary-button" to="/login">
          Log in
        </AppLink>
      </section>
    )
  }

  const mine = bookingsVisibleTo(records, account.role, account.pastorId)
  const counts = statusCounts(mine)
  const tallies = view === 'church' ? pastorTallies(mine, pastorNames) : []
  const recent = [...mine].reverse().slice(0, 8)
  const metrics = [
    { label: 'Pending', value: String(counts.pending), tone: 'gold' },
    { label: 'Confirmed', value: String(counts.confirmed), tone: 'green' },
    { label: 'Declined', value: String(counts.declined), tone: 'rose' },
    { label: 'Scheduled today', value: String(countBookings(mine).today), tone: 'navy' },
  ]

  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">{roleLabels[account.role]}</p>
        <h1>{view === 'own' ? 'Your appointments' : 'Church appointments'}</h1>
        <p className="auth-copy">
          {view === 'own'
            ? 'Only requests booked with you.'
            : 'Every pastor’s requests. A pastor does not see another pastor’s list.'}
        </p>
      </header>
      {error ? (
        <p className="form-banner error" role="alert">
          {error}
        </p>
      ) : null}
      {view === 'church' || account.pastorId ? (
        <NoticeList organisationId={organisationId} pastorId={view === 'own' ? account.pastorId : null} />
      ) : null}
      <section className="stats-grid" aria-label="Booking totals">
        {metrics.map((metric) => (
          <article key={metric.label} className={`stat-card ${metric.tone}`}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>
      {view === 'church' ? (
        <section className="card report-list">
          <h2>By pastor</h2>
          {tallies.length === 0 ? (
            <p className="auth-copy">No booking requests yet.</p>
          ) : (
            <ul className="data-list">
              {tallies.map((row) => (
                <li key={row.pastorId}>
                  <span className="avatar" aria-hidden="true">
                    {initials(row.name)}
                  </span>
                  <div className="data-main">
                    <strong>{row.name}</strong>
                    <span>
                      {row.pending} pending · {row.confirmed} confirmed · {row.declined} declined
                    </span>
                  </div>
                  <span className="badge badge-role">Pastor</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
      <section className="card report-list">
        <h2>Recent requests</h2>
        {recent.length === 0 ? (
          <p className="auth-copy">No booking requests yet.</p>
        ) : (
          <ul className="data-list">
            {recent.map((record) => {
              const details = describeBooking(record, pastorNames)
              return (
                <li key={record.id}>
                  <span className="avatar" aria-hidden="true">
                    {initials(record.visitor_name)}
                  </span>
                  <div className="data-main">
                    <strong>{record.visitor_name}</strong>
                    <span>
                      {record.booking_reference} · {details.pastor} · {appointmentWhen(record.scheduled_for)}
                    </span>
                  </div>
                  <span className={`badge badge-${record.status}`}>{record.status}</span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
      <section className="card report-list">
        <h2>Activity</h2>
        {audits.length === 0 ? (
          <p className="auth-copy">No activity recorded yet.</p>
        ) : (
          <ul className="data-list">
            {audits.slice(0, 12).map((event) => (
              <li key={event.id}>
                <span className="avatar" aria-hidden="true">
                  {initials(event.visitorName || event.actor)}
                </span>
                <div className="data-main">
                  <span>{auditText(event.action, event.actor, event.visitorName, event.bookingReference)}</span>
                </div>
                <span className={`badge badge-${event.action === 'requested' ? 'pending' : event.action}`}>{event.action}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
