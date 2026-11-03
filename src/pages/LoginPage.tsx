import { useState, type FormEvent } from 'react'
import { Field } from '../Field'
import { writeStaffSession, type StaffRole } from '../staffSession'
import { navigate } from '../usePath'
import { validateSignIn } from '../validation'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; role?: string }>({})

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateSignIn(email, password, role)
    setErrors(nextErrors)
    if (nextErrors.email || nextErrors.password || nextErrors.role) return
    writeStaffSession({ email: email.trim(), role: role as StaffRole })
    setPassword('')
    navigate('/reports')
  }

  return (
    <section className="card login-card">
      <p className="eyebrow-small">Staff access</p>
      <h1>Log in</h1>
      <p className="auth-copy">Sign in as a pastor or a secretary. Reports open after that role is accepted.</p>
      <form className="stack-form" onSubmit={submit} noValidate>
        <Field id="sign-in-role" label="Role" error={errors.role}>
          <select value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="">Choose a role</option>
            <option value="pastor">Pastor</option>
            <option value="secretary">Secretary</option>
          </select>
        </Field>
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
    </section>
  )
}
