import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Layers,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Award,
  Sparkles,
  Calendar,
  HelpCircle,
  BarChart3,
  Lightbulb,
} from 'lucide-react';
import {
  CandidateTopicRecommendation,
  ClinicalCaseItem,
  EducationalVideo,
  FlashcardDeck,
  FlashcardItem,
  PracticeSessionContext,
  SlideDeck,
  TopicClinicalCasesDeck,
  TopicHighYieldPearl,
  TopicMasteryLearningPackage,
  VideoInteraction,
} from '../types';
import { generateFlashcardDeck } from '../utils/flashcardEngine';
import { generateSlideDeck } from '../utils/slideEngine';
import { generateTopicClinicalCasesDeck } from '../utils/clinicalCaseEngine';
import { generateTopicPearls } from '../utils/pearlEngine';
import { fetchTopicVideoRecommendations, getCuratedVideosForTopic } from '../utils/videoRecommendationEngine';
import { getNormalizedTopicIntelligence } from '../utils/topicIntelligence';

interface MasterTopicWorkspaceModalProps {
  topicCandidate: CandidateTopicRecommendation;
  existingPackage?: TopicMasteryLearningPackage;
  videoInteractions?: VideoInteraction[];
  onClose: () => void;
  onLaunchPracticeMcq: (context: PracticeSessionContext) => void;
  onUpdateTopicMastery: (pkg: TopicMasteryLearningPackage) => void;
  onRecordVideoView?: (videoId: string, subjectId: string, topicId: string, topicName?: string) => void;
}

type ActiveTab = 'overview' | 'slides' | 'cases' | 'flashcards' | 'video' | 'mastery';

export const MasterTopicWorkspaceModal: React.FC<MasterTopicWorkspaceModalProps> = ({
  topicCandidate,
  existingPackage,
  videoInteractions = [],
  onClose,
  onLaunchPracticeMcq,
  onUpdateTopicMastery,
  onRecordVideoView,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Video State
  const [videos, setVideos] = useState<EducationalVideo[]>([]);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [unusableVideoIds, setUnusableVideoIds] = useState<Set<string>>(new Set());

  // Flashcards State
  const [flashcardDeck, setFlashcardDeck] = useState<FlashcardDeck>(() =>
    generateFlashcardDeck(topicCandidate.subjectId, topicCandidate.topicId, topicCandidate.topicName)
  );
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [masteredCardIds, setMasteredCardIds] = useState<Set<string>>(new Set());

  // Slides State
  const [slideDeck, setSlideDeck] = useState<SlideDeck>(() =>
    generateSlideDeck(topicCandidate.subjectId, topicCandidate.topicId, topicCandidate.topicName)
  );
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Clinical Cases State
  const [casesDeck, setCasesDeck] = useState<TopicClinicalCasesDeck>(() =>
    generateTopicClinicalCasesDeck(topicCandidate.subjectId, topicCandidate.topicId, topicCandidate.topicName)
  );
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [selectedCaseOption, setSelectedCaseOption] = useState<string | null>(null);
  const [isCaseSubmitted, setIsCaseSubmitted] = useState(false);
  const [answeredCases, setAnsweredCases] = useState<Record<number, { selected: string; isCorrect: boolean }>>({});

  // High-Yield Pearls
  const pearls: TopicHighYieldPearl[] = useMemo(
    () => generateTopicPearls(topicCandidate.subjectId, topicCandidate.topicId, topicCandidate.topicName),
    [topicCandidate]
  );

  // Sync state on topic change
  useEffect(() => {
    setFlashcardDeck(generateFlashcardDeck(topicCandidate.subjectId, topicCandidate.topicId, topicCandidate.topicName));
    setSlideDeck(generateSlideDeck(topicCandidate.subjectId, topicCandidate.topicId, topicCandidate.topicName));
    setCasesDeck(generateTopicClinicalCasesDeck(topicCandidate.subjectId, topicCandidate.topicId, topicCandidate.topicName));
    setCurrentCardIndex(0);
    setCurrentSlideIndex(0);
    setCurrentCaseIndex(0);
    setSelectedCaseOption(null);
    setIsCaseSubmitted(false);
    setAnsweredCases({});
    setIsCardFlipped(false);
  }, [topicCandidate.subjectId, topicCandidate.topicId]);

  // Normalized Topic Intel
  const topicIntel = useMemo(
    () => getNormalizedTopicIntelligence(topicCandidate.subjectId, topicCandidate.topicId, topicCandidate.topicName),
    [topicCandidate]
  );

  // Load Videos with Availability Check & Curation Fallback
  useEffect(() => {
    let isMounted = true;
    setIsLoadingVideos(true);

    fetchTopicVideoRecommendations(topicCandidate, videoInteractions)
      .then((recVideos) => {
        if (!isMounted) return;
        const valid = recVideos.filter((v) => !unusableVideoIds.has(v.id));
        if (valid.length > 0) {
          setVideos(valid);
        } else {
          const curated = getCuratedVideosForTopic(topicCandidate.subjectId, topicCandidate.topicId);
          setVideos(curated);
        }
        setIsLoadingVideos(false);
      })
      .catch(() => {
        if (!isMounted) return;
        const curated = getCuratedVideosForTopic(topicCandidate.subjectId, topicCandidate.topicId);
        setVideos(curated);
        setIsLoadingVideos(false);
      });

    return () => {
      isMounted = false;
    };
  }, [topicCandidate]);

  const activeVideo = videos[activeVideoIndex];

  // Handle Video Player Errors (Unavailable video in embed)
  const handleVideoEmbedError = (videoId: string) => {
    setUnusableVideoIds((prev) => new Set([...prev, videoId]));
    setVideos((prev) => {
      const filtered = prev.filter((v) => v.id !== videoId);
      if (activeVideoIndex >= filtered.length) {
        setActiveVideoIndex(Math.max(0, filtered.length - 1));
      }
      return filtered;
    });
  };

  // Flashcard Handlers
  const handleNextCard = () => {
    setIsCardFlipped(false);
    setCurrentCardIndex((prev) => (prev + 1) % flashcardDeck.cards.length);
  };

  const handlePrevCard = () => {
    setIsCardFlipped(false);
    setCurrentCardIndex((prev) => (prev - 1 + flashcardDeck.cards.length) % flashcardDeck.cards.length);
  };

  const handleToggleCardMastered = (cardId: string) => {
    setMasteredCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
    handleNextCard();
  };

  // Mastery Calculation
  const currentMasteryPct = useMemo(() => {
    let score = 0;
    const isVideoDone = Boolean(existingPackage?.videoCompleted || (videos.length > 0 && activeVideoIndex >= 0));
    if (isVideoDone) score += 20;

    const fcTotal = flashcardDeck.cards.length || 1;
    const fcScore = Math.min(30, (masteredCardIds.size / fcTotal) * 30);
    score += fcScore;

    if (currentSlideIndex >= slideDeck.slides.length - 1) score += 20;

    const mcqAccuracy = existingPackage?.mcqAccuracy || topicCandidate.accuracy || 0;
    const mcqScore = Math.min(30, (mcqAccuracy / 100) * 30);
    score += mcqScore;

    return Math.round(Math.min(100, score));
  }, [existingPackage, videos, activeVideoIndex, masteredCardIds, flashcardDeck, currentSlideIndex, slideDeck, topicCandidate]);

  const handleLaunchSession = () => {
    const context: PracticeSessionContext = {
      sessionId: `session-${Date.now()}-${topicCandidate.topicId}`,
      source: 'dashboard_weak_topic',
      subjectId: topicCandidate.subjectId,
      subjectName: topicCandidate.subjectName,
      topicId: topicCandidate.topicId,
      topicName: topicCandidate.topicName,
      targetQuestionCount: 10,
    };
    onLaunchPracticeMcq(context);
  };

  const currentCard = flashcardDeck.cards[currentCardIndex];
  const currentSlide = slideDeck.slides[currentSlideIndex];
  const currentCase = casesDeck.cases[currentCaseIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto font-['Plus_Jakarta_Sans']">
      <div className="bg-[#F8FAFC] border border-slate-200/90 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-200">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs text-xs font-['Outfit']"
              style={{ backgroundColor: topicCandidate.subjectColor || '#0f172a' }}
            >
              {topicCandidate.subjectCode || 'MED'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-['Outfit']">
                  {topicCandidate.subjectName} · {topicCandidate.weightage} Marks
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200 font-['Outfit']">
                  {topicCandidate.priorityLabel}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 font-['Outfit'] line-clamp-1">
                {topicIntel.canonicalName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mastery Score Gauge */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
              <Award className="w-4 h-4 text-emerald-600" />
              <div className="text-xs">
                <span className="text-slate-500 font-medium">Mastery: </span>
                <span className="font-bold text-slate-900 font-['Outfit']">{currentMasteryPct}%</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Close Workspace"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* WORKSPACE NAVIGATION TABS: LEARN -> PRACTICE -> REVIEW -> MASTER */}
        <div className="flex items-center border-b border-slate-200 bg-white px-6 gap-2 overflow-x-auto py-2.5">
          <button
            onClick={() => setActiveTab('slides')}
            className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'slides'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>1. LEARN · Slides ({slideDeck.slides.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cases')}
            className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'cases'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>2. PRACTICE · Cases ({casesDeck.cases.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'flashcards'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3. REVIEW · Flashcards ({masteredCardIds.size}/{flashcardDeck.cards.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>4. MASTER · Blueprint &amp; Pearls ({pearls.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'video'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Video {videos.length > 0 ? `(${videos.length})` : ''}</span>
          </button>

          <button
            onClick={handleLaunchSession}
            className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            <span>Practice 10 MCQs</span>
          </button>
        </div>

        {/* WORKSPACE CONTENT BODY */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#F8FAFC]">
          {/* TAB 1: TOPIC BLUEPRINT & OVERVIEW & HIGH-YIELD PEARLS */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: Diagnostic Signal */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Target Weakness</div>
                  <div className="text-2xl font-bold font-['Outfit'] text-rose-600">
                    {topicCandidate.accuracy}% Accuracy
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {topicCandidate.repeatedErrorsCount > 0
                      ? `${topicCandidate.repeatedErrorsCount} repeated mistakes detected in Error Vault`
                      : 'High-yield FMGE core priority topic'}
                  </div>
                </div>

                {/* Card 2: Concept Clusters */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Key Concepts</div>
                  <div className="text-2xl font-bold font-['Outfit'] text-amber-600">
                    {topicIntel.conceptClusters.length} Core Clusters
                  </div>
                  <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {topicIntel.conceptClusters[0]}
                  </div>
                </div>

                {/* Card 3: Next Action */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Learning Package</div>
                    <div className="text-base font-bold text-emerald-600 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Ready to Study
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Slides + Cases + Flashcards + Pearls + 10 MCQs</div>
                </div>
              </div>

              {/* High-Yield Pearls Section */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  💎 High-Yield FMGE Exam Pearls:
                </h3>
                <div className="space-y-3">
                  {pearls.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-800 bg-amber-50 border border-amber-200 uppercase tracking-wider text-[10px] px-2.5 py-0.5 rounded-md">
                          {p.category}
                        </span>
                        {p.discriminatorTip && (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 font-semibold">
                            {p.discriminatorTip}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium leading-relaxed">{p.statement}</p>
                      {p.examTrapWarning && (
                        <div className="text-xs font-semibold text-rose-800 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                          ⚠️ Exam Trap: {p.examTrapWarning}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Concept Clusters List */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-sky-600" />
                  FMGE High-Yield Concept Pillars to Master:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {topicIntel.conceptClusters.map((cluster, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium"
                    >
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{cluster}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons to begin package */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('slides')}
                  className="flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4" />
                  1. High-Yield Slides ({slideDeck.slides.length})
                </button>
                <button
                  onClick={() => setActiveTab('cases')}
                  className="flex items-center gap-2 px-5 py-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  2. Clinical Cases ({casesDeck.cases.length})
                </button>
                <button
                  onClick={() => setActiveTab('flashcards')}
                  className="flex items-center gap-2 px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
                >
                  <Layers className="w-4 h-4" />
                  3. Flashcards ({flashcardDeck.cards.length})
                </button>
                <button
                  onClick={handleLaunchSession}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition ml-auto cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  4. Practice 10 MCQs
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CLINICAL CASES / CLINICAL VIEWS */}
          {activeTab === 'cases' && currentCase && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Case Progress */}
              <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-200">
                <span className="font-bold text-sky-700 font-['Outfit']">
                  Case {currentCaseIndex + 1} of {casesDeck.cases.length}
                </span>
                <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-bold">
                  {currentCase.focusArea}
                </span>
                <span className="text-slate-600 font-mono font-bold">
                  Score: {Object.values(answeredCases).filter((a) => a.isCorrect).length}/{Object.keys(answeredCases).length}
                </span>
              </div>

              {/* Case Scenario Card */}
              <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200 font-['Outfit']">
                    {currentCase.patientDemographics}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-['Outfit'] mt-2">{currentCase.title}</h3>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed space-y-3">
                  <p>{currentCase.presentation}</p>
                  <p className="font-semibold text-slate-900">{currentCase.physicalExamOrLabs}</p>
                </div>

                <div className="pt-2">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 font-['Outfit'] flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    {currentCase.diagnosticQuestion}
                  </h4>

                  {/* 4 Interactive Options */}
                  <div className="space-y-2.5">
                    {currentCase.options.map((opt) => {
                      const isSelected = selectedCaseOption === opt.key;
                      const isCorrectOpt = opt.key === currentCase.correctAnswer;
                      let btnStyle = 'bg-white border-2 border-slate-200 text-slate-800 hover:border-slate-400 hover:bg-slate-50';

                      if (isCaseSubmitted) {
                        if (isCorrectOpt) {
                          btnStyle = 'bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-500 shadow-sm';
                        } else if (isSelected && !isCorrectOpt) {
                          btnStyle = 'bg-rose-50 border-2 border-rose-400 text-rose-950 font-semibold ring-1 ring-rose-400';
                        } else {
                          btnStyle = 'bg-slate-50/70 border border-slate-200 text-slate-400 opacity-60';
                        }
                      } else if (isSelected) {
                        btnStyle = 'bg-slate-50 border-2 border-slate-900 text-slate-950 font-bold ring-1 ring-slate-900';
                      }

                      return (
                        <button
                          key={opt.key}
                          onClick={() => {
                            if (!isCaseSubmitted) setSelectedCaseOption(opt.key);
                          }}
                          disabled={isCaseSubmitted}
                          className={`w-full p-4 rounded-2xl transition flex items-center justify-between cursor-pointer ${btnStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-7 h-7 rounded-full font-bold text-xs font-['Outfit'] flex items-center justify-center shrink-0 ${
                                isCaseSubmitted && isCorrectOpt
                                  ? 'bg-emerald-600 text-white'
                                  : isCaseSubmitted && isSelected && !isCorrectOpt
                                  ? 'bg-rose-600 text-white'
                                  : isSelected
                                  ? 'bg-slate-900 text-white'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {opt.key}
                            </span>
                            <span className="text-sm font-medium">{opt.text}</span>
                          </div>

                          {isCaseSubmitted && isCorrectOpt && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Submit / Explanation */}
                  {!isCaseSubmitted ? (
                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={() => {
                          if (!selectedCaseOption || !currentCase) return;
                          const isCorrect = selectedCaseOption === currentCase.correctAnswer;
                          setIsCaseSubmitted(true);
                          setAnsweredCases((prev) => ({
                            ...prev,
                            [currentCaseIndex]: { selected: selectedCaseOption, isCorrect },
                          }));
                        }}
                        disabled={!selectedCaseOption}
                        className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                      >
                        Submit Diagnosis
                      </button>
                    </div>
                  ) : (
                    <div className="mt-5 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            selectedCaseOption === currentCase.correctAnswer
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {selectedCaseOption === currentCase.correctAnswer ? '✓ Correct Diagnosis' : '✗ Incorrect Choice'}
                        </span>
                        <span className="text-xs text-slate-600">
                          Correct Answer: <strong className="text-emerald-700">Option {currentCase.correctAnswer}</strong>
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{currentCase.clinicalExplanation}</p>
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
                        <strong className="text-amber-800">⚡ Clinical Pearl: </strong>
                        {currentCase.examPearl}
                      </div>
                    </div>
                  )}
                </div>

                {/* Case Navigation Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <button
                    disabled={currentCaseIndex === 0}
                    onClick={() => {
                      if (currentCaseIndex > 0) {
                        const prevIdx = currentCaseIndex - 1;
                        setCurrentCaseIndex(prevIdx);
                        const existing = answeredCases[prevIdx];
                        setSelectedCaseOption(existing ? existing.selected : null);
                        setIsCaseSubmitted(Boolean(existing));
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 disabled:opacity-30 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous Case
                  </button>

                  <span className="text-xs text-slate-500 font-medium">
                    {currentCaseIndex + 1} / {casesDeck.cases.length}
                  </span>

                  {currentCaseIndex < casesDeck.cases.length - 1 ? (
                    <button
                      onClick={() => {
                        const nextIdx = currentCaseIndex + 1;
                        setCurrentCaseIndex(nextIdx);
                        const existing = answeredCases[nextIdx];
                        setSelectedCaseOption(existing ? existing.selected : null);
                        setIsCaseSubmitted(Boolean(existing));
                      }}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition shadow-sm cursor-pointer"
                    >
                      Next Case
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleLaunchSession}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition shadow-sm cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Proceed to 10 MCQs
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VIDEO PLAYER WITH REAL EMBED & AVAILABILITY FALLBACK */}
          {activeTab === 'video' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {isLoadingVideos ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
                  <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-sm text-slate-500 font-medium">Retrieving verified medical lectures...</p>
                </div>
              ) : videos.length > 0 && activeVideo ? (
                <div>
                  {/* YouTube Embed Container */}
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-200 shadow-lg">
                    <iframe
                      src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=0&rel=0&modestbranding=1`}
                      title={activeVideo.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      onError={() => handleVideoEmbedError(activeVideo.id)}
                      className="w-full h-full"
                    />
                  </div>

                  {/* Video Metadata & Controls */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                        <span className="font-bold text-slate-800">{activeVideo.channelName}</span>
                        <span>•</span>
                        <span>{activeVideo.duration}</span>
                        {activeVideo.isCurated && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Faculty Verified
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 font-['Outfit'] line-clamp-1">{activeVideo.title}</h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {videos.length > 1 && (
                        <div className="flex items-center gap-1.5 mr-2">
                          <span className="text-xs text-slate-500 font-mono font-medium">
                            {activeVideoIndex + 1}/{videos.length}
                          </span>
                          <button
                            disabled={activeVideoIndex === 0}
                            onClick={() => setActiveVideoIndex((p) => p - 1)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            disabled={activeVideoIndex >= videos.length - 1}
                            onClick={() => setActiveVideoIndex((p) => p + 1)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <a
                        href={activeVideo.youtubeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-bold transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open on YouTube
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-900 font-['Outfit'] mb-1">Live Embed Currently Unavailable</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
                    External streaming servers did not return an active embed for this topic. Use the direct search link or proceed to high-yield flashcards and MCQs.
                  </p>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                      `FMGE ${topicCandidate.subjectName} ${topicCandidate.topicName} revision`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Search on YouTube Directly
                  </a>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: HIGH-YIELD FLASHCARD ENGINE */}
          {activeTab === 'flashcards' && currentCard && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Flashcard Header Progress */}
              <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-200">
                <span className="font-medium">
                  Card {currentCardIndex + 1} of {flashcardDeck.cards.length}
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold">
                  {currentCard.category}
                </span>
                <span className="font-bold text-emerald-700">
                  {masteredCardIds.size} Mastered ({Math.round((masteredCardIds.size / flashcardDeck.cards.length) * 100)}%)
                </span>
              </div>

              {/* Interactive Flashcard Card */}
              <div
                onClick={() => setIsCardFlipped((p) => !p)}
                className={`cursor-pointer min-h-[260px] sm:min-h-[300px] p-8 rounded-3xl border-2 transition-all duration-300 flex flex-col justify-between select-none bg-white shadow-sm hover:shadow-md ${
                  isCardFlipped
                    ? 'border-emerald-500 ring-2 ring-emerald-100'
                    : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-['Outfit']">
                      {isCardFlipped ? 'Answer & Explanation' : 'Clinical Question / Fact'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <RotateCcw className="w-3.5 h-3.5" />
                      Click to {isCardFlipped ? 'show Question' : 'Flip Card'}
                    </span>
                  </div>

                  {!isCardFlipped ? (
                    <p className="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed font-['Outfit']">
                      {currentCard.front}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-lg sm:text-xl font-bold text-emerald-800 leading-relaxed whitespace-pre-line font-['Outfit']">
                        {currentCard.back}
                      </p>
                      {currentCard.clinicalPearl && (
                        <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
                          <span className="font-bold text-amber-800">⚡ High-Yield Pearl: </span>
                          {currentCard.clinicalPearl}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-400 mt-4 text-center font-medium">
                  {isCardFlipped ? 'Tap below if you know this or need review' : 'Think of the answer, then click to flip'}
                </div>
              </div>

              {/* Flashcard Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={handlePrevCard}
                  className="p-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer shadow-xs"
                  title="Previous Card"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleNextCard}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    Review Again Later
                  </button>

                  <button
                    onClick={() => handleToggleCardMastered(currentCard.id)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
                      masteredCardIds.has(currentCard.id)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {masteredCardIds.has(currentCard.id) ? 'Mastered ✓' : 'Mark as Mastered'}
                  </button>
                </div>

                <button
                  onClick={handleNextCard}
                  className="p-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer shadow-xs"
                  title="Next Card"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: VISUAL SLIDE CRASH-COURSE MODULE */}
          {activeTab === 'slides' && currentSlide && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Slide Progress */}
              <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-200">
                <span className="font-medium">
                  Slide {currentSlideIndex + 1} of {slideDeck.slides.length}
                </span>
                <span className="font-bold text-slate-900 font-['Outfit']">{currentSlide.subtitle}</span>
              </div>

              {/* Slide Content Card */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm min-h-[340px] flex flex-col justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-['Outfit'] mb-4 flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                      {currentSlide.slideNumber}
                    </span>
                    {currentSlide.title}
                  </h3>

                  {/* Bullet Points */}
                  <ul className="space-y-3 mb-5">
                    {currentSlide.bullets.map((b, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed font-medium">
                        <span className="w-2 h-2 rounded-full bg-slate-900 mt-2 shrink-0"></span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Quick Comparison Table if present */}
                  {currentSlide.quickTable && (
                    <div className="overflow-x-auto my-4 rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
                          <tr>
                            {currentSlide.quickTable.headers.map((h, i) => (
                              <th key={i} className="px-4 py-3">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-800">
                          {currentSlide.quickTable.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50/60">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="px-4 py-3 font-medium">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Key Takeaways */}
                  {currentSlide.keyTakeaways && currentSlide.keyTakeaways.length > 0 && (
                    <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-950 mt-4 font-medium leading-relaxed">
                      <span className="font-bold text-sky-900">💡 Key Takeaway: </span>
                      {currentSlide.keyTakeaways.join(' • ')}
                    </div>
                  )}

                  {/* Exam Trap Warning */}
                  {currentSlide.examTrapWarning && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-950 mt-4 font-medium leading-relaxed">
                      <span className="font-bold text-rose-900">⚠️ Exam Trap to Avoid: </span>
                      {currentSlide.examTrapWarning}
                    </div>
                  )}
                </div>

                {/* Slide Footer Navigation */}
                <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-200">
                  <button
                    disabled={currentSlideIndex === 0}
                    onClick={() => setCurrentSlideIndex((p) => p - 1)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 disabled:opacity-30 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous Slide
                  </button>

                  <span className="text-xs text-slate-500 font-mono font-medium">
                    {currentSlideIndex + 1} / {slideDeck.slides.length}
                  </span>

                  {currentSlideIndex < slideDeck.slides.length - 1 ? (
                    <button
                      onClick={() => setCurrentSlideIndex((p) => p + 1)}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition shadow-sm cursor-pointer"
                    >
                      Next Slide
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleLaunchSession}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition shadow-sm cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Proceed to 10 MCQs
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* WORKSPACE FOOTER */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Subject: {topicCandidate.subjectName}</span>
            <span>•</span>
            <span>Weightage: {topicCandidate.weightage} marks</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
            >
              Close Workspace
            </button>
            <button
              onClick={handleLaunchSession}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition shadow-sm rounded-xl cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              Start 10 MCQs Practice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
