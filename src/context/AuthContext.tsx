import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as updateFirebaseProfile,
  sendPasswordResetEmail,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { AppState, UserProfile, SyncStatus, McqAttempt, OnboardingPreparationStage, StudyPreferenceKey } from '../types';
import { getInitialAppState } from '../data/sampleData';
import {
  getUserProfileDoc,
  createUserProfileDoc,
  updateUserProfileDoc,
  getUserStateFromCloud,
  saveUserStateToCloud,
  subscribeToUserState,
  loadUserLocalCache,
  saveUserLocalCache,
  clearUserLocalCache,
  hasLegacyLocalData,
  getLegacyLocalData,
  clearLegacyLocalData,
} from '../utils/cloudSync';
import { normalizeAppState } from '../utils/storage';
import { recordMcqAttempt, hydrateAttemptsFromExistingState, NewMcqAttemptInput } from '../utils/performanceEngine';

/**
 * ============================================================================
 * TEMPORARY DEVELOPMENT AUTHENTICATION BYPASS FLAG
 * ============================================================================
 * Set to `true` to immediately bypass the login requirement and open directly to
 * the full FMGE application with a development user session and safe local persistence.
 *
 * To RESTORE standard Firebase Authentication with real Firestore accounts:
 * Change this ONE line to: export const DEV_AUTH_BYPASS = false;
 */
export const DEV_AUTH_BYPASS = false;

/** Development Session User Identity (Bypass Mode Only) */
const DEV_USER: User = {
  uid: 'dev-user-session',
  email: 'doctor.aspirant@fmgetracker.local',
  displayName: 'Dr. Aspirant',
  photoURL: null,
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  refreshToken: '',
  tenantId: null,
  delete: async () => {},
  getIdToken: async () => 'dev-token',
  getIdTokenResult: async () => ({} as any),
  reload: async () => {},
  toJSON: () => ({}),
  phoneNumber: null,
  providerId: 'dev-bypass',
};

/** Development Profile (Bypass Mode Only) */
const DEV_PROFILE: UserProfile = {
  uid: 'dev-user-session',
  email: 'doctor.aspirant@fmgetracker.local',
  displayName: 'Dr. Aspirant',
  photoURL: null,
  createdAt: new Date().toISOString(),
  lastActiveAt: new Date().toISOString(),
  onboardingCompleted: true,
  targetScore: 185,
  examDate: new Date(Date.now() + 75 * 86400000).toISOString().split('T')[0],
  dailyHoursTarget: 8,
  preferences: {
    coachingSource: 'Marrow & Rapid Revision',
    primaryPlatform: 'Marrow & Telegram',
    theme: 'calm-teal',
    notificationsEnabled: false,
  },
};

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isGuest: boolean;
  isRestoringData: boolean;
  syncStatus: SyncStatus;
  appState: AppState;
  showOnboarding: boolean;
  showMigrationPrompt: boolean;
  continueAsGuest: (guestName?: string) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  updateProfileData: (updates: Partial<UserProfile>) => Promise<void>;
  updateAppState: (updater: AppState | ((prev: AppState) => AppState)) => void;
  recordQuestionAttempt: (input: NewMcqAttemptInput) => McqAttempt;
  forceSyncToCloud: () => Promise<void>;
  completeOnboarding: (
    examDate: string,
    targetScore: number,
    dailyHours: number,
    options?: {
      source?: string;
      preparationStage?: OnboardingPreparationStage;
      studyPreferences?: StudyPreferenceKey[];
      baselineScore?: number;
      baselineQuestions?: number;
    }
  ) => Promise<void>;
  saveOnboardingProgress: (partial: Partial<UserProfile>) => Promise<void>;
  handleMigrateLocalData: () => Promise<void>;
  handleStartFresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (DEV_AUTH_BYPASS) return DEV_USER;
    return null;
  });

  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (DEV_AUTH_BYPASS) {
      try {
        const saved = localStorage.getItem('fmge_dev_profile');
        if (saved) return JSON.parse(saved);
      } catch {}
      return DEV_PROFILE;
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(() => (DEV_AUTH_BYPASS ? false : true));
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    if (DEV_AUTH_BYPASS) return false;
    try {
      return localStorage.getItem('fmge_guest_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [isRestoringData, setIsRestoringData] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMigrationPrompt, setShowMigrationPrompt] = useState(false);

  // In-memory state for the active user
  const [appState, setAppState] = useState<AppState>(() => {
    if (DEV_AUTH_BYPASS) {
      try {
        const devRaw = localStorage.getItem('fmge_study_tracker_dev') || localStorage.getItem('fmge_study_tracker_v2');
        if (devRaw) {
          const parsed = JSON.parse(devRaw);
          return normalizeAppState(parsed);
        }
      } catch (e) {
        console.warn('Could not read dev storage data:', e);
      }
      return getInitialAppState();
    }

    try {
      const isGuestMode = localStorage.getItem('fmge_guest_mode') === 'true';
      if (isGuestMode) {
        const localRaw = localStorage.getItem('fmge_study_tracker_v2');
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          return normalizeAppState(parsed);
        }
      }
    } catch (e) {
      console.warn('Could not read local guest data:', e);
    }
    return getInitialAppState();
  });

  // Cloud sync debounce timers & refs
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCloudSavedStringRef = useRef<string>('');
  const unsubscribeSnapshotRef = useRef<(() => void) | null>(null);
  const isSyncingFromCloudRef = useRef<boolean>(false);
  const activeUidRef = useRef<string | null>(null);
  const pendingStateRef = useRef<AppState | null>(null);
  const hasPendingLocalChangesRef = useRef(false);
  const appStateRef = useRef(appState);
  const authSessionRef = useRef(0);
  const profileRef = useRef<UserProfile | null>(profile);

  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  // Explicitly initialize Firebase Auth persistence once (when not in bypass mode)
  useEffect(() => {
    if (DEV_AUTH_BYPASS) return;
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('[AUTH] setPersistence notice:', err);
    });
  }, []);

  // Online / offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus('synced');
      if (user && !DEV_AUTH_BYPASS) {
        forceSyncToCloud();
      }
    };
    const handleOffline = () => setSyncStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  // Clean up on unmount or user change
  const cleanupUserSession = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (unsubscribeSnapshotRef.current) {
      try {
        unsubscribeSnapshotRef.current();
      } catch (e) {
        console.warn('Unsubscribe snapshot error:', e);
      }
      unsubscribeSnapshotRef.current = null;
    }
    activeUidRef.current = null;
    pendingStateRef.current = null;
    hasPendingLocalChangesRef.current = false;
    lastCloudSavedStringRef.current = '';
    setProfile(null);
    setShowOnboarding(false);
    setShowMigrationPrompt(false);
    // Reset in-memory state cleanly so no User A data leaks to User B
    setAppState(getInitialAppState());
  };

  // Synchronous check of whether the current in-memory profile has completed
  // onboarding. Used to keep async restoration (auth listener / snapshots) from
  // downgrading a freshly-completed onboarding flow back to incomplete.
  const profileRefCompleted = () => !!profileRef.current?.onboardingCompleted;

  // Auth State Listener
  useEffect(() => {
    if (DEV_AUTH_BYPASS) {
      console.log('[AUTH] Development Mode Active: Authentication requirement bypassed.');
      setIsLoading(false);
      setIsRestoringData(false);
      setSyncStatus('synced');
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      const session = ++authSessionRef.current;
      console.log('[AUTH] onAuthStateChanged', currentUser?.uid);

      if (!currentUser) {
        console.log('[AUTH] onAuthStateChanged: No user (logged out)');
        cleanupUserSession();
        setUser(null);
        setIsLoading(false);
        setIsRestoringData(false);
        return;
      }

      // User is authenticated
      console.log('[AUTH] setting authenticated user', currentUser.uid);
      try {
        localStorage.removeItem('fmge_guest_mode');
      } catch (e) {
        console.warn('Could not clear guest mode flag:', e);
      }
      setIsGuest(false);
      setUser(currentUser);
      setIsLoading(false);
      setIsRestoringData(true);
      activeUidRef.current = currentUser.uid;
      hasPendingLocalChangesRef.current = false;

      // Background asynchronous restore of profile and Firestore data
      console.log('[AUTH] Firestore restoration started', currentUser.uid);
      try {
        // 1. Fetch or create user profile
        let userProf = await getUserProfileDoc(currentUser.uid);
        if (session !== authSessionRef.current) return;
        let isNewAccount = false;

        if (!userProf) {
          userProf = await createUserProfileDoc(currentUser);
          isNewAccount = true;
        }
        // Guard against a cross-mount/stale-race downgrade: if the in-memory profile
        // was already completed (a just-finished onboarding flow), never reset it to
        // incomplete with a stale snapshot. This keeps the routing decision stable.
        setProfile((prev) => {
          if (prev?.onboardingCompleted && !userProf.onboardingCompleted) return prev;
          return userProf;
        });

        // 2. Load cloud study data
        let cloudState = await getUserStateFromCloud(currentUser.uid);
        if (session !== authSessionRef.current) return;

        // Check if there is local legacy data to migrate for a new user
        const hasLegacy = hasLegacyLocalData();

        if (!cloudState && isNewAccount && hasLegacy) {
          // New user and legacy data exists in browser -> prompt migration
          setShowMigrationPrompt(true);
          // Set initial default state in the meantime
          const initial = getInitialAppState();
          if (userProf.displayName) {
            initial.settings.userName = userProf.displayName;
          }
          if (userProf.examDate) {
            initial.settings.examDate = userProf.examDate;
          }
          if (userProf.targetScore) {
            initial.settings.targetScore = userProf.targetScore;
          }
          if (userProf.dailyHoursTarget) {
            initial.settings.dailyStudyHourGoal = userProf.dailyHoursTarget;
          }
          setAppState(initial);
        } else if (!cloudState) {
          // Brand new cloud state
          const initial = getInitialAppState();
          if (userProf.displayName) {
            initial.settings.userName = userProf.displayName;
          }
          if (userProf.examDate) {
            initial.settings.examDate = userProf.examDate;
          }
          if (userProf.targetScore) {
            initial.settings.targetScore = userProf.targetScore;
          }
          if (userProf.dailyHoursTarget) {
            initial.settings.dailyStudyHourGoal = userProf.dailyHoursTarget;
          }

          setAppState(initial);
          await saveUserStateToCloud(currentUser.uid, initial);
          lastCloudSavedStringRef.current = JSON.stringify(initial);

          // If onboarding wasn't completed, show onboarding (but never re-show for a
          // profile already completed by the in-flight flow).
          if (!userProf.onboardingCompleted && !profileRefCompleted()) {
            setShowOnboarding(true);
          }
        } else {
          // Existing user data found in Cloud
          // Sync settings from profile if needed
          const mergedState: AppState = {
            ...cloudState,
            settings: {
              ...cloudState.settings,
              userName: userProf.displayName || cloudState.settings.userName,
              examDate: userProf.examDate || cloudState.settings.examDate,
              targetScore: userProf.targetScore || cloudState.settings.targetScore,
              dailyStudyHourGoal: userProf.dailyHoursTarget || cloudState.settings.dailyStudyHourGoal,
            },
          };

          setAppState(mergedState);
          lastCloudSavedStringRef.current = JSON.stringify(mergedState);
          saveUserLocalCache(currentUser.uid, mergedState);

          // Returning user with incomplete onboarding -> resume the flow.
          if (!userProf.onboardingCompleted && !profileRefCompleted()) {
            setShowOnboarding(true);
          }
        }

        // 3. Set up real-time listener for multi-device sync
        if (unsubscribeSnapshotRef.current) {
          unsubscribeSnapshotRef.current();
        }

        unsubscribeSnapshotRef.current = subscribeToUserState(
          currentUser.uid,
          (remoteState) => {
            if (!remoteState) return;
            const remoteStr = JSON.stringify(remoteState);
            if (remoteStr !== lastCloudSavedStringRef.current && !hasPendingLocalChangesRef.current) {
              console.log('[AUTH] Syncing updated state from Firestore snapshot');
              isSyncingFromCloudRef.current = true;
              setAppState(remoteState);
              lastCloudSavedStringRef.current = remoteStr;
              saveUserLocalCache(currentUser.uid, remoteState);
              setTimeout(() => {
                isSyncingFromCloudRef.current = false;
              }, 100);
            }
          },
          (err) => {
            console.warn('Real-time sync snapshot notice:', err);
          }
        );

        setSyncStatus('synced');
      } catch (err) {
        console.error('[AUTH] Error during user auth restoration:', err);
        // Fallback to local user cache if available
        const localCached = loadUserLocalCache(currentUser.uid);
        if (localCached) {
          setAppState(localCached);
          setSyncStatus('offline');
        } else {
          const fresh = getInitialAppState();
          if (currentUser.displayName) fresh.settings.userName = currentUser.displayName;
          setAppState(fresh);
          setSyncStatus(navigator.onLine ? 'error' : 'offline');
        }
      } finally {
        setIsRestoringData(false);
        console.log('[AUTH] Firestore restoration finished', currentUser.uid);
      }
    });

    return () => {
      unsubscribeAuth();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      if (unsubscribeSnapshotRef.current) {
        try {
          unsubscribeSnapshotRef.current();
        } catch (e) {
          console.warn('Unsubscribe snapshot notice:', e);
        }
        unsubscribeSnapshotRef.current = null;
      }
    };
  }, []);

  // Continue as Guest (Local practice mode)
  const continueAsGuest = (guestName?: string) => {
    try {
      localStorage.setItem('fmge_guest_mode', 'true');
      setIsGuest(true);
      setUser(null);
      const name = guestName || 'Dr. Aspirant';
      const guestProfile: UserProfile = {
        uid: 'guest_local_user',
        email: 'local@device',
        displayName: name,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        examDate: '2026-10-15',
        targetScore: 185,
        dailyHoursTarget: 6,
        onboardingCompleted: true,
      };
      setProfile(guestProfile);
      
      const localRaw = localStorage.getItem('fmge_study_tracker_v2');
      if (localRaw) {
        try {
          const parsed = JSON.parse(localRaw);
          setAppState(normalizeAppState(parsed));
        } catch {
          const initial = getInitialAppState();
          initial.settings.userName = name;
          setAppState(initial);
        }
      } else {
        const initial = getInitialAppState();
        initial.settings.userName = name;
        setAppState(initial);
      }
      setIsLoading(false);
      setSyncStatus('synced');
    } catch (e) {
      console.error('Failed to continue as guest:', e);
    }
  };

  // Save changes to cloud or localStorage (debounced)
  const scheduleCloudSave = useCallback((stateToSave: AppState) => {
    if (DEV_AUTH_BYPASS) {
      try {
        localStorage.setItem('fmge_study_tracker_dev', JSON.stringify(stateToSave));
        setSyncStatus('synced');
      } catch (err) {
        console.warn('Failed to save to dev local storage:', err);
      }
      return;
    }

    if (isGuest) {
      try {
        localStorage.setItem('fmge_study_tracker_v2', JSON.stringify(stateToSave));
        setSyncStatus('synced');
      } catch (err) {
        console.warn('Failed to save to local storage:', err);
      }
      return;
    }

    if (!user || isSyncingFromCloudRef.current) return;

    const json = JSON.stringify(stateToSave);
    if (json === lastCloudSavedStringRef.current) return;

    // Save locally immediately
    saveUserLocalCache(user.uid, stateToSave);
    pendingStateRef.current = stateToSave;
    hasPendingLocalChangesRef.current = true;

    setSyncStatus('syncing');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (activeUidRef.current === user.uid) {
          await saveUserStateToCloud(user.uid, stateToSave);
          lastCloudSavedStringRef.current = json;
          pendingStateRef.current = null;
          hasPendingLocalChangesRef.current = false;
          setSyncStatus('synced');
        }
      } catch (err) {
        console.error('Failed to sync state to Firestore:', err);
        setSyncStatus(navigator.onLine ? 'error' : 'offline');
      }
    }, 1200);
  }, [user, isGuest]);

  /** Immediately commits the latest local state. Used before session-changing actions. */
  const flushPendingSave = async () => {
    if (DEV_AUTH_BYPASS) {
      try {
        const stateToSave = pendingStateRef.current || appStateRef.current;
        localStorage.setItem('fmge_study_tracker_dev', JSON.stringify(stateToSave));
        setSyncStatus('synced');
      } catch (e) {
        console.warn('Failed to flush dev state:', e);
      }
      return;
    }

    if (isGuest) {
      try {
        const stateToSave = pendingStateRef.current || appStateRef.current;
        localStorage.setItem('fmge_study_tracker_v2', JSON.stringify(stateToSave));
        setSyncStatus('synced');
      } catch (e) {
        console.warn('Failed to flush guest state:', e);
      }
      return;
    }

    const uid = activeUidRef.current;
    if (!uid) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    const stateToSave = pendingStateRef.current || appStateRef.current;
    const json = JSON.stringify(stateToSave);
    if (!hasPendingLocalChangesRef.current && json === lastCloudSavedStringRef.current) return;

    setSyncStatus('syncing');
    try {
      await saveUserStateToCloud(uid, stateToSave);
      lastCloudSavedStringRef.current = json;
      pendingStateRef.current = null;
      hasPendingLocalChangesRef.current = false;
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      throw err;
    }
  };

  // Update App State
  const updateAppState = useCallback((updater: (prev: AppState) => AppState | AppState) => {
    setAppState((prev) => {
      const next = typeof updater === 'function' ? (updater as (prev: AppState) => AppState)(prev) : updater;
      scheduleCloudSave(next);
      return next;
    });
  }, [scheduleCloudSave]);

  // Record an individual MCQ / question attempt into the Performance Engine
  const recordQuestionAttempt = useCallback((input: NewMcqAttemptInput): McqAttempt => {
    let recordedAttempt: McqAttempt | null = null;
    setAppState((prev) => {
      const { updatedState, attempt } = recordMcqAttempt(prev, input);
      recordedAttempt = attempt;
      scheduleCloudSave(updatedState);
      return updatedState;
    });
    return recordedAttempt!;
  }, [scheduleCloudSave]);

  // Force sync immediately
  const forceSyncToCloud = async () => {
    if (DEV_AUTH_BYPASS) {
      await flushPendingSave();
      return;
    }
    if (isGuest) {
      await flushPendingSave();
      return;
    }
    if (!user) return;
    try {
      await flushPendingSave();
    } catch (err) {
      console.error('Manual sync failed:', err);
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      throw err;
    }
  };

  // Google Sign-In
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log('[AUTH] Firebase auth result (Google):', result.user.uid);
    } catch (err) {
      console.error('[AUTH] Google Sign-In Error:', err);
      throw err;
    }
  };

  // Email Sign-In
  const signInWithEmail = async (email: string, pass: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      console.log('[AUTH] Firebase auth result (Email Sign-In):', result.user.uid);
    } catch (err) {
      console.error('[AUTH] Email Sign-In Error:', err);
      throw err;
    }
  };

  // Email Sign-Up
  const signUpWithEmail = async (email: string, pass: string, displayName: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      console.log('[AUTH] Firebase auth result (Email Sign-Up):', cred.user.uid);
      
      // Update Firebase Auth user display name
      if (displayName && cred.user) {
        try {
          await updateFirebaseProfile(cred.user, { displayName });
        } catch (profileErr) {
          console.warn('Could not update Firebase user displayName:', profileErr);
        }
      }

      // Initialize initial profile doc in Firestore (non-fatal & non-blocking)
      createUserProfileDoc(cred.user, {
        displayName: displayName || email.split('@')[0] || 'Doctor',
        email,
      }).catch((firestoreErr) => {
        console.warn('Initial profile doc creation notice:', firestoreErr);
      });
    } catch (err) {
      console.error('[AUTH] Email Sign-Up Error:', err);
      throw err;
    }
  };

  // Password Reset
  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      console.error('Password Reset Error:', err);
      throw err;
    }
  };

  // Sign Out
  const signOutUser = async () => {
    if (DEV_AUTH_BYPASS) {
      console.log('[AUTH] Development Mode: Resetting active dev session.');
      localStorage.removeItem('fmge_study_tracker_dev');
      setAppState(getInitialAppState());
      return;
    }

    try {
      if (isGuest) {
        localStorage.removeItem('fmge_guest_mode');
        setIsGuest(false);
        setProfile(null);
        cleanupUserSession();
        return;
      }
      // 1. Best-effort flush pending save in the background (non-blocking).
      //    Never let a slow or failing cloud write prevent sign-out.
      flushPendingSave().catch((err) => {
        console.warn('[AUTH] Pending save flush failed during sign-out (non-fatal):', err);
      });
      // 2. Sign out from Firebase (always proceeds regardless of cloud save state)
      await signOut(auth);
      // 3. onAuthStateChanged will receive null and call cleanupUserSession(), setUser(null)
    } catch (err) {
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      console.error('[AUTH] Sign Out Error:', err);
      throw err;
    }
  };

  // Profile Update
  const updateProfileData = async (updates: Partial<UserProfile>) => {
    if (DEV_AUTH_BYPASS) {
      setProfile((prev) => {
        const updated = prev ? { ...prev, ...updates } : ({ ...DEV_PROFILE, ...updates });
        try {
          localStorage.setItem('fmge_dev_profile', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      updateAppState((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          userName: updates.displayName ?? prev.settings.userName,
          examDate: updates.examDate ?? prev.settings.examDate,
          targetScore: updates.targetScore ?? prev.settings.targetScore,
          dailyStudyHourGoal: updates.dailyHoursTarget ?? prev.settings.dailyStudyHourGoal,
        },
      }));
      return;
    }

    if (!user) return;
    try {
      await updateUserProfileDoc(user.uid, updates);
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));

      // Also propagate relevant settings to app state
      updateAppState((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          userName: updates.displayName ?? prev.settings.userName,
          examDate: updates.examDate ?? prev.settings.examDate,
          targetScore: updates.targetScore ?? prev.settings.targetScore,
          dailyStudyHourGoal: updates.dailyHoursTarget ?? prev.settings.dailyStudyHourGoal,
        },
      }));
    } catch (err) {
      console.error('Profile update failed:', err);
      throw err;
    }
  };

  // Complete Onboarding
  const completeOnboarding = async (
    examDate: string,
    targetScore: number,
    dailyHours: number,
    options?: {
      source?: string;
      preparationStage?: OnboardingPreparationStage;
      studyPreferences?: StudyPreferenceKey[];
      baselineScore?: number;
      baselineQuestions?: number;
    }
  ) => {
    const now = new Date().toISOString();
    const profileUpdates: Partial<UserProfile> = {
      examDate,
      targetScore,
      dailyHoursTarget: dailyHours,
      onboardingCompleted: true,
      onboardingVersion: 1,
      onboardingCompletedAt: now,
      profileUpdatedAt: now,
      preparationStage: options?.preparationStage,
      studyPreferences: options?.studyPreferences,
      baselineScore: options?.baselineScore,
      baselineQuestions: options?.baselineQuestions,
      preferences: {
        ...profile?.preferences,
        coachingSource: options?.source || profile?.preferences?.coachingSource || 'Marrow',
      },
    };

    if (DEV_AUTH_BYPASS) {
      await updateProfileData(profileUpdates);
      setShowOnboarding(false);
      return;
    }

    if (!user) return;
    try {
      await updateProfileData(profileUpdates);
      setShowOnboarding(false);
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
      throw err;
    }
  };

  // Persist partial onboarding progress so closing the app midway can resume later.
  const saveOnboardingProgress = async (partial: Partial<UserProfile>) => {
    if (DEV_AUTH_BYPASS) {
      setProfile((prev) => {
        const updated = prev
          ? { ...prev, ...partial, profileUpdatedAt: new Date().toISOString() }
          : ({ ...DEV_PROFILE, ...partial } as UserProfile);
        try {
          localStorage.setItem('fmge_dev_profile', JSON.stringify(updated));
        } catch {}
        return updated;
      });
      return;
    }
    if (!user) return;
    try {
      await updateUserProfileDoc(user.uid, {
        ...partial,
        profileUpdatedAt: new Date().toISOString(),
      });
      setProfile((prev) =>
        prev
          ? { ...prev, ...partial, profileUpdatedAt: new Date().toISOString() }
          : prev
      );
    } catch (err) {
      console.error('Failed to save onboarding progress:', err);
      throw err;
    }
  };

  // Migration Handlers
  const handleMigrateLocalData = async () => {
    if (!user) return;
    try {
      const localData = getLegacyLocalData();
      if (localData) {
        const merged = normalizeAppState(localData);
        setAppState(merged);
        if (!DEV_AUTH_BYPASS) {
          await saveUserStateToCloud(user.uid, merged);
          saveUserLocalCache(user.uid, merged);
        } else {
          localStorage.setItem('fmge_study_tracker_dev', JSON.stringify(merged));
        }
        clearLegacyLocalData();
      }
      setShowMigrationPrompt(false);
    } catch (err) {
      console.error('Migration failed:', err);
      setShowMigrationPrompt(false);
    }
  };

  const handleStartFresh = async () => {
    setShowMigrationPrompt(false);
    clearLegacyLocalData();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isGuest,
        isRestoringData,
        syncStatus,
        appState,
        showOnboarding,
        showMigrationPrompt,
        continueAsGuest,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        signOutUser,
        updateProfileData,
        updateAppState,
        recordQuestionAttempt,
        forceSyncToCloud,
        completeOnboarding,
        saveOnboardingProgress,
        handleMigrateLocalData,
        handleStartFresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
