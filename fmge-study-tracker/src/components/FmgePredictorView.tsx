import React, { useState, useMemo } from 'react';
import {
  Flame,
  TrendingUp,
  AlertTriangle,
  RotateCw,
  Search,
  CheckCircle2,
  CalendarPlus,
  BookOpen,
  Eye,
  Info,
  Sparkles,
  Layers,
  ArrowUpDown,
  Filter,
  Stethoscope,
  Pill,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  AppState,
  PredictedTopicItem,
  PredictionMode,
  PredictionLevel,
  SubjectPhase,
  DailyTask,
} from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import {
  calculateTopicPredictions,
  calculatePredictionDashboardMetrics,
  getTodaysPredictedRevisions,
} from '../utils/predictionEngine';
import { PredictionExplanationModal } from './PredictionExplanationModal';

interface FmgePredictorViewProps {
  state: AppState;
  onToggleTopicState: (subjectId: string, topicId: string, field: 'r1Done' | 'r2Done' | 'r3Done') => void;
  onAddTask: (task: DailyTask) => void;
  onSelectSubject: (subjectId: string) => void;
  onOpenAiCoach: (tab?: 'vignette' | 'concept' | 'diagnosis') => void;
}

export const FmgePredictorView: React.FC<FmgePredictorViewProps> = ({
  state,
  onToggleTopicState,
  onAddTask,
  onSelectSubject,
  onOpenAiCoach,
}) => {
  // Mode selection
  const [mode, setMode] = useState<PredictionMode>('combined');

  // Filters & Search
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedPhase, setSelectedPhase] = useState<SubjectPhase | 'all'>('all');
  const [selectedLevel, setSelectedLevel] = useState<PredictionLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'score' | 'rank' | 'risk' | 'subject'>('score');

  // Modal topic state
  const [selectedTopicForModal, setSelectedTopicForModal] = useState<PredictedTopicItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Success toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Run calculation engine
  const predictions = useMemo(() => {
    return calculateTopicPredictions(state, mode);
  }, [state, mode]);

  // Dashboard metrics
  const metrics = useMemo(() => {
    return calculatePredictionDashboardMetrics(predictions, state);
  }, [predictions, state]);

  // Today's predicted revision
  const todaysRevisions = useMemo(() => {
    return getTodaysPredictedRevisions(predictions, 5);
  }, [predictions]);

  // Filtered & Sorted table items
  const filteredPredictions = useMemo(() => {
    return predictions.filter((item) => {
      // Subject filter
      if (selectedSubjectId !== 'all' && item.subjectId !== selectedSubjectId) {
        return false;
      }
      // Phase filter
      if (selectedPhase !== 'all' && item.phase !== selectedPhase) {
        return false;
      }
      // Level filter
      if (selectedLevel !== 'all' && item.level !== selectedLevel) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.topicName.toLowerCase().includes(q);
        const matchSub = item.subjectName.toLowerCase().includes(q) || item.subjectCode.toLowerCase().includes(q);
        const matchWhy = item.whyReasons.some((r) => r.toLowerCase().includes(q));
        if (!matchName && !matchSub && !matchWhy) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'risk') return b.personalRiskScore - a.personalRiskScore;
      if (sortBy === 'rank') return a.rank - b.rank;
      if (sortBy === 'subject') return a.subjectName.localeCompare(b.subjectName);
      return 0;
    });
  }, [predictions, selectedSubjectId, selectedPhase, selectedLevel, searchQuery, sortBy]);

  const handleOpenModal = (topic: PredictedTopicItem) => {
    setSelectedTopicForModal(topic);
    setIsModalOpen(true);
  };

  const handleAddAllTodaysToPlanner = () => {
    todaysRevisions.forEach((topic) => {
      const newTask: DailyTask = {
        id: `task-predict-${topic.topicId}-${Date.now()}`,
        title: `[Predicted HY] ${topic.topicName}`,
        subjectId: topic.subjectId,
        topicName: topic.topicName,
        type: 'revision',
        durationMinutes: 45,
        completed: false,
        priority: 'high',
      };
      onAddTask(newTask);
    });
    showToast(`Added ${todaysRevisions.length} predicted high-yield topics to Today's Planner!`);
  };

  const handleAddSingleToPlanner = (topic: PredictedTopicItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTask: DailyTask = {
      id: `task-predict-${topic.topicId}-${Date.now()}`,
      title: `[Predicted HY] ${topic.topicName}`,
      subjectId: topic.subjectId,
      topicName: topic.topicName,
      type: 'revision',
      durationMinutes: 45,
      completed: false,
      priority: 'high',
    };
    onAddTask(newTask);
    showToast(`Planned revision for "${topic.topicName}"`);
  };

  const getLevelBadgeClasses = (level: PredictionLevel) => {
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

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200" id="fmge-predictor-view">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Disclaimer */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500/20 text-red-300 border border-red-500/30 uppercase tracking-widest flex items-center gap-1">
                  <Flame className="w-3 h-3 text-red-400" />
                  FMGE Predictive Prioritization Engine
                </span>
                <span className="text-xs text-slate-400 font-mono">19 Subjects · Normalized 0–100</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                FMGE Prediction & Priority Engine
              </h1>
            </div>

            {/* Mode Switcher */}
            <div className="bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMode('combined')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mode === 'combined'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Balanced weighting of exam patterns and personal errors"
              >
                <Layers className="w-3.5 h-3.5" />
                Combined Mode
              </button>
              <button
                type="button"
                onClick={() => setMode('exam')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mode === 'exam'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Emphasis on subject marks weightage and high-yield clinical signals"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Exam Focus
              </button>
              <button
                type="button"
                onClick={() => setMode('personal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mode === 'personal'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Emphasis on your logged Grand Test errors, weak subjects, and revision gaps"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Personal Focus
              </button>
            </div>
          </div>

          {/* Mandatory Strict Disclaimer */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-slate-200">Statistical Exam Prioritization:</strong> This engine evaluates topic priority using 9 deterministic signals: subject mark weightage (e.g. Medicine 33, Surgery 32, PSM 30, OBG 30), high-yield historical frequency, clinical vignette potential, image-based question (IBQ) relevance, emergency Drug-of-Choice (DOC) focus, and your personal revision/error records.
              <span className="block text-slate-400 mt-0.5 text-[11px]">
                It identifies which topics are statistically and strategically highest yield to prioritize. It does not claim to predict exact NBEMS examination questions.
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Top Risk Subject */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>HIGHEST-RISK SUBJECT</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 truncate">
              {metrics.highestRiskSubject?.subjectName || 'General Medicine'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Avg Prediction: <strong className="text-slate-800 font-mono">{metrics.highestRiskSubject?.averagePredictionScore || 88}/100</strong> ({metrics.highestRiskSubject?.weightage} marks)
            </div>
          </div>
        </div>

        {/* Metric 2: Overdue R1 Cycles */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>IMMEDIATE REVISION NEEDS</span>
            <RotateCw className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">
              {metrics.immediateRevisions.length}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              High-yield topics with R1 pending
            </div>
          </div>
        </div>

        {/* Metric 3: High-Prediction Low Prep */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>HIGH-YIELD + LOW PREP</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">
              {metrics.highPredictionLowPrep.length}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Score ≥ 80 with &lt; 50% prep done
            </div>
          </div>
        </div>

        {/* Metric 4: High-Yield with Past Errors */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>HIGH-YIELD + ERROR LOGGED</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">
              {metrics.highPredictionWithErrors.length}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Flagged in GT or Error Notebook
            </div>
          </div>
        </div>
      </div>

      {/* TOP 10 FMGE TOPICS TO PRIORITIZE SHOWCASE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-bold text-slate-900">
                TOP FMGE TOPICS TO PRIORITIZE
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Highest scoring high-yield topics ranked across all 19 subjects based on current {mode} mode weights
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedLevel('VERY_HIGH');
              setSortBy('score');
            }}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            View all Very High priority topics ({predictions.filter((p) => p.level === 'VERY_HIGH').length})
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {metrics.top10.slice(0, 6).map((topic) => (
            <div
              key={topic.topicId}
              onClick={() => handleOpenModal(topic)}
              className="group p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all bg-white flex flex-col justify-between cursor-pointer relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 bottom-0 w-1.5"
                style={{ backgroundColor: topic.subjectColor }}
              />

              <div className="pl-1.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase"
                    style={{ backgroundColor: topic.subjectColor }}
                  >
                    #{topic.rank} · {topic.subjectCode}
                  </span>
                  <div className="flex items-center gap-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getLevelBadgeClasses(
                        topic.level
                      )}`}
                    >
                      {topic.levelLabel}
                    </span>
                    <span className="text-xs font-mono font-extrabold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                      {topic.score}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {topic.topicName}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                    {topic.whyReasons[0] || `${topic.subjectName} High-Yield Concept`}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {topic.prepStatus.r1Done ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" /> R1 Done
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                      <RotateCw className="w-3 h-3" /> R1 Pending
                    </span>
                  )}
                  {topic.gtErrorCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded">
                      <AlertTriangle className="w-3 h-3" /> GT Mistake
                    </span>
                  )}
                </div>
              </div>

              <div className="pl-1.5 pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => handleAddSingleToPlanner(topic, e)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  Plan Today
                </button>
                <span className="text-[11px] font-semibold text-slate-400 group-hover:text-indigo-600 flex items-center gap-0.5 transition-colors">
                  Details & Breakdown
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two-Column Section: Today's Predicted Revision & High-Yield + Weakness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1: Today's Predicted Revision */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarPlus className="w-4 h-4 text-indigo-600" />
                TODAY'S PREDICTED REVISION
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Top 5 topics recommended for today's high-yield spaced study block
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddAllTodaysToPlanner}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              Add All to Planner
            </button>
          </div>

          <div className="space-y-2.5">
            {todaysRevisions.map((topic, idx) => (
              <div
                key={topic.topicId}
                onClick={() => handleOpenModal(topic)}
                className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50/60 hover:bg-white transition-all flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-extrabold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.2 rounded text-white shrink-0"
                        style={{ backgroundColor: topic.subjectColor }}
                      >
                        {topic.subjectCode}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {topic.topicName}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      Score: <strong className="text-slate-700 font-mono">{topic.score}/100</strong> · {topic.whyReasons[0]}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTopicState(topic.subjectId, topic.topicId, 'r1Done');
                    }}
                    className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 ${
                      topic.prepStatus.r1Done
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {topic.prepStatus.r1Done ? 'R1 Done' : 'Mark R1'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleAddSingleToPlanner(topic, e)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Add to daily planner"
                  >
                    <CalendarPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: High-Yield + Your Weakness */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                HIGH-YIELD + YOUR WEAKNESS
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Highest vulnerability areas: heavy exam weight combined with personal mistakes
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
              {metrics.highYieldWeaknesses.length} flagged
            </span>
          </div>

          <div className="space-y-2.5">
            {metrics.highYieldWeaknesses.slice(0, 5).map((topic) => (
              <div
                key={topic.topicId}
                onClick={() => handleOpenModal(topic)}
                className="p-3 rounded-xl border border-rose-100 bg-rose-50/30 hover:bg-rose-50/60 hover:border-rose-300 transition-all flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.2 rounded text-white shrink-0"
                      style={{ backgroundColor: topic.subjectColor }}
                    >
                      {topic.subjectCode}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {topic.topicName}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span>Personal Risk: <strong className="text-rose-700 font-mono">{topic.personalRiskScore}/100</strong></span>
                    <span>·</span>
                    <span className="truncate">{topic.whyReasons[0]}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenModal(topic);
                    }}
                    className="px-2.5 py-1 bg-white border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors"
                  >
                    Fix Gap
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full Prediction Master Table & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              COMPLETE FMGE TOPIC PREDICTION RANKINGS
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredPredictions.length} of {predictions.length} syllabus topics
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Sort by:</span>
            <div className="bg-slate-100 p-0.5 rounded-lg flex items-center">
              <button
                type="button"
                onClick={() => setSortBy('score')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  sortBy === 'score' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                }`}
              >
                Score
              </button>
              <button
                type="button"
                onClick={() => setSortBy('risk')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  sortBy === 'risk' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                }`}
              >
                Personal Risk
              </button>
              <button
                type="button"
                onClick={() => setSortBy('rank')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  sortBy === 'rank' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                }`}
              >
                Rank
              </button>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search topic or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Subject Filter Dropdown */}
          <div>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All 19 Subjects</option>
              {FMGE_SUBJECTS.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.weightage} marks)
                </option>
              ))}
            </select>
          </div>

          {/* Phase Filter */}
          <div>
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Phases</option>
              <option value="pre-clinical">Pre-Clinical (Anat, Phys, Bio)</option>
              <option value="para-clinical">Para-Clinical (Path, Pharm, Micro, FMT, PSM)</option>
              <option value="clinical">Clinical (Med, Surg, OBG, Peds, etc.)</option>
            </select>
          </div>

          {/* Prediction Level Filter */}
          <div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Priority Levels</option>
              <option value="VERY_HIGH">VERY HIGH (90-100)</option>
              <option value="HIGH">HIGH (80-89)</option>
              <option value="MODERATE">MODERATE (70-79)</option>
              <option value="LOW">LOW (60-69)</option>
              <option value="MAINTAIN">MAINTAIN (&lt;60)</option>
            </select>
          </div>
        </div>

        {/* Interactive Subject Quick Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setSelectedSubjectId('all')}
            className={`px-3 py-1 rounded-full font-bold transition-all shrink-0 ${
              selectedSubjectId === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All 19 Subjects
          </button>
          {FMGE_SUBJECTS.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => setSelectedSubjectId(sub.id)}
              className={`px-2.5 py-1 rounded-full font-bold transition-all shrink-0 flex items-center gap-1 ${
                selectedSubjectId === sub.id
                  ? 'text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              style={{
                backgroundColor: selectedSubjectId === sub.id ? sub.color : undefined,
              }}
            >
              <span>{sub.code}</span>
              <span className="text-[10px] opacity-80">({sub.weightage}m)</span>
            </button>
          ))}
        </div>

        {/* Prediction Rankings Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3 w-12 text-center">Rank</th>
                <th className="py-3 px-3">Subject</th>
                <th className="py-3 px-3">Topic</th>
                <th className="py-3 px-3 w-32">Prediction Score</th>
                <th className="py-3 px-3">Priority Level</th>
                <th className="py-3 px-3">Why Ranked Highly</th>
                <th className="py-3 px-3 text-center">Multi-Cycle Revision</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPredictions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    No topics matched your search or filters.
                  </td>
                </tr>
              ) : (
                filteredPredictions.map((topic) => (
                  <tr
                    key={topic.topicId}
                    onClick={() => handleOpenModal(topic)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Rank */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-500">
                      #{topic.rank}
                    </td>

                    {/* Subject */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase inline-block"
                        style={{ backgroundColor: topic.subjectColor }}
                      >
                        {topic.subjectCode} · {topic.subjectWeightage}m
                      </span>
                    </td>

                    {/* Topic Name */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {topic.topicName}
                      </div>
                      {topic.isHighYield && (
                        <span className="text-[10px] font-semibold text-rose-600">
                          ★ High Yield Core
                        </span>
                      )}
                    </td>

                    {/* Prediction Score Gauge */}
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        <div className="flex items-baseline justify-between font-mono text-xs">
                          <span className="font-extrabold text-slate-900">{topic.score}</span>
                          <span className="text-[10px] text-slate-400">/100</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${topic.score}%`,
                              backgroundColor:
                                topic.score >= 90
                                  ? '#ef4444'
                                  : topic.score >= 80
                                  ? '#f59e0b'
                                  : topic.score >= 70
                                  ? '#0d9488'
                                  : '#64748b',
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Level */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getLevelBadgeClasses(
                          topic.level
                        )}`}
                      >
                        {topic.levelLabel}
                      </span>
                    </td>

                    {/* Why Ranked */}
                    <td className="py-3 px-3 max-w-xs">
                      <div className="text-[11px] text-slate-600 truncate font-medium">
                        {topic.whyReasons[0] || 'High Exam Yield'}
                      </div>
                      {topic.whyReasons[1] && (
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {topic.whyReasons[1]}
                        </div>
                      )}
                    </td>

                    {/* Multi-Cycle Revision Indicators */}
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleTopicState(topic.subjectId, topic.topicId, 'r1Done');
                          }}
                          className={`w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center transition-all ${
                            topic.prepStatus.r1Done
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                          title="Toggle R1"
                        >
                          R1
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleTopicState(topic.subjectId, topic.topicId, 'r2Done');
                          }}
                          className={`w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center transition-all ${
                            topic.prepStatus.r2Done
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                          title="Toggle R2"
                        >
                          R2
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleTopicState(topic.subjectId, topic.topicId, 'r3Done');
                          }}
                          className={`w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center transition-all ${
                            topic.prepStatus.r3Done
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                          title="Toggle R3"
                        >
                          R3
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleAddSingleToPlanner(topic, e)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Add to daily planner"
                        >
                          <CalendarPlus className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(topic);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg text-[11px] font-bold transition-colors"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explanation & Breakdown Modal */}
      <PredictionExplanationModal
        topic={selectedTopicForModal}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onToggleTopicState={onToggleTopicState}
        onAddTask={onAddTask}
        onOpenAiCoach={onOpenAiCoach}
      />
    </div>
  );
};
