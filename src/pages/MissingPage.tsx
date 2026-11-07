import { AppLink } from '../AppLink'

export function MissingPage() {
  return (
    <section className="card missing-card">
      <p className="eyebrow">404</p>
      <h1>That page is not here</h1>
      <p className="auth-copy">The link may be out of date. Head back to the home page to book a time or sign in.</p>
      <AppLink className="primary-button" to="/">
        Back to home
      </AppLink>
    </section>
  )
}
