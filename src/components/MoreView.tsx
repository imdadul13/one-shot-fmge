import React, { useState } from 'react';
import {
  AlertCircle,
  Send,
  BookOpen,
  Settings,
  ListTodo,
  ChevronRight,
  User,
  ArrowLeft,
  Layers,
} from 'lucide-react';
import { AppState, ErrorNotebookItem, DailyTask, DailyStudyLog, MedicalPearl } from '../types';
import { AppStats } from '../utils/storage';
import { TelegramHubView } from './TelegramHubView';
import { PearlsVaultView } from './PearlsVaultView';
import { DailyPlannerView } from './DailyPlannerView';

interface MoreViewProps {
  state: AppState;
  stats: AppStats;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenAiCoach: (
    initialTab?: 'vignette' | 'concept' | 'diagnosis' | 'strategy',
    subjectId?: string,
    topicName?: string
  ) => void;
  onAddErrorItem: (item: ErrorNotebookItem) => void;
  onToggleErrorReviewed: (id: string) => void;
  onDeleteErrorItem: (id: string) => void;
  onUpdateAppState: (updater: (prev: AppState) => AppState) => void;
  onAddTask?: (task: DailyTask) => void;
  onToggleTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onUpdateDailyLog?: (dateStr: string, updates: Partial<DailyStudyLog>) => void;
  onToggleBookmark?: (pearlId: string) => void;
  onAddCustomPearl?: (pearl: MedicalPearl) => void;
  onLaunchPracticeSession?: (
    subjectId: string,
    topicId: string,
    topicName: string,
    subtopic?: string
  ) => void;
  onSelectSubject?: (subjectId: string) => void;
}

type MoreSection = 'hub' | 'telegram' | 'pearls' | 'planner';

export const MoreView: React.FC<MoreViewProps> = ({
  state,
  stats,
  onOpenSettings,
  onOpenProfile,
  onOpenAiCoach,
  onAddErrorItem,
  onToggleErrorReviewed,
  onDeleteErrorItem,
  onUpdateAppState,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onUpdateDailyLog,
  onToggleBookmark,
  onAddCustomPearl,
  onLaunchPracticeSession,
  onSelectSubject,
}) => {
  const [activeSection, setActiveSection] = useState<MoreSection>('hub');

  const hubItems = [
    {
      id: 'planner' as MoreSection,
      title: 'Daily Study Planner',
      subtitle: 'Dedicated daily study task list and logged time tracker.',
      badge: `${state.dailyTasks?.length || 0} Tasks`,
      icon: ListTodo,
    },
    {
      id: 'pearls' as MoreSection,
      title: 'High-Yield Pearls & Mnemonics',
      subtitle: 'Curated 19-subject clinical takeaways and bookmark vault.',
      badge: `${state.bookmarkedPearlIds?.length || 0} Bookmarks`,
      icon: BookOpen,
    },
    {
      id: 'telegram' as MoreSection,
      title: 'Telegram Live QBank Feed',
      subtitle: 'Community clinical questions and real-time medical updates.',
      badge: `${state.telegramQuestions?.length || 0} Questions`,
      icon: Send,
    },
  ];

  return (
    <div className="page-container space-y-8 font-sans text-slate-900">
      {/* Back button if in sub-section */}
      {activeSection !== 'hub' && (
        <div className="pb-2">
          <button
            type="button"
            onClick={() => setActiveSection('hub')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold font-display border border-slate-200 transition-all cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Utilities Directory</span>
          </button>
        </div>
      )}

      {/* VIEW: MAIN HUB */}
      {activeSection === 'hub' && (
        <div className="space-y-8">
          {/* Header */}
          <header className="space-y-2 border-b border-slate-200/80 pb-6">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              SECONDARY INSTRUMENTS & UTILITIES
            </span>
            <h1 className="text-3xl sm:text-4xl font-semibold font-display tracking-tight text-slate-900">
              Medical Utilities & Vault
            </h1>
            <p className="text-sm sm:text-base text-slate-500 max-w-2xl leading-relaxed">
              Secondary study utilities, error vault, community question stream, daily planners, and revision tools.
            </p>
          </header>

          {/* Directory of Hub Items */}
          <div className="divide-y divide-slate-100 editorial-surface overflow-hidden">
            {hubItems.map(({ id, title, subtitle, badge, icon: Icon }) => (
              <div
                key={id}
                onClick={() => setActiveSection(id)}
                className="p-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-11 w-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0">
                    <Icon className="h-5 w-5 text-slate-700" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-base font-semibold font-display text-slate-900 group-hover:text-sky-900 transition-colors">
                      {title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-semibold">
                    {badge}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: DAILY PLANNER */}

      {/* VIEW: TELEGRAM HUB */}
      {activeSection === 'telegram' && (
        <TelegramHubView
          onAddToErrorNotebook={onAddErrorItem}
          onUpdateAppState={onUpdateAppState}
        />
      )}

      {/* VIEW: PEARLS & MNEMONICS */}
      {activeSection === 'pearls' && (
        <PearlsVaultView
          state={state}
          onToggleBookmark={onToggleBookmark || (() => {})}
          onAddCustomPearl={onAddCustomPearl || (() => {})}
        />
      )}

      {/* VIEW: DAILY PLANNER */}
      {activeSection === 'planner' && (
        <DailyPlannerView
          state={state}
          onAddTask={onAddTask || (() => {})}
          onToggleTask={onToggleTask || (() => {})}
          onDeleteTask={onDeleteTask || (() => {})}
          onUpdateDailyLog={onUpdateDailyLog || (() => {})}
        />
      )}
    </div>
  );
};
