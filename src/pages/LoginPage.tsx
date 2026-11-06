import { useEffect, useState } from 'react'
import { isStaffRole } from '../auth'
import { signInWithGoogle } from '../firebaseApp'
import { navigate } from '../usePath'
import { useStaffSession } from '../useStaffSession'

export function LoginPage() {
  const { ready, account } = useStaffSession()
  const [error, setError] = useState('')

  useEffect(() => {
    if (!ready || !account) return
    if (isStaffRole(account.role)) navigate('/dashboard')
    else navigate('/')
  }, [ready, account])

  async function signIn() {
    setError('')
    try {
      await signInWithGoogle()
    } catch {
      setError('Google sign-in did not finish. Try again.')
    }
  }

  return (
    <section className="card login-card">
      <p className="eyebrow-small">Staff access</p>
      <h1>Log in</h1>
      <p className="auth-copy">
        Sign in with Google. Your dashboard opens the work for your role: a pastor’s own appointments, the church list for a secretary, or the directory for an administrator.
      </p>
      {error ? (
        <p className="auth-message error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="button" className="primary-button" onClick={() => void signIn()} disabled={!ready}>
        Continue with Google
      </button>
      <p className="auth-copy demo-note">
        Local Firebase asks which Google account to use. Administrator: ruth.owusu@grace.example. Pastor: james.adebayo@grace.example.
        Secretary: ama.mensah@grace.example.
      </p>
    </section>
  )
}
