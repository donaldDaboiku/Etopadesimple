import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const projectId = process.env.FIREBASE_PROJECT_ID || 'etopade'
const email = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase()
const password = process.env.SUPER_ADMIN_PASSWORD || ''
const name = (process.env.SUPER_ADMIN_NAME || 'Super admin').trim()
const churchName = (process.env.CHURCH_NAME || 'Grace Fellowship').trim()

if (projectId === 'etopade-demo' || projectId === 'opsrecord') {
  console.error(`Refusing to bootstrap ${projectId}.`)
  process.exit(1)
}
if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.error('Unset the emulator hosts before bootstrapping the cloud project.')
  process.exit(1)
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 6 || name.length < 2) {
  console.error('Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD. The password needs at least 6 characters.')
  process.exit(1)
}

initializeApp({ projectId, credential: applicationDefault() })
const auth = getAuth()
let user
try {
  user = await auth.getUserByEmail(email)
} catch (error) {
  if (error?.code !== 'auth/user-not-found') throw error
  user = await auth.createUser({ email, password, displayName: name, emailVerified: true })
}

const db = getFirestore()
const org = db.collection('organisations').doc('grace')
const member = org.collection('members').doc(email)
const snap = await member.get()
if (!snap.exists) {
  await org.set({ name: churchName }, { merge: true })
  await member.set({
    email,
    name,
    role: 'super_admin',
    pastorId: null,
    uid: user.uid,
    status: 'active',
  })
}

console.log(`Super admin is ready for ${email} on ${projectId}.`)
