import { useEffect, useState, type FormEvent } from 'react'
import { AppLink } from '../AppLink'
import { visitorBooking } from '../auth'
import { defaultSchedule, monthKey, shiftMonth, slotsOn, type WeekSchedule } from '../availability'
import { createBooking, listOpenSlotKeys, listPastors, listSchedules } from '../churchApi'
import { formatLongDate, formatTime } from '../format'
import { useStaffSession } from '../useStaffSession'
import { Field } from '../Field'
import { MonthCalendar } from '../MonthCalendar'
import {
  appointmentTypes,
  emptyBooking,
  formatIsoDate,
  pastors,
  slotKey,
  validateBooking,
  type BookingDraft,
  type BookingErrors,
} from '../validation'

const DRAFT_KEY = 'etopade.booking.draft'
const SESSION_KEY = 'etopade.booking.session'
const fieldOrder: (keyof BookingDraft)[] = [
  'pastorId',
  'appointmentTypeId',
  'date',
  'contactMethod',
  'slot',
  'meetingMode',
  'fullName',
  'email',
  'phone',
  'membership',
  'notes',
]
const loadError = 'We could not load open times. Refresh the page and try again.'

type Confirmation = {
  reference: string
  pastor: string
  category: string
  when: string
}

type SessionForm = {
  draft: BookingDraft
  confirmation: Confirmation | null
  notice: string
}

function readStoredDraft(): BookingDraft {
  const draft = emptyBooking()
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return draft
    const parsed = JSON.parse(raw) as Record<string, unknown>
    for (const key of Object.keys(draft) as (keyof BookingDraft)[]) {
      if (typeof parsed[key] === 'string') draft[key] = parsed[key]
    }
  } catch {
    return emptyBooking()
  }
  return draft
}

function applyPastorQuery(draft: BookingDraft) {
  const requested = new URLSearchParams(window.location.search).get('pastor')
  if (requested && pastors.some((pastor) => pastor.id === requested)) draft.pastorId = requested
  return draft
}

function readSession(): SessionForm {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as SessionForm
      const draft = emptyBooking()
      for (const key of Object.keys(draft) as (keyof BookingDraft)[]) {
        if (typeof parsed.draft?.[key] === 'string') draft[key] = parsed.draft[key]
      }
      return {
        draft: applyPastorQuery(draft),
        confirmation: parsed.confirmation ?? null,
        notice: typeof parsed.notice === 'string' ? parsed.notice : '',
      }
    }
  } catch {
    // Fall through to the saved draft.
  }
  return { draft: applyPastorQuery(readStoredDraft()), confirmation: null, notice: '' }
}

function storeSession(value: SessionForm) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(value))
  } catch {
    // The form still works for this visit when storage is blocked.
  }
}

export function BookingPage() {
  const { ready, account, organisationId } = useStaffSession()
  const [session, setSession] = useState<SessionForm>(readSession)
  const [errors, setErrors] = useState<BookingErrors>({})
  const [pastorOptions, setPastorOptions] = useState(pastors)
  const [taken, setTaken] = useState<string[]>([])
  const [schedules, setSchedules] = useState<Record<string, WeekSchedule>>({})
  const [serviceError, setServiceError] = useState('')
  const [saving, setSaving] = useState(false)
  const [{ today, maxDate, cursor }] = useState(() => {
    const now = new Date()
    const latest = new Date(now)
    latest.setDate(latest.getDate() + 90)
    return {
      today: formatIsoDate(now),
      maxDate: formatIsoDate(latest),
      cursor: { year: now.getFullYear(), month: now.getMonth() },
    }
  })
  const [monthCursor, setMonthCursor] = useState(cursor)
  const { draft, confirmation, notice } = session

  useEffect(() => {
    if (!ready) return
    listPastors(organisationId)
      .then((rows) => {
        if (rows.length > 0 || organisationId !== 'grace') setPastorOptions(rows)
      })
      .catch(() => setServiceError(loadError))
    listOpenSlotKeys(organisationId)
      .then(setTaken)
      .catch(() => setServiceError(loadError))
    listSchedules(organisationId)
      .then(setSchedules)
      .catch(() => setServiceError(loadError))
  }, [ready, organisationId])

  function saveSession(next: SessionForm) {
    storeSession(next)
    setSession(next)
  }

  function update<K extends keyof BookingDraft>(key: K, value: BookingDraft[K]) {
    saveSession({ ...session, draft: { ...draft, [key]: value }, notice: '' })
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  function scheduleFor(pastorId: string) {
    return schedules[pastorId] ?? defaultSchedule()
  }

  function choosePastor(pastorId: string) {
    const offered = draft.date ? slotsOn(scheduleFor(pastorId), draft.date) : []
    saveSession({
      ...session,
      draft: { ...draft, pastorId, slot: offered.includes(draft.slot) ? draft.slot : '' },
      notice: '',
    })
    setErrors((current) => ({ ...current, pastorId: undefined, slot: undefined, date: undefined }))
  }

  function chooseDate(date: string) {
    const offered = slotsOn(scheduleFor(draft.pastorId), date)
    saveSession({
      ...session,
      draft: { ...draft, date, slot: offered.includes(draft.slot) ? draft.slot : '' },
      notice: '',
    })
    setErrors((current) => ({ ...current, date: undefined, slot: undefined }))
  }

  function saveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    saveSession({ ...session, notice: 'Draft saved on this device.' })
  }

  function startAnother() {
    saveSession({ draft: applyPastorQuery(emptyBooking()), confirmation: null, notice: '' })
    setErrors({})
    setServiceError('')
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateBooking(
      draft,
      new Date(),
      taken,
      pastorOptions.map((pastor) => pastor.id),
      scheduleFor(draft.pastorId),
    )
    setErrors(nextErrors)
    const firstInvalid = fieldOrder.find((key) => nextErrors[key])
    if (firstInvalid) {
      saveSession({ ...session, confirmation: null })
      document.getElementById(`field-${firstInvalid}`)?.focus()
      return
    }

    setSaving(true)
    setServiceError('')
    try {
      const saved = await createBooking(organisationId, draft)
      setTaken(await listOpenSlotKeys(organisationId))
      if ('error' in saved) {
        if (saved.error === 'closed') {
          setErrors({ date: 'That pastor is not available on this day.' })
          document.getElementById('field-date')?.focus()
          return
        }
        setErrors({ slot: 'That time is already requested for this pastor.' })
        document.getElementById('field-slot')?.focus()
        return
      }
      const pastor = pastorOptions.find((item) => item.id === draft.pastorId)?.name ?? 'Pastor'
      const category = appointmentTypes.find((item) => item.id === draft.appointmentTypeId)?.name ?? 'Appointment'
      localStorage.removeItem(DRAFT_KEY)
      saveSession({
        draft: { ...draft, slot: '', notes: '' },
        confirmation: {
          reference: saved.record.booking_reference,
          pastor,
          category,
          when: `${formatLongDate(draft.date)} at ${formatTime(draft.slot)}`,
        },
        notice: '',
      })
    } catch {
      setServiceError('Your request could not be sent. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!ready) return <p className="auth-copy">Checking sign-in...</p>
  if (!visitorBooking(account?.role)) return null

  if (confirmation) {
    return (
      <section className="card login-card">
        <p className="eyebrow">Request received</p>
        <h1>Your request is in</h1>
        <p className="auth-copy">Keep this reference number. The pastor will confirm or decline.</p>
        <p className="reference">{confirmation.reference}</p>
        <p className="auth-copy">
          {confirmation.pastor} · {confirmation.category} · {confirmation.when}
        </p>
        <div className="cta-row">
          <button type="button" className="primary-button" onClick={startAnother}>
            Make another request
          </button>
          <AppLink className="secondary-button" to="/">
            Back to home
          </AppLink>
        </div>
      </section>
    )
  }

  const pastorName = pastorOptions.find((pastor) => pastor.id === draft.pastorId)?.name ?? 'Choose a pastor'
  const purposeName = appointmentTypes.find((item) => item.id === draft.appointmentTypeId)?.name ?? 'Choose a purpose'
  const whenLabel =
    draft.date && draft.slot
      ? `${formatLongDate(draft.date)} at ${formatTime(draft.slot)}`
      : draft.date
        ? `${formatLongDate(draft.date)} — choose a time`
        : 'Choose a day and time'
  const offeredSlots = draft.date ? slotsOn(scheduleFor(draft.pastorId), draft.date) : []

  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Booking</p>
        <h1>Request a time</h1>
        <p className="auth-copy">Choose a pastor, an open time, and how we should reach you.</p>
      </header>
      <div className="content-grid">
        <form className="booking-form card" aria-label="Public booking form" onSubmit={(event) => void submitBooking(event)} noValidate>
          {serviceError ? (
            <p className="form-banner error" role="alert">
              {serviceError}
            </p>
          ) : null}
          {notice ? (
            <p className="form-banner success" role="status">
              {notice}
            </p>
          ) : null}

          <fieldset>
            <legend>1. Who and why</legend>
            <div className="field-grid">
              <Field id="field-pastorId" label="Pastor" error={errors.pastorId}>
                <select value={draft.pastorId} onChange={(event) => choosePastor(event.target.value)}>
                  {pastorOptions.map((pastor) => (
                    <option key={pastor.id} value={pastor.id}>
                      {pastor.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="field-appointmentTypeId" label="Purpose" error={errors.appointmentTypeId}>
                <select value={draft.appointmentTypeId} onChange={(event) => update('appointmentTypeId', event.target.value)}>
                  {appointmentTypes.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="slot-group">
              <span id="meeting-mode-label" className="meeting-label">
                In person or online
              </span>
              <div
                id="field-meetingMode"
                className="choice-row"
                role="radiogroup"
                aria-labelledby="meeting-mode-label"
                tabIndex={-1}
              >
                <label className={draft.meetingMode === 'physical' ? 'choice is-selected' : 'choice'}>
                  <input
                    type="radio"
                    name="meetingMode"
                    value="physical"
                    checked={draft.meetingMode === 'physical'}
                    onChange={() => update('meetingMode', 'physical')}
                  />
                  In person
                </label>
                <label className={draft.meetingMode === 'virtual' ? 'choice is-selected' : 'choice'}>
                  <input
                    type="radio"
                    name="meetingMode"
                    value="virtual"
                    checked={draft.meetingMode === 'virtual'}
                    onChange={() => update('meetingMode', 'virtual')}
                  />
                  Online
                </label>
              </div>
              {errors.meetingMode ? <small className="field-error">{errors.meetingMode}</small> : null}
            </div>
          </fieldset>

          <fieldset>
            <legend>2. Date and time</legend>
            <div id="field-date" tabIndex={-1}>
              <MonthCalendar
                year={monthCursor.year}
                month={monthCursor.month}
                onPrev={() => setMonthCursor((current) => shiftMonth(current, -1))}
                onNext={() => setMonthCursor((current) => shiftMonth(current, 1))}
                prevDisabled={monthKey(monthCursor) <= today.slice(0, 7)}
                nextDisabled={monthKey(monthCursor) >= maxDate.slice(0, 7)}
                dayPressed={(date) => draft.date === date}
                dayDisabled={(date, inMonth) =>
                  !inMonth || date < today || date > maxDate || slotsOn(scheduleFor(draft.pastorId), date).length === 0
                }
                dayClass={(date, inMonth) => {
                  if (!inMonth || date < today || date > maxDate) return 'outside'
                  const offered = slotsOn(scheduleFor(draft.pastorId), date)
                  if (offered.length === 0) return 'closed'
                  if (offered.every((slot) => taken.includes(slotKey(draft.pastorId, date, slot)))) return 'taken'
                  return 'open'
                }}
                onPick={chooseDate}
              />
              <ul className="legend">
                <li>
                  <span className="swatch open" aria-hidden="true" /> Open
                </li>
                <li>
                  <span className="swatch taken" aria-hidden="true" /> Fully booked
                </li>
                <li>
                  <span className="swatch closed" aria-hidden="true" /> Closed
                </li>
                <li>
                  <span className="swatch selected" aria-hidden="true" /> Selected
                </li>
              </ul>
              {errors.date ? <small className="field-error">{errors.date}</small> : null}
            </div>
            <div className="slot-group" id="field-slot" tabIndex={-1}>
              <span>Available times</span>
              {!draft.date ? (
                <p className="auth-copy">Choose an open day to see this pastor’s times.</p>
              ) : offeredSlots.length === 0 ? (
                <p className="auth-copy">That pastor does not take appointments on this day.</p>
              ) : (
                <div className="slot-list" role="group" aria-describedby={errors.slot ? 'field-slot-error' : undefined}>
                  {offeredSlots.map((slot) => {
                    const unavailable = taken.includes(slotKey(draft.pastorId, draft.date, slot))
                    const label = formatTime(slot)
                    return (
                      <button
                        type="button"
                        key={slot}
                        className="slot-button"
                        aria-pressed={draft.slot === slot}
                        disabled={unavailable}
                        onClick={() => update('slot', slot)}
                      >
                        {unavailable ? `${label} (taken)` : label}
                      </button>
                    )
                  })}
                </div>
              )}
              {errors.slot ? (
                <small id="field-slot-error" className="field-error">
                  {errors.slot}
                </small>
              ) : null}
            </div>
          </fieldset>

          <fieldset>
            <legend>3. How to reach you</legend>
            <div className="field-grid">
              <Field id="field-fullName" label="Full name" error={errors.fullName}>
                <input type="text" autoComplete="name" value={draft.fullName} onChange={(event) => update('fullName', event.target.value)} />
              </Field>
              <Field id="field-email" label="Email address" error={errors.email}>
                <input type="email" autoComplete="email" value={draft.email} onChange={(event) => update('email', event.target.value)} />
              </Field>
              <Field id="field-contactMethod" label="Contact method" error={errors.contactMethod}>
                <select value={draft.contactMethod} onChange={(event) => update('contactMethod', event.target.value)}>
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                </select>
              </Field>
              <Field
                id="field-phone"
                label={draft.contactMethod === 'email' ? 'Phone number (optional)' : 'Phone number'}
                error={errors.phone}
              >
                <input type="tel" autoComplete="tel" value={draft.phone} onChange={(event) => update('phone', event.target.value)} />
              </Field>
              <Field id="field-membership" label="Church membership" error={errors.membership}>
                <input
                  type="text"
                  placeholder="Optional"
                  value={draft.membership}
                  onChange={(event) => update('membership', event.target.value)}
                />
              </Field>
            </div>
            <label className="notes-field" htmlFor="field-notes">
              <span className="label-row">
                <span>Notes</span>
                <span className="counter">
                  {draft.notes.length}/1000
                </span>
              </span>
              <textarea
                id="field-notes"
                rows={4}
                value={draft.notes}
                aria-invalid={errors.notes ? true : undefined}
                aria-describedby={errors.notes ? 'field-notes-error' : undefined}
                className={errors.notes ? 'input-invalid' : undefined}
                onChange={(event) => update('notes', event.target.value)}
              />
              {errors.notes ? (
                <small id="field-notes-error" className="field-error">
                  {errors.notes}
                </small>
              ) : null}
            </label>
          </fieldset>

          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={saveDraft}>
              Save draft
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'Sending...' : 'Submit request'}
            </button>
          </div>
        </form>

        <aside className="card panel request-summary" aria-label="Your request">
          <h2>Your request</h2>
          <dl className="summary-list">
            <div>
              <dt>Pastor</dt>
              <dd>{pastorName}</dd>
            </div>
            <div>
              <dt>Purpose</dt>
              <dd>{purposeName}</dd>
            </div>
            <div>
              <dt>When</dt>
              <dd>{whenLabel}</dd>
            </div>
            <div>
              <dt>Meeting</dt>
              <dd>{draft.meetingMode === 'virtual' ? 'Online' : 'In person'}</dd>
            </div>
          </dl>
          <h3>Before you send</h3>
          <ul className="tip-list">
            <li>Pick an open day. Closed days follow that pastor’s own hours.</li>
            <li>A time marked taken is already requested.</li>
            <li>Leave a short note if the pastor should prepare for you.</li>
          </ul>
        </aside>
      </div>
    </>
  )
}
