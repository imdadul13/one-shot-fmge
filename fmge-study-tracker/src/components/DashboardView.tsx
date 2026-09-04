import React, { useState } from 'react';
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
  Send,
  Compass,
  ShieldAlert,
  Sliders,
  Zap,
  Layers,
  FileText,
  ListTodo,
  Check,
  Plus
} from 'lucide-react';
import { AppState, FMGESubject, DailyMissionItem, DailyTask } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { AppStats } from '../utils/storage';
import { ActiveTab } from './Navbar';
import {
  calculateBackwardPlan,
  generateDailyMissionPlan,
  calculateMarksAtRisk,
  calculateRecoverableMarks,
  calculateReadinessTrend,
  generateWeeklyCommandReport,
} from '../utils/missionControlEngine';
import { WeeklyReportModal } from './WeeklyReportModal';
import { TrajectoryModal } from './TrajectoryModal';

interface DashboardViewProps {
  state: AppState;
  stats: AppStats;
  onSelectSubject: (subjectId: string) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenAiCoach: (initialTab?: 'vignette' | 'concept' | 'diagnosis' | 'strategy') => void;
  onToggleTask: (taskId: string) => void;
  onAddTask?: (task: DailyTask) => void;
  onToggleTopicState?: (
    subjectId: string,
    topicId: string,
    field: 'notesDone' | 'qBankDone' | 'r1Done' | 'r2Done' | 'r3Done'
  ) => void;
  onToggleMissionCompletion?: (missionId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  stats,
  onSelectSubject,
  onNavigateTab,
  onOpenAiCoach,
  onToggleTask,
  onAddTask,
  onToggleTopicState,
  onToggleMissionCompletion,
}) => {
  // Mission Control interactive state
  const [availableHours, setAvailableHours] = useState<number>(6);
  const [isMinimumViableDay, setIsMinimumViableDay] = useState<boolean>(false);
  const [isWeeklyReportOpen, setIsWeeklyReportOpen] = useState<boolean>(false);
  const [isTrajectoryModalOpen, setIsTrajectoryModalOpen] = useState<boolean>(false);
  const [addedToPlannerIds, setAddedToPlannerIds] = useState<Record<string, boolean>>({});

  // Compute Mission Control Engines
  const backwardPlan = calculateBackwardPlan(state);
  const dailyPlan = generateDailyMissionPlan(state, availableHours, isMinimumViableDay);
  const marksAtRisk = calculateMarksAtRisk(state);
  const recoverableMarks = calculateRecoverableMarks(state);
  const trend = calculateReadinessTrend(state);
  const weeklyReport = generateWeeklyCommandReport(state);

  // Grand Tests data
  const gts = state.grandTests || [];
  const latestGT = gts.length > 0 ? gts[gts.length - 1] : null;

  // Mega 4 Subjects (Medicine, Surgery, OBG, PSM = 125 Marks)
  const megaSubjects = FMGE_SUBJECTS.filter((s) => ['medicine', 'surgery', 'obg', 'psm'].includes(s.id));
  const sortedByWeightage = [...FMGE_SUBJECTS].sort((a, b) => b.weightage - a.weightage);

  // Weekly MCQ performance chart
  const weeklyDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyPercentages = [40, 65, 85, 50, 75, 35, 60];

  const handleToggleMissionItem = (item: DailyMissionItem) => {
    onToggleMissionCompletion?.(item.id);

    if (item.subjectId && item.topicName && onToggleTopicState) {
      const subject = FMGE_SUBJECTS.find((s) => s.id === item.subjectId);
      const topic = subject?.topics.find((t) => t.name.toLowerCase() === item.topicName?.toLowerCase());
      if (topic) {
        if (item.type === 'revision_due') {
          onToggleTopicState(item.subjectId, topic.id, 'r1Done');
        } else {
          onToggleTopicState(item.subjectId, topic.id, 'notesDone');
        }
      }
    }
  };

  const handleAddMissionToPlanner = (item: DailyMissionItem) => {
    if (onAddTask) {
      let taskType: DailyTask['type'] = 'video';
      if (item.type === 'revision_due') taskType = 'revision';
      else if (item.type === 'mcq_target') taskType = 'qbank';
      else if (item.type === 'error_notebook' || item.type === 'gt_prep') taskType = 'gt_review';

      const newTask: DailyTask = {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: `[Mission] ${item.title}`,
        durationMinutes: item.allocatedMinutes,
        completed: false,
        subjectId: item.subjectId,
        topicName: item.topicName,
        type: taskType,
        priority: item.type === 'most_important' ? 'high' : 'medium',
      };
      onAddTask(newTask);
      setAddedToPlannerIds((prev) => ({ ...prev, [item.id]: true }));
    } else {
      onNavigateTab('daily');
    }
  };

  const getTrajectoryBadgeStyles = () => {
    switch (backwardPlan.trajectoryStatus) {
      case 'AHEAD':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
      case 'ON TRACK':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100';
      case 'AT RISK':
        return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100';
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ================= 1. MISSION CONTROL HEADER ================= */}
      <div className="flex flex-col gap-4 px-1 pt-1 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="editorial-kicker text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>FMGE Mission Control</span>
            </span>
            <span className="text-xs font-semibold text-slate-600">
              Welcome back, <span className="font-bold text-[#084d50]">{state.settings.userName || 'Doctor'}</span>
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-semibold text-slate-500">
              Exam: {state.settings.examDate} ({stats.daysRemaining} Days)
            </span>
          </div>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl leading-tight font-black tracking-tight text-slate-900">
            What Should I Do Today for FMGE?
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-2xl">
            Your readiness is at <span className="font-bold text-[#0d6866]">{stats.overallReadinessScore}%</span>. Synthesizing 19 subjects, GT mistakes, spaced revision gaps, and high-yield predictions.
          </p>
        </div>

        {/* Top Action Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Trajectory Status Pill */}
          <button
            onClick={() => setIsTrajectoryModalOpen(true)}
            className={`px-3 py-2 rounded-2xl border text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-xs ${getTrajectoryBadgeStyles()}`}
            title="View Backward Trajectory Analysis"
          >
            <Compass className="w-4 h-4" />
            <span>Trajectory: {backwardPlan.trajectoryStatus}</span>
          </button>

          {/* Weekly Command Report Button */}
          <button
            onClick={() => setIsWeeklyReportOpen(true)}
            className="px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5"
            id="open-weekly-report-btn"
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span>Weekly Report</span>
          </button>

          {/* AI Coach Button */}
          <button
            onClick={() => onOpenAiCoach('vignette')}
            className="px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center space-x-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>AI Coach</span>
          </button>
        </div>
      </div>

      {/* ================= 2. TOP HERO BENTO GRID ================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Bento 1: Readiness Matrix (Span 6) */}
        <div className="md:col-span-6 bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 rounded-3xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20">
                Readiness Score
              </span>
              <span className="text-xs font-medium text-indigo-200">
                {stats.estimatedMasteredMarks} / 300 Mastered Marks
              </span>
            </div>

            <div>
              <div className="flex items-baseline space-x-2">
                <h2 className="text-5xl sm:text-6xl font-black tracking-tight">
                  {stats.overallReadinessScore}
                  <span className="text-2xl sm:text-3xl opacity-80">%</span>
                </h2>
                <span className="text-xs text-emerald-300 font-bold">
                  {trend.currentVelocityText}
                </span>
              </div>
            </div>

            {/* Glowing progress bar */}
            <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden my-1.5">
              <div
                className="bg-white h-full rounded-full shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-700"
                style={{ width: `${Math.max(5, stats.overallReadinessScore)}%` }}
              />
            </div>

            {/* Micro stats */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="bg-white/10 rounded-2xl p-2 border border-white/10 text-center">
                <p className="text-[9px] text-indigo-200 font-bold uppercase">Syllabus</p>
                <p className="text-sm font-extrabold text-white">{stats.notesPercentage}%</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-2 border border-white/10 text-center">
                <p className="text-[9px] text-indigo-200 font-bold uppercase">R1 Revision</p>
                <p className="text-sm font-extrabold text-white">{stats.completedR1Topics} Topics</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-2 border border-white/10 text-center">
                <p className="text-[9px] text-amber-200 font-bold uppercase">High Yield</p>
                <p className="text-sm font-extrabold text-amber-300">{stats.highYieldReadinessScore}%</p>
              </div>
            </div>
          </div>

          <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Bento 2: GT Target & Score Gap (Span 3) */}
        <div className="md:col-span-3 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">GT Target Tracker</span>
            <Target className="w-4 h-4 text-indigo-600" />
          </div>

          <div className="my-2">
            <div className="text-3xl font-black text-slate-900">
              {backwardPlan.currentGtAverage}
              <span className="text-xs font-normal text-slate-400 ml-1">/ 300 Avg</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mt-2">
              <span>Target: {backwardPlan.targetGtScore}</span>
              <span className={backwardPlan.scoreGap > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
                {backwardPlan.scoreGap > 0 ? `Gap: ${backwardPlan.scoreGap}M` : 'Passed Target'}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full"
                style={{ width: `${Math.min(100, (backwardPlan.currentGtAverage / backwardPlan.targetGtScore) * 100)}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('grandtests')}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Review GT History
          </button>
        </div>

        {/* Bento 3: Exam Countdown & Phase (Span 3) */}
        <div className="md:col-span-3 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Exam Countdown</span>
            <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
          </div>

          <div className="my-1 text-center">
            <div className="text-4xl font-black text-rose-500 tracking-tight">
              {backwardPlan.remainingDays}
              <span className="text-sm font-bold text-slate-500 ml-1">Days</span>
            </div>
            <div className="mt-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block bg-indigo-50 text-indigo-700 border border-indigo-100">
              {backwardPlan.phaseBadge}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 text-center truncate">
            {backwardPlan.phaseRule}
          </p>
        </div>
      </div>

      {/* ================= 3. TIME & PREPARATION MODE ALLOCATION BAR ================= */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Select Your Available Study Hours Today
              </h3>
              <p className="text-[11px] text-slate-500">
                Mission Control recalibrates the exact tasks to fit your exact time budget.
              </p>
            </div>
          </div>

          {/* Time Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => {
                setIsMinimumViableDay(true);
                setAvailableHours(2.25);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
                isMinimumViableDay
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ Min Day (2.2h)</span>
            </button>

            {[2, 4, 6, 8, 10].map((hours) => (
              <button
                key={hours}
                onClick={() => {
                  setIsMinimumViableDay(false);
                  setAvailableHours(hours);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  !isMinimumViableDay && availableHours === hours
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {hours}h {hours === 6 ? '(Balanced)' : hours === 8 ? '(Intense)' : hours === 10 ? '(Mastery)' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Recovery Alert if student was away */}
        {dailyPlan.isRecoveryPlan && (
          <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Adaptive Recovery Mode Active:</strong> Detected missed study in recent days. We've prioritized only high-ROI tasks without overwhelming backlog.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ================= 4. SECTION: TODAY'S MISSION (PRIORITIZED PLAN) ================= */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-rose-500 fill-rose-500" />
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                TODAY'S MISSION ({dailyPlan.items.length} Target Activities)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {dailyPlan.phaseDescription}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              Allocated: {dailyPlan.totalAllocatedMinutes}m ({(dailyPlan.totalAllocatedMinutes / 60).toFixed(1)} Hours)
            </span>
          </div>
        </div>

        {/* Mission Items List */}
        <div className="space-y-3">
          {dailyPlan.items.map((item, idx) => {
            const isCompleted = !!state.completedMissionIds?.[item.id];
            const isAdded = !!addedToPlannerIds[item.id];
            const isTop1 = item.type === 'most_important';

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : isTop1
                    ? 'bg-linear-to-r from-amber-50/70 via-white to-amber-50/30 border-amber-300 shadow-xs'
                    : 'bg-slate-50/60 hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        isTop1
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : item.type === 'revision_due'
                          ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                          : item.type === 'mcq_target'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-slate-200 text-slate-700 border-slate-300'
                      }`}>
                        {item.badgeLabel}
                      </span>

                      <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{item.allocatedMinutes} min</span>
                      </span>

                      {item.subjectCode && (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {item.subjectCode}
                        </span>
                      )}

                      {item.relatedPredictionScore && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          Score: {item.relatedPredictionScore}/100
                        </span>
                      )}
                    </div>

                    <h3 className={`text-sm sm:text-base font-extrabold ${isCompleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {item.title}
                    </h3>
                    {item.subtitle && (
                      <p className="text-xs text-slate-500 font-medium">{item.subtitle}</p>
                    )}

                    {/* Why reasons */}
                    <div className="pt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
                      {item.whyReasons.map((why, wIdx) => (
                        <span key={wIdx} className="flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                          <span>{why}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleAddMissionToPlanner(item)}
                      disabled={isAdded}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center space-x-1 ${
                        isAdded
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                      title="Add to Daily Planner"
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>In Planner</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Planner</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleToggleMissionItem(item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 ${
                        isCompleted
                          ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isCompleted ? 'Completed' : 'Mark Done'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= 5. SECTION: MARKS-AT-RISK ENGINE (TOP 10) ================= */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                TOP 10 MARKS AT RISK (VULNERABILITY RANKING)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked strictly by personal weaknesses, repeated errors, high-yield weightage, revision gaps & prediction scores.
            </p>
          </div>
        </div>

        {/* Marks at risk table/list */}
        <div className="space-y-2.5">
          {marksAtRisk.map((risk) => (
            <div
              key={risk.topicId}
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="flex items-start space-x-3 flex-1">
                <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  #{risk.rank}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-extrabold text-slate-900">
                      {risk.topicName}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded-md border border-indigo-100">
                      {risk.subjectCode} (~{risk.weightage}M)
                    </span>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded-md border border-rose-100">
                      Risk: {risk.riskScore}/100
                    </span>
                    {risk.gtMistakes > 0 && (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded-md">
                        GT Mistake Logged
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600 font-medium">
                    <strong className="text-slate-800">Status:</strong> {risk.currentStatus} • <strong className="text-slate-800">Danger:</strong> {risk.whyDangerous}
                  </p>
                  <p className="text-[11px] text-indigo-700 font-semibold">
                    ⚡ <strong>Action:</strong> {risk.recommendedAction} ({risk.timeRequired})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  onClick={() => onSelectSubject(risk.subjectId)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Study Topic
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= 6. SECTION: RECOVERABLE MARKS (GAP TO 185) & GT STRATEGY ================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Recoverable Marks Breakdown (Span 7) */}
        <div className="md:col-span-7 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-600" />
              <span>Recoverable Marks Breakdown (Target {recoverableMarks.targetScore})</span>
            </h3>
            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              +{recoverableMarks.totalPotential} Marks Potential
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Current GT Avg: <strong>{recoverableMarks.currentGtAverage}</strong>. Gain these projected marks by targeting unrevised high-yield topics and error items:
          </p>

          <div className="space-y-2">
            {recoverableMarks.opportunities.map((opp) => (
              <div key={opp.subjectId} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-slate-900">{opp.subjectName}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">(~{opp.weightage}M)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{opp.highYieldAction}</p>
                </div>
                <span className="px-2 py-1 rounded-lg font-black text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  +{opp.potentialGain}M
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* GT Strategy & Adaptive Shift (Span 5) */}
        <div className="md:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>GT Adaptive Strategy</span>
            </h3>

            <div className="mt-3 p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs space-y-2">
              <p className="font-bold text-indigo-950">
                Latest GT: {latestGT ? latestGT.title : 'Initial Mock'}{' '}
                <span className="font-normal text-slate-600">({latestGT ? `${latestGT.score}/300` : '142/300'})</span>
              </p>
              <p className="text-slate-600 leading-relaxed">
                Weak subjects identified:{' '}
                <strong>
                  {(latestGT?.weakSubjectIds || ['medicine', 'psm']).join(', ').toUpperCase()}
                </strong>. Mission Control has dynamically allocated +40% more study volume to these areas this week.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onOpenAiCoach('diagnosis')}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Open AI GT Diagnosis</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= 7. SECTION: 150+ PASSING DIAGNOSTIC & BIG 4 ================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
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
            <span className="text-rose-600">150 Passing Cutoff</span>
            <span className="text-indigo-600">{state.settings.targetScore || 185} Target Score</span>
            <span>300 Marks</span>
          </div>

          <div className="relative w-full bg-slate-100 h-4 rounded-full overflow-hidden border border-slate-200">
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-rose-500 z-20" title="150 Passing Line" />
            <div className="absolute top-0 bottom-0 left-[61.6%] w-0.5 bg-indigo-500 z-20" title="185 Target Line" />
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

      {/* ================= 8. SECTION: TELEGRAM HUB & 19 SUBJECTS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Telegram Hub Card (Span 12) */}
        <div className="md:col-span-12 bg-white rounded-3xl border border-sky-200 p-5 shadow-xs bg-linear-to-r from-white via-sky-50/30 to-white flex flex-col md:flex-row md:items-center justify-between gap-4">
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

          <button
            onClick={() => onNavigateTab('telegram')}
            className="shine-button px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-bold text-xs shadow-xs transition-all flex items-center space-x-1.5 whitespace-nowrap self-start md:self-center"
            id="dashboard-open-telegram-btn"
          >
            <span>Solve Telegram MCQs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* The Big 4 Subjects Box (Span 4) */}
        <div className="md:col-span-4 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
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
        <div className="md:col-span-8 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
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

      {/* Modals */}
      <WeeklyReportModal
        isOpen={isWeeklyReportOpen}
        onClose={() => setIsWeeklyReportOpen(false)}
        report={weeklyReport}
        state={state}
        onNavigateTab={onNavigateTab}
        onOpenAiCoach={() => onOpenAiCoach('diagnosis')}
      />

      <TrajectoryModal
        isOpen={isTrajectoryModalOpen}
        onClose={() => setIsTrajectoryModalOpen(false)}
        analysis={backwardPlan}
        state={state}
        onOpenAiCoach={() => onOpenAiCoach('diagnosis')}
      />
    </div>
  );
};
