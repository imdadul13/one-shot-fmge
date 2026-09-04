import React, { useState, useMemo } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  Clock,
  Flame,
  Sparkles,
  BookOpen,
  Layers,
  RotateCw,
  HelpCircle,
  Award,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AppState,
  CandidateTopicRecommendation,
  DailyMissionTask,
  GeneratedDailyMission,
  PracticeSessionContext,
} from '../types';
import {
  generateDailyMission,
  markDailyMissionTaskComplete,
  calculateStudyStreak,
} from '../utils/dailyMissionEngine';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import confetti from 'canvas-confetti';

interface DailyMissionWorkspaceModalProps {
  state: AppState;
  onClose: () => void;
  onLaunchPracticeMcq: (context: PracticeSessionContext) => void;
  onOpenMasterTopic: (candidate: CandidateTopicRecommendation) => void;
  onOpenErrorVault: (subjectId?: string, topicName?: string) => void;
  onOpenRevisionMatrix: () => void;
  onTaskCompleted?: (taskId: string, result?: any) => void;
}

const TIME_BUDGET_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
  { label: '4 hours', value: 240 },
  { label: '6 hours', value: 360 },
];

export const DailyMissionWorkspaceModal: React.FC<DailyMissionWorkspaceModalProps> = ({
  state,
  onClose,
  onLaunchPracticeMcq,
  onOpenMasterTopic,
  onOpenErrorVault,
  onOpenRevisionMatrix,
  onTaskCompleted,
}) => {
  const [selectedDuration, setSelectedDuration] = useState<number>(120);
  const [activeTab, setActiveTab] = useState<'mission' | 'summary'>('mission');

  // Generate Mission based on the Adaptive Priority Engine
  const mission: GeneratedDailyMission = useMemo(
    () => generateDailyMission(state, selectedDuration),
    [state, selectedDuration]
  );

  const streakDays = useMemo(() => calculateStudyStreak(state.studyLogs), [state.studyLogs]);

  const completedCount = mission.tasks.filter((t) => t.isCompleted).length;
  const totalCount = mission.tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const remainingMinutes = mission.tasks
    .filter((t) => !t.isCompleted)
    .reduce((sum, t) => sum + t.durationMinutes, 0);

  // Trigger celebration on 100% mission completion
  const handleExecuteTask = (task: DailyMissionTask) => {
    const subject = FMGE_SUBJECTS.find((s) => s.id === task.subjectId);
    const topic = subject?.topics.find((t) => t.id === task.topicId);

    const candidate: CandidateTopicRecommendation = {
      subjectId: task.subjectId,
      subjectName: task.subjectName,
      subjectCode: task.subjectCode,
      subjectColor: task.subjectColor,
      topicId: task.topicId,
      topicName: task.topicName,
      isHighYield: task.isHighYield,
      weightage: subject?.weightage || 25,
      accuracy: 50,
      recentAccuracy: 50,
      totalAttempts: 5,
      repeatedErrorsCount: 0,
      isRevisionDue: task.type === 'REVISION',
      recommendationScore: task.priorityScore,
      priorityScore: task.priorityScore,
      masteryScore: task.masteryScore,
      priorityLabel: task.priorityScore >= 75 ? 'URGENT CORE' : 'HIGH',
      reasons: [task.reason],
      primaryReason: task.reason,
      searchQueries: [task.topicName],
    };

    switch (task.type) {
      case 'MASTER_TOPIC':
      case 'CRASH_SLIDES':
      case 'FLASHCARDS':
      case 'CLINICAL_CASES':
        onClose();
        onOpenMasterTopic(candidate);
        break;

      case 'PRACTICE_MCQS':
      case 'MIXED_HIGH_YIELD_MCQS':
        onClose();
        onLaunchPracticeMcq({
          sessionId: `mission-session-${Date.now()}`,
          source: 'daily_mission',
          subjectId: task.subjectId,
          subjectName: task.subjectName,
          topicId: task.topicId,
          topicName: task.topicName,
          subtopic: task.subtopic,
          targetQuestionCount: task.targetCount || 10,
        });
        break;

      case 'REVIEW_ERROR_VAULT':
        onClose();
        onOpenErrorVault(task.subjectId, task.topicName);
        break;

      case 'REVISION':
        onClose();
        onOpenRevisionMatrix();
        break;

      default:
        onClose();
        onOpenMasterTopic(candidate);
        break;
    }
  };

  const handleToggleTaskComplete = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    onTaskCompleted?.(taskId);
    confetti({
      particleCount: 30,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white border border-slate-200/80 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl text-slate-900 flex flex-col max-h-[90vh]"
      >
        {/* ================= MODAL HEADER ================= */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center font-bold">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-['Outfit'] text-slate-900 tracking-tight">
                  Start My Day · Daily Study Mission
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold font-['Outfit']">
                  <Flame className="h-3 w-3 fill-amber-500 text-amber-500" />
                  {streakDays}-Day Streak
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Targeted high-yield actions synthesized by the FMGE Adaptive Priority Engine.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ================= TIME BUDGET SELECTOR ================= */}
        <div className="px-5 sm:px-6 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Clock className="h-3.5 w-3.5 text-sky-600" />
            <span className="font-semibold text-slate-900 font-['Outfit']">Study Budget:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {TIME_BUDGET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedDuration(opt.value)}
                className={`px-3 py-1 rounded-full text-xs font-bold font-['Outfit'] transition-all cursor-pointer ${
                  selectedDuration === opt.value
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ================= MISSION PROGRESS BAR ================= */}
        <div className="px-5 sm:px-6 py-3.5 bg-white border-b border-slate-100 flex items-center justify-between gap-4 shrink-0">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-slate-900 font-['Outfit']">
                Progress: {completedCount} of {totalCount} Tasks Complete
              </span>
              <span className="text-sky-700 font-bold font-mono">
                {progressPct}% · {remainingMinutes > 0 ? `${remainingMinutes}m remaining` : 'Complete!'}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-sky-500 transition-all duration-500 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {mission.isCompleted && (
            <button
              onClick={() => setActiveTab(activeTab === 'summary' ? 'mission' : 'summary')}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer font-['Outfit']"
            >
              <Award className="h-3.5 w-3.5 text-emerald-600" />
              <span>{activeTab === 'summary' ? 'View Tasks' : 'Daily Summary'}</span>
            </button>
          )}
        </div>

        {/* ================= MODAL BODY: TASKS LIST OR SUMMARY ================= */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3 flex-1 bg-slate-50/50">
          {activeTab === 'summary' || mission.isCompleted ? (
            <div className="p-6 rounded-2xl bg-white border border-emerald-200 text-center space-y-4 my-2 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-['Outfit'] text-slate-900">TODAY&apos;S MISSION COMPLETE ✓</h3>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                  Outstanding focus! You have successfully completed your high-priority study mission for today.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 max-w-lg mx-auto">
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-['Outfit']">Time Studied</span>
                  <span className="text-base font-bold text-slate-900 block mt-0.5 font-['Outfit']">
                    {Math.floor(mission.totalAllocatedMinutes / 60)}h {mission.totalAllocatedMinutes % 60}m
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-['Outfit']">Tasks Done</span>
                  <span className="text-base font-bold text-sky-700 block mt-0.5 font-['Outfit']">
                    {completedCount} / {totalCount}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-['Outfit']">Study Streak</span>
                  <span className="text-base font-bold text-amber-600 block mt-0.5 font-['Outfit']">
                    🔥 {streakDays} Days
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-['Outfit']">Adaptive Status</span>
                  <span className="text-base font-bold text-emerald-700 block mt-0.5 font-['Outfit']">
                    Updated
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 font-medium italic pt-2">
                &ldquo;Tomorrow&apos;s priorities will adapt dynamically to today&apos;s completed performance.&rdquo;
              </p>
            </div>
          ) : null}

          {/* List of Tasks */}
          <div className="space-y-3">
            {mission.tasks.map((task) => {
              return (
                <div
                  key={task.id}
                  onClick={() => handleExecuteTask(task)}
                  className={`group relative p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    task.isCompleted
                      ? 'bg-slate-100/60 border-slate-200 opacity-60'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Completion Checkbox */}
                    <button
                      onClick={(e) => handleToggleTaskComplete(e, task.id)}
                      className={`mt-0.5 h-6 w-6 rounded-lg flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                        task.isCompleted
                          ? 'bg-emerald-500 text-white'
                          : 'border border-slate-300 hover:border-slate-400 bg-white text-transparent hover:text-slate-400'
                      }`}
                      title={task.isCompleted ? 'Mark incomplete' : 'Mark complete'}
                    >
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </button>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold font-['Outfit']">
                          Step #{task.sequenceNumber}
                        </span>

                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-['Outfit']"
                          style={{
                            backgroundColor: `${task.subjectColor}15`,
                            color: task.subjectColor,
                            border: `1px solid ${task.subjectColor}30`,
                          }}
                        >
                          {task.subjectName}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-bold font-['Outfit']">
                          Priority {task.priorityScore}/100
                        </span>

                        <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono font-medium">
                          <Clock className="h-3 w-3" />
                          {task.durationMinutes} min
                        </span>
                      </div>

                      <h4
                        className={`text-sm sm:text-base font-bold text-slate-900 font-['Outfit'] ${
                          task.isCompleted ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {task.topicName}
                      </h4>

                      <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                        {task.actionDescription}
                      </p>

                      <p className="text-[11px] text-sky-800 font-medium">
                        💡 <span className="font-semibold text-slate-800">Why: </span>
                        {task.reason}
                      </p>
                    </div>
                  </div>

                  {/* Right Action Button */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleExecuteTask(task)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold font-['Outfit'] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                        task.isCompleted
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>{task.actionLabel}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-sky-500" />
            <span>Tasks are ordered adaptively by FMGE weight, weakness, and spaced revision intervals.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
