import { useState } from 'react'
import type { BookingRecord } from './bookings'
import { formatLongDate, formatTime } from './format'
import { appointmentTypes, formatIsoDate } from './validation'

const statusLabels: Record<BookingRecord['status'], string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  declined: 'Declined',
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

type AppointmentFilter = 'pending' | 'confirmed' | 'declined' | 'all'

function clock(iso: string) {
  const when = new Date(iso)
  const slot = `${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}`
  return { when, label: `${formatLongDate(formatIsoDate(when))} at ${formatTime(slot)}` }
}

export function AppointmentList({
  records,
  onDecide,
  confirmLabel = 'Confirm',
  pastorNames = [],
}: {
  records: BookingRecord[]
  onDecide: (bookingId: string, status: 'confirmed' | 'declined') => Promise<void>
  confirmLabel?: string
  pastorNames?: { id: string; name: string }[]
}) {
  const [filter, setFilter] = useState<AppointmentFilter>('pending')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const sorted = [...records].sort((left, right) => left.scheduled_for.localeCompare(right.scheduled_for))
  const pending = sorted.filter((record) => record.status === 'pending').length
  const confirmed = sorted.filter((record) => record.status === 'confirmed').length
  const declined = sorted.filter((record) => record.status === 'declined').length
  const visible = filter === 'all' ? sorted : sorted.filter((record) => record.status === filter)
  const filters: { id: AppointmentFilter; label: string; count: number }[] = [
    { id: 'pending', label: 'Pending', count: pending },
    { id: 'confirmed', label: 'Confirmed', count: confirmed },
    { id: 'declined', label: 'Declined', count: declined },
    { id: 'all', label: 'All', count: sorted.length },
  ]
  const emptyCopy =
    sorted.length === 0
      ? 'No appointment requests yet.'
      : filter === 'pending'
        ? 'No requests are waiting for a reply.'
        : filter === 'confirmed'
          ? 'No confirmed appointments.'
          : filter === 'declined'
            ? 'No declined appointments.'
            : 'No appointment requests yet.'

  async function decide(bookingId: string, status: 'confirmed' | 'declined') {
    setError('')
    setSavingId(bookingId)
    try {
      await onDecide(bookingId, status)
    } catch {
      setError('That request could not be updated.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <>
      {error ? (
        <p className="form-banner error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="tabs" role="group" aria-label="Filter appointments">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            className="tab"
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
          >
            {item.label} ({item.count})
          </button>
        ))}
      </div>
      <section className="appointment-list" aria-label="Appointment requests">
        {visible.length === 0 ? (
          <article className="card appointment-row">
            <p className="auth-copy">{emptyCopy}</p>
          </article>
        ) : (
          visible.map((record) => {
            const details = clock(record.scheduled_for)
            const category = appointmentTypes.find((item) => item.id === record.appointment_type_id)?.name ?? 'Appointment'
            const pastor = pastorNames.find((item) => item.id === record.pastor_id)?.name
            const saving = savingId === record.id
            return (
              <article key={record.id} className="card appointment-row">
                <div className="date-chip" aria-hidden="true">
                  <strong>{details.when.getDate()}</strong>
                  <span>{MONTHS[details.when.getMonth()]}</span>
                </div>
                <div className="appointment-copy">
                  <span className={`badge badge-${record.status}`}>{statusLabels[record.status]}</span>
                  <h2>{record.visitor_name}</h2>
                  <p className="auth-copy">
                    {category}
                    {pastor ? ` · ${pastor}` : ''} · {details.label} · {record.meeting_mode === 'virtual' ? 'Online' : 'In person'}
                  </p>
                  <a href={`mailto:${record.visitor_email}`}>{record.visitor_email}</a>
                </div>
                {record.status === 'pending' ? (
                  <div className="appointment-actions">
                    <button type="button" className="primary-button btn-sm" disabled={saving} onClick={() => void decide(record.id, 'confirmed')}>
                      {confirmLabel}
                    </button>
                    <button type="button" className="danger-button btn-sm" disabled={saving} onClick={() => void decide(record.id, 'declined')}>
                      Decline
                    </button>
                  </div>
                ) : null}
              </article>
            )
          })
        )}
      </section>
    </>
  )
}
