import { initializeApp, getApps } from 'firebase/app'
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

const projectId = import.meta.env?.VITE_FIREBASE_PROJECT_ID || 'etopade-demo'
const useCloud = Boolean(import.meta.env?.VITE_FIREBASE_PROJECT_ID)
// localhost and 127.0.0.1 are different sites, so the emulator host follows the page.
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

export function signOutStaff() {
  return signOut(auth)
}

function authCode(error: unknown) {
  return error && typeof error === 'object' && 'code' in error ? String(error.code) : ''
}

export async function signInWithPassword(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
}

export async function changeOwnPassword(currentPassword: string, nextPassword: string) {
  const user = auth.currentUser
  const email = user?.email
  if (!user || !email) {
    throw Object.assign(new Error('Sign in again, then change your password.'), { code: 'auth/requires-recent-login' })
  }
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(email, currentPassword))
  await updatePassword(user, nextPassword)
}

export async function signUpWithPassword(email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
  return credential.user
}

export async function deleteSignedInUser() {
  const current = auth.currentUser
  if (!current) return
  await current.delete()
}

function secondaryStaffAuth() {
  const name = 'staff-create'
  const secondary = getApps().find((app) => app.name === name) ?? initializeApp(firebaseApp.options, name)
  const secondaryAuth = getAuth(secondary)
  if (!useCloud) {
    try {
      connectAuthEmulator(secondaryAuth, `http://${emulatorHost}:9099`, { disableWarnings: true })
    } catch {
      // The secondary app is already pointed at the emulator.
    }
  }
  return secondaryAuth
}

export async function createPasswordAccount(email: string, password: string) {
  const secondaryAuth = secondaryStaffAuth()
  const key = email.trim().toLowerCase()
  let opened = false
  try {
    try {
      await createUserWithEmailAndPassword(secondaryAuth, key, password)
    } catch (error) {
      if (authCode(error) !== 'auth/email-already-in-use') throw error
      await signInWithEmailAndPassword(secondaryAuth, key, password)
    }
    opened = true
  } finally {
    if (opened) await signOut(secondaryAuth)
  }
}
