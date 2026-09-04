import React from 'react';
import {
  RotateCw,
  Sparkles,
  Calendar,
  Layers,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppState, FMGESubject } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { AppStats } from '../utils/storage';

interface RevisionMatrixViewProps {
  state: AppState;
  stats: AppStats;
  onSelectSubject: (subjectId: string) => void;
  onToggleTopicState: (subjectId: string, topicId: string, field: 'r1Done' | 'r2Done' | 'r3Done') => void;
  onUpdateSubjectRevisionDate: (subjectId: string, date: string) => void;
}

export const RevisionMatrixView: React.FC<RevisionMatrixViewProps> = ({
  state,
  stats,
  onSelectSubject,
  onToggleTopicState,
  onUpdateSubjectRevisionDate,
}) => {
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Bento Header & Milestone Banner */}
      <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-indigo-700/50 shadow-lg space-y-5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/15 backdrop-blur-md text-white rounded-full text-xs font-bold border border-white/20 mb-2">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Multi-Cycle Spaced Repetition Protocol</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Revision Matrix (R1, R2, R3)
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100 max-w-2xl mt-1 leading-relaxed">
              Rapid multi-cycle revisions of high-yield subjects ensure long-term retention for the 300-mark FMGE exam.
            </p>
          </div>

          <button
            onClick={triggerConfetti}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 text-indigo-900 rounded-2xl font-bold text-xs shadow-md transition-all self-start sm:self-center flex items-center space-x-1.5 active:scale-98"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Celebrate Progress</span>
          </button>
        </div>

        {/* 3 Revision Cylinders Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/15 relative z-10">
          {/* Revision 1 */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
            <div className="flex items-center justify-between text-xs text-indigo-200 mb-1">
              <span className="font-bold text-white">Revision 1 (R1 - Foundation)</span>
              <span className="font-bold">{stats.r1Percentage}%</span>
            </div>
            <div className="text-2xl font-black text-white">
              {stats.completedR1Topics} <span className="text-xs font-normal text-indigo-200">/ {stats.totalTopics} Topics</span>
            </div>
            <div className="w-full bg-black/20 h-2 rounded-full mt-2 overflow-hidden">
              <div className="bg-blue-400 h-full rounded-full transition-all" style={{ width: `${stats.r1Percentage}%` }} />
            </div>
            <p className="text-[11px] text-indigo-200 mt-2">Comprehensive 1st pass with notes & PYQs.</p>
          </div>

          {/* Revision 2 */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
            <div className="flex items-center justify-between text-xs text-indigo-200 mb-1">
              <span className="font-bold text-white">Revision 2 (R2 - Rapid Review)</span>
              <span className="font-bold">{stats.r2Percentage}%</span>
            </div>
            <div className="text-2xl font-black text-white">
              {stats.completedR2Topics} <span className="text-xs font-normal text-indigo-200">/ {stats.totalTopics} Topics</span>
            </div>
            <div className="w-full bg-black/20 h-2 rounded-full mt-2 overflow-hidden">
              <div className="bg-indigo-300 h-full rounded-full transition-all" style={{ width: `${stats.r2Percentage}%` }} />
            </div>
            <p className="text-[11px] text-indigo-200 mt-2">High-yield focus + Error notebook drill.</p>
          </div>

          {/* Revision 3 */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
            <div className="flex items-center justify-between text-xs text-indigo-200 mb-1">
              <span className="font-bold text-white">Revision 3 (R3 - Super Rapid)</span>
              <span className="font-bold">{stats.r3Percentage}%</span>
            </div>
            <div className="text-2xl font-black text-white">
              {stats.completedR3Topics} <span className="text-xs font-normal text-indigo-200">/ {stats.totalTopics} Topics</span>
            </div>
            <div className="w-full bg-black/20 h-2 rounded-full mt-2 overflow-hidden">
              <div className="bg-purple-300 h-full rounded-full transition-all" style={{ width: `${stats.r3Percentage}%` }} />
            </div>
            <p className="text-[11px] text-indigo-200 mt-2">Final 10-day volatile formulas & pearls scan.</p>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-[-20px] top-[-20px] w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 19-Subject Multi-Cycle Matrix Bento Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
            <div>
              <h3 className="text-base font-bold text-slate-900">All 19 Subjects Revision Status</h3>
              <p className="text-xs text-slate-500">Monitor completion ratios for R1, R2, and R3 across every medical subject.</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-3">Weightage</th>
                <th className="py-3 px-3">Notes</th>
                <th className="py-3 px-3">Revision 1 (R1)</th>
                <th className="py-3 px-3">Revision 2 (R2)</th>
                <th className="py-3 px-3">Revision 3 (R3)</th>
                <th className="py-3 px-3">Target Date</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {FMGE_SUBJECTS.map((sub) => {
                const subProgress = state.subjectProgress[sub.id];
                const allTopics = [...sub.topics, ...(subProgress?.customTopics || [])];
                
                const notesDone = allTopics.filter((t) => state.topicsState[`${sub.id}-${t.id}`]?.notesDone ?? t.notesDone).length;
                const r1Done = allTopics.filter((t) => state.topicsState[`${sub.id}-${t.id}`]?.r1Done ?? t.r1Done).length;
                const r2Done = allTopics.filter((t) => state.topicsState[`${sub.id}-${t.id}`]?.r2Done ?? t.r2Done).length;
                const r3Done = allTopics.filter((t) => state.topicsState[`${sub.id}-${t.id}`]?.r3Done ?? t.r3Done).length;

                const r1Pct = allTopics.length > 0 ? Math.round((r1Done / allTopics.length) * 100) : 0;
                const r2Pct = allTopics.length > 0 ? Math.round((r2Done / allTopics.length) * 100) : 0;
                const r3Pct = allTopics.length > 0 ? Math.round((r3Done / allTopics.length) * 100) : 0;

                return (
                  <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Subject Name & Color */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2.5">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: sub.color }} />
                        <span className="font-bold text-slate-900">{sub.name}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">({sub.code})</span>
                      </div>
                    </td>

                    {/* Weightage Badge */}
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 text-[11px]">
                        ~{sub.weightage} M
                      </span>
                    </td>

                    {/* Notes Fraction */}
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-slate-700">
                        {notesDone}/{allTopics.length}
                      </span>
                    </td>

                    {/* R1 Progress */}
                    <td className="py-3.5 px-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-blue-700">{r1Done}/{allTopics.length}</span>
                          <span className="text-slate-400 font-semibold">{r1Pct}%</span>
                        </div>
                        <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${r1Pct}%` }} />
                        </div>
                      </div>
                    </td>

                    {/* R2 Progress */}
                    <td className="py-3.5 px-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-indigo-700">{r2Done}/{allTopics.length}</span>
                          <span className="text-slate-400 font-semibold">{r2Pct}%</span>
                        </div>
                        <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${r2Pct}%` }} />
                        </div>
                      </div>
                    </td>

                    {/* R3 Progress */}
                    <td className="py-3.5 px-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-purple-700">{r3Done}/{allTopics.length}</span>
                          <span className="text-slate-400 font-semibold">{r3Pct}%</span>
                        </div>
                        <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-purple-500 h-full rounded-full transition-all" style={{ width: `${r3Pct}%` }} />
                        </div>
                      </div>
                    </td>

                    {/* Target Date Input */}
                    <td className="py-3.5 px-3">
                      <input
                        type="date"
                        value={subProgress?.targetRevisionDate || ''}
                        onChange={(e) => onUpdateSubjectRevisionDate(sub.id, e.target.value)}
                        className="text-[11px] py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => onSelectSubject(sub.id)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
