import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Zap,
  Flame,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Plus,
  BookOpen,
  HelpCircle,
  Lightbulb,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Stethoscope,
  Eye,
  Pill,
  Loader2,
  CalendarPlus,
} from 'lucide-react';
import { PredictedTopicItem, DailyTask } from '../types';

interface PredictionExplanationModalProps {
  topic: PredictedTopicItem | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleTopicState: (subjectId: string, topicId: string, field: 'r1Done' | 'r2Done' | 'r3Done') => void;
  onAddTask: (task: DailyTask) => void;
  onOpenAiCoach: (tab?: 'vignette' | 'concept' | 'diagnosis' | 'strategy', subjectId?: string, topicName?: string) => void;
}

interface AiStrategyState {
  studyStrategy: string;
  clinicalVignetteClue: string;
  drugOfChoiceOrGoldStandard: string;
  examTrapWarning: string;
  memoryMnemonic: string;
}

export const PredictionExplanationModal: React.FC<PredictionExplanationModalProps> = ({
  topic,
  isOpen,
  onClose,
  onToggleTopicState,
  onAddTask,
  onOpenAiCoach,
}) => {
  const [aiStrategy, setAiStrategy] = useState<AiStrategyState | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [addedToPlanner, setAddedToPlanner] = useState(false);

  if (!isOpen || !topic) return null;

  const getLevelBadgeClasses = (level?: string) => {
    switch (level) {
      case 'VERY_HIGH':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MODERATE':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'LOW':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handleFetchAiStrategy = async () => {
    setIsLoadingAi(true);
    try {
      const res = await fetch('/api/ai/predict-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.topicName,
          subject: topic.subjectName,
          predictionScore: topic.score,
          predictionLevel: topic.levelLabel || 'HIGH',
          whyReasons: topic.whyReasons || [],
          userErrorCount: (topic.gtErrorCount || 0) + (topic.notebookErrorCount || 0),
          revisionGap: topic.prepStatus?.lastRevisionText || 'Pending',
        }),
      });
      const data = await res.json();
      setAiStrategy({
        studyStrategy: data?.studyStrategy || `Focus on high-yield clinical presentation, diagnostic algorithms, and first-line treatment guidelines for ${topic.topicName}.`,
        clinicalVignetteClue: data?.clinicalVignetteClue || 'Look for patient age, onset duration, and hallmark vital signs in the clinical vignette stem.',
        drugOfChoiceOrGoldStandard: data?.drugOfChoiceOrGoldStandard || 'Review the gold-standard diagnostic modality and first-line pharmacological agent.',
        examTrapWarning: data?.examTrapWarning || 'Beware of lookalike distractors that are contraindicated in acute presentations.',
        memoryMnemonic: data?.memoryMnemonic || 'Review the primary diagnostic triad and core pharmacological mechanisms.',
      });
    } catch {
      setAiStrategy({
        studyStrategy: `Master the diagnostic criteria and first-line management guidelines for ${topic.topicName}. Solve 15 related MCQs.`,
        clinicalVignetteClue: 'Identify discriminating symptoms and physical exam signs that separate this from classic differentials.',
        drugOfChoiceOrGoldStandard: 'Ensure you memorize both initial emergency resuscitation and definitive therapy.',
        examTrapWarning: 'Distractors frequently test second-line treatments or lookalikes with subtle differences.',
        memoryMnemonic: 'Focus on the primary clinical triad and key imaging/laboratory indicators.',
      });
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleAddToPlanner = () => {
    const newTask: DailyTask = {
      id: `task-predict-${Date.now()}`,
      title: `[Predicted HY] ${topic.topicName}`,
      subjectId: topic.subjectId,
      topicName: topic.topicName,
      type: 'revision',
      durationMinutes: 45,
      completed: false,
      priority: 'high',
    };
    onAddTask(newTask);
    setAddedToPlanner(true);
    setTimeout(() => setAddedToPlanner(false), 3000);
  };

  const signals = topic.signals || {} as any;
  const signalsList = [
    { key: 'priorityScore', data: signals.priorityScore || { raw: 75, weight: 20, weighted: 15, label: 'Topic Priority Base' }, icon: Flame, color: 'text-amber-600' },
    { key: 'subjectWeight', data: signals.subjectWeight || { raw: 70, weight: 15, weighted: 10.5, label: `Subject Weight (${topic.subjectWeightage || 20}m)` }, icon: TrendingUp, color: 'text-indigo-600' },
    { key: 'highYieldSignal', data: signals.highYieldSignal || { raw: 80, weight: 15, weighted: 12, label: 'Historical / High-Yield Signal' }, icon: Zap, color: 'text-amber-600' },
    { key: 'clinicalVignettePotential', data: signals.clinicalVignettePotential || { raw: 70, weight: 10, weighted: 7, label: 'Clinical Vignette Potential' }, icon: Stethoscope, color: 'text-sky-600' },
    { key: 'imageBasedPotential', data: signals.imageBasedPotential || { raw: 65, weight: 5, weighted: 3.25, label: 'Image-Based Question (IBQ) Potential' }, icon: Eye, color: 'text-blue-600' },
    { key: 'docPotential', data: signals.docPotential || { raw: 75, weight: 10, weighted: 7.5, label: 'Management / Drug-of-Choice (DOC)' }, icon: Pill, color: 'text-purple-600' },
    { key: 'userErrorSignal', data: signals.userErrorSignal || { raw: 25, weight: 10, weighted: 2.5, label: 'User Error / GT Mistake Signal' }, icon: AlertCircle, color: 'text-red-600' },
    { key: 'revisionGap', data: signals.revisionGap || { raw: 30, weight: 10, weighted: 3, label: 'Spaced Revision Gap (R1/R2/R3)' }, icon: RotateCw, color: 'text-orange-600' },
    { key: 'telegramRecurrence', data: signals.telegramRecurrence || { raw: 40, weight: 5, weighted: 2, label: 'MCQ & Telegram Recurrence' }, icon: BookOpen, color: 'text-cyan-600' },
  ];

  const prepStatus = topic.prepStatus || {
    notesDone: false,
    qBankDone: false,
    r1Done: false,
    r2Done: false,
    r3Done: false,
    completionRate: 0,
    lastRevisionText: 'Not started',
  };

  const whyReasons = topic.whyReasons && topic.whyReasons.length > 0 ? topic.whyReasons : ['High-frequency FMGE core syllabus concept'];

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200 font-['Plus_Jakarta_Sans']"
      id="prediction-explanation-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="flex min-h-full items-center justify-center p-3 sm:p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
      <div
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-5 sm:p-6 shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            title="Close explanation"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <span
              className="px-3 py-1 rounded-full text-[11px] font-bold text-white uppercase tracking-wider font-['Outfit'] shadow-xs"
              style={{ backgroundColor: topic.subjectColor || '#4a3b32' }}
            >
              {topic.subjectCode || 'SUB'} · {topic.subjectName || 'Subject'} ({topic.subjectWeightage || 0} marks)
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border font-['Outfit'] ${getLevelBadgeClasses(
                topic.level
              )}`}
            >
              {topic.levelLabel || 'HIGH'} PRIORITY
            </span>
            <span className="text-xs font-medium text-slate-500">
              Confidence: <strong className="text-slate-800">{topic.confidence || 'High'}</strong>
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-4 mt-2">
            <div>
              <span className="text-xs font-mono text-sky-700 font-bold uppercase tracking-wider">
                Rank #{topic.rank || 1} Predicted Topic
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-slate-900 mt-1">
                {topic.topicName}
              </h2>
            </div>
            <div className="text-right shrink-0">
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider font-['Outfit']">
                Prediction Score
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900 font-['Outfit']">{topic.score ?? 80}</span>
                <span className="text-sm font-semibold text-slate-400 font-['Outfit']">/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 flex-1 overflow-y-auto min-h-0 bg-[#F7F9F8]">
          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-slate-700">Multi-Cycle Revision Status:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onToggleTopicState(topic.subjectId, topic.topicId, 'r1Done')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                    prepStatus.r1Done
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Toggle 1st Revision Cycle"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  R1
                </button>
                <button
                  type="button"
                  onClick={() => onToggleTopicState(topic.subjectId, topic.topicId, 'r2Done')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                    prepStatus.r2Done
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Toggle 2nd Revision Cycle"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  R2
                </button>
                <button
                  type="button"
                  onClick={() => onToggleTopicState(topic.subjectId, topic.topicId, 'r3Done')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                    prepStatus.r3Done
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Toggle 3rd Revision Cycle"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  R3
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleAddToPlanner}
                disabled={addedToPlanner}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  addedToPlanner
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                {addedToPlanner ? 'Added to Today!' : 'Plan Revision Today'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAiCoach('vignette', topic.subjectId, topic.topicName);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Stethoscope className="w-3.5 h-3.5 text-sky-400" />
                Solve Vignette
              </button>
            </div>
          </div>

          {/* Section: Why This Topic is Ranked Here */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-['Outfit'] flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500" />
                WHY THIS TOPIC IS RANKED HERE
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Personal Risk: <strong className="text-slate-800">{topic.personalRiskScore ?? 50}/100</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {whyReasons.map((reason, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-white border border-slate-200/80 text-xs text-slate-800 shadow-2xs"
                >
                  <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                  <span className="leading-relaxed font-medium">{reason}</span>
                </div>
              ))}
            </div>

            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-amber-950">Recommended Action:</strong>
                <span>{topic.recommendedAction || 'Revise key concepts and solve 15 clinical MCQs'}</span>
              </div>
            </div>
          </div>

          {/* Section: Transparent Signal Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-['Outfit'] flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-sky-600" />
                TRANSPARENT SIGNAL SCORING BREAKDOWN
              </h3>
              <span className="text-[11px] text-slate-500 font-mono font-medium">Weighted Sum = {topic.score ?? 80}/100</span>
            </div>

            <div className="space-y-2.5">
              {signalsList.map(({ key, data, icon: Icon, color }) => {
                const rawVal = typeof data?.raw === 'number' ? data.raw : 50;
                const weightVal = typeof data?.weight === 'number' ? data.weight : 10;
                const weightedVal = typeof data?.weighted === 'number' ? data.weighted : +(rawVal * (weightVal / 100)).toFixed(1);
                const labelVal = data?.label || key;

                return (
                  <div
                    key={key}
                    className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:bg-slate-50/80 transition-colors shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${color}`} />
                        <span className="font-bold text-slate-800 font-['Outfit'] truncate max-w-[140px] sm:max-w-none">{labelVal}</span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Weight {weightVal}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="text-slate-500 font-medium">Raw: {rawVal}/100</span>
                        <span className="font-bold text-slate-900">+{weightedVal} pts</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(0, rawVal))}%`,
                          backgroundColor:
                            rawVal >= 85
                              ? '#ef4444'
                              : rawVal >= 70
                              ? '#f59e0b'
                              : rawVal >= 50
                              ? '#0ea5e9'
                              : '#64748b',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: High-Yield Memory Pearl */}
          {topic.highYieldPearl && (
            <div className="p-4 bg-sky-50/80 border border-sky-200 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-900 font-['Outfit']">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>HIGH-YIELD RECALL PEARL</span>
              </div>
              <p className="text-xs text-sky-950 font-medium leading-relaxed pl-6">
                {topic.highYieldPearl}
              </p>
            </div>
          )}

          {/* Section: AI Strategy & Memory Hook */}
          <div className="border border-slate-200/80 bg-white p-5 rounded-2xl space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-sky-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide font-['Outfit']">
                  Clinical Strategy &amp; Vignette Traps
                </h4>
              </div>
              {!aiStrategy && (
                <button
                  type="button"
                  onClick={handleFetchAiStrategy}
                  disabled={isLoadingAi}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isLoadingAi ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Synthesizing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-sky-300" />
                      Clinical Strategy
                    </>
                  )}
                </button>
              )}
            </div>

            {aiStrategy && (
              <div className="space-y-2.5 text-xs text-slate-800 pt-1 animate-in fade-in duration-200">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="font-bold text-slate-900 block mb-1 font-['Outfit']">Study Strategy:</span>
                  <p className="text-slate-700 leading-relaxed font-medium">{aiStrategy.studyStrategy}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="font-bold text-sky-900 block mb-0.5 font-['Outfit']">Clinical Clue:</span>
                    <p className="text-slate-600 leading-relaxed">{aiStrategy.clinicalVignetteClue}</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="font-bold text-slate-900 block mb-0.5 font-['Outfit']">Drug of Choice / Gold Standard:</span>
                    <p className="text-slate-600 leading-relaxed">{aiStrategy.drugOfChoiceOrGoldStandard}</p>
                  </div>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-950">
                  <span className="font-bold block mb-0.5 flex items-center gap-1.5 font-['Outfit']">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    Exam Trap to Avoid:
                  </span>
                  <p className="text-rose-900 leading-relaxed">{aiStrategy.examTrapWarning}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500 font-medium">
            Transparent deterministic calculation · Normalized 0–100
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
        </div>
      </div>
      </div>,
    document.body
  );
};
