import { useEffect, useState, type FormEvent } from 'react'
import { isStaffRole } from '../auth'
import { signInWithPassword } from '../firebaseApp'
import { navigate } from '../usePath'
import { useStaffSession } from '../useStaffSession'

export function LoginPage() {
  const { ready, account } = useStaffSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!ready || !account) return
    if (isStaffRole(account.role)) navigate('/dashboard')
    else navigate('/')
  }, [ready, account])

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    try {
      await signInWithPassword(email, password)
    } catch {
      setError('That email or password is not recognised.')
    }
  }

  return (
    <section className="card login-card">
      <p className="eyebrow-small">Staff access</p>
      <h1>Log in</h1>
      <p className="auth-copy">
        Sign in with the email and password stored for your role. A super admin can add the church administrator from the dashboard.
      </p>
      {error ? (
        <p className="auth-message error" role="alert">
          {error}
        </p>
      ) : null}
      <form className="stack-form" onSubmit={(event) => void signIn(event)}>
        <label>
          Email
          <input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <button type="submit" className="primary-button" disabled={!ready}>
          Log in
        </button>
      </form>
    </section>
  )
}
