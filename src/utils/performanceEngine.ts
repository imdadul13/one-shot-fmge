import {
  AppState,
  McqAttempt,
  McqAttemptSource,
  McqDifficulty,
  McqConfidence,
  TopicMasteryStatus,
  TopicPerformanceMetrics,
  SubjectPerformanceMetrics,
  OverallPerformanceSummary,
  TopicItem,
  FMGESubject,
} from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { getLocalDateKey } from './date';

export interface NewMcqAttemptInput {
  id?: string;
  questionId: string;
  subjectId: string;
  topicId: string;
  topicName?: string;
  subtopicId?: string;
  subtopic?: string;
  isCorrect: boolean;
  selectedAnswer: string;
  selectedOptionId?: string;
  correctAnswer?: string;
  correctOptionId?: string;
  timeTakenSeconds?: number;
  difficulty?: McqDifficulty;
  confidence?: McqConfidence;
  attemptNumber?: number;
  timestamp?: string;
  source: McqAttemptSource;
  sessionId?: string;
  practiceSessionId?: string;
  isImageBased?: boolean;
  imageCategory?: string;
  imageUrl?: string;
  imageAssetId?: string;
  tags?: string[];
  notes?: string;
}

/**
 * Calculates topic mastery status based on attempt count, accuracy, and repeated errors.
 */
export function determineMasteryStatus(
  totalAttempts: number,
  accuracy: number,
  repeatedErrorsCount: number
): TopicMasteryStatus {
  if (totalAttempts === 0) {
    return 'unattempted';
  }
  if (accuracy < 50 || repeatedErrorsCount >= 2) {
    return 'struggling';
  }
  if (accuracy < 70) {
    return 'developing';
  }
  if (accuracy < 85 || totalAttempts < 5) {
    return 'proficient';
  }
  return 'mastered';
}

/**
 * Calculates recent accuracy from the most recent N attempts.
 */
export function calculateRecentAccuracy(attempts: McqAttempt[], windowSize = 5): number {
  if (!attempts || attempts.length === 0) return 0;

  // Sort descending by timestamp
  const sorted = [...attempts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const recentWindow = sorted.slice(0, windowSize);
  const correctCount = recentWindow.filter((a) => a.isCorrect).length;

  return recentWindow.length > 0 ? Math.round((correctCount / recentWindow.length) * 100) : 0;
}

/**
 * Counts repeated errors: questions attempted multiple times where at least 2 attempts were incorrect,
 * or questions whose most recent attempt was incorrect.
 */
export function countRepeatedErrors(attempts: McqAttempt[]): number {
  if (!attempts || attempts.length === 0) return 0;

  const byQuestion: Record<string, McqAttempt[]> = {};
  for (const att of attempts) {
    if (!byQuestion[att.questionId]) {
      byQuestion[att.questionId] = [];
    }
    byQuestion[att.questionId].push(att);
  }

  let repeatedErrorQuestions = 0;
  for (const qId in byQuestion) {
    const qAttempts = byQuestion[qId];
    const failCount = qAttempts.filter((a) => !a.isCorrect).length;
    if (failCount >= 2) {
      repeatedErrorQuestions++;
    }
  }

  return repeatedErrorQuestions;
}

/**
 * Calculates Topic-Level Performance Metrics from raw attempts.
 */
export function calculateTopicPerformanceMetrics(
  subjectId: string,
  topicId: string,
  attempts: McqAttempt[],
  topicItem?: TopicItem
): TopicPerformanceMetrics {
  // Match by subject and topicId or topicName fallback
  const topicAttempts = (attempts || []).filter((a) => {
    if (a.subjectId !== subjectId) return false;
    if (a.topicId === topicId) return true;
    if (topicItem && a.topicName && a.topicName.toLowerCase() === topicItem.name.toLowerCase()) {
      return true;
    }
    return false;
  });

  const totalAttempts = topicAttempts.length;
  const correctAnswers = topicAttempts.filter((a) => a.isCorrect).length;
  const incorrectAnswers = totalAttempts - correctAnswers;
  const accuracy = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;
  const recentAccuracy = calculateRecentAccuracy(topicAttempts, 5);

  const totalTimeSeconds = topicAttempts.reduce((sum, a) => sum + (a.timeTakenSeconds || 0), 0);
  const avgResponseTimeSeconds =
    totalAttempts > 0 ? Math.round((totalTimeSeconds / totalAttempts) * 10) / 10 : 0;

  const repeatedErrorsCount = countRepeatedErrors(topicAttempts);

  // Latest attempt timestamp
  let lastAttemptedDate: string | null = null;
  if (topicAttempts.length > 0) {
    const sorted = [...topicAttempts].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    lastAttemptedDate = sorted[0].timestamp;
  }

  const masteryStatus = determineMasteryStatus(totalAttempts, accuracy, repeatedErrorsCount);

  // Breakdown by source
  const attemptsBySource: Record<McqAttemptSource, number> = {
    qbank: 0,
    grand_test: 0,
    error_vault: 0,
    ai_coach: 0,
    telegram: 0,
    recommended_video_practice: 0,
    custom: 0,
    other: 0,
  };

  const sourceCorrect: Record<McqAttemptSource, number> = {
    qbank: 0,
    grand_test: 0,
    error_vault: 0,
    ai_coach: 0,
    telegram: 0,
    recommended_video_practice: 0,
    custom: 0,
    other: 0,
  };

  for (const a of topicAttempts) {
    const src = a.source || 'other';
    if (attemptsBySource[src] !== undefined) {
      attemptsBySource[src]++;
      if (a.isCorrect) sourceCorrect[src]++;
    }
  }

  const sourceAccuracies: Partial<Record<McqAttemptSource, number>> = {};
  for (const key of Object.keys(attemptsBySource) as McqAttemptSource[]) {
    if (attemptsBySource[key] > 0) {
      sourceAccuracies[key] = Math.round((sourceCorrect[key] / attemptsBySource[key]) * 100);
    }
  }

  return {
    subjectId,
    topicId,
    topicName: topicItem?.name || topicId,
    isHighYield: topicItem?.isHighYield ?? false,
    totalAttempts,
    correctAnswers,
    incorrectAnswers,
    accuracy,
    recentAccuracy,
    avgResponseTimeSeconds,
    repeatedErrorsCount,
    lastAttemptedDate,
    masteryStatus,
    attemptsBySource,
    sourceAccuracies,
  };
}

/**
 * Calculates Subject-Level Performance Metrics across all its topics.
 */
export function calculateSubjectPerformanceMetrics(
  subjectId: string,
  state: AppState
): SubjectPerformanceMetrics {
  const subject = FMGE_SUBJECTS.find((s) => s.id === subjectId) || {
    id: subjectId,
    name: subjectId.toUpperCase(),
    code: subjectId.slice(0, 3).toUpperCase(),
    phase: 'clinical' as const,
    weightage: 15,
    color: '#0f172a',
    iconName: 'BookOpen',
    description: '',
    highYieldTips: '',
    topics: [],
  };

  const customTopics = state.subjectProgress?.[subjectId]?.customTopics || [];
  const allTopics: TopicItem[] = [...subject.topics, ...customTopics];
  const allAttempts = state.mcqAttempts || [];

  const topicMetricsMap: Record<string, TopicPerformanceMetrics> = {};
  let subjectTotalAttempts = 0;
  let subjectCorrectAnswers = 0;
  let subjectTotalTimeSeconds = 0;
  let subjectRepeatedErrors = 0;
  let latestTimestamp: string | null = null;

  let masteredCount = 0;
  let proficientCount = 0;
  let developingCount = 0;
  let strugglingCount = 0;
  let unattemptedCount = 0;

  for (const topic of allTopics) {
    const metrics = calculateTopicPerformanceMetrics(subjectId, topic.id, allAttempts, topic);
    topicMetricsMap[topic.id] = metrics;

    subjectTotalAttempts += metrics.totalAttempts;
    subjectCorrectAnswers += metrics.correctAnswers;
    subjectTotalTimeSeconds += metrics.avgResponseTimeSeconds * metrics.totalAttempts;
    subjectRepeatedErrors += metrics.repeatedErrorsCount;

    if (metrics.lastAttemptedDate) {
      if (!latestTimestamp || new Date(metrics.lastAttemptedDate).getTime() > new Date(latestTimestamp).getTime()) {
        latestTimestamp = metrics.lastAttemptedDate;
      }
    }

    switch (metrics.masteryStatus) {
      case 'mastered':
        masteredCount++;
        break;
      case 'proficient':
        proficientCount++;
        break;
      case 'developing':
        developingCount++;
        break;
      case 'struggling':
        strugglingCount++;
        break;
      case 'unattempted':
      default:
        unattemptedCount++;
        break;
    }
  }

  // Also account for subject-level attempts not tagged to a specific topic ID
  const subjectWideAttempts = allAttempts.filter(
    (a) => a.subjectId === subjectId && !allTopics.some((t) => t.id === a.topicId)
  );
  if (subjectWideAttempts.length > 0) {
    subjectTotalAttempts += subjectWideAttempts.length;
    subjectCorrectAnswers += subjectWideAttempts.filter((a) => a.isCorrect).length;
    subjectTotalTimeSeconds += subjectWideAttempts.reduce((s, a) => s + (a.timeTakenSeconds || 0), 0);
  }

  const subjectIncorrect = subjectTotalAttempts - subjectCorrectAnswers;
  const accuracy = subjectTotalAttempts > 0 ? Math.round((subjectCorrectAnswers / subjectTotalAttempts) * 100) : 0;

  const subjectAttempts = allAttempts.filter((a) => a.subjectId === subjectId);
  const recentAccuracy = calculateRecentAccuracy(subjectAttempts, 10);
  const avgResponseTimeSeconds =
    subjectTotalAttempts > 0 ? Math.round((subjectTotalTimeSeconds / subjectTotalAttempts) * 10) / 10 : 0;

  const subjectMastery = determineMasteryStatus(subjectTotalAttempts, accuracy, subjectRepeatedErrors);

  // Source breakdown
  const sourceBreakdown: Record<McqAttemptSource, { attempts: number; correct: number; accuracy: number }> = {
    qbank: { attempts: 0, correct: 0, accuracy: 0 },
    grand_test: { attempts: 0, correct: 0, accuracy: 0 },
    error_vault: { attempts: 0, correct: 0, accuracy: 0 },
    ai_coach: { attempts: 0, correct: 0, accuracy: 0 },
    telegram: { attempts: 0, correct: 0, accuracy: 0 },
    recommended_video_practice: { attempts: 0, correct: 0, accuracy: 0 },
    custom: { attempts: 0, correct: 0, accuracy: 0 },
    other: { attempts: 0, correct: 0, accuracy: 0 },
  };

  for (const a of subjectAttempts) {
    const src = a.source || 'other';
    if (sourceBreakdown[src]) {
      sourceBreakdown[src].attempts++;
      if (a.isCorrect) sourceBreakdown[src].correct++;
    }
  }

  for (const key of Object.keys(sourceBreakdown) as McqAttemptSource[]) {
    const entry = sourceBreakdown[key];
    entry.accuracy = entry.attempts > 0 ? Math.round((entry.correct / entry.attempts) * 100) : 0;
  }

  return {
    subjectId,
    subjectName: subject.name,
    subjectCode: subject.code,
    phase: subject.phase,
    weightage: subject.weightage,
    color: subject.color,
    totalAttempts: subjectTotalAttempts,
    correctAnswers: subjectCorrectAnswers,
    incorrectAnswers: subjectIncorrect,
    accuracy,
    recentAccuracy,
    avgResponseTimeSeconds,
    repeatedErrorsCount: subjectRepeatedErrors,
    lastAttemptedDate: latestTimestamp,
    masteryStatus: subjectMastery,
    topicsMasteredCount: masteredCount,
    topicsProficientCount: proficientCount,
    topicsDevelopingCount: developingCount,
    topicsStrugglingCount: strugglingCount,
    topicsUnattemptedCount: unattemptedCount,
    totalTopicsCount: allTopics.length,
    topicMetrics: topicMetricsMap,
    sourceBreakdown,
  };
}

/**
 * Calculates Overall Performance Summary across all 19 FMGE subjects.
 */
export function calculateOverallPerformance(state: AppState): OverallPerformanceSummary {
  const subjectMetricsMap: Record<string, SubjectPerformanceMetrics> = {};

  let totalAttempts = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalRepeatedErrors = 0;
  let totalTimeSeconds = 0;
  let totalMasteredTopics = 0;
  let totalProficientTopics = 0;
  let totalDevelopingTopics = 0;
  let totalStrugglingTopics = 0;
  let totalUnattemptedTopics = 0;
  let totalTopics = 0;
  let lastActiveTimestamp: string | null = null;

  for (const subject of FMGE_SUBJECTS) {
    const subMetrics = calculateSubjectPerformanceMetrics(subject.id, state);
    subjectMetricsMap[subject.id] = subMetrics;

    totalAttempts += subMetrics.totalAttempts;
    totalCorrect += subMetrics.correctAnswers;
    totalIncorrect += subMetrics.incorrectAnswers;
    totalRepeatedErrors += subMetrics.repeatedErrorsCount;
    totalTimeSeconds += subMetrics.avgResponseTimeSeconds * subMetrics.totalAttempts;

    totalMasteredTopics += subMetrics.topicsMasteredCount;
    totalProficientTopics += subMetrics.topicsProficientCount;
    totalDevelopingTopics += subMetrics.topicsDevelopingCount;
    totalStrugglingTopics += subMetrics.topicsStrugglingCount;
    totalUnattemptedTopics += subMetrics.topicsUnattemptedCount;
    totalTopics += subMetrics.totalTopicsCount;

    if (subMetrics.lastAttemptedDate) {
      if (!lastActiveTimestamp || new Date(subMetrics.lastAttemptedDate).getTime() > new Date(lastActiveTimestamp).getTime()) {
        lastActiveTimestamp = subMetrics.lastAttemptedDate;
      }
    }
  }

  const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  const recentAccuracy = calculateRecentAccuracy(state.mcqAttempts || [], 15);
  const avgResponseTimeSeconds =
    totalAttempts > 0 ? Math.round((totalTimeSeconds / totalAttempts) * 10) / 10 : 0;

  const recentAttempts = [...(state.mcqAttempts || [])]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

  return {
    totalAttempts,
    totalCorrect,
    totalIncorrect,
    overallAccuracy,
    recentAccuracy,
    avgResponseTimeSeconds,
    totalRepeatedErrors,
    totalMasteredTopics,
    totalProficientTopics,
    totalDevelopingTopics,
    totalStrugglingTopics,
    totalUnattemptedTopics,
    totalTopics,
    lastActiveTimestamp,
    subjectMetrics: subjectMetricsMap,
    recentAttempts,
  };
}

/**
 * Records an MCQ attempt into AppState, updating attempt counts, daily logs, and topic state.
 * Returns the immutable new state and the recorded attempt object.
 */
export function recordMcqAttempt(
  state: AppState,
  input: NewMcqAttemptInput
): { updatedState: AppState; attempt: McqAttempt } {
  const existingAttempts = state.mcqAttempts || [];

  // Determine attempt number for this question
  const previousAttemptsForQuestion = existingAttempts.filter(
    (a) => a.questionId === input.questionId
  );
  const attemptNumber = input.attemptNumber ?? (previousAttemptsForQuestion.length + 1);

  const attemptId =
    input.id || `att-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const timestamp = input.timestamp || new Date().toISOString();
  const timeTakenSeconds = input.timeTakenSeconds ?? 45;

  const attempt: McqAttempt = {
    id: attemptId,
    questionId: input.questionId,
    subjectId: input.subjectId,
    topicId: input.topicId,
    topicName: input.topicName,
    subtopicId: input.subtopicId,
    subtopic: input.subtopic,
    isCorrect: input.isCorrect,
    selectedAnswer: input.selectedAnswer,
    selectedOptionId: input.selectedOptionId,
    correctAnswer: input.correctAnswer,
    correctOptionId: input.correctOptionId,
    timeTakenSeconds,
    difficulty: input.difficulty || 'standard',
    confidence: input.confidence,
    attemptNumber,
    timestamp,
    source: input.source,
    sessionId: input.sessionId,
    practiceSessionId: input.practiceSessionId || input.sessionId,
    isImageBased: input.isImageBased ?? Boolean(input.imageUrl),
    imageCategory: input.imageCategory as any,
    imageUrl: input.imageUrl,
    imageAssetId: input.imageAssetId,
    tags: input.tags,
    notes: input.notes,
  };

  const updatedAttempts = [attempt, ...existingAttempts];

  // Update today's study log (increment questionsSolved)
  const todayKey = getLocalDateKey();
  const existingTodayLog = state.studyLogs?.[todayKey] || {
    date: todayKey,
    studyMinutes: 0,
    questionsSolved: 0,
    completedTaskIds: [],
    mood: 'great' as const,
  };

  const updatedStudyLogs = {
    ...(state.studyLogs || {}),
    [todayKey]: {
      ...existingTodayLog,
      questionsSolved: (existingTodayLog.questionsSolved || 0) + 1,
    },
  };

  // Synchronize topic state QBank count and accuracy if topicId provided
  const topicKey = `${input.subjectId}-${input.topicId}`;
  const existingTopicState = state.topicsState?.[topicKey] || {};

  const topicAttempts = updatedAttempts.filter(
    (a) => a.subjectId === input.subjectId && a.topicId === input.topicId
  );
  const topicCorrect = topicAttempts.filter((a) => a.isCorrect).length;
  const topicAccuracy =
    topicAttempts.length > 0 ? Math.round((topicCorrect / topicAttempts.length) * 100) : 0;

  const updatedTopicsState = {
    ...(state.topicsState || {}),
    [topicKey]: {
      ...existingTopicState,
      qBankSolvedCount: topicAttempts.length,
      qBankAccuracy: topicAccuracy,
      qBankDone: topicAttempts.length >= 5 || (existingTopicState.qBankDone ?? false),
    },
  };

  // Automatically record incorrect MCQ attempts into Error Vault
  let updatedErrorNotebook = state.errorNotebook || [];
  if (!input.isCorrect) {
    const alreadyInErrors = updatedErrorNotebook.some(
      (e) => input.questionId && (e.id === `err-${input.questionId}` || e.id === input.questionId)
    );
    if (!alreadyInErrors) {
      const newErrorItem = {
        id: `err-${input.questionId || Date.now()}`,
        subjectId: input.subjectId,
        topic: input.topicName || input.topicId || 'Clinical MCQ Error',
        topicId: input.topicId,
        subtopicId: input.subtopicId,
        conceptName: input.subtopic || input.topicName,
        questionGist: input.notes || `Mistake logged for ${input.topicName || input.subjectId}`,
        myMistake: `Selected option ${input.selectedAnswer || 'Incorrect'}`,
        correctConcept: `Correct answer: Option ${input.correctAnswer || 'Verified standard'}`,
        isReviewed: false,
        dateAdded: new Date().toISOString().split('T')[0],
      };
      updatedErrorNotebook = [newErrorItem, ...updatedErrorNotebook];
    }
  }

  const updatedState: AppState = {
    ...state,
    mcqAttempts: updatedAttempts,
    studyLogs: updatedStudyLogs,
    topicsState: updatedTopicsState,
    errorNotebook: updatedErrorNotebook,
  };

  return { updatedState, attempt };
}

/**
 * Hydrates attempt history from legacy records (Telegram solved MCQs, Error Notebook)
 * if `state.mcqAttempts` is empty. Ensures seamless backward compatibility.
 */
export function hydrateAttemptsFromExistingState(state: AppState): AppState {
  if (state.mcqAttempts && state.mcqAttempts.length > 0) {
    return state;
  }

  const generatedAttempts: McqAttempt[] = [];

  // 1. Convert solved Telegram MCQs
  if (Array.isArray(state.telegramQuestions)) {
    for (const tq of state.telegramQuestions) {
      if (tq.userStatus === 'correct' || tq.userStatus === 'incorrect' || tq.userSelectedOption) {
        const isCorrect =
          tq.userStatus === 'correct' || tq.userSelectedOption === tq.correctKey;
        generatedAttempts.push({
          id: `att-tq-${tq.id}`,
          questionId: tq.id,
          subjectId: tq.subjectId || 'medicine',
          topicId: tq.topic || 'general',
          topicName: tq.topic,
          isCorrect,
          selectedAnswer: tq.userSelectedOption || (isCorrect ? tq.correctKey : 'A'),
          correctAnswer: tq.correctKey,
          timeTakenSeconds: 45,
          difficulty: tq.difficulty || 'high-yield',
          attemptNumber: 1,
          timestamp: tq.datePulled || new Date().toISOString(),
          source: 'telegram',
          tags: tq.tags,
        });
      }
    }
  }

  // 2. Convert Error Notebook Items
  if (Array.isArray(state.errorNotebook)) {
    for (const err of state.errorNotebook) {
      generatedAttempts.push({
        id: `att-err-${err.id}`,
        questionId: err.id,
        subjectId: err.subjectId || 'medicine',
        topicId: err.topic || 'general',
        topicName: err.topic,
        isCorrect: false, // Logged as error originally
        selectedAnswer: 'Incorrect',
        timeTakenSeconds: 60,
        difficulty: 'high-yield',
        attemptNumber: 1,
        timestamp: err.dateAdded ? `${err.dateAdded}T12:00:00.000Z` : new Date().toISOString(),
        source: 'error_vault',
        notes: err.myMistake,
      });

      if (err.isReviewed) {
        // If reviewed, add successful review attempt
        generatedAttempts.push({
          id: `att-err-rev-${err.id}`,
          questionId: err.id,
          subjectId: err.subjectId || 'medicine',
          topicId: err.topic || 'general',
          topicName: err.topic,
          isCorrect: true,
          selectedAnswer: 'Corrected on Review',
          timeTakenSeconds: 40,
          difficulty: 'high-yield',
          attemptNumber: 2,
          timestamp: err.dateAdded ? `${err.dateAdded}T18:00:00.000Z` : new Date().toISOString(),
          source: 'error_vault',
        });
      }
    }
  }

  if (generatedAttempts.length === 0) {
    return state;
  }

  return {
    ...state,
    mcqAttempts: generatedAttempts,
  };
}

export interface ImagePerformanceSummary {
  totalImageAttempts: number;
  correctImageAttempts: number;
  overallImageAccuracy: number;
  categoryBreakdown: Record<string, { attempts: number; correct: number; accuracy: number }>;
  weakestCategory: string | null;
}

/**
 * Computes analytics and accuracy for all image-based question attempts.
 */
export function calculateImagePerformanceSummary(state: AppState): ImagePerformanceSummary {
  const attempts = (state.mcqAttempts || []).filter(a => a.isImageBased || Boolean(a.imageUrl));
  if (attempts.length === 0) {
    return {
      totalImageAttempts: 0,
      correctImageAttempts: 0,
      overallImageAccuracy: 0,
      categoryBreakdown: {},
      weakestCategory: null,
    };
  }

  const categoryBreakdown: Record<string, { attempts: number; correct: number; accuracy: number }> = {};
  let correctCount = 0;

  for (const att of attempts) {
    if (att.isCorrect) correctCount++;
    const cat = att.imageCategory || (att.tags?.find(t => t.startsWith('cat:'))?.replace('cat:', '')) || 'clinical';
    if (!categoryBreakdown[cat]) {
      categoryBreakdown[cat] = { attempts: 0, correct: 0, accuracy: 0 };
    }
    categoryBreakdown[cat].attempts++;
    if (att.isCorrect) {
      categoryBreakdown[cat].correct++;
    }
  }

  let weakestCat: string | null = null;
  let lowestAcc = 101;

  for (const cat of Object.keys(categoryBreakdown)) {
    const entry = categoryBreakdown[cat];
    entry.accuracy = entry.attempts > 0 ? Math.round((entry.correct / entry.attempts) * 100) : 0;
    if (entry.attempts >= 2 && entry.accuracy < lowestAcc) {
      lowestAcc = entry.accuracy;
      weakestCat = cat;
    }
  }

  return {
    totalImageAttempts: attempts.length,
    correctImageAttempts: correctCount,
    overallImageAccuracy: Math.round((correctCount / attempts.length) * 100),
    categoryBreakdown,
    weakestCategory: weakestCat,
  };
}
