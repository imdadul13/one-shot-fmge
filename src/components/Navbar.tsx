import React, { useState, useRef, useEffect } from 'react';
import {
  Home,
  BookOpen,
  Edit3,
  BarChart3,
  BookMarked,
  Bot,
  Settings,
  MoreHorizontal,
  Cloud,
  GraduationCap,
  RotateCcw,
  FileSpreadsheet,
  TrendingUp,
  ChevronDown,
  Menu,
  Bell,
  Send,
  Calendar,
  MessageSquare,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import OneShotLogo from './OneShotLogo';
import { AppStats } from '../utils/storage';
import { SyncStatus } from '../types';

export type ActiveTab =
  | 'dashboard'
  | 'syllabus'
  | 'practice'
  | 'progress'
  | 'errors'
  | 'predictor'
  | 'revision'
  | 'grandtests'
  | 'daily'
  | 'pearls'
  | 'telegram'
  | 'aicoach'
  | 'more';

export interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  stats: AppStats;
  onOpenAiCoach: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenNotifications?: () => void;
  onOpenCloudSync?: () => void;
  userName: string;
  userEmail?: string;
  photoURL?: string | null;
  syncStatus?: SyncStatus;
}

export const primaryNavItems = [
  { id: 'dashboard' as ActiveTab, label: 'Home', icon: Home },
  { id: 'syllabus' as ActiveTab, label: 'Study', icon: BookOpen },
  { id: 'practice' as ActiveTab, label: 'Practice', icon: Edit3 },
  { id: 'progress' as ActiveTab, label: 'Performance', icon: BarChart3 },
  { id: 'pearls' as ActiveTab, label: 'Knowledge', icon: BookMarked },
  { id: 'aicoach' as ActiveTab, label: 'Mentor', icon: Bot },
];

export const secondaryNavItems = [
  { id: 'grandtests' as ActiveTab, label: 'Grand Tests', icon: GraduationCap, desc: '300-Q NBE mock exam' },
  { id: 'revision' as ActiveTab, label: 'Spaced Revision', icon: RotateCcw, desc: 'Ebbinghaus retention desk' },
  { id: 'errors' as ActiveTab, label: 'Error Vault', icon: FileSpreadsheet, desc: 'Mistake triage & remediation' },
  { id: 'predictor' as ActiveTab, label: 'Score Predictor', icon: TrendingUp, desc: 'Monte Carlo pass probability' },
  { id: 'daily' as ActiveTab, label: 'Daily Planner', icon: Calendar, desc: 'Personalized study schedule' },
  { id: 'telegram' as ActiveTab, label: 'Telegram Hub', icon: Send, desc: 'Curated question feeds' },
];

export const mobileNavItems = [
  { id: 'dashboard' as ActiveTab, label: 'Home', icon: Home },
  { id: 'syllabus' as ActiveTab, label: 'Study', icon: BookOpen },
  { id: 'practice' as ActiveTab, label: 'Practice', icon: Edit3 },
  { id: 'progress' as ActiveTab, label: 'Performance', icon: BarChart3 },
];

export const mobileMoreItems: Array<{ id: ActiveTab; label: string; icon: typeof Home; desc?: string }> = [
  { id: 'pearls' as ActiveTab, label: 'Knowledge', icon: BookMarked },
  { id: 'aicoach' as ActiveTab, label: 'Mentor', icon: Bot },
  ...secondaryNavItems.map((s) => ({ ...s })),
];

/** Desktop Left Vertical Sidebar Dock (Visual Source of Truth Architecture) */
export const SidebarDock: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenProfile,
  onOpenAiCoach,
  onOpenCloudSync,
  userName,
  photoURL,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const isTabActive = (id: ActiveTab) => activeTab === id;
  const isSecondaryActive = secondaryNavItems.some((s) => s.id === activeTab);

  const initials = (userName || 'Dr')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <aside className="hidden lg:flex flex-col justify-between w-60 xl:w-64 shrink-0 h-screen sticky top-0 bg-white border-r border-slate-100 z-40 select-none font-['Plus_Jakarta_Sans'] p-4">
      {/* Top: Brand Identity & Primary Nav */}
      <div className="space-y-6">
        {/* Brand Header */}
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer px-2 py-1 group"
          title="ONE SHOT FMGE"
        >
          <div className="h-9 w-9 rounded-xl bg-[#006B63] flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
            <span>S</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-extrabold text-slate-900 tracking-tight text-sm font-['Outfit']">
              ONE SHOT <span className="text-[#006B63]">FMGE</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-tight">
              A Brighter Doctor Tomorrow
            </span>
          </div>
        </div>

        {/* Primary Nav List */}
        <nav className="space-y-1" aria-label="Main Navigation">
          {primaryNavItems.map(({ id, label, icon: Icon }) => {
            const active = isTabActive(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  active
                    ? 'bg-[#006B63]/10 text-[#006B63]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`h-4.5 w-4.5 shrink-0 ${
                    active ? 'text-[#006B63] stroke-[2.2]' : 'text-slate-400 stroke-[1.8]'
                  }`}
                />
                <span>{label}</span>
              </button>
            );
          })}

          {/* More Menu Dropdown Trigger */}
          <div className="relative pt-1" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                isSecondaryActive
                  ? 'bg-[#006B63]/10 text-[#006B63]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <MoreHorizontal
                  className={`h-4.5 w-4.5 shrink-0 ${
                    isSecondaryActive ? 'text-[#006B63] stroke-[2.2]' : 'text-slate-400 stroke-[1.8]'
                  }`}
                />
                <span>More</span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                  isMoreMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Secondary Flyout Menu */}
            {isMoreMenuOpen && (
              <div className="absolute left-full top-0 ml-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Additional Tools
                  </span>
                </div>
                {secondaryNavItems.map(({ id, label, icon: Icon, desc }) => {
                  const active = isTabActive(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setActiveTab(id);
                        setIsMoreMenuOpen(false);
                      }}
                      className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#006B63]/10 text-[#006B63]'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-lg mt-0.5 ${
                          active ? 'bg-[#006B63] text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold leading-tight">{label}</span>
                        <span className="text-[10px] text-slate-400 truncate">{desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Bottom Section: Motivational Banner, Help, Profile */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        {/* Mountain Stay Consistent Card */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-sky-50 via-teal-50/50 to-emerald-50 border border-teal-100/70 p-3.5">
          <div className="relative z-10 space-y-1">
            <span className="text-[11px] font-bold text-[#006B63] block">Stay consistent</span>
            <p className="text-xs font-bold text-slate-800 leading-tight">
              A brighter doctor tomorrow.
            </p>
          </div>
          {/* Subtle Mountain Artwork */}
          <div className="absolute right-0 bottom-0 pointer-events-none opacity-40">
            <svg width="70" height="40" viewBox="0 0 70 40" fill="none">
              <path d="M10 40L35 12L45 24L65 40H10Z" fill="#0d9488" fillOpacity="0.3" />
              <path d="M30 40L50 18L65 35L70 40H30Z" fill="#0284c7" fillOpacity="0.2" />
              <circle cx="35" cy="11" r="2" fill="#e11d48" />
            </svg>
          </div>
        </div>

        {/* Need Help Button */}
        <button
          type="button"
          onClick={onOpenAiCoach}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
        >
          <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
          <span>Need help?</span>
        </button>

        {/* User Card */}
        <div
          onClick={onOpenProfile}
          className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
          title="Doctor Profile & Blueprint"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-['Outfit'] font-bold text-xs shrink-0 ring-2 ring-slate-900/10">
              {photoURL ? (
                <img src={photoURL} alt={userName} className="h-full w-full object-cover rounded-full" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-slate-900 truncate group-hover:text-[#006B63] transition-colors">
                {userName || 'Imdadul'}
              </span>
              <span className="block text-[10px] text-slate-400 font-medium truncate">
                FMGE Aspirant
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenSettings();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

/** Mobile Purpose-Built Bottom Navigation & Top Bar */
export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenProfile,
  onOpenNotifications,
  userName,
  photoURL,
}) => {
  const initials = (userName || 'Dr')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isTabActive = (id: ActiveTab) => activeTab === id;

  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const mobileMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileMoreOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (mobileMoreRef.current && !mobileMoreRef.current.contains(e.target as Node)) {
        setMobileMoreOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileMoreOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [mobileMoreOpen]);

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-2.5 flex items-center justify-between font-['Plus_Jakarta_Sans']">
        <div className="flex items-center gap-2">
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 cursor-pointer"
            title="ONE SHOT FMGE"
          >
            <div className="h-7 w-7 rounded-lg bg-[#006B63] flex items-center justify-center text-white font-black text-sm">
              <span>S</span>
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight text-xs font-['Outfit']">
              ONE SHOT <span className="text-[#006B63]">FMGE</span>
            </span>
          </div>
        </div>

        {/* Right Action Icons: Bell + Avatar */}
        <div className="flex items-center gap-2">
          {onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-50 transition-colors cursor-pointer"
              title="View Study Notifications"
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenProfile}
            className="h-8 w-8 rounded-full overflow-hidden bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-xs cursor-pointer ring-2 ring-slate-900/10"
          >
            {photoURL ? (
              <img src={photoURL} alt={userName} className="h-full w-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Floating Rounded Bottom Navigation Bar */}
      <nav
        ref={mobileMoreRef}
        className="lg:hidden fixed left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-1.5rem)] w-auto bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-full px-2 py-1 font-['Plus_Jakarta_Sans']"
        style={{ bottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}
        aria-label="Mobile Navigation"
      >
        <div className="flex items-center gap-1">
          {mobileNavItems.map(({ id, label, icon: Icon }) => {
            const active = isTabActive(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center justify-center gap-1.5 h-9 px-3 rounded-full transition-all duration-150 cursor-pointer ${
                  active
                    ? 'bg-[#006B63] text-white shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
                title={label}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-white stroke-[2.2]' : 'text-slate-500 stroke-[1.8]'}`} />
                {active && (
                  <span className="text-[11px] font-semibold tracking-tight">
                    {label}
                  </span>
                )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileMoreOpen((o) => !o)}
            className={`flex items-center justify-center gap-1.5 h-9 px-3 rounded-full transition-all duration-150 cursor-pointer ${
              mobileMoreOpen
                ? 'bg-[#006B63] text-white shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title="More"
          >
            <MoreHorizontal className={`h-4 w-4 ${mobileMoreOpen ? 'text-white stroke-[2.2]' : 'text-slate-500 stroke-[1.8]'}`} />
            {mobileMoreOpen && (
              <span className="text-[11px] font-semibold tracking-tight">More</span>
            )}
          </button>
        </div>

        {/* Mobile "More" Overlay Menu */}
        {mobileMoreOpen && (
          <div
            className="absolute bottom-[calc(100%+0.5rem)] right-0 left-0 z-50 max-h-[60vh] overflow-y-auto rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-[0_12px_40px_rgba(0,0,0,0.16)] p-2 font-['Plus_Jakarta_Sans']"
            role="menu"
            aria-label="All Tabs"
            onClick={() => setMobileMoreOpen(false)}
          >
            {mobileMoreItems.map(({ id, label, icon: Icon, desc }) => {
              const active = isTabActive(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setActiveTab(id);
                    setMobileMoreOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                    active ? 'bg-[#006B63]/10 text-[#006B63]' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-[#006B63]' : 'text-slate-400'}`} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight">{label}</span>
                    {desc && <span className="block text-[11px] text-slate-400 truncate">{desc}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </nav>
    </>
  );
};

