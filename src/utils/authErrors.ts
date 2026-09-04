export type AuthErrorMode = 'google' | 'signin' | 'signup' | 'forgot';

export interface AuthErrorMessage {
  code: string;
  message: string;
}

const GENERIC = {
  invalidEmail: 'Please enter a valid email address.',
  network: 'Network error. Please check your internet connection and try again.',
  tooManyRequests: 'Too many attempts. Please wait a few minutes and try again.',
  unknown: 'Something went wrong. Please try again.',
} as const;

export function getAuthErrorCode(err: unknown): string {
  const code = (err as { code?: unknown } | null)?.code;
  return typeof code === 'string' && code ? code : 'auth/unknown-error';
}

function fallbackMessage(err: unknown, generic: string): string {
  const message = (err as { message?: unknown } | null)?.message;
  return typeof message === 'string' && message ? message : generic;
}

export function resolveAuthError(err: unknown, mode: AuthErrorMode, currentHost?: string): AuthErrorMessage {
  const code = getAuthErrorCode(err);

  switch (mode) {
    case 'google':
      switch (code) {
        case 'auth/unauthorized-domain':
          return {
            code,
            message: `Google Sign-In is restricted for this domain (${currentHost || 'this page'}). You can authorize this domain in the Firebase Console, or continue instantly in Local Practice Mode.`,
          };
        case 'auth/popup-closed-by-user':
          return { code, message: 'Google sign-in popup was closed before completing.' };
        case 'auth/popup-blocked':
        case 'auth/popup-blocked-by-user':
          return { code, message: 'Sign-in pop-up was blocked by your browser. Please allow popups, then try again, or use Local Practice Mode.' };
        case 'auth/cancelled-popup-request':
          return { code, message: 'Sign-in request was cancelled.' };
        case 'auth/operation-not-allowed':
          return { code, message: 'Google sign-in is disabled in your Firebase project. Sign in with email/password or start in Local Practice Mode.' };
        case 'auth/network-request-failed':
          return { code, message: GENERIC.network };
        case 'auth/too-many-requests':
          return { code, message: GENERIC.tooManyRequests };
        case 'auth/invalid-credential':
        case 'auth/invalid-login-credentials':
          return { code, message: 'Google authentication could not be completed. Please try again or continue in Local Practice Mode.' };
        default:
          return { code, message: fallbackMessage(err, 'Google sign-in failed. Please try again or continue in Local Practice Mode.') };
      }

    case 'signin':
      switch (code) {
        case 'auth/operation-not-allowed':
          return { code, message: 'Email/Password sign-in is disabled in your Firebase project. Sign in with Google or start in Local Practice Mode.' };
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
        case 'auth/invalid-login-credentials':
        case 'auth/user-not-found':
          return { code, message: 'Incorrect email or password. Please verify and try again.' };
        case 'auth/invalid-email':
          return { code, message: GENERIC.invalidEmail };
        case 'auth/too-many-requests':
          return { code, message: GENERIC.tooManyRequests };
        case 'auth/network-request-failed':
          return { code, message: GENERIC.network };
        default:
          return { code, message: fallbackMessage(err, 'Failed to sign in. Please check your credentials.') };
      }

    case 'signup':
      switch (code) {
        case 'auth/email-already-in-use':
          return { code, message: 'An account with this email already exists. Please sign in instead.' };
        case 'auth/invalid-email':
          return { code, message: GENERIC.invalidEmail };
        case 'auth/weak-password':
          return { code, message: 'Password is too weak. Please use at least 6 characters.' };
        case 'auth/operation-not-allowed':
          return { code, message: 'Email/Password registration is disabled in your Firebase project. Sign in with Google or use Local Practice Mode.' };
        case 'auth/unauthorized-domain':
          return {
            code,
            message: `Account creation is restricted for this domain (${currentHost || 'this page'}). You can authorize this domain in the Firebase Console, or continue in Local Practice Mode.`,
          };
        case 'auth/too-many-requests':
          return { code, message: GENERIC.tooManyRequests };
        case 'auth/network-request-failed':
          return { code, message: GENERIC.network };
        default:
          return { code, message: fallbackMessage(err, 'Failed to create account. Please try again.') };
      }

    case 'forgot':
      switch (code) {
        case 'auth/user-not-found':
          return { code, message: 'No account found with this email.' };
        case 'auth/invalid-email':
          return { code, message: GENERIC.invalidEmail };
        case 'auth/operation-not-allowed':
          return { code, message: 'Password reset is currently unavailable for this project. Sign in with Google or use Local Practice Mode.' };
        case 'auth/too-many-requests':
          return { code, message: GENERIC.tooManyRequests };
        case 'auth/network-request-failed':
          return { code, message: GENERIC.network };
        default:
          return { code, message: fallbackMessage(err, 'Failed to send reset email. Please verify your email address.') };
      }
  }
}