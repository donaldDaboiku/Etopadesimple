import { reportView, roleLabels, staffDirectory } from '../auth'
import { AppLink } from '../AppLink'
import { countBookings, describeBooking, readBookings } from '../bookings'
import { useStaffSession } from '../useStaffSession'

export function ReportsPage() {
  const session = useStaffSession()
  const view = reportView(session?.role)
  if (!session || !view) {
    return (
      <section className="card login-card">
        <p className="eyebrow-small">Staff only</p>
        <h1>Reports</h1>
        <p className="auth-copy">Reports are for a pastor or a secretary. Log in with a staff email to open them.</p>
        <AppLink className="primary-button" to="/login">
          Log in
        </AppLink>
      </section>
    )
  }

  const account = staffDirectory.find((item) => item.email === session.email)
  const records = readBookings()
  const mine = view === 'own' ? records.filter((record) => record.pastor_id === account?.pastorId) : records
  const counts = countBookings(records, view === 'own' ? account?.pastorId : null)
  const recent = [...mine].reverse().slice(0, 8)
  const metrics = [
    { label: view === 'own' ? 'Your requests' : 'Church requests', value: String(counts.total), tone: 'navy' },
    { label: 'Pending', value: String(counts.pending), tone: 'gold' },
    { label: 'Scheduled today', value: String(counts.today), tone: 'green' },
  ]

  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">{roleLabels[session.role]}</p>
        <h1>{view === 'own' ? 'Your appointments' : 'Church appointments'}</h1>
        <p className="auth-copy">
          {view === 'own'
            ? 'Pending requests assigned to you.'
            : 'Pending requests for every pastor in the church.'}
        </p>
      </header>
      <section className="stats-grid" aria-label="Booking totals">
        {metrics.map((metric) => (
          <article key={metric.label} className={`stat-card ${metric.tone}`}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>
      <section className="card audit-panel report-list">
        <h2>Recent requests</h2>
        {recent.length === 0 ? (
          <p className="auth-copy">No booking requests yet.</p>
        ) : (
          <ul className="audit-list">
            {recent.map((record) => {
              const details = describeBooking(record)
              return (
                <li key={record.id}>
                  {record.booking_reference} · {record.visitor_name} · {details.pastor} · {details.when}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </>
  )
}
