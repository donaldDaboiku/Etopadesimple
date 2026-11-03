import { AppLink } from '../AppLink'
import { pastors } from '../validation'

export function PastorsPage() {
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Ministry team</p>
        <h1>Pastors</h1>
      </header>
      <div className="pastor-grid">
        {pastors.map((pastor) => (
          <article key={pastor.id} className="pastor-card card">
            <span className="panel-label">Main Campus</span>
            <h2>{pastor.name}</h2>
            <p>Available for prayer, counselling, and pastoral visits.</p>
            <AppLink className="secondary-button" to={`/booking?pastor=${pastor.id}`}>
              Request a time
            </AppLink>
          </article>
        ))}
      </div>
    </>
  )
}
