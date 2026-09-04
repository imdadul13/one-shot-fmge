import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { AppState, UserProfile } from '../types';
import { normalizeAppState } from './storage';
import { getInitialAppState } from '../data/sampleData';

const LEGACY_STORAGE_KEYS = ['fmge_study_tracker_v2', 'fmge_study_tracker_state', 'fmge_tracker_state_v1'];

// Firestore metadata belongs to the document, not to the React AppState. Keeping
// it out of comparisons prevents an acknowledgement snapshot from looking like a
// different user state solely because updatedAt changed.
function normalizeCloudState(data: Record<string, unknown>): AppState | null {
  const { userId: _userId, updatedAt: _updatedAt, ...state } = data;
  return normalizeAppState(state);
}

export function getUserStorageKey(uid: string): string {
  return `fmge_study_tracker_user_${uid}`;
}

export function loadUserLocalCache(uid: string): AppState | null {
  try {
    const raw = localStorage.getItem(getUserStorageKey(uid));
    if (raw) {
      const parsed = JSON.parse(raw);
      return normalizeAppState(parsed);
    }
  } catch (err) {
    console.error('Error loading local cache for user:', uid, err);
  }
  return null;
}

export function saveUserLocalCache(uid: string, state: AppState): void {
  try {
    localStorage.setItem(getUserStorageKey(uid), JSON.stringify(state));
  } catch (err) {
    console.error('Error saving local cache for user:', uid, err);
  }
}

export function clearUserLocalCache(uid: string): void {
  try {
    localStorage.removeItem(getUserStorageKey(uid));
  } catch (err) {
    console.error('Error clearing local cache for user:', uid, err);
  }
}

export function hasLegacyLocalData(): boolean {
  try {
    for (const key of LEGACY_STORAGE_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        const hasTopics = parsed.topicsState && Object.keys(parsed.topicsState).length > 0;
        const hasGTs = Array.isArray(parsed.grandTests) && parsed.grandTests.length > 0;
        const hasErrors = Array.isArray(parsed.errorNotebook) && parsed.errorNotebook.length > 0;
        if (hasTopics || hasGTs || hasErrors) {
          return true;
        }
      }
    }
  } catch (err) {
    console.error('Error checking legacy local data:', err);
  }
  return false;
}

export function getLegacyLocalData(): AppState | null {
  try {
    for (const key of LEGACY_STORAGE_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        const normalized = normalizeAppState(parsed);
        if (normalized) return normalized;
      }
    }
  } catch (err) {
    console.error('Error getting legacy local data:', err);
  }
  return null;
}

export function clearLegacyLocalData(): void {
  try {
    for (const key of LEGACY_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  } catch (err) {
    console.error('Error clearing legacy local data:', err);
  }
}

// ----------------- FIRESTORE CLOUD OPERATIONS -----------------

export async function getUserProfileDoc(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (err) {
    console.error('Error fetching user profile from Firestore:', err);
    throw err;
  }
  return null;
}

export async function createUserProfileDoc(
  user: User,
  initialData?: Partial<UserProfile>
): Promise<UserProfile> {
  const profile: UserProfile = {
    uid: user.uid,
    displayName: initialData?.displayName || user.displayName || user.email?.split('@')[0] || 'Doctor',
    email: user.email || '',
    photoURL: user.photoURL || null,
    examDate: initialData?.examDate || '2026-10-15',
    targetScore: initialData?.targetScore || 185,
    dailyHoursTarget: initialData?.dailyHoursTarget || 6,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    onboardingCompleted: initialData?.onboardingCompleted ?? false,
    preferences: {
      coachingSource: initialData?.preferences?.coachingSource || 'Marrow / Prepladder',
      primaryPlatform: initialData?.preferences?.primaryPlatform || 'Marrow',
      theme: 'calm-teal',
      notificationsEnabled: true,
      ...initialData?.preferences,
    },
  };

  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, profile, { merge: true });
    return profile;
  } catch (err) {
    console.error('Error creating user profile in Firestore:', err);
    throw err;
  }
}

export async function updateUserProfileDoc(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(
      userRef,
      {
        ...updates,
        lastActiveAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error updating user profile in Firestore:', err);
    throw err;
  }
}

export async function getUserStateFromCloud(uid: string): Promise<AppState | null> {
  try {
    const dataRef = doc(db, 'userData', uid);
    const snap = await getDoc(dataRef);
    if (snap.exists()) {
      return normalizeCloudState(snap.data());
    }
  } catch (err) {
    console.error('Error loading user state from Firestore:', err);
    throw err;
  }
  return null;
}

export async function saveUserStateToCloud(uid: string, state: AppState): Promise<void> {
  try {
    const dataRef = doc(db, 'userData', uid);
    await setDoc(
      dataRef,
      {
        ...state,
        userId: uid,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    // Also save in local storage cache for instant offline read
    saveUserLocalCache(uid, state);
  } catch (err) {
    console.error('Error saving user state to Firestore:', err);
    throw err;
  }
}

export function subscribeToUserState(
  uid: string,
  onUpdate: (cloudState: AppState) => void,
  onError?: (err: Error) => void
): () => void {
  const dataRef = doc(db, 'userData', uid);
  return onSnapshot(
    dataRef,
    (snap) => {
      if (snap.exists()) {
        const normalized = normalizeCloudState(snap.data());
        if (normalized) {
          onUpdate(normalized);
        }
      }
    },
    (err) => {
      console.warn('Real-time snapshot error (offline or rules):', err);
      if (onError) onError(err);
    }
  );
}
