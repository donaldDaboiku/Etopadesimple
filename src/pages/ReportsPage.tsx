import { useEffect, useState } from 'react'
import { reportView, roleLabels } from '../auth'
import { bookingsVisibleTo, countBookings, describeBooking, type BookingRecord } from '../bookings'
import { listAudits, listBookings, listPastors, type AuditItem } from '../churchApi'
import { auditText, pastorTallies, statusCounts } from '../reports'
import { signInWithGoogle } from '../firebaseApp'
import { NoticeList } from '../NoticeList'
import { useStaffSession } from '../useStaffSession'

export function ReportsPage() {
  const { ready, account } = useStaffSession()
  const view = reportView(account?.role)
  const [records, setRecords] = useState<BookingRecord[]>([])
  const [pastorNames, setPastorNames] = useState<{ id: string; name: string }[]>([])
  const [audits, setAudits] = useState<AuditItem[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!account || !view) return
    const pastorId = view === 'own' ? account.pastorId : null
    if (view === 'own' && !pastorId) return
    Promise.all([listPastors(), listBookings(pastorId), listAudits(pastorId)])
      .then(([names, rows, activity]) => {
        setPastorNames(names)
        setRecords(rows)
        setAudits(activity)
      })
      .catch(() => setError('Reports could not be loaded from Firebase.'))
  }, [account, view])

  if (!ready) return <p className="auth-copy">Checking sign-in...</p>
  if (!account || !view) {
    return (
      <section className="card login-card">
        <p className="eyebrow-small">Staff only</p>
        <h1>Reports</h1>
        <p className="auth-copy">Reports are for a pastor, a secretary, or a church administrator. Sign in with Google to open them.</p>
        <button type="button" className="primary-button" onClick={() => void signInWithGoogle()}>
          Continue with Google
        </button>
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
      {error ? <p className="form-banner error">{error}</p> : null}
      {view === 'church' || account.pastorId ? <NoticeList pastorId={view === 'own' ? account.pastorId : null} /> : null}
      <section className="stats-grid" aria-label="Booking totals">
        {metrics.map((metric) => (
          <article key={metric.label} className={`stat-card ${metric.tone}`}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>
      {view === 'church' ? (
        <section className="card audit-panel report-list">
          <h2>By pastor</h2>
          {tallies.length === 0 ? (
            <p className="auth-copy">No booking requests yet.</p>
          ) : (
            <ul className="audit-list">
              {tallies.map((row) => (
                <li key={row.pastorId}>
                  {row.name} · {row.pending} pending · {row.confirmed} confirmed · {row.declined} declined
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
      <section className="card audit-panel report-list">
        <h2>Recent requests</h2>
        {recent.length === 0 ? (
          <p className="auth-copy">No booking requests yet.</p>
        ) : (
          <ul className="audit-list">
            {recent.map((record) => {
              const details = describeBooking(record, pastorNames)
              return (
                <li key={record.id}>
                  {record.booking_reference} · {record.visitor_name} · {details.pastor} · {details.when} · {record.status}
                </li>
              )
            })}
          </ul>
        )}
      </section>
      <section className="card audit-panel report-list">
        <h2>Activity</h2>
        {audits.length === 0 ? (
          <p className="auth-copy">No activity recorded yet.</p>
        ) : (
          <ul className="audit-list">
            {audits.slice(0, 12).map((event) => (
              <li key={event.id}>{auditText(event.action, event.actor, event.visitorName, event.bookingReference)}</li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
