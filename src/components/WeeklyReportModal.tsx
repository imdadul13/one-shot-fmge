import React from 'react';
import {
  X,
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  BarChart3,
  Flame,
  ArrowRight,
  ShieldAlert,
  Target
} from 'lucide-react';
import { WeeklyCommandReport, AppState } from '../types';

interface WeeklyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: WeeklyCommandReport;
  state: AppState;
  onNavigateTab: (tab: any) => void;
  onOpenAiCoach: () => void;
}

export const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({
  isOpen,
  onClose,
  report,
  state,
  onNavigateTab,
  onOpenAiCoach,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold tracking-wider uppercase bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
                  Week {report.weekNumber} Audit
                </span>
                <span className="text-xs text-slate-300">Target: {state.settings.targetScore || 185}/300</span>
              </div>
              <h2 className="text-xl font-black tracking-tight mt-0.5">FMGE Weekly Command Report</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Top 4 Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">Overall Readiness</span>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-2xl font-black text-indigo-950">{report.readinessScore}%</span>
                <span className="text-xs font-bold text-emerald-600">+{report.readinessDelta}% this wk</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">GT Average</span>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-2xl font-black text-slate-900">{report.averageGtScore}</span>
                <span className="text-xs font-semibold text-slate-500">/ 300</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">MCQ Accuracy</span>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-2xl font-black text-emerald-950">{report.mcqAccuracy}%</span>
                <span className="text-xs font-bold text-emerald-600">Active</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Syllabus / Rev</span>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className="text-2xl font-black text-amber-950">{report.syllabusCoverage}%</span>
                <span className="text-xs font-bold text-amber-700">/ {report.revisionCoverage}% R1</span>
              </div>
            </div>
          </div>

          {/* Velocity & Trajectory Banner */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            report.isImprovingFastEnough
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                report.isImprovingFastEnough ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
              }`}>
                {report.isImprovingFastEnough ? <TrendingUp className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider">
                  {report.isImprovingFastEnough ? 'Optimal Improvement Velocity' : 'Improvement Acceleration Needed'}
                </p>
                <p className="text-xs font-medium opacity-90 mt-0.5">
                  {report.improvementVelocityText} • {report.gtTrendText}
                </p>
              </div>
            </div>
          </div>

          {/* Grid 2 Columns: Top Weaknesses & Repeated Errors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Weaknesses */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>Top Subject Vulnerabilities</span>
              </h3>
              <div className="space-y-2.5">
                {report.topWeaknesses.map((w, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{w.subjectName}</p>
                      <p className="text-[11px] text-slate-500">{w.reason}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-rose-50 text-rose-700 border border-rose-200">
                      {w.scorePct}% done
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Repeated Errors */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Top Repeated Errors (20th Notebook)</span>
              </h3>
              <div className="space-y-2.5">
                {report.topRepeatedErrors.length > 0 ? (
                  report.topRepeatedErrors.map((err, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{err.topic}</span>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-md">
                          {err.count}x errors
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 truncate">{err.gist}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    No repeated errors logged yet. Continue logging missed mock test questions.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Next Week Strategic Action Plan */}
          <div className="p-5 rounded-2xl bg-indigo-950 text-white shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                <span>Next 7-Day Command Directives</span>
              </h3>
              <span className="text-[10px] font-bold text-indigo-200 uppercase">Adaptive Allocation</span>
            </div>

            <div className="space-y-2.5">
              {report.nextWeekPriorities.map((pri, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white/10 border border-white/10 flex items-start gap-2 text-xs">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed text-indigo-100">{pri}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              onClose();
              onOpenAiCoach();
            }}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-indigo-600 border border-indigo-200 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask AI Coach About This Report</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Apply Directives
          </button>
        </div>
      </div>
    </div>
  );
};
