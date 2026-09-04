import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Check,
  Zap,
  Plus,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Sparkles,
  FileText,
  Layers,
  Activity,
  ArrowLeft,
  Search,
} from 'lucide-react';
import {
  FMGESubject,
  TopicItem,
  ConfidenceLevel,
  SubjectProgress,
  AppState,
  PracticeSessionContext,
} from '../types';
import { TopicMasteryWorkspace } from './TopicMasteryWorkspace';

interface SubjectDetailModalProps {
  subject: FMGESubject | null;
  isOpen: boolean;
  onClose: () => void;
  progress: SubjectProgress | undefined;
  topicsState: Record<string, Partial<TopicItem>>;
  state: AppState;
  onToggleTopicState: (
    subjectId: string,
    topicId: string,
    field: 'notesDone' | 'qBankDone' | 'r1Done' | 'r2Done' | 'r3Done'
  ) => void;
  onUpdateConfidence: (subjectId: string, confidence: ConfidenceLevel) => void;
  onAddCustomTopic: (subjectId: string, topicName: string, isHighYield: boolean) => void;
  onUpdateSubjectDetails: (subjectId: string, updates: Partial<SubjectProgress>) => void;
  onLaunchPracticeMcq?: (context: PracticeSessionContext) => void;
  onOpenAiCoach?: (
    initialTab?: 'vignette' | 'concept' | 'diagnosis' | 'strategy',
    subjectId?: string,
    topicName?: string
  ) => void;
}

export const SubjectDetailModal: React.FC<SubjectDetailModalProps> = ({
  subject,
  isOpen,
  onClose,
  progress,
  topicsState,
  state,
  onToggleTopicState,
  onUpdateConfidence,
  onAddCustomTopic,
  onLaunchPracticeMcq,
  onOpenAiCoach,
}) => {
  const [newTopicName, setNewTopicName] = useState('');
  const [isHighYieldTopic, setIsHighYieldTopic] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'high-yield' | 'incomplete' | 'notes' | 'qbank'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Topic for 6-Step Mastery Workspace
  const [activeTopicForMastery, setActiveTopicForMastery] = useState<{
    subjectId: string;
    topicId: string;
    topicName: string;
    autoDeepen?: boolean;
  } | null>(null);

  if (!isOpen || !subject) return null;

  const allTopics = [...subject.topics, ...(progress?.customTopics || [])];
  const notesCount = allTopics.filter(
    (t) => topicsState[`${subject.id}-${t.id}`]?.notesDone ?? t.notesDone
  ).length;
  const qBankCount = allTopics.filter(
    (t) => topicsState[`${subject.id}-${t.id}`]?.qBankDone ?? t.qBankDone
  ).length;
  const highYieldTopics = allTopics.filter((t) => t.isHighYield);
  const completionPct = Math.round((notesCount / Math.max(1, allTopics.length)) * 100);

  // Recommended next uncompleted topic
  const recommendedTopic =
    allTopics.find((t) => !(topicsState[`${subject.id}-${t.id}`]?.notesDone ?? t.notesDone)) ||
    allTopics[0];

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    onAddCustomTopic(subject.id, newTopicName.trim(), isHighYieldTopic);
    setNewTopicName('');
    setIsHighYieldTopic(false);
  };

  // Filter topics
  const displayedTopics = allTopics.filter((t) => {
    const key = `${subject.id}-${t.id}`;
    const isNotes = topicsState[key]?.notesDone ?? t.notesDone;
    const isQBank = topicsState[key]?.qBankDone ?? t.qBankDone;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!t.name.toLowerCase().includes(q)) return false;
    }

    if (filterTab === 'high-yield') {
      return t.isHighYield;
    }
    if (filterTab === 'incomplete') {
      return !isNotes;
    }
    if (filterTab === 'notes') {
      return isNotes;
    }
    if (filterTab === 'qbank') {
      return isQBank;
    }
    return true;
  });

  const currentConfidence: ConfidenceLevel = progress?.confidence || 'not-started';

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs overflow-y-auto font-sans text-stone-900 animate-in fade-in duration-200">
        <div className="flex min-h-full items-center justify-center p-2 sm:p-4 md:p-6">
          <div className="bg-stone-50/95 rounded-3xl max-w-4xl w-full my-auto max-h-[92vh] flex flex-col shadow-2xl border border-stone-200/90 overflow-hidden">
            {/* ================= 1. WORKSPACE HEADER & NAVIGATION HIERARCHY ================= */}
            <div className="p-5 sm:p-6 border-b border-stone-200/80 bg-white space-y-4">
              {/* Navigation Location Bar: Study → Subject */}
              <div className="flex items-center justify-between gap-3">
                <nav className="flex items-center gap-1.5 text-xs font-mono flex-wrap">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>STUDY</span>
                  </button>
                  <span className="text-stone-300">/</span>
                  <span className="font-semibold text-stone-900 uppercase">{subject.name}</span>
                  <span className="text-stone-300">·</span>
                  <span className="text-stone-500">{subject.weightage} MARKS</span>
                  <span className="text-stone-300">·</span>
                  <span className="text-stone-500">NBE BLUEPRINT</span>
                </nav>

                <button
                  onClick={onClose}
                  type="button"
                  className="p-1.5 text-stone-400 hover:text-stone-900 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Subject Title & Clinical Scope */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-stone-900">
                      {subject.name}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#006B63] text-white text-[10px] font-mono font-medium shadow-2xs">
                      {completionPct}% COMPLETE
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
                    {subject.highYieldTips || subject.description}
                  </p>
                </div>

                {/* Direct Action for Recommended Topic */}
                {recommendedTopic && (
                  <button
                    type="button"
                    onClick={() =>
                      setActiveTopicForMastery({
                        subjectId: subject.id,
                        topicId: recommendedTopic.id,
                        topicName: recommendedTopic.name,
                        autoDeepen: true,
                      })
                    }
                    className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-900 border border-stone-200 hover:border-indigo-200/90 text-xs font-semibold font-display transition-all cursor-pointer shadow-2xs active:scale-[0.98] shrink-0 group"
                    title="Comprehensive Gemini-powered study pack"
                  >
                    <div className="w-5 h-5 rounded-md bg-indigo-50/80 text-indigo-700 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                      <Sparkles className="h-3 w-3" />
                    </div>
                    <div className="text-left">
                      <div className="text-[9px] font-mono font-semibold uppercase tracking-wider text-indigo-700 leading-none">
                        Deep Study
                      </div>
                      <div className="text-xs font-bold font-display text-stone-900">
                        Deepen High-Yield
                      </div>
                    </div>
                  </button>
                )}
              </div>

              {/* Subject Progress & Mastery Bar */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
                {/* Progress track */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-700 font-display">
                      Syllabus Mastery Progress
                    </span>
                    <span className="font-mono font-bold text-stone-900">
                      {notesCount} of {allTopics.length} topics covered ({completionPct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
                    <div
                      className="h-full bg-[#006B63] rounded-full transition-all duration-300"
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                </div>

                {/* Sub-Metrics & Confidence Level Selector */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-stone-200/60 text-xs text-stone-600">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-stone-500" />
                      <span>Notes: <strong>{notesCount}/{allTopics.length}</strong></span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-stone-500" />
                      <span>QBank: <strong>{qBankCount}/{allTopics.length}</strong></span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-amber-500 fill-current" />
                      <span>High-Yield: <strong>{highYieldTopics.length}</strong></span>
                    </span>
                  </div>

                  {/* Confidence Rating Selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono uppercase text-stone-400">Confidence:</span>
                    {[
                      { id: 'low' as ConfidenceLevel, label: 'Low', activeClass: 'bg-rose-100 text-rose-800 border-rose-300' },
                      { id: 'moderate' as ConfidenceLevel, label: 'Moderate', activeClass: 'bg-amber-100 text-amber-800 border-amber-300' },
                      { id: 'strong' as ConfidenceLevel, label: 'Strong', activeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
                      { id: 'mastered' as ConfidenceLevel, label: 'Mastered', activeClass: 'bg-[#006B63] text-white border-[#006B63]' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onUpdateConfidence(subject.id, opt.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase transition-all cursor-pointer ${
                          currentConfidence === opt.id
                            ? `${opt.activeClass} shadow-2xs`
                            : 'bg-white text-stone-500 hover:text-stone-800 border border-stone-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ================= 2. WORKSPACE CONTENT BODY ================= */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-6">
              {/* ================= RECOMMENDED NEXT TOPIC TARGET ================= */}
              {recommendedTopic && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 font-mono">
                    RECOMMENDED STUDY TARGET
                  </span>
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-teal-200/90 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div
                      className="space-y-1.5 min-w-0 flex-1 cursor-pointer"
                      onClick={() =>
                        setActiveTopicForMastery({
                          subjectId: subject.id,
                          topicId: recommendedTopic.id,
                          topicName: recommendedTopic.name,
                        })
                      }
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-semibold uppercase text-[#006B63] bg-teal-50 border border-teal-200/70 px-2 py-0.5 rounded-md">
                          NEXT UP
                        </span>
                        {recommendedTopic.isHighYield && (
                          <span className="text-[10px] font-mono font-semibold uppercase text-amber-900 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md">
                            HIGH YIELD
                          </span>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-bold font-display text-stone-900 hover:text-[#006B63] transition-colors">
                        {recommendedTopic.name}
                      </h3>
                      <p className="text-xs text-stone-500">
                        Primary NBE question source · Board-tested rapid revision blueprint & clinical vignettes
                      </p>
                    </div>

                    {/* Study Action Controls for Recommended Topic */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 pt-1 lg:pt-0">
                      {/* Primary Rapid Revision */}
                      <button
                        type="button"
                        onClick={() =>
                          setActiveTopicForMastery({
                            subjectId: subject.id,
                            topicId: recommendedTopic.id,
                            topicName: recommendedTopic.name,
                          })
                        }
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold font-display shadow-2xs cursor-pointer active:scale-[0.98] transition-all min-h-[38px]"
                        title="Rapid Revision (Fast · Board-tested)"
                      >
                        <Zap className="h-3.5 w-3.5 text-amber-400 fill-current shrink-0" />
                        <span>Rapid Revision</span>
                        <span className="text-[10px] font-mono text-stone-400 pl-1 border-l border-stone-700 hidden sm:inline">FAST</span>
                      </button>

                      {/* Deepen High-Yield (Comprehensive Gemini clinical pack) */}
                      <button
                        type="button"
                        onClick={() =>
                          setActiveTopicForMastery({
                            subjectId: subject.id,
                            topicId: recommendedTopic.id,
                            topicName: recommendedTopic.name,
                            autoDeepen: true,
                          })
                        }
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-indigo-50/50 text-stone-900 border border-indigo-200/90 text-xs font-semibold font-display shadow-2xs cursor-pointer active:scale-[0.98] transition-all min-h-[38px] group"
                        title="Comprehensive Gemini-powered study pack"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-indigo-600 shrink-0 group-hover:scale-110 transition-transform" />
                        <span>Deepen High-Yield</span>
                        <span className="text-[10px] font-mono font-semibold text-indigo-700 pl-1 border-l border-indigo-100 hidden sm:inline">DEEP</span>
                      </button>

                      {/* 10-MCQs Drill */}
                      {onLaunchPracticeMcq && (
                        <button
                          type="button"
                          onClick={() =>
                            onLaunchPracticeMcq({
                              sessionId: `session-${Date.now()}`,
                              subjectId: subject.id,
                              subjectName: subject.name,
                              topicId: recommendedTopic.id,
                              topicName: recommendedTopic.name,
                              source: 'dashboard_weak_topic',
                              targetQuestionCount: 10,
                            })
                          }
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 text-xs font-semibold font-display cursor-pointer active:scale-[0.98] transition-all min-h-[38px]"
                        >
                          <Activity className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                          <span>10-MCQs</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ================= 3. SYLLABUS MODULES & TOPICS LIST ================= */}
              <div className="space-y-3">
                {/* Search & Filter Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-stone-200/70">
                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                    {[
                      { id: 'all', label: `All (${allTopics.length})` },
                      { id: 'high-yield', label: `High-Yield (${highYieldTopics.length})` },
                      { id: 'incomplete', label: `Incomplete (${allTopics.length - notesCount})` },
                      { id: 'notes', label: `Notes (${notesCount})` },
                      { id: 'qbank', label: `QBank (${qBankCount})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setFilterTab(tab.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-display whitespace-nowrap transition-all cursor-pointer ${
                          filterTab === tab.id
                            ? 'bg-stone-900 text-white shadow-2xs'
                            : 'bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-100'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Search Input */}
                  <div className="relative w-full sm:w-48 shrink-0">
                    <Search className="h-3.5 w-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Filter topics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-stone-200 bg-white pl-8 pr-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#006B63]"
                    />
                  </div>
                </div>

                {/* Topic Cards List */}
                <div className="space-y-2.5">
                  {displayedTopics.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-white border border-stone-200/80 text-xs text-stone-500">
                      No topics matched the selected filter.
                    </div>
                  ) : (
                    displayedTopics.map((topic, index) => {
                      const stateKey = `${subject.id}-${topic.id}`;
                      const tState = topicsState[stateKey] || {};
                      const isNotes = tState.notesDone ?? topic.notesDone;
                      const isQBank = tState.qBankDone ?? topic.qBankDone;
                      const isR1 = tState.r1Done ?? topic.r1Done;
                      const isR2 = tState.r2Done ?? topic.r2Done;
                      const isR3 = tState.r3Done ?? topic.r3Done;
                      const isFullyCovered = isNotes && isQBank;
                      const isNextRecommended = topic.id === recommendedTopic?.id;

                      return (
                        <div
                          key={topic.id}
                          className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3.5 ${
                            isNextRecommended
                              ? 'bg-teal-50/20 border-teal-300/80 shadow-2xs'
                              : isFullyCovered
                              ? 'bg-white/80 border-stone-200/60'
                              : 'bg-white border-stone-200/80 hover:border-stone-300 hover:shadow-2xs'
                          }`}
                        >
                          {/* Topic Details Left Column */}
                          <div
                            className="min-w-0 space-y-1.5 cursor-pointer flex-1"
                            onClick={() =>
                              setActiveTopicForMastery({
                                subjectId: subject.id,
                                topicId: topic.id,
                                topicName: topic.name,
                              })
                            }
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="w-5 h-5 rounded-md bg-stone-100 text-stone-600 text-xs font-mono font-semibold flex items-center justify-center shrink-0">
                                {index + 1}
                              </span>
                              <span
                                className={`text-sm font-bold font-display transition-colors ${
                                  isFullyCovered ? 'text-stone-700' : 'text-stone-900 hover:text-[#006B63]'
                                }`}
                              >
                                {topic.name}
                              </span>

                              {isNextRecommended && (
                                <span className="px-2 py-0.5 rounded-md bg-teal-50 text-[#006B63] border border-teal-200/70 text-[9px] font-mono font-semibold uppercase">
                                  NEXT UP
                                </span>
                              )}

                              {topic.isHighYield && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/70 text-[9px] font-mono font-semibold uppercase">
                                  HIGH YIELD
                                </span>
                              )}

                              {isFullyCovered && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-[9px] font-mono font-semibold uppercase flex items-center gap-1">
                                  <Check className="h-2.5 w-2.5 text-emerald-600" />
                                  COMPLETED
                                </span>
                              )}
                            </div>

                            {/* Study Progress Toggle Pills: Notes, QBank, Revisions */}
                            <div
                              className="flex items-center gap-2 text-xs text-stone-500 flex-wrap pt-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => onToggleTopicState(subject.id, topic.id, 'notesDone')}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold font-display border transition-all cursor-pointer ${
                                  isNotes
                                    ? 'bg-[#006B63] text-white border-[#006B63] shadow-2xs'
                                    : 'bg-stone-50 text-stone-600 border-stone-200/90 hover:bg-stone-100'
                                }`}
                              >
                                <FileText className="h-3 w-3" />
                                <span>Notes</span>
                                {isNotes && <Check className="h-2.5 w-2.5 text-white" />}
                              </button>

                              <button
                                type="button"
                                onClick={() => onToggleTopicState(subject.id, topic.id, 'qBankDone')}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold font-display border transition-all cursor-pointer ${
                                  isQBank
                                    ? 'bg-[#006B63] text-white border-[#006B63] shadow-2xs'
                                    : 'bg-stone-50 text-stone-600 border-stone-200/90 hover:bg-stone-100'
                                }`}
                              >
                                <Layers className="h-3 w-3" />
                                <span>QBank</span>
                                {isQBank && <Check className="h-2.5 w-2.5 text-white" />}
                              </button>

                              <div className="flex items-center gap-1 pl-1 border-l border-stone-200">
                                {(['r1Done', 'r2Done', 'r3Done'] as const).map((rKey, idx) => {
                                  const isDone = rKey === 'r1Done' ? isR1 : rKey === 'r2Done' ? isR2 : isR3;
                                  return (
                                    <button
                                      key={rKey}
                                      type="button"
                                      onClick={() => onToggleTopicState(subject.id, topic.id, rKey)}
                                      className={`px-2 py-1 text-[10px] font-mono font-semibold rounded-md transition-all cursor-pointer ${
                                        isDone
                                          ? 'bg-stone-900 text-white'
                                          : 'bg-stone-100 text-stone-400 hover:text-stone-700'
                                      }`}
                                      title={`Revision round ${idx + 1}`}
                                    >
                                      R{idx + 1}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Study Action Buttons: Rapid Revision, Deepen, 10-MCQs */}
                          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-stretch sm:self-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-stone-100 flex-wrap sm:flex-nowrap">
                            {/* Rapid Revision Hub */}
                            <button
                              type="button"
                              onClick={() =>
                                setActiveTopicForMastery({
                                  subjectId: subject.id,
                                  topicId: topic.id,
                                  topicName: topic.name,
                                })
                              }
                              className="flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold font-display transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-2xs h-[34px] active:scale-[0.98]"
                              title="Rapid Revision (Fast · Board-tested)"
                            >
                              <Zap className="h-3 w-3 text-amber-400 fill-current shrink-0" />
                              <span>Rapid Revision</span>
                            </button>

                            {/* Deepen High-Yield (Gemini study pack) */}
                            <button
                              type="button"
                              onClick={() =>
                                setActiveTopicForMastery({
                                  subjectId: subject.id,
                                  topicId: topic.id,
                                  topicName: topic.name,
                                  autoDeepen: true,
                                })
                              }
                              className="flex-1 sm:flex-none px-2.5 py-1.5 rounded-xl bg-white hover:bg-indigo-50/60 text-stone-900 border border-indigo-200/80 text-xs font-semibold font-display transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 h-[34px] active:scale-[0.98] group"
                              title="Deepen High-Yield (Comprehensive Gemini study pack)"
                            >
                              <Sparkles className="h-3 w-3 text-indigo-600 shrink-0 group-hover:scale-110 transition-transform" />
                              <span>Deepen</span>
                            </button>

                            {/* 10-MCQs Diagnostic Practice Drill */}
                            <button
                              type="button"
                              onClick={() => {
                                if (onLaunchPracticeMcq) {
                                  onLaunchPracticeMcq({
                                    sessionId: `session-${Date.now()}`,
                                    subjectId: subject.id,
                                    subjectName: subject.name,
                                    topicId: topic.id,
                                    topicName: topic.name,
                                    source: 'dashboard_weak_topic',
                                    targetQuestionCount: 10,
                                  });
                                }
                              }}
                              className="flex-1 sm:flex-none px-2.5 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 text-xs font-semibold font-display transition-all cursor-pointer inline-flex items-center justify-center gap-1 h-[34px] active:scale-[0.98]"
                              title="Launch 10-MCQ Diagnostic Drill"
                            >
                              <Activity className="h-3 w-3 text-stone-500" />
                              <span className="hidden xs:inline sm:hidden md:inline">10-MCQs</span>
                            </button>

                            <ChevronRight className="h-4 w-4 text-stone-300 hidden lg:block" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* ================= 4. ADD CUSTOM TOPIC ================= */}
              <div className="pt-4 border-t border-stone-200/70">
                <form onSubmit={handleAddTopic} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add custom topic to syllabus..."
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    className="flex-1 rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#006B63] min-h-[38px]"
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-stone-600 px-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isHighYieldTopic}
                        onChange={(e) => setIsHighYieldTopic(e.target.checked)}
                        className="rounded border-stone-300 text-[#006B63] focus:ring-0 h-3.5 w-3.5"
                      />
                      <span>High Yield</span>
                    </label>
                    <button
                      type="submit"
                      disabled={!newTopicName.trim()}
                      className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-xl bg-[#006B63] hover:bg-[#00554E] text-white text-xs font-semibold font-display disabled:opacity-40 cursor-pointer min-h-[38px]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Topic</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded 6-Step Topic Mastery Workspace Modal */}
      {activeTopicForMastery && (
        <TopicMasteryWorkspace
          subjectId={activeTopicForMastery.subjectId}
          topicId={activeTopicForMastery.topicId}
          topicName={activeTopicForMastery.topicName}
          autoDeepen={activeTopicForMastery.autoDeepen}
          state={state}
          onClose={() => setActiveTopicForMastery(null)}
          onLaunchPracticeMcq={(ctx) => {
            if (onLaunchPracticeMcq) {
              onLaunchPracticeMcq(ctx);
            }
          }}
          onToggleTopicState={onToggleTopicState}
          onOpenAiCoach={onOpenAiCoach}
        />
      )}
    </>,
    document.body
  );
};
