import { useEffect, useState } from 'react'
import { isChurchAdmin, pastorDashboard, reportView } from '../auth'
import { defaultSchedule, monthKey, shiftMonth, slotsOn, weekdayOf, WEEKDAY_LABELS, type WeekSchedule } from '../availability'
import { decideRemote, listBookings, listSchedules, saveSchedule } from '../churchApi'
import type { BookingRecord } from '../bookings'
import { AppLink } from '../AppLink'
import { formatLongDate, formatTime } from '../format'
import { AdminPage } from './AdminPage'
import { ReportsPage } from './ReportsPage'
import { MonthCalendar } from '../MonthCalendar'
import { NoticeList } from '../NoticeList'
import { useStaffSession } from '../useStaffSession'
import { SLOT_TIMES, appointmentTypes, formatIsoDate } from '../validation'

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
  return { when, slot, label: `${formatLongDate(formatIsoDate(when))} at ${formatTime(slot)}` }
}

export function DashboardPage() {
  const { ready, account } = useStaffSession()
  const [records, setRecords] = useState<BookingRecord[]>([])
  const [schedule, setSchedule] = useState<WeekSchedule | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [filter, setFilter] = useState<AppointmentFilter>('pending')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [{ today, maxDate }] = useState(() => {
    const now = new Date()
    const latest = new Date(now)
    latest.setDate(latest.getDate() + 90)
    return { today: formatIsoDate(now), maxDate: formatIsoDate(latest) }
  })
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  useEffect(() => {
    if (!account?.pastorId) return
    const pastorId = account.pastorId
    listBookings(pastorId)
      .then(setRecords)
      .catch(() => setError('Appointments could not be loaded.'))
    listSchedules()
      .then((rows) => setSchedule(rows[pastorId] ?? defaultSchedule()))
      .catch(() => setError('Hours could not be loaded.'))
  }, [account])

  if (!ready) return <p className="auth-copy">Checking sign-in...</p>
  if (!account) {
    return (
      <section className="card login-card">
        <p className="eyebrow">Staff only</p>
        <h1>Dashboard</h1>
        <p className="auth-copy">Sign in to open the work for your role.</p>
        <AppLink className="primary-button" to="/login">
          Log in
        </AppLink>
      </section>
    )
  }
  if (isChurchAdmin(account.role)) {
    return (
      <>
        <AdminPage />
        <ReportsPage />
      </>
    )
  }
  if (reportView(account.role) === 'church') return <ReportsPage />
  if (!pastorDashboard(account.role) || !account.pastorId) {
    return (
      <section className="card login-card">
        <p className="eyebrow">Signed in</p>
        <h1>{account.name}</h1>
        <p className="auth-copy">This account can sign in. Appointment records open for a pastor, a secretary, or a church administrator.</p>
      </section>
    )
  }

  const pastorId = account.pastorId
  const mine = records
    .filter((record) => record.pastor_id === pastorId)
    .sort((left, right) => left.scheduled_for.localeCompare(right.scheduled_for))
  const pending = mine.filter((record) => record.status === 'pending').length
  const confirmed = mine.filter((record) => record.status === 'confirmed').length
  const declined = mine.filter((record) => record.status === 'declined').length
  const visible = filter === 'all' ? mine : mine.filter((record) => record.status === filter)
  const filters: { id: AppointmentFilter; label: string; count: number }[] = [
    { id: 'pending', label: 'Pending', count: pending },
    { id: 'confirmed', label: 'Confirmed', count: confirmed },
    { id: 'declined', label: 'Declined', count: declined },
    { id: 'all', label: 'All', count: mine.length },
  ]
  const emptyCopy =
    mine.length === 0
      ? 'No appointment requests yet.'
      : filter === 'pending'
        ? 'No requests are waiting for a reply.'
        : filter === 'confirmed'
          ? 'No confirmed appointments.'
          : filter === 'declined'
            ? 'No declined appointments.'
            : 'No appointment requests yet.'

  const bookedDates = new Set(
    mine.filter((record) => record.status !== 'declined').map((record) => formatIsoDate(new Date(record.scheduled_for))),
  )

  function toggleDay(day: number) {
    setSchedule((current) => {
      if (!current) return current
      const weekdays = current.weekdays.includes(day)
        ? current.weekdays.filter((item) => item !== day)
        : [...current.weekdays, day].sort((left, right) => left - right)
      return { ...current, weekdays }
    })
    setNotice('')
  }

  function toggleSlot(slot: string) {
    setSchedule((current) => {
      if (!current) return current
      const slots = current.slots.includes(slot) ? current.slots.filter((item) => item !== slot) : [...current.slots, slot]
      return { ...current, slots }
    })
    setNotice('')
  }

  function toggleBlocked(date: string) {
    setSchedule((current) =>
      current
        ? {
            ...current,
            blockedDates: (current.blockedDates.includes(date)
              ? current.blockedDates.filter((item) => item !== date)
              : [...current.blockedDates, date]
            ).sort(),
          }
        : current,
    )
    setNotice('')
  }

  async function saveHours() {
    if (!schedule) return
    setError('')
    setNotice('')
    try {
      const saved = await saveSchedule(pastorId, schedule)
      if ('error' in saved) setError(saved.error)
      else {
        setSchedule(saved.schedule)
        setNotice('Hours saved.')
      }
    } catch {
      setError('Hours could not be saved.')
    }
  }

  async function decide(bookingId: string, status: 'confirmed' | 'declined') {
    setError('')
    setSavingId(bookingId)
    try {
      await decideRemote(bookingId, status)
      setRecords(await listBookings(pastorId))
      setNotice(status === 'confirmed' ? 'Appointment confirmed.' : 'Appointment declined.')
    } catch {
      setError('That request could not be updated.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Your appointments</p>
        <h1>{account.name}</h1>
        <p className="auth-copy">Confirm or decline requests booked with you. Other pastors’ requests stay on their own dashboards.</p>
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
      <section className="stats-grid" aria-label="Your appointment totals">
        <article className="stat-card gold">
          <span>Needs your reply</span>
          <strong>{pending}</strong>
        </article>
        <article className="stat-card green">
          <span>Confirmed</span>
          <strong>{confirmed}</strong>
        </article>
        <article className="stat-card rose">
          <span>Declined</span>
          <strong>{declined}</strong>
        </article>
      </section>
      <NoticeList pastorId={pastorId} />
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
      <section className="appointment-list" aria-label="Your appointments">
        {visible.length === 0 ? (
          <article className="card appointment-row">
            <p className="auth-copy">{emptyCopy}</p>
          </article>
        ) : (
          visible.map((record) => {
            const details = clock(record.scheduled_for)
            const category = appointmentTypes.find((item) => item.id === record.appointment_type_id)?.name ?? 'Appointment'
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
                    {category} · {details.label} · {record.meeting_mode === 'virtual' ? 'Online' : 'In person'}
                  </p>
                  <a href={`mailto:${record.visitor_email}`}>{record.visitor_email}</a>
                </div>
                {record.status === 'pending' ? (
                  <div className="appointment-actions">
                    <button type="button" className="primary-button btn-sm" disabled={saving} onClick={() => void decide(record.id, 'confirmed')}>
                      Confirm
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
      {schedule ? (
        <details className="card hours-card">
          <summary>Weekly hours and days off</summary>
          <p className="auth-copy">
            Choose the days and times visitors can request. Click a working day on the calendar to close that date. Existing requests stay until you confirm or decline them.
          </p>
          <div className="slot-list" role="group" aria-label="Working days">
            {WEEKDAY_LABELS.map((label, day) => (
              <button
                type="button"
                key={label}
                className="slot-button"
                aria-pressed={schedule.weekdays.includes(day)}
                onClick={() => toggleDay(day)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="slot-list" role="group" aria-label="Working times">
            {SLOT_TIMES.map((slot) => (
              <button
                type="button"
                key={slot}
                className="slot-button"
                aria-pressed={schedule.slots.includes(slot)}
                onClick={() => toggleSlot(slot)}
              >
                {formatTime(slot)}
              </button>
            ))}
          </div>
          <MonthCalendar
            year={monthCursor.year}
            month={monthCursor.month}
            onPrev={() => setMonthCursor((current) => shiftMonth(current, -1))}
            onNext={() => setMonthCursor((current) => shiftMonth(current, 1))}
            prevDisabled={monthKey(monthCursor) <= today.slice(0, 7)}
            nextDisabled={monthKey(monthCursor) >= maxDate.slice(0, 7)}
            dayPressed={(date) => schedule.blockedDates.includes(date)}
            dayHint={(date) =>
              [bookedDates.has(date) ? 'has a request' : '', schedule.blockedDates.includes(date) ? 'closed' : '']
                .filter(Boolean)
                .join(', ')
            }
            dayDisabled={(date, inMonth) => {
              const weekday = weekdayOf(date)
              return !inMonth || date < today || date > maxDate || weekday === null || !schedule.weekdays.includes(weekday)
            }}
            dayClass={(date, inMonth) => {
              if (!inMonth || date < today || date > maxDate) return 'outside'
              if (schedule.blockedDates.includes(date) || slotsOn(schedule, date).length === 0) return 'closed'
              if (bookedDates.has(date)) return 'taken'
              return 'open'
            }}
            onPick={toggleBlocked}
          />
          <button type="button" className="primary-button" onClick={() => void saveHours()}>
            Save hours
          </button>
        </details>
      ) : error ? null : (
        <p className="auth-copy">Loading hours...</p>
      )}
    </>
  )
}
