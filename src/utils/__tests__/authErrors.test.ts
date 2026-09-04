import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveAuthError, getAuthErrorCode } from '../authErrors';

describe('authErrors', () => {
  describe('getAuthErrorCode', () => {
    it('extracts the Firebase error code', () => {
      assert.equal(getAuthErrorCode({ code: 'auth/weak-password' }), 'auth/weak-password');
    });

    it('normalizes unknown / non-error input', () => {
      assert.equal(getAuthErrorCode(null), 'auth/unknown-error');
      assert.equal(getAuthErrorCode(undefined), 'auth/unknown-error');
      assert.equal(getAuthErrorCode({ message: 'x' }), 'auth/unknown-error');
    });
  });

  describe('google', () => {
    const google = (code: string) => resolveAuthError({ code }, 'google', 'localhost');

    it('unauthorized-domain explains the domain restriction', () => {
      const r = google('auth/unauthorized-domain');
      assert.equal(r.code, 'auth/unauthorized-domain');
      assert.match(r.message, /localhost/);
      assert.match(r.message, /Local Practice Mode/);
    });

    it('popup-closed-by-user', () => {
      const r = google('auth/popup-closed-by-user');
      assert.match(r.message, /popup was closed/);
    });

    it('popup-blocked and popup-blocked-by-user', () => {
      assert.match(google('auth/popup-blocked').message, /blocked by your browser/);
      assert.match(google('auth/popup-blocked-by-user').message, /blocked by your browser/);
    });

    it('cancelled-popup-request', () => {
      assert.match(google('auth/cancelled-popup-request').message, /cancelled/);
    });

    it('operation-not-allowed (Google provider disabled)', () => {
      const r = google('auth/operation-not-allowed');
      assert.match(r.message, /disabled in your Firebase project/);
    });

    it('network-request-failed', () => {
      assert.match(google('auth/network-request-failed').message, /Network error/);
    });

    it('too-many-requests', () => {
      assert.match(google('auth/too-many-requests').message, /Too many attempts/);
    });

    it('invalid-credential falls back gracefully', () => {
      assert.match(google('auth/invalid-credential').message, /could not be completed/);
    });

    it('unknown codes use the raw message when available', () => {
      const r = resolveAuthError({ code: 'auth/custom', message: 'raw detail' }, 'google');
      assert.match(r.message, /raw detail/);
    });
  });

  describe('signin', () => {
    const signin = (code: string) => resolveAuthError({ code }, 'signin');

    it('operation-not-allowed (Email/Password disabled)', () => {
      const r = signin('auth/operation-not-allowed');
      assert.match(r.message, /Email\/Password sign-in is disabled/);
    });

    it('wrong-password / invalid-credential / invalid-login-credentials / user-not-found', () => {
      const expected = /Incorrect email or password/;
      assert.match(signin('auth/wrong-password').message, expected);
      assert.match(signin('auth/invalid-credential').message, expected);
      assert.match(signin('auth/invalid-login-credentials').message, expected);
      assert.match(signin('auth/user-not-found').message, expected);
    });

    it('invalid-email', () => {
      assert.match(signin('auth/invalid-email').message, /valid email address/);
    });

    it('network-request-failed', () => {
      assert.match(signin('auth/network-request-failed').message, /Network error/);
    });

    it('too-many-requests', () => {
      assert.match(signin('auth/too-many-requests').message, /Too many attempts/);
    });
  });

  describe('signup', () => {
    const signup = (code: string) => resolveAuthError({ code }, 'signup');

    it('operation-not-allowed (registration disabled)', () => {
      const r = signup('auth/operation-not-allowed');
      assert.match(r.message, /registration is disabled/);
    });

    it('email-already-in-use', () => {
      assert.match(signup('auth/email-already-in-use').message, /already exists/);
    });

    it('invalid-email', () => {
      assert.match(signup('auth/invalid-email').message, /valid email address/);
    });

    it('weak-password', () => {
      assert.match(signup('auth/weak-password').message, /at least 6 characters/);
    });

    it('unauthorized-domain includes host', () => {
      const r = resolveAuthError({ code: 'auth/unauthorized-domain' }, 'signup', '127.0.0.1');
      assert.match(r.message, /127\.0\.0\.1/);
    });

    it('network-request-failed', () => {
      assert.match(signup('auth/network-request-failed').message, /Network error/);
    });
  });

  describe('forgot', () => {
    const forgot = (code: string) => resolveAuthError({ code }, 'forgot');

    it('user-not-found', () => {
      assert.match(forgot('auth/user-not-found').message, /No account found/);
    });

    it('operation-not-allowed (reset disabled)', () => {
      const r = forgot('auth/operation-not-allowed');
      assert.match(r.message, /currently unavailable/);
    });

    it('invalid-email', () => {
      assert.match(forgot('auth/invalid-email').message, /valid email address/);
    });

    it('network-request-failed', () => {
      assert.match(forgot('auth/network-request-failed').message, /Network error/);
    });
  });
});