import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronRight,
  BookOpen,
  Clock,
  Target,
  X,
  Sparkles,
  ArrowRight,
  Bone,
  Heart,
  FlaskConical,
  Microscope,
  Pill,
  ShieldCheck,
  Scale,
  Users,
  Eye,
  Headphones,
  Stethoscope,
  Scissors,
  Baby,
  Smile,
  Activity,
  Brain,
  ScanLine,
  Syringe,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import { AppState, SubjectPhase, ConfidenceLevel } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { DoctorMountainArt } from './DoctorMountainArt';

interface SyllabusViewProps {
  state: AppState;
  onSelectSubject: (subjectId: string) => void;
  onToggleTopicState: (
    subjectId: string,
    topicId: string,
    field: 'notesDone' | 'qBankDone' | 'r1Done' | 'r2Done' | 'r3Done'
  ) => void;
  onUpdateConfidence: (subjectId: string, confidence: ConfidenceLevel) => void;
}

// Subject Icon & Accent Palette Map aligned with clinical editorial aesthetics
function getSubjectVisual(subjectId: string, fallbackColor?: string) {
  switch (subjectId) {
    case 'anatomy':
      return {
        icon: Bone,
        color: '#E11D48',
        bg: 'bg-rose-50/80 text-rose-700 border-rose-200/70',
        badge: 'High-yield',
        badgeType: 'high' as const,
      };
    case 'physiology':
      return {
        icon: Heart,
        color: '#F43F5E',
        bg: 'bg-pink-50/80 text-pink-700 border-pink-200/70',
        badge: 'High-yield',
        badgeType: 'high' as const,
      };
    case 'biochemistry':
      return {
        icon: FlaskConical,
        color: '#0284C7',
        bg: 'bg-sky-50/80 text-sky-700 border-sky-200/70',
        badge: 'High-yield',
        badgeType: 'high' as const,
      };
    case 'pathology':
      return {
        icon: Microscope,
        color: '#E11D48',
        bg: 'bg-rose-50/80 text-rose-700 border-rose-200/70',
        badge: 'High-yield',
        badgeType: 'high' as const,
      };
    case 'pharmacology':
      return {
        icon: Pill,
        color: '#0284C7',
        bg: 'bg-blue-50/80 text-blue-700 border-blue-200/70',
        badge: 'Important',
        badgeType: 'important' as const,
      };
    case 'microbiology':
      return {
        icon: ShieldCheck,
        color: '#0D9488',
        bg: 'bg-teal-50/80 text-teal-700 border-teal-200/70',
        badge: 'Important',
        badgeType: 'important' as const,
      };
    case 'forensic-medicine':
      return {
        icon: Scale,
        color: '#D97706',
        bg: 'bg-amber-50/80 text-amber-700 border-amber-200/70',
        badge: 'Core',
        badgeType: 'core' as const,
      };
    case 'community-medicine':
      return {
        icon: Users,
        color: '#059669',
        bg: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/70',
        badge: 'High-yield',
        badgeType: 'high' as const,
      };
    case 'ophthalmology':
      return {
        icon: Eye,
        color: '#6366F1',
        bg: 'bg-indigo-50/80 text-indigo-700 border-indigo-200/70',
        badge: 'High-yield',
        badgeType: 'high' as const,
      };
    case 'ent':
      return {
        icon: Headphones,
        color: '#8B5CF6',
        bg: 'bg-violet-50/80 text-violet-700 border-violet-200/70',
        badge: 'Important',
        badgeType: 'important' as const,
      };
    case 'general-medicine':
      return {
        icon: Stethoscope,
        color: '#006B63',
        bg: 'bg-teal-50/90 text-teal-800 border-teal-200/80',
        badge: 'High-yield',
        badgeType: 'high' as const,
      };
    case 'general-surgery':
      return {
        icon: Scissors,
        color: '#DC2626',
        bg: 'bg-red-50/80 text-red-700 border-red-200/70',
        badge: 'High-yield',
        badgeType: 'high' as const,
      };
    case 'obgyn':
      return {
        icon: Baby,
        color: '#EC4899',
        bg: 'bg-pink-50/80 text-pink-700 border-pink-200/70',
        badge: 'High-yield',
        badgeType: 'high' as const,
      };
    case 'pediatrics':
      return {
        icon: Smile,
        color: '#F59E0B',
        bg: 'bg-amber-50/80 text-amber-700 border-amber-200/70',
        badge: 'Important',
        badgeType: 'important' as const,
      };
    case 'orthopedics':
      return {
        icon: Activity,
        color: '#0284C7',
        bg: 'bg-sky-50/80 text-sky-700 border-sky-200/70',
        badge: 'Core',
        badgeType: 'core' as const,
      };
    case 'dermatology':
      return {
        icon: Sparkles,
        color: '#EA580C',
        bg: 'bg-orange-50/80 text-orange-700 border-orange-200/70',
        badge: 'Core',
        badgeType: 'core' as const,
      };
    case 'psychiatry':
      return {
        icon: Brain,
        color: '#7C3AED',
        bg: 'bg-purple-50/80 text-purple-700 border-purple-200/70',
        badge: 'Core',
        badgeType: 'core' as const,
      };
    case 'radiology':
      return {
        icon: ScanLine,
        color: '#0F766E',
        bg: 'bg-teal-50/80 text-teal-700 border-teal-200/70',
        badge: 'Core',
        badgeType: 'core' as const,
      };
    case 'anesthesia':
      return {
        icon: Syringe,
        color: '#475569',
        bg: 'bg-stone-100 text-stone-700 border-stone-200',
        badge: 'Core',
        badgeType: 'core' as const,
      };
    default:
      return {
        icon: BookOpen,
        color: fallbackColor || '#006B63',
        bg: 'bg-stone-50 text-stone-700 border-stone-200',
        badge: 'Core',
        badgeType: 'core' as const,
      };
  }
}

export const SyllabusView: React.FC<SyllabusViewProps> = ({
  state,
  onSelectSubject,
}) => {
  const [phaseFilter, setPhaseFilter] = useState<'all' | SubjectPhase>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'weightage' | 'progress' | 'alpha'>('default');

  // Total topics count & completed statistics
  const overallStats = useMemo(() => {
    let totalTopics = 0;
    let completedNotes = 0;
    let completedSubjectsCount = 0;

    FMGE_SUBJECTS.forEach((sub) => {
      const subProgress = state.subjectProgress[sub.id];
      const allTopics = [...sub.topics, ...(subProgress?.customTopics || [])];
      totalTopics += allTopics.length;
      const done = allTopics.filter(
        (t) => state.topicsState[`${sub.id}-${t.id}`]?.notesDone ?? t.notesDone
      ).length;
      completedNotes += done;
      if (allTopics.length > 0 && done === allTopics.length) {
        completedSubjectsCount++;
      }
    });

    const percentage = Math.round((completedNotes / Math.max(1, totalTopics)) * 100);
    return {
      totalTopics,
      completedNotes,
      percentage,
      totalSubjects: FMGE_SUBJECTS.length,
      completedSubjectsCount,
    };
  }, [state]);

  // Filtered & Sorted Subjects
  const filteredSubjects = useMemo(() => {
    let list = FMGE_SUBJECTS.filter((sub) => {
      if (phaseFilter !== 'all' && sub.phase !== phaseFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSubName =
          sub.name.toLowerCase().includes(q) || sub.code.toLowerCase().includes(q);
        const subProgress = state.subjectProgress[sub.id];
        const allTopics = [...sub.topics, ...(subProgress?.customTopics || [])];
        const matchesTopic = allTopics.some((t) => t.name.toLowerCase().includes(q));
        if (!matchesSubName && !matchesTopic) return false;
      }
      return true;
    });

    if (sortBy === 'weightage') {
      list = [...list].sort((a, b) => b.weightage - a.weightage);
    } else if (sortBy === 'alpha') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'progress') {
      list = [...list].sort((a, b) => {
        const aTopics = [...a.topics, ...(state.subjectProgress[a.id]?.customTopics || [])];
        const bTopics = [...b.topics, ...(state.subjectProgress[b.id]?.customTopics || [])];
        const aDone = aTopics.filter((t) => state.topicsState[`${a.id}-${t.id}`]?.notesDone ?? t.notesDone).length;
        const bDone = bTopics.filter((t) => state.topicsState[`${b.id}-${t.id}`]?.notesDone ?? t.notesDone).length;
        const aPct = aDone / Math.max(1, aTopics.length);
        const bPct = bDone / Math.max(1, bTopics.length);
        return aPct - bPct;
      });
    }

    return list;
  }, [phaseFilter, searchQuery, sortBy, state.subjectProgress, state.topicsState]);

  // Circumference for SVG Progress Gauge
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallStats.percentage / 100) * circumference;

  return (
    <div className="page-container space-y-8 font-sans text-stone-900 pb-20">
      {/* ================= EDITORIAL HERO HEADER ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch pt-1">
        {/* Left Column: Heading & Mission */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-3.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-teal-50/90 border border-teal-200/70 text-[#006B63] text-xs font-semibold tracking-wider uppercase font-mono shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#006B63]" />
              + STUDY
            </span>
            <span className="text-stone-400 text-xs font-mono font-medium tracking-wide">
              NBE BLUEPRINT 300M
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold font-display tracking-tight text-stone-900 leading-[1.14]">
            Your Study Plan
          </h1>

          <p className="text-sm sm:text-base text-stone-600 max-w-xl leading-relaxed flex items-center gap-2">
            <span>Master the 19 subjects. One focused step at a time.</span>
            <span className="text-emerald-600 text-base" title="Discipline grows doctors">🌱</span>
          </p>
        </div>

        {/* Right Column: Doctor Mountain Art Banner */}
        <div className="lg:col-span-5 flex items-stretch">
          <DoctorMountainArt className="w-full shadow-xs hover:shadow-sm transition-shadow rounded-2xl border border-stone-200/70" />
        </div>
      </div>

      {/* ================= 4 METRIC CARDS ROW ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Circular Gauge Progress */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:border-stone-300 transition-all flex items-center gap-4">
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 76 76">
              <circle
                cx="38"
                cy="38"
                r={radius}
                className="text-stone-100"
                strokeWidth="6"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="38"
                cy="38"
                r={radius}
                className="text-[#006B63] transition-all duration-700 ease-out"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <span className="absolute font-display font-bold text-sm text-stone-900">
              {overallStats.percentage}%
            </span>
          </div>

          <div className="min-w-0 space-y-0.5">
            <h4 className="text-[10px] font-bold text-stone-500 uppercase tracking-wider font-mono">
              Curriculum Completed
            </h4>
            <div className="text-base sm:text-lg font-bold font-display text-stone-900">
              {overallStats.completedNotes} / {overallStats.totalTopics}
            </div>
            <p className="text-[11px] text-stone-400 truncate">
              {overallStats.completedSubjectsCount} / 19 subjects mastered
            </p>
          </div>
        </div>

        {/* Metric 2: Total Subjects */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:border-stone-300 transition-all flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-sky-50/80 text-sky-700 border border-sky-100 shrink-0">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="text-2xl font-bold font-display text-stone-900">
              19
            </div>
            <h4 className="text-xs font-semibold text-stone-700 font-display">
              Total Subjects
            </h4>
            <p className="text-[11px] text-stone-400 truncate">
              FMGE syllabus
            </p>
          </div>
        </div>

        {/* Metric 3: Estimated Study Hours */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:border-stone-300 transition-all flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-50/80 text-amber-700 border border-amber-100 shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="text-2xl font-bold font-display text-stone-900">
              ~ 480
            </div>
            <h4 className="text-xs font-semibold text-stone-700 font-display">
              Estimated Study Hours
            </h4>
            <p className="text-[11px] text-stone-400 truncate">
              Personalized plan
            </p>
          </div>
        </div>

        {/* Metric 4: Target Score */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:border-stone-300 transition-all flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 text-emerald-700 border border-emerald-100 shrink-0">
            <Target className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="text-2xl font-bold font-display text-stone-900">
              {state.settings?.targetScore || 200}+
            </div>
            <h4 className="text-xs font-semibold text-stone-700 font-display">
              Target Score
            </h4>
            <p className="text-[11px] text-stone-400 truncate">
              Qualify with confidence
            </p>
          </div>
        </div>
      </div>

      {/* ================= PHASE FILTERS & SEARCH & SORT ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pt-1">
        {/* Phase Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          {[
            { id: 'all', label: 'All Subjects (19)', shortLabel: 'All (19)' },
            { id: 'pre-clinical', label: 'Pre-Clinical (5)', shortLabel: 'Pre (5)' },
            { id: 'para-clinical', label: 'Para-Clinical (5)', shortLabel: 'Para (5)' },
            { id: 'clinical', label: 'Clinical (9)', shortLabel: 'Clinical (9)' },
          ].map((p) => {
            const isActive = phaseFilter === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPhaseFilter(p.id as any)}
                className={`px-4 py-2 rounded-full text-xs font-semibold font-display transition-all cursor-pointer whitespace-nowrap border shadow-2xs ${
                  isActive
                    ? 'bg-[#006B63] text-white border-[#006B63] shadow-xs'
                    : 'bg-white hover:bg-stone-50 text-stone-600 hover:text-stone-900 border-stone-200/80'
                }`}
              >
                <span className="hidden sm:inline">{p.label}</span>
                <span className="sm:hidden">{p.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 md:w-64">
            <Search className="h-4 w-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search subjects, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-stone-200/90 bg-white py-2 pl-9 pr-8 text-xs text-stone-900 placeholder-stone-400 focus:border-[#006B63] focus:ring-1 focus:ring-[#006B63] focus:outline-none transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none rounded-full border border-stone-200/90 bg-white py-2 pl-3.5 pr-8 text-xs font-semibold text-stone-700 focus:border-[#006B63] focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="default">Sort: Default</option>
              <option value="weightage">Weightage (High → Low)</option>
              <option value="progress">Progress (Low → High)</option>
              <option value="alpha">Alphabetical</option>
            </select>
            <ChevronRight className="h-3.5 w-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ================= SUBJECT CARDS LIST ================= */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-stone-400 font-mono px-1">
          <span>Subjects & Curriculum Weightage</span>
          <span>{filteredSubjects.length} Disciplines</span>
        </div>

        {filteredSubjects.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
            <Compass className="h-8 w-8 text-stone-400 mx-auto" />
            <div className="text-sm font-semibold text-stone-700 font-display">
              No subjects or topics match "{searchQuery}"
            </div>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Try searching by subject name (e.g. "Anatomy", "Medicine") or specific clinical keywords.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setPhaseFilter('all');
              }}
              className="px-4 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold font-display transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSubjects.map((sub) => {
              const subProgress = state.subjectProgress[sub.id];
              const allTopics = [...sub.topics, ...(subProgress?.customTopics || [])];
              const notesDoneCount = allTopics.filter(
                (t) => state.topicsState[`${sub.id}-${t.id}`]?.notesDone ?? t.notesDone
              ).length;
              const pct = Math.round((notesDoneCount / Math.max(1, allTopics.length)) * 100);

              // First uncompleted topic for "Next topic" recommendation
              const nextTopic =
                allTopics.find((t) => !(state.topicsState[`${sub.id}-${t.id}`]?.notesDone ?? t.notesDone)) ||
                allTopics[0];

              const visual = getSubjectVisual(sub.id, sub.color);
              const IconComponent = visual.icon;

              // Preview of high-yield topics
              const topicPreview = allTopics
                .slice(0, 4)
                .map((t) => t.name)
                .join(', ') + (allTopics.length > 4 ? '...' : '');

              return (
                <div
                  key={sub.id}
                  onClick={() => onSelectSubject(sub.id)}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-2xs hover:shadow-md hover:border-stone-300 transition-all cursor-pointer group flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left: Icon & Subject Metadata */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    <div
                      className={`p-3 rounded-2xl ${visual.bg} border shrink-0 group-hover:scale-105 transition-transform`}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold font-display text-stone-900 group-hover:text-[#006B63] transition-colors truncate">
                          {sub.name}
                        </h3>
                        {/* Mobile Marks Badge */}
                        <span className="lg:hidden px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-mono font-semibold">
                          {sub.weightage}M
                        </span>
                      </div>

                      <p className="text-xs text-stone-500 line-clamp-1 max-w-xl">
                        {topicPreview || sub.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Progress, Marks, Next Topic & Open CTA */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 shrink-0 justify-between pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    {/* Progress rail */}
                    <div className="w-full sm:w-36 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono text-stone-500">
                        <span>{notesDoneCount} / {allTopics.length}</span>
                        <span className="font-semibold text-stone-900">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-[#006B63]"
                          style={{ width: `${Math.max(pct > 0 ? 6 : 0, pct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Marks Badge (Desktop) */}
                    <div className="hidden lg:block shrink-0">
                      <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-mono font-semibold border border-stone-200/60 whitespace-nowrap">
                        {sub.weightage} Marks
                      </span>
                    </div>

                    {/* Priority / High-Yield Pill */}
                    <div className="hidden sm:block shrink-0">
                      {visual.badgeType === 'high' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50/80 text-rose-700 border border-rose-200/60 text-xs font-semibold whitespace-nowrap">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          High-yield
                        </span>
                      )}
                      {visual.badgeType === 'important' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50/80 text-sky-700 border border-sky-200/60 text-xs font-semibold whitespace-nowrap">
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                          Important
                        </span>
                      )}
                      {visual.badgeType === 'core' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200/60 text-xs font-semibold whitespace-nowrap">
                          <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
                          Core
                        </span>
                      )}
                    </div>

                    {/* Next Topic Pointer */}
                    {nextTopic && (
                      <div className="hidden xl:flex items-center gap-2 max-w-[170px] min-w-0 text-left shrink-0">
                        <div className="p-1.5 rounded-lg bg-teal-50/80 text-[#006B63] shrink-0">
                          <BookOpen className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-mono text-stone-400 uppercase tracking-wider leading-none">
                            Next topic
                          </div>
                          <div className="text-xs font-semibold text-stone-800 truncate font-display">
                            {nextTopic.name}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Open Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSubject(sub.id);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#006B63] hover:bg-[#00554E] text-white text-xs font-semibold font-display shadow-xs transition-all cursor-pointer shrink-0 min-h-[40px] sm:min-h-[36px]"
                    >
                      <span>Open</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

