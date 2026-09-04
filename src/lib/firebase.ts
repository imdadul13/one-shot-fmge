import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { shouldUseFirebaseEmulators, FIREBASE_EMULATOR_URLS } from '../utils/firebaseEmulatorConfig';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore using the specific databaseId configured in firebase-applet-config
export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined
);

// Only connect to local emulators in development mode when the explicit flag is enabled.
// import.meta.env is only available inside Vite — guard with optional chaining so that
// tsx/Node test runners that import this module transitively do not crash.
if (shouldUseFirebaseEmulators(import.meta.env?.DEV === true, import.meta.env?.VITE_USE_FIREBASE_EMULATORS)) {
  console.log('[EMULATORS] Connected to local Firebase Auth & Firestore emulators (127.0.0.1:9099 / 8080)');
  connectAuthEmulator(auth, FIREBASE_EMULATOR_URLS.auth, { disableWarnings: true });
  connectFirestoreEmulator(db, FIREBASE_EMULATOR_URLS.firestoreHost, FIREBASE_EMULATOR_URLS.firestorePort);
}

export default app;