import { useEffect, useState } from 'react'
import { AppLink } from '../AppLink'
import { listPastors } from '../churchApi'
import { initials } from '../format'
import { pastors as fallbackPastors } from '../validation'

export function PastorsPage() {
  const [pastors, setPastors] = useState(fallbackPastors)
  useEffect(() => {
    listPastors()
      .then((rows) => {
        if (rows.length > 0) setPastors(rows)
      })
      .catch(() => undefined)
  }, [])

  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Ministry team</p>
        <h1>Pastors</h1>
        <p className="auth-copy">Choose someone to meet, then request a time that is still open.</p>
      </header>
      <div className="pastor-grid">
        {pastors.map((pastor) => (
          <article key={pastor.id} className="pastor-card card">
            <span className="avatar" aria-hidden="true">
              {initials(pastor.name)}
            </span>
            <h2>{pastor.name}</h2>
            <p>Prayer, counselling, and pastoral visits.</p>
            <AppLink className="secondary-button" to={`/booking?pastor=${pastor.id}`}>
              Request a time
            </AppLink>
          </article>
        ))}
      </div>
    </>
  )
}
