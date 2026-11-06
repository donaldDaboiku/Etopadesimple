import { useEffect, useState } from 'react'
import { isChurchAdmin, pastorDashboard, reportView } from '../auth'
import { defaultSchedule, monthKey, shiftMonth, slotsOn, weekdayOf, WEEKDAY_LABELS, type WeekSchedule } from '../availability'
import { decideRemote, listBookings, listSchedules, saveSchedule } from '../churchApi'
import { describeBooking, type BookingRecord } from '../bookings'
import { signInWithGoogle } from '../firebaseApp'
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

export function DashboardPage() {
  const { ready, account } = useStaffSession()
  const [records, setRecords] = useState<BookingRecord[]>([])
  const [schedule, setSchedule] = useState<WeekSchedule | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
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
      .catch(() => setError('Appointments could not be loaded from Firebase.'))
    listSchedules()
      .then((rows) => setSchedule(rows[pastorId] ?? defaultSchedule()))
      .catch(() => setError('Hours could not be loaded from Firebase.'))
  }, [account])

  if (!ready) return <p className="auth-copy">Checking sign-in...</p>
  if (!account) {
    return (
      <section className="card login-card">
        <p className="eyebrow-small">Staff only</p>
        <h1>Dashboard</h1>
        <p className="auth-copy">Sign in with Google. Your dashboard shows the work for your role.</p>
        <button type="button" className="primary-button" onClick={() => void signInWithGoogle()}>
          Continue with Google
        </button>
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
        <p className="eyebrow-small">Signed in</p>
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
    try {
      await decideRemote(bookingId, status)
      setRecords(await listBookings(pastorId))
    } catch {
      setError('That request could not be updated.')
    }
  }

  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Pastor</p>
        <h1>{account.name}</h1>
        <p className="auth-copy">Confirm or decline requests booked with you. Other pastors’ requests stay on their own dashboards.</p>
      </header>
      {error ? <p className="form-banner error">{error}</p> : null}
      {notice ? <p className="form-banner success">{notice}</p> : null}
      <NoticeList pastorId={pastorId} />
      {schedule ? (
        <section className="card hours-card" aria-label="Weekly hours">
          <h2>Weekly hours</h2>
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
                {slot}
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
            dayLabel={(date) => `${date}${bookedDates.has(date) ? ', has a request' : ''}${schedule.blockedDates.includes(date) ? ', closed' : ''}`}
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
        </section>
      ) : (
        <p className="auth-copy">Loading hours...</p>
      )}
      <section className="stats-grid" aria-label="Your appointment totals">
        <article className="stat-card gold">
          <span>Pending</span>
          <strong>{pending}</strong>
        </article>
        <article className="stat-card green">
          <span>Confirmed</span>
          <strong>{confirmed}</strong>
        </article>
      </section>
      <section className="appointment-list" aria-label="Your appointments">
        {mine.length === 0 ? (
          <article className="card appointment-row">
            <p className="auth-copy">No appointment requests yet.</p>
          </article>
        ) : (
          mine.map((record) => {
            const details = describeBooking(record)
            const category = appointmentTypes.find((item) => item.id === record.appointment_type_id)?.name ?? 'Appointment'
            return (
              <article key={record.id} className="card appointment-row">
                <div>
                  <p className="eyebrow-small">{statusLabels[record.status]}</p>
                  <h2>{record.visitor_name}</h2>
                  <p className="auth-copy">
                    {category} · {details.when} · {record.meeting_mode === 'virtual' ? 'Virtual' : 'Physical'}
                  </p>
                  <p className="auth-copy">{record.visitor_email}</p>
                </div>
                {record.status === 'pending' ? (
                  <div className="appointment-actions">
                    <button type="button" className="primary-button" onClick={() => void decide(record.id, 'confirmed')}>
                      Confirm
                    </button>
                    <button type="button" className="secondary-button" onClick={() => void decide(record.id, 'declined')}>
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
