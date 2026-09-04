import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { shouldUseFirebaseEmulators, FIREBASE_EMULATOR_URLS } from '../firebaseEmulatorConfig';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('shouldUseFirebaseEmulators', () => {
  it('returns true only in development with the flag set to "true"', () => {
    assert.equal(shouldUseFirebaseEmulators(true, 'true'), true);
  });

  it('returns false in production even if the flag is set', () => {
    assert.equal(shouldUseFirebaseEmulators(false, 'true'), false);
  });

  it('returns false in development when the flag is unset or non-"true"', () => {
    assert.equal(shouldUseFirebaseEmulators(true, undefined), false);
    assert.equal(shouldUseFirebaseEmulators(true, 'false'), false);
    assert.equal(shouldUseFirebaseEmulators(true, ''), false);
  });

  it('returns false in production with no flag', () => {
    assert.equal(shouldUseFirebaseEmulators(false, undefined), false);
  });
});

describe('FIREBASE_EMULATOR_URLS', () => {
  it('uses 127.0.0.1:9099 for Auth', () => {
    assert.equal(FIREBASE_EMULATOR_URLS.auth, 'http://127.0.0.1:9099');
  });

  it('uses 127.0.0.1:8080 for Firestore', () => {
    assert.equal(FIREBASE_EMULATOR_URLS.firestoreHost, '127.0.0.1');
    assert.equal(FIREBASE_EMULATOR_URLS.firestorePort, 8080);
  });
});

describe('firebase.ts source integrity', () => {
  const src = fs.readFileSync(path.resolve(__dirname, '../../lib/firebase.ts'), 'utf8');

  it('imports connectAuthEmulator and connectFirestoreEmulator', () => {
    assert.ok(src.includes('connectAuthEmulator'), 'missing connectAuthEmulator');
    assert.ok(src.includes('connectFirestoreEmulator'), 'missing connectFirestoreEmulator');
  });

  it('gates emulator connections via the shouldUseFirebaseEmulators util', () => {
    assert.ok(src.includes('shouldUseFirebaseEmulators'), 'missing shouldUseFirebaseEmulators guard');
  });

  it('only connects to emulators inside the shouldUseFirebaseEmulators guard', () => {
    assert.ok(
      src.includes('import.meta.env?.VITE_USE_FIREBASE_EMULATORS'),
      'must read the VITE_USE_FIREBASE_EMULATORS flag'
    );
    const guardIdx = src.indexOf('shouldUseFirebaseEmulators(');
    const connectAuthIdx = src.indexOf('connectAuthEmulator(');
    const connectFsIdx = src.indexOf('connectFirestoreEmulator(');
    assert.ok(guardIdx !== -1 && guardIdx < connectAuthIdx && guardIdx < connectFsIdx,
      'emulator connections must be inside the shouldUseFirebaseEmulators guard');
  });

  it('guards import.meta.env with optional chaining for test-runner safety', () => {
    assert.ok(src.includes('import.meta.env?.'), 'import.meta.env must use optional chaining');
  });
});

describe('environment gating for production safety', () => {
  it('.env.example defaults the flag to false', () => {
    const env = fs.readFileSync(path.resolve(__dirname, '../../../.env.example'), 'utf8');
    assert.ok(env.includes('VITE_USE_FIREBASE_EMULATORS=false'), '.env.example must default the flag to false');
  });

  it('firebase.json exists with auth and firestore emulator ports', () => {
    const cfgPath = path.resolve(__dirname, '../../../firebase.json');
    assert.ok(fs.existsSync(cfgPath), 'firebase.json must exist for local emulators');
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    assert.equal(cfg.emulators.auth.port, 9099);
    assert.equal(cfg.emulators.firestore.port, 8080);
  });
});