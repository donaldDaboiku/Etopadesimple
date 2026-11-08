import { useEffect, useState } from 'react'
import { pastorDashboard } from '../auth'
import { AppointmentList } from '../AppointmentList'
import { AppLink } from '../AppLink'
import type { BookingRecord } from '../bookings'
import { decideRemote, listBookings } from '../churchApi'
import { useStaffSession } from '../useStaffSession'

export function RequestsPage() {
  const { ready, account, organisationId } = useStaffSession()
  const [records, setRecords] = useState<BookingRecord[]>([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!account?.pastorId || !pastorDashboard(account.role)) return
    const pastorId = account.pastorId
    listBookings(organisationId, pastorId)
      .then(setRecords)
      .catch(() => setError('Appointments could not be loaded.'))
  }, [account, organisationId])

  if (!ready) return <p className="auth-copy">Checking sign-in...</p>
  if (!account) {
    return (
      <section className="card login-card">
        <p className="eyebrow">Staff only</p>
        <h1>Requests</h1>
        <p className="auth-copy">Sign in to see requests booked with you.</p>
        <AppLink className="primary-button" to="/login">
          Log in
        </AppLink>
      </section>
    )
  }
  if (!pastorDashboard(account.role) || !account.pastorId) {
    return (
      <section className="card login-card">
        <p className="eyebrow">Pastor</p>
        <h1>Requests</h1>
        <p className="auth-copy">These requests belong to a pastor.</p>
      </section>
    )
  }

  const pastorId = account.pastorId

  async function decide(bookingId: string, status: 'confirmed' | 'declined') {
    setNotice('')
    await decideRemote(organisationId, bookingId, status)
    setRecords(await listBookings(organisationId, pastorId))
    setNotice(status === 'confirmed' ? 'Appointment confirmed.' : 'Appointment declined.')
  }

  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Your appointments</p>
        <h1>Requests</h1>
        <p className="auth-copy">Confirm or decline requests booked with you. Other pastors’ requests stay on their own lists.</p>
      </header>
      {error ? (
        <p className="form-banner error" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="form-banner success" role="status">
          {notice}
        </p>
      ) : null}
      <AppointmentList records={records} onDecide={decide} />
    </>
  )
}
