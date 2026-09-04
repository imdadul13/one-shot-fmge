import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Check,
  ArrowRight,
  Search,
  BookOpen,
  Play,
  RotateCcw,
  AlertTriangle,
  HelpCircle,
  Stethoscope,
  ChevronRight,
  Activity,
  CheckCircle2,
  X,
} from 'lucide-react';
import { AppState, ErrorNotebookItem, PracticeSessionContext } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { ConceptRemediationModal } from './ConceptRemediationModal';
import { TopicMasteryWorkspace } from './TopicMasteryWorkspace';
import {
  extractConceptGap,
  generateConceptRemediationPackage,
  ConceptRemediationPackage,
} from '../utils/errorRemediationEngine';

interface ErrorsViewProps {
  state: AppState;
  onAddErrorItem: (item: ErrorNotebookItem) => void;
  onToggleErrorReviewed: (id: string) => void;
  onDeleteErrorItem: (id: string) => void;
  onUpdateAppState: (updater: (prev: AppState) => AppState) => void;
  onLaunchPracticeSession?: (
    subjectId: string,
    topicId: string,
    topicName: string,
    subtopic?: string
  ) => void;
  onOpenAiCoach?: (
    initialTab?: 'vignette' | 'concept' | 'diagnosis' | 'strategy',
    subjectId?: string,
    topicName?: string
  ) => void;
  onSelectSubject?: (subjectId: string) => void;
  onToggleTopicState?: (
    subjectId: string,
    topicId: string,
    flag: 'notesDone' | 'qBankDone' | 'r1Done'
  ) => void;
}

export const ErrorsView: React.FC<ErrorsViewProps> = ({
  state,
  onAddErrorItem,
  onToggleErrorReviewed,
  onDeleteErrorItem,
  onUpdateAppState,
  onLaunchPracticeSession,
  onOpenAiCoach,
  onSelectSubject,
  onToggleTopicState,
}) => {
  const [activeRemediationPackage, setActiveRemediationPackage] = useState<ConceptRemediationPackage | null>(null);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unreviewed' | 'reviewed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddErrorModal, setShowAddErrorModal] = useState(false);

  // Active Topic for 6-Step Mastery Workspace modal
  const [activeTopicForMastery, setActiveTopicForMastery] = useState<{
    subjectId: string;
    topicId: string;
    topicName: string;
  } | null>(null);

  const [newError, setNewError] = useState<Partial<ErrorNotebookItem>>({
    subjectId: 'anatomy',
    topic: 'Lower Limb - Knee Joint & Nerve Lesions',
    questionGist: '',
    myMistake: '',
    correctConcept: '',
  });

  const errors = state.errorNotebook || [];

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = errors.length;
    const reviewed = errors.filter((e) => e.isReviewed).length;
    const unreviewed = total - reviewed;
    const pct = total > 0 ? Math.round((reviewed / total) * 100) : 100;
    return { total, reviewed, unreviewed, pct };
  }, [errors]);

  // Filtered & Searched Errors
  const filteredErrors = useMemo(() => {
    return errors.filter((err) => {
      if (selectedSubjectFilter !== 'all' && err.subjectId !== selectedSubjectFilter) return false;
      if (statusFilter === 'unreviewed' && err.isReviewed) return false;
      if (statusFilter === 'reviewed' && !err.isReviewed) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const sub = FMGE_SUBJECTS.find((s) => s.id === err.subjectId);
        const matchText = `${err.questionGist} ${err.myMistake || ''} ${err.correctConcept || ''} ${err.topic} ${sub?.name || ''}`.toLowerCase();
        if (!matchText.includes(q)) return false;
      }
      return true;
    });
  }, [errors, selectedSubjectFilter, statusFilter, searchQuery]);

  const handleSaveError = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newError.questionGist || !newError.correctConcept) return;

    const sub = FMGE_SUBJECTS.find((s) => s.id === newError.subjectId);
    const defaultTopic = sub?.topics[0];

    const item: ErrorNotebookItem = {
      id: `err-${Date.now()}`,
      subjectId: newError.subjectId || 'anatomy',
      topicId: defaultTopic?.id || 'top-1',
      topic: newError.topic || defaultTopic?.name || 'General Clinical Topic',
      questionGist: newError.questionGist,
      myMistake: newError.myMistake || '',
      correctConcept: newError.correctConcept,
      isReviewed: false,
      dateAdded: new Date().toISOString().split('T')[0],
    };

    onAddErrorItem(item);
    setShowAddErrorModal(false);
    setNewError({
      subjectId: 'anatomy',
      topic: 'Lower Limb - Knee Joint & Nerve Lesions',
      questionGist: '',
      myMistake: '',
      correctConcept: '',
    });
  };

  return (
    <>
      <div className="page-container space-y-8 font-sans text-slate-900">
        {/* ================= EDITORIAL HEADER ================= */}
        <header className="space-y-2 border-b border-slate-200/80 pb-6">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
              SMART CLINICAL ERROR REMEDIATION LEDGER
            </span>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
              <span>{metrics.unreviewed} Pending</span>
              <span>·</span>
              <span className="text-emerald-700 font-semibold">{metrics.pct}% Remediation Rate</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold font-display tracking-tight text-slate-900">
                Error Vault &amp; Diagnostics
              </h1>
              <p className="text-sm sm:text-base text-slate-500 max-w-2xl leading-relaxed mt-0.5">
                Intelligent mistake diagnosis. Analyzes root-cause distractor traps and generates direct study prescriptions.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddErrorModal(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold font-display transition-colors cursor-pointer shrink-0 w-fit shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log Mistake</span>
            </button>
          </div>
        </header>

        {/* ================= DIAGNOSTIC OVERVIEW TILES ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="editorial-surface p-4 space-y-1">
            <span className="font-mono text-[10px] uppercase font-semibold text-slate-400">Total Mistakes Logged</span>
            <p className="text-2xl font-semibold font-display text-slate-900">{metrics.total}</p>
            <p className="text-xs text-slate-500">From 10-MCQ drills & mock exams</p>
          </div>
          <div className="editorial-surface p-4 space-y-1">
            <span className="font-mono text-[10px] uppercase font-semibold text-amber-700">Action Required</span>
            <p className="text-2xl font-semibold font-display text-amber-900">{metrics.unreviewed}</p>
            <p className="text-xs text-slate-500">Concepts needing study & retesting</p>
          </div>
          <div className="editorial-surface p-4 space-y-1">
            <span className="font-mono text-[10px] uppercase font-semibold text-emerald-700">Remediated & Retained</span>
            <p className="text-2xl font-semibold font-display text-emerald-900">{metrics.reviewed}</p>
            <p className="text-xs text-slate-500">Mastered clinical discriminators</p>
          </div>
        </div>

        {/* ================= SEARCH & STATUS FILTERS ================= */}
        <div className="space-y-4 border-y border-slate-200/80 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Status Pills */}
            <div className="flex items-center gap-2">
              {[
                { id: 'all', label: `All Mistakes (${metrics.total})` },
                { id: 'unreviewed', label: `Needs Review (${metrics.unreviewed})` },
                { id: 'reviewed', label: `Remediated (${metrics.reviewed})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold font-display transition-all cursor-pointer border ${
                    statusFilter === tab.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search errors & keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-white py-1.5 pl-9 pr-8 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Subject Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            <button
              type="button"
              onClick={() => setSelectedSubjectFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold font-display shrink-0 transition-colors cursor-pointer border ${
                selectedSubjectFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              All Disciplines
            </button>
            {FMGE_SUBJECTS.map((sub) => {
              const count = errors.filter((e) => e.subjectId === sub.id).length;
              if (count === 0) return null;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubjectFilter(sub.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold font-display shrink-0 transition-colors cursor-pointer border ${
                    selectedSubjectFilter === sub.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <span>{sub.name}</span>
                  <span className="ml-1 text-[10px] font-mono opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= SMART ERROR LEDGER LIST ================= */}
        {filteredErrors.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2 editorial-surface p-8">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No mistakes logged in this section.</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Wrong answers from 10-MCQ drills and practice sessions are automatically captured with diagnostic analysis.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono px-1">
              <span>Mistake Analysis &amp; Study Prescriptions</span>
              <span>{filteredErrors.length} Questions</span>
            </div>

            <div className="space-y-4">
              {filteredErrors.map((err) => {
                const sub = FMGE_SUBJECTS.find((s) => s.id === err.subjectId) || FMGE_SUBJECTS[0];
                const matchedTopic = sub.topics.find((t) => t.id === err.topicId || t.name === err.topic) || sub.topics[0];
                const conceptGap = extractConceptGap(err.subjectId, err.topicId || matchedTopic.id, err.questionGist, err.myMistake);

                return (
                  <div
                    key={err.id}
                    className={`editorial-surface p-6 space-y-5 transition-all ${
                      err.isReviewed ? 'bg-slate-50/50 opacity-80' : 'bg-white hover:border-slate-300'
                    }`}
                  >
                    {/* Top Status & Subject Header */}
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono text-[10px] font-semibold uppercase">
                            {sub.name} · {sub.weightage} MARKS
                          </span>
                          <span className="text-xs font-semibold font-display text-slate-900">
                            {err.topic || matchedTopic.name}
                          </span>
                          {err.isReviewed && (
                            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              ✓ REMEDIATED
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm sm:text-base font-semibold font-display text-slate-900 leading-snug break-words">
                          {err.questionGist}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onToggleErrorReviewed(err.id)}
                          className={`text-xs px-3 py-1.5 rounded-full font-semibold font-display transition-colors cursor-pointer border ${
                            err.isReviewed
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {err.isReviewed ? '✓ Reviewed' : 'Mark Reviewed'}
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteErrorItem(err.id)}
                          className="text-slate-300 hover:text-rose-600 p-1.5 rounded-full hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete from error vault"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* TWO-COLUMN DIAGNOSTIC CARD: WHY WRONG vs WHAT TO STUDY */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Why It's Wrong & Trap Analysis */}
                      <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-100 space-y-2 text-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-rose-900 font-display">
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                          <span>Why It's Wrong &amp; Clinical Trap</span>
                        </div>

                        {err.myMistake ? (
                          <p className="text-rose-950">
                            <strong>Your Selection:</strong> {err.myMistake}
                          </p>
                        ) : null}

                        <p className="text-slate-700 leading-relaxed">
                          <strong>Cognitive Trap:</strong> {conceptGap.classicTrap}
                        </p>
                      </div>

                      {/* Right: What To Study & Core Concept */}
                      <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-100 space-y-2 text-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-sky-900 font-display">
                          <BookOpen className="h-3.5 w-3.5 text-sky-700" />
                          <span>What You Should Study &amp; Retain</span>
                        </div>

                        <p className="text-slate-900 font-semibold leading-relaxed">
                          {err.correctConcept}
                        </p>

                        <p className="text-slate-600 font-mono text-[11px]">
                          <strong>Target Module:</strong> {sub.name} → {err.topic || matchedTopic.name}
                        </p>
                      </div>
                    </div>

                    {/* DIRECT ACTION BAR */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        {/* 1-Click Study 6-Step Workspace */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTopicForMastery({
                              subjectId: sub.id,
                              topicId: matchedTopic.id,
                              topicName: err.topic || matchedTopic.name,
                            });
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold font-display transition-colors cursor-pointer"
                        >
                          <BookOpen className="h-3 w-3" />
                          <span>Study Topic (6-Steps)</span>
                        </button>

                        {/* 1-Click 10-MCQ Targeted Drill */}
                        <button
                          type="button"
                          onClick={() => {
                            if (onLaunchPracticeSession) {
                              onLaunchPracticeSession(
                                sub.id,
                                matchedTopic.id,
                                err.topic || matchedTopic.name
                              );
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold font-display border border-slate-200 transition-colors cursor-pointer"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>10-MCQ Drill</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Ask Clinical Mentor */}
                        {onOpenAiCoach && (
                          <button
                            type="button"
                            onClick={() => {
                              onOpenAiCoach(
                                'concept',
                                sub.id,
                                `${err.topic || matchedTopic.name} - ${err.questionGist}`
                              );
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 font-display cursor-pointer"
                          >
                            <Stethoscope className="h-3.5 w-3.5 text-sky-700" />
                            <span>Ask Mentor Why I'm Wrong</span>
                          </button>
                        )}

                        {/* Full Concept Remediation Package Modal */}
                        <button
                          type="button"
                          onClick={() => {
                            const pkg = generateConceptRemediationPackage(
                              err.subjectId,
                              err.topicId || matchedTopic.id,
                              conceptGap.conceptId,
                              conceptGap.conceptName
                            );
                            setActiveRemediationPackage(pkg);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-900 font-display cursor-pointer"
                        >
                          <span>Full Remediation</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add Error Modal */}
        {showAddErrorModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-xl font-semibold font-display text-slate-900">Log Clinical Question Mistake</h2>
                <button
                  type="button"
                  onClick={() => setShowAddErrorModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveError} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Subject</label>
                  <select
                    value={newError.subjectId}
                    onChange={(e) => {
                      const subId = e.target.value;
                      const s = FMGE_SUBJECTS.find((sub) => sub.id === subId);
                      setNewError({
                        ...newError,
                        subjectId: subId,
                        topic: s?.topics[0]?.name || 'General Topic',
                      });
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900"
                  >
                    {FMGE_SUBJECTS.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.weightage}M)</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Topic Title</label>
                  <input
                    type="text"
                    value={newError.topic}
                    onChange={(e) => setNewError({ ...newError, topic: e.target.value })}
                    placeholder="e.g. Asthma, Knee Joint, Enzyme Kinetics..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Question Gist / Clinical Scenario</label>
                  <textarea
                    rows={2}
                    value={newError.questionGist}
                    onChange={(e) => setNewError({ ...newError, questionGist: e.target.value })}
                    placeholder="Briefly describe what the MCQ was asking..."
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">My Selected Answer / Mistake (Why I Picked It)</label>
                  <input
                    type="text"
                    value={newError.myMistake}
                    onChange={(e) => setNewError({ ...newError, myMistake: e.target.value })}
                    placeholder="e.g. Confused with Crohn's disease skip lesions"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Correct Concept / Diagnostic Discriminator</label>
                  <textarea
                    rows={2}
                    value={newError.correctConcept}
                    onChange={(e) => setNewError({ ...newError, correctConcept: e.target.value })}
                    placeholder="What is the actual high-yield rule or hallmark finding to remember?"
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddErrorModal(false)}
                    className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold font-display hover:bg-slate-800 cursor-pointer shadow-xs"
                  >
                    Save Mistake
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Full Concept Remediation Package Modal */}
        {activeRemediationPackage && (
          <ConceptRemediationModal
            remediationPackage={activeRemediationPackage}
            onClose={() => setActiveRemediationPackage(null)}
            onUpdateAppState={onUpdateAppState}
          />
        )}

        {/* Embedded 6-Step Topic Mastery Workspace Modal */}
        {activeTopicForMastery && (
          <TopicMasteryWorkspace
            subjectId={activeTopicForMastery.subjectId}
            topicId={activeTopicForMastery.topicId}
            topicName={activeTopicForMastery.topicName}
            state={state}
            onClose={() => setActiveTopicForMastery(null)}
            onLaunchPracticeMcq={(ctx) => {
              if (onLaunchPracticeSession) {
                onLaunchPracticeSession(
                  ctx.subjectId,
                  ctx.topicId,
                  ctx.topicName,
                  ctx.subtopic
                );
              }
            }}
            onToggleTopicState={onToggleTopicState || (() => {})}
            onOpenAiCoach={onOpenAiCoach}
          />
        )}
      </div>
    </>
  );
};
