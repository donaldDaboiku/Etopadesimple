import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { collection, getDocs } from 'firebase/firestore'
import { createBooking, createStaff, decideRemote, listBookings, loadAccount } from '../src/churchApi.ts'
import { auth, db } from '../src/firebaseApp.ts'

async function ensureUser(email) {
  const url = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key'
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'etopade-demo', returnSecureToken: true }),
  })
  if (!response.ok && response.status !== 400) throw new Error(await response.text())
}

async function asUser(email) {
  await signInWithEmailAndPassword(auth, email, 'etopade-demo')
  const account = await loadAccount(auth.currentUser)
  if (!account) throw new Error(`No church role for ${email}`)
  return account
}

await ensureUser('ruth.owusu@grace.example')
await ensureUser('james.adebayo@grace.example')
await ensureUser('ama.mensah@grace.example')

const admin = await asUser('ruth.owusu@grace.example')
if (admin.role !== 'church_admin') throw new Error('Ruth is not the administrator')
const added = await createStaff({ name: 'Grace Mensah', email: 'grace.mensah@grace.example', role: 'pastor', password: 'etopade-demo' })
if ('error' in added) throw new Error(`Could not add pastor: ${added.error}`)
await signOut(auth)

const pastors = await getDocs(collection(db, 'organisations', 'grace', 'pastors'))
if (!pastors.docs.some((item) => item.data().name === 'Grace Mensah')) throw new Error('New pastor was not saved')

const saved = await createBooking({
  pastorId: 'd1111111-1111-4111-8111-111111111111',
  appointmentTypeId: '33333333-3333-4333-8333-333333333333',
  date: '2026-12-01',
  slot: '09:00',
  contactMethod: 'email',
  meetingMode: 'physical',
  fullName: 'Miriam Oduro',
  email: 'miriam@example.com',
  phone: '',
  membership: '',
  notes: '',
})
if ('error' in saved) throw new Error('Public booking was rejected')

let jamesSawAll = false
await asUser('james.adebayo@grace.example')
const own = await listBookings('d1111111-1111-4111-8111-111111111111')
if (!own.some((row) => row.visitor_name === 'Miriam Oduro')) throw new Error('Pastor cannot see their booking')
try {
  await listBookings(null)
  jamesSawAll = true
} catch {
  jamesSawAll = false
}
if (jamesSawAll) throw new Error('Pastor can read every booking')
await decideRemote(saved.record.id, 'confirmed')
await signOut(auth)

await asUser('ama.mensah@grace.example')
const church = await listBookings(null)
if (!church.some((row) => row.visitor_name === 'Miriam Oduro' && row.status === 'confirmed')) {
  throw new Error('Secretary cannot see the confirmed booking')
}
await signOut(auth)

console.log('Firebase access check passed.')
process.exit(0)
