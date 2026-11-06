import { AppLink } from '../AppLink'

const capabilities = [
  {
    title: 'Visitors request a time',
    text: 'A request records the purpose, the day, and whether the meeting is in person or virtual. A time already taken cannot be requested again.',
  },
  {
    title: 'Each role has its own dashboard',
    text: 'After sign-in, a pastor, an assistant, a secretary, and a church administrator each open the work that belongs to that role.',
  },
  {
    title: 'Hours belong to the pastor',
    text: 'Open days, appointment times, and closed dates come from that pastor’s own schedule.',
  },
]

export function OverviewPage() {
  return (
    <section className="hero card">
      <div className="hero-copy">
        <p className="eyebrow">Secure ministry scheduling</p>
        <h1>Pastoral care made simple, structured, and secure.</h1>
        <p className="lede">
          ETOPADE helps a church receive appointment requests, keep each pastor’s schedule, and give every staff member a
          dashboard for their own work.
        </p>

        <div className="cta-row">
          <AppLink className="primary-button" to="/booking">
            Book a session
          </AppLink>
          <AppLink className="secondary-button" to="/login">
            Log in
          </AppLink>
        </div>
      </div>

      <div className="hero-panel">
        <div className="snapshot-card">
          <span className="panel-label">What ETOPADE does</span>
          <ul className="capability-list">
            {capabilities.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
