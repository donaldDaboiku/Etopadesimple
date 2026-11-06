import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

const projectId = import.meta.env?.VITE_FIREBASE_PROJECT_ID || 'etopade-demo'
const useCloud = Boolean(import.meta.env?.VITE_FIREBASE_PROJECT_ID)
// localhost and 127.0.0.1 are different sites. The Auth emulator popup can only see the app's helper frame when both use the same host.
const emulatorHost = globalThis.location?.hostname === '127.0.0.1' ? '127.0.0.1' : 'localhost'

export const firebaseApp = initializeApp({
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: useCloud ? import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || 'localhost' : emulatorHost,
  projectId,
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || 'demo-app-id',
})

export const auth = getAuth(firebaseApp)
export const db = getFirestore(firebaseApp)

const emulatorFlag = globalThis as typeof globalThis & { __etopadeEmulator?: boolean }
if (!useCloud && !emulatorFlag.__etopadeEmulator) {
  connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true })
  connectFirestoreEmulator(db, emulatorHost, 8088)
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
