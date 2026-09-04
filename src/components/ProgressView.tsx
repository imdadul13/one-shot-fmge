import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  Clock,
  BookOpen,
  HelpCircle,
  Activity,
  Layers,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { AppState, DailyTask } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { AppStats } from '../utils/storage';

interface ProgressViewProps {
  state: AppState;
  stats: AppStats;
  onSelectSubject: (subjectId: string) => void;
  onToggleTopicState: (
    subjectId: string,
    topicId: string,
    field: 'notesDone' | 'qBankDone' | 'r1Done' | 'r2Done' | 'r3Done'
  ) => void;
  onAddTask?: (task: DailyTask) => void;
  onOpenAiCoach: (
    initialTab?: 'vignette' | 'concept' | 'diagnosis' | 'strategy',
    subjectId?: string,
    topicName?: string
  ) => void;
  onUpdateSubjectRevisionDate?: (subjectId: string, date: string) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  state,
  stats,
  onSelectSubject,
  onToggleTopicState,
  onOpenAiCoach,
}) => {
  const [selectedDiscipline, setSelectedDiscipline] = useState<'all' | 'clinical' | 'preclinical' | 'paraclinical'>('all');

  // Compute detailed analytics across all 19 subjects
  const subjectAnalytics = useMemo(() => {
    return FMGE_SUBJECTS.map((sub) => {
      const allTopics = [...sub.topics, ...(state.subjectProgress?.[sub.id]?.customTopics || [])];
      const totalTopics = Math.max(1, allTopics.length);

      let notesDone = 0;
      let qBankDone = 0;
      let r1Done = 0;
      let r2Done = 0;
      let r3Done = 0;

      for (const t of allTopics) {
        const tState = state.topicsState?.[`${sub.id}-${t.id}`];
        if (tState?.notesDone ?? t.notesDone) notesDone++;
        if (tState?.qBankDone ?? t.qBankDone) qBankDone++;
        if (tState?.r1Done ?? t.r1Done) r1Done++;
        if (tState?.r2Done ?? t.r2Done) r2Done++;
        if (tState?.r3Done ?? t.r3Done) r3Done++;
      }

      const notesPct = Math.round((notesDone / totalTopics) * 100);
      const qBankPct = Math.round((qBankDone / totalTopics) * 100);
      const r1Pct = Math.round((r1Done / totalTopics) * 100);
      const overallMastery = Math.round(notesPct * 0.4 + qBankPct * 0.4 + r1Pct * 0.2);

      let disciplineType: 'clinical' | 'preclinical' | 'paraclinical' = 'clinical';
      if (['anatomy', 'physiology', 'biochemistry'].includes(sub.id)) {
        disciplineType = 'preclinical';
      } else if (['pathology', 'pharmacology', 'microbiology', 'fmt'].includes(sub.id)) {
        disciplineType = 'paraclinical';
      }

      return {
        ...sub,
        disciplineType,
        totalTopics,
        notesDone,
        qBankDone,
        r1Done,
        r2Done,
        r3Done,
        notesPct,
        qBankPct,
        r1Pct,
        overallMastery,
      };
    });
  }, [state.subjectProgress, state.topicsState]);

  // Overall Global Progress Metrics
  const globalMetrics = useMemo(() => {
    let totalTopics = 0;
    let totalNotes = 0;
    let totalQBank = 0;
    let totalR1 = 0;

    for (const sub of subjectAnalytics) {
      totalTopics += sub.totalTopics;
      totalNotes += sub.notesDone;
      totalQBank += sub.qBankDone;
      totalR1 += sub.r1Done;
    }

    const syllabusCoverage = Math.round((totalNotes / Math.max(1, totalTopics)) * 100);
    const qBankPenetration = Math.round((totalQBank / Math.max(1, totalTopics)) * 100);
    const revisionDepth = Math.round((totalR1 / Math.max(1, totalTopics)) * 100);
    const overallPreparedness = Math.round(syllabusCoverage * 0.45 + qBankPenetration * 0.35 + revisionDepth * 0.2);

    return {
      totalTopics,
      totalNotes,
      totalQBank,
      totalR1,
      syllabusCoverage,
      qBankPenetration,
      revisionDepth,
      overallPreparedness,
    };
  }, [subjectAnalytics]);

  const filteredSubjects = useMemo(() => {
    if (selectedDiscipline === 'all') return subjectAnalytics;
    return subjectAnalytics.filter((s) => s.disciplineType === selectedDiscipline);
  }, [subjectAnalytics, selectedDiscipline]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10 space-y-8 text-slate-900">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
            SYLLABUS & PERFORMANCE ANALYTICS
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-mono font-bold">
            19 SUBJECTS
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-['Outfit'] tracking-tight text-slate-900">
          Curriculum Readiness & Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
          Comprehensive real-time tracking of 19 FMGE disciplines across syllabus notes, QBank penetration, and revision cycles.
        </p>
      </header>

      {/* Global Readiness KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Overall Preparedness */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Exam Preparedness
            </span>
            <ShieldCheck className="h-4 w-4 text-[#00685f]" />
          </div>
          <div className="flex items-center justify-center py-1">
            <div className="relative inline-flex items-center justify-center">
              <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
                <circle cx="44" cy="44" r="37" fill="none" stroke="#ece5db" strokeWidth="8" />
                <circle
                  cx="44"
                  cy="44"
                  r="37"
                  fill="none"
                  stroke="#00685f"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 37}
                  strokeDashoffset={2 * Math.PI * 37 * (1 - globalMetrics.overallPreparedness / 100)}
                  style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1)' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-['Outfit'] text-xl font-extrabold text-slate-900 leading-none">
                  {globalMetrics.overallPreparedness}%
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5 font-mono">INDEX</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Notes Coverage */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Notes Completed
            </span>
            <BookOpen className="h-4 w-4 text-[#2c694e]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-['Outfit'] text-3xl font-extrabold text-slate-900">
              {globalMetrics.syllabusCoverage}%
            </span>
            <span className="text-xs text-slate-400">
              ({globalMetrics.totalNotes}/{globalMetrics.totalTopics})
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-[#2c694e] rounded-full transition-all duration-500"
              style={{ width: `${globalMetrics.syllabusCoverage}%` }}
            />
          </div>
        </div>

        {/* 3. QBank Penetration */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              QBank Drilled
            </span>
            <HelpCircle className="h-4 w-4 text-[#008378]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-['Outfit'] text-3xl font-extrabold text-slate-900">
              {globalMetrics.qBankPenetration}%
            </span>
            <span className="text-xs text-slate-400">
              ({globalMetrics.totalQBank}/{globalMetrics.totalTopics})
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-[#008378] rounded-full transition-all duration-500"
              style={{ width: `${globalMetrics.qBankPenetration}%` }}
            />
          </div>
        </div>

        {/* 4. Active Spaced Revision */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              R1 Spaced Recall
            </span>
            <span className="h-4 w-4 text-[#594d41]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-['Outfit'] text-3xl font-extrabold text-slate-900">
              {globalMetrics.revisionDepth}%
            </span>
            <span className="text-xs text-slate-400">
              ({globalMetrics.totalR1}/{globalMetrics.totalTopics})
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-[#594d41] rounded-full transition-all duration-500"
              style={{ width: `${globalMetrics.revisionDepth}%` }}
            />
          </div>
        </div>
      </div>

      {/* Discipline Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: 'All 19 Subjects' },
            { id: 'clinical', label: 'Clinical (Medicine, Surg, OBG, PSM...)' },
            { id: 'paraclinical', label: 'Para-Clinical (Path, Pharm, Micro, FMT)' },
            { id: 'preclinical', label: 'Pre-Clinical (Anat, Physio, Biochem)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedDiscipline(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedDiscipline === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Subject-by-Subject Mastery Breakdown Ledger */}
      <div className="space-y-3">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {filteredSubjects.map((sub) => (
            <div
              key={sub.id}
              className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Left Subject Info */}
              <div className="space-y-1 sm:w-1/3 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#00685f] font-mono">
                    {sub.weightage} MARKS · {sub.disciplineType.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {sub.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {sub.totalTopics} high-yield topics
                </p>
              </div>

              {/* Middle Metrics Breakdown */}
              <div className="grid grid-cols-3 gap-3 sm:w-1/3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Notes</span>
                    <span className="font-bold text-slate-700">{sub.notesPct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-[#2c694e] rounded-full" style={{ width: `${sub.notesPct}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>QBank</span>
                    <span className="font-bold text-slate-700">{sub.qBankPct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-[#2c694e] rounded-full" style={{ width: `${sub.qBankPct}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>R1 Recall</span>
                    <span className="font-bold text-slate-700">{sub.r1Pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-[#594d41] rounded-full" style={{ width: `${sub.r1Pct}%` }} />
                  </div>
                </div>
              </div>

              {/* Right Action Button */}
              <div className="flex items-center justify-end gap-2.5 sm:w-1/4">
                <button
                  type="button"
                  onClick={() => onSelectSubject(sub.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 transition-all cursor-pointer"
                >
                  <span>Open Roadmap</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
