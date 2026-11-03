import { AppLink } from '../AppLink'

export function MissingPage() {
  return (
    <section className="card missing-card">
      <p className="eyebrow-small">ETOPADE</p>
      <h1>Page not found</h1>
      <p className="auth-copy">That address is not part of the appointment system.</p>
      <AppLink className="primary-button" to="/">
        Back to overview
      </AppLink>
    </section>
  )
}
