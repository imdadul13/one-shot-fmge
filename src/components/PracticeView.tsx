import React, { useState, useMemo } from 'react';
import {
  Play,
  Search,
  ChevronDown,
  Target,
  BookOpen,
  Layers,
  TrendingUp,
  Stethoscope,
  X,
} from 'lucide-react';
import { AppState, ErrorNotebookItem, DailyTask } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';

interface PracticeViewProps {
  state: AppState;
  onLaunchPracticeSession: (
    subjectId: string,
    topicId: string,
    topicName: string,
    subtopic?: string
  ) => void;
  onAddErrorItem: (item: ErrorNotebookItem) => void;
  onOpenAiCoach: (initialTab?: 'vignette' | 'concept' | 'diagnosis') => void;
  onUpdateAppState: (updater: (prev: AppState) => AppState) => void;
  onAddTask?: (task: DailyTask) => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({
  onLaunchPracticeSession,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('medicine');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const selectedSubject = useMemo(() => {
    if (selectedSubjectId === 'all') return null;
    return FMGE_SUBJECTS.find((s) => s.id === selectedSubjectId) || FMGE_SUBJECTS[0];
  }, [selectedSubjectId]);

  // Filter topics based on subject and search query
  const displayedTopics = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (selectedSubjectId === 'all') {
      const all: Array<{
        subjectId: string;
        subjectName: string;
        subjectWeightage: number;
        id: string;
        name: string;
        isHighYield: boolean;
      }> = [];

      FMGE_SUBJECTS.forEach((sub) => {
        sub.topics.forEach((t) => {
          if (!query || t.name.toLowerCase().includes(query) || sub.name.toLowerCase().includes(query)) {
            all.push({
              subjectId: sub.id,
              subjectName: sub.name,
              subjectWeightage: sub.weightage,
              id: t.id,
              name: t.name,
              isHighYield: Boolean(t.isHighYield),
            });
          }
        });
      });
      return all;
    }

    if (!selectedSubject) return [];

    return selectedSubject.topics
      .filter((t) => !query || t.name.toLowerCase().includes(query))
      .map((t) => ({
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.name,
        subjectWeightage: selectedSubject.weightage,
        id: t.id,
        name: t.name,
        isHighYield: Boolean(t.isHighYield),
      }));
  }, [selectedSubjectId, selectedSubject, searchQuery]);

  return (
    <div className="page-container space-y-6 sm:space-y-8 font-['Inter'] text-[#121e1b] max-w-7xl mx-auto">
      {/* ================= EDITORIAL HEADER & INSPIRATIONAL BANNER ================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 pt-1">
        <header className="space-y-2.5 max-w-2xl">
          {/* Eyebrows */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md bg-[#E8F5F1] text-[#006B63] border border-[#006B63]/20 text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider">
              PRACTICE
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-[#F0F3F2] text-[#4A5553] border border-[#DCE4E1] text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider">
              CLINICAL VIGNETTES
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold font-['Newsreader'] tracking-tight text-[#121e1b]">
            Clinical Vignettes &amp; Practice Drills
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm lg:text-base text-[#3d4947] leading-relaxed">
            10-MCQ clinical vignette drills with instant distractor breakdowns, active recall testing, and concept remediation.
          </p>
        </header>

        {/* Motivational / Inspirational Card */}
        <div className="flex items-center justify-between gap-4 p-4 lg:p-5 rounded-2xl bg-gradient-to-br from-[#F0FDF8] via-[#F7FAF9] to-[#EEF7F4] border border-[#D5E4DE] shadow-2xs md:max-w-xs lg:max-w-sm shrink-0">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm lg:text-[15px] font-semibold font-['Newsreader'] italic text-[#121e1b] leading-snug">
              &ldquo;Practice today. A stronger you tomorrow.&rdquo;
            </p>
            <p className="text-[10px] sm:text-[11px] font-mono text-[#006B63] font-medium tracking-wide uppercase">
              ONE SHOT FMGE · EXAM READY
            </p>
          </div>
          <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-[#006B63]/10 text-[#006B63] flex items-center justify-center shrink-0 border border-[#006B63]/20">
            <Stethoscope className="w-5 h-5 stroke-[1.75]" />
          </div>
        </div>
      </div>

      {/* ================= SUBJECT NAVIGATION & CONTROLS ================= */}
      <div className="space-y-4">
        {/* Horizontal Subject Scrollbar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          <button
            type="button"
            onClick={() => setSelectedSubjectId('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer border ${
              selectedSubjectId === 'all'
                ? 'bg-[#006B63] text-white border-[#006B63] shadow-xs'
                : 'bg-white hover:bg-[#F7F9F8] text-[#3d4947] hover:text-[#121e1b] border-[#DCE4E1]'
            }`}
          >
            <span>All Subjects</span>
          </button>

          {FMGE_SUBJECTS.map((sub) => {
            const isSelected = sub.id === selectedSubjectId;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#006B63] text-white border-[#006B63] shadow-xs'
                    : 'bg-white hover:bg-[#F7F9F8] text-[#3d4947] hover:text-[#121e1b] border-[#DCE4E1]'
                }`}
              >
                <span>{sub.name}</span>
                <span className="ml-1 text-[10px] font-mono opacity-80">({sub.weightage}M)</span>
              </button>
            );
          })}
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#66716F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics or modules..."
              className="w-full pl-10 pr-9 py-2 sm:py-2.5 rounded-xl bg-white border border-[#DCE4E1] hover:border-[#B6C8C3] focus:border-[#006B63] focus:ring-2 focus:ring-[#006B63]/10 text-xs sm:text-sm text-[#121e1b] placeholder:text-[#66716F] transition-all outline-none shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#66716F] hover:text-[#121e1b] transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Subject Selector Dropdown */}
          <div className="relative shrink-0 sm:w-56">
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full appearance-none pl-3.5 pr-8 py-2 sm:py-2.5 rounded-xl bg-white border border-[#DCE4E1] hover:border-[#B6C8C3] focus:border-[#006B63] text-xs sm:text-sm font-medium text-[#121e1b] cursor-pointer outline-none transition-all shadow-2xs"
            >
              <option value="all">All Subjects ({FMGE_SUBJECTS.length})</option>
              {FMGE_SUBJECTS.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.weightage}M)
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#66716F] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ================= TOPICS & DRILLS CONTAINER ================= */}
      <div className="clinical-card p-5 sm:p-7 lg:p-8 space-y-4 sm:space-y-6 bg-white rounded-3xl border border-[#DCE4E1] shadow-2xs">
        {/* Container Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F0F3F2] text-xs font-semibold uppercase tracking-wider text-[#66716F] font-mono">
          <span>
            {selectedSubject ? `${selectedSubject.name} High-Yield Modules` : 'High-Yield Clinical Modules'}
          </span>
          <span className="hidden sm:inline">10-MCQ Clinical Drill</span>
        </div>

        {/* Topics List */}
        {displayedTopics.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-sm font-medium text-[#66716F]">
              No modules found matching &ldquo;{searchQuery}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedSubjectId('medicine');
              }}
              className="text-xs font-semibold text-[#006B63] hover:underline cursor-pointer"
            >
              Reset filters to Medicine
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#F0F3F2]">
            {displayedTopics.map((topic) => (
              <div
                key={`${topic.subjectId}-${topic.id}`}
                className="py-4 px-2 sm:px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-[#F7F9F8] rounded-xl transition-all group"
              >
                {/* Topic Info */}
                <div className="min-w-0 pr-2 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-semibold font-['Newsreader'] text-[#121e1b] group-hover:text-[#006B63] transition-colors leading-snug">
                      {topic.name}
                    </span>
                    {topic.isHighYield && (
                      <span className="px-2 py-0.5 rounded-full bg-[#E8F5F1] text-[#006B63] border border-[#006B63]/20 text-[9px] font-mono font-bold uppercase tracking-wider shrink-0">
                        HIGH YIELD
                      </span>
                    )}
                    {selectedSubjectId === 'all' && (
                      <span className="px-2 py-0.5 rounded-md bg-[#F0F3F2] text-[#4A5553] text-[10px] font-mono shrink-0">
                        {topic.subjectName} · {topic.subjectWeightage}M
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#66716F] leading-relaxed">
                    Standard FMGE clinical vignette distribution · 10 questions with distractor analysis
                  </p>
                </div>

                {/* Primary Action Button */}
                <button
                  type="button"
                  onClick={() => onLaunchPracticeSession(topic.subjectId, topic.id, topic.name)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#006B63] hover:bg-[#005049] text-white text-xs font-semibold shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer shrink-0 self-start sm:self-center"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Start 10-MCQs</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= EXAM VALUE PILLARS & FEATURE SECTION ================= */}
      <div className="pt-2 border-t border-[#EAEFEA]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 items-stretch">
          {/* Pillar 1 */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#DCE4E1] flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-[#006B63]/10 text-[#006B63] flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#121e1b]">Real Exam Format</h4>
              <p className="text-[11px] text-[#66716F]">10-MCQ clinical vignettes</p>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#DCE4E1] flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-[#006B63]/10 text-[#006B63] flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#121e1b]">Detailed Explanations</h4>
              <p className="text-[11px] text-[#66716F]">Understand every concept</p>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#DCE4E1] flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-[#006B63]/10 text-[#006B63] flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#121e1b]">Distractor Analysis</h4>
              <p className="text-[11px] text-[#66716F]">Learn from every option</p>
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#DCE4E1] flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-[#006B63]/10 text-[#006B63] flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#121e1b]">Track Your Progress</h4>
              <p className="text-[11px] text-[#66716F]">Get better, every day</p>
            </div>
          </div>

          {/* Pillar 5 / Quote Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#F0FDF8] to-[#F7FAF9] border border-[#D5E4DE] flex items-center justify-between gap-2 sm:col-span-2 lg:col-span-1 shadow-2xs">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold font-['Newsreader'] italic text-[#121e1b] leading-tight">
                &ldquo;Practice with purpose. Perform with confidence.&rdquo;
              </p>
            </div>
            <span className="text-base shrink-0">🌱</span>
          </div>
        </div>
      </div>
    </div>
  );
};

