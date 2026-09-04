import React, { useState, useEffect, useMemo } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { SyllabusView } from './components/SyllabusView';
import { FmgePredictorView } from './components/FmgePredictorView';
import { RevisionMatrixView } from './components/RevisionMatrixView';
import { GrandTestsView } from './components/GrandTestsView';
import { DailyPlannerView } from './components/DailyPlannerView';
import { PearlsVaultView } from './components/PearlsVaultView';
import { TelegramHubView } from './components/TelegramHubView';
import { AiCoachModal } from './components/AiCoachModal';
import { SubjectDetailModal } from './components/SubjectDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthScreen } from './components/AuthScreen';
import { ProfileModal } from './components/ProfileModal';
import { OnboardingModal } from './components/OnboardingModal';
import { DataMigrationModal } from './components/DataMigrationModal';
import { AuthProvider, useAuth } from './context/AuthContext';

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
  TelegramAnnouncement
} from './types';
import { FMGE_SUBJECTS } from './data/fmgeSubjects';
import { calculateAppStats, deduplicateQuestions, deduplicateAnnouncements } from './utils/storage';
import { getLocalDateKey } from './utils/date';

function AppInner() {
  const {
    user,
    profile,
    isLoading,
    isRestoringData,
    syncStatus,
    appState: state,
    updateAppState: setState,
    showOnboarding,
    showMigrationPrompt,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Modals
  const [isAiCoachOpen, setIsAiCoachOpen] = useState(false);
  const [aiCoachInitialTab, setAiCoachInitialTab] = useState<'vignette' | 'concept' | 'diagnosis' | 'strategy'>('strategy');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

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

  const handleOpenAiCoach = (tab: 'vignette' | 'concept' | 'diagnosis' | 'strategy' = 'strategy') => {
    setAiCoachInitialTab(tab);
    setIsAiCoachOpen(true);
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
    setState((prev) => ({
      ...prev,
      settings,
    }));
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

  // Loading or Restoring State
  if (isLoading || isRestoringData) {
    return (
      <div className="min-h-screen bg-[#f8faf9] flex flex-col items-center justify-center p-6 selection:bg-[#d5edea] selection:text-[#084d50]">
        <div className="flex flex-col items-center max-w-sm text-center">
          <span className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-[#084d50] text-white shadow-lg mb-4 animate-pulse">
            <span className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-[#e8806d]/80" />
            <span className="relative font-display text-3xl italic leading-none">F</span>
          </span>
          <h3 className="text-lg font-bold text-[#183d3b]">FMGE Study Tracker</h3>
          <p className="text-xs text-[#527776] mt-1 font-medium">Restoring your FMGE progress...</p>
          <div className="w-48 bg-[#cfe2df] h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-[#0d6866] h-full rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated State -> Show AuthScreen
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="workspace-shell min-h-[100dvh] bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        onOpenAiCoach={() => handleOpenAiCoach('vignette')}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        userName={profile?.displayName || state.settings.userName}
        userEmail={user.email || profile?.email}
        photoURL={profile?.photoURL || user.photoURL}
        syncStatus={syncStatus}
      />

      {/* Main Content Area */}
      <main className="workspace-main flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            state={state}
            stats={stats}
            onSelectSubject={handleSelectSubject}
            onNavigateTab={setActiveTab}
            onOpenAiCoach={handleOpenAiCoach}
          onToggleTask={handleToggleTask}
          onToggleMissionCompletion={handleToggleMissionCompletion}
            onAddTask={handleAddTask}
            onToggleTopicState={handleToggleTopicState}
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

        {activeTab === 'predictor' && (
          <FmgePredictorView
            state={state}
            onToggleTopicState={handleToggleTopicState}
            onAddTask={handleAddTask}
            onSelectSubject={handleSelectSubject}
            onOpenAiCoach={handleOpenAiCoach}
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

        {activeTab === 'grandtests' && (
          <GrandTestsView
            state={state}
            onAddGrandTest={handleAddGrandTest}
            onDeleteGrandTest={handleDeleteGrandTest}
            onAddErrorItem={handleAddErrorItem}
            onToggleErrorReviewed={handleToggleErrorReviewed}
            onDeleteErrorItem={handleDeleteErrorItem}
            onOpenAiCoach={handleOpenAiCoach}
          />
        )}

        {activeTab === 'daily' && (
          <DailyPlannerView
            state={state}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onUpdateDailyLog={handleUpdateDailyLog}
          />
        )}

        {activeTab === 'pearls' && (
          <PearlsVaultView
            state={state}
            onToggleBookmark={handleToggleBookmark}
            onAddCustomPearl={handleAddCustomPearl}
          />
        )}

        {activeTab === 'telegram' && (
          <TelegramHubView
            questions={state.telegramQuestions || []}
            channels={state.telegramChannels || []}
            announcements={state.telegramAnnouncements || []}
            autoSaveHighYield={state.settings.autoSaveHighYield ?? true}
            onToggleAutoSaveHighYield={handleToggleAutoSaveHighYield}
            onUpdateQuestion={handleUpdateTelegramQuestion}
            onAddQuestions={handleAddTelegramQuestions}
            onAddAnnouncements={handleAddTelegramAnnouncements}
            onUpdateAnnouncement={handleUpdateTelegramAnnouncement}
            onAddChannel={handleAddTelegramChannel}
            onDeleteChannel={handleDeleteTelegramChannel}
            onAddToErrorNotebook={handleAddErrorItem}
            onSaveAsPearl={handleAddCustomPearl}
            onAddTask={handleAddTask}
          />
        )}
      </main>

      <div className="fixed bottom-4 right-4 z-30 flex items-center gap-1.5 rounded-2xl border border-[#cfe2df] bg-[#fffefb]/90 p-1.5 shadow-[0_12px_32px_rgba(24,61,59,.14)] backdrop-blur-xl sm:bottom-6 sm:right-6">
        <button
          type="button"
          onClick={() => setActiveTab('daily')}
          className="rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#52736b] hover:bg-[#e7f2ee] hover:text-[#0d6866]"
          data-testid="button-floating-focus"
          title="Open daily planner"
        >
          Focus
        </button>
        <button
          type="button"
          onClick={() => handleOpenAiCoach('vignette')}
          className="shine-button rounded-xl bg-[#0d6866] px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-white hover:bg-[#084d50]"
          data-testid="button-floating-coach"
          title="Open AI medical coach"
        >
          Coach
        </button>
      </div>

      {/* AI Medical Coach Modal */}
      <AiCoachModal
        isOpen={isAiCoachOpen}
        onClose={() => setIsAiCoachOpen(false)}
        initialTab={aiCoachInitialTab}
        latestGT={latestGT}
        daysRemaining={stats.daysRemaining}
        state={state}
      />

      {/* Subject Detail Deep Dive Modal */}
      <SubjectDetailModal
        subject={selectedSubject}
        isOpen={selectedSubjectId !== null}
        onClose={() => setSelectedSubjectId(null)}
        progress={selectedSubjectId ? state.subjectProgress[selectedSubjectId] : undefined}
        topicsState={state.topicsState}
        onToggleTopicState={handleToggleTopicState}
        onUpdateConfidence={handleUpdateConfidence}
        onAddCustomTopic={handleAddCustomTopic}
        onUpdateSubjectDetails={handleUpdateSubjectDetails}
      />

      {/* Settings & Backup Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        state={state}
        onUpdateSettings={handleUpdateSettings}
        onImportState={handleImportState}
        onResetState={handleResetState}
      />

      {/* Profile & Cloud Account Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        stats={stats}
        onOpenSettings={() => {
          setIsProfileOpen(false);
          setIsSettingsOpen(true);
        }}
      />

      {/* New User Onboarding Modal */}
      {showOnboarding && <OnboardingModal />}

      {/* Legacy Local Data Migration Modal */}
      {showMigrationPrompt && <DataMigrationModal />}
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
