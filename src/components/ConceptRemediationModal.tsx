import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  RotateCcw,
  BookOpen,
  Layers,
  Award,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Check,
  Calendar,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AppState, PracticeSessionQuestion } from '../types';
import {
  ConceptRemediationPackage,
  processRemediationResult,
} from '../utils/errorRemediationEngine';
import confetti from 'canvas-confetti';

interface ConceptRemediationModalProps {
  remediationPackage: ConceptRemediationPackage;
  onClose: () => void;
  onUpdateAppState: (updater: (prev: AppState) => AppState) => void;
}

type RemediationTab = 'explanation' | 'slides' | 'flashcards' | 'case' | 'retest';

export const ConceptRemediationModal: React.FC<ConceptRemediationModalProps> = ({
  remediationPackage,
  onClose,
  onUpdateAppState,
}) => {
  const [activeTab, setActiveTab] = useState<RemediationTab>('explanation');

  // Slides State
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);

  // Flashcards State
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [knownCardIds, setKnownCardIds] = useState<Set<string>>(new Set());

  // Clinical Case State
  const [selectedCaseOptId, setSelectedCaseOptId] = useState<string | null>(null);
  const [isCaseSubmitted, setIsCaseSubmitted] = useState(false);

  // Retest State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [retestAttempts, setRetestAttempts] = useState<
    Array<{ questionId: string; isCorrect: boolean; selectedAnswer: string; correctAnswer: string }>
  >([]);
  const [isRetestComplete, setIsRetestComplete] = useState(false);
  const [remediationOutcome, setRemediationOutcome] = useState<{
    status: 'mastered' | 'improving' | 'weak' | 'needs_remediation';
    statusLabel: string;
    nextRevisionDate: string;
  } | null>(null);

  const slides = remediationPackage.slides || [];
  const flashcards = remediationPackage.flashcards || [];
  const clinicalCase = remediationPackage.clinicalCase;
  const retestQuestions = remediationPackage.retestQuestions || [];

  const currentQuestion: PracticeSessionQuestion | undefined = retestQuestions[currentQuestionIdx];

  // Submit Answer for single question
  const handleSubmitRetestAnswer = () => {
    if (!selectedAnswer || !currentQuestion || isAnswerSubmitted) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    setIsAnswerSubmitted(true);

    const newAttempt = {
      questionId: currentQuestion.id,
      isCorrect,
      selectedAnswer,
      correctAnswer: currentQuestion.correctAnswer,
    };

    const updatedAttempts = [...retestAttempts, newAttempt];
    setRetestAttempts(updatedAttempts);

    if (isCorrect) {
      confetti({
        particleCount: 20,
        spread: 45,
        origin: { y: 0.7 },
      });
    }
  };

  // Move to next question or complete retest
  const handleNextRetestQuestion = () => {
    if (currentQuestionIdx + 1 < retestQuestions.length) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    } else {
      // Complete Retest
      const correctCount = retestAttempts.filter((a) => a.isCorrect).length;
      setIsRetestComplete(true);

      onUpdateAppState((prevState) => {
        const result = processRemediationResult(
          prevState,
          remediationPackage.subjectId,
          remediationPackage.topicId,
          remediationPackage.conceptId,
          correctCount,
          retestQuestions.length,
          retestAttempts
        );
        setRemediationOutcome({
          status: result.remediationStatus,
          statusLabel: result.statusLabel,
          nextRevisionDate: result.nextRevisionDate,
        });
        return result.updatedState;
      });

      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.5 },
      });
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white border border-slate-200/80 rounded-3xl w-full my-auto max-w-3xl overflow-hidden shadow-2xl text-slate-900 flex flex-col max-h-[92vh]"
      >
        {/* ================= MODAL HEADER ================= */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center font-bold">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold font-['Outfit']">
                  Closed-Loop Remediation
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold font-['Outfit']">
                  {remediationPackage.subjectName} → {remediationPackage.topicName}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold font-['Outfit'] text-slate-900 tracking-tight mt-1">
                Fix Concept: {remediationPackage.conceptName}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ================= NAVIGATION TABS ================= */}
        <div className="px-5 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          <button
            onClick={() => setActiveTab('explanation')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-['Outfit'] flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTab === 'explanation'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Quick Explanation</span>
          </button>

          <button
            onClick={() => setActiveTab('slides')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-['Outfit'] flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTab === 'slides'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Crash Slides ({slides.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('flashcards')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-['Outfit'] flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTab === 'flashcards'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Flashcards ({flashcards.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('case')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-['Outfit'] flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTab === 'case'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Clinical Case</span>
          </button>

          <button
            onClick={() => setActiveTab('retest')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-['Outfit'] flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTab === 'retest'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            <span>Targeted Retest ({retestQuestions.length}Q)</span>
          </button>
        </div>

        {/* ================= BODY CONTENT ================= */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
          {/* TAB 1: QUICK EXPLANATION */}
          {activeTab === 'explanation' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200">
                <span className="text-[10px] uppercase font-bold text-sky-700 tracking-wider block mb-1 font-['Outfit']">
                  Why you&apos;re seeing this:
                </span>
                <p className="text-xs text-sky-900 leading-relaxed font-medium">
                  {remediationPackage.whyItMatters}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-['Outfit']">Core Fact</span>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {remediationPackage.quickExplanation.coreFact}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-['Outfit']">Pathophysiology / Mechanism</span>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {remediationPackage.quickExplanation.mechanism}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-['Outfit']">Clinical Presentation</span>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {remediationPackage.quickExplanation.clinicalCorrelation}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-rose-700 block font-['Outfit']">Common Exam Trap</span>
                  <p className="text-xs text-rose-900 leading-relaxed font-medium">
                    {remediationPackage.quickExplanation.commonTrap}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  onClick={() => setActiveTab('slides')}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <span>Continue to Crash Slides</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CRASH SLIDES */}
          {activeTab === 'slides' && slides.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold">Slide {currentSlideIdx + 1} of {slides.length}</span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentSlideIdx === 0}
                    onClick={() => setCurrentSlideIdx((prev) => Math.max(0, prev - 1))}
                    className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={currentSlideIdx === slides.length - 1}
                    onClick={() => setCurrentSlideIdx((prev) => Math.min(slides.length - 1, prev + 1))}
                    className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 min-h-[220px] flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold font-['Outfit'] text-slate-900">
                    {slides[currentSlideIdx].title}
                  </h3>
                  {slides[currentSlideIdx].subtitle && (
                    <p className="text-xs text-sky-600 font-semibold mt-0.5">
                      {slides[currentSlideIdx].subtitle}
                    </p>
                  )}

                  <ul className="mt-4 space-y-2">
                    {slides[currentSlideIdx].bullets.map((bullet, idx) => (
                      <li key={idx} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setActiveTab('explanation')}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={() => setActiveTab('flashcards')}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>Next: Flashcards</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: FLASHCARDS */}
          {activeTab === 'flashcards' && flashcards.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Card {currentCardIdx + 1} of {flashcards.length}</span>
                <span className="font-semibold text-emerald-700">{knownCardIds.size} Mastered</span>
              </div>

              <div
                onClick={() => setIsCardFlipped(!isCardFlipped)}
                className="p-8 rounded-3xl bg-white border-2 border-slate-200 hover:border-slate-400 cursor-pointer min-h-[220px] flex flex-col justify-center items-center text-center space-y-3 transition-all shadow-sm select-none"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-['Outfit']">
                  {isCardFlipped ? 'Answer & Explanation' : 'Question (Click to Flip)'}
                </span>

                <p className="text-base font-bold font-['Outfit'] text-slate-900 max-w-lg leading-relaxed">
                  {isCardFlipped ? flashcards[currentCardIdx].back : flashcards[currentCardIdx].front}
                </p>

                {isCardFlipped && flashcards[currentCardIdx].clinicalPearl && (
                  <p className="text-xs text-sky-700 font-medium max-w-md pt-2 border-t border-slate-100">
                    💡 {flashcards[currentCardIdx].clinicalPearl}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    setIsCardFlipped(false);
                    setCurrentCardIdx((prev) => (prev > 0 ? prev - 1 : flashcards.length - 1));
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Previous
                </button>

                <button
                  onClick={() => {
                    const cardId = flashcards[currentCardIdx].id;
                    setKnownCardIds((prev) => new Set([...prev, cardId]));
                    setIsCardFlipped(false);
                    if (currentCardIdx + 1 < flashcards.length) {
                      setCurrentCardIdx((prev) => prev + 1);
                    } else {
                      setActiveTab('case');
                    }
                  }}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>I Know This</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: CLINICAL CASE */}
          {activeTab === 'case' && clinicalCase && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold font-['Outfit']">
                    Case Vignette
                  </span>
                  <h4 className="text-sm font-bold font-['Outfit'] text-slate-900">{clinicalCase.title}</h4>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {clinicalCase.presentation}
                </p>

                {clinicalCase.physicalExamOrLabs && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500 font-['Outfit']">Key Clinical Findings:</span>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {clinicalCase.physicalExamOrLabs}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-900">{clinicalCase.diagnosticQuestion}</p>
                <div className="space-y-2">
                  {clinicalCase.options.map((option) => {
                    const isSelected = selectedCaseOptId === option.optionId;
                    const isCorrect = option.optionId === clinicalCase.correctOptionId;

                    return (
                      <button
                        key={option.optionId}
                        disabled={isCaseSubmitted}
                        onClick={() => setSelectedCaseOptId(option.optionId)}
                        className={`w-full p-3 rounded-xl text-left text-xs font-medium border transition-all cursor-pointer flex items-center justify-between ${
                          isCaseSubmitted
                            ? isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                              : isSelected
                              ? 'bg-rose-50 border-rose-300 text-rose-900 font-semibold'
                              : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                            : isSelected
                            ? 'bg-sky-50 border-sky-400 text-sky-900 font-semibold'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                            {option.key}
                          </span>
                          <span>{option.text}</span>
                        </div>
                        {isCaseSubmitted && isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {isCaseSubmitted && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-bold text-slate-900 block text-[10px] uppercase font-['Outfit']">Clinical Breakdown &amp; Pearl:</span>
                  <p className="text-slate-700 leading-relaxed">{clinicalCase.clinicalExplanation}</p>
                  <p className="text-sky-800 font-semibold text-[11px] pt-1">💡 {clinicalCase.examPearl}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                {!isCaseSubmitted ? (
                  <button
                    disabled={!selectedCaseOptId}
                    onClick={() => setIsCaseSubmitted(true)}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs disabled:opacity-40 cursor-pointer shadow-sm"
                  >
                    Submit Case Answer
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab('retest')}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>Proceed to Retest</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: TARGETED RETEST */}
          {activeTab === 'retest' && (
            <div className="space-y-4">
              {!isRetestComplete && currentQuestion ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold text-slate-900">
                      Question {currentQuestionIdx + 1} of {retestQuestions.length}
                    </span>
                    <span className="text-emerald-700 font-bold font-mono">
                      {retestAttempts.filter((a) => a.isCorrect).length} Correct
                    </span>
                  </div>

                  {/* Question Box */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                      {currentQuestion.question}
                    </p>
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    {currentQuestion.options.map((opt) => {
                      const isSelected = selectedAnswer === opt.key;
                      const isCorrect = opt.key === currentQuestion.correctAnswer;

                      return (
                        <button
                          key={opt.optionId}
                          disabled={isAnswerSubmitted}
                          onClick={() => setSelectedAnswer(opt.key)}
                          className={`w-full p-3.5 rounded-xl text-left text-xs font-medium border transition-all cursor-pointer flex items-center justify-between ${
                            isAnswerSubmitted
                              ? isCorrect
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold'
                                : isSelected
                                ? 'bg-rose-50 border-rose-400 text-rose-900 font-semibold'
                                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                              : isSelected
                              ? 'bg-sky-50 border-sky-400 text-sky-900 font-semibold'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                              {opt.key}
                            </span>
                            <span>{opt.text}</span>
                          </div>

                          {isAnswerSubmitted && isCorrect && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation after submit */}
                  {isAnswerSubmitted && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 animate-in fade-in">
                      <span className="font-bold text-slate-900 text-[10px] uppercase font-['Outfit']">Explanation:</span>
                      <p className="text-slate-700 leading-relaxed">{currentQuestion.explanation}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-end pt-2">
                    {!isAnswerSubmitted ? (
                      <button
                        disabled={!selectedAnswer}
                        onClick={handleSubmitRetestAnswer}
                        className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs disabled:opacity-40 cursor-pointer shadow-sm"
                      >
                        Submit Answer
                      </button>
                    ) : (
                      <button
                        onClick={handleNextRetestQuestion}
                        className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <span>{currentQuestionIdx + 1 < retestQuestions.length ? 'Next Question' : 'View Results'}</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* RETEST COMPLETE RESULTS SCREEN */
                <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-4 my-2 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
                    <Award className="h-7 w-7" />
                  </div>

                  <div>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase font-['Outfit']">
                      {remediationOutcome?.statusLabel || 'RETEST COMPLETE'}
                    </span>
                    <h3 className="text-xl font-bold font-['Outfit'] text-slate-900 mt-2">
                      Score: {retestAttempts.filter((a) => a.isCorrect).length} / {retestQuestions.length} Correct (
                      {Math.round(
                        (retestAttempts.filter((a) => a.isCorrect).length / (retestQuestions.length || 1)) * 100
                      )}
                      %)
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    Closed-loop remediation completed. Your MCQ attempt history, Error Vault records, and Topic Mastery have been updated immediately.
                  </p>

                  {remediationOutcome?.nextRevisionDate && (
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                      <Calendar className="h-3.5 w-3.5 text-sky-600" />
                      <span>Next Spaced Revision scheduled for: <strong>{remediationOutcome.nextRevisionDate}</strong></span>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={onClose}
                      className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                    >
                      Done &amp; Return to Error Vault
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Remediating concept gaps permanently eliminates recurring exam mistakes.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
      </div>
    </div>,
    document.body
  );
};
