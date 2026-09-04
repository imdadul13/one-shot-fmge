import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useTransform, animate } from 'motion/react';
import {
  Play,
  ArrowRight,
  Search,
  Bell,
  CheckCircle2,
  Clock,
  ChevronRight,
  BookOpen,
  Activity,
  Layers,
  X,
  GraduationCap,
  MessageSquare,
  FileSpreadsheet,
  RotateCcw,
  Calendar,
  Cloud,
  FileText,
  Target,
  Timer,
  TrendingUp,
  Sparkles,
  Flame,
  Compass,
  BarChart3,
  ChevronDown,
  Zap,
  Sun,
  Award,
  ExternalLink,
  MoreVertical,
  HelpCircle,
  Stethoscope,
} from 'lucide-react';
import { AppState, DailyTask, PracticeSessionContext } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { AppStats } from '../utils/storage';
import { ActiveTab } from './Navbar';
import { useAuth } from '../context/AuthContext';
import {
  getNextBestStudyAction,
  getDaysRemainingToExam,
} from '../utils/adaptivePriorityEngine';
import { calculateStudyStreak } from '../utils/dailyMissionEngine';
import {
  getPersonalizedDailyPlan,
  getLearningContext,
  PersonalizedPlan,
  PersonalizedPlanTask,
  LearningContext,
} from '../utils/personalizationEngine';
import { MedicalHeroVisual } from './MedicalHeroVisual';
import { TopicMasteryWorkspace } from './TopicMasteryWorkspace';
import { NotificationCenterModal } from './NotificationCenterModal';
import { hasUnreadNotifications } from '../utils/notificationEngine';

interface DashboardViewProps {
  state: AppState;
  stats: AppStats;
  onSelectSubject: (subjectId: string) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenAiCoach: (
    initialTab?: 'vignette' | 'concept' | 'diagnosis' | 'strategy',
    subjectId?: string,
    topicName?: string
  ) => void;
  onLaunchPracticeSession?: (
    subjectId: string,
    topicId: string,
    topicName: string,
    subtopic?: string
  ) => void;
  onToggleTask?: (taskId: string) => void;
  onAddTask?: (task: DailyTask) => void;
  onToggleTopicState?: (
    subjectId: string,
    topicId: string,
    field: 'notesDone' | 'qBankDone' | 'r1Done' | 'r2Done' | 'r3Done'
  ) => void;
  onToggleMissionCompletion?: (missionId: string) => void;
  activeBg?: { id: string; url: string; label: string; period: string };
  onShuffleBg?: () => void;
  onOpenProfile?: () => void;
}

/** Polite, SwiftUI-style number interpolation. No-op under reduced motion. */
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const reduced = useReducedMotion();
  const mv = useMotionValue(reduced ? value : 0);
  const displayed = useTransform(mv, (v) => Math.round(v));

  useEffect(() => {
    if (reduced) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.6, ease: 'easeOut' });
    return () => controls.stop();
  }, [value, reduced, mv]);

  return <motion.span className={className}>{displayed}</motion.span>;
}

/** Circular progress & countdown gauge for Exam Journey (Apple Fitness/Health-style) */
function CircularCountdown({
  days,
  totalDays = 90,
  reducedMotion,
}: {
  days: number;
  totalDays?: number;
  reducedMotion: boolean | null;
}) {
  const size = 124;
  const strokeWidth = 9.5;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  // Progress based on total preparation cycle
  const progressRatio = Math.min(1, Math.max(0.12, (totalDays - days) / totalDays));
  const targetOffset = circumference * (1 - progressRatio);

  return (
    <div className="relative flex items-center justify-center shrink-0 w-28 h-28 sm:w-32 sm:h-32">
      {/* Soft inner ambient glow */}
      <div className="absolute inset-2 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(13,148,136,0.08)_0%,transparent_70%)] pointer-events-none" />
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full transform -rotate-90">
        <defs>
          <linearGradient id="examCountdownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#006B63" />
            <stop offset="50%" stopColor="#0D9488" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
        {/* Soft Background Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#F1F5F9"
          strokeWidth={strokeWidth}
        />
        {/* Animated Gradient Progress Ring */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#examCountdownGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reducedMotion ? { strokeDashoffset: targetOffset } : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: targetOffset }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
        <AnimatedNumber
          value={days}
          className="font-black text-3xl sm:text-4xl text-slate-900 tracking-tight font-['Outfit'] tabular-nums leading-none"
        />
        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 mt-1 leading-tight tracking-wider uppercase font-mono">
          days left
        </span>
      </div>
    </div>
  );
}

/** Contextual Progress Styling according to mastery level */
function getContextualProgressStyle(percentage: number, rawStatusText?: string) {
  const statusLower = (rawStatusText || '').toLowerCase();
  const isStrong = percentage >= 50 || statusLower.includes('strong') || statusLower.includes('master');
  const isModerate = !isStrong && (percentage >= 20 || statusLower.includes('track') || statusLower.includes('moderate'));

  if (isStrong) {
    return {
      bar: 'bg-gradient-to-r from-[#006B63] via-[#0D9488] to-[#10B981]',
      track: 'bg-teal-50/80',
      badge: 'text-teal-800 bg-teal-50/90 border-teal-200/80',
      dot: 'bg-teal-500',
      statusText: rawStatusText || 'Strong',
    };
  }
  if (isModerate) {
    return {
      bar: 'bg-gradient-to-r from-sky-500 to-indigo-500',
      track: 'bg-sky-50/80',
      badge: 'text-sky-800 bg-sky-50/90 border-sky-200/80',
      dot: 'bg-sky-500',
      statusText: rawStatusText || 'Moderate',
    };
  }
  return {
    bar: 'bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500',
    track: 'bg-rose-50/80',
    badge: 'text-rose-800 bg-rose-50/90 border-rose-200/80',
    dot: 'bg-rose-500',
    statusText: rawStatusText || 'Needs focus',
  };
}

/** Subject Accent Colors for Progress Bars & Badges */
const SUBJECT_ACCENT_COLORS: Record<string, { bar: string; badge: string; text: string }> = {
  anatomy: { bar: 'bg-[#f43f5e]', badge: 'text-rose-700 bg-rose-50 border-rose-100', text: 'text-rose-600' },
  physiology: { bar: 'bg-[#0ea5e9]', badge: 'text-sky-700 bg-sky-50 border-sky-100', text: 'text-sky-600' },
  biochemistry: { bar: 'bg-[#8b5cf6]', badge: 'text-purple-700 bg-purple-50 border-purple-100', text: 'text-purple-600' },
  pathology: { bar: 'bg-[#0d9488]', badge: 'text-teal-700 bg-teal-50 border-teal-100', text: 'text-teal-600' },
  pharmacology: { bar: 'bg-[#f59e0b]', badge: 'text-amber-700 bg-amber-50 border-amber-100', text: 'text-amber-600' },
  microbiology: { bar: 'bg-[#06b6d4]', badge: 'text-cyan-700 bg-cyan-50 border-cyan-100', text: 'text-cyan-600' },
  fmt: { bar: 'bg-[#e11d48]', badge: 'text-rose-700 bg-rose-50 border-rose-100', text: 'text-rose-600' },
  psm: { bar: 'bg-[#10b981]', badge: 'text-emerald-700 bg-emerald-50 border-emerald-100', text: 'text-emerald-600' },
  medicine: { bar: 'bg-[#2563eb]', badge: 'text-blue-700 bg-blue-50 border-blue-100', text: 'text-blue-600' },
  surgery: { bar: 'bg-[#dc2626]', badge: 'text-red-700 bg-red-50 border-red-100', text: 'text-red-600' },
  obg: { bar: 'bg-[#ec4899]', badge: 'text-pink-700 bg-pink-50 border-pink-100', text: 'text-pink-600' },
  pediatrics: { bar: 'bg-[#14b8a6]', badge: 'text-teal-700 bg-teal-50 border-teal-100', text: 'text-teal-600' },
  ophthalmology: { bar: 'bg-[#6366f1]', badge: 'text-indigo-700 bg-indigo-50 border-indigo-100', text: 'text-indigo-600' },
  ent: { bar: 'bg-[#84cc16]', badge: 'text-lime-700 bg-lime-50 border-lime-100', text: 'text-lime-600' },
  dermatology: { bar: 'bg-[#f97316]', badge: 'text-orange-700 bg-orange-50 border-orange-100', text: 'text-orange-600' },
  psychiatry: { bar: 'bg-[#a855f7]', badge: 'text-purple-700 bg-purple-50 border-purple-100', text: 'text-purple-600' },
  radiology: { bar: 'bg-[#0284c7]', badge: 'text-sky-700 bg-sky-50 border-sky-100', text: 'text-sky-600' },
  orthopedics: { bar: 'bg-[#b45309]', badge: 'text-amber-800 bg-amber-50 border-amber-100', text: 'text-amber-700' },
  anesthesia: { bar: 'bg-[#475569]', badge: 'text-slate-700 bg-slate-100 border-slate-200', text: 'text-slate-600' },
};

const SECTION_ENTER = (delay: number, reduced: boolean | null) =>
  reduced ? {} : { delay, y: 10, opacity: 0 };
const SECTION_SHOW = { y: 0, opacity: 1 };
const SECTION_TRANSITION = (reduced: boolean | null) =>
  reduced ? { duration: 0 } : { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const };
const SPRING = (reduced: boolean | null) =>
  reduced ? { duration: 0 } : { type: 'spring' as const, stiffness: 420, damping: 34 };

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  stats,
  onSelectSubject,
  onNavigateTab,
  onOpenAiCoach,
  onLaunchPracticeSession,
  onToggleTopicState,
  activeBg,
  onShuffleBg,
  onOpenProfile,
}) => {
  const { user, profile } = useAuth();
  const [selectedFilterSubjectId, setSelectedFilterSubjectId] = useState<string>('all');
  const [activeMasteryTopic, setActiveMasteryTopic] = useState<{
    subjectId: string;
    topicId: string;
    topicName: string;
  } | null>(null);

  // Notification center modal state
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  // Unread badge reflects live visible notifications
  const hasUnread = useMemo(
    () => hasUnreadNotifications(state),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, isNotificationCenterOpen]
  );

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Filter scroll ref for subject pills
  const filterScrollRef = useRef<HTMLDivElement>(null);

  // Respect prefers-reduced-motion
  const reducedMotion = useReducedMotion();

  // Dynamic greeting based on time of day
  const hour = new Date().getHours();
  const greeting = useMemo(() => {
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, [hour]);

  const daysRemaining = useMemo(() => getDaysRemainingToExam(state), [state]);

  // Adaptive recommendation
  const adaptiveRecommendation = useMemo(() => {
    return getNextBestStudyAction(state);
  }, [state]);

  // Personalized planning context derived from the onboarding profile + state
  const learningContext: LearningContext = useMemo(
    () => getLearningContext(profile, state),
    [profile, state]
  );

  const dailyPlan: PersonalizedPlan = useMemo(
    () => getPersonalizedDailyPlan(profile, state),
    [profile, state]
  );

  // Task in the plan that's a "do now" action
  const nextActionTask = useMemo(() => {
    const actionable = dailyPlan.tasks.find(
      (t) => t.activity === 'learn' || t.activity === 'mcqs'
    );
    return actionable || dailyPlan.tasks[0];
  }, [dailyPlan]);

  // Today's remaining plan tasks
  const todayPlanTasks = useMemo(() => {
    const primaryId = nextActionTask?.id;
    return dailyPlan.tasks.filter((t) => t.id !== primaryId).slice(0, 3);
  }, [dailyPlan, nextActionTask]);

  const recommendedSubject = useMemo(() => {
    return FMGE_SUBJECTS.find((s) => s.id === adaptiveRecommendation.subjectId) || FMGE_SUBJECTS[0];
  }, [adaptiveRecommendation.subjectId]);

  // Active displayed recommendation
  const activeFocusSubject = useMemo(() => {
    if (selectedFilterSubjectId === 'all') return recommendedSubject;
    return FMGE_SUBJECTS.find((s) => s.id === selectedFilterSubjectId) || recommendedSubject;
  }, [selectedFilterSubjectId, recommendedSubject]);

  const activeFocusTopic = useMemo(() => {
    if (selectedFilterSubjectId === 'all') {
      return {
        id: adaptiveRecommendation.topicId,
        name: adaptiveRecommendation.topicName,
        reason: adaptiveRecommendation.reason || 'High-yield NBE exam blueprint topic recommended for mastery.',
        isHighYield: true,
      };
    }
    const firstUnfinished =
      activeFocusSubject.topics.find((t) => !state.topicsState?.[`${activeFocusSubject.id}-${t.id}`]?.notesDone) ||
      activeFocusSubject.topics[0];
    return {
      id: firstUnfinished.id,
      name: firstUnfinished.name,
      reason: `Master core high-yield principles and clinical diagnosis in ${activeFocusSubject.name}.`,
      isHighYield: firstUnfinished.isHighYield,
    };
  }, [selectedFilterSubjectId, activeFocusSubject, adaptiveRecommendation, state.topicsState]);

  // Subject progress with FMGE relevance
  const subjectList = useMemo(() => {
    const list = FMGE_SUBJECTS.map((sub) => {
      const allTopics = [...sub.topics, ...(state.subjectProgress?.[sub.id]?.customTopics || [])];
      const doneNotes = allTopics.filter(
        (t) => state.topicsState?.[`${sub.id}-${t.id}`]?.notesDone ?? t.notesDone
      ).length;
      const percentage = Math.round((doneNotes / Math.max(1, allTopics.length)) * 100);

      let statusText = 'On track';
      let statusClass = 'text-[#006B63] bg-[#e6f0ee] border-[#cfe2df]';
      if (percentage < 30) {
        statusText = 'Needs focus';
        statusClass = 'text-[#92400e] bg-[#fef3c7] border-[#fde68a]';
      } else if (percentage >= 60) {
        statusText = 'On track';
        statusClass = 'text-[#006B63] bg-[#e6f0ee] border-[#cfe2df]';
      }
      return {
        ...sub,
        percentage,
        statusText,
        statusClass,
      };
    });

    if (selectedFilterSubjectId && selectedFilterSubjectId !== 'all') {
      return [...list].sort((a, b) =>
        a.id === selectedFilterSubjectId ? -1 : b.id === selectedFilterSubjectId ? 1 : 0
      );
    }
    return list;
  }, [state.subjectProgress, state.topicsState, selectedFilterSubjectId]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const results: Array<{ subject: (typeof FMGE_SUBJECTS)[0]; topic: (typeof FMGE_SUBJECTS)[0]['topics'][0] }> = [];
    for (const sub of FMGE_SUBJECTS) {
      for (const top of sub.topics) {
        if (top.name.toLowerCase().includes(q) || sub.name.toLowerCase().includes(q)) {
          results.push({ subject: sub, topic: top });
          if (results.length >= 8) break;
        }
      }
      if (results.length >= 8) break;
    }
    return results;
  }, [searchQuery]);

  const userName = user?.displayName || profile?.displayName || state.settings.userName || 'Doctor';
  const initials = (userName || 'Doctor')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const savedTargetScore = profile?.targetScore || state.settings?.targetScore || 200;
  const focusMinutes = adaptiveRecommendation.allocatedMinutes || nextActionTask?.durationMinutes || 30;
  const focusMarks = adaptiveRecommendation.weightage || activeFocusSubject.weightage;
  const hasRevisionDue = dailyPlan.revisionDueCount > 0;
  const errorsToReview = dailyPlan.errorRemediationCount > 0;

  // Real consecutive study streak from study logs
  const currentStreak = useMemo(
    () => calculateStudyStreak(state.studyLogs),
    [state.studyLogs]
  );

  // Study streak 7-day calendar data
  const weekDays = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sun, 1 is Mon...
    const mondayOffset = (currentDay === 0 ? -6 : 1) - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const streakCount = Math.max(1, currentStreak);

    return days.map((dayName, index) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + index);
      const dateNum = d.getDate();
      const todayIndex = currentDay === 0 ? 6 : currentDay - 1;
      const isToday = index === todayIndex;
      // Active if within the active streak count leading up to today
      const isCompleted = index <= todayIndex && (todayIndex - index) < streakCount;

      return {
        dayName,
        dateNum,
        isToday,
        isCompleted,
      };
    });
  }, [currentStreak]);

  const startFocusSession = () =>
    setActiveMasteryTopic({
      subjectId: activeFocusSubject.id,
      topicId: activeFocusTopic.id,
      topicName: activeFocusTopic.name,
    });

  const scrollPillsRight = () => {
    if (filterScrollRef.current) {
      filterScrollRef.current.scrollBy({ left: 160, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen font-['Plus_Jakarta_Sans'] text-slate-900 pb-16 lg:pb-12 pt-4 sm:pt-6 lg:pt-6">
      {/* Subtle atmospheric medical & mountain visual background */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(0,107,99,0.035)_0%,rgba(14,165,233,0.025)_50%,transparent_80%)]" />
      <div className="pointer-events-none fixed top-0 right-0 w-[540px] h-[360px] -z-10 opacity-[0.035] overflow-hidden">
        <svg viewBox="0 0 540 360" fill="none" className="w-full h-full stroke-[#006B63]">
          <path d="M40 360 L 220 180 L 320 270 L 460 130 L 540 200" strokeWidth="2" strokeLinecap="round" />
          <path d="M0 360 L 160 220 L 270 310 L 400 170 L 540 290" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>

      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 space-y-5 sm:space-y-6">

        {/* ═══ 1. TOP BAR (Search, Notifications, Profile) ═══ */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Search topics input */}
          <div className="relative flex-1 w-full lg:max-w-xl">
            <Search className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search topics, subjects, questions..."
              aria-label="Search topics"
              className="w-full pl-9 sm:pl-10 pr-8 sm:pr-14 h-10 sm:h-11 rounded-full bg-white border border-slate-200/90 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 shadow-xs focus:outline-none focus:border-[#006B63] focus:ring-2 focus:ring-[#006B63]/10 transition-all"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
                className="absolute right-2.5 sm:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <span className="hidden sm:inline-flex absolute right-3.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-mono text-slate-400 font-medium">
                ⌘ K
              </span>
            )}
          </div>

          {/* Right Action Icons: Notification Bell + Avatar (Desktop only; on mobile the global top header provides them) */}
          <div className="hidden lg:flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsNotificationCenterOpen(true)}
              className="relative flex items-center justify-center h-10 w-10 rounded-full bg-white border border-slate-200/90 shadow-xs text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors shrink-0"
              title="View Study Notifications"
              aria-label="View Study Notifications"
            >
              <Bell className="h-4.5 w-4.5 stroke-[1.8]" />
              {hasUnread && (
                <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 sm:gap-2 h-10 pl-1 pr-1 sm:pr-3 rounded-full bg-white border border-slate-200/90 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer group"
              title="Doctor Profile & Blueprint"
            >
              <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-['Outfit'] font-bold text-xs shrink-0 ring-2 ring-slate-900/10">
                {initials}
              </div>
              <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </button>
          </div>
        </div>

        {/* Live Search Autocomplete Popup */}
        <AnimatePresence>
          {isSearchOpen && searchResults.length > 0 && (
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={SECTION_TRANSITION(reducedMotion)}
              className="bg-white rounded-3xl border border-slate-200 shadow-xl p-4 space-y-2 z-30"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Matching Blueprint Topics
                </span>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  Close (ESC)
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {searchResults.map(({ subject, topic }) => (
                  <div
                    key={`${subject.id}-${topic.id}`}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 border border-slate-100 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="text-[10px] font-bold text-[#006B63] uppercase tracking-wider block">
                        {subject.name}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 truncate block">
                        {topic.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchOpen(false);
                          setActiveMasteryTopic({
                            subjectId: subject.id,
                            topicId: topic.id,
                            topicName: topic.name,
                          });
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold bg-[#006B63] text-white rounded-lg hover:bg-[#005049] transition-colors cursor-pointer"
                      >
                        Study
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchOpen(false);
                          onLaunchPracticeSession?.(subject.id, topic.id, topic.name);
                        }}
                        className="px-2 py-1 text-[11px] font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        10 MCQs
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ 2. TOP GREETING HERO BANNER ═══ */}
        <motion.div
          initial={SECTION_ENTER(0, reducedMotion)}
          animate={SECTION_SHOW}
          transition={SECTION_TRANSITION(reducedMotion)}
          className="rounded-3xl bg-white/75 backdrop-blur-xs border border-slate-200/70 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.03)] p-4 sm:p-5 lg:p-5.5 relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 relative z-10">
            {/* Left side: Greeting + Sun Icon + Quote */}
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Sun className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-500">{greeting},</span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight font-['Outfit']">
                {userName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 italic">
                &ldquo;Consistent study today builds the doctor you&apos;ll be tomorrow.&rdquo;
              </p>
            </div>

            {/* Right side: Subtle Motivational Badge */}
            <div className="hidden md:flex items-center gap-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl px-3.5 py-2 shrink-0">
              <div className="h-7 w-11 shrink-0 relative">
                <svg viewBox="0 0 44 24" fill="none" className="w-full h-full">
                  <path d="M2 24L18 6L26 14L38 24H2Z" fill="#006B63" fillOpacity="0.22" />
                  <path d="M14 24L28 9L36 19L42 24H14Z" fill="#0284c7" fillOpacity="0.16" />
                  <path d="M18 6L21 3V7L18 6Z" fill="#e11d48" />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-[#006B63] italic">
                  &ldquo;Discipline today leads to freedom tomorrow.&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* 4 Stat Badges Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 pt-3.5 mt-3.5 border-t border-slate-100">
            {/* Card 1: Days remaining */}
            <div className="flex items-center gap-2 sm:gap-3 bg-slate-50/75 hover:bg-slate-50 border border-slate-200/60 rounded-2xl p-2.5 sm:p-3 transition-colors min-w-0 shadow-2xs">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-teal-500/10 text-[#006B63] flex items-center justify-center shrink-0">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs sm:text-sm lg:text-base font-extrabold text-slate-900 font-['Outfit'] tabular-nums leading-tight truncate">
                  <AnimatedNumber value={daysRemaining} />
                </span>
                <span className="block text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                  days to FMGE
                </span>
              </div>
            </div>

            {/* Card 2: Target Score */}
            <div className="flex items-center gap-2 sm:gap-3 bg-slate-50/75 hover:bg-slate-50 border border-slate-200/60 rounded-2xl p-2.5 sm:p-3 transition-colors min-w-0 shadow-2xs">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-teal-500/10 text-[#006B63] flex items-center justify-center shrink-0">
                <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs sm:text-sm lg:text-base font-extrabold text-slate-900 font-['Outfit'] tabular-nums leading-tight truncate">
                  {savedTargetScore ? `${savedTargetScore}+` : '200+'}
                </span>
                <span className="block text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                  Target Score
                </span>
              </div>
            </div>

            {/* Card 3: Subjects count */}
            <div className="flex items-center gap-2 sm:gap-3 bg-slate-50/75 hover:bg-slate-50 border border-slate-200/60 rounded-2xl p-2.5 sm:p-3 transition-colors min-w-0 shadow-2xs">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs sm:text-sm lg:text-base font-extrabold text-slate-900 font-['Outfit'] tabular-nums leading-tight truncate">
                  19
                </span>
                <span className="block text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                  Subjects
                </span>
              </div>
            </div>

            {/* Card 4: Progress / Streak */}
            <div className="flex items-center gap-2 sm:gap-3 bg-slate-50/75 hover:bg-slate-50 border border-slate-200/60 rounded-2xl p-2.5 sm:p-3 transition-colors min-w-0 shadow-2xs">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs sm:text-sm lg:text-base font-extrabold text-slate-900 font-['Outfit'] leading-tight truncate">
                  Keep going
                </span>
                <span className="block text-[10px] sm:text-[11px] text-slate-400 font-medium truncate" title="Small steps. Big progress.">
                  Small steps. Big progress.
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══ 3. SUBJECT FILTER PILLS BAR ═══ */}
        <motion.div
          initial={SECTION_ENTER(0.04, reducedMotion)}
          animate={SECTION_SHOW}
          transition={SECTION_TRANSITION(reducedMotion)}
          className="relative flex items-center"
        >
          <div
            ref={filterScrollRef}
            className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none select-none snap-x w-full pr-2 sm:pr-10"
          >
            {[{ id: 'all', name: 'All Subjects (19)' }, ...FMGE_SUBJECTS.map((s) => ({ id: s.id, name: s.name }))].map((f) => {
              const active = selectedFilterSubjectId === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFilterSubjectId(f.id)}
                  aria-pressed={active}
                  className={`relative snap-start inline-flex items-center px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer min-h-[34px] ${
                    active
                      ? 'text-white'
                      : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80 hover:bg-slate-50 shadow-2xs'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="dashboard-subject-filter-pill"
                      transition={SPRING(reducedMotion)}
                      className="absolute inset-0 rounded-full bg-[#006B63] shadow-xs"
                    />
                  )}
                  <span className="relative z-10">{f.name}</span>
                </button>
              );
            })}
          </div>
          {/* Scroll arrow on desktop */}
          <button
            type="button"
            onClick={scrollPillsRight}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/95 border border-slate-200 shadow-sm text-slate-500 hover:text-slate-800 items-center justify-center cursor-pointer transition-colors"
            title="Scroll subjects right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </motion.div>

        {/* ═══ 4. TWO-COLUMN DESKTOP LAYOUT (LEFT & RIGHT) ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ══════════════ LEFT COLUMN (lg:col-span-7) ══════════════ */}
          <div className="lg:col-span-7 space-y-6">

            {/* ── TODAY'S FOCUS CARD ── */}
            <motion.section
              initial={SECTION_ENTER(0.08, reducedMotion)}
              animate={SECTION_SHOW}
              transition={SECTION_TRANSITION(reducedMotion)}
              className="rounded-3xl bg-gradient-to-br from-white via-white to-teal-50/25 border border-slate-200/80 shadow-[0_12px_36px_-10px_rgba(15,23,42,0.05)] hover:shadow-md p-4.5 sm:p-5.5 lg:p-6 relative overflow-hidden transition-all duration-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6">
                {/* Left side: Focus Text & Actions */}
                <div className="flex-1 space-y-3 min-w-0">
                  {/* Category Header Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-[#006B63] border border-teal-200/70 font-mono">
                      + TODAY&apos;S FOCUS
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#e11d48] font-mono">
                      {activeFocusSubject.name.toUpperCase()}
                    </span>
                  </div>

                  {/* Topic Title */}
                  <div>
                    <h2 className="font-['Outfit'] text-xl sm:text-2xl lg:text-[26px] font-black tracking-tight text-slate-900 leading-tight break-words">
                      {activeFocusTopic.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-1 max-w-lg line-clamp-2 sm:line-clamp-none">
                      {adaptiveRecommendation.actionDescription || activeFocusTopic.reason}
                    </p>
                  </div>

                  {/* 4 Meta Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-0.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-700 border border-slate-200/70">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <AnimatedNumber value={focusMarks} /> marks
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-700 border border-slate-200/70">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <AnimatedNumber value={focusMinutes} /> min
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-700 border border-slate-200/70">
                      <BookOpen className="h-3 w-3 text-slate-400" /> Clinical MCQ
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                      <Flame className="h-3 w-3 fill-rose-500 text-rose-500" /> High-yield
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-1.5">
                    <button
                      type="button"
                      onClick={startFocusSession}
                      className="inline-flex items-center justify-center gap-2 w-full xs:w-auto px-5 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold bg-[#006B63] hover:bg-[#00524c] text-white shadow-xs active:scale-[0.98] transition-all cursor-pointer min-h-[44px]"
                    >
                      <Play className="h-3.5 w-3.5 fill-white" /> Start Session
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectSubject(activeFocusSubject.id)}
                      className="inline-flex items-center justify-center gap-2 w-full xs:w-auto px-4.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200/90 hover:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer min-h-[44px]"
                    >
                      Subject Roadmap <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Right side: Integrated 3D Anatomical Visual with Radiant Ambient Glow */}
                <div className="relative w-full sm:w-56 md:w-64 lg:w-60 xl:w-68 shrink-0 flex flex-col items-center justify-center pt-2 sm:pt-0">
                  {/* Subtle, soft luminous gradient aura directly around the artwork (No boxy borders) */}
                  <div className="absolute inset-0 -m-4 rounded-full bg-[radial-gradient(circle_at_50%_45%,rgba(13,148,136,0.18)_0%,rgba(16,185,129,0.06)_50%,transparent_75%)] filter blur-xl pointer-events-none" />

                  {/* Anatomical Model */}
                  <div className="relative w-full h-36 sm:h-44 flex items-center justify-center z-10">
                    <MedicalHeroVisual
                      subjectId={activeFocusSubject.id}
                      subjectName={activeFocusSubject.name}
                      subjectColor={activeFocusSubject.color}
                      topicId={activeFocusTopic.id}
                      topicName={activeFocusTopic.name}
                      className="w-full h-full"
                    />
                  </div>

                  {/* ECG Waveform & Small Contextual Metadata floating naturally underneath */}
                  <div className="w-full max-w-[240px] mt-1.5 flex items-center justify-between gap-2 px-2.5 py-1 rounded-full bg-slate-50/80 border border-slate-200/60 shadow-2xs backdrop-blur-xs relative z-10">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-reduce:hidden" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 truncate">
                        {activeFocusSubject.name}
                      </span>
                    </div>

                    {/* ECG SVG Waveform */}
                    <div className="w-14 sm:w-16 h-3.5 flex items-center shrink-0">
                      <svg viewBox="0 0 80 20" className="w-full h-full stroke-[#006B63] fill-none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M0 10 L25 10 L30 3 L35 17 L40 5 L45 12 L50 10 L80 10" />
                      </svg>
                    </div>

                    <span className="text-[10px] font-semibold text-slate-400 tabular-nums shrink-0">
                      Live
                    </span>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* ── TODAY'S PLAN ── */}
            <motion.section
              initial={SECTION_ENTER(0.12, reducedMotion)}
              animate={SECTION_SHOW}
              transition={SECTION_TRANSITION(reducedMotion)}
              className="space-y-3"
            >
              {/* Header */}
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-teal-500/10 flex items-center justify-center text-[#006B63] shrink-0">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900">Today&apos;s Plan</h3>
                    <p className="text-[11px] text-slate-500 truncate">
                      Phase 3 — Exam Conditioning — initial plan from your onboarding.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 self-start xs:self-auto">
                  <span className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold bg-white border border-slate-200/80 text-slate-600">
                    {learningContext.gtFrequencyLabel || 'Every 7 days • full GT'} ⌄
                  </span>
                </div>
              </div>

              {/* Tasks List */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] divide-y divide-slate-100 overflow-hidden">
                {todayPlanTasks.length === 0 && dailyPlan.tasks.length === 0 && (
                  <div className="p-5 text-sm text-slate-500 text-center">
                    Add study data to generate your personalized plan.
                  </div>
                )}
                {todayPlanTasks.map((task, index) => (
                  <div
                    key={task.id}
                    className={`flex items-start sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 transition-all ${
                      index === 0
                        ? 'bg-gradient-to-r from-rose-50/30 via-slate-50/20 to-white border-l-2 sm:border-l-3 border-l-rose-500'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      {/* Number Badge (1, 2, 3...) in soft circle */}
                      <div
                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full font-bold text-[11px] sm:text-xs flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                          index === 0
                            ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-200/50 font-extrabold'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {index + 1}
                      </div>

                      {/* Book icon */}
                      <div
                        className={`hidden sm:flex h-8 w-8 rounded-xl items-center justify-center shrink-0 ${
                          index === 0
                            ? 'bg-rose-50/90 border border-rose-100 text-rose-500'
                            : 'bg-slate-50 border border-slate-100 text-slate-400'
                        }`}
                      >
                        <BookOpen className="h-4 w-4" />
                      </div>

                      {/* Task Info with extra mobile breathing room and 2-line wrapping */}
                      <div className="space-y-0.5 min-w-0 flex-1 pr-1 sm:pr-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider font-mono ${
                              index === 0 ? 'text-rose-600' : 'text-slate-600'
                            }`}
                          >
                            {task.subjectName.toUpperCase()}
                          </span>
                          <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-teal-50 text-[#006B63] border border-teal-100">
                            MCQ drill
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug break-words">
                          {task.topicName}
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-slate-500 truncate max-w-md">
                          {task.reason}
                        </p>
                      </div>
                    </div>

                    {/* Right side: Duration + Start Button + Menu */}
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0 self-center sm:self-auto">
                      <div className="hidden sm:flex items-center gap-1 text-xs font-semibold text-slate-400 tabular-nums">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{task.durationMinutes} min</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onLaunchPracticeSession?.(task.subjectId, task.topicId, task.topicName)}
                        className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-[#f43f5e] hover:bg-[#e11d48] shadow-xs active:scale-95 transition-all cursor-pointer min-h-[32px]"
                      >
                        <Play className="h-3 w-3 fill-white" /> Start
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenAiCoach('concept', task.subjectId, task.topicName)}
                        className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Options"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('daily')}
                className="w-full text-center text-xs font-semibold text-[#006B63] hover:underline py-1 transition-colors cursor-pointer"
              >
                Open full plan →
              </button>
            </motion.section>

            {/* ── UP NEXT (Revision & Error Remediation) ── */}
            <motion.section
              initial={SECTION_ENTER(0.16, reducedMotion)}
              animate={SECTION_SHOW}
              transition={SECTION_TRANSITION(reducedMotion)}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-teal-500/10 flex items-center justify-center text-[#006B63]">
                  <Compass className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Up Next</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Card 1: Revision (Mint/Green Visual Identity) */}
                <div
                  onClick={() => onNavigateTab('revision')}
                  className="rounded-3xl bg-gradient-to-br from-white via-white to-emerald-50/30 border border-emerald-100/90 shadow-2xs p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:border-emerald-300 hover:shadow-xs active:scale-[0.99] transition-all duration-200 cursor-pointer group min-h-[64px]"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <CheckCircle2 className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        Revision
                      </span>
                      <span className="block text-[11px] sm:text-xs font-semibold text-emerald-800 mt-0.5">
                        {hasRevisionDue ? `${dailyPlan.revisionDueCount} items due` : "You're all caught up!"}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5 truncate">
                        Review when new revision items appear.
                      </span>
                    </div>
                  </div>
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                  </div>
                </div>

                {/* Card 2: Error Remediation (Amber/Orange Visual Identity) */}
                <div
                  onClick={() => onNavigateTab('errors')}
                  className="rounded-3xl bg-gradient-to-br from-white via-white to-amber-50/30 border border-amber-100/90 shadow-2xs p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:border-amber-300 hover:shadow-xs active:scale-[0.99] transition-all duration-200 cursor-pointer group min-h-[64px]"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Zap className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs sm:text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                        Error Remediation
                      </span>
                      <span className="block text-[11px] sm:text-xs font-semibold text-amber-800 mt-0.5">
                        {errorsToReview ? `${dailyPlan.errorRemediationCount} errors to review` : "You're all caught up!"}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5 truncate">
                        Review when new errors appear.
                      </span>
                    </div>
                  </div>
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <FileText className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                  </div>
                </div>
              </div>
            </motion.section>
          </div>

          {/* ══════════════ RIGHT COLUMN (lg:col-span-5) ══════════════ */}
          <div className="lg:col-span-5 space-y-6">

            {/* ── YOUR EXAM JOURNEY (Teal/Mint Identity) ── */}
            <motion.section
              initial={SECTION_ENTER(0.1, reducedMotion)}
              animate={SECTION_SHOW}
              transition={SECTION_TRANSITION(reducedMotion)}
              className="rounded-3xl bg-gradient-to-b from-white via-white to-teal-50/20 border border-teal-100/70 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-md p-5 sm:p-6 space-y-4 transition-all duration-200"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-teal-500/10 flex items-center justify-center text-[#006B63]">
                    <Compass className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Your Exam Journey</h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab('progress')}
                  className="text-xs font-semibold text-[#006B63] hover:underline cursor-pointer min-h-[32px] flex items-center"
                >
                  View details →
                </button>
              </div>

              {/* Circular Gauge + Stats Block */}
              <div className="flex items-center justify-between gap-3 sm:gap-4 pt-1 sm:pt-2">
                {/* Circular Gauge (Apple Fitness/Health ring) */}
                <CircularCountdown
                  days={daysRemaining}
                  totalDays={90}
                  reducedMotion={reducedMotion}
                />

                {/* Right Stat Items */}
                <div className="space-y-2.5 sm:space-y-3 flex-1 min-w-0">
                  {/* Target score */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-[#006B63]" />
                      <span className="text-xs text-slate-500 font-medium">Target Score</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 font-['Outfit']">
                      {savedTargetScore ? `${savedTargetScore}+` : '200+'}
                    </span>
                  </div>

                  {/* Subjects */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-xs text-slate-500 font-medium">Subjects</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 font-['Outfit']">19</span>
                  </div>

                  {/* Preparation Elapsed */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Preparation Elapsed</span>
                      <span className="font-bold text-slate-800 tabular-nums">~ 16%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#006B63] via-[#0D9488] to-[#10B981] rounded-full"
                        initial={reducedMotion ? false : { width: 0 }}
                        whileInView={{ width: '16%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sprout Quote Box */}
              <div className="rounded-2xl bg-teal-50/60 border border-teal-100/70 p-3 flex items-center gap-2.5">
                <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <p className="text-xs font-medium text-[#18625a] italic leading-tight">
                  &ldquo;A little progress each day adds up to big results.&rdquo;
                </p>
              </div>
            </motion.section>

            {/* ── YOUR STUDY STREAK (Subtle Warm/Orange Accent) ── */}
            <motion.section
              initial={SECTION_ENTER(0.14, reducedMotion)}
              animate={SECTION_SHOW}
              transition={SECTION_TRANSITION(reducedMotion)}
              className="rounded-3xl bg-gradient-to-b from-white via-white to-amber-50/20 border border-amber-100/70 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-md p-5 sm:p-6 space-y-4 transition-all duration-200"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <Flame className="h-4 w-4 fill-orange-500" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Your Study Streak</h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab('daily')}
                  className="text-xs font-semibold text-[#006B63] hover:underline cursor-pointer min-h-[32px] flex items-center"
                >
                  View calendar →
                </button>
              </div>

              {/* 7 Days Row */}
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
                {weekDays.map(({ dayName, dateNum, isCompleted, isToday }) => (
                  <div key={dayName} className="flex flex-col items-center gap-1 sm:gap-1.5">
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400">
                      {dayName}
                    </span>
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                        isCompleted
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-2xs ring-2 ring-emerald-500/20 font-bold'
                          : 'bg-slate-50/70 border border-slate-100 text-slate-400 font-medium opacity-60'
                      } ${isToday ? 'ring-2 ring-orange-500 ring-offset-2 font-black !opacity-100' : ''}`}
                    >
                      {dateNum}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
                  <span>{currentStreak || 3} days this week</span>
                </div>
                <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60 text-[11px]">
                  Keep it going! 🔥
                </span>
              </div>
            </motion.section>

            {/* ── YOUR PROGRESS (Dynamic Subject Bars with Contextual Accents) ── */}
            <motion.section
              initial={SECTION_ENTER(0.18, reducedMotion)}
              animate={SECTION_SHOW}
              transition={SECTION_TRANSITION(reducedMotion)}
              className="rounded-3xl bg-white border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-md p-5 sm:p-6 space-y-4 transition-all duration-200"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-teal-500/10 flex items-center justify-center text-[#006B63]">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Your Progress</h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab('syllabus')}
                  className="text-xs font-semibold text-[#006B63] hover:underline cursor-pointer min-h-[32px] flex items-center"
                >
                  View curriculum →
                </button>
              </div>

              {/* Subject Rows */}
              <div className="space-y-2.5 sm:space-y-3">
                {subjectList.slice(0, 5).map((sub, idx) => {
                  const visual = getContextualProgressStyle(sub.percentage, sub.statusText);
                  const studyTimeApprox = sub.weightage ? `~${Math.max(1, Math.round(sub.weightage * 1.5))}h` : '~2h';

                  return (
                    <div
                      key={sub.id}
                      onClick={() => onSelectSubject(sub.id)}
                      className="group p-2 sm:p-2.5 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs gap-1.5">
                        <span className="font-bold text-slate-900 group-hover:text-[#006B63] transition-colors truncate">
                          {sub.name}
                        </span>
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                          <span className="font-mono font-extrabold text-slate-900 tabular-nums">
                            <AnimatedNumber value={sub.percentage} />%
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {studyTimeApprox} • {sub.weightage}m
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${visual.badge}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${visual.dot}`} />
                            {visual.statusText}
                          </span>
                        </div>
                      </div>

                      {/* Smooth Animated Progress Bar */}
                      <div className={`w-full h-2 sm:h-2.5 ${visual.track || 'bg-slate-100'} rounded-full overflow-hidden`}>
                        <motion.div
                          className={`h-full rounded-full ${visual.bar}`}
                          initial={reducedMotion ? false : { width: 0 }}
                          whileInView={{ width: `${Math.max(sub.percentage, 4)}%` }}
                          viewport={{ once: true }}
                          transition={
                            reducedMotion
                              ? { duration: 0 }
                              : { duration: 0.75, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* View all subjects action */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onNavigateTab('syllabus')}
                  className="w-full text-center text-xs font-semibold text-[#006B63] hover:underline py-1 transition-colors cursor-pointer flex items-center justify-center gap-1 min-h-[36px]"
                >
                  View all subjects →
                </button>
              </div>
            </motion.section>

            {/* ── MOTIVATIONAL QUOTE CARD ── */}
            <div className="rounded-3xl bg-gradient-to-br from-sky-50 via-teal-50/60 to-emerald-50 border border-teal-100/70 p-5 relative overflow-hidden">
              <div className="relative z-10 space-y-1">
                <span className="text-3xl font-serif text-[#006B63]/40 leading-none block select-none">
                  &ldquo;
                </span>
                <p className="text-sm font-extrabold text-slate-900 leading-tight">
                  Better preparation.
                </p>
                <p className="text-sm font-extrabold text-[#006B63] leading-tight">
                  A brighter tomorrow.
                </p>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block pt-1">
                  ONE SHOT FMGE
                </span>
              </div>
              {/* Subtle mountain graphic on bottom right */}
              <div className="absolute right-2 bottom-0 pointer-events-none opacity-30">
                <svg width="100" height="55" viewBox="0 0 100 55" fill="none">
                  <path d="M10 55L45 15L60 30L90 55H10Z" fill="#0d9488" />
                  <path d="M40 55L70 20L95 50L100 55H40Z" fill="#0284c7" />
                </svg>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Topic Mastery Workspace Modal */}
      {activeMasteryTopic && (
        <TopicMasteryWorkspace
          subjectId={activeMasteryTopic.subjectId}
          topicId={activeMasteryTopic.topicId}
          topicName={activeMasteryTopic.topicName}
          state={state}
          onClose={() => setActiveMasteryTopic(null)}
          onOpenAiCoach={onOpenAiCoach}
          onLaunchPracticeMcq={(ctx) =>
            onLaunchPracticeSession?.(ctx.subjectId, ctx.topicId, ctx.topicName, ctx.subtopic)
          }
          onToggleTopicState={onToggleTopicState || (() => {})}
        />
      )}

      {/* Real-time Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        state={state}
        onNavigateTab={onNavigateTab}
        onSelectSubject={onSelectSubject}
        onLaunchPracticeSession={onLaunchPracticeSession}
      />
    </div>
  );
};
