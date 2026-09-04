import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  Zap,
  BookOpen,
  Award,
  ChevronRight,
  ShieldCheck,
  Check,
  ZoomIn,
  Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  PracticeSessionContext,
  PracticeSessionQuestion,
  PracticeSessionSummary,
  MedicalImageAsset,
} from '../types';
import { NewMcqAttemptInput } from '../utils/performanceEngine';
import { fetchPracticeSessionQuestions } from '../utils/practiceSessionEngine';
import { MedicalImageViewerModal } from './MedicalImageViewerModal';

interface PracticeMcqSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: PracticeSessionContext | null;
  onRecordAttempt?: (input: NewMcqAttemptInput) => void;
}

export const PracticeMcqSessionModal: React.FC<PracticeMcqSessionModalProps> = ({
  isOpen,
  onClose,
  context,
  onRecordAttempt,
}) => {
  const [questions, setQuestions] = useState<PracticeSessionQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeModalImage, setActiveModalImage] = useState<{
    isOpen: boolean;
    imageUrl: string;
    annotatedImageUrl?: string;
    imageAsset?: MedicalImageAsset;
    title?: string;
    whatToLookFor?: string;
  }>({
    isOpen: false,
    imageUrl: '',
  });

  // User answers map: index -> { selectedAnswer, isCorrect, timeTakenSeconds }
  const [userAnswers, setUserAnswers] = useState<
    Record<number, { selectedAnswer: string; isCorrect: boolean; timeTakenSeconds: number }>
  >({});
  const [sessionSummary, setSessionSummary] = useState<PracticeSessionSummary | null>(null);
  const [isReviewingMistakes, setIsReviewingMistakes] = useState<boolean>(false);
  const [reviewMistakeIdx, setReviewMistakeIdx] = useState<number>(0);

  const questionStartTimeRef = useRef<number>(Date.now());
  const [activeElapsedSeconds, setActiveElapsedSeconds] = useState<number>(0);

  // Live timer for the current question
  useEffect(() => {
    if (!isOpen || isLoading || sessionSummary || isAnswerSubmitted) {
      return;
    }
    setActiveElapsedSeconds(0);
    const timer = setInterval(() => {
      setActiveElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, isLoading, sessionSummary, currentIdx, isAnswerSubmitted]);

  const formatSeconds = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Load questions whenever modal opens with fresh context
  useEffect(() => {
    if (!isOpen || !context) {
      setQuestions([]);
      setCurrentIdx(0);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setUserAnswers({});
      setSessionSummary(null);
      setIsReviewingMistakes(false);
      setActiveElapsedSeconds(0);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setErrorMessage(null);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setUserAnswers({});
    setSessionSummary(null);
    setIsReviewingMistakes(false);
    setActiveElapsedSeconds(0);

    fetchPracticeSessionQuestions(context)
      .then((loadedQuestions) => {
        if (!isCancelled) {
          if (loadedQuestions.length === 0) {
            setErrorMessage('Could not load practice questions for this topic. Please try again.');
          } else {
            setQuestions(loadedQuestions);
            setCurrentIdx(0);
            questionStartTimeRef.current = Date.now();
            setActiveElapsedSeconds(0);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to load practice session:', err);
          setErrorMessage('Error loading questions. Please try again.');
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, context?.sessionId]);

  if (!isOpen || !context) return null;

  const currentQ: PracticeSessionQuestion | undefined = questions[currentIdx];
  const targetCount = questions.length || context.targetQuestionCount || 10;
  const progressPct = Math.round(((currentIdx + 1) / targetCount) * 100);

  // Derived stats from real user answers
  const answersList = Object.values(userAnswers);
  const answeredCount = answersList.length;
  const liveCorrectCount = answersList.filter((a) => a.isCorrect).length;
  const liveAccuracy = answeredCount > 0 ? Math.round((liveCorrectCount / answeredCount) * 100) : null;
  const totalRecordedTime = answersList.reduce((acc, a) => acc + a.timeTakenSeconds, 0);
  const liveAvgTime = answeredCount > 0 ? Math.round(totalRecordedTime / answeredCount) : null;

  const handleSelectOption = (key: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(key);
  };

  const handleSubmitAnswer = () => {
    if (!currentQ || !selectedOption || isAnswerSubmitted) return;

    const timeTaken = Math.max(1, Math.round((Date.now() - questionStartTimeRef.current) / 1000));
    const isCorrect = selectedOption === currentQ.correctAnswer;

    // 1. Record in local component session map
    setUserAnswers((prev) => ({
      ...prev,
      [currentIdx]: {
        selectedAnswer: selectedOption,
        isCorrect,
        timeTakenSeconds: timeTaken,
      },
    }));

    // 2. Commit attempt to master performance engine
    onRecordAttempt?.({
      questionId: currentQ.id,
      subjectId: context.subjectId,
      topicId: context.topicId,
      topicName: context.topicName,
      subtopic: currentQ.subtopic || context.subtopic,
      isCorrect,
      selectedAnswer: selectedOption,
      correctAnswer: currentQ.correctAnswer,
      timeTakenSeconds: timeTaken,
      difficulty: 'high-yield',
      confidence: 'high',
      source: 'recommended_video_practice',
      sessionId: context.sessionId,
      isImageBased: Boolean(currentQ.imageUrl),
      imageCategory: currentQ.imageAsset?.imageCategory || currentQ.mediaType,
      imageUrl: currentQ.imageUrl,
      imageAssetId: currentQ.imageAsset?.assetId,
    });

    setIsAnswerSubmitted(true);
  };

  const handleSkipQuestion = () => {
    if (!currentQ || isAnswerSubmitted) return;
    const timeTaken = Math.max(1, Math.round((Date.now() - questionStartTimeRef.current) / 1000));

    setUserAnswers((prev) => ({
      ...prev,
      [currentIdx]: {
        selectedAnswer: 'SKIPPED',
        isCorrect: false,
        timeTakenSeconds: timeTaken,
      },
    }));

    onRecordAttempt?.({
      questionId: currentQ.id,
      subjectId: context.subjectId,
      topicId: context.topicId,
      topicName: context.topicName,
      isCorrect: false,
      selectedAnswer: 'SKIPPED',
      correctAnswer: currentQ.correctAnswer,
      timeTakenSeconds: timeTaken,
      difficulty: 'high-yield',
      source: 'recommended_video_practice',
      sessionId: context.sessionId,
    });

    handleNextQuestion();
  };

  const handleNextQuestion = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      questionStartTimeRef.current = Date.now();
    } else {
      // Session Complete -> Compute Summary
      const answersList = Object.values(userAnswers);
      const totalAnswered = answersList.length;
      const correctCount = answersList.filter((a) => a.isCorrect).length;
      const incorrectCount = totalAnswered - correctCount;
      const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
      const totalTime = answersList.reduce((acc, a) => acc + a.timeTakenSeconds, 0);
      const avgTime = totalAnswered > 0 ? Math.round(totalTime / totalAnswered) : 0;

      const userAnswersFormatted: Record<string, { selectedAnswer: string; selectedOptionId?: string; isCorrect: boolean; timeTakenSeconds: number }> = {};
      Object.entries(userAnswers).forEach(([idx, ans]) => {
        userAnswersFormatted[idx] = ans;
      });

      setSessionSummary({
        sessionId: context.sessionId,
        subjectId: context.subjectId,
        subjectName: context.subjectName,
        topicId: context.topicId,
        topicName: context.topicName,
        totalQuestions: questions.length,
        correctCount,
        incorrectCount,
        accuracy,
        totalTimeSeconds: totalTime,
        averageTimeSeconds: avgTime,
        questions,
        userAnswers: userAnswersFormatted,
        weakConceptsDetected: [],
      });

      if (accuracy >= 80) {
        confetti({
          particleCount: 60,
          spread: 80,
          origin: { y: 0.5 },
        });
      }
    }
  };

  const handlePracticeAgain = () => {
    setIsLoading(true);
    setSessionSummary(null);
    setIsReviewingMistakes(false);
    setUserAnswers({});
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);

    const freshContext: PracticeSessionContext = {
      ...context,
      sessionId: `session-${Date.now()}`,
    };

    fetchPracticeSessionQuestions(freshContext).then((loaded) => {
      setQuestions(loaded);
      setIsLoading(false);
      questionStartTimeRef.current = Date.now();
    });
  };

  const missedQuestionIndices = sessionSummary
    ? questions
        .map((_, i) => i)
        .filter((i) => !sessionSummary.userAnswers[i]?.isCorrect)
    : [];

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-md overflow-y-auto font-['Inter'] text-[#121E1B]">
      <div className="flex min-h-full items-center justify-center p-0 sm:p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.2 }}
        className="bg-[#FBFDFB] sm:rounded-3xl max-w-5xl w-full h-full sm:h-auto sm:max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border-0 sm:border border-[#DCE4E1]"
      >
        {/* MODAL HEADER */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#F0F3F2] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            {/* Monospace Badge Counter [1/10] */}
            <div className="px-2.5 py-1 rounded-lg bg-[#E8F5F1] border border-[#006B63]/20 font-mono text-xs font-bold text-[#006B63] shrink-0 tracking-tight">
              [{currentIdx + 1}/{targetCount}]
            </div>

            {/* Subject & Topic Breadcrumb */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-[11px] font-medium text-[#66716F]">
                <span className="font-mono font-bold uppercase tracking-wider text-[#121E1B] bg-[#F5F7F8] px-2 py-0.5 rounded border border-[#EAEFEA]">
                  {context.subjectName}
                </span>
                <span className="text-[#A4B1AE]">/</span>
                <span className="truncate max-w-[140px] sm:max-w-[260px] md:max-w-xs text-[#3D4947]">
                  {context.topicName}
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-semibold font-['Newsreader'] text-[#121E1B] truncate mt-0.5">
                {sessionSummary
                  ? 'Session Performance Summary'
                  : `Question ${currentIdx + 1} of ${targetCount}`}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F5F7F8] hover:bg-[#EAEFEA] text-[#66716F] hover:text-[#121E1B] flex items-center justify-center transition-colors cursor-pointer shrink-0 border border-[#DCE4E1]"
            title="Close practice session"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PROGRESS BAR */}
        {!sessionSummary && !isLoading && (
          <div className="w-full bg-[#F0F3F2] h-1 overflow-hidden shrink-0">
            <div
              className="bg-[#006B63] h-full transition-all duration-300 rounded-r-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}

        {/* MOBILE COMPACT STATS STRIP (Screens <lg) */}
        {!sessionSummary && !isLoading && currentQ && (
          <div className="flex lg:hidden items-center justify-between px-4 py-2 bg-[#F5F7F8] border-b border-[#F0F3F2] text-xs font-mono text-[#66716F] shrink-0">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#006B63]" />
              <span className="font-bold text-[#121E1B]">{formatSeconds(activeElapsedSeconds)}</span>
            </div>
            <span>
              Q {currentIdx + 1} of {targetCount}
            </span>
            <span>
              {liveAccuracy !== null ? `${liveAccuracy}% accuracy` : `${progressPct}% completed`}
            </span>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
          {isLoading ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-8 h-8 border-2 border-[#006B63] border-t-transparent rounded-full animate-spin mx-auto" />
              <div>
                <p className="text-sm font-bold text-[#121E1B]">
                  Preparing 10 Targeted High-Yield MCQs...
                </p>
                <p className="text-xs text-[#66716F] mt-1">
                  Topic: {context.subjectName} → {context.topicName}
                </p>
              </div>
            </div>
          ) : errorMessage ? (
            <div className="py-12 text-center space-y-4">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <p className="text-sm text-[#121E1B] font-semibold">{errorMessage}</p>
              <button
                type="button"
                onClick={handlePracticeAgain}
                className="px-4 py-2 rounded-xl bg-[#006B63] text-white text-xs font-bold hover:bg-[#005049] transition-colors cursor-pointer"
              >
                Retry Loading
              </button>
            </div>
          ) : sessionSummary ? (
            /* ================= SESSION SUMMARY VIEW (PRESERVED) ================= */
            <div className="space-y-6">
              {/* Score Banner */}
              <div className="p-6 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-5">
                <div>
                  <span className="text-[10px] font-bold text-sky-300 uppercase tracking-widest">
                    10-MCQ Reinforcement Complete
                  </span>
                  <h3 className="font-display text-2xl font-bold font-['Outfit'] text-white mt-1">
                    {sessionSummary.accuracy >= 80
                      ? 'Outstanding Mastery, Doctor!'
                      : sessionSummary.accuracy >= 60
                      ? 'Solid Progress — Review Weak Areas'
                      : 'High-Yield Gap Detected'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    {context.subjectName} · {context.topicName}
                  </p>
                </div>

                {/* Score Dial */}
                <div className="flex items-center gap-4 bg-white/10 px-5 py-3 rounded-2xl backdrop-blur-xs border border-white/15">
                  <div className="text-center">
                    <span className="text-3xl font-extrabold font-['Outfit'] text-sky-300">
                      {sessionSummary.correctCount}
                    </span>
                    <span className="text-slate-400 font-bold">/{sessionSummary.totalQuestions}</span>
                    <span className="block text-[10px] text-slate-300 uppercase font-semibold">Correct</span>
                  </div>
                  <div className="h-8 w-px bg-white/20" />
                  <div className="text-center">
                    <span className="text-3xl font-extrabold font-['Outfit'] text-white">
                      {sessionSummary.accuracy}%
                    </span>
                    <span className="block text-[10px] text-slate-300 uppercase font-semibold">Accuracy</span>
                  </div>
                </div>
              </div>

              {/* Performance Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-medium block">Avg Response Time</span>
                  <span className="text-base font-bold text-slate-900 mt-1 block">
                    {sessionSummary.averageTimeSeconds}s / question
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-medium block">Incorrect / Skipped</span>
                  <span className="text-base font-bold text-rose-600 mt-1 block">
                    {sessionSummary.incorrectCount} questions
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                  <span className="text-slate-500 font-medium block">Performance Status</span>
                  <span
                    className={`text-base font-bold mt-1 block ${
                      sessionSummary.accuracy >= 70 ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {sessionSummary.accuracy >= 80
                      ? 'Proficient'
                      : sessionSummary.accuracy >= 60
                      ? 'Developing'
                      : 'Needs Revision'}
                  </span>
                </div>
              </div>

              {/* Review Mistakes Component */}
              {isReviewingMistakes && missedQuestionIndices.length > 0 && (
                <div className="p-5 rounded-3xl bg-rose-50/70 border border-rose-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-rose-200/80 pb-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span className="text-xs font-bold text-rose-950">
                        Reviewing Mistake {reviewMistakeIdx + 1} of {missedQuestionIndices.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          setReviewMistakeIdx((prev) =>
                            prev > 0 ? prev - 1 : missedQuestionIndices.length - 1
                          )
                        }
                        className="p-1 rounded-full bg-white hover:bg-rose-100 text-rose-800 text-xs border border-rose-200"
                        title="Previous mistake"
                      >
                        <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                      </button>
                      <button
                        onClick={() =>
                          setReviewMistakeIdx((prev) =>
                            prev + 1 < missedQuestionIndices.length ? prev + 1 : 0
                          )
                        }
                        className="p-1 rounded-full bg-white hover:bg-rose-100 text-rose-800 text-xs border border-rose-200"
                        title="Next mistake"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {(() => {
                    const mIdx = missedQuestionIndices[reviewMistakeIdx];
                    const q = questions[mIdx];
                    const uAns = sessionSummary.userAnswers[mIdx];
                    if (!q) return null;

                    return (
                      <div className="space-y-3 text-xs">
                        <p className="font-semibold text-slate-900 leading-relaxed">
                          {q.scenario}
                        </p>
                        <p className="font-bold text-slate-800">{q.question}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt) => {
                            const isCorrectOpt = opt.key === q.correctAnswer;
                            const isUserWrong = opt.key === uAns?.selectedAnswer && !isCorrectOpt;

                            return (
                              <div
                                key={opt.key}
                                className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                                  isCorrectOpt
                                    ? 'bg-emerald-100 border-emerald-300 text-emerald-950 font-bold'
                                    : isUserWrong
                                    ? 'bg-rose-100 border-rose-300 text-rose-950 line-through'
                                    : 'bg-white border-slate-200 text-slate-700'
                                }`}
                              >
                                <span className="font-mono font-bold">{opt.key}.</span>
                                <span>{opt.text}</span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="p-3.5 bg-white rounded-2xl border border-rose-200 text-xs text-slate-700">
                          <strong className="text-slate-900">Explanation: </strong>
                          {q.explanation}
                          {q.highYieldPearl && (
                            <div className="mt-2 text-sky-800 font-medium">
                              <strong>Pearl: </strong> {q.highYieldPearl}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                {missedQuestionIndices.length > 0 && !isReviewingMistakes ? (
                  <button
                    onClick={() => setIsReviewingMistakes(true)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>Review {missedQuestionIndices.length} Mistakes</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    onClick={handlePracticeAgain}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Practice 10 More</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    Back to Learning
                  </button>
                </div>
              </div>
            </div>
          ) : currentQ ? (
            /* ================= ACTIVE 10-QUESTION FLOW ================= */
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left/Main: Question & Options Area (~70% width) */}
              <div className="flex-1 min-w-0 space-y-5">
                {/* Dedicated Clinical Vignette Card */}
                <div className="p-5 sm:p-6 lg:p-7 bg-white rounded-2xl sm:rounded-3xl border border-[#DCE4E1] shadow-2xs space-y-4">
                  {/* Vignette Metadata Badge Row */}
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#E8F5F1] text-[#006B63] border border-[#006B63]/20">
                        Clinical Vignette #{currentIdx + 1}
                      </span>
                      {(currentQ.difficulty === 'high-yield' || Boolean(currentQ.highYieldPearl)) && (
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                          High Yield
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-[#66716F]">
                      Single Best Answer · FMGE
                    </span>
                  </div>

                  {/* Clinical Scenario */}
                  <div className="text-sm sm:text-[15px] lg:text-base text-[#1E2B27] leading-relaxed font-normal">
                    {currentQ.scenario}
                  </div>

                  {/* Attached Image / IBQ / ECG / X-Ray */}
                  {currentQ.imageUrl && (
                    <div className="relative rounded-2xl overflow-hidden border border-[#DCE4E1] bg-[#0A1210] group max-h-80 shadow-xs">
                      <img
                        src={currentQ.imageUrl}
                        alt={currentQ.question}
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        className="w-full h-auto max-h-80 object-contain mx-auto cursor-zoom-in bg-[#0A1210]"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.src.includes('/assets/medical-images/')) {
                            target.src = '/assets/medical-images/ecg-inferior-stemi.svg';
                          }
                        }}
                        onClick={() =>
                          setActiveModalImage({
                            isOpen: true,
                            imageUrl: currentQ.imageUrl!,
                            imageAsset: currentQ.imageAsset,
                            title: `${currentQ.subjectName} · ${currentQ.topicName}`,
                            whatToLookFor: currentQ.whatToLookFor,
                          })
                        }
                      />
                      <div className="absolute top-3 right-3">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveModalImage({
                              isOpen: true,
                              imageUrl: currentQ.imageUrl!,
                              imageAsset: currentQ.imageAsset,
                              title: `${currentQ.subjectName} · ${currentQ.topicName}`,
                              whatToLookFor: currentQ.whatToLookFor,
                            })
                          }
                          className="px-3 py-1.5 bg-[#121E1B]/85 hover:bg-[#121E1B] backdrop-blur-md rounded-xl text-[11px] font-mono font-medium text-white flex items-center gap-1.5 shadow-sm cursor-pointer border border-white/10 transition-colors"
                        >
                          <ZoomIn className="w-3.5 h-3.5 text-[#5EEAD4]" />
                          <span>Tap to Zoom</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Attached Video Clip */}
                  {currentQ.videoUrl && (
                    <div className="rounded-2xl overflow-hidden border border-[#DCE4E1] bg-black">
                      <video
                        controls
                        src={currentQ.videoUrl}
                        className="w-full max-h-80 object-contain bg-black"
                      >
                        Your browser does not support HTML5 video.
                      </video>
                    </div>
                  )}

                  {/* Question Inquiry Stem — Strongest Visual Element */}
                  <div className="pt-2 border-t border-[#F0F3F2]">
                    <h4 className="text-base sm:text-lg lg:text-xl font-semibold font-['Newsreader'] text-[#121E1B] leading-snug tracking-tight">
                      {currentQ.question}
                    </h4>
                  </div>
                </div>

                {/* Answer Options */}
                <div className="space-y-2.5">
                  {currentQ.options.map((opt) => {
                    const isSelected = selectedOption === opt.key;
                    const isCorrect = opt.key === currentQ.correctAnswer;

                    let cardStyle =
                      'bg-white border-[#DCE4E1] hover:border-[#006B63]/40 hover:bg-[#F7FAF9] text-[#1E2B27] shadow-2xs';
                    let badgeStyle =
                      'bg-[#F5F7F8] text-[#4A5553] border border-[#DCE4E1]';

                    if (isAnswerSubmitted) {
                      if (isCorrect) {
                        cardStyle =
                          'bg-[#E8F5F1] border-[#006B63] text-[#004D47] font-bold shadow-2xs';
                        badgeStyle = 'bg-[#006B63] text-white border border-[#006B63]';
                      } else if (isSelected && !isCorrect) {
                        cardStyle =
                          'bg-rose-50 border-rose-400 text-rose-950 font-medium shadow-2xs';
                        badgeStyle = 'bg-rose-600 text-white border border-rose-600';
                      } else {
                        cardStyle = 'bg-white border-[#EAEFEA] text-[#9AA5A2] opacity-50';
                        badgeStyle = 'bg-[#F5F7F8] text-[#9AA5A2] border border-[#EAEFEA]';
                      }
                    } else if (isSelected) {
                      cardStyle =
                        'bg-[#F0FDF8] border-[#006B63] text-[#004D47] font-semibold ring-2 ring-[#006B63]/20 shadow-2xs';
                      badgeStyle = 'bg-[#006B63] text-white border border-[#006B63]';
                    }

                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleSelectOption(opt.key)}
                        disabled={isAnswerSubmitted}
                        className={`w-full min-h-[52px] sm:min-h-[56px] p-3.5 sm:p-4 rounded-2xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${cardStyle}`}
                      >
                        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 pr-2">
                          <span
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full font-mono font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 transition-colors ${badgeStyle}`}
                          >
                            {opt.key}
                          </span>
                          <span className="leading-snug">{opt.text}</span>
                        </div>

                        {isAnswerSubmitted && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-[#006B63] shrink-0" />
                        )}
                        {isAnswerSubmitted && isSelected && !isCorrect && (
                          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Box (preserved post-answer state) */}
                <AnimatePresence>
                  {isAnswerSubmitted && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`p-5 rounded-3xl border space-y-3 ${
                        selectedOption === currentQ.correctAnswer
                          ? 'bg-emerald-50/80 border-emerald-200'
                          : 'bg-rose-50/80 border-rose-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {selectedOption === currentQ.correctAnswer ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-950">
                              Correct Answer: Option {currentQ.correctAnswer}
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                            <span className="text-xs font-bold text-rose-950">
                              Incorrect. Correct Answer is Option {currentQ.correctAnswer}
                            </span>
                          </>
                        )}
                      </div>

                      {/* What to look for in image */}
                      {(currentQ.whatToLookFor || currentQ.imageAsset?.whatToLookFor) && (
                        <div className="p-3.5 bg-white/90 rounded-2xl border border-slate-200 text-xs text-slate-800 space-y-2 shadow-2xs">
                          <div className="flex items-start gap-2">
                            <Eye className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-sky-950 font-['Outfit']">What to look for in this image: </strong>
                              <p className="mt-0.5 leading-relaxed text-slate-700">{currentQ.whatToLookFor || currentQ.imageAsset?.whatToLookFor}</p>
                            </div>
                          </div>

                          {/* Button to open Annotated Visual Breakdown */}
                          {currentQ.imageUrl && (
                            <div className="pt-1.5 border-t border-slate-100 flex justify-end">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveModalImage({
                                    isOpen: true,
                                    imageUrl: currentQ.imageUrl!,
                                    annotatedImageUrl: currentQ.annotatedImageUrl || currentQ.imageAsset?.annotatedImageUrl,
                                    imageAsset: currentQ.imageAsset,
                                    title: `${currentQ.subjectName} · ${currentQ.topicName}`,
                                    whatToLookFor: currentQ.whatToLookFor,
                                  })
                                }
                                className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-sky-700" />
                                <span>Open Annotated Visual Inspection</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-slate-700 leading-relaxed">
                        {currentQ.explanation}
                      </p>

                      {currentQ.highYieldPearl && (
                        <div className="p-3 bg-white/90 rounded-2xl border border-slate-200 text-xs text-slate-800 flex items-start gap-2 shadow-2xs">
                          <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-amber-950">FMGE Key Takeaway: </strong>
                            <span>{currentQ.highYieldPearl}</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer Action Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-[#F0F3F2] sticky sm:static bottom-0 bg-[#FBFDFB] py-2 sm:py-0 z-10">
                  {!isAnswerSubmitted ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSkipQuestion}
                        className="text-xs sm:text-sm font-semibold text-[#66716F] hover:text-[#121E1B] px-3.5 py-2.5 rounded-xl hover:bg-[#F0F3F2] transition-colors cursor-pointer"
                      >
                        Skip Question
                      </button>

                      <button
                        type="button"
                        onClick={handleSubmitAnswer}
                        disabled={!selectedOption}
                        className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-2.5 sm:py-3 rounded-xl bg-[#006B63] hover:bg-[#005049] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-display"
                      >
                        <span>Submit Answer</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-end w-full">
                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-2.5 sm:py-3 rounded-xl bg-[#006B63] hover:bg-[#005049] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer font-display"
                      >
                        <span>
                          {currentIdx + 1 < targetCount
                            ? `Next Question (${currentIdx + 2}/${targetCount})`
                            : 'View Session Summary'}
                        </span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Progress Companion (Desktop Only) */}
              <aside className="w-72 lg:w-80 shrink-0 hidden lg:flex flex-col gap-4 border-l border-[#F0F3F2] pl-6">
                {/* 10-Question Step Map */}
                <div className="p-4 rounded-2xl bg-white border border-[#DCE4E1] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="font-mono text-[#66716F] uppercase tracking-wider text-[10px]">
                      Session Steps
                    </span>
                    <span className="font-mono text-[#006B63] text-[11px] font-bold">
                      {currentIdx + 1} / {targetCount}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {Array.from({ length: targetCount }).map((_, idx) => {
                      const isCurrent = idx === currentIdx;
                      const ans = userAnswers[idx];
                      const isAnswered = Boolean(ans);
                      const isCorrect = ans?.isCorrect;

                      let stepClass = 'bg-[#F5F7F8] text-[#66716F] border-[#DCE4E1]';
                      if (isCurrent) {
                        stepClass =
                          'bg-[#006B63] text-white border-[#006B63] ring-2 ring-[#006B63]/25 font-bold shadow-2xs';
                      } else if (isAnswered) {
                        if (isCorrect) {
                          stepClass =
                            'bg-[#E8F5F1] text-[#006B63] border-[#006B63]/40 font-semibold';
                        } else {
                          stepClass = 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
                        }
                      }

                      return (
                        <div
                          key={idx}
                          className={`h-8 rounded-lg border text-xs font-mono flex items-center justify-center transition-all ${stepClass}`}
                        >
                          <span>{idx + 1}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live Timers */}
                <div className="p-4 rounded-2xl bg-white border border-[#DCE4E1] shadow-2xs space-y-3">
                  <span className="font-mono text-[#66716F] uppercase tracking-wider text-[10px] font-semibold block">
                    Timing Metrics
                  </span>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#66716F] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#006B63]" />
                        <span>Current Question</span>
                      </span>
                      <span className="font-mono font-bold text-[#121E1B]">
                        {formatSeconds(activeElapsedSeconds)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#66716F]">Avg / Question</span>
                      <span className="font-mono font-bold text-[#121E1B]">
                        {liveAvgTime !== null ? `${liveAvgTime}s` : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Accuracy Status */}
                <div className="p-4 rounded-2xl bg-white border border-[#DCE4E1] shadow-2xs space-y-3">
                  <span className="font-mono text-[#66716F] uppercase tracking-wider text-[10px] font-semibold block">
                    Session Accuracy
                  </span>

                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-bold font-['Newsreader'] text-[#121E1B]">
                        {liveAccuracy !== null ? `${liveAccuracy}%` : '—'}
                      </span>
                      <span className="text-xs text-[#66716F] font-mono">
                        {liveCorrectCount} / {answeredCount} answered
                      </span>
                    </div>

                    <div className="w-full bg-[#F0F3F2] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#006B63] h-full transition-all duration-300 rounded-full"
                        style={{ width: `${liveAccuracy ?? 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Helpful Reminder Note */}
                <div className="p-3.5 rounded-2xl bg-[#F0FDF8] border border-[#D5E4DE] text-[11px] text-[#3D4947] leading-relaxed">
                  <span className="font-semibold text-[#006B63] block font-mono text-[10px] uppercase tracking-wide">
                    Exam Strategy
                  </span>
                  Commit to your first clinical instinct. Eliminate two distractors before confirming.
                </div>
              </aside>
            </div>
          ) : null}
        </div>
      </motion.div>
      </div>

      {/* Image Zoom Lightbox */}
      <MedicalImageViewerModal
        isOpen={activeModalImage.isOpen}
        onClose={() => setActiveModalImage(prev => ({ ...prev, isOpen: false }))}
        imageUrl={activeModalImage.imageUrl}
        annotatedImageUrl={activeModalImage.annotatedImageUrl}
        imageAsset={activeModalImage.imageAsset}
        title={activeModalImage.title}
        whatToLookFor={activeModalImage.whatToLookFor}
      />
    </div>,
    document.body
  );
};
