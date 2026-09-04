import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Play,
  RotateCcw,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  ZoomIn,
  BookOpen,
  Brain,
  CheckCircle2,
  Stethoscope,
  Activity,
  AlertCircle,
  Layers,
  Table,
  Zap,
  RefreshCw,
  Eye,
  Sparkles,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  AppState,
  PracticeSessionContext,
  FlashcardDeck,
  SlideDeck,
  TopicClinicalCasesDeck,
  TopicHighYieldPearl,
  EducationalVideo,
} from '../types';
import { generateFlashcardDeck } from '../utils/flashcardEngine';
import { generateSlideDeck } from '../utils/slideEngine';
import { generateTopicClinicalCasesDeck } from '../utils/clinicalCaseEngine';
import { generateTopicPearls } from '../utils/pearlEngine';
import { fetchTopicVideoRecommendations, getCuratedVideosForTopic } from '../utils/videoRecommendationEngine';
import { getVerifiedVisualAssetForTopic } from '../utils/visualQuestionEngine';
import { calculateTopicPerformanceMetrics } from '../utils/performanceEngine';
import { getMedicalTopicKnowledge } from '../utils/topicKnowledgeBase';
import { MedicalImageViewerModal } from './MedicalImageViewerModal';

interface TopicMasteryWorkspaceProps {
  subjectId: string;
  topicId: string;
  topicName: string;
  autoDeepen?: boolean;
  state: AppState;
  onClose: () => void;
  onLaunchPracticeMcq: (context: PracticeSessionContext) => void;
  onToggleTopicState: (
    subjectId: string,
    topicId: string,
    field: 'notesDone' | 'qBankDone' | 'r1Done' | 'r2Done' | 'r3Done'
  ) => void;
  onOpenAiCoach?: (
    initialTab?: 'vignette' | 'concept' | 'diagnosis' | 'strategy',
    subjectId?: string,
    topicName?: string
  ) => void;
}

type StepType = 'learn' | 'recall' | 'apply' | 'test' | 'review' | 'master';

const STEPS: { id: StepType; label: string; num: string; desc: string }[] = [
  { id: 'learn', label: 'Rapid Revision', num: '01', desc: 'Core Synthesis & Master Grid' },
  { id: 'recall', label: 'Recall', num: '02', desc: 'Active Flashcards' },
  { id: 'apply', label: 'Apply', num: '03', desc: 'Clinical Cases & IBQ' },
  { id: 'test', label: 'Test', num: '04', desc: '10-MCQ Diagnostic Drill' },
  { id: 'review', label: 'Review', num: '05', desc: 'Mistakes & Traps' },
  { id: 'master', label: 'Master', num: '06', desc: 'Pearls & Retention' },
];

/**
 * Safe fallback component for steps where verified topic content is unavailable.
 */
const ContentUnavailableCard: React.FC<{
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}> = ({
  title = 'Content Unavailable for this Topic',
  message = 'To uphold strict medical exam integrity, unverified or cross-topic content has been withheld for this specific topic.',
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => (
  <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/90 text-center space-y-4 my-4">
    <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700">
      <AlertCircle className="h-6 w-6" />
    </div>
    <div className="space-y-1.5 max-w-md mx-auto">
      <h3 className="text-base font-semibold font-display text-slate-900">{title}</h3>
      <p className="text-xs text-slate-600 leading-relaxed">{message}</p>
    </div>
    {(actionLabel || secondaryActionLabel) && (
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold font-display transition-colors cursor-pointer"
          >
            {actionLabel}
          </button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold font-display transition-colors cursor-pointer"
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
    )}
  </div>
);

export const TopicMasteryWorkspace: React.FC<TopicMasteryWorkspaceProps> = ({
  subjectId,
  topicId,
  topicName,
  autoDeepen = false,
  state,
  onClose,
  onLaunchPracticeMcq,
  onToggleTopicState,
  onOpenAiCoach,
}) => {
  const topicStateKey = `${subjectId}-${topicId}`;
  const activeTopicKeyRef = useRef<string>(`${subjectId}::${topicId}`);
  const currentTopicState = state.topicsState?.[topicStateKey] || {};
  const topicMetrics = useMemo(
    () => calculateTopicPerformanceMetrics(subjectId, topicId, state.mcqAttempts || []),
    [subjectId, topicId, state.mcqAttempts]
  );

  // Verified base topic knowledge
  const baseKnowledge = useMemo(
    () => getMedicalTopicKnowledge(subjectId, topicId, topicName),
    [subjectId, topicId, topicName]
  );

  // Gemini AI Live Deepening State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMasteryData, setAiMasteryData] = useState<any | null>(null);
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [activePackTab, setActivePackTab] = useState<'overview' | 'patho' | 'features' | 'diagnosis' | 'management'>('overview');

  const initialStep: StepType = useMemo(() => {
    if (topicMetrics.totalAttempts >= 10 && topicMetrics.accuracy >= 80 && currentTopicState.r1Done) {
      return 'master';
    }
    if (topicMetrics.totalAttempts > 0 && (topicMetrics.accuracy < 60 || topicMetrics.repeatedErrorsCount > 0)) {
      return 'review';
    }
    if (currentTopicState.notesDone && topicMetrics.totalAttempts === 0) {
      return 'test';
    }
    return 'learn';
  }, [topicMetrics, currentTopicState]);

  const [activeStep, setActiveStep] = useState<StepType>(initialStep);

  // Step 1: Rapid Revision & Slides
  const [videos, setVideos] = useState<EducationalVideo[]>([]);
  const slideDeck = useMemo<SlideDeck>(() => generateSlideDeck(subjectId, topicId, topicName), [subjectId, topicId, topicName]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Step 2: Recall (Flashcards)
  const baseFlashcardDeck = useMemo<FlashcardDeck>(() => generateFlashcardDeck(subjectId, topicId, topicName), [subjectId, topicId, topicName]);
  const flashcardDeck = useMemo<FlashcardDeck>(() => {
    if (aiMasteryData?.flashcards && Array.isArray(aiMasteryData.flashcards) && aiMasteryData.flashcards.length > 0) {
      return {
        topicId,
        topicName,
        subjectId,
        subjectName: subjectId,
        cards: aiMasteryData.flashcards.map((fc: any, idx: number) => ({
          id: `ai-fc-${subjectId}-${topicId}-${idx + 1}`,
          topicId,
          subjectId,
          front: fc.front || 'Question',
          back: fc.back || 'Answer',
          clinicalPearl: fc.clinicalPearl,
          category: 'Gemini AI Rapid Recall',
          difficulty: 'high-yield',
          mastered: false,
          reviewCount: 0,
        })),
        masteredCount: 0,
        totalCards: aiMasteryData.flashcards.length,
      };
    }
    return baseFlashcardDeck;
  }, [aiMasteryData, baseFlashcardDeck, subjectId, topicId, topicName]);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [knownCardIds, setKnownCardIds] = useState<Set<string>>(new Set());
  const [showAllFlashcardsGrid, setShowAllFlashcardsGrid] = useState(false);

  // Step 3: Apply (Clinical Cases)
  const baseCasesDeck = useMemo<TopicClinicalCasesDeck>(() => generateTopicClinicalCasesDeck(subjectId, topicId, topicName), [subjectId, topicId, topicName]);
  const casesDeck = useMemo<TopicClinicalCasesDeck>(() => {
    if (aiMasteryData?.clinicalCases && Array.isArray(aiMasteryData.clinicalCases) && aiMasteryData.clinicalCases.length > 0) {
      return {
        topicId,
        topicName,
        subjectId,
        subjectName: subjectId,
        cases: aiMasteryData.clinicalCases.map((c: any, idx: number) => ({
          id: `ai-case-${subjectId}-${topicId}-${idx + 1}`,
          caseNumber: idx + 1,
          title: c.title || `Clinical Vignette ${idx + 1}`,
          patientDemographics: c.patientDemographics || 'Patient presentation',
          presentation: c.presentation || '',
          physicalExamOrLabs: c.physicalExamOrLabs || '',
          diagnosticQuestion: c.diagnosticQuestion || 'What is the most likely diagnosis or next best step?',
          options: (c.options || []).map((o: any, oIdx: number) => ({
            key: o.key || ['A', 'B', 'C', 'D'][oIdx] || 'A',
            text: o.text || '',
            isCorrect: !!o.isCorrect,
          })),
          correctAnswer: (c.options || []).find((o: any) => o.isCorrect)?.key || 'A',
          clinicalExplanation: c.clinicalExplanation || 'Evidence-based clinical guideline reasoning.',
          examPearl: c.examPearl || '',
          focusArea: 'Gemini AI High-Yield Vignette',
        })),
      };
    }
    return baseCasesDeck;
  }, [aiMasteryData, baseCasesDeck, subjectId, topicId, topicName]);

  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [selectedCaseOption, setSelectedCaseOption] = useState<string | null>(null);
  const [isCaseSubmitted, setIsCaseSubmitted] = useState(false);
  const verifiedVisualAsset = useMemo(() => getVerifiedVisualAssetForTopic(subjectId, topicName), [subjectId, topicName]);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Step 6: Pearls & Mnemonics
  const basePearls: TopicHighYieldPearl[] = useMemo(
    () => generateTopicPearls(subjectId, topicId, topicName),
    [subjectId, topicId, topicName]
  );
  const pearls = useMemo<TopicHighYieldPearl[]>(() => {
    if (aiMasteryData?.pearls && Array.isArray(aiMasteryData.pearls) && aiMasteryData.pearls.length > 0) {
      return aiMasteryData.pearls.map((p: any, idx: number) => ({
        id: `ai-pearl-${subjectId}-${topicId}-${idx + 1}`,
        topicId,
        subjectId,
        statement: p.statement || p.pearl || '',
        category: 'Gemini AI Memory Hook',
        discriminatorTip: p.discriminatorTip,
        examTrapWarning: p.examTrapWarning || p.trap,
      }));
    }
    return basePearls;
  }, [aiMasteryData, basePearls, subjectId, topicId, topicName]);

  // Reset indices and interactive states on topic switch
  useEffect(() => {
    activeTopicKeyRef.current = `${subjectId}::${topicId}`;
    setCurrentSlideIndex(0);
    setCurrentCardIndex(0);
    setIsCardFlipped(false);
    setCurrentCaseIndex(0);
    setSelectedCaseOption(null);
    setIsCaseSubmitted(false);
    setAiMasteryData(null);
    setAiStatus(null);
    setShowAllFlashcardsGrid(false);
  }, [subjectId, topicId, topicName]);

  // Fetch AI Live Deepening Pack
  const fetchGeminiMastery = async () => {
    const requestTopicKey = `${subjectId}::${topicId}`;
    setIsAiLoading(true);
    setAiStatus('Connecting to Gemini AI for live medical deepening...');
    try {
      const res = await fetch('/api/study/topic-mastery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId, topicId, topicName }),
      });
      const result = await res.json();
      if (activeTopicKeyRef.current !== requestTopicKey) {
        return;
      }
      if (result.success && result.data) {
        setAiMasteryData(result.data);
        setAiStatus('✨ Live Gemini AI rapid revision master pack loaded!');
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
      } else {
        const detail = result.error ? `Notice: ${result.error}. ` : '';
        setAiStatus(`${detail}Loaded verified NBE blueprint knowledge base.`);
      }
    } catch {
      if (activeTopicKeyRef.current !== requestTopicKey) {
        return;
      }
      setAiStatus('Serving verified NBE blueprint knowledge base.');
    } finally {
      if (activeTopicKeyRef.current === requestTopicKey) {
        setIsAiLoading(false);
      }
    }
  };

  // Automatically trigger live AI deepening if opened via "Deepen High-Yield"
  useEffect(() => {
    if (autoDeepen && !aiMasteryData && !isAiLoading) {
      fetchGeminiMastery();
    }
  }, [autoDeepen, subjectId, topicId]);

  const stageRailRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const rail = stageRailRef.current;
    const active = rail?.querySelector<HTMLButtonElement>(`[data-step="${activeStep}"]`);
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeStep]);

  useEffect(() => {
    let isMounted = true;
    fetchTopicVideoRecommendations(
      {
        subjectId,
        topicId,
        topicName,
        subjectName: subjectId,
        subjectCode: subjectId.slice(0, 3).toUpperCase(),
        subjectColor: 'var(--color-slate-900)',
        isHighYield: true,
        weightage: 15,
        accuracy: topicMetrics.accuracy,
        recentAccuracy: topicMetrics.recentAccuracy,
        totalAttempts: topicMetrics.totalAttempts,
        repeatedErrorsCount: topicMetrics.repeatedErrorsCount,
        isRevisionDue: false,
        recommendationScore: 80,
        priorityLabel: 'HIGH',
        reasons: ['Core syllabus topic'],
        primaryReason: 'High-Yield study target',
        searchQueries: [`${subjectId} ${topicName} USMLE FMGE lecture`],
      },
      []
    )
      .then((recVideos) => {
        if (!isMounted) return;
        if (recVideos.length > 0) {
          setVideos(recVideos);
        } else {
          setVideos(getCuratedVideosForTopic(subjectId, topicId));
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setVideos(getCuratedVideosForTopic(subjectId, topicId));
      });
    return () => {
      isMounted = false;
    };
  }, [subjectId, topicId, topicName, topicMetrics]);

  const handleSelectCase = (idx: number) => {
    setCurrentCaseIndex(idx);
    setSelectedCaseOption(null);
    setIsCaseSubmitted(false);
  };

  const handleMarkMastered = () => {
    const alreadyMastered = currentTopicState.notesDone && currentTopicState.qBankDone && currentTopicState.r1Done;
    if (alreadyMastered) return;
    onToggleTopicState(subjectId, topicId, 'notesDone');
    onToggleTopicState(subjectId, topicId, 'qBankDone');
    onToggleTopicState(subjectId, topicId, 'r1Done');
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
  };

  // High-Yield Active Data (AI enriched or Base verified)
  const activeSummary = aiMasteryData?.highYieldSummary || baseKnowledge.highYieldSummary;
  const activeCoreConcepts = aiMasteryData?.coreConcepts || baseKnowledge.coreConcepts;
  const activeGoldStandard = aiMasteryData?.goldStandardTest || baseKnowledge.goldStandardTest;
  const activeFirstLine = aiMasteryData?.firstLineTreatment || baseKnowledge.firstLineTreatment;
  const activeClassicPresentation = aiMasteryData?.classicPresentation || baseKnowledge.classicPresentation;
  const activeTriads = aiMasteryData?.diagnosticTriads;
  const activeExamTrap = aiMasteryData?.examTrap || baseKnowledge.examTrap;
  const activeRevisionTable = aiMasteryData?.rapidRevisionTable;
  const activeKeyTakeaways = aiMasteryData?.keyTakeaways || activeCoreConcepts?.slice(0, 4);

  return createPortal(
    <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-xs overflow-y-auto font-sans text-slate-900 animate-in fade-in duration-200">
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4 md:p-6">
        <div className="bg-white rounded-3xl max-w-5xl w-full my-auto max-h-[94vh] flex flex-col shadow-2xl border border-stone-200/90 overflow-hidden">
          {/* ================= EDITORIAL TEXTBOOK HEADER ================= */}
          <header className="p-5 sm:p-7 border-b border-stone-200/80 flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-stone-50/70">
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-stone-400">
                  {subjectId.toUpperCase()} · NBE BLUEPRINT
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-stone-900 text-white text-[10px] font-mono font-medium flex items-center gap-1 shadow-2xs">
                  <Zap className="h-3 w-3 text-amber-400 fill-current" />
                  RAPID REVISION HUB
                </span>
                {aiMasteryData && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                    HIGH-YIELD SYNTHESIS ACTIVE
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-stone-900 truncate">
                {topicName}
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 max-w-2xl">
                High-yield FMGE board core synthesis, active flashcard recall, clinical vignette reasoning, and rapid revision grids.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-start">
              {/* Live Deepening Button */}
              <button
                type="button"
                onClick={fetchGeminiMastery}
                disabled={isAiLoading}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-900 border border-stone-200/90 hover:border-indigo-200 text-xs font-semibold font-display transition-all cursor-pointer shadow-2xs active:scale-[0.98] disabled:opacity-60 min-h-[38px] group"
                title="Comprehensive Gemini-powered study pack"
              >
                {isAiLoading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600 shrink-0" />
                    <span className="text-stone-700">Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 rounded bg-indigo-50/80 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                      <Sparkles className="h-2.5 w-2.5" />
                    </div>
                    <span>{aiMasteryData ? 'Update High-Yield Pack' : 'Deepen High-Yield'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-stone-400 hover:text-stone-900 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          {/* Status Notification Bar */}
          {aiStatus && (
            <div className="px-5 sm:px-6 py-2.5 bg-stone-50 border-b border-stone-200/80 text-xs text-stone-700 font-medium flex items-center justify-between transition-all">
              <span className="flex items-center gap-2 min-w-0">
                {isAiLoading ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600 shrink-0" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                )}
                <span className="font-mono text-xs truncate">{aiStatus}</span>
              </span>
              <button
                type="button"
                onClick={() => setAiStatus(null)}
                className="text-stone-400 hover:text-stone-700 text-xs font-mono uppercase cursor-pointer ml-3 shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* ================= 6-STEP ROADMAP RAIL ================= */}
          <div ref={stageRailRef} className="bg-stone-50/50 border-b border-stone-200/80 px-3 sm:px-6 py-2 overflow-x-auto scrollbar-none">
            <div className="flex items-center justify-start min-w-max gap-1.5">
              {STEPS.map((step, idx) => {
                const isActive = activeStep === step.id;
                const isPast = STEPS.findIndex((s) => s.id === activeStep) > idx;

                return (
                  <button
                    key={step.id}
                    type="button"
                    data-step={step.id}
                    onClick={() => setActiveStep(step.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold font-display transition-all cursor-pointer min-h-[34px] active:scale-[0.98] ${
                      isActive
                        ? 'bg-stone-900 text-white shadow-2xs'
                        : isPast
                        ? 'text-stone-800 bg-stone-200/70 hover:bg-stone-200'
                        : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                    }`}
                  >
                    <span className="font-mono text-[10px] opacity-75">{step.num}</span>
                    <span>{step.label}</span>
                    {isPast && <Check className="h-3 w-3 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================= STEP CONTENT CANVAS ================= */}
          <div className="p-4 sm:p-7 overflow-y-auto flex-1 min-h-0 space-y-7">
            {/* ================= STEP 1: RAPID REVISION & HIGH YIELD CORE ================= */}
            {activeStep === 'learn' && (
              <div className="space-y-7">
                {/* 1. HIGH YIELD RAPID REVISION MASTER CARD */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-stone-900 text-white shadow-2xs">
                        <Zap className="h-4 w-4 text-amber-400 fill-current" />
                      </span>
                      <div>
                        <h3 className="text-base font-bold font-display text-stone-900">
                          Rapid Revision Clinical Blueprint
                        </h3>
                        <p className="text-xs text-stone-500">Board-tested discriminators, gold-standard tests, and DOC</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase font-semibold text-stone-600 bg-stone-50 px-2.5 py-1 rounded-md border border-stone-200">
                      FMGE High Yield
                    </span>
                  </div>

                  {/* High-Yield Clinical Summary */}
                  <div className="space-y-1.5 p-4 rounded-xl bg-stone-50/70 border border-stone-200/60">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-stone-400">
                      High-Yield Pathophysiology & Core Mechanism
                    </span>
                    <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-normal">
                      {activeSummary}
                    </p>
                  </div>

                  {/* Clinical Discriminator 2x2 Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Hallmark Presentation / Triad */}
                    <div className="p-4 rounded-xl bg-sky-50/30 border border-sky-200/70 shadow-2xs space-y-1">
                      <span className="text-xs font-bold font-display text-sky-900 flex items-center gap-1.5">
                        <Stethoscope className="h-3.5 w-3.5 text-sky-600" />
                        Hallmark Presentation & Triad
                      </span>
                      <p className="text-xs text-stone-700 font-normal leading-relaxed">
                        {activeTriads ? `🎯 ${activeTriads} • ` : ''}{activeClassicPresentation}
                      </p>
                    </div>

                    {/* Gold-Standard Investigation */}
                    <div className="p-4 rounded-xl bg-indigo-50/30 border border-indigo-200/70 shadow-2xs space-y-1">
                      <span className="text-xs font-bold font-display text-indigo-900 flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-indigo-600" />
                        Investigation of Choice (IOC) / Gold Standard
                      </span>
                      <p className="text-xs text-stone-700 font-normal leading-relaxed">
                        🔬 {activeGoldStandard}
                      </p>
                    </div>

                    {/* First-Line Management / DOC */}
                    <div className="p-4 rounded-xl bg-emerald-50/30 border border-emerald-200/70 shadow-2xs space-y-1">
                      <span className="text-xs font-bold font-display text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        First-Line Management / Drug of Choice (DOC)
                      </span>
                      <p className="text-xs text-stone-700 font-normal leading-relaxed">
                        💊 {activeFirstLine}
                      </p>
                    </div>

                    {/* Exam Trap Warning */}
                    <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200/70 shadow-2xs space-y-1">
                      <span className="text-xs font-bold font-display text-rose-900 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                        FMGE Board Trap & Lookalike Distractor
                      </span>
                      <p className="text-xs text-rose-950 font-normal leading-relaxed">
                        ⚠️ {activeExamTrap}
                      </p>
                    </div>
                  </div>

                  {/* Core Concept Takeaways */}
                  {activeCoreConcepts && activeCoreConcepts.length > 0 && (
                    <div className="pt-2 border-t border-stone-100 space-y-2">
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-stone-400">
                        Essential Board High-Yield Takeaways
                      </span>
                      <ul className="space-y-1.5 text-xs text-stone-700">
                        {activeCoreConcepts.map((concept: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-stone-900 mt-1.5 shrink-0" />
                            <span>{concept}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* 2. DEEPEN HIGH-YIELD TRIGGER */}
                {!aiMasteryData && (
                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-all">
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="p-2.5 rounded-xl bg-indigo-50/90 text-indigo-700 border border-indigo-200/60 shadow-2xs shrink-0 mt-0.5">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded">
                            GEMINI CLINICAL INTELLIGENCE
                          </span>
                          <span className="text-[10px] font-mono text-stone-400">
                            COMPREHENSIVE · DEEP STUDY
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold font-display text-stone-900">
                          Deepen High-Yield
                        </h3>
                        <p className="text-xs text-stone-600 max-w-xl leading-relaxed">
                          Gemini synthesizes an exhaustive, exam-targeted study pack covering clinical reasoning, IOC gold-standard tests, first-line management, and FMGE board traps.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={fetchGeminiMastery}
                      disabled={isAiLoading}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold font-display transition-all shadow-2xs cursor-pointer shrink-0 disabled:opacity-60 min-h-[42px] active:scale-[0.98]"
                    >
                      {isAiLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin text-indigo-300" />
                          <span>Synthesizing Study Pack...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 text-amber-300" />
                          <span>Deepen High-Yield Pack</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* 3. GEMINI-GENERATED COMPREHENSIVE STUDY PACK (If loaded) */}
                {aiMasteryData && (
                  <div className="p-6 sm:p-7 rounded-2xl bg-white border border-indigo-200/90 shadow-2xs space-y-5 animate-in fade-in duration-300">
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-semibold font-mono uppercase tracking-wider">
                        <Sparkles className="h-3 w-3 text-indigo-600" />
                        Comprehensive Study Pack
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold font-display text-stone-900">
                        {topicName}
                      </h3>

                      {/* Category Pills */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-0.5">
                        {[
                          { id: 'overview', label: 'Overview' },
                          { id: 'patho', label: 'Pathophysiology' },
                          { id: 'features', label: 'Clinical Features' },
                          { id: 'diagnosis', label: 'Diagnosis' },
                          { id: 'management', label: 'Management' },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActivePackTab(tab.id as any)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-display whitespace-nowrap transition-all cursor-pointer min-h-[32px] ${
                              activePackTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-stone-100 hover:bg-stone-200/80 text-stone-700'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Key Takeaways Box */}
                    {activeKeyTakeaways && activeKeyTakeaways.length > 0 && (
                      <div className="p-4 sm:p-5 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold font-display text-indigo-950">
                          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Key Takeaways</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-indigo-950 font-medium">
                          {activeKeyTakeaways.map((point: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Detailed Section Content */}
                    <div className="space-y-4 pt-1">
                      <div className="space-y-1.5">
                        <h4 className="text-sm sm:text-base font-bold font-display text-stone-900">
                          {activePackTab === 'overview' && '1. Overview & Core Definition'}
                          {activePackTab === 'patho' && '2. Pathophysiology & Underlying Mechanism'}
                          {activePackTab === 'features' && '3. Clinical Presentation & Hallmark Signs'}
                          {activePackTab === 'diagnosis' && '4. Diagnostic Workup & Investigations'}
                          {activePackTab === 'management' && '5. Evidence-Based Management Protocol'}
                        </h4>
                        <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-normal">
                          {activePackTab === 'overview' && (aiMasteryData.highYieldSummary || activeSummary)}
                          {activePackTab === 'patho' && (aiMasteryData.coreConcepts?.[0] || activeSummary)}
                          {activePackTab === 'features' && `${activeClassicPresentation} ${activeTriads ? `Diagnostic Triad: ${activeTriads}.` : ''}`}
                          {activePackTab === 'diagnosis' && `Gold Standard / Investigation of Choice: ${activeGoldStandard}. Standard diagnostic confirmation is pivotal for FMGE board scoring.`}
                          {activePackTab === 'management' && `Drug of Choice / First-Line Protocol: ${activeFirstLine}. Adhere to NBE guideline discriminators.`}
                        </p>
                      </div>

                      {/* High-Yield for FMGE Callout Card */}
                      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-3">
                        <Award className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
                        <div>
                          <strong className="font-semibold text-amber-950 block mb-0.5">High-Yield for FMGE:</strong>
                          <span>Focus on diagnostic discriminators, investigation of choice ({activeGoldStandard}), and first-line therapy ({activeFirstLine}). Beware of {activeExamTrap}.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. RAPID REVISION MASTER COMPARISON TABLE */}
                {activeRevisionTable && activeRevisionTable.headers && activeRevisionTable.rows && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Table className="h-4 w-4 text-stone-700" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 font-mono">
                        Rapid Revision Comparison Grid
                      </span>
                    </div>
                    <div className="rounded-xl border border-stone-200 overflow-x-auto shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-100 text-stone-700 font-semibold font-display border-b border-stone-200">
                          <tr>
                            {activeRevisionTable.headers.map((h: string, i: number) => (
                              <th key={i} className="px-4 py-3 whitespace-nowrap">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 bg-white">
                          {activeRevisionTable.rows.map((row: string[], rIdx: number) => (
                            <tr key={rIdx} className="hover:bg-stone-50/80 transition-colors">
                              {row.map((cell: string, cIdx: number) => (
                                <td key={cIdx} className="px-4 py-3 text-stone-800 font-medium">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 5. Curated Medical Video */}
                {videos.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 font-mono">
                      Curated Medical High-Yield Lecture
                    </span>
                    <div className="p-4 rounded-xl bg-stone-50/70 border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold font-display text-stone-900">
                          {videos[0].title}
                        </h4>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {videos[0].channelName} · {videos[0].duration}
                        </p>
                      </div>

                      <a
                        href={videos[0].youtubeUrl || `https://www.youtube.com/watch?v=${videos[0].id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold font-display transition-colors cursor-pointer shrink-0 w-fit min-h-[36px] active:scale-[0.98]"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Watch Lecture</span>
                        <ExternalLink className="h-3 w-3 ml-0.5 opacity-70" />
                      </a>
                    </div>
                  </div>
                )}

                {/* 6. Slides Deck */}
                {slideDeck.slides.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 font-mono">
                        Textbook Notes & Synthesis ({currentSlideIndex + 1} of {slideDeck.slides.length})
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={currentSlideIndex === 0}
                          onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                          className="p-1.5 rounded-lg border border-stone-200 text-stone-600 disabled:opacity-30 hover:bg-stone-50 cursor-pointer"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={currentSlideIndex === slideDeck.slides.length - 1}
                          onClick={() => setCurrentSlideIndex((prev) => Math.min(slideDeck.slides.length - 1, prev + 1))}
                          className="p-1.5 rounded-lg border border-stone-200 text-stone-600 disabled:opacity-30 hover:bg-stone-50 cursor-pointer"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Slide Content Card */}
                    <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-3">
                      <h3 className="text-lg sm:text-xl font-bold font-display text-stone-900">
                        {slideDeck.slides[currentSlideIndex]?.title}
                      </h3>
                      {slideDeck.slides[currentSlideIndex]?.subtitle && (
                        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
                          {slideDeck.slides[currentSlideIndex].subtitle}
                        </p>
                      )}

                      {slideDeck.slides[currentSlideIndex]?.bullets && (
                        <ul className="space-y-1.5 pt-1 text-xs sm:text-sm text-stone-700">
                          {slideDeck.slides[currentSlideIndex].bullets.map((bp, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-stone-900 mt-2 shrink-0" />
                              <span>{bp}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {slideDeck.slides[currentSlideIndex]?.examTrapWarning && (
                        <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200/70 text-xs text-rose-950 space-y-1">
                          <span className="font-semibold text-rose-800 font-display">⚠️ High-Yield Trap:</span>
                          <p>{slideDeck.slides[currentSlideIndex].examTrapWarning}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step Navigation Action */}
                <div className="flex items-center justify-end pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setActiveStep('recall')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold font-display transition-colors cursor-pointer min-h-[42px] shadow-2xs active:scale-[0.98]"
                  >
                    <span>Next: Active Recall ({flashcardDeck.cards.length} Flashcards)</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 2: RECALL (FLASHCARDS) ================= */}
            {activeStep === 'recall' && (
              <div className="space-y-6">
                {flashcardDeck.cards.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 font-mono">
                        Active Recall Flashcards ({currentCardIndex + 1} of {flashcardDeck.cards.length})
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setShowAllFlashcardsGrid((prev) => !prev)}
                          className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                        >
                          <Layers className="h-3.5 w-3.5" />
                          <span>{showAllFlashcardsGrid ? 'Card by Card' : 'Show All Cards'}</span>
                        </button>
                        <span className="font-mono text-xs text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                          {knownCardIds.size} Mastered
                        </span>
                      </div>
                    </div>

                    {!showAllFlashcardsGrid ? (
                      <>
                        {/* Flashcard Component */}
                        <div
                          onClick={() => setIsCardFlipped((prev) => !prev)}
                          className="p-6 sm:p-8 rounded-2xl bg-stone-50/90 hover:bg-stone-100/90 border border-stone-200/90 transition-all duration-200 min-h-[220px] flex flex-col justify-between cursor-pointer group shadow-2xs"
                        >
                          <div className="space-y-3">
                            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-stone-400">
                              {isCardFlipped ? 'Answer & Clinical Rationale' : 'Question Prompt (Click to reveal answer)'}
                            </span>
                            <p className="text-base sm:text-lg font-bold font-display text-stone-900 leading-snug whitespace-pre-line break-words min-w-0">
                              {isCardFlipped
                                ? flashcardDeck.cards[currentCardIndex]?.back
                                : flashcardDeck.cards[currentCardIndex]?.front}
                            </p>
                            {isCardFlipped && flashcardDeck.cards[currentCardIndex]?.clinicalPearl && (
                              <div className="mt-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200/70 text-xs text-amber-900 font-medium">
                                💡 Pearl: {flashcardDeck.cards[currentCardIndex].clinicalPearl}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs text-stone-400 pt-4 border-t border-stone-200/60">
                            <span>Click card to flip</span>
                            <RotateCcw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-300" />
                          </div>
                        </div>

                        {/* Flashcard Actions */}
                        <div className="flex items-center justify-between gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsCardFlipped(false);
                              setCurrentCardIndex((prev) => Math.max(0, prev - 1));
                            }}
                            disabled={currentCardIndex === 0}
                            className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold font-display text-stone-700 disabled:opacity-30 hover:bg-stone-50 cursor-pointer min-h-[40px] active:scale-[0.98]"
                          >
                            Previous Card
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const card = flashcardDeck.cards[currentCardIndex];
                                if (card) {
                                  setKnownCardIds((prev) => new Set([...prev, card.id]));
                                }
                                setIsCardFlipped(false);
                                if (currentCardIndex < flashcardDeck.cards.length - 1) {
                                  setCurrentCardIndex((prev) => prev + 1);
                                } else {
                                  setActiveStep('apply');
                                }
                              }}
                              className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold font-display transition-colors cursor-pointer min-h-[40px] shadow-2xs active:scale-[0.98]"
                            >
                              I Know This ✓
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Show All Cards Grid */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {flashcardDeck.cards.map((card, idx) => (
                          <div key={card.id} className="p-4 sm:p-5 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-2.5">
                            <span className="text-[10px] font-mono font-semibold uppercase text-stone-400">
                              Card {idx + 1}
                            </span>
                            <p className="text-sm font-semibold font-display text-stone-900">
                              {card.front}
                            </p>
                            <div className="p-3 rounded-lg bg-stone-50 border border-stone-200/70 text-xs text-stone-800 font-medium whitespace-pre-line break-words">
                              {card.back}
                            </div>
                            {card.clinicalPearl && (
                              <p className="text-xs text-amber-800 font-normal">
                                💡 {card.clinicalPearl}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-end pt-4 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => setActiveStep('apply')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold font-display transition-colors cursor-pointer min-h-[42px] shadow-2xs active:scale-[0.98]"
                      >
                        <span>Next: Clinical Vignettes</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <ContentUnavailableCard
                    title="Flashcards Unavailable"
                    message={`Verified flashcards matching "${topicName}" have been withheld to prevent cross-topic memorization errors.`}
                    actionLabel="Next: Clinical Reasoning (Cases)"
                    onAction={() => setActiveStep('apply')}
                    secondaryActionLabel={onOpenAiCoach ? "Ask AI Study Coach" : undefined}
                    onSecondaryAction={onOpenAiCoach ? () => onOpenAiCoach('concept', subjectId, topicName) : undefined}
                  />
                )}
              </div>
            )}

            {/* ================= STEP 3: APPLY (CLINICAL CASES) ================= */}
            {activeStep === 'apply' && (
              <div className="space-y-6">
                {casesDeck.cases.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 font-mono">
                        Clinical Vignette Reasoning
                      </span>
                      <span className="font-mono text-xs text-stone-500">
                        Case {currentCaseIndex + 1} of {casesDeck.cases.length}
                      </span>
                    </div>

                    {/* Visual Asset if Available */}
                    {verifiedVisualAsset && (
                      <div className="p-4 rounded-xl bg-stone-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-stone-800">
                        <div className="flex items-center gap-3">
                          <img
                            src={verifiedVisualAsset.imageUrl}
                            alt={topicName}
                            className="h-16 w-24 object-cover rounded-lg border border-stone-700 cursor-pointer"
                            onClick={() => setZoomImage(verifiedVisualAsset.imageUrl)}
                          />
                          <div>
                            <span className="text-[10px] font-mono text-sky-400 uppercase">Image-Based Investigation</span>
                            <h4 className="text-sm font-semibold font-display text-white">{verifiedVisualAsset.title}</h4>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setZoomImage(verifiedVisualAsset.imageUrl)}
                          className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-semibold font-display text-stone-200 inline-flex items-center gap-1.5 min-h-[36px]"
                        >
                          <ZoomIn className="h-3.5 w-3.5" />
                          <span>Fullscreen</span>
                        </button>
                      </div>
                    )}

                    {/* Case Stem */}
                    {casesDeck.cases[currentCaseIndex] && (
                      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-4">
                        <div className="space-y-1.5">
                          <span className="text-xs font-mono font-semibold uppercase text-sky-700">
                            {casesDeck.cases[currentCaseIndex].patientDemographics}
                          </span>
                          <p className="text-sm text-stone-700 leading-relaxed font-normal">
                            {casesDeck.cases[currentCaseIndex].presentation}
                          </p>
                          {casesDeck.cases[currentCaseIndex].physicalExamOrLabs && (
                            <p className="text-xs sm:text-sm text-stone-600 font-medium">
                              {casesDeck.cases[currentCaseIndex].physicalExamOrLabs}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-stone-100 space-y-2">
                          <p className="text-sm font-bold font-display text-stone-900">
                            {casesDeck.cases[currentCaseIndex].diagnosticQuestion}
                          </p>

                          <div className="space-y-2 pt-2">
                            {casesDeck.cases[currentCaseIndex].options.map((opt) => {
                              const optKey = opt.key || (opt as any).optionId;
                              const isSelected = selectedCaseOption === optKey;
                              const isCorrect = optKey === casesDeck.cases[currentCaseIndex].correctAnswer || opt.isCorrect;

                              let style = 'bg-stone-50 border-stone-200 text-stone-800 hover:bg-stone-100/70';
                              if (isCaseSubmitted) {
                                if (isCorrect) {
                                  style = 'bg-emerald-50 border-emerald-300 text-emerald-900';
                                } else if (isSelected) {
                                  style = 'bg-rose-50 border-rose-300 text-rose-900';
                                }
                              } else if (isSelected) {
                                style = 'bg-stone-900 border-stone-900 text-white';
                              }

                              return (
                                <button
                                  key={optKey}
                                  type="button"
                                  onClick={() => !isCaseSubmitted && setSelectedCaseOption(optKey)}
                                  className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between cursor-pointer min-h-[44px] active:scale-[0.99] ${style}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono font-bold">{optKey}.</span>
                                    <span>{opt.text}</span>
                                  </div>
                                  {isCaseSubmitted && isCorrect && <Check className="h-4 w-4 text-emerald-600" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Submission and Explanation */}
                        <div className="pt-2">
                          {!isCaseSubmitted ? (
                            <button
                              type="button"
                              disabled={!selectedCaseOption}
                              onClick={() => setIsCaseSubmitted(true)}
                              className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold font-display transition-colors disabled:opacity-40 cursor-pointer min-h-[40px] active:scale-[0.98]"
                            >
                              Submit Diagnosis
                            </button>
                          ) : (
                            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-xs text-stone-800 space-y-2">
                              <span className="font-semibold text-stone-900 font-display">Clinical Rationale:</span>
                              <p>{casesDeck.cases[currentCaseIndex].clinicalExplanation}</p>
                              {casesDeck.cases[currentCaseIndex].examPearl && (
                                <p className="text-amber-800 font-medium">
                                  💡 Pearl: {casesDeck.cases[currentCaseIndex].examPearl}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => handleSelectCase(Math.max(0, currentCaseIndex - 1))}
                        disabled={currentCaseIndex === 0}
                        className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold font-display text-stone-700 disabled:opacity-30 hover:bg-stone-50 cursor-pointer min-h-[40px] active:scale-[0.98]"
                      >
                        Previous Case
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveStep('test')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold font-display transition-colors cursor-pointer min-h-[42px] shadow-2xs active:scale-[0.98]"
                      >
                        <span>Next: 10-MCQ Diagnostic Drill</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <ContentUnavailableCard
                    title="Clinical Vignettes Unavailable"
                    message={`Verified clinical cases matching "${topicName}" have been withheld to maintain medical diagnostic accuracy.`}
                    actionLabel="Next: 10-MCQ Diagnostic Drill"
                    onAction={() => setActiveStep('test')}
                    secondaryActionLabel={onOpenAiCoach ? "Discuss Topic with AI Coach" : undefined}
                    onSecondaryAction={onOpenAiCoach ? () => onOpenAiCoach('vignette', subjectId, topicName) : undefined}
                  />
                )}
              </div>
            )}

            {/* ================= STEP 4: TEST ================= */}
            {activeStep === 'test' && (
              <div className="space-y-6">
                <div className="p-6 sm:p-8 rounded-2xl bg-stone-50/70 border border-stone-200/90 text-center space-y-4">
                  <div className="h-12 w-12 rounded-xl bg-stone-900 text-white flex items-center justify-center mx-auto shadow-2xs">
                    <Activity className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg sm:text-xl font-bold font-display text-stone-900">
                      10-MCQ Adaptive Examination Drill
                    </h3>
                    <p className="text-xs text-stone-500 max-w-md mx-auto">
                      Authentic FMGE/NBE clinical stems covering {topicName} with distractor rationale and Error Vault logging.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onLaunchPracticeMcq({
                          sessionId: `drill-${Date.now()}`,
                          source: 'dashboard_weak_topic',
                          subjectId,
                          subjectName: subjectId,
                          topicId,
                          topicName,
                          targetQuestionCount: 10,
                        });
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold font-display transition-all shadow-xs cursor-pointer min-h-[44px] active:scale-[0.98]"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Launch 10-MCQ Test Session</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setActiveStep('review')}
                    className="inline-flex items-center gap-2 text-xs font-semibold font-display text-stone-600 hover:text-stone-900 cursor-pointer min-h-[40px]"
                  >
                    <span>Skip to Mistake Review & Traps</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 5: REVIEW ================= */}
            {activeStep === 'review' && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
                  <div className="p-4 rounded-xl bg-stone-50/70 border border-stone-200/80">
                    <span className="text-xl sm:text-2xl font-bold font-display text-stone-900">
                      {topicMetrics.accuracy}%
                    </span>
                    <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">Topic Accuracy</p>
                  </div>
                  <div className="p-4 rounded-xl bg-stone-50/70 border border-stone-200/80">
                    <span className="text-xl sm:text-2xl font-bold font-display text-stone-900">
                      {topicMetrics.totalAttempts}
                    </span>
                    <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">MCQs Solved</p>
                  </div>
                  <div className="p-4 rounded-xl bg-stone-50/70 border border-stone-200/80">
                    <span className="text-xl sm:text-2xl font-bold font-display text-stone-900">
                      {topicMetrics.masteryStatus.toUpperCase()}
                    </span>
                    <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">Mastery Grade</p>
                  </div>
                </div>

                {/* What Needs Review */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 font-mono">
                    Diagnostics & High-Yield Traps
                  </span>
                  <div className="p-4 rounded-xl bg-stone-50/70 border border-stone-200/80 text-xs text-stone-700 space-y-1.5">
                    {topicMetrics.repeatedErrorsCount > 0 ? (
                      <p className="text-rose-700 font-semibold">
                        ⚠️ {topicMetrics.repeatedErrorsCount} repeated mistake(s) registered in Error Vault for this topic.
                      </p>
                    ) : (
                      <p className="text-stone-600">
                        Solid grasp of core clinical criteria. Review volatile memory anchors below before marking as mastered.
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                  {onOpenAiCoach && (
                    <button
                      type="button"
                      onClick={() => onOpenAiCoach('concept', subjectId, topicName)}
                      className="text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer min-h-[40px] inline-flex items-center"
                    >
                      Ask AI Study Coach →
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveStep('master')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold font-display transition-colors cursor-pointer min-h-[42px] shadow-2xs active:scale-[0.98]"
                  >
                    <span>Next: Master Topic & Pearls</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 6: MASTER ================= */}
            {activeStep === 'master' && (
              <div className="space-y-6">
                {/* FMGE Pearls */}
                {pearls.length > 0 ? (
                  <div className="space-y-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 font-mono">
                      High-Yield Pearls & Mnemonics
                    </span>
                    <div className="divide-y divide-stone-100">
                      {pearls.map((p, i) => (
                        <div key={i} className="py-3 text-xs text-stone-800 space-y-1">
                          <strong className="font-bold text-stone-900 font-display text-sm block">
                            {p.statement}
                          </strong>
                          {p.discriminatorTip && <p className="text-stone-500">💡 {p.discriminatorTip}</p>}
                          {p.examTrapWarning && <p className="text-rose-600 font-medium">⚠️ Exam Trap: {p.examTrapWarning}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <ContentUnavailableCard
                    title="High-Yield Pearls Unavailable"
                    message={`Verified high-yield pearls matching "${topicName}" are currently being compiled. Unrelated pearls were withheld.`}
                    actionLabel={onOpenAiCoach ? "Ask AI Study Coach" : undefined}
                    onAction={onOpenAiCoach ? () => onOpenAiCoach('strategy', subjectId, topicName) : undefined}
                  />
                )}

                {/* Topic Status Checklist */}
                <div className="p-4 rounded-xl bg-stone-50/70 border border-stone-200/80 text-xs space-y-2">
                  <span className="font-semibold text-stone-900 font-display">Completed Learning Pathway:</span>
                  <div className="flex flex-wrap items-center gap-4 text-stone-600 font-medium">
                    <span className="flex items-center gap-1">
                      <Check className="h-3.5 w-3.5 text-emerald-600" /> Rapid Revision
                    </span>
                    <span className="flex items-center gap-1">
                      <Check className="h-3.5 w-3.5 text-emerald-600" /> Recall
                    </span>
                    <span className="flex items-center gap-1">
                      <Check className="h-3.5 w-3.5 text-emerald-600" /> Apply
                    </span>
                    <span className="flex items-center gap-1">
                      <Check className="h-3.5 w-3.5 text-emerald-600" /> Test
                    </span>
                    <span className="flex items-center gap-1">
                      <Check className="h-3.5 w-3.5 text-emerald-600" /> Review
                    </span>
                  </div>
                </div>

                {/* Final Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => {
                      onLaunchPracticeMcq({
                        sessionId: `drill-${Date.now()}`,
                        source: 'dashboard_weak_topic',
                        subjectId,
                        subjectName: subjectId,
                        topicId,
                        topicName,
                        targetQuestionCount: 10,
                      });
                    }}
                    className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold font-display transition-colors cursor-pointer min-h-[40px] active:scale-[0.98]"
                  >
                    Retest Topic
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleMarkMastered();
                      onClose();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#006B63] hover:bg-[#00554E] text-white text-xs font-semibold font-display shadow-2xs transition-colors cursor-pointer min-h-[40px] active:scale-[0.98]"
                  >
                    Mark Mastered ✓
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {zoomImage && (
        <MedicalImageViewerModal
          isOpen={true}
          onClose={() => setZoomImage(null)}
          imageUrl={zoomImage}
          title={topicName}
          whatToLookFor="Verified diagnostic visual finding for this clinical concept."
        />
      )}
    </div>,
    document.body
  );
};
