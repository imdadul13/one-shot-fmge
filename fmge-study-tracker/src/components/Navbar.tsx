import React from 'react';
import {
  Activity,
  BarChart3,
  BookmarkCheck,
  BookOpen,
  Clock3,
  Flame,
  RotateCw,
  Send,
  Settings,
  Sparkles,
  UserRound,
  Cloud,
} from 'lucide-react';
import { AppStats } from '../utils/storage';
import { SyncStatus } from '../types';

export type ActiveTab = 'dashboard' | 'syllabus' | 'predictor' | 'revision' | 'grandtests' | 'daily' | 'pearls' | 'telegram';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  stats: AppStats;
  onOpenAiCoach: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  userName: string;
  userEmail?: string;
  photoURL?: string | null;
  syncStatus?: SyncStatus;
}

const navItems: { id: ActiveTab; label: string; shortLabel: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: Activity },
  { id: 'syllabus', label: '19-subject syllabus', shortLabel: 'Syllabus', icon: BookOpen },
  { id: 'predictor', label: 'FMGE Predictor', shortLabel: 'Predictor', icon: Flame },
  { id: 'revision', label: 'Revision matrix', shortLabel: 'Revisions', icon: RotateCw },
  { id: 'grandtests', label: 'Grand tests + errors', shortLabel: 'Tests', icon: BarChart3 },
  { id: 'daily', label: 'Daily planner', shortLabel: 'Planner', icon: Clock3 },
  { id: 'pearls', label: 'Pearls vault', shortLabel: 'Pearls', icon: BookmarkCheck },
  { id: 'telegram', label: 'Telegram MCQ hub', shortLabel: 'Telegram', icon: Send },
];


export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  stats,
  onOpenAiCoach,
  onOpenSettings,
  onOpenProfile,
  userName,
  userEmail,
  photoURL,
  syncStatus = 'synced',
}) => {
  const targetQuestions = 100;
  const minutes = stats.todayStudyMinutes;
  const initials = (userName || 'Dr').split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase();

  return (
    <header className="sticky top-0 z-40 mx-auto w-full max-w-[1450px] px-3 pt-3 sm:px-6 lg:px-8">
      <div className="workspace-nav overflow-hidden rounded-[1.35rem] border border-[#cfe2df] bg-[#fffefd]/95 shadow-xs backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="group flex items-center gap-3 text-left"
            id="nav-logo-btn"
            data-testid="button-nav-dashboard"
          >
              <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-[14px] bg-[#084d50] text-white shadow-sm">
              <span className="absolute -right-2 -top-2 h-7 w-7 rounded-full bg-[#e8806d]/80" />
                <span className="relative font-display text-2xl italic leading-none">F</span>
            </span>
            <span>
              <span className="flex items-center gap-2">
                 <span className="font-semibold tracking-[-.03em] text-[#183d3b]">FMGE Study Tracker</span>
                 <span className="hidden rounded-full bg-[#e5f2ef] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.15em] text-[#0d6866] sm:inline">300 marks</span>
              </span>
               <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[.16em] text-[#7b9697]">Your calm before the result</span>
            </span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cloud Sync Status Indicator */}
            <button
              type="button"
              onClick={onOpenProfile}
              className="hidden lg:flex items-center gap-1.5 rounded-xl border border-[#cfe2df] bg-[#f8fbfa] px-2.5 py-1.5 text-[10px] font-bold text-[#527776] hover:bg-[#edf5f4] transition-all"
              title={`Cloud sync: ${syncStatus.toUpperCase()} (Click to open profile)`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  syncStatus === 'synced'
                    ? 'bg-[#10b981]'
                    : syncStatus === 'syncing'
                    ? 'bg-[#f59e0b] animate-ping'
                    : syncStatus === 'offline'
                    ? 'bg-[#64748b]'
                    : 'bg-[#ef4444]'
                }`}
              />
              <span className="uppercase tracking-wider">
                {syncStatus === 'synced'
                  ? 'Synced'
                  : syncStatus === 'syncing'
                  ? 'Syncing...'
                  : syncStatus === 'offline'
                  ? 'Offline'
                  : 'Sync Error'}
              </span>
            </button>

            <div className="hidden border-r border-[#d6e5e3] pr-4 text-right sm:block">
              <p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#87a0a1]">Today’s rhythm</p>
              <p className="font-mono text-[11px] font-bold text-[#35565d]">{stats.todayQuestionsSolved}/{targetQuestions} MCQs <span className="text-[#9ab0af]">·</span> {Math.floor(minutes / 60)}h {minutes % 60}m</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-[#f3c7bd] bg-[#fff5f1] px-2.5 py-1.5" data-testid="status-exam-countdown">
              <span className="h-2 w-2 rounded-full bg-[#e8806d] shadow-[0_0_0_4px_rgba(232,128,109,.14)]" />
              <span>
                <span className="block text-[9px] font-bold uppercase tracking-[.13em] text-[#b9786c]">Exam in</span>
                <span className="font-mono text-xs font-bold text-[#994b42]">{stats.daysRemaining} days</span>
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenAiCoach}
              id="nav-ai-coach-btn"
              data-testid="button-open-ai-coach"
              title="Open AI medical coach"
              className="shine-button hidden items-center gap-1.5 rounded-xl bg-[#0d6866] px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#084d50] sm:flex"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#f6d58a]" />
              Coach
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              id="nav-settings-btn"
              data-testid="button-open-settings"
              title="Settings and data backup"
              className="rounded-xl border border-transparent p-2 text-[#628084] hover:border-[#cfe2df] hover:bg-[#edf5f4] hover:text-[#183d3b]"
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* Profile Avatar / Trigger */}
            <button
              type="button"
              onClick={onOpenProfile}
              id="nav-profile-btn"
              data-testid="button-open-profile"
              title={`Profile: ${userName || userEmail || 'Doctor'}`}
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-[#e3f0ee] text-[11px] font-bold text-[#16727a] border border-[#cfe2df] hover:border-[#0d6866] hover:shadow-xs transition-all"
            >
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={userName || 'User'}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{initials || 'DR'}</span>
              )}
            </button>
          </div>
        </div>

        <nav aria-label="Study workspace sections" className="scrollbar-none flex gap-1.5 overflow-x-auto border-t border-[#e5efed] bg-[#f5faf9] px-3 py-2 sm:px-4">
          {navItems.map(({ id, label, shortLabel, icon: Icon }) => {
            const selected = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                id={`tab-${id}`}
                data-testid={`button-tab-${id}`}
                aria-current={selected ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold transition-all ${
                  selected
                    ? 'bg-[#0d5964] text-white shadow-sm'
                    : 'text-[#668184] hover:bg-[#e3f0ee] hover:text-[#18333c]'
                }`}
                title={label}
              >
                <Icon className={`h-3.5 w-3.5 ${selected ? 'text-[#f5d58b]' : 'text-[#5b9a9c]'}`} />
                <span className="sm:hidden">{shortLabel}</span>
                <span className="hidden sm:inline">{label}</span>
                {id === 'telegram' && <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider ${selected ? 'bg-white/15 text-[#f8d68c]' : 'bg-[#d9ecea] text-[#16727a]'}`}>live</span>}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};