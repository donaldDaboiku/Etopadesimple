import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8088'
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099'

initializeApp({ projectId: 'etopade-demo' })
const db = getFirestore()
const auth = getAuth()

const localSuperAdmin = {
  email: 'superadmin@etopade.local',
  password: 'etopade-admin',
  name: 'Super admin',
}

const pastors = [
  { id: 'd1111111-1111-4111-8111-111111111111', name: 'Pastor James Adebayo', email: 'james.adebayo@grace.example' },
  { id: 'd2222222-2222-4222-8222-222222222222', name: 'Pastor Esther Moyo', email: 'esther.moyo@grace.example' },
  { id: 'd3333333-3333-4333-8333-333333333333', name: 'Pastor Daniel Okafor', email: 'daniel.okafor@grace.example' },
]

async function createIfMissing(ref, data) {
  const snap = await ref.get()
  if (!snap.exists) await ref.set(data)
}

const org = db.collection('organisations').doc('grace')
await createIfMissing(org, { name: 'Grace Fellowship' })

const weekdayHours = {
  weekdays: [1, 2, 3, 4, 5],
  slots: ['09:00', '09:30', '10:15', '11:00', '13:30', '15:00', '15:45'],
  blockedDates: [],
}

for (const pastor of pastors) {
  await createIfMissing(org.collection('pastors').doc(pastor.id), { name: pastor.name, active: true })
  await createIfMissing(org.collection('members').doc(pastor.email), {
    email: pastor.email,
    name: pastor.name,
    role: 'pastor',
    pastorId: pastor.id,
    uid: null,
    status: 'invited',
  })
}

await createIfMissing(org.collection('members').doc('ama.mensah@grace.example'), {
  email: 'ama.mensah@grace.example',
  name: 'Ama Mensah',
  role: 'secretary',
  pastorId: null,
  uid: null,
  status: 'invited',
})

const pastorDocs = await org.collection('pastors').get()
for (const pastor of pastorDocs.docs) {
  await createIfMissing(org.collection('availability').doc(pastor.id), weekdayHours)
}

await createIfMissing(org.collection('members').doc('ruth.owusu@grace.example'), {
  email: 'ruth.owusu@grace.example',
  name: 'Ruth Owusu',
  role: 'church_admin',
  pastorId: null,
  uid: null,
  status: 'invited',
})

await createIfMissing(org.collection('members').doc(localSuperAdmin.email), {
  email: localSuperAdmin.email,
  name: localSuperAdmin.name,
  role: 'super_admin',
  pastorId: null,
  uid: null,
  status: 'invited',
})

try {
  await auth.getUserByEmail(localSuperAdmin.email)
} catch (error) {
  if (error?.code !== 'auth/user-not-found') throw error
  await auth.createUser({
    email: localSuperAdmin.email,
    password: localSuperAdmin.password,
    displayName: localSuperAdmin.name,
    emailVerified: true,
  })
}

console.log('Seeded Grace Fellowship in the Firebase emulator.')
console.log(`Local super admin: ${localSuperAdmin.email} / ${localSuperAdmin.password}`)
