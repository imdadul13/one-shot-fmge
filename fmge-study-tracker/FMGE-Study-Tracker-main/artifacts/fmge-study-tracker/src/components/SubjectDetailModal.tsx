import React, { useState } from 'react';
import {
  X,
  BookOpen,
  CheckCircle2,
  Plus,
  Trash2,
  Sparkles,
  Flame,
  Award,
  Save,
  RotateCw
} from 'lucide-react';
import { FMGESubject, TopicItem, ConfidenceLevel, SubjectProgress } from '../types';

interface SubjectDetailModalProps {
  subject: FMGESubject | null;
  isOpen: boolean;
  onClose: () => void;
  progress: SubjectProgress | undefined;
  topicsState: Record<string, Partial<TopicItem>>;
  onToggleTopicState: (subjectId: string, topicId: string, field: 'notesDone' | 'qBankDone' | 'r1Done' | 'r2Done' | 'r3Done') => void;
  onUpdateConfidence: (subjectId: string, confidence: ConfidenceLevel) => void;
  onAddCustomTopic: (subjectId: string, topicName: string, isHighYield: boolean) => void;
  onUpdateSubjectDetails: (subjectId: string, updates: Partial<SubjectProgress>) => void;
}

export const SubjectDetailModal: React.FC<SubjectDetailModalProps> = ({
  subject,
  isOpen,
  onClose,
  progress,
  topicsState,
  onToggleTopicState,
  onUpdateConfidence,
  onAddCustomTopic,
  onUpdateSubjectDetails,
}) => {
  const [newTopicName, setNewTopicName] = useState('');
  const [isHighYieldTopic, setIsHighYieldTopic] = useState(false);
  const [personalNotes, setPersonalNotes] = useState(progress?.personalNotes || '');
  const [qBankSolved, setQBankSolved] = useState(progress?.qBankSolvedCount || 0);
  const [qBankAccuracy, setQBankAccuracy] = useState(progress?.qBankAccuracy || 65);

  if (!isOpen || !subject) return null;

  const allTopics = [...subject.topics, ...(progress?.customTopics || [])];
  const notesCount = allTopics.filter((t) => topicsState[`${subject.id}-${t.id}`]?.notesDone ?? t.notesDone).length;
  const qBankCount = allTopics.filter((t) => topicsState[`${subject.id}-${t.id}`]?.qBankDone ?? t.qBankDone).length;
  const r1Count = allTopics.filter((t) => topicsState[`${subject.id}-${t.id}`]?.r1Done ?? t.r1Done).length;
  const r2Count = allTopics.filter((t) => topicsState[`${subject.id}-${t.id}`]?.r2Done ?? t.r2Done).length;
  const r3Count = allTopics.filter((t) => topicsState[`${subject.id}-${t.id}`]?.r3Done ?? t.r3Done).length;

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    onAddCustomTopic(subject.id, newTopicName.trim(), isHighYieldTopic);
    setNewTopicName('');
    setIsHighYieldTopic(false);
  };

  const handleSaveNotes = () => {
    onUpdateSubjectDetails(subject.id, {
      personalNotes,
      qBankSolvedCount: Number(qBankSolved),
      qBankAccuracy: Number(qBankAccuracy),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div
          className="p-5 text-white flex items-center justify-between shadow-xs"
          style={{ backgroundColor: subject.color }}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-base">
              {subject.code}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold">{subject.name}</h2>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs">
                  ~{subject.weightage} Marks
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-black/20">
                  {subject.phase}
                </span>
              </div>
              <p className="text-xs text-white/90 mt-0.5">{subject.highYieldTips}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stats Bento Strip */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Notes Done</span>
            <span className="text-base font-extrabold text-slate-800">{notesCount} / {allTopics.length}</span>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">R1 Completed</span>
            <span className="text-base font-extrabold text-indigo-700">{r1Count} / {allTopics.length}</span>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">R2 / R3 Done</span>
            <span className="text-base font-extrabold text-indigo-700">{r2Count} / {r3Count}</span>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Confidence</span>
            <select
              value={progress?.confidence || 'not-started'}
              onChange={(e) => onUpdateConfidence(subject.id, e.target.value as ConfidenceLevel)}
              className="text-xs font-bold text-indigo-700 bg-transparent w-full focus:outline-hidden"
            >
              <option value="not-started">Not Started</option>
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="strong">Strong</option>
              <option value="mastered">Mastered</option>
            </select>
          </div>
        </div>

        {/* Body Container */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Topics Checklist */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                <h3 className="text-sm font-bold text-slate-900">Subject Topic Breakdown</h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">{allTopics.length} Total Topics</span>
            </div>

            <div className="space-y-2">
              {allTopics.map((topic) => {
                const key = `${subject.id}-${topic.id}`;
                const saved = topicsState[key] || {};
                const isNotes = saved.notesDone ?? topic.notesDone;
                const isQBank = saved.qBankDone ?? topic.qBankDone;
                const isR1 = saved.r1Done ?? topic.r1Done;
                const isR2 = saved.r2Done ?? topic.r2Done;
                const isR3 = saved.r3Done ?? topic.r3Done;

                return (
                  <div
                    key={topic.id}
                    className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      {topic.isHighYield && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                          HY
                        </span>
                      )}
                      <span className={`font-semibold ${isNotes ? 'text-slate-900' : 'text-slate-600'}`}>
                        {topic.name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 self-end sm:self-center">
                      {/* Notes Button */}
                      <button
                        onClick={() => onToggleTopicState(subject.id, topic.id, 'notesDone')}
                        className={`px-2.5 py-1 rounded-xl font-bold flex items-center space-x-1 transition-colors ${
                          isNotes ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Notes</span>
                      </button>

                      {/* QBank Button */}
                      <button
                        onClick={() => onToggleTopicState(subject.id, topic.id, 'qBankDone')}
                        className={`px-2.5 py-1 rounded-xl font-bold flex items-center space-x-1 transition-colors ${
                          isQBank ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>MCQs</span>
                      </button>

                      {/* R1 */}
                      <button
                        onClick={() => onToggleTopicState(subject.id, topic.id, 'r1Done')}
                        className={`px-2.5 py-1 rounded-xl font-bold flex items-center space-x-1 transition-colors ${
                          isR1 ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        <span>R1</span>
                      </button>

                      {/* R2 */}
                      <button
                        onClick={() => onToggleTopicState(subject.id, topic.id, 'r2Done')}
                        className={`px-2.5 py-1 rounded-xl font-bold flex items-center space-x-1 transition-colors ${
                          isR2 ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        <span>R2</span>
                      </button>

                      {/* R3 */}
                      <button
                        onClick={() => onToggleTopicState(subject.id, topic.id, 'r3Done')}
                        className={`px-2.5 py-1 rounded-xl font-bold flex items-center space-x-1 transition-colors ${
                          isR3 ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        <span>R3</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Custom Topic Input */}
            <form onSubmit={handleAddTopic} className="mt-3 flex items-center space-x-2 text-xs">
              <input
                type="text"
                placeholder="Add custom topic or sub-module..."
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
              <label className="flex items-center space-x-1 cursor-pointer select-none text-slate-600 font-medium">
                <input
                  type="checkbox"
                  checked={isHighYieldTopic}
                  onChange={(e) => setIsHighYieldTopic(e.target.checked)}
                  className="rounded-sm text-indigo-600"
                />
                <span>High Yield</span>
              </label>
              <button
                type="submit"
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* Personal Subject Notepad & QBank Stats */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                <h3 className="text-sm font-bold text-slate-900">Personal Subject Notes & MCQ Stats</h3>
              </div>
              <button
                onClick={handleSaveNotes}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center space-x-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Notes</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Total QBank MCQs Solved</label>
                <input
                  type="number"
                  min="0"
                  value={qBankSolved}
                  onChange={(e) => setQBankSolved(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Subject Accuracy %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={qBankAccuracy}
                  onChange={(e) => setQBankAccuracy(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">
                Key Volatile Points & Revision Checklist for {subject.name}
              </label>
              <textarea
                rows={3}
                placeholder="Write your quick notes, volatile formulas, or teacher references here..."
                value={personalNotes}
                onChange={(e) => setPersonalNotes(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
