import { useState, type FormEvent } from 'react'
import { LOCAL_STAFF_PASSWORD, authenticate, reportView } from '../auth'
import { Field } from '../Field'
import { writeStaffSession } from '../staffSession'
import { navigate } from '../usePath'
import { validateSignIn } from '../validation'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateSignIn(email, password)
    setErrors(nextErrors)
    setFormError('')
    if (nextErrors.email || nextErrors.password) return
    const account = authenticate(email, password)
    if (!account) {
      setFormError('Email or password is not recognised.')
      return
    }
    writeStaffSession({ email: account.email, name: account.name, role: account.role })
    setPassword('')
    navigate(reportView(account.role) ? '/reports' : '/')
  }

  return (
    <section className="card login-card">
      <p className="eyebrow-small">Staff access</p>
      <h1>Log in</h1>
      <p className="auth-copy">
        Sign in with your staff email. A pastor opens their own report. A secretary opens the church report.
      </p>
      <form className="stack-form" onSubmit={submit} noValidate>
        {formError ? (
          <p className="auth-message error" role="alert">
            {formError}
          </p>
        ) : null}
        <Field id="sign-in-email" label="Email address" error={errors.email}>
          <input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} />
        </Field>
        <Field id="sign-in-password" label="Password" error={errors.password}>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <button type="submit" className="primary-button">
          Continue
        </button>
      </form>
      <p className="auth-copy demo-note">
        Local password: {LOCAL_STAFF_PASSWORD}. Pastor: james.adebayo@grace.example. Secretary: ama.mensah@grace.example.
      </p>
    </section>
  )
}
