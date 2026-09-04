import React, { useState } from 'react';
import {
  BarChart3,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  Award,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GrandTest, AppState } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { getLocalDateKey } from '../utils/date';

interface GrandTestsViewProps {
  state: AppState;
  onAddGrandTest: (gt: GrandTest) => void;
  onDeleteGrandTest: (id: string) => void;
}

export const GrandTestsView: React.FC<GrandTestsViewProps> = ({
  state,
  onAddGrandTest,
  onDeleteGrandTest,
}) => {
  const [showAddGTModal, setShowAddGTModal] = useState(false);

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

    setNewGT({
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

  return (
    <div className="page-container space-y-8 font-['Inter'] text-[#121e1b]">
      {/* ================= EDITORIAL HEADER ================= */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#66716F]">
              NBE 300-QUESTION CBT BENCHMARK
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#006B63] text-white text-[10px] font-mono font-medium">
              150 PASS MARK
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold font-['Newsreader'] tracking-tight text-[#121e1b]">
            Grand Tests &amp; Mock Exams
          </h1>
          <p className="text-sm sm:text-base text-[#3d4947] max-w-2xl leading-relaxed">
            Track mock test progression across Marrow, Prepladder, Cerebellum, and DAMS. Analyze Paper 1 &amp; 2 splits.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddGTModal(true)}
          className="self-start sm:self-center inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#006B63] hover:bg-[#005049] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Log New Grand Test</span>
        </button>
      </header>

      {/* ================= GT SCORE PROGRESSION GRID ================= */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {gts.map((gt) => {
            const isPassed = gt.score >= 150;
            const accuracy = Math.round((gt.correctCount / (gt.correctCount + gt.incorrectCount || 1)) * 100);

            return (
              <div
                key={gt.id}
                className={`clinical-card p-6 flex flex-col justify-between relative overflow-hidden ${
                  isPassed ? 'border-[#2c694e]/40' : 'border-[#DCE4E1]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#f4eee7] text-[#006B63]">
                        {gt.platform}
                      </span>
                      <h3 className="text-base font-semibold font-['Newsreader'] text-[#121e1b] mt-2">{gt.title}</h3>
                      <div className="flex items-center space-x-1.5 text-xs text-[#66716F] mt-0.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{gt.date}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteGrandTest(gt.id)}
                      className="text-[#66716F] hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Test Record"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Score Callout */}
                  <div className="my-4 p-4 rounded-lg bg-[#F7F9F8] border border-[#DCE4E1] flex items-baseline justify-between">
                    <div>
                      <div className="text-[10px] text-[#66716F] font-mono font-bold uppercase">Final Score</div>
                      <div className="flex items-baseline space-x-1">
                        <span className={`text-3xl font-bold font-['Newsreader'] ${isPassed ? 'text-[#2c694e]' : 'text-rose-600'}`}>
                          {gt.score}
                        </span>
                        <span className="text-xs text-[#66716F] font-medium font-mono">/ 300</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          isPassed ? 'bg-[#F5F7F8] text-[#2c694e]' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isPassed ? 'PASS (150+)' : 'NEEDS BOOST'}
                      </span>
                      <div className="text-[11px] text-[#66716F] mt-1 font-semibold">Accuracy: {accuracy}%</div>
                    </div>
                  </div>

                  {/* Papers Breakdown */}
                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-[#F5F7F8]">
                    <div className="bg-[#F7F9F8] p-2.5 rounded-md border border-[#DCE4E1]">
                      <span className="text-[#66716F] block text-[10px] font-bold uppercase font-mono">Paper 1 (Pre/Para)</span>
                      <span className="font-semibold text-[#121e1b]">{gt.paper1Score ?? '--'} / 150 M</span>
                    </div>
                    <div className="bg-[#F7F9F8] p-2.5 rounded-md border border-[#DCE4E1]">
                      <span className="text-[#66716F] block text-[10px] font-bold uppercase font-mono">Paper 2 (Clinical)</span>
                      <span className="font-semibold text-[#121e1b]">{gt.paper2Score ?? '--'} / 150 M</span>
                    </div>
                  </div>

                  {/* Weak Subjects tags */}
                  {gt.weakSubjectIds && gt.weakSubjectIds.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#F5F7F8]">
                      <div className="text-[10px] font-bold uppercase text-rose-600 mb-1.5 flex items-center space-x-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Weak Areas:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {gt.weakSubjectIds.map((id) => {
                          const sub = FMGE_SUBJECTS.find((s) => s.id === id);
                          return (
                            <span
                              key={id}
                              className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200"
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
                  <div className="mt-3 text-xs text-[#3d4947] bg-amber-50/70 p-3 rounded-md border border-amber-200/60">
                    <span className="font-bold text-amber-900 block text-[10px] uppercase mb-0.5">Test Reflections:</span>
                    <p className="line-clamp-2">{gt.keyMistakesNotes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {gts.length === 0 && (
          <div className="text-center py-16 clinical-card p-8 space-y-4">
            <div className="h-12 w-12 rounded-full bg-[#F7F9F8] flex items-center justify-center mx-auto text-[#006B63]">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold font-['Newsreader'] text-[#121e1b]">No Grand Tests Logged Yet</h3>
            <p className="text-xs text-[#66716F] max-w-md mx-auto">
              Log your full 300-mark mock tests to track your trajectory towards the 150-mark qualifying cutoff.
            </p>
            <button
              type="button"
              onClick={() => setShowAddGTModal(true)}
              className="px-5 py-2.5 bg-[#006B63] hover:bg-[#005049] text-white text-xs font-semibold rounded-md shadow-xs transition-all cursor-pointer"
            >
              + Log Your First GT
            </button>
          </div>
        )}
      </div>

      {/* MODAL: ADD GRAND TEST */}
      {showAddGTModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#DCE4E1] max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold font-['Newsreader'] text-[#121e1b]">Log Grand Test / Mock Result</h3>
            <p className="text-xs text-[#66716F] mt-0.5">Record your 300-marks score to analyze trends.</p>

            <form onSubmit={handleSaveGT} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#3d4947] mb-1 text-[10px] uppercase font-mono">Test Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marrow GT 16 / Prepladder CBT"
                    value={newGT.title}
                    onChange={(e) => setNewGT({ ...newGT, title: e.target.value })}
                    className="w-full p-2.5 bg-[#F7F9F8] border border-[#E4E8EB] rounded-md text-xs focus:border-[#006B63] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#3d4947] mb-1 text-[10px] uppercase font-mono">Platform / Source</label>
                  <select
                    value={newGT.platform}
                    onChange={(e) => setNewGT({ ...newGT, platform: e.target.value as any })}
                    className="w-full p-2.5 bg-[#F7F9F8] border border-[#E4E8EB] rounded-md text-xs font-medium focus:border-[#006B63] focus:outline-none"
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

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#3d4947] mb-1 text-[10px] uppercase font-mono">Score (/ 300)</label>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    required
                    value={newGT.score}
                    onChange={(e) => setNewGT({ ...newGT, score: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#F7F9F8] border border-[#E4E8EB] rounded-md text-xs font-bold text-[#121e1b] focus:border-[#006B63] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#3d4947] mb-1 text-[10px] uppercase font-mono">Paper 1 (/ 150)</label>
                  <input
                    type="number"
                    min="0"
                    max="150"
                    value={newGT.paper1Score}
                    onChange={(e) => setNewGT({ ...newGT, paper1Score: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#F7F9F8] border border-[#E4E8EB] rounded-md text-xs font-medium focus:border-[#006B63] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#3d4947] mb-1 text-[10px] uppercase font-mono">Paper 2 (/ 150)</label>
                  <input
                    type="number"
                    min="0"
                    max="150"
                    value={newGT.paper2Score}
                    onChange={(e) => setNewGT({ ...newGT, paper2Score: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#F7F9F8] border border-[#E4E8EB] rounded-md text-xs font-medium focus:border-[#006B63] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#3d4947] mb-1 text-[10px] uppercase font-mono">Correct Count</label>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={newGT.correctCount}
                    onChange={(e) => setNewGT({ ...newGT, correctCount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#F7F9F8] border border-[#E4E8EB] rounded-md text-xs focus:border-[#006B63] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#3d4947] mb-1 text-[10px] uppercase font-mono">Incorrect Count</label>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={newGT.incorrectCount}
                    onChange={(e) => setNewGT({ ...newGT, incorrectCount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#F7F9F8] border border-[#E4E8EB] rounded-md text-xs focus:border-[#006B63] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#3d4947] mb-1 text-[10px] uppercase font-mono">Test Date</label>
                  <input
                    type="date"
                    value={newGT.date}
                    onChange={(e) => setNewGT({ ...newGT, date: e.target.value })}
                    className="w-full p-2.5 bg-[#F7F9F8] border border-[#E4E8EB] rounded-md text-xs focus:border-[#006B63] focus:outline-none"
                  />
                </div>
              </div>

              {/* Weak Subjects Tagging */}
              <div>
                <label className="block font-bold text-[#3d4947] mb-1 text-[10px] uppercase font-mono">
                  Tag Weak Subjects in this GT (Click to toggle)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2.5 bg-[#F7F9F8] rounded-lg border border-[#E4E8EB]">
                  {FMGE_SUBJECTS.map((sub) => {
                    const isSelected = newGT.weakSubjectIds?.includes(sub.id);
                    return (
                      <button
                        type="button"
                        key={sub.id}
                        onClick={() => toggleWeakSubject(sub.id)}
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-600 text-white'
                            : 'bg-white text-[#3d4947] border border-[#DCE4E1] hover:border-[#E4E8EB]'
                        }`}
                      >
                        {sub.name} (~{sub.weightage}M)
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#3d4947] mb-1 text-[10px] uppercase font-mono">Key Reflections / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Silly calculation errors in PSM. Need to revise OBG partogram..."
                  value={newGT.keyMistakesNotes}
                  onChange={(e) => setNewGT({ ...newGT, keyMistakesNotes: e.target.value })}
                  className="w-full p-2.5 bg-[#F7F9F8] border border-[#E4E8EB] rounded-md text-xs focus:border-[#006B63] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#F5F7F8]">
                <button
                  type="button"
                  onClick={() => setShowAddGTModal(false)}
                  className="px-4 py-2 bg-[#f4eee7] hover:bg-[#F5F7F8] text-[#3d4947] rounded-md font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#006B63] hover:bg-[#005049] text-white rounded-md font-semibold shadow-xs cursor-pointer"
                >
                  Save GT Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
