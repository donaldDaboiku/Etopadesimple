import { useEffect, useState, type FormEvent } from 'react'
import { isStaffRole } from '../auth'
import { registerChurch } from '../churchApi'
import { Field } from '../Field'
import { validateChurchSignup, type ChurchSignup } from '../signup'
import { navigate } from '../usePath'
import { reloadStaffSession, useStaffSession } from '../useStaffSession'
import { AppLink } from '../AppLink'

const emptySignup = (): ChurchSignup => ({
  churchName: '',
  adminName: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const formErrors = {
  exists: 'That email is already registered. Sign in instead.',
  unavailable: 'The church could not be registered. Check your connection and try again.',
  invalid: 'Check the church name, your name, and the password, then try again.',
}

export function SignupPage() {
  const { ready, account } = useStaffSession()
  const [form, setForm] = useState<ChurchSignup>(emptySignup)
  const [errors, setErrors] = useState<ReturnType<typeof validateChurchSignup>>({})
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!ready || !account || !isStaffRole(account.role)) return
    navigate('/dashboard')
  }, [ready, account])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateChurchSignup(form)
    setErrors(nextErrors)
    setFormError('')
    if (nextErrors.churchName || nextErrors.adminName || nextErrors.email || nextErrors.password || nextErrors.confirmPassword) {
      return
    }
    setBusy(true)
    try {
      const saved = await registerChurch(form)
      if ('error' in saved) {
        setFormError(formErrors[saved.error])
        return
      }
      reloadStaffSession()
      navigate('/dashboard')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card login-card">
      <img className="page-logo" src="/logo.png" alt="ETOPADE" width={88} height={88} />
      <p className="eyebrow">Church administrator</p>
      <h1>Register your church</h1>
      <p className="auth-copy">
        Create the administrator account for your church. You can then add pastors and secretaries for that church only.
      </p>
      {formError ? (
        <p className="auth-message error" role="alert">
          {formError}
        </p>
      ) : null}
      <form className="stack-form" onSubmit={(event) => void submit(event)} noValidate>
        <Field id="signup-church" label="Church name" error={errors.churchName}>
          <input
            value={form.churchName}
            autoComplete="organization"
            onChange={(event) => setForm({ ...form, churchName: event.target.value })}
          />
        </Field>
        <Field id="signup-name" label="Your name" error={errors.adminName}>
          <input
            value={form.adminName}
            autoComplete="name"
            onChange={(event) => setForm({ ...form, adminName: event.target.value })}
          />
        </Field>
        <Field id="signup-email" label="Email" error={errors.email}>
          <input
            type="email"
            autoComplete="username"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </Field>
        <label htmlFor="signup-password">
          <span>Password</span>
          <span className="password-row">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.password}
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? 'signup-password-error' : undefined}
              className={errors.password ? 'input-invalid' : undefined}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
            <button
              type="button"
              className="secondary-button btn-sm"
              aria-pressed={showPassword}
              aria-controls="signup-password"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </span>
          {errors.password ? (
            <small id="signup-password-error" className="field-error">
              {errors.password}
            </small>
          ) : null}
        </label>
        <Field id="signup-confirm" label="Confirm password" error={errors.confirmPassword}>
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
          />
        </Field>
        <button type="submit" className="primary-button" disabled={!ready || busy}>
          {busy ? 'Creating your church...' : 'Create church account'}
        </button>
      </form>
      <p className="auth-copy">
        Already have an account? <AppLink to="/login">Log in</AppLink>
      </p>
    </section>
  )
}
