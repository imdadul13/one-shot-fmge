export const FIREBASE_EMULATOR_URLS = {
  auth: 'http://127.0.0.1:9099',
  firestoreHost: '127.0.0.1',
  firestorePort: 8080,
} as const;

export function shouldUseFirebaseEmulators(dev: boolean, flag: string | undefined): boolean {
  return dev === true && flag === 'true';
}