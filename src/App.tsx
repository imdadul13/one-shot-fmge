import React, { useState, useEffect, useMemo } from 'react';
import { Navbar, SidebarDock, ActiveTab } from './components/Navbar';
import { motion, AnimatePresence } from 'motion/react';
import { DashboardView } from './components/DashboardView';
import { SyllabusView } from './components/SyllabusView';
import { FmgePredictorView } from './components/FmgePredictorView';
import { RevisionMatrixView } from './components/RevisionMatrixView';
import { GrandTestsView } from './components/GrandTestsView';
import { DailyPlannerView } from './components/DailyPlannerView';
import { PearlsVaultView } from './components/PearlsVaultView';
import { TelegramHubView } from './components/TelegramHubView';
import { PracticeView } from './components/PracticeView';
import { ErrorsView } from './components/ErrorsView';
import { ProgressView } from './components/ProgressView';
import { MoreView } from './components/MoreView';
import { AiCoachView } from './components/AiCoachView';
import { AiCoachModal } from './components/AiCoachModal';
import { PracticeMcqSessionModal } from './components/PracticeMcqSessionModal';
import { SubjectDetailModal } from './components/SubjectDetailModal';
import { DoctorProfileModal } from './components/DoctorProfileModal';
import { AppSettingsModal } from './components/AppSettingsModal';
import { AuthScreen } from './components/AuthScreen';
import { OnboardingFlow } from './components/OnboardingFlow';
import { DataMigrationModal } from './components/DataMigrationModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { ErrorBoundary } from './components/error-boundary';
import { AuthProvider, useAuth, DEV_AUTH_BYPASS } from './context/AuthContext';

import {
  AppState,
  AppSettings,
  FMGESubject,
  ConfidenceLevel,
  GrandTest,
  ErrorNotebookItem,
  DailyTask,
  DailyStudyLog,
  MedicalPearl,
  SubjectProgress,
  TelegramMCQ,
  TelegramChannelConfig,
  TelegramAnnouncement,
  PracticeSessionContext,
  SyncStatus
} from './types';
import { FMGE_SUBJECTS } from './data/fmgeSubjects';
import { calculateAppStats, deduplicateQuestions, deduplicateAnnouncements, saveAppState } from './utils/storage';
import { getLocalDateKey } from './utils/date';

const STUDY_BACKGROUNDS = [
  { id: 'morning', url: '/images/study-bg/study-art-morning.jpg', label: 'Morning Desk', period: 'Morning' },
  { id: 'sunset', url: '/images/study-bg/study-art-sunset.jpg', label: 'Sunset Horizon', period: 'Evening' },
  { id: 'night', url: '/images/study-bg/study-art-night.jpg', label: 'Rainy Night Lamp', period: 'Night' },
];

function AppInner() {
  const {
    user,
    profile,
    isLoading,
    isGuest,
    isRestoringData,
    syncStatus,
    appState: state,
    updateAppState: setState,
    recordQuestionAttempt,
    showOnboarding,
    showMigrationPrompt,
  } = useAuth();

  // User custom background theme or time-based auto calculation
  const currentHour = new Date().getHours();
  const activeBg = useMemo(() => {
    const theme = state.settings?.bgTheme;
    if (theme === 'morning') return STUDY_BACKGROUNDS[0];
    if (theme === 'sunset') return STUDY_BACKGROUNDS[1];
    if (theme === 'night') return STUDY_BACKGROUNDS[2];
    // auto / fallback
    if (currentHour >= 5 && currentHour < 12) return STUDY_BACKGROUNDS[0];
    if (currentHour >= 12 && currentHour < 18) return STUDY_BACKGROUNDS[1];
    return STUDY_BACKGROUNDS[2];
  }, [state.settings?.bgTheme, currentHour]);

  const bgOpacity = state.settings?.bgOpacity ?? 0.8;

  const handleCycleBg = () => {
    const nextThemes: Array<'morning' | 'sunset' | 'night'> = ['morning', 'sunset', 'night'];
    const currentIdx = nextThemes.indexOf((state.settings?.bgTheme as any) || 'morning');
    const nextTheme = nextThemes[(currentIdx + 1) % nextThemes.length];
    handleUpdateSettings({
      ...state.settings,
      bgTheme: nextTheme,
    });
  };

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    try {
      const hash = window.location.hash.replace(/^#/, '') as ActiveTab;
      if (hash && ['dashboard', 'syllabus', 'practice', 'errors', 'progress', 'more', 'daily', 'pearls', 'telegram', 'predictor', 'revision', 'grandtests', 'aicoach'].includes(hash)) {
        return hash;
      }
      const saved = sessionStorage.getItem('fmge_active_tab') as ActiveTab;
      if (saved && ['dashboard', 'syllabus', 'practice', 'errors', 'progress', 'more', 'daily', 'pearls', 'telegram', 'predictor', 'revision', 'grandtests'].includes(saved)) {
        return saved;
      }
    } catch (_) {}
    return 'dashboard';
  });

  const handleSetActiveTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    try {
      sessionStorage.setItem('fmge_active_tab', tab);
      window.location.hash = tab;
    } catch (_) {}
  };

  // Modals
  const [isAiCoachOpen, setIsAiCoachOpen] = useState(false);
  const [aiCoachInitialTab, setAiCoachInitialTab] = useState<'vignette' | 'concept' | 'diagnosis' | 'strategy'>('strategy');
  const [aiCoachInitialSubject, setAiCoachInitialSubject] = useState<string | undefined>();
  const [aiCoachInitialTopic, setAiCoachInitialTopic] = useState<string | undefined>();
  const [practiceSessionContext, setPracticeSessionContext] = useState<PracticeSessionContext | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  // Onboarding flow session: the flow latches on once shown and stays mounted
  // through its ready screen until the user acknowledges, even though
  // completeOnboarding already set the profile to onboardingCompleted.
  const [obSessionActive, setObSessionActive] = useState(false);
  const [obAcknowledged, setObAcknowledged] = useState(false);
  // A new authenticated profile must not skip onboarding just because a previous
  // session's user already ran (and acknowledged) the flow.
  useEffect(() => {
    setObSessionActive(false);
    setObAcknowledged(false);
  }, [user?.uid]);

  // Onboarding gate: authenticated profile present and onboarding incomplete.
  // The `!profile` guard above already blocks rendering until the profile is
  // resolved, so we intentionally do NOT wait for `isRestoringData` here.
  // Otherwise the main app would flash for the async window between "profile
  // resolved" and "showOnboarding set" (the ~1s bounce observers saw).
  const onboardingRequired = !!profile && !profile.onboardingCompleted;
  const onboardingGate =
    (onboardingRequired || showOnboarding) &&
    !isGuest &&
    !!profile;
  // Latch once the gate first passes so the flow (including its building/ready
  // screens) stays mounted until the user acknowledges it, even after the
  // profile flips to onboardingCompleted.
  useEffect(() => {
    if (onboardingGate) setObSessionActive(true);
  }, [onboardingGate]);

  // Compute live application statistics
  const stats = useMemo(() => calculateAppStats(state), [state]);

  // Selected subject object for detail modal
  const selectedSubject = useMemo(
    () => (selectedSubjectId ? FMGE_SUBJECTS.find((s) => s.id === selectedSubjectId) || null : null),
    [selectedSubjectId]
  );

  // --- Handlers ---
  const handleSelectSubject = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
  };

  const handleLaunchPracticeSession = (
    subjectId: string,
    topicId: string,
    topicName: string,
    subtopic?: string,
    source: 'recommended_video' | 'dashboard_weak_topic' | 'ai_coach' = 'recommended_video'
  ) => {
    const foundSub = FMGE_SUBJECTS.find((s) => s.id === subjectId);
    const subjectName = foundSub?.name || subjectId.toUpperCase();
    setPracticeSessionContext({
      sessionId: `session-${Date.now()}`,
      source,
      subjectId,
      subjectName,
      topicId,
      topicName,
      subtopic,
      targetQuestionCount: 10,
    });
  };

  const handleOpenAiCoach = (
    tab: 'vignette' | 'concept' | 'diagnosis' | 'strategy' = 'strategy',
    subjectId?: string,
    topicName?: string
  ) => {
    setAiCoachInitialTab(tab);
    setAiCoachInitialSubject(subjectId);
    setAiCoachInitialTopic(topicName);
    handleSetActiveTab('aicoach');
  };

  // Toggle topic checkbox
  const handleToggleTopicState = (
    subjectId: string,
    topicId: string,
    field: 'notesDone' | 'qBankDone' | 'r1Done' | 'r2Done' | 'r3Done'
  ) => {
    setState((prev) => {
      const key = `${subjectId}-${topicId}`;
      const subject = FMGE_SUBJECTS.find((s) => s.id === subjectId);
      const customTopic = prev.subjectProgress[subjectId]?.customTopics?.find((t) => t.id === topicId);
      const defaultTopic = subject?.topics.find((t) => t.id === topicId) || customTopic;

      const currentVal = prev.topicsState[key]?.[field] ?? defaultTopic?.[field] ?? false;

      return {
        ...prev,
        topicsState: {
          ...prev.topicsState,
          [key]: {
            ...prev.topicsState[key],
            [field]: !currentVal,
          },
        },
      };
    });
  };

  // Update subject confidence rating
  const handleUpdateConfidence = (subjectId: string, confidence: ConfidenceLevel) => {
    setState((prev) => ({
      ...prev,
      subjectProgress: {
        ...prev.subjectProgress,
        [subjectId]: {
          ...prev.subjectProgress[subjectId],
          confidence,
        },
      },
    }));
  };

  // Add custom topic to subject
  const handleAddCustomTopic = (subjectId: string, topicName: string, isHighYield: boolean) => {
    setState((prev) => {
      const currentCustom = prev.subjectProgress[subjectId]?.customTopics || [];
      const newTopic = {
        id: `custom-${Date.now()}`,
        name: topicName,
        isHighYield,
        notesDone: false,
        qBankDone: false,
        r1Done: false,
        r2Done: false,
        r3Done: false,
      };

      return {
        ...prev,
        subjectProgress: {
          ...prev.subjectProgress,
          [subjectId]: {
            ...prev.subjectProgress[subjectId],
            customTopics: [...currentCustom, newTopic],
          },
        },
      };
    });
  };

  // Update subject personal notes or stats
  const handleUpdateSubjectDetails = (subjectId: string, updates: Partial<SubjectProgress>) => {
    setState((prev) => ({
      ...prev,
      subjectProgress: {
        ...prev.subjectProgress,
        [subjectId]: {
          ...prev.subjectProgress[subjectId],
          ...updates,
        },
      },
    }));
  };

  // Update subject revision target date
  const handleUpdateSubjectRevisionDate = (subjectId: string, targetRevisionDate: string) => {
    setState((prev) => ({
      ...prev,
      subjectProgress: {
        ...prev.subjectProgress,
        [subjectId]: {
          ...prev.subjectProgress[subjectId],
          targetRevisionDate,
        },
      },
    }));
  };

  // Grand Tests Handlers
  const handleAddGrandTest = (gt: GrandTest) => {
    setState((prev) => ({
      ...prev,
      grandTests: [...(prev.grandTests || []), gt],
    }));
  };

  const handleDeleteGrandTest = (id: string) => {
    setState((prev) => ({
      ...prev,
      grandTests: (prev.grandTests || []).filter((g) => g.id !== id),
    }));
  };

  // 20th Error Notebook Handlers
  const handleAddErrorItem = (item: ErrorNotebookItem) => {
    setState((prev) => ({
      ...prev,
      errorNotebook: [item, ...(prev.errorNotebook || [])],
    }));
  };

  const handleToggleErrorReviewed = (id: string) => {
    setState((prev) => ({
      ...prev,
      errorNotebook: (prev.errorNotebook || []).map((e) =>
        e.id === id ? { ...e, isReviewed: !e.isReviewed } : e
      ),
    }));
  };

  const handleDeleteErrorItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      errorNotebook: (prev.errorNotebook || []).filter((e) => e.id !== id),
    }));
  };

  // Daily Tasks Handlers
  const handleAddTask = (task: DailyTask) => {
    setState((prev) => ({
      ...prev,
      dailyTasks: [...prev.dailyTasks, task],
    }));
  };

  const handleToggleTask = (taskId: string) => {
    setState((prev) => {
      const updatedTasks = prev.dailyTasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );
      const targetTask = prev.dailyTasks.find((t) => t.id === taskId);
      const todayStr = getLocalDateKey();
      const todayLog = prev.studyLogs[todayStr] || {
        date: todayStr,
        studyMinutes: 0,
        questionsSolved: 0,
        completedTaskIds: [],
        mood: 'great',
      };
      const completedTaskIds = todayLog.completedTaskIds || [];
      const wasLogged = completedTaskIds.includes(taskId);
      const isCompleting = Boolean(targetTask && !targetTask.completed);
      const nextCompletedTaskIds = isCompleting
        ? wasLogged ? completedTaskIds : [...completedTaskIds, taskId]
        : completedTaskIds.filter((id) => id !== taskId);

      // Keep the daily log in sync with task completion. Only subtract time
      // that this handler previously attributed to the task, so older backups
      // without completedTaskIds cannot lose manually logged study time.
      const minutesDelta = targetTask && isCompleting && !wasLogged
        ? targetTask.durationMinutes
        : targetTask && !isCompleting && wasLogged
          ? -targetTask.durationMinutes
          : 0;
      const newMinutes = Math.max(0, (todayLog.studyMinutes || 0) + minutesDelta);

      return {
        ...prev,
        dailyTasks: updatedTasks,
        studyLogs: {
          ...prev.studyLogs,
          [todayStr]: {
            ...todayLog,
            studyMinutes: newMinutes,
            completedTaskIds: nextCompletedTaskIds,
          },
        },
      };
    });
  };

  const handleToggleMissionCompletion = (missionId: string) => {
    setState((prev) => ({
      ...prev,
      completedMissionIds: {
        ...prev.completedMissionIds,
        [missionId]: !prev.completedMissionIds?.[missionId],
      },
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    setState((prev) => {
      const task = prev.dailyTasks.find((t) => t.id === taskId);
      const todayStr = getLocalDateKey();
      const todayLog = prev.studyLogs[todayStr];
      const completedTaskIds = todayLog?.completedTaskIds || [];
      const wasLogged = completedTaskIds.includes(taskId);

      return {
        ...prev,
        dailyTasks: prev.dailyTasks.filter((t) => t.id !== taskId),
        ...(todayLog && wasLogged && task
          ? {
              studyLogs: {
                ...prev.studyLogs,
                [todayStr]: {
                  ...todayLog,
                  studyMinutes: Math.max(0, (todayLog.studyMinutes || 0) - task.durationMinutes),
                  completedTaskIds: completedTaskIds.filter((id) => id !== taskId),
                },
              },
            }
          : {}),
      };
    });
  };

  const handleUpdateDailyLog = (dateStr: string, updates: Partial<DailyStudyLog>) => {
    setState((prev) => {
      const current = prev.studyLogs[dateStr] || {
        date: dateStr,
        studyMinutes: 0,
        questionsSolved: 0,
        completedTaskIds: [],
        mood: 'great',
      };
      return {
        ...prev,
        studyLogs: {
          ...prev.studyLogs,
          [dateStr]: {
            ...current,
            ...updates,
          },
        },
      };
    });
  };

  // Medical Pearls Handlers
  const handleToggleBookmark = (pearlId: string) => {
    setState((prev) => {
      const curr = prev.bookmarkedPearlIds || [];
      const updated = curr.includes(pearlId) ? curr.filter((id) => id !== pearlId) : [...curr, pearlId];
      return {
        ...prev,
        bookmarkedPearlIds: updated,
      };
    });
  };

  const handleAddCustomPearl = (pearl: MedicalPearl) => {
    setState((prev) => ({
      ...prev,
      customPearls: [pearl, ...(prev.customPearls || [])],
      bookmarkedPearlIds: pearl.isBookmarked && !(prev.bookmarkedPearlIds || []).includes(pearl.id)
        ? [...(prev.bookmarkedPearlIds || []), pearl.id]
        : prev.bookmarkedPearlIds || [],
    }));
  };

  // Telegram Integration Handlers
  const handleUpdateTelegramQuestion = (questionId: string, updates: Partial<TelegramMCQ>) => {
    setState((prev) => {
      const list = prev.telegramQuestions || [];
      return {
        ...prev,
        telegramQuestions: list.map((q) => (q.id === questionId ? { ...q, ...updates } : q)),
      };
    });
  };

  const handleAddTelegramQuestions = (newQuestions: TelegramMCQ[]) => {
    setState((prev) => {
      const existing = prev.telegramQuestions || [];
      const combined = [...newQuestions, ...existing];
      const dedupedQuestions = deduplicateQuestions(combined);
      
      // If auto-save high-yield is enabled, also auto-save high-yield pearls
      let updatedPearls = prev.customPearls || [];
      if (prev.settings.autoSaveHighYield ?? true) {
        const highYieldsToSave = newQuestions.filter((q) => q.difficulty === 'high-yield' && q.highYieldPearl);
        const existingPearlTitles = new Set(updatedPearls.map((p) => p.title.toLowerCase()));
        
        highYieldsToSave.forEach((q) => {
          if (!existingPearlTitles.has(q.topic.toLowerCase())) {
            updatedPearls = [
              {
                id: `pearl-auto-${q.id}`,
                subjectId: q.subjectId,
                title: q.topic,
                highYieldKey: q.highYieldPearl || q.topic,
                explanation: q.explanation,
                tags: [...(q.tags || []), 'Auto-Saved from Telegram', 'High-Yield'],
                isHighYield: true,
                isBookmarked: true,
              },
              ...updatedPearls,
            ];
            existingPearlTitles.add(q.topic.toLowerCase());
          }
        });
      }

      return {
        ...prev,
        telegramQuestions: dedupedQuestions,
        customPearls: updatedPearls,
      };
    });
  };

  const handleAddTelegramAnnouncements = (newAnnouncements: TelegramAnnouncement[]) => {
    setState((prev) => {
      const existing = prev.telegramAnnouncements || [];
      const combined = [...newAnnouncements, ...existing];
      const deduped = deduplicateAnnouncements(combined);
      return {
        ...prev,
        telegramAnnouncements: deduped,
      };
    });
  };

  const handleUpdateTelegramAnnouncement = (announcementId: string, updates: Partial<TelegramAnnouncement>) => {
    setState((prev) => {
      const list = prev.telegramAnnouncements || [];
      return {
        ...prev,
        telegramAnnouncements: list.map((a) => (a.id === announcementId ? { ...a, ...updates } : a)),
      };
    });
  };

  const handleToggleAutoSaveHighYield = () => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        autoSaveHighYield: !(prev.settings.autoSaveHighYield ?? true),
      },
    }));
  };

  const handleAddTelegramChannel = (channel: TelegramChannelConfig) => {
    setState((prev) => ({
      ...prev,
      telegramChannels: [...(prev.telegramChannels || []), channel],
    }));
  };

  const handleDeleteTelegramChannel = (channelId: string) => {
    setState((prev) => ({
      ...prev,
      telegramChannels: (prev.telegramChannels || []).filter((c) => c.id !== channelId),
    }));
  };

  // Settings & Reset Handlers
  const handleUpdateSettings = (settings: AppSettings) => {
    setState((prev) => {
      const next = {
        ...prev,
        settings,
      };
      saveAppState(next);
      return next;
    });
  };

  const handleImportState = (importedState: AppState) => {
    setState(() => importedState);
  };

  const handleResetState = (freshState: AppState) => {
    setState(() => freshState);
  };

  const latestGT = useMemo(() => {
    const tests = state.grandTests || [];
    return tests.length
      ? [...tests].sort((a, b) => b.date.localeCompare(a.date))[0]
      : null;
  }, [state.grandTests]);

  // Initial Auth Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F3F6FA] flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center max-w-sm text-center">
          <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg mb-4 animate-pulse motion-reduce:animate-none">
            <span className="font-['Outfit'] text-3xl font-extrabold tracking-tight leading-none text-white">1S</span>
          </span>
          <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">ONE SHOT FMGE</h3>
          <p className="text-xs text-slate-400 mt-1 font-medium font-['Plus_Jakarta_Sans']">Restoring your study plan...</p>
          <div className="w-48 bg-slate-200 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-sky-500 h-full rounded-full animate-pulse motion-reduce:animate-none w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated State -> Show AuthScreen
  if (!user && !isGuest) {
    return <AuthScreen />;
  }

  // Authenticated but the user profile is not yet resolved (still restoring from
  // Firestore): keep showing a restoring state instead of flashing the main app
  // before we know whether onboarding is required. This prevents the "main app
  // briefly shows, then bounces back to onboarding" race.
  //
  // Guest and DEV_AUTH_BYPASS modes resolve their profile synchronously, so they
  // never hit this branch.
  if (!DEV_AUTH_BYPASS && !isGuest && !profile) {
    return (
      <div className="min-h-screen bg-[#F3F6FA] flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center max-w-sm text-center">
          <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg mb-4 animate-pulse motion-reduce:animate-none">
            <span className="font-['Outfit'] text-3xl font-extrabold tracking-tight leading-none text-white">1S</span>
          </span>
          <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">ONE SHOT FMGE</h3>
          <p className="text-xs text-slate-400 mt-1 font-medium font-['Plus_Jakarta_Sans']">Preparing your workspace&hellip;</p>
          <div className="w-48 bg-slate-200 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-sky-500 h-full rounded-full animate-pulse motion-reduce:animate-none w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  // Authenticated but onboarding incomplete -> block the app and run onboarding.
  const shouldRenderOnboarding = (onboardingGate || obSessionActive) && !obAcknowledged;
  if (shouldRenderOnboarding) {
    return <OnboardingFlow onComplete={() => setObAcknowledged(true)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#F3F8F8] to-[#EFF5F9] text-slate-900 flex flex-col lg:flex-row selection:bg-slate-900 selection:text-white">
      {/* Desktop Left Navigation Rail */}
      <SidebarDock
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        stats={stats}
        onOpenAiCoach={() => handleOpenAiCoach('strategy')}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenCloudSync={() => setIsCloudSyncOpen(true)}
        userName={profile?.displayName || state.settings.userName}
        userEmail={user?.email || profile?.email || ''}
        photoURL={profile?.photoURL || user?.photoURL || undefined}
        syncStatus={syncStatus}
      />

      {/* Main Workspace Column */}
      <div className="relative flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Atmospheric Ambient Study Artwork Backdrop (Subtle & Non-competing) */}
        {bgOpacity > 0 && (
          <div
            key={activeBg.id}
            className="hidden xl:block pointer-events-none fixed top-0 right-0 w-[50vw] max-w-[720px] h-[640px] z-0 transition-all duration-700 ease-in-out"
            style={{
              opacity: Math.min(bgOpacity * 0.04, 0.035),
              backgroundImage: `url(${activeBg.url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              filter: 'blur(3px) saturate(0.6)',
              maskImage:
                'radial-gradient(ellipse 90% 85% at 90% 10%, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0) 80%)',
              WebkitMaskImage:
                'radial-gradient(ellipse 90% 85% at 90% 10%, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0) 80%)',
            }}
          />
        )}

        {/* Mobile Top Navbar & Bottom Bar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={handleSetActiveTab}
          stats={stats}
          onOpenAiCoach={() => handleOpenAiCoach('strategy')}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenNotifications={() => setIsNotificationCenterOpen(true)}
          onOpenCloudSync={() => setIsCloudSyncOpen(true)}
          userName={profile?.displayName || state.settings.userName}
          userEmail={user?.email || profile?.email || ''}
          photoURL={profile?.photoURL || user?.photoURL || undefined}
          syncStatus={syncStatus}
        />

        {/* Main Content Area */}
        <main className="workspace-main relative z-10 flex-1 w-full mx-auto pb-24 lg:pb-0">
          <ErrorBoundary resetKey={activeTab}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                {activeTab === 'dashboard' && (
                  <DashboardView
                    state={state}
                    stats={stats}
                    onSelectSubject={handleSelectSubject}
                    onNavigateTab={handleSetActiveTab}
                    onOpenAiCoach={handleOpenAiCoach}
                    onLaunchPracticeSession={handleLaunchPracticeSession}
                    onToggleTask={handleToggleTask}
                    onToggleMissionCompletion={handleToggleMissionCompletion}
                    onAddTask={handleAddTask}
                    onToggleTopicState={handleToggleTopicState}
                    activeBg={activeBg}
                    onShuffleBg={handleCycleBg}
                    onOpenProfile={() => setIsProfileOpen(true)}
                  />
                )}

                {activeTab === 'syllabus' && (
                  <SyllabusView
                    state={state}
                    onSelectSubject={handleSelectSubject}
                    onToggleTopicState={handleToggleTopicState}
                    onUpdateConfidence={handleUpdateConfidence}
                  />
                )}

                {activeTab === 'practice' && (
                  <PracticeView
                    state={state}
                    onLaunchPracticeSession={(subjectId, topicId, topicName, subtopic) =>
                      handleLaunchPracticeSession(subjectId, topicId, topicName, subtopic)
                    }
                    onAddErrorItem={handleAddErrorItem}
                    onOpenAiCoach={handleOpenAiCoach}
                    onUpdateAppState={setState}
                    onAddTask={handleAddTask}
                  />
                )}

                {activeTab === 'grandtests' && (
                  <GrandTestsView
                    state={state}
                    onAddGrandTest={handleAddGrandTest}
                    onDeleteGrandTest={handleDeleteGrandTest}
                  />
                )}

                {activeTab === 'telegram' && (
                  <TelegramHubView
                    questions={state.telegramQuestions}
                    channels={state.telegramChannels}
                    announcements={state.telegramAnnouncements}
                    onUpdateAppState={setState}
                    onAddToErrorNotebook={(item) => handleAddErrorItem(item as any)}
                    onSaveAsPearl={(pearl) => handleAddCustomPearl({ ...pearl, id: `pearl-${Date.now()}` } as any)}
                    onRecordAttempt={recordQuestionAttempt}
                  />
                )}

                {activeTab === 'errors' && (
                  <ErrorsView
                    state={state}
                    onAddErrorItem={handleAddErrorItem}
                    onToggleErrorReviewed={handleToggleErrorReviewed}
                    onDeleteErrorItem={handleDeleteErrorItem}
                    onUpdateAppState={setState}
                    onLaunchPracticeSession={handleLaunchPracticeSession}
                    onOpenAiCoach={handleOpenAiCoach}
                    onSelectSubject={handleSelectSubject}
                  />
                )}

                {activeTab === 'progress' && (
                  <ProgressView
                    state={state}
                    stats={stats}
                    onSelectSubject={handleSelectSubject}
                    onToggleTopicState={handleToggleTopicState}
                    onAddTask={handleAddTask}
                    onOpenAiCoach={handleOpenAiCoach}
                    onUpdateSubjectRevisionDate={handleUpdateSubjectRevisionDate}
                  />
                )}

                {activeTab === 'predictor' && (
                  <FmgePredictorView
                    state={state}
                    onSelectSubject={handleSelectSubject}
                    onOpenAiCoach={handleOpenAiCoach}
                    onToggleTopicState={handleToggleTopicState}
                    onAddTask={handleAddTask}
                  />
                )}

                {activeTab === 'revision' && (
                  <RevisionMatrixView
                    state={state}
                    stats={stats}
                    onSelectSubject={handleSelectSubject}
                    onToggleTopicState={handleToggleTopicState}
                    onUpdateSubjectRevisionDate={handleUpdateSubjectRevisionDate}
                  />
                )}

                {activeTab === 'more' && (
                  <MoreView
                    state={state}
                    stats={stats}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onOpenProfile={() => setIsProfileOpen(true)}
                    onOpenAiCoach={handleOpenAiCoach}
                    onAddErrorItem={handleAddErrorItem}
                    onToggleErrorReviewed={handleToggleErrorReviewed}
                    onDeleteErrorItem={handleDeleteErrorItem}
                    onUpdateAppState={setState}
                    onAddTask={handleAddTask}
                    onToggleTask={handleToggleTask}
                    onDeleteTask={handleDeleteTask}
                    onUpdateDailyLog={handleUpdateDailyLog}
                    onToggleBookmark={handleToggleBookmark}
                    onAddCustomPearl={handleAddCustomPearl}
                    onLaunchPracticeSession={handleLaunchPracticeSession}
                    onSelectSubject={handleSelectSubject}
                  />
                )}

                {activeTab === 'daily' && (
                  <DailyPlannerView
                    state={state}
                    onAddTask={handleAddTask}
                    onToggleTask={handleToggleTask}
                    onDeleteTask={handleDeleteTask}
                    onUpdateDailyLog={handleUpdateDailyLog}
                    onLaunchPracticeSession={handleLaunchPracticeSession}
                  />
                )}

                {activeTab === 'pearls' && (
                  <PearlsVaultView
                    state={state}
                    onToggleBookmark={handleToggleBookmark}
                    onAddCustomPearl={handleAddCustomPearl}
                  />
                )}

                {activeTab === 'aicoach' && (
                  <AiCoachView
                    state={state}
                    latestGT={latestGT}
                    daysRemaining={stats.daysRemaining}
                    initialTab={aiCoachInitialTab}
                    initialSubject={aiCoachInitialSubject}
                    initialTopic={aiCoachInitialTopic}
                    onClearInitialTrigger={() => {
                      setAiCoachInitialTopic(undefined);
                      setAiCoachInitialSubject(undefined);
                    }}
                    onRecordAttempt={recordQuestionAttempt}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
        </main>
      </div>

      {/* AI Medical Coach Modal */}
      <AiCoachModal
        isOpen={isAiCoachOpen}
        onClose={() => setIsAiCoachOpen(false)}
        initialTab={aiCoachInitialTab}
        initialSubject={aiCoachInitialSubject}
        initialTopic={aiCoachInitialTopic}
        latestGT={latestGT}
        daysRemaining={stats.daysRemaining}
        state={state}
        onRecordAttempt={recordQuestionAttempt}
      />

      {/* 10-Question Sequential High-Yield Practice Session Modal */}
      <PracticeMcqSessionModal
        isOpen={practiceSessionContext !== null}
        onClose={() => setPracticeSessionContext(null)}
        context={practiceSessionContext}
        onRecordAttempt={recordQuestionAttempt}
      />

      {/* Subject Detail Deep Dive Modal */}
      <SubjectDetailModal
        subject={selectedSubject}
        isOpen={selectedSubjectId !== null}
        onClose={() => setSelectedSubjectId(null)}
        progress={selectedSubjectId ? state.subjectProgress[selectedSubjectId] : undefined}
        topicsState={state.topicsState}
        state={state}
        onToggleTopicState={handleToggleTopicState}
        onUpdateConfidence={handleUpdateConfidence}
        onAddCustomTopic={handleAddCustomTopic}
        onUpdateSubjectDetails={handleUpdateSubjectDetails}
        onLaunchPracticeMcq={(ctx) => handleLaunchPracticeSession(ctx.subjectId, ctx.topicId, ctx.topicName)}
        onOpenAiCoach={handleOpenAiCoach}
      />

      {/* Dedicated Doctor Profile & Exam Blueprint Modal */}
      <DoctorProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        state={state}
        stats={stats}
        onUpdateSettings={handleUpdateSettings}
        onImportState={handleImportState}
      />

      {/* Dedicated App Settings & Visual Preferences Modal */}
      <AppSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        state={state}
        onUpdateSettings={handleUpdateSettings}
        onResetState={handleResetState}
      />

      {/* Legacy Local Data Migration Modal */}
      {showMigrationPrompt && <DataMigrationModal />}

      {/* Global Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        state={state}
        onNavigateTab={handleSetActiveTab}
        onSelectSubject={handleSelectSubject}
        onLaunchPracticeSession={handleLaunchPracticeSession}
      />

      {/* Global Cloud Sync & Telemetry Modal */}
      <CloudSyncModal
        isOpen={isCloudSyncOpen}
        onClose={() => setIsCloudSyncOpen(false)}
        state={state}
        syncStatus={syncStatus}
        onUpdateAppState={setState}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

export default App;
