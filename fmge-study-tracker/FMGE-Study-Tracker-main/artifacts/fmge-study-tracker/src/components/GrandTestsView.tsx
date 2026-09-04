import React, { useState } from 'react';
import {
  BarChart3,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GrandTest, ErrorNotebookItem, AppState } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { getLocalDateKey } from '../utils/date';

interface GrandTestsViewProps {
  state: AppState;
  onAddGrandTest: (gt: GrandTest) => void;
  onDeleteGrandTest: (id: string) => void;
  onAddErrorItem: (item: ErrorNotebookItem) => void;
  onToggleErrorReviewed: (id: string) => void;
  onDeleteErrorItem: (id: string) => void;
  onOpenAiCoach: (initialTab?: 'vignette' | 'concept' | 'diagnosis') => void;
}

export const GrandTestsView: React.FC<GrandTestsViewProps> = ({
  state,
  onAddGrandTest,
  onDeleteGrandTest,
  onAddErrorItem,
  onToggleErrorReviewed,
  onDeleteErrorItem,
  onOpenAiCoach,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'tests' | 'error_notebook'>('tests');
  const [showAddGTModal, setShowAddGTModal] = useState(false);
  const [showAddErrorModal, setShowAddErrorModal] = useState(false);

  // New GT Form State
  const [newGT, setNewGT] = useState<Partial<GrandTest>>({
    title: '',
    platform: 'Marrow',
    date: getLocalDateKey(),
    score: 150,
    totalMarks: 300,
    correctCount: 165,
    incorrectCount: 110,
    skippedCount: 25,
    percentile: 60,
    paper1Score: 75,
    paper2Score: 75,
    weakSubjectIds: [],
    strongSubjectIds: [],
    keyMistakesNotes: '',
  });

  // New Error Notebook Item State
  const [newError, setNewError] = useState<Partial<ErrorNotebookItem>>({
    subjectId: 'medicine',
    topic: '',
    questionGist: '',
    myMistake: '',
    correctConcept: '',
    isReviewed: false,
    dateAdded: new Date().toISOString().split('T')[0],
  });

  const handleSaveGT = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGT.title) return;

    const finalGT: GrandTest = {
      id: `gt-${Date.now()}`,
      title: newGT.title || 'Grand Test',
      platform: (newGT.platform as any) || 'Marrow',
      date: newGT.date || getLocalDateKey(),
      score: Number(newGT.score) || 0,
      totalMarks: 300,
      correctCount: Number(newGT.correctCount) || 0,
      incorrectCount: Number(newGT.incorrectCount) || 0,
      skippedCount: Number(newGT.skippedCount) || 0,
      percentile: Number(newGT.percentile) || undefined,
      paper1Score: Number(newGT.paper1Score) || undefined,
      paper2Score: Number(newGT.paper2Score) || undefined,
      weakSubjectIds: newGT.weakSubjectIds || [],
      strongSubjectIds: newGT.strongSubjectIds || [],
      keyMistakesNotes: newGT.keyMistakesNotes || '',
    };

    onAddGrandTest(finalGT);
    setShowAddGTModal(false);

    if (finalGT.score >= 150) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  const handleSaveError = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newError.questionGist || !newError.correctConcept) return;

    const item: ErrorNotebookItem = {
      id: `err-${Date.now()}`,
      subjectId: newError.subjectId || 'medicine',
      topic: newError.topic || 'General Topic',
      questionGist: newError.questionGist || '',
      myMistake: newError.myMistake || '',
      correctConcept: newError.correctConcept || '',
      isReviewed: false,
      dateAdded: newError.dateAdded || getLocalDateKey(),
    };

    onAddErrorItem(item);
    setShowAddErrorModal(false);
    setNewError({
      subjectId: 'medicine',
      topic: '',
      questionGist: '',
      myMistake: '',
      correctConcept: '',
      isReviewed: false,
      dateAdded: getLocalDateKey(),
    });
  };

  const toggleWeakSubject = (subjectId: string) => {
    const curr = newGT.weakSubjectIds || [];
    if (curr.includes(subjectId)) {
      setNewGT({ ...newGT, weakSubjectIds: curr.filter((id) => id !== subjectId) });
    } else {
      setNewGT({ ...newGT, weakSubjectIds: [...curr, subjectId] });
    }
  };

  const gts = state.grandTests || [];
  const errors = state.errorNotebook || [];

  return (
    <div className="space-y-5 pb-12">
      {/* Top Bento Header & Action Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Grand Tests & 20th Error Notebook</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
                300Q CBT Benchmark
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Analyze GT mock trajectory across Marrow, Prepladder, Cerebellum, and maintain your 20th notebook.
            </p>
          </div>
        </div>

        {/* Subtab Toggle Buttons */}
        <div className="flex items-center space-x-2">
          <div className="flex p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => setActiveSubTab('tests')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'tests' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Grand Tests ({gts.length})
            </button>
            <button
              onClick={() => setActiveSubTab('error_notebook')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'error_notebook' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              20th Error Notebook ({errors.length})
            </button>
          </div>

          {activeSubTab === 'tests' ? (
            <button
              onClick={() => setShowAddGTModal(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log GT</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAddErrorModal(true)}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Mistake</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: GRAND TESTS BENTO GRID */}
      {activeSubTab === 'tests' && (
        <div className="space-y-6">
          {/* GT Score Progression List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gts.map((gt) => {
              const isPassed = gt.score >= 150;
              const accuracy = Math.round((gt.correctCount / (gt.correctCount + gt.incorrectCount || 1)) * 100);

              return (
                <div
                  key={gt.id}
                  className={`bg-white rounded-3xl p-5 border shadow-xs transition-all relative overflow-hidden flex flex-col justify-between ${
                    isPassed ? 'border-emerald-200' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {gt.platform}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-2">{gt.title}</h3>
                        <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{gt.date}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteGrandTest(gt.id)}
                        className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg transition-colors"
                        title="Delete Test Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Score Callout */}
                    <div className="my-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-baseline justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Final Score</div>
                        <div className="flex items-baseline space-x-1">
                          <span className={`text-3xl font-black ${isPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {gt.score}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">/ 300</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                            isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isPassed ? 'PASS (150+)' : 'NEEDS BOOST'}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1 font-semibold">Accuracy: {accuracy}%</div>
                      </div>
                    </div>

                    {/* Papers Breakdown */}
                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-slate-100">
                      <div className="bg-slate-50 p-2.5 rounded-xl">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Paper 1 (Pre/Para)</span>
                        <span className="font-bold text-slate-800">{gt.paper1Score ?? '--'} / 150 M</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Paper 2 (Clinical)</span>
                        <span className="font-bold text-slate-800">{gt.paper2Score ?? '--'} / 150 M</span>
                      </div>
                    </div>

                    {/* Weak Subjects tags */}
                    {gt.weakSubjectIds && gt.weakSubjectIds.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="text-[10px] font-bold uppercase text-rose-600 mb-1 flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Weak Areas:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {gt.weakSubjectIds.map((id) => {
                            const sub = FMGE_SUBJECTS.find((s) => s.id === id);
                            return (
                              <span
                                key={id}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200"
                              >
                                {sub?.name || id}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes / Reflections */}
                  {gt.keyMistakesNotes && (
                    <div className="mt-3 text-xs text-slate-600 bg-amber-50/70 p-2.5 rounded-2xl border border-amber-200/60">
                      <span className="font-bold text-amber-900 block text-[10px] uppercase mb-0.5">Test Reflections:</span>
                      <p className="line-clamp-2">{gt.keyMistakesNotes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {gts.length === 0 && (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-3">
              <BarChart3 className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Grand Tests Logged Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Log your full 300-mark mock tests to track your trajectory towards the 150-mark qualifying cutoff.
              </p>
              <button
                onClick={() => setShowAddGTModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl"
              >
                + Log Your First GT
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: 20TH ERROR NOTEBOOK */}
      {activeSubTab === 'error_notebook' && (
        <div className="space-y-4">
          <div className="bg-amber-50 rounded-3xl p-5 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                <strong>The 20th Notebook Method:</strong> Record your repeated test traps, volatile values, and confusion points here. Reviewing this before the exam is proven to boost scores by 20-30 marks!
              </span>
            </div>
            <button
              onClick={() => setShowAddErrorModal(true)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shrink-0"
            >
              + Add Entry
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {errors.map((err) => {
              const sub = FMGE_SUBJECTS.find((s) => s.id === err.subjectId);

              return (
                <div
                  key={err.id}
                  className={`bg-white rounded-3xl p-5 border transition-all ${
                    err.isReviewed ? 'border-slate-200 bg-slate-50/40 opacity-75' : 'border-rose-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white uppercase"
                        style={{ backgroundColor: sub?.color || '#4f46e5' }}
                      >
                        {sub?.name || err.subjectId}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">{err.topic}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onToggleErrorReviewed(err.id)}
                        className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-colors ${
                          err.isReviewed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                      >
                        {err.isReviewed ? '✓ Reviewed' : 'Mark Reviewed'}
                      </button>
                      <button
                        onClick={() => onDeleteErrorItem(err.id)}
                        className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Gist */}
                  <div className="mt-3 text-xs">
                    <span className="font-bold text-slate-900 block mb-0.5 text-[10px] uppercase text-slate-400">
                      Question Gist / Trap:
                    </span>
                    <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
                      {err.questionGist}
                    </p>
                  </div>

                  {/* My Mistake vs Correct Concept */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="bg-rose-50 p-3 rounded-2xl border border-rose-100">
                      <span className="font-bold text-rose-800 block text-[10px] uppercase mb-0.5">My Mistake:</span>
                      <p className="text-rose-900">{err.myMistake || 'Misread question or marked wrong option.'}</p>
                    </div>

                    <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                      <span className="font-bold text-emerald-800 block text-[10px] uppercase mb-0.5">High-Yield Pearl:</span>
                      <p className="text-emerald-900 font-medium">{err.correctConcept}</p>
                    </div>
                  </div>

                  <div className="mt-2 text-[10px] text-slate-400 text-right">
                    Added: {err.dateAdded}
                  </div>
                </div>
              );
            })}
          </div>

          {errors.length === 0 && (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-3">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Your 20th Notebook is Empty</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Whenever you get a question wrong in Grand Tests or QBank, record the core pearl here.
              </p>
              <button
                onClick={() => setShowAddErrorModal(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
              >
                + Add First Mistake
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD GRAND TEST */}
      {showAddGTModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">Log Grand Test / Mock Result</h3>
            <p className="text-xs text-slate-500 mt-0.5">Record your 300-marks score to analyze trends.</p>

            <form onSubmit={handleSaveGT} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Test Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marrow GT 16 / Prepladder CBT"
                    value={newGT.title}
                    onChange={(e) => setNewGT({ ...newGT, title: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Platform / Source</label>
                  <select
                    value={newGT.platform}
                    onChange={(e) => setNewGT({ ...newGT, platform: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  >
                    <option value="Marrow">Marrow</option>
                    <option value="Prepladder">Prepladder</option>
                    <option value="Cerebellum">Cerebellum</option>
                    <option value="DAMS">DAMS</option>
                    <option value="Bhatia">Bhatia</option>
                    <option value="NBE Mock">NBE Official Mock</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Score (/ 300)</label>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    required
                    value={newGT.score}
                    onChange={(e) => setNewGT({ ...newGT, score: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-indigo-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Paper 1 (/ 150)</label>
                  <input
                    type="number"
                    min="0"
                    max="150"
                    value={newGT.paper1Score}
                    onChange={(e) => setNewGT({ ...newGT, paper1Score: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Paper 2 (/ 150)</label>
                  <input
                    type="number"
                    min="0"
                    max="150"
                    value={newGT.paper2Score}
                    onChange={(e) => setNewGT({ ...newGT, paper2Score: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Correct Count</label>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={newGT.correctCount}
                    onChange={(e) => setNewGT({ ...newGT, correctCount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Incorrect Count</label>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={newGT.incorrectCount}
                    onChange={(e) => setNewGT({ ...newGT, incorrectCount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Test Date</label>
                  <input
                    type="date"
                    value={newGT.date}
                    onChange={(e) => setNewGT({ ...newGT, date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Weak Subjects Tagging */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">
                  Tag Weak Subjects in this GT (Click to toggle)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
                  {FMGE_SUBJECTS.map((sub) => {
                    const isSelected = newGT.weakSubjectIds?.includes(sub.id);
                    return (
                      <button
                        type="button"
                        key={sub.id}
                        onClick={() => toggleWeakSubject(sub.id)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                          isSelected
                            ? 'bg-rose-600 text-white'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {sub.name} (~{sub.weightage}M)
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Key Reflections / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Silly calculation errors in PSM. Need to revise OBG partogram..."
                  value={newGT.keyMistakesNotes}
                  onChange={(e) => setNewGT({ ...newGT, keyMistakesNotes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddGTModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Save GT Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD 20TH NOTEBOOK ERROR */}
      {showAddErrorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">Add Mistake to 20th Notebook</h3>
            <p className="text-xs text-slate-500 mt-0.5">Turn exam errors into guaranteed marks.</p>

            <form onSubmit={handleSaveError} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Subject</label>
                  <select
                    value={newError.subjectId}
                    onChange={(e) => setNewError({ ...newError, subjectId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  >
                    {FMGE_SUBJECTS.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} (~{sub.weightage}M)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Topic Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Parkland formula / Preeclampsia"
                    value={newError.topic}
                    onChange={(e) => setNewError({ ...newError, topic: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Question Gist / Context</label>
                <textarea
                  rows={2}
                  required
                  placeholder="What was the question asking? (e.g. 3 hours post burn arrival fluid calculation)"
                  value={newError.questionGist}
                  onChange={(e) => setNewError({ ...newError, questionGist: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-rose-700 mb-1 text-[10px] uppercase">What was my mistake / trap?</label>
                <input
                  type="text"
                  placeholder="e.g. Counted 8 hours from hospital arrival instead of injury time"
                  value={newError.myMistake}
                  onChange={(e) => setNewError({ ...newError, myMistake: e.target.value })}
                  className="w-full p-2.5 bg-rose-50/60 border border-rose-200 rounded-xl text-xs text-rose-900"
                />
              </div>

              <div>
                <label className="block font-bold text-emerald-700 mb-1 text-[10px] uppercase">Correct High-Yield Concept / Rule</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Parkland 8-hour window is strictly counted from the TIME OF INJURY!"
                  value={newError.correctConcept}
                  onChange={(e) => setNewError({ ...newError, correctConcept: e.target.value })}
                  className="w-full p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddErrorModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Save to Notebook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
