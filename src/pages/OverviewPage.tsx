import { AppLink } from '../AppLink'

const highlights = [
  'Multi-organisation and branch-ready architecture',
  'Booking details are checked before a request is accepted',
  'The same pastor and time cannot be requested twice here',
]

export function OverviewPage() {
  return (
    <section className="hero card">
      <div className="hero-copy">
        <p className="eyebrow">Secure ministry scheduling</p>
        <h1>Pastoral care made simple, structured, and secure.</h1>
        <p className="lede">
          ETOPADE helps churches and pastors manage appointments, counselling, prayer requests, pastoral visits, and
          follow-ups with a calm and professional user experience.
        </p>

        <div className="cta-row">
          <AppLink className="primary-button" to="/booking">
            Book a session
          </AppLink>
          <AppLink className="secondary-button" to="/pastors">
            Meet the pastors
          </AppLink>
        </div>

        <ul className="trust-list">
          {highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="hero-panel">
        <div className="snapshot-card">
          <span className="panel-label">Today&apos;s focus</span>
          <h2>Pastor James Adebayo</h2>
          <div className="snapshot-grid">
            <div>
              <strong>12</strong>
              <span>Appointments</span>
            </div>
            <div>
              <strong>4</strong>
              <span>Pending</span>
            </div>
            <div>
              <strong>2</strong>
              <span>Follow-ups</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
