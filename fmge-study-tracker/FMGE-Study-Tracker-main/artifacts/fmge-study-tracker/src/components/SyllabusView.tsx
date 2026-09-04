import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  BookOpen,
  Plus,
  Layers,
  Award
} from 'lucide-react';
import { AppState, FMGESubject, SubjectPhase, ConfidenceLevel } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';

interface SyllabusViewProps {
  state: AppState;
  onSelectSubject: (subjectId: string) => void;
  onToggleTopicState: (subjectId: string, topicId: string, field: 'notesDone' | 'qBankDone' | 'r1Done' | 'r2Done' | 'r3Done') => void;
  onUpdateConfidence: (subjectId: string, confidence: ConfidenceLevel) => void;
}

export const SyllabusView: React.FC<SyllabusViewProps> = ({
  state,
  onSelectSubject,
  onToggleTopicState,
  onUpdateConfidence,
}) => {
  const [phaseFilter, setPhaseFilter] = useState<'all' | SubjectPhase>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [highYieldOnly, setHighYieldOnly] = useState(false);

  // Filtered Subjects
  const filteredSubjects = useMemo(() => {
    return FMGE_SUBJECTS.filter((sub) => {
      if (phaseFilter !== 'all' && sub.phase !== phaseFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSubName = sub.name.toLowerCase().includes(q) || sub.code.toLowerCase().includes(q);
        const subProgress = state.subjectProgress[sub.id];
        const allTopics = [...sub.topics, ...(subProgress?.customTopics || [])];
        const matchesTopic = allTopics.some((t) => t.name.toLowerCase().includes(q));
        if (!matchesSubName && !matchesTopic) return false;
      }
      return true;
    });
  }, [phaseFilter, searchQuery, state.subjectProgress]);

  return (
    <div className="space-y-5 pb-12">
      {/* Bento Header & Filter Controls */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  19 Medical Subjects Syllabus Tracker
                </h2>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-100 uppercase tracking-wider">
                  NExT / FMGE 300M
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Track Theory Notes, QBank Questions, and R1/R2/R3 Revisions topic-by-topic across all 300 marks.
              </p>
            </div>
          </div>

          {/* Quick High-Yield Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setHighYieldOnly(!highYieldOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                highYieldOnly
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>High-Yield Only</span>
            </button>
          </div>
        </div>

        {/* Phase Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Phase Filter Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => setPhaseFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                phaseFilter === 'all'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All 19 Subjects (300 M)
            </button>
            <button
              onClick={() => setPhaseFilter('pre-clinical')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                phaseFilter === 'pre-clinical'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pre-Clinical (51 M)
            </button>
            <button
              onClick={() => setPhaseFilter('para-clinical')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                phaseFilter === 'para-clinical'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Para-Clinical (69 M)
            </button>
            <button
              onClick={() => setPhaseFilter('clinical')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                phaseFilter === 'clinical'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Clinical (180 M)
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search subjects or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* Subjects Grid & Detailed Bento Cards */}
      <div className="space-y-4">
        {filteredSubjects.map((sub) => {
          const subProgress = state.subjectProgress[sub.id];
          const allTopics = [...sub.topics, ...(subProgress?.customTopics || [])];
          const displayedTopics = highYieldOnly ? allTopics.filter((t) => t.isHighYield) : allTopics;

          // Compute completion stats for this subject
          const notesDoneCount = allTopics.filter((t) => state.topicsState[`${sub.id}-${t.id}`]?.notesDone ?? t.notesDone).length;
          const qBankDoneCount = allTopics.filter((t) => state.topicsState[`${sub.id}-${t.id}`]?.qBankDone ?? t.qBankDone).length;
          const r1DoneCount = allTopics.filter((t) => state.topicsState[`${sub.id}-${t.id}`]?.r1Done ?? t.r1Done).length;
          const r2DoneCount = allTopics.filter((t) => state.topicsState[`${sub.id}-${t.id}`]?.r2Done ?? t.r2Done).length;
          const r3DoneCount = allTopics.filter((t) => state.topicsState[`${sub.id}-${t.id}`]?.r3Done ?? t.r3Done).length;

          return (
            <div
              key={sub.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300"
            >
              {/* Subject Header Bar */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-xs"
                    style={{ backgroundColor: sub.color }}
                  >
                    {sub.code}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-slate-900">{sub.name}</h3>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        ~{sub.weightage} Marks
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {sub.phase}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{sub.highYieldTips}</p>
                  </div>
                </div>

                {/* Subject Progress Summary & Confidence Dropdown */}
                <div className="flex items-center space-x-3 self-end sm:self-center">
                  <div className="text-right text-xs">
                    <div className="font-bold text-slate-800">
                      Notes: {notesDoneCount}/{allTopics.length} • R1: {r1DoneCount}/{allTopics.length}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      QBank: {qBankDoneCount}/{allTopics.length} done
                    </div>
                  </div>

                  {/* Confidence selector */}
                  <select
                    value={subProgress?.confidence || 'not-started'}
                    onChange={(e) => onUpdateConfidence(sub.id, e.target.value as ConfidenceLevel)}
                    className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="not-started">Not Started</option>
                    <option value="low">Low Confidence</option>
                    <option value="moderate">Moderate</option>
                    <option value="strong">Strong</option>
                    <option value="mastered">Mastered</option>
                  </select>

                  <button
                    onClick={() => onSelectSubject(sub.id)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                    title="Open Detailed Subject Manager"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Subject Topics Checklist Table */}
              <div className="p-4 sm:p-5 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 pb-2">
                      <th className="pb-2">Topic / High-Yield Module</th>
                      <th className="pb-2 text-center w-24">Notes</th>
                      <th className="pb-2 text-center w-24">QBank</th>
                      <th className="pb-2 text-center w-20">Rev 1 (R1)</th>
                      <th className="pb-2 text-center w-20">Rev 2 (R2)</th>
                      <th className="pb-2 text-center w-20">Rev 3 (R3)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedTopics.map((topic) => {
                      const key = `${sub.id}-${topic.id}`;
                      const savedTopic = state.topicsState[key] || {};
                      const isNotes = savedTopic.notesDone ?? topic.notesDone;
                      const isQBank = savedTopic.qBankDone ?? topic.qBankDone;
                      const isR1 = savedTopic.r1Done ?? topic.r1Done;
                      const isR2 = savedTopic.r2Done ?? topic.r2Done;
                      const isR3 = savedTopic.r3Done ?? topic.r3Done;

                      return (
                        <tr key={topic.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 pr-4">
                            <div className="flex items-center space-x-2">
                              {topic.isHighYield && (
                                <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-full font-bold text-[10px] shrink-0">
                                  HY
                                </span>
                              )}
                              <span className={`font-medium ${isNotes && isR1 ? 'text-slate-900 font-semibold' : 'text-slate-700'}`}>
                                {topic.name}
                              </span>
                            </div>
                          </td>

                          {/* Notes Done Checkbox */}
                          <td className="py-2.5 text-center">
                            <button
                              onClick={() => onToggleTopicState(sub.id, topic.id, 'notesDone')}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isNotes ? 'text-indigo-600 hover:bg-indigo-50' : 'text-slate-300 hover:text-slate-400'
                              }`}
                              title={isNotes ? 'Theory Completed' : 'Mark Theory Done'}
                            >
                              <CheckCircle2 className={`w-4 h-4 ${isNotes ? 'fill-indigo-100' : ''}`} />
                            </button>
                          </td>

                          {/* QBank Done Checkbox */}
                          <td className="py-2.5 text-center">
                            <button
                              onClick={() => onToggleTopicState(sub.id, topic.id, 'qBankDone')}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isQBank ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-300 hover:text-slate-400'
                              }`}
                              title={isQBank ? 'QBank Completed' : 'Mark QBank Done'}
                            >
                              <CheckCircle2 className={`w-4 h-4 ${isQBank ? 'fill-emerald-100' : ''}`} />
                            </button>
                          </td>

                          {/* R1 Checkbox */}
                          <td className="py-2.5 text-center">
                            <button
                              onClick={() => onToggleTopicState(sub.id, topic.id, 'r1Done')}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isR1 ? 'text-blue-600 hover:bg-blue-50' : 'text-slate-300 hover:text-slate-400'
                              }`}
                              title={isR1 ? 'R1 Completed' : 'Mark R1 Done'}
                            >
                              <CheckCircle2 className={`w-4 h-4 ${isR1 ? 'fill-blue-100' : ''}`} />
                            </button>
                          </td>

                          {/* R2 Checkbox */}
                          <td className="py-2.5 text-center">
                            <button
                              onClick={() => onToggleTopicState(sub.id, topic.id, 'r2Done')}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isR2 ? 'text-indigo-600 hover:bg-indigo-50' : 'text-slate-300 hover:text-slate-400'
                              }`}
                              title={isR2 ? 'R2 Completed' : 'Mark R2 Done'}
                            >
                              <CheckCircle2 className={`w-4 h-4 ${isR2 ? 'fill-indigo-100' : ''}`} />
                            </button>
                          </td>

                          {/* R3 Checkbox */}
                          <td className="py-2.5 text-center">
                            <button
                              onClick={() => onToggleTopicState(sub.id, topic.id, 'r3Done')}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isR3 ? 'text-purple-600 hover:bg-purple-50' : 'text-slate-300 hover:text-slate-400'
                              }`}
                              title={isR3 ? 'R3 Completed' : 'Mark R3 Done'}
                            >
                              <CheckCircle2 className={`w-4 h-4 ${isR3 ? 'fill-purple-100' : ''}`} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Quick Subject Deep Dive CTA */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Showing {displayedTopics.length} of {allTopics.length} topics
                  </span>
                  <button
                    onClick={() => onSelectSubject(sub.id)}
                    className="text-indigo-600 font-bold hover:underline flex items-center space-x-1"
                  >
                    <span>Custom Topics & Notes for {sub.name}</span>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
