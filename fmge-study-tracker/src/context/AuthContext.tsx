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
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { AppState, UserProfile, SyncStatus } from '../types';
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

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isRestoringData: boolean;
  syncStatus: SyncStatus;
  appState: AppState;
  showOnboarding: boolean;
  showMigrationPrompt: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  updateProfileData: (updates: Partial<UserProfile>) => Promise<void>;
  updateAppState: (updater: AppState | ((prev: AppState) => AppState)) => void;
  forceSyncToCloud: () => Promise<void>;
  completeOnboarding: (examDate: string, targetScore: number, dailyHours: number, source?: string) => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoringData, setIsRestoringData] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMigrationPrompt, setShowMigrationPrompt] = useState(false);

  // In-memory state for the active user
  const [appState, setAppState] = useState<AppState>(() => getInitialAppState());

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

  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  // Online / offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus('synced');
      if (user) {
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

  // Auth State Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      const session = ++authSessionRef.current;
      if (!currentUser) {
        // User is logged out
        cleanupUserSession();
        setUser(null);
        setIsLoading(false);
        setIsRestoringData(false);
        return;
      }

      // User is logged in
      setUser(currentUser);
      activeUidRef.current = currentUser.uid;
      hasPendingLocalChangesRef.current = false;
      setIsRestoringData(true);

      try {
        // 1. Fetch or create user profile
        let userProf = await getUserProfileDoc(currentUser.uid);
        if (session !== authSessionRef.current) return;
        let isNewAccount = false;

        if (!userProf) {
          userProf = await createUserProfileDoc(currentUser);
          isNewAccount = true;
        }
        setProfile(userProf);

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

          // If onboarding wasn't completed, show onboarding
          if (!userProf.onboardingCompleted) {
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
          saveUserLocalCache(currentUser.uid, mergedState);
          lastCloudSavedStringRef.current = JSON.stringify(mergedState);

          if (!userProf.onboardingCompleted && !cloudState.grandTests.length && !Object.keys(cloudState.topicsState).length) {
            setShowOnboarding(true);
          }
        }

        // 3. Subscribe to real-time updates from other devices (iPhone / iPad / MacBook)
        if (unsubscribeSnapshotRef.current) {
          unsubscribeSnapshotRef.current();
        }
        unsubscribeSnapshotRef.current = subscribeToUserState(
          currentUser.uid,
          (updatedCloudState) => {
            // A server snapshot that predates a local debounced edit must never
            // replace that edit. The write acknowledgement is identified by JSON.
            if (hasPendingLocalChangesRef.current) return;
            const incomingJson = JSON.stringify(updatedCloudState);
            if (incomingJson !== lastCloudSavedStringRef.current) {
              isSyncingFromCloudRef.current = true;
              lastCloudSavedStringRef.current = incomingJson;
              setAppState((prev) => ({
                ...updatedCloudState,
              }));
              saveUserLocalCache(currentUser.uid, updatedCloudState);
              setTimeout(() => {
                isSyncingFromCloudRef.current = false;
              }, 300);
            }
          },
          (err) => {
            console.warn('Real-time sync snapshot notice:', err);
          }
        );

        setSyncStatus('synced');
      } catch (err) {
        console.error('Error during user auth restoration:', err);
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
        setIsLoading(false);
        setIsRestoringData(false);
      }
    });

    return () => {
      unsubscribeAuth();
      cleanupUserSession();
    };
  }, []);

  // Save changes to cloud (debounced by 1.5 seconds)
  const scheduleCloudSave = useCallback((stateToSave: AppState) => {
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
  }, [user]);

  /** Immediately commits the latest local state. Used before session-changing actions. */
  const flushPendingSave = async () => {
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
      // The UID cache is retained, but the caller must decide whether it is safe
      // to discard the authenticated session.
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

  // Force sync immediately
  const forceSyncToCloud = async () => {
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
      setIsLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setIsLoading(false);
      console.error('Google Sign-In Error:', err);
      throw err;
    }
  };

  // Email Sign-In
  const signInWithEmail = async (email: string, pass: string) => {
    try {
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      setIsLoading(false);
      console.error('Email Sign-In Error:', err);
      throw err;
    }
  };

  // Email Sign-Up
  const signUpWithEmail = async (email: string, pass: string, displayName: string) => {
    try {
      setIsLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      
      // Update Firebase Auth user display name
      if (displayName && cred.user) {
        try {
          await updateFirebaseProfile(cred.user, { displayName });
        } catch (profileErr) {
          console.warn('Could not update Firebase user displayName:', profileErr);
        }
      }

      // Initialize initial profile doc in Firestore (non-fatal if Firestore latency occurs)
      try {
        await createUserProfileDoc(cred.user, {
          displayName: displayName || email.split('@')[0] || 'Doctor',
          email,
        });
      } catch (firestoreErr) {
        console.warn('Initial profile doc creation notice:', firestoreErr);
      }
    } catch (err) {
      setIsLoading(false);
      console.error('Email Sign-Up Error:', err);
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
    try {
      setIsLoading(true);
      // Do not cancel the debounce before it is safely committed.
      await flushPendingSave();
      await signOut(auth);
      cleanupUserSession();
    } catch (err) {
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      console.error('Sign Out Error:', err);
      throw err;
    } finally {
      setIsLoading(false);
      setIsRestoringData(false);
    }
  };

  // Profile Update
  const updateProfileData = async (updates: Partial<UserProfile>) => {
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
    source?: string
  ) => {
    if (!user) return;
    try {
      await updateProfileData({
        examDate,
        targetScore,
        dailyHoursTarget: dailyHours,
        onboardingCompleted: true,
        preferences: {
          ...profile?.preferences,
          coachingSource: source || profile?.preferences?.coachingSource || 'Marrow',
        },
      });
      setShowOnboarding(false);
    } catch (err) {
      console.error('Error completing onboarding:', err);
      throw err;
    }
  };

  // Migrate legacy local data
  const handleMigrateLocalData = async () => {
    if (!user) return;
    try {
      setSyncStatus('syncing');
      const legacyData = getLegacyLocalData();
      if (legacyData) {
        const merged: AppState = {
          ...legacyData,
          settings: {
            ...legacyData.settings,
            userName: profile?.displayName || legacyData.settings.userName,
            examDate: profile?.examDate || legacyData.settings.examDate,
            targetScore: profile?.targetScore || legacyData.settings.targetScore,
            dailyStudyHourGoal: profile?.dailyHoursTarget || legacyData.settings.dailyStudyHourGoal,
          },
        };
        setAppState(merged);
        await saveUserStateToCloud(user.uid, merged);
        lastCloudSavedStringRef.current = JSON.stringify(merged);
        clearLegacyLocalData();
      }
      setShowMigrationPrompt(false);
      setSyncStatus('synced');
    } catch (err) {
      console.error('Data migration error:', err);
      setSyncStatus('error');
    }
  };

  // Start fresh
  const handleStartFresh = async () => {
    if (!user) return;
    try {
      setSyncStatus('syncing');
      const fresh = getInitialAppState();
      if (profile?.displayName) fresh.settings.userName = profile.displayName;
      if (profile?.examDate) fresh.settings.examDate = profile.examDate;
      if (profile?.targetScore) fresh.settings.targetScore = profile.targetScore;
      if (profile?.dailyHoursTarget) fresh.settings.dailyStudyHourGoal = profile.dailyHoursTarget;

      setAppState(fresh);
      await saveUserStateToCloud(user.uid, fresh);
      lastCloudSavedStringRef.current = JSON.stringify(fresh);
      clearLegacyLocalData();
      setShowMigrationPrompt(false);
      setSyncStatus('synced');
    } catch (err) {
      console.error('Error starting fresh:', err);
      setSyncStatus('error');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isRestoringData,
        syncStatus,
        appState,
        showOnboarding,
        showMigrationPrompt,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        signOutUser,
        updateProfileData,
        updateAppState,
        forceSyncToCloud,
        completeOnboarding,
        handleMigrateLocalData,
        handleStartFresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
