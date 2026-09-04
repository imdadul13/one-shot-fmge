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
  Layers,
  ChevronRight,
  Zap,
  Info,
  SlidersHorizontal,
  Target,
  Stethoscope
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
  onOpenAiCoach: (tab?: 'vignette' | 'concept' | 'diagnosis' | 'strategy', subjectId?: string, topicName?: string) => void;
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
  const [selectedTier, setSelectedTier] = useState<'all' | 'top' | 'high' | 'risk'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Filtered predictions
  const filteredPredictions = useMemo(() => {
    return predictions.filter((item) => {
      // Subject filter
      if (selectedSubjectId !== 'all' && item.subjectId !== selectedSubjectId) {
        return false;
      }
      // Tier filter
      if (selectedTier === 'top' && item.score < 90) return false;
      if (selectedTier === 'high' && (item.score < 80 || item.score >= 90)) return false;
      if (selectedTier === 'risk' && item.personalRiskScore < 50) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.topicName.toLowerCase().includes(q);
        const matchSub = item.subjectName.toLowerCase().includes(q) || item.subjectCode.toLowerCase().includes(q);
        const matchWhy = item.whyReasons.some((r) => r.toLowerCase().includes(q));
        if (!matchName && !matchSub && !matchWhy) return false;
      }
      return true;
    });
  }, [predictions, selectedSubjectId, selectedTier, searchQuery]);

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
    showToast(`Added ${todaysRevisions.length} predicted topics to Today's Planner!`);
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

  return (
    <div className="space-y-6 pb-20 font-['Plus_Jakarta_Sans'] max-w-6xl mx-auto px-2 sm:px-4 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Mode Switcher Bento */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider font-mono flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-600" />
              Strategic Prioritizer
            </span>
            <span className="text-xs text-slate-400 font-mono">19 Subjects · 0–100 Scale</span>
          </div>
          <h1 className="font-['Outfit'] text-xl sm:text-2xl font-bold text-slate-900">
            FMGE High-Yield Topic Predictor
          </h1>
          <p className="text-xs text-slate-500">
            Statistical ranking based on subject marks, high-frequency question patterns, and your personalized revision gaps.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-1 self-start md:self-center">
          {[
            { id: 'combined', label: 'Combined', icon: Layers, desc: 'Balanced exam & error weighting' },
            { id: 'exam', label: 'Exam Focus', icon: TrendingUp, desc: 'Subject marks & high-yield signals' },
            { id: 'personal', label: 'Personal Focus', icon: AlertTriangle, desc: 'Weak subjects & mistake logs' },
          ].map((item) => {
            const Icon = item.icon;
            const active = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title={item.desc}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Highest Risk Subject */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase font-mono tracking-wider">
            <span>TOP RISK SUBJECT</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <div className="text-base font-extrabold text-slate-900 font-['Outfit'] truncate">
              {metrics.highestRiskSubject?.subjectName || 'General Medicine'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Priority: <strong className="text-slate-800 font-mono">{metrics.highestRiskSubject?.averagePredictionScore || 88}/100</strong> ({metrics.highestRiskSubject?.weightage} marks)
            </div>
          </div>
        </div>

        {/* Immediate Revision Needs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase font-mono tracking-wider">
            <span>OVERDUE REVISIONS</span>
            <RotateCw className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 font-['Outfit']">
              {metrics.immediateRevisions.length}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              High-yield topics with R1 cycle pending
            </div>
          </div>
        </div>

        {/* High-Yield Low-Prep */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase font-mono tracking-wider">
            <span>HIGH-YIELD GAP</span>
            <Zap className="w-4 h-4 text-sky-500" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 font-['Outfit']">
              {metrics.highPredictionLowPrep.length}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Score ≥ 80 with &lt; 50% progress
            </div>
          </div>
        </div>

        {/* High-Yield with Error Logged */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase font-mono tracking-wider">
            <span>ERROR LOGGED</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 font-['Outfit']">
              {metrics.highPredictionWithErrors.length}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Flagged in Grand Tests / Error Notebook
            </div>
          </div>
        </div>
      </div>

      {/* TODAY'S TOP 5 STRATEGIC ACTION REVISIONS */}
      {todaysRevisions.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="font-['Outfit'] text-sm font-bold text-slate-900">
                Today's Recommended Strategic Sprints
              </h3>
            </div>
            <button
              type="button"
              onClick={handleAddAllTodaysToPlanner}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>+ Add All 5 to Planner</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {todaysRevisions.map((item, idx) => (
              <div
                key={item.topicId}
                onClick={() => handleOpenModal(item)}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 transition-all cursor-pointer flex flex-col justify-between space-y-2 group"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold font-mono text-slate-400 mb-1">
                    <span>#{idx + 1} SPRINT</span>
                    <span className="text-amber-600 font-bold">{item.score}/100</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-2">
                    {item.topicName}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">{item.subjectName}</p>
                </div>
                <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{item.subjectWeightage} marks</span>
                  <span className="text-sky-600 font-semibold group-hover:underline">Details &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILTER & TOPIC ROADMAP LIST */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        {/* Search & Filter Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search high-yield topics or keywords..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Subject Dropdown */}
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All 19 Subjects</option>
              {FMGE_SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.weightage} marks)
                </option>
              ))}
            </select>

            {/* Tier Filters */}
            {[
              { id: 'all', label: 'All Ranked' },
              { id: 'top', label: '🔥 Top 90+' },
              { id: 'high', label: '⚡ High 80–89' },
              { id: 'risk', label: '⚠️ High Risk' },
            ].map((tier) => (
              <button
                key={tier.id}
                type="button"
                onClick={() => setSelectedTier(tier.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedTier === tier.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>
        </div>

        {/* Topics List */}
        <div className="space-y-2.5 pt-2">
          {filteredPredictions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-medium">
              No predicted topics match your search criteria.
            </div>
          ) : (
            filteredPredictions.slice(0, 30).map((topic) => (
              <div
                key={topic.topicId}
                onClick={() => handleOpenModal(topic)}
                className="p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/60 hover:border-slate-300 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Left: Rank, Title, Subject & Rationale */}
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-xl bg-slate-200/80 text-slate-700 font-bold font-mono text-xs flex items-center justify-center shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    #{topic.rank}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-['Outfit'] text-sm font-bold text-slate-900 truncate group-hover:text-sky-600 transition-colors">
                        {topic.topicName}
                      </h4>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase bg-slate-200/70 text-slate-700 shrink-0">
                        {topic.subjectName} ({topic.subjectWeightage}m)
                      </span>
                    </div>

                    {/* Quick Rationale Chips */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {topic.whyReasons.slice(0, 2).map((reason, i) => (
                        <span
                          key={i}
                          className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200/60"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Score Progress Bar & Action Buttons */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  {/* Score */}
                  <div className="text-right hidden md:block">
                    <div className="text-xs font-bold font-mono text-slate-900">
                      {topic.score}<span className="text-slate-400 text-[10px]">/100</span>
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">
                      {topic.level === 'VERY_HIGH' ? 'Tier 1' : 'Tier 2'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleAddSingleToPlanner(topic, e)}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white border border-slate-200/60 transition-all cursor-pointer"
                      title="Add to Daily Planner"
                    >
                      <CalendarPlus className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAiCoach('concept', topic.subjectId, topic.topicName);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all cursor-pointer shadow-2xs"
                    >
                      <Stethoscope className="w-3.5 h-3.5 text-sky-400" />
                      <span>Mentor</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Deep Dive Explanation Modal */}
      <PredictionExplanationModal
        topic={selectedTopicForModal}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTopicForModal(null);
        }}
        onToggleTopicState={onToggleTopicState}
        onAddTask={onAddTask}
        onOpenAiCoach={onOpenAiCoach}
      />
    </div>
  );
};
