import React, { useState } from 'react';
import {
  X,
  Sparkles,
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
  CalendarPlus
} from 'lucide-react';
import { PredictedTopicItem, DailyTask } from '../types';

interface PredictionExplanationModalProps {
  topic: PredictedTopicItem | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleTopicState: (subjectId: string, topicId: string, field: 'r1Done' | 'r2Done' | 'r3Done') => void;
  onAddTask: (task: DailyTask) => void;
  onOpenAiCoach: (tab?: 'vignette' | 'concept' | 'diagnosis') => void;
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

  const getLevelBadgeClasses = (level: string) => {
    switch (level) {
      case 'VERY_HIGH':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MODERATE':
        return 'bg-teal-50 text-teal-700 border-teal-200';
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
          predictionLevel: topic.levelLabel,
          whyReasons: topic.whyReasons,
          userErrorCount: topic.gtErrorCount + topic.notebookErrorCount,
          revisionGap: topic.prepStatus.lastRevisionText,
        }),
      });
      const data = await res.json();
      setAiStrategy({
        studyStrategy: data.studyStrategy || 'Focus on high-yield clinical presentation, diagnostic algorithms, and first-line treatment guidelines.',
        clinicalVignetteClue: data.clinicalVignetteClue || 'Look for patient age, onset duration, and hallmark vital signs in the clinical vignette stem.',
        drugOfChoiceOrGoldStandard: data.drugOfChoiceOrGoldStandard || 'Review the gold-standard diagnostic modality and first-line pharmacological agent.',
        examTrapWarning: data.examTrapWarning || 'Beware of lookalike distractors that are contraindicated in acute presentations.',
        memoryMnemonic: data.memoryMnemonic || 'Review the primary diagnostic triad and core pharmacological mechanisms.',
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

  const signalsList = [
    { key: 'priorityScore', data: topic.signals.priorityScore, icon: Flame, color: 'text-amber-600' },
    { key: 'subjectWeight', data: topic.signals.subjectWeight, icon: TrendingUp, color: 'text-indigo-600' },
    { key: 'highYieldSignal', data: topic.signals.highYieldSignal, icon: Sparkles, color: 'text-rose-600' },
    { key: 'clinicalVignettePotential', data: topic.signals.clinicalVignettePotential, icon: Stethoscope, color: 'text-teal-600' },
    { key: 'imageBasedPotential', data: topic.signals.imageBasedPotential, icon: Eye, color: 'text-blue-600' },
    { key: 'docPotential', data: topic.signals.docPotential, icon: Pill, color: 'text-purple-600' },
    { key: 'userErrorSignal', data: topic.signals.userErrorSignal, icon: AlertCircle, color: 'text-red-600' },
    { key: 'revisionGap', data: topic.signals.revisionGap, icon: RotateCw, color: 'text-orange-600' },
    { key: 'telegramRecurrence', data: topic.signals.telegramRecurrence, icon: BookOpen, color: 'text-cyan-600' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      id="prediction-explanation-modal"
    >
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 my-8 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close explanation"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className="px-2.5 py-1 rounded-md text-[11px] font-bold text-white uppercase tracking-wider"
              style={{ backgroundColor: topic.subjectColor }}
            >
              {topic.subjectCode} · {topic.subjectName} ({topic.subjectWeightage} marks)
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getLevelBadgeClasses(
                topic.level
              )}`}
            >
              {topic.levelLabel} PRIORITY
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Confidence: <strong className="text-slate-200">{topic.confidence}</strong>
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-4 mt-2">
            <div>
              <span className="text-xs font-mono text-indigo-300 font-bold uppercase tracking-wider">
                Rank #{topic.rank} Predicted Topic
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
                {topic.topicName}
              </h2>
            </div>
            <div className="text-right shrink-0">
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Prediction Score
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white font-mono">{topic.score}</span>
                <span className="text-sm font-semibold text-slate-400">/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Multi-Cycle Revision Status:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onToggleTopicState(topic.subjectId, topic.topicId, 'r1Done')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                    topic.prepStatus.r1Done
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Toggle 1st Revision Cycle"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  R1
                </button>
                <button
                  type="button"
                  onClick={() => onToggleTopicState(topic.subjectId, topic.topicId, 'r2Done')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                    topic.prepStatus.r2Done
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Toggle 2nd Revision Cycle"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  R2
                </button>
                <button
                  type="button"
                  onClick={() => onToggleTopicState(topic.subjectId, topic.topicId, 'r3Done')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                    topic.prepStatus.r3Done
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Toggle 3rd Revision Cycle"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  R3
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddToPlanner}
                disabled={addedToPlanner}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  addedToPlanner
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                {addedToPlanner ? 'Added to Today!' : 'Plan Revision Today'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAiCoach('vignette');
                }}
                className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Solve Vignette
              </button>
            </div>
          </div>

          {/* Section: Why This Topic is Ranked Here */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                WHY THIS TOPIC IS RANKED HERE
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Personal Risk: <strong className="text-slate-800">{topic.personalRiskScore}/100</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {topic.whyReasons.map((reason, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                >
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <span className="leading-relaxed font-medium">{reason}</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-amber-950">Recommended Action:</strong>
                <span>{topic.recommendedAction}</span>
              </div>
            </div>
          </div>

          {/* Section: Transparent Signal Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                TRANSPARENT SIGNAL SCORING BREAKDOWN
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Weighted Sum = {topic.score}/100</span>
            </div>

            <div className="space-y-2.5">
              {signalsList.map(({ key, data, icon: Icon, color }) => (
                <div
                  key={key}
                  className="p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className="font-bold text-slate-800">{data.label}</span>
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        Weight {data.weight}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-slate-500">Raw: {data.raw}/100</span>
                      <span className="font-bold text-slate-900">+{data.weighted} pts</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, data.raw)}%`,
                        backgroundColor:
                          data.raw >= 85
                            ? '#ef4444'
                            : data.raw >= 70
                            ? '#f59e0b'
                            : data.raw >= 50
                            ? '#0d9488'
                            : '#64748b',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: High-Yield Memory Pearl */}
          {topic.highYieldPearl && (
            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-900">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>HIGH-YIELD RECALL PEARL</span>
              </div>
              <p className="text-xs text-teal-950 font-medium leading-relaxed pl-6">
                {topic.highYieldPearl}
              </p>
            </div>
          )}

          {/* Section: AI Strategy & Memory Hook */}
          <div className="border border-indigo-100 bg-gradient-to-br from-indigo-50/60 via-white to-slate-50 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                  AI Strategy & Vignette Traps
                </h4>
              </div>
              {!aiStrategy && (
                <button
                  type="button"
                  onClick={handleFetchAiStrategy}
                  disabled={isLoadingAi}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isLoadingAi ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      Get AI Strategy
                    </>
                  )}
                </button>
              )}
            </div>

            {aiStrategy && (
              <div className="space-y-2.5 text-xs text-slate-800 pt-1 animate-in fade-in duration-200">
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="font-bold text-indigo-900 block mb-1">Study Strategy:</span>
                  <p className="text-slate-700 leading-relaxed">{aiStrategy.studyStrategy}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                    <span className="font-bold text-teal-900 block mb-0.5">Clinical Clue:</span>
                    <p className="text-slate-600">{aiStrategy.clinicalVignetteClue}</p>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                    <span className="font-bold text-purple-900 block mb-0.5">Drug of Choice / Gold Standard:</span>
                    <p className="text-slate-600">{aiStrategy.drugOfChoiceOrGoldStandard}</p>
                  </div>
                </div>
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-950">
                  <span className="font-bold block mb-0.5 flex items-center gap-1.5">
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
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Transparent deterministic calculation · Normalized 0–100
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
