import React from 'react';
import {
  RotateCw,
  Calendar,
  Layers,
} from 'lucide-react';
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
  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans']">
      {/* Header & Overview Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold uppercase tracking-wider mb-2 font-['Outfit']">
            <span>Spaced Repetition</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold font-['Outfit'] text-slate-900">
            Revision Matrix (R1, R2, R3)
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-0.5 leading-relaxed">
            Multi-cycle revisions of high-yield subjects to ensure long-term retention for the 300-mark FMGE exam.
          </p>
        </div>

        {/* 3 Revision Cylinders */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
          {/* Revision 1 */}
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900 font-['Outfit']">R1 · Foundation</span>
              <span className="font-bold text-slate-800 font-mono text-xs">{stats.r1Percentage}%</span>
            </div>
            <div className="text-xl font-bold text-slate-900 font-['Outfit']">
              {stats.completedR1Topics} <span className="text-xs font-normal text-slate-400">/ {stats.totalTopics} Topics</span>
            </div>
            <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
              <div className="bg-slate-900 h-full rounded-full transition-all" style={{ width: `${stats.r1Percentage}%` }} />
            </div>
            <p className="text-[11px] text-slate-500">1st pass with notes &amp; core MCQs.</p>
          </div>

          {/* Revision 2 */}
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900 font-['Outfit']">R2 · Rapid Review</span>
              <span className="font-bold text-slate-800 font-mono text-xs">{stats.r2Percentage}%</span>
            </div>
            <div className="text-xl font-bold text-slate-900 font-['Outfit']">
              {stats.completedR2Topics} <span className="text-xs font-normal text-slate-400">/ {stats.totalTopics} Topics</span>
            </div>
            <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
              <div className="bg-slate-900 h-full rounded-full transition-all" style={{ width: `${stats.r2Percentage}%` }} />
            </div>
            <p className="text-[11px] text-slate-500">High-yield focus + Error notebook drill.</p>
          </div>

          {/* Revision 3 */}
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900 font-['Outfit']">R3 · Final Sprint</span>
              <span className="font-bold text-slate-800 font-mono text-xs">{stats.r3Percentage}%</span>
            </div>
            <div className="text-xl font-bold text-slate-900 font-['Outfit']">
              {stats.completedR3Topics} <span className="text-xs font-normal text-slate-400">/ {stats.totalTopics} Topics</span>
            </div>
            <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
              <div className="bg-slate-900 h-full rounded-full transition-all" style={{ width: `${stats.r3Percentage}%` }} />
            </div>
            <p className="text-[11px] text-slate-500">Final high-yield sprint &amp; pearls.</p>
          </div>
        </div>
      </div>

      {/* 19-Subject Multi-Cycle Matrix */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold font-['Outfit'] text-slate-900">19 Subjects Revision Matrix</h3>
            <p className="text-xs text-slate-500">Completion ratios for R1, R2, and R3 across every medical subject.</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {FMGE_SUBJECTS.map((sub) => {
            const subProgress = state.subjectProgress[sub.id];
            const allTopics = [...sub.topics, ...(subProgress?.customTopics || [])];
            const r1 = allTopics.filter((t) => state.topicsState[`${sub.id}-${t.id}`]?.r1Done ?? t.r1Done).length;
            const r2 = allTopics.filter((t) => state.topicsState[`${sub.id}-${t.id}`]?.r2Done ?? t.r2Done).length;
            const r3 = allTopics.filter((t) => state.topicsState[`${sub.id}-${t.id}`]?.r3Done ?? t.r3Done).length;
            const total = Math.max(1, allTopics.length);

            const r1Pct = Math.round((r1 / total) * 100);
            const r2Pct = Math.round((r2 / total) * 100);
            const r3Pct = Math.round((r3 / total) * 100);

            return (
              <div
                key={sub.id}
                className="p-3.5 sm:p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectSubject(sub.id)}
                      className="text-xs sm:text-sm font-semibold text-slate-900 hover:text-slate-700 text-left cursor-pointer"
                    >
                      {sub.name}
                    </button>
                    <span className="text-[10px] font-mono text-slate-400">
                      {sub.weightage}M
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {allTopics.length} Topics
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-sans font-bold">R1:</span>
                    <span className="font-semibold text-slate-800">{r1Pct}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-sans font-bold">R2:</span>
                    <span className="font-semibold text-slate-800">{r2Pct}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-sans font-bold">R3:</span>
                    <span className="font-semibold text-slate-800">{r3Pct}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
