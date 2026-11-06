import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

const projectId = import.meta.env?.VITE_FIREBASE_PROJECT_ID || 'etopade-demo'
const useCloud = Boolean(import.meta.env?.VITE_FIREBASE_PROJECT_ID)

export const firebaseApp = initializeApp({
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || 'localhost',
  projectId,
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || 'demo-app-id',
})

export const auth = getAuth(firebaseApp)
export const db = getFirestore(firebaseApp)

const emulatorFlag = globalThis as typeof globalThis & { __etopadeEmulator?: boolean }
if (!useCloud && !emulatorFlag.__etopadeEmulator) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8088)
  emulatorFlag.__etopadeEmulator = true
}

export function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  return signInWithPopup(auth, provider)
}

export function signOutStaff() {
  return signOut(auth)
}
