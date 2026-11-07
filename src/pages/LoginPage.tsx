import { useEffect, useState, type FormEvent } from 'react'
import { isStaffRole } from '../auth'
import { loadAccount } from '../churchApi'
import { auth, signInWithPassword, signOutStaff } from '../firebaseApp'
import { navigate } from '../usePath'
import { useStaffSession } from '../useStaffSession'

const notCreated = 'An administrator must create your account before you can sign in.'

export function LoginPage() {
  const { ready, account } = useStaffSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!ready || !account) return
    if (isStaffRole(account.role)) navigate('/dashboard')
    else navigate('/')
  }, [ready, account])

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      try {
        await signInWithPassword(email, password)
      } catch {
        setError('That email or password is not recognised.')
        return
      }
      try {
        const staff = auth.currentUser ? await loadAccount(auth.currentUser) : null
        if (!staff) {
          await signOutStaff()
          setError(notCreated)
        }
      } catch {
        await signOutStaff().catch(() => undefined)
        setError(notCreated)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card login-card">
      <img className="page-logo" src="/logo.png" alt="ETOPADE" width={88} height={88} />
      <p className="eyebrow">Staff access</p>
      <h1>Log in</h1>
      <p className="auth-copy">
        An administrator creates your account first. Sign in with the email and password they gave you.
      </p>
      {error ? (
        <p className="auth-message error" role="alert">
          {error}
        </p>
      ) : null}
      <form className="stack-form" onSubmit={(event) => void signIn(event)}>
        <label>
          Email
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label htmlFor="login-password">
          Password
          <span className="password-row">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              className="secondary-button btn-sm"
              aria-pressed={showPassword}
              aria-controls="login-password"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </span>
        </label>
        <button type="submit" className="primary-button" disabled={!ready || busy}>
          {busy ? 'Signing in...' : 'Log in'}
        </button>
      </form>
    </section>
  )
}
