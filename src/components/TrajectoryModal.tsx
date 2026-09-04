import React from 'react';
import {
  X,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Calendar,
  Clock,
  Target,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { BackwardPlanAnalysis, AppState } from '../types';

interface TrajectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: BackwardPlanAnalysis;
  state: AppState;
  onOpenAiCoach: () => void;
}

export const TrajectoryModal: React.FC<TrajectoryModalProps> = ({
  isOpen,
  onClose,
  analysis,
  state,
  onOpenAiCoach,
}) => {
  if (!isOpen) return null;

  const getStatusBadge = () => {
    switch (analysis.trajectoryStatus) {
      case 'AHEAD':
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          text: 'AHEAD OF TRAJECTORY',
          icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
        };
      case 'ON TRACK':
        return {
          bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
          text: 'PERFECTLY ON TRACK',
          icon: <CheckCircle2 className="w-4 h-4 text-indigo-400" />,
        };
      case 'AT RISK':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          text: 'AT RISK • ACCELERATION NEEDED',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
        };
      default:
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          text: 'BEHIND SCHEDULE • RECOVERY ACTIVE',
          icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-indigo-400">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${statusBadge.bg}`}>
                  {statusBadge.icon}
                  <span>{statusBadge.text}</span>
                </span>
                <span className="text-xs text-slate-300">Phase: {analysis.phaseBadge}</span>
              </div>
              <h2 className="text-xl font-black tracking-tight mt-1">FMGE Backward Plan & Trajectory</h2>
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
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-800">
          {/* Main Trajectory Diagnostic Banner */}
          <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Trajectory Intelligence Assessment</span>
            </h3>
            <p className="text-sm font-medium text-slate-700 leading-relaxed">
              {analysis.trajectoryReason}
            </p>
          </div>

          {/* Core Milestones Comparison Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Syllabus Coverage */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Syllabus Progress</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-2xl font-black text-slate-900">{analysis.syllabusPercentage}%</span>
                <span className="text-xs font-semibold text-slate-500">/ {analysis.expectedSyllabusPercentage}% Exp</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${analysis.syllabusPercentage >= analysis.expectedSyllabusPercentage ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(100, analysis.syllabusPercentage)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {analysis.completedSyllabusTopics} of {analysis.totalSyllabusTopics} topics completed
              </p>
            </div>

            {/* Revision Progress */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Revision Mastery</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-2xl font-black text-slate-900">{analysis.revisionPercentage}%</span>
                <span className="text-xs font-semibold text-slate-500">/ {analysis.expectedRevisionPercentage}% Exp</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${analysis.revisionPercentage >= analysis.expectedRevisionPercentage ? 'bg-indigo-600' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(100, analysis.revisionPercentage)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {analysis.completedRevisions} of {analysis.totalRevisionsNeeded} review cycles
              </p>
            </div>

            {/* GT Score Trajectory */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GT Score Trajectory</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-2xl font-black text-slate-900">{analysis.currentGtAverage}</span>
                <span className="text-xs font-semibold text-slate-500">/ {analysis.targetGtScore} Target</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${analysis.currentGtAverage >= 150 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(100, (analysis.currentGtAverage / 300) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {analysis.currentGtAverage >= 150 ? `+${analysis.currentGtAverage - 150} above cutoff` : `${150 - analysis.currentGtAverage} marks to pass mark`}
              </p>
            </div>
          </div>

          {/* Daily Requirements Section */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-xs">
            <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-amber-400" />
              <span>Backward Target Requirements</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-white/10 border border-white/10">
                <span className="text-[10px] text-slate-300 uppercase font-bold block">Daily MCQ Target</span>
                <span className="text-xl font-black text-amber-300 mt-1 block">{analysis.requiredMcqsPerDay} MCQs / Day</span>
                <span className="text-[11px] text-slate-300">Remaining pool: {analysis.requiredMcqsTotal} MCQs</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/10 border border-white/10">
                <span className="text-[10px] text-slate-300 uppercase font-bold block">Required Grand Tests</span>
                <span className="text-xl font-black text-indigo-300 mt-1 block">{analysis.requiredGtsRemaining} More GTs</span>
                <span className="text-[11px] text-slate-300">Next GT: {analysis.nextGtRecommendedDate}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/10 border border-white/10">
                <span className="text-[10px] text-slate-300 uppercase font-bold block">Final Revision Window</span>
                <span className="text-xl font-black text-emerald-300 mt-1 block">{analysis.finalRevisionWindowDays} Days</span>
                <span className="text-[11px] text-slate-300">Dedicated to high-yield sweeps</span>
              </div>
            </div>
          </div>

          {/* Preparation Phase Rule */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
                {analysis.phaseBadge} Operating Rule
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                {analysis.phaseRule}
              </p>
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
            <span>Ask Coach About Trajectory</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Close Trajectory
          </button>
        </div>
      </div>
    </div>
  );
};
