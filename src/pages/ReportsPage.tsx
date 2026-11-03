import { AppLink } from '../AppLink'
import { isReportRole, type StaffRole } from '../staffSession'
import { useStaffSession } from '../useStaffSession'

const reports: Record<StaffRole, { eyebrow: string; title: string; summary: string; metrics: { label: string; value: string; tone: string }[] }> = {
  pastor: {
    eyebrow: 'Pastor',
    title: 'Your appointments',
    summary: 'This report covers the appointments assigned to you.',
    metrics: [
      { label: 'Your appointments today', value: '12', tone: 'navy' },
      { label: 'Waiting on you', value: '4', tone: 'gold' },
      { label: 'Your follow-ups', value: '2', tone: 'green' },
      { label: 'Your no-shows', value: '1', tone: 'rose' },
    ],
  },
  secretary: {
    eyebrow: 'Secretary',
    title: 'Church appointments',
    summary: 'This report covers appointments for every pastor in the church.',
    metrics: [
      { label: 'Church appointments', value: '1,284', tone: 'navy' },
      { label: 'Pending approvals', value: '38', tone: 'gold' },
      { label: 'Confirmations', value: '92%', tone: 'green' },
      { label: 'No-shows', value: '4', tone: 'rose' },
    ],
  },
}

export function ReportsPage() {
  const session = useStaffSession()
  if (!session || !isReportRole(session.role)) {
    return (
      <section className="card login-card">
        <p className="eyebrow-small">Staff only</p>
        <h1>Reports</h1>
        <p className="auth-copy">Reports are for a pastor or a secretary. Log in with one of those roles to open them.</p>
        <AppLink className="primary-button" to="/login">
          Log in
        </AppLink>
      </section>
    )
  }

  const report = reports[session.role]
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">{report.eyebrow}</p>
        <h1>{report.title}</h1>
        <p className="auth-copy">{report.summary}</p>
      </header>
      <section className="stats-grid" aria-label="Operational metrics">
        {report.metrics.map((metric) => (
          <article key={metric.label} className={`stat-card ${metric.tone}`}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>
    </>
  )
}
