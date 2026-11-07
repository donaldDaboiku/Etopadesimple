import { useEffect, useState } from 'react'
import { AppLink } from '../AppLink'
import { listPastors } from '../churchApi'
import { initials } from '../format'
import { useStaffSession } from '../useStaffSession'
import { pastors as fallbackPastors } from '../validation'

export function PastorsPage() {
  const { ready, organisationId } = useStaffSession()
  const [pastors, setPastors] = useState(fallbackPastors)
  useEffect(() => {
    if (!ready) return
    listPastors(organisationId)
      .then((rows) => {
        if (rows.length > 0 || organisationId !== 'grace') setPastors(rows)
      })
      .catch(() => undefined)
  }, [ready, organisationId])

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
            <AppLink
              className="secondary-button"
              to={
                organisationId === 'grace'
                  ? `/booking?pastor=${pastor.id}`
                  : `/booking?pastor=${pastor.id}&org=${organisationId}`
              }
            >
              Request a time
            </AppLink>
          </article>
        ))}
      </div>
    </>
  )
}
