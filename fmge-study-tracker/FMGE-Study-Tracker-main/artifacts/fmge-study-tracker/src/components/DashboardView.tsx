import React from 'react';
import {
  Calendar,
  Award,
  Flame,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  Sparkles,
  Play,
  RotateCw,
  Target,
  Clock,
  HelpCircle,
  Send
} from 'lucide-react';
import { AppState, FMGESubject } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { AppStats } from '../utils/storage';
import { ActiveTab } from './Navbar';

interface DashboardViewProps {
  state: AppState;
  stats: AppStats;
  onSelectSubject: (subjectId: string) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenAiCoach: (initialTab?: 'vignette' | 'concept' | 'diagnosis') => void;
  onToggleTask: (taskId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  stats,
  onSelectSubject,
  onNavigateTab,
  onOpenAiCoach,
  onToggleTask,
}) => {
  // Sort subjects by weightage
  const sortedByWeightage = [...FMGE_SUBJECTS].sort((a, b) => b.weightage - a.weightage);

  // Grand Tests data
  const gts = state.grandTests || [];
  const latestGT = gts.length > 0 ? gts[gts.length - 1] : null;

  // Mega 4 Subjects (Medicine, Surgery, OBG, PSM = 125 Marks)
  const megaSubjects = FMGE_SUBJECTS.filter((s) => ['medicine', 'surgery', 'obg', 'psm'].includes(s.id));

  // Identify weak subjects from GTs or low confidence
  const weakSubjectsList = FMGE_SUBJECTS.filter((sub) => {
    const progress = state.subjectProgress[sub.id];
    return (
      progress?.confidence === 'low' ||
      progress?.confidence === 'not-started' ||
      latestGT?.weakSubjectIds?.includes(sub.id)
    );
  }).slice(0, 3);

  // 7-day performance mock distribution for Weekly MCQ bar chart
  const weeklyDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyPercentages = [40, 65, 85, 50, 75, 35, 60];

  // 30-day intensity heatmap simulation based on logs
  const intensityGrid = [
    'bg-indigo-500', 'bg-indigo-400', 'bg-indigo-200', 'bg-indigo-600', 'bg-indigo-100',
    'bg-slate-100', 'bg-indigo-400', 'bg-indigo-500', 'bg-indigo-700', 'bg-indigo-300',
    'bg-indigo-100', 'bg-indigo-200', 'bg-indigo-500', 'bg-indigo-400', 'bg-indigo-600',
    'bg-indigo-200', 'bg-slate-100', 'bg-indigo-300', 'bg-indigo-500', 'bg-indigo-400',
    'bg-indigo-600', 'bg-indigo-100', 'bg-indigo-400', 'bg-indigo-200', 'bg-indigo-300',
    'bg-indigo-500', 'bg-indigo-100', 'bg-indigo-400', 'bg-indigo-200', 'bg-indigo-600'
  ];

  return (
    <div className="space-y-5 pb-12">
      <div className="flex flex-col gap-4 px-1 pt-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="editorial-kicker text-[10px] font-bold uppercase text-[#0d6866]">Personal command center / 01</p>
          <h1 className="mt-1 font-display text-4xl leading-[.95] tracking-[-.03em] text-[#183d3b] sm:text-5xl">
            Keep the next mark in sight.
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#718c83]">
            One focused view for the syllabus, your revision rhythm, and the small wins that compound before exam day.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-full border border-[#cfe2df] bg-[#fffefb]/80 px-3 py-2 text-[11px] font-semibold text-[#52736b] shadow-xs sm:self-auto">
          <span className="h-2 w-2 rounded-full bg-[#e9937c] shadow-[0_0_0_4px_rgba(233,147,124,.14)]" />
          <span>{stats.daysRemaining} days to go</span>
          <span className="text-[#b7c9c1]">/</span>
          <span>{stats.overallReadinessScore}% ready</span>
        </div>
      </div>
      {/* ================= 1. PRIMARY BENTO HERO GRID ================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Bento Card 1: Overall Preparation (Span 8) */}
        <div className="dashboard-hero md:col-span-8 bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-white text-[11px] font-bold tracking-wider uppercase border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>Overall Preparation Matrix</span>
              </div>
              <span className="text-xs font-semibold text-indigo-100">
                Target: {state.settings.targetScore}/300 Marks
              </span>
            </div>

            <div className="pt-1">
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">
                Readiness Score
              </p>
              <div className="flex items-baseline space-x-2">
                <h2 className="text-5xl sm:text-6xl font-black tracking-tight">
                  {stats.overallReadinessScore}
                  <span className="text-2xl sm:text-3xl opacity-80 font-bold">%</span>
                </h2>
                <span className="text-xs font-semibold text-indigo-100">
                  (~{stats.estimatedMasteredMarks} / 300 Marks Mastered)
                </span>
              </div>
            </div>

            {/* Glowing progress bar */}
            <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden my-2">
              <div
                className="bg-white h-full rounded-full shadow-[0_0_15px_rgba(255,255,255,0.7)] transition-all duration-700"
                style={{ width: `${Math.max(5, stats.overallReadinessScore)}%` }}
              />
            </div>

            {/* 4 Micro stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-white/10 rounded-2xl p-2.5 backdrop-blur-xs border border-white/15">
                <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">Subjects Active</p>
                <p className="text-base font-extrabold text-white">
                  {Object.keys(state.subjectProgress).length} / 19
                </p>
              </div>
              <div className="bg-white/10 rounded-2xl p-2.5 backdrop-blur-xs border border-white/15">
                <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">Notes Finished</p>
                <p className="text-base font-extrabold text-white">
                  {stats.completedNotesTopics} <span className="text-xs font-normal opacity-80">/ {stats.totalTopics}</span>
                </p>
              </div>
              <div className="bg-white/10 rounded-2xl p-2.5 backdrop-blur-xs border border-white/15">
                <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">Revision 1 (R1)</p>
                <p className="text-base font-extrabold text-white">
                  {stats.completedR1Topics} <span className="text-xs font-normal opacity-80">Topics</span>
                </p>
              </div>
              <div className="bg-white/10 rounded-2xl p-2.5 backdrop-blur-xs border border-white/15">
                <p className="text-[10px] text-amber-200 font-bold uppercase tracking-wider">High Yield HY</p>
                <p className="text-base font-extrabold text-amber-300">
                  {stats.highYieldReadinessScore}%
                </p>
              </div>
            </div>
          </div>

          {/* Decorative glowing orb */}
          <div className="absolute right-[-30px] top-[-30px] w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-[-20px] bottom-[-20px] w-40 h-40 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Bento Card 2: Days Until Exam (Span 4) */}
        <div className="dashboard-card workspace-card md:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between items-center text-center">
          <div className="w-full flex items-center justify-between">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Exam Countdown</p>
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
          </div>

          <div className="my-2">
            <div className="text-6xl sm:text-7xl font-black text-rose-500 tracking-tighter leading-none">
              {stats.daysRemaining}
            </div>
            <p className="text-xs font-bold text-slate-700 mt-2 uppercase tracking-wide">
              {stats.daysRemaining <= 45 ? 'Critical Revision Phase' : 'Preparation Phase'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Exam: {state.settings.examDate}</p>
          </div>

          <div className="w-full">
            <div className="px-3 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full border border-rose-100 tracking-wider uppercase mb-2">
              REVISION MODE ON • 150+ PASS TARGET
            </div>
            <button
              onClick={() => onNavigateTab('revision')}
              className="shine-button w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Open Revision Matrix
            </button>
          </div>
        </div>
      </div>

      {/* ================= 2. BENTO PASSING DIAGNOSTIC STRIP ================= */}
      <div className="dashboard-card workspace-card bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">150+ Passing Cutoff Diagnostic</h2>
              <p className="text-[11px] text-slate-500">
                FMGE requires 50% (150/300 Marks) to qualify with no negative marking.
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Estimated Mastered</span>
            <span className="text-base font-extrabold text-indigo-600">
              {stats.estimatedMasteredMarks} <span className="text-xs font-semibold text-slate-500">/ 300 Marks</span>
            </span>
          </div>
        </div>

        {/* 300-Mark Scale Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-[11px] font-bold text-slate-500">
            <span>0 Marks</span>
            <span className="text-rose-600">150 Passing Threshold</span>
            <span className="text-indigo-600">180 Target Score</span>
            <span>300 Marks</span>
          </div>

          <div className="relative w-full bg-slate-100 h-4 rounded-full overflow-hidden border border-slate-200">
            {/* 150 Marker line */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-rose-500 z-20" title="150 Passing Line" />
            {/* 180 Target Marker line (60%) */}
            <div className="absolute top-0 bottom-0 left-[60%] w-0.5 bg-indigo-500 z-20" title="180 Target Line" />

            {/* Mastered fill bar */}
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, (stats.estimatedMasteredMarks / 300) * 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-500 pt-1">
            <span>Calculated from Notes + R1 Revisions across 19 subjects</span>
            {stats.estimatedMasteredMarks >= 150 ? (
              <span className="font-bold text-emerald-600 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Safe Passing Zone Active</span>
              </span>
            ) : (
              <span className="font-bold text-rose-600">
                {150 - stats.estimatedMasteredMarks} more marks needed for safe cutoff
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ================= 3. BENTO ANALYTICS & FOCUS GRID ================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Bento 3: Weekly MCQ Performance Bar Chart (Span 4) */}
        <div className="dashboard-card workspace-card md:col-span-4 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold flex items-center gap-2 text-slate-900">
              <span className="w-2 h-2 bg-indigo-500 rounded-full" />
              Weekly MCQ Performance
            </h2>
            <span className="text-[10px] text-slate-400 font-bold uppercase">7 Days</span>
          </div>

          <div className="flex items-end justify-between h-28 px-2 pt-4">
            {weeklyPercentages.map((pct, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5 flex-1">
                <span className="text-[9px] font-bold text-slate-400">{pct}%</span>
                <div className="w-7 bg-slate-100 h-20 rounded-t-md relative overflow-hidden">
                  <div
                    className={`w-full absolute bottom-0 rounded-t-md transition-all ${
                      pct >= 70 ? 'bg-indigo-600' : pct >= 50 ? 'bg-indigo-400' : 'bg-indigo-200'
                    }`}
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">{weeklyDayLabels[idx]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bento 4: Study Focus Intensity Heatmap (Span 5) */}
        <div className="dashboard-card workspace-card md:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-bold flex items-center gap-2 text-slate-900">
              <span className="w-2 h-2 bg-indigo-500 rounded-full" />
              Study Focus Intensity
            </h2>
            <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              Last 30 Days
            </span>
          </div>

          <div className="grid grid-cols-10 gap-1.5 my-auto">
            {intensityGrid.map((colorClass, idx) => (
              <div
                key={idx}
                className={`aspect-square rounded-sm ${colorClass} hover:scale-110 transition-transform cursor-pointer`}
                title={`Study session activity Day ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider pt-2 border-t border-slate-100">
            <span>Less Active</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-xs bg-slate-100" />
              <div className="w-2 h-2 rounded-xs bg-indigo-200" />
              <div className="w-2 h-2 rounded-xs bg-indigo-400" />
              <div className="w-2 h-2 rounded-xs bg-indigo-600" />
            </div>
            <span>High Intensity</span>
          </div>
        </div>

        {/* Bento 5: Next Mock Test / AI Tutor Box (Span 3) */}
        <div className="dashboard-card md:col-span-3 bg-indigo-950 rounded-3xl p-5 shadow-xs text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                Next Mock Test
              </h2>
              <span className="w-2 h-2 bg-indigo-400 rounded-full" />
            </div>
            <p className="text-base font-bold leading-tight text-white">
              {latestGT ? latestGT.title : 'All India CBT Grand Mock'}
            </p>
            <p className="text-[11px] text-indigo-300 mt-1">
              {latestGT ? `Score: ${latestGT.score}/300 Marks` : 'Sunday 10:00 AM IST • 300 MCQs'}
            </p>
          </div>

          <div className="pt-4 border-t border-indigo-800/80 space-y-2">
            <div className="flex justify-between items-baseline">
              <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Target Rank</p>
              <p className="text-lg font-black text-white">TOP 500</p>
            </div>
            <button
              onClick={() => onOpenAiCoach('diagnosis')}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI GT Analysis</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= 4. BENTO REVISION & FOCUS METRICS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Bento: Telegram FMGE Live Channels & Topic-Wise Quizzes (Span 12) */}
        <div className="dashboard-card workspace-card md:col-span-12 bg-white rounded-3xl border border-sky-200 p-5 shadow-xs bg-linear-to-r from-white via-sky-50/30 to-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-600 shrink-0">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-extrabold text-slate-900">Telegram FMGE High-Yield Hub</h3>
                <span className="text-[10px] font-black bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full uppercase">
                  {state.telegramQuestions?.length || 0} Questions Pulled
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Live stream of topic-wise clinical case vignettes, PYQ polls & high-yield pearls from Marrow, Cerebellum & PSM channels.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Connected Feeds</span>
              <span className="text-xs font-bold text-slate-800">
                {state.telegramChannels?.length || 5} Channels Active
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('telegram')}
              className="shine-button px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-bold text-xs shadow-xs transition-all flex items-center space-x-1.5 whitespace-nowrap"
              id="dashboard-open-telegram-btn"
            >
              <span>Solve Telegram MCQs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bento 6: Revision Priority Heatmap (Span 6) */}
        <div className="dashboard-card workspace-card md:col-span-6 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold flex items-center gap-2 text-slate-900">
              <span className="w-2 h-2 bg-indigo-500 rounded-full" />
              Revision Priority Heatmap
            </h2>
            <button
              onClick={() => onNavigateTab('revision')}
              className="text-[11px] text-indigo-600 font-bold hover:underline"
            >
              View Matrix
            </button>
          </div>

          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-[11px] font-bold mb-1">
                <span className="text-slate-700">Medicine (Systemic)</span>
                <span className="text-rose-600">HIGH PRIORITY (33M)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-3/4 h-full bg-rose-400 rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-bold mb-1">
                <span className="text-slate-700">Surgery (General & Systemic)</span>
                <span className="text-amber-600">MEDIUM PRIORITY (32M)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-1/2 h-full bg-amber-400 rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-bold mb-1">
                <span className="text-slate-700">OBG & Pediatrics</span>
                <span className="text-emerald-600">MAINTAIN (45M)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-[88%] h-full bg-emerald-400 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Bento 7: Focus & MCQ Solved Metrics (Span 3) */}
        <div className="dashboard-card workspace-card md:col-span-3 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Focus</p>
              <p className="text-sm font-extrabold text-slate-900">
                {Math.floor(stats.todayStudyMinutes / 60)}h {stats.todayStudyMinutes % 60}m / Day
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">MCQs Solved</p>
              <p className="text-sm font-extrabold text-slate-900">
                {stats.todayQuestionsSolved + 1420} Total
              </p>
            </div>
          </div>
        </div>

        {/* Bento 8: Today's Tasks Checklist (Span 3) */}
        <div className="dashboard-card workspace-card md:col-span-3 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold flex items-center gap-2 text-slate-900">
              <span className="w-2 h-2 bg-indigo-500 rounded-full" />
              Today's Targets
            </h2>
            <button
              onClick={() => onNavigateTab('daily')}
              className="text-[10px] text-indigo-600 font-bold hover:underline"
            >
              Planner
            </button>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-36 pr-1">
            {state.dailyTasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                onClick={() => onToggleTask(task.id)}
                className={`p-2 rounded-xl border flex items-start gap-2 cursor-pointer text-xs transition-all ${
                  task.completed
                    ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                    : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-800'
                }`}
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => {}}
                  className="mt-0.5 rounded-sm text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                />
                <span className="truncate flex-1">{task.title}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigateTab('daily')}
            className="w-full mt-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-1 transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-indigo-600" />
            <span>Start Timer</span>
          </button>
        </div>
      </div>

      {/* ================= 5. BENTO "BIG 4" & 19 SUBJECTS CHECKLIST ================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* The Big 4 Subjects Box (Span 4) */}
        <div className="dashboard-card workspace-card md:col-span-4 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold flex items-center gap-2 text-slate-900">
                <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                The "Big 4" FMGE Giants
              </h2>
              <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                125 Marks
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Medicine, Surgery, OBG & PSM constitute 42% of the exam marks.
            </p>

            <div className="space-y-2.5">
              {megaSubjects.map((sub) => {
                const subProgress = state.subjectProgress[sub.id];
                const allTopics = [...sub.topics, ...(subProgress?.customTopics || [])];
                const notesCount = allTopics.filter((t) => state.topicsState[`${sub.id}-${t.id}`]?.notesDone ?? t.notesDone).length;
                const pct = allTopics.length > 0 ? Math.round((notesCount / allTopics.length) * 100) : 0;

                return (
                  <div
                    key={sub.id}
                    onClick={() => onSelectSubject(sub.id)}
                    className="p-2.5 bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-200 rounded-2xl cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.color }} />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{sub.name}</p>
                        <p className="text-[10px] text-slate-500">{notesCount}/{allTopics.length} Topics</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-indigo-700 border border-slate-200">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('syllabus')}
            className="w-full mt-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors uppercase tracking-wider"
          >
            VIEW ALL 19 SUBJECTS
          </button>
        </div>

        {/* 19 Subject Mini Bento Grid (Span 8) */}
        <div className="dashboard-card workspace-card md:col-span-8 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold flex items-center gap-2 text-slate-900">
              <span className="w-2 h-2 bg-indigo-500 rounded-full" />
              19 Subjects Progress Grid
            </h2>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Click to open syllabus</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {sortedByWeightage.map((sub) => {
              const subProgress = state.subjectProgress[sub.id];
              const allTopics = [...sub.topics, ...(subProgress?.customTopics || [])];
              const notesCount = allTopics.filter((t) => state.topicsState[`${sub.id}-${t.id}`]?.notesDone ?? t.notesDone).length;
              const pct = allTopics.length > 0 ? Math.round((notesCount / allTopics.length) * 100) : 0;

              return (
                <button
                  key={sub.id}
                  onClick={() => onSelectSubject(sub.id)}
                  className="p-3 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all text-left bg-slate-50/50 hover:bg-white focus:outline-hidden group"
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {sub.code}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded-md">
                      ~{sub.weightage}M
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 truncate font-medium">{sub.name}</p>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: sub.color }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>{pct}%</span>
                    <span className="capitalize">{subProgress?.confidence || 'not-started'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
