import { useState, type FormEvent } from 'react'
import { activeSlotKeys, commitBooking, describeBooking, readBookings } from '../bookings'
import { Field } from '../Field'
import {
  SLOT_TIMES,
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

const findings = [
  'Name, email, phone, notice period, and the 90-day window are checked before submit.',
  'A pending booking already stored for that pastor and time is rejected.',
  'Each accepted request is stored as a pending booking for Grace Fellowship.',
  'Visitors can request a booking without reading private appointment records.',
]

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
  const [session, setSession] = useState<SessionForm>(readSession)
  const [errors, setErrors] = useState<BookingErrors>({})
  const [taken, setTaken] = useState<string[]>(() => activeSlotKeys(readBookings()))
  const [{ today, maxDate }] = useState(() => {
    const now = new Date()
    const latest = new Date(now)
    latest.setDate(latest.getDate() + 90)
    return { today: formatIsoDate(now), maxDate: formatIsoDate(latest) }
  })
  const { draft, confirmation, notice } = session

  function saveSession(next: SessionForm) {
    storeSession(next)
    setSession(next)
  }

  function update<K extends keyof BookingDraft>(key: K, value: BookingDraft[K]) {
    saveSession({ ...session, draft: { ...draft, [key]: value }, notice: '' })
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  function saveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    saveSession({ ...session, notice: 'Draft saved on this device.' })
  }

  function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateBooking(draft, new Date(), taken)
    setErrors(nextErrors)
    const firstInvalid = fieldOrder.find((key) => nextErrors[key])
    if (firstInvalid) {
      saveSession({ ...session, confirmation: null })
      document.getElementById(`field-${firstInvalid}`)?.focus()
      return
    }

    const saved = commitBooking(draft)
    setTaken(activeSlotKeys(readBookings()))
    if ('error' in saved) {
      setErrors({ slot: 'That time is already requested for this pastor.' })
      document.getElementById('field-slot')?.focus()
      return
    }
    const pastor = pastors.find((item) => item.id === draft.pastorId)?.name ?? 'Pastor'
    const category = appointmentTypes.find((item) => item.id === draft.appointmentTypeId)?.name ?? 'Appointment'
    localStorage.removeItem(DRAFT_KEY)
    saveSession({
      draft: { ...draft, slot: '', notes: '' },
      confirmation: {
        reference: saved.record.booking_reference,
        pastor,
        category,
        when: describeBooking(saved.record).when,
      },
      notice: '',
    })
  }

  return (
    <section className="content-grid">
      <form className="booking-form card" aria-label="Public booking form" onSubmit={submitBooking} noValidate>
        <div className="section-header">
          <div>
            <p className="eyebrow-small">Public booking portal</p>
            <h2>Request an appointment</h2>
          </div>
          <span className="status-pill">Open</span>
        </div>

        {confirmation ? (
          <p className="form-banner success" role="status">
            Request {confirmation.reference} is pending for {confirmation.pastor}, {confirmation.category}, on {confirmation.when}.
          </p>
        ) : null}
        {notice ? (
          <p className="form-banner success" role="status">
            {notice}
          </p>
        ) : null}

        <div className="field-grid">
          <Field id="field-pastorId" label="Select pastor" error={errors.pastorId}>
            <select value={draft.pastorId} onChange={(event) => update('pastorId', event.target.value)}>
              {pastors.map((pastor) => (
                <option key={pastor.id} value={pastor.id}>
                  {pastor.name}
                </option>
              ))}
            </select>
          </Field>

          <Field id="field-appointmentTypeId" label="Appointment category" error={errors.appointmentTypeId}>
            <select value={draft.appointmentTypeId} onChange={(event) => update('appointmentTypeId', event.target.value)}>
              {appointmentTypes.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>

          <Field id="field-date" label="Preferred date" error={errors.date}>
            <input type="date" min={today} max={maxDate} value={draft.date} onChange={(event) => update('date', event.target.value)} />
          </Field>

          <Field id="field-contactMethod" label="Contact method" error={errors.contactMethod}>
            <select value={draft.contactMethod} onChange={(event) => update('contactMethod', event.target.value)}>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
            </select>
          </Field>
        </div>

        <div className="slot-group" id="field-slot" tabIndex={-1}>
          <span>Available time slots</span>
          <div className="slot-list" role="group" aria-describedby={errors.slot ? 'field-slot-error' : undefined}>
            {SLOT_TIMES.map((slot) => {
              const unavailable = draft.date !== '' && taken.includes(slotKey(draft.pastorId, draft.date, slot))
              return (
                <button
                  type="button"
                  key={slot}
                  className="slot-button"
                  aria-pressed={draft.slot === slot}
                  disabled={unavailable}
                  onClick={() => update('slot', slot)}
                >
                  {unavailable ? `${slot} taken` : slot}
                </button>
              )
            })}
          </div>
          {errors.slot ? (
            <small id="field-slot-error" className="field-error">
              {errors.slot}
            </small>
          ) : null}
        </div>

        <div className="meeting-mode">
          <span id="meeting-mode-label">Meeting type</span>
          <div className="toggle-row" role="radiogroup" aria-labelledby="meeting-mode-label">
            <label>
              <input
                type="radio"
                name="meetingMode"
                value="physical"
                checked={draft.meetingMode === 'physical'}
                onChange={() => update('meetingMode', 'physical')}
              />
              Physical
            </label>
            <label>
              <input
                type="radio"
                name="meetingMode"
                value="virtual"
                checked={draft.meetingMode === 'virtual'}
                onChange={() => update('meetingMode', 'virtual')}
              />
              Virtual
            </label>
          </div>
          {errors.meetingMode ? <small className="field-error">{errors.meetingMode}</small> : null}
        </div>

        <div className="field-grid compact">
          <Field id="field-fullName" label="Full name" error={errors.fullName}>
            <input type="text" autoComplete="name" value={draft.fullName} onChange={(event) => update('fullName', event.target.value)} />
          </Field>
          <Field id="field-email" label="Email address" error={errors.email}>
            <input type="email" autoComplete="email" value={draft.email} onChange={(event) => update('email', event.target.value)} />
          </Field>
          <Field id="field-phone" label="Phone number" error={errors.phone}>
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
          <span>Appointment notes</span>
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

        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={saveDraft}>
            Save draft
          </button>
          <button type="submit" className="primary-button">
            Submit request
          </button>
        </div>
      </form>

      <aside className="audit-panel card" aria-label="Validation status">
        <p className="eyebrow-small">Validation</p>
        <h2>What is checked</h2>
        <ul className="audit-list">
          {findings.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="next-steps">
          <h3>Next milestones</h3>
          <ul>
            <li>Pastor and administrator dashboards</li>
            <li>Notifications</li>
            <li>Sync these rows to Supabase</li>
          </ul>
        </div>
      </aside>
    </section>
  )
}
