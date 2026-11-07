import { useEffect, useState, type FormEvent } from 'react'
import { isChurchAdmin, roleLabels } from '../auth'
import { Field } from '../Field'
import { createStaff, listStaff, type DirectoryMember } from '../churchApi'
import { AppLink } from '../AppLink'
import { useStaffSession } from '../useStaffSession'
import { validateStaffInvite, type StaffInvite } from '../staff'

const emptyInvite = (): StaffInvite => ({ name: '', email: '', role: 'pastor', password: '' })

export function AdminPage() {
  const { ready, account } = useStaffSession()
  const [staff, setStaff] = useState<DirectoryMember[]>([])
  const [invite, setInvite] = useState<StaffInvite>(emptyInvite)
  const [errors, setErrors] = useState<Partial<Record<'name' | 'email' | 'password' | 'form', string>>>({})
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!account || !isChurchAdmin(account.role)) return
    listStaff()
      .then(setStaff)
      .catch(() => setErrors({ form: 'The staff list could not be loaded from Firebase.' }))
  }, [account])

  if (!ready) return <p className="auth-copy">Checking sign-in...</p>
  if (!account || !isChurchAdmin(account.role)) {
    return (
      <section className="card login-card">
        <p className="eyebrow-small">Administrator only</p>
        <h1>Church admin</h1>
        <p className="auth-copy">Sign in as a church administrator or the super admin, then add the people who manage the church.</p>
        <AppLink className="primary-button" to="/login">
          Log in
        </AppLink>
      </section>
    )
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateStaffInvite(invite)
    setErrors(nextErrors)
    setNotice('')
    if (nextErrors.name || nextErrors.email || nextErrors.role || nextErrors.password) return
    const saved = await createStaff(invite)
    if ('error' in saved) {
      setErrors({ email: saved.error === 'exists' ? 'That email is already on the church directory.' : 'Check the name, email, and password.' })
      return
    }
    setInvite(emptyInvite())
    setNotice(`${invite.name.trim()} can sign in with ${saved.email}.`)
    setStaff(await listStaff())
  }

  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">{roleLabels[account.role]}</p>
        <h1>Church directory</h1>
        <p className="auth-copy">
          {account.role === 'super_admin'
            ? 'Add a pastor, a secretary, or a church administrator. They sign in with the email and password you set here.'
            : 'Add a pastor or a secretary. They sign in with the email and password you set here.'}
        </p>
      </header>
      <section className="content-grid">
        <form className="card stack-form login-card" onSubmit={(event) => void submit(event)} noValidate>
          <h2>Add a person</h2>
          {errors.form ? <p className="form-banner error">{errors.form}</p> : null}
          {notice ? <p className="form-banner success">{notice}</p> : null}
          <Field id="staff-name" label="Full name" error={errors.name}>
            <input value={invite.name} onChange={(event) => setInvite({ ...invite, name: event.target.value })} />
          </Field>
          <Field id="staff-email" label="Email address" error={errors.email}>
            <input type="email" value={invite.email} onChange={(event) => setInvite({ ...invite, email: event.target.value })} />
          </Field>
          <Field id="staff-password" label="Password" error={errors.password}>
            <input type="password" value={invite.password} onChange={(event) => setInvite({ ...invite, password: event.target.value })} />
          </Field>
          <Field id="staff-role" label="Role">
            <select value={invite.role} onChange={(event) => setInvite({ ...invite, role: event.target.value as StaffInvite['role'] })}>
              <option value="pastor">Pastor</option>
              <option value="secretary">Secretary</option>
              {account.role === 'super_admin' ? <option value="church_admin">Church admin</option> : null}
            </select>
          </Field>
          <button type="submit" className="primary-button">
            Add to the church
          </button>
        </form>
        <section className="card audit-panel report-list">
          <h2>People who can sign in</h2>
          <ul className="audit-list">
            {staff.map((person) => (
              <li key={person.email}>
                {person.name} · {roleLabels[person.role]} · {person.email} · {person.status}
              </li>
            ))}
          </ul>
        </section>
      </section>
    </>
  )
}
