import { useEffect, useState, type FormEvent } from 'react'
import { pastorDashboard } from '../auth'
import { defaultSchedule, monthKey, shiftMonth, slotsOn, weekdayOf, WEEKDAY_LABELS, type WeekSchedule } from '../availability'
import { listBookings, listSchedules, saveSchedule, updateOwnName } from '../churchApi'
import { Field } from '../Field'
import { changeOwnPassword } from '../firebaseApp'
import { formatTime } from '../format'
import { MonthCalendar } from '../MonthCalendar'
import { AppLink } from '../AppLink'
import { reloadStaffSession, useStaffSession } from '../useStaffSession'
import { formatIsoDate, SLOT_TIMES } from '../validation'

function passwordProblem(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : ''
  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials') {
    return 'That current password is not correct.'
  }
  if (code === 'auth/weak-password') return 'Use at least 6 characters.'
  if (code === 'auth/requires-recent-login') return 'Sign in again, then change your password.'
  if (code === 'auth/too-many-requests') return 'Too many attempts. Wait a moment and try again.'
  return 'The password could not be changed.'
}

export function SettingsPage() {
  const { ready, account, organisationId } = useStaffSession()
  const [nameDraft, setNameDraft] = useState<string | null>(null)
  const [schedule, setSchedule] = useState<WeekSchedule | null>(null)
  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set())
  const [nameError, setNameError] = useState('')
  const [nameNotice, setNameNotice] = useState('')
  const [hoursError, setHoursError] = useState('')
  const [hoursNotice, setHoursNotice] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordNotice, setPasswordNotice] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [nextPassword, setNextPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [savingName, setSavingName] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
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

  const name = nameDraft ?? (account && pastorDashboard(account.role) ? account.name : '')

  useEffect(() => {
    if (!account?.pastorId || !pastorDashboard(account.role)) return
    const pastorId = account.pastorId
    listSchedules(organisationId)
      .then((rows) => setSchedule(rows[pastorId] ?? defaultSchedule()))
      .catch(() => setHoursError('Hours could not be loaded.'))
    listBookings(organisationId, pastorId)
      .then((rows) =>
        setBookedDates(new Set(rows.filter((record) => record.status !== 'declined').map((record) => formatIsoDate(new Date(record.scheduled_for))))),
      )
      .catch(() => setHoursError('Hours could not be loaded.'))
  }, [account, organisationId])

  if (!ready) return <p className="auth-copy">Checking sign-in...</p>
  if (!account) {
    return (
      <section className="card login-card">
        <p className="eyebrow">Staff only</p>
        <h1>Settings</h1>
        <p className="auth-copy">Sign in to update your hours, name, and password.</p>
        <AppLink className="primary-button" to="/login">
          Log in
        </AppLink>
      </section>
    )
  }
  if (!pastorDashboard(account.role)) {
    return (
      <section className="card login-card">
        <p className="eyebrow">Pastor</p>
        <h1>Settings</h1>
        <p className="auth-copy">Hours, name, and password are on the pastor account.</p>
      </section>
    )
  }

  const pastorId = account.pastorId

  function toggleDay(day: number) {
    setSchedule((current) => {
      if (!current) return current
      const weekdays = current.weekdays.includes(day)
        ? current.weekdays.filter((item) => item !== day)
        : [...current.weekdays, day].sort((left, right) => left - right)
      return { ...current, weekdays }
    })
    setHoursNotice('')
  }

  function toggleSlot(slot: string) {
    setSchedule((current) => {
      if (!current) return current
      const slots = current.slots.includes(slot) ? current.slots.filter((item) => item !== slot) : [...current.slots, slot]
      return { ...current, slots }
    })
    setHoursNotice('')
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
    setHoursNotice('')
  }

  async function saveHours() {
    if (!schedule || !pastorId) return
    setHoursError('')
    setHoursNotice('')
    try {
      const saved = await saveSchedule(organisationId, pastorId, schedule)
      if ('error' in saved) setHoursError(saved.error)
      else {
        setSchedule(saved.schedule)
        setHoursNotice('Hours saved.')
      }
    } catch {
      setHoursError('Hours could not be saved.')
    }
  }

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNameError('')
    setNameNotice('')
    setSavingName(true)
    try {
      const saved = await updateOwnName(organisationId, name)
      if ('error' in saved) {
        setNameError(saved.error)
        return
      }
      setNameDraft(saved.name)
      setNameNotice('Name updated.')
      reloadStaffSession()
    } catch {
      setNameError('Your name could not be saved.')
    } finally {
      setSavingName(false)
    }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordError('')
    setPasswordNotice('')
    if (nextPassword.length < 6) {
      setPasswordError('Use at least 6 characters.')
      return
    }
    if (nextPassword !== confirmPassword) {
      setPasswordError('Those passwords do not match.')
      return
    }
    setSavingPassword(true)
    try {
      await changeOwnPassword(currentPassword, nextPassword)
      setCurrentPassword('')
      setNextPassword('')
      setConfirmPassword('')
      setPasswordNotice('Password updated.')
    } catch (error) {
      setPasswordError(passwordProblem(error))
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Your account</p>
        <h1>Settings</h1>
        <p className="auth-copy">Set the days you can meet, update your name, and change your password.</p>
      </header>
      {pastorId && schedule ? (
        <details className="card hours-card" open>
          <summary>Weekly hours and days off</summary>
          {hoursError ? (
            <p className="form-banner error" role="alert">
              {hoursError}
            </p>
          ) : null}
          {hoursNotice ? (
            <p className="form-banner success" role="status">
              {hoursNotice}
            </p>
          ) : null}
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
              <button type="button" key={slot} className="slot-button" aria-pressed={schedule.slots.includes(slot)} onClick={() => toggleSlot(slot)}>
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
              [bookedDates.has(date) ? 'has a request' : '', schedule.blockedDates.includes(date) ? 'closed' : ''].filter(Boolean).join(', ')
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
      ) : pastorId && hoursError ? (
        <p className="form-banner error" role="alert">
          {hoursError}
        </p>
      ) : pastorId ? (
        <p className="auth-copy">Loading hours...</p>
      ) : null}
      <form className="card stack-form" onSubmit={(event) => void saveName(event)}>
        <h2>Your name</h2>
        {nameNotice ? (
          <p className="form-banner success" role="status">
            {nameNotice}
          </p>
        ) : null}
        <Field id="profile-name" label="Name shown when you are signed in" error={nameError}>
          <input value={name} autoComplete="name" onChange={(event) => setNameDraft(event.target.value)} />
        </Field>
        <button type="submit" className="primary-button" disabled={savingName}>
          {savingName ? 'Saving...' : 'Save name'}
        </button>
      </form>
      <form className="card stack-form" onSubmit={(event) => void savePassword(event)}>
        <h2>Password</h2>
        {passwordError ? (
          <p className="form-banner error" role="alert">
            {passwordError}
          </p>
        ) : null}
        {passwordNotice ? (
          <p className="form-banner success" role="status">
            {passwordNotice}
          </p>
        ) : null}
        <label htmlFor="current-password">
          <span>Current password</span>
          <span className="password-row">
            <input
              id="current-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
            <button
              type="button"
              className="secondary-button btn-sm"
              aria-pressed={showPassword}
              aria-controls="current-password"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </span>
        </label>
        <Field id="next-password" label="New password">
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={nextPassword}
            onChange={(event) => setNextPassword(event.target.value)}
            required
          />
        </Field>
        <Field id="confirm-password" label="Confirm new password">
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </Field>
        <button type="submit" className="primary-button" disabled={savingPassword}>
          {savingPassword ? 'Saving...' : 'Change password'}
        </button>
      </form>
    </>
  )
}
