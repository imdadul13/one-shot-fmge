import {
  AppState,
  FMGESubject,
  TopicItem,
  TopicAdaptivePriority,
  SubjectAdaptivePriority,
  TopicPriorityStatus,
  NextBestStudyAction,
  LearningPathwayStep,
  TopicAdaptivePriorityScoreBreakdown,
  TopicPerformanceMetrics,
} from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { calculateTopicPerformanceMetrics } from './performanceEngine';

/**
 * Calculates remaining days until the FMGE exam.
 * Defaults to 90 days if examDate is unconfigured or invalid.
 */
export function getDaysRemainingToExam(state: AppState): number {
  const examDateStr = state.settings?.examDate;
  if (!examDateStr) return 90;
  const examDate = new Date(examDateStr).getTime();
  const now = new Date().getTime();
  const diffDays = Math.ceil((examDate - now) / (1000 * 60 * 60 * 24));
  return Math.max(1, isNaN(diffDays) ? 90 : diffDays);
}

/**
 * Calculates days elapsed since an ISO timestamp.
 */
function getDaysSinceDate(isoDateString?: string): number {
  if (!isoDateString) return 999;
  const timestamp = new Date(isoDateString).getTime();
  if (isNaN(timestamp)) return 999;
  const now = new Date().getTime();
  const diffDays = Math.max(0, Math.floor((now - timestamp) / (1000 * 60 * 60 * 24)));
  return diffDays;
}

/**
 * Determines the current revision stage and overdue status based on the Revision Matrix.
 */
export function getTopicRevisionMatrixStatus(
  subjectId: string,
  topic: TopicItem,
  state: AppState
): {
  stage: 'R0' | 'R1' | 'R2' | 'R3' | 'COMPLETED';
  isDue: boolean;
  overdueDays: number;
  lastRevisionDate?: string;
} {
  const key = `${subjectId}-${topic.id}`;
  const custom = state.topicsState?.[key] || {};

  const notesDone = custom.notesDone ?? topic.notesDone ?? false;
  const qBankDone = custom.qBankDone ?? topic.qBankDone ?? false;
  const r1Done = custom.r1Done ?? topic.r1Done ?? false;
  const r2Done = custom.r2Done ?? topic.r2Done ?? false;
  const r3Done = custom.r3Done ?? topic.r3Done ?? false;

  const r1Date = custom.r1Date || topic.r1Date;
  const r2Date = custom.r2Date || topic.r2Date;
  const r3Date = custom.r3Date || topic.r3Date;

  // Fully completed all 3 revisions
  if (r3Done) {
    return {
      stage: 'COMPLETED',
      isDue: false,
      overdueDays: 0,
      lastRevisionDate: r3Date,
    };
  }

  // Initial read completed, R1 pending
  if (!r1Done) {
    if (notesDone || qBankDone) {
      return {
        stage: 'R0',
        isDue: true,
        overdueDays: 5,
        lastRevisionDate: undefined,
      };
    }
    return {
      stage: 'R0',
      isDue: false,
      overdueDays: 0,
      lastRevisionDate: undefined,
    };
  }

  // R1 done, R2 pending (due 14-21 days after R1)
  if (!r2Done) {
    const daysSinceR1 = getDaysSinceDate(r1Date);
    const isDue = daysSinceR1 >= 14;
    const overdueDays = isDue ? Math.max(0, daysSinceR1 - 14) : 0;
    return {
      stage: 'R1',
      isDue,
      overdueDays,
      lastRevisionDate: r1Date,
    };
  }

  // R2 done, R3 pending (due 30-45 days after R2)
  if (!r3Done) {
    const daysSinceR2 = getDaysSinceDate(r2Date);
    const isDue = daysSinceR2 >= 30;
    const overdueDays = isDue ? Math.max(0, daysSinceR2 - 30) : 0;
    return {
      stage: 'R2',
      isDue,
      overdueDays,
      lastRevisionDate: r2Date,
    };
  }

  return {
    stage: 'COMPLETED',
    isDue: false,
    overdueDays: 0,
    lastRevisionDate: r3Date,
  };
}

/**
 * Computes demonstrated topic mastery score (0 - 100%).
 * Strictly driven by demonstrated performance, active recall, and revision retention.
 */
export function calculateTopicDemonstratedMastery(
  metrics: TopicPerformanceMetrics,
  revisionStatus: { stage: string; isDue: boolean; overdueDays: number },
  learningPackageState?: { slidesCompleted?: boolean; flashcardsMastered?: boolean; casesCompleted?: boolean },
  errorNotebookCount = 0
): {
  masteryScore: number;
  dataConfidence: 'preliminary' | 'moderate' | 'high';
} {
  // If 0 attempts and not started, mastery is 0%
  if (metrics.totalAttempts === 0 && revisionStatus.stage === 'R0') {
    return { masteryScore: 0, dataConfidence: 'preliminary' };
  }

  // 1. MCQ Performance (Max 45%)
  // Recency-weighted accuracy
  const blendedAccuracy =
    metrics.totalAttempts >= 3
      ? 0.7 * metrics.recentAccuracy + 0.3 * metrics.accuracy
      : metrics.accuracy;
  const mcqContribution = (blendedAccuracy / 100) * 45;

  // 2. Attempt Volume & Confidence (Max 15%)
  let volumeContribution = 0;
  let dataConfidence: 'preliminary' | 'moderate' | 'high' = 'preliminary';
  if (metrics.totalAttempts >= 10) {
    volumeContribution = 15;
    dataConfidence = 'high';
  } else if (metrics.totalAttempts >= 5) {
    volumeContribution = 11;
    dataConfidence = 'moderate';
  } else if (metrics.totalAttempts >= 3) {
    volumeContribution = 7;
    dataConfidence = 'moderate';
  } else if (metrics.totalAttempts >= 1) {
    volumeContribution = 4;
    dataConfidence = 'preliminary';
  }

  // 3. Error Resolution Integrity (Max 15%)
  // Deduct 5% for each unresolved repeated error or unreviewed mistake
  const errorPenalty = Math.min(15, metrics.repeatedErrorsCount * 5 + errorNotebookCount * 3);
  const errorContribution = Math.max(0, 15 - errorPenalty);

  // 4. Active Learning Completion (Max 15%)
  let activeLearningContribution = 0;
  if (learningPackageState?.slidesCompleted) activeLearningContribution += 5;
  if (learningPackageState?.casesCompleted) activeLearningContribution += 5;
  if (learningPackageState?.flashcardsMastered) activeLearningContribution += 5;

  // 5. Revision Retention Matrix (Max 10%)
  let revisionContribution = 0;
  if (revisionStatus.stage === 'COMPLETED') {
    revisionContribution = 10;
  } else if (revisionStatus.stage === 'R2') {
    revisionContribution = 7;
  } else if (revisionStatus.stage === 'R1') {
    revisionContribution = 4;
  }

  const rawMastery =
    mcqContribution +
    volumeContribution +
    errorContribution +
    activeLearningContribution +
    revisionContribution;

  const masteryScore = Math.min(100, Math.max(0, Math.round(rawMastery)));
  return { masteryScore, dataConfidence };
}

/**
 * Computes the recommended learning pathway steps based on weakness severity.
 */
export function getRecommendedLearningPathway(
  priorityScore: number,
  masteryScore: number,
  repeatedErrorsCount: number,
  status: TopicPriorityStatus
): LearningPathwayStep[] {
  // Severely weak, repeated errors, or low mastery (< 50%)
  if (
    status === 'critical' ||
    repeatedErrorsCount >= 1 ||
    priorityScore >= 55 ||
    masteryScore < 50
  ) {
    return ['slides', 'cases', 'flashcards', 'video', 'mcqs'];
  }

  // High priority / moderately weak
  if (status === 'high_priority' || priorityScore >= 45 || masteryScore < 65) {
    return ['slides', 'flashcards', 'mcqs'];
  }

  // Stable or rapid review
  return ['slides', 'mcqs'];
}

/**
 * Generates the Next Best Study Action for a given topic.
 */
export function generateTopicStudyAction(
  subject: FMGESubject,
  topic: TopicItem,
  priorityScore: number,
  masteryScore: number,
  status: TopicPriorityStatus,
  metrics: TopicPerformanceMetrics,
  revisionStatus: { stage: string; isDue: boolean; overdueDays: number },
  errorNotebookCount: number,
  recommendedPathway: LearningPathwayStep[]
): NextBestStudyAction {
  const urgencyLevel: 'critical' | 'high' | 'medium' =
    status === 'critical' ? 'critical' : status === 'high_priority' ? 'high' : 'medium';

  // 1. Repeated Errors -> Review Error Vault
  if (metrics.repeatedErrorsCount >= 1 || errorNotebookCount >= 2) {
    return {
      id: `action-${subject.id}-${topic.id}-errors`,
      type: 'review_errors',
      topicId: topic.id,
      topicName: topic.name,
      subjectId: subject.id,
      subjectName: subject.name,
      subjectCode: subject.code,
      subjectColor: subject.color,
      weightage: subject.weightage,
      priorityScore,
      masteryScore,
      status,
      actionLabel: `Review Error Vault — ${subject.name} → ${topic.name}`,
      actionDescription: `Resolve ${metrics.repeatedErrorsCount || errorNotebookCount} repeated mistakes on high-yield exam concepts.`,
      reason: `Repeated errors (${metrics.repeatedErrorsCount}x) identified in this high-yield topic.`,
      allocatedMinutes: 15,
      urgencyLevel,
      recommendedPathway,
    };
  }

  // 2. Severely Weak or Unattempted High-Yield -> Master This Topic
  if (status === 'critical' || (metrics.totalAttempts === 0 && topic.isHighYield) || (metrics.totalAttempts >= 3 && metrics.recentAccuracy < 50)) {
    return {
      id: `action-${subject.id}-${topic.id}-master`,
      type: 'master_topic',
      topicId: topic.id,
      topicName: topic.name,
      subjectId: subject.id,
      subjectName: subject.name,
      subjectCode: subject.code,
      subjectColor: subject.color,
      weightage: subject.weightage,
      priorityScore,
      masteryScore,
      status,
      actionLabel: `Master This Topic — ${subject.name} → ${topic.name}`,
      actionDescription: 'Work through clinical slides, high-yield flashcards, and 10 targeted MCQs.',
      reason: metrics.totalAttempts === 0
        ? `Unattempted high-yield topic in high-weightage ${subject.name} (~${subject.weightage} Marks).`
        : `Recent accuracy (${metrics.recentAccuracy}%) is below FMGE pass threshold.`,
      allocatedMinutes: 30,
      urgencyLevel,
      recommendedPathway,
    };
  }

  // 3. Overdue Revision -> Complete Revision
  if (revisionStatus.isDue && revisionStatus.overdueDays >= 2) {
    const stageName = revisionStatus.stage === 'R0' ? 'R1' : revisionStatus.stage === 'R1' ? 'R2' : 'R3';
    return {
      id: `action-${subject.id}-${topic.id}-revision`,
      type: 'complete_revision',
      topicId: topic.id,
      topicName: topic.name,
      subjectId: subject.id,
      subjectName: subject.name,
      subjectCode: subject.code,
      subjectColor: subject.color,
      weightage: subject.weightage,
      priorityScore,
      masteryScore,
      status,
      actionLabel: `Complete ${stageName} Revision — ${subject.name} → ${topic.name}`,
      actionDescription: `Scheduled spaced repetition review is overdue by ${revisionStatus.overdueDays} days.`,
      reason: `${stageName} spaced revision interval is overdue by ${revisionStatus.overdueDays} days.`,
      allocatedMinutes: 25,
      urgencyLevel,
      recommendedPathway,
    };
  }

  // 4. Default -> Practice 10 MCQs
  return {
    id: `action-${subject.id}-${topic.id}-mcqs`,
    type: 'practice_mcqs',
    topicId: topic.id,
    topicName: topic.name,
    subjectId: subject.id,
    subjectName: subject.name,
    subjectCode: subject.code,
    subjectColor: subject.color,
    weightage: subject.weightage,
    priorityScore,
    masteryScore,
    status,
    actionLabel: `Practice 10 MCQs — ${subject.name} → ${topic.name}`,
    actionDescription: 'Reinforce clinical recall with a timed 10-question high-yield practice session.',
    reason: `Targeted practice for ${topic.name} to reinforce active recall and exam readiness.`,
    allocatedMinutes: 20,
    urgencyLevel,
    recommendedPathway,
  };
}

/**
 * Computes the transparent Dynamic Priority Score (0 - 100) for an FMGE topic.
 */
export function calculateTopicAdaptivePriority(
  subject: FMGESubject,
  topic: TopicItem,
  state: AppState,
  daysRemaining?: number
): TopicAdaptivePriority {
  const daysLeft = daysRemaining ?? getDaysRemainingToExam(state);
  const attempts = state.mcqAttempts || [];
  const metrics = calculateTopicPerformanceMetrics(subject.id, topic.id, attempts, topic);

  // Grand Test Weakness Check
  const gts = Array.isArray(state.grandTests) ? state.grandTests : [];
  const latestGt = gts.length > 0
    ? [...gts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[gts.length - 1]
    : null;
  const isGtWeakSubject = Boolean(latestGt?.weakSubjectIds?.includes(subject.id));

  // Count topic-specific error notebook mistakes
  const errorNotebookItems = Array.isArray(state.errorNotebook) ? state.errorNotebook : [];
  const topicErrorItems = errorNotebookItems.filter((e) => {
    if (e.subjectId !== subject.id) return false;
    const matchTopic = (e.topic || '').toLowerCase();
    return matchTopic.includes(topic.id.toLowerCase()) || matchTopic.includes(topic.name.toLowerCase());
  });
  const unreviewedErrorCount = topicErrorItems.filter((e) => !e.isReviewed).length;

  // Revision Matrix Status
  const revisionStatus = getTopicRevisionMatrixStatus(subject.id, topic, state);

  // Days since last study
  const lastAttemptDate = metrics.lastAttemptedDate || revisionStatus.lastRevisionDate;
  const daysSinceLastStudy = getDaysSinceDate(lastAttemptDate);

  // Topic Mastery Package State
  const packageKey = `${subject.id}-${topic.id}`;
  const masteryPkg = state.topicMasteryPackages?.[packageKey];
  const learningPackageState = {
    slidesCompleted: Boolean(masteryPkg?.slidesCompleted),
    casesCompleted: Boolean(masteryPkg?.clinicalCasesCompletedCount && masteryPkg.clinicalCasesCompletedCount >= 2),
    flashcardsMastered: Boolean(masteryPkg?.flashcardsMastered && masteryPkg.flashcardsMastered >= 5),
  };

  // 1. Calculate Demonstrated Mastery
  const { masteryScore, dataConfidence } = calculateTopicDemonstratedMastery(
    metrics,
    revisionStatus,
    learningPackageState,
    unreviewedErrorCount
  );

  // ---------------------------------------------------------------------------
  // MATHEMATICAL PRIORITY SCORING (0 - 100)
  // ---------------------------------------------------------------------------

  // Factor A: FMGE Importance (0 - 25 points)
  // Subject weightage: up to 15 pts (scaled against 45M max in Medicine)
  const subjectWeightContribution = Math.min(15, (subject.weightage / 45) * 15);
  // High-Yield Topic Bonus: 10 pts for HY, 3 pts for standard
  const topicHyBonus = topic.isHighYield ? 10 : 3;
  const fmgeWeightContribution = Number((subjectWeightContribution + topicHyBonus).toFixed(2));
  const fmgeImportanceScore = Math.round((fmgeWeightContribution / 25) * 100);

  // Factor B: Weakness & Accuracy Signal (0 - 35 points)
  let weaknessContribution = 0;
  let blendedAccuracy = 100;
  if (metrics.totalAttempts > 0) {
    blendedAccuracy =
      metrics.totalAttempts >= 3
        ? 0.7 * metrics.recentAccuracy + 0.3 * metrics.accuracy
        : metrics.accuracy;
    // Lower accuracy yields higher priority points (accelerated below 50% pass mark)
    const weaknessRate = blendedAccuracy < 50 ? 0.35 : 0.25;
    let rawWeakness = Math.max(0, 100 - blendedAccuracy) * weaknessRate;
    if (topic.isHighYield && metrics.totalAttempts >= 2 && blendedAccuracy < 50) {
      rawWeakness += 12; // Boost critical high-yield weakness
    }
    weaknessContribution = Number(rawWeakness.toFixed(2));
  }

  // Factor C: Repeated Error Burden (0 - 18 points)
  const errorBurdenRaw =
    metrics.repeatedErrorsCount * 6.0 +
    unreviewedErrorCount * 3.0 +
    metrics.incorrectAnswers * 1.0;
  const errorBurdenContribution = Number(Math.min(18, errorBurdenRaw).toFixed(2));

  // Factor D: Revision Urgency (0 - 15 points)
  let revisionUrgencyContribution = 0;
  if (revisionStatus.isDue) {
    revisionUrgencyContribution = Number(
      (10 + Math.min(5, revisionStatus.overdueDays * 0.5)).toFixed(2)
    );
  } else if (revisionStatus.stage === 'R0' && (topic.notesDone || topic.qBankDone)) {
    revisionUrgencyContribution = 8;
  }

  // Factor E: Recency Decay / Inactivity Gap (0 - 10 points)
  let recencyDecayContribution = 0;
  if (metrics.totalAttempts > 0 && daysSinceLastStudy < 999) {
    recencyDecayContribution = Number(Math.min(10, daysSinceLastStudy * 0.35).toFixed(2));
  }

  // Factor F: Grand Test Weakness Signal (0 - 10 points)
  let grandTestContribution = 0;
  if (isGtWeakSubject) {
    grandTestContribution += 7;
  }
  if (topicErrorItems.some((e) => (e.questionGist || '').toLowerCase().includes('gt'))) {
    grandTestContribution += 3;
  }
  grandTestContribution = Math.min(10, grandTestContribution);

  // Factor G: Cold-Start / Unattempted Discovery Bonus (0 - 20 points)
  // Strictly distinguishes Unattempted from 0% accuracy
  let unattemptedBonusContribution = 0;
  if (metrics.totalAttempts === 0) {
    if (topic.isHighYield) {
      unattemptedBonusContribution = 20; // High-yield unattempted topics get high priority
    } else {
      unattemptedBonusContribution = 8; // Low-yield unattempted topics get moderate priority
    }
  }

  // Factor H: Exam Proximity Adjustment (Scaling multiplier)
  let examProximityAdjustment = 0;
  if (daysLeft <= 30) {
    if (topic.isHighYield || weaknessContribution > 12 || revisionUrgencyContribution > 8) {
      examProximityAdjustment += 5; // Focus on high-yield and weak areas as exam nears
    } else if (metrics.totalAttempts === 0 && !topic.isHighYield) {
      examProximityAdjustment -= 6; // Deprioritize low-yield exploration in final 30 days
    }
  }
  if (daysLeft <= 14 && (topic.isHighYield || metrics.repeatedErrorsCount > 0)) {
    examProximityAdjustment += 4;
  }

  // Factor I: Demonstrated Mastery Protection Deduction (Up to -30 points)
  let masteryProtectionDeduction = 0;
  if (masteryScore >= 75 && metrics.totalAttempts >= 5 && metrics.recentAccuracy >= 80 && metrics.repeatedErrorsCount === 0) {
    masteryProtectionDeduction = Number(((masteryScore / 100) * 30).toFixed(2));
  }

  // Raw Sum Calculation
  const rawPrioritySum =
    fmgeWeightContribution +
    weaknessContribution +
    errorBurdenContribution +
    revisionUrgencyContribution +
    recencyDecayContribution +
    grandTestContribution +
    unattemptedBonusContribution +
    examProximityAdjustment -
    masteryProtectionDeduction;

  const priorityScore = Math.min(100, Math.max(0, Math.round(rawPrioritySum)));

  // Objective Status Categorization
  let status: TopicPriorityStatus = 'learning';
  if (metrics.totalAttempts === 0) {
    status = 'unattempted';
  } else if (
    priorityScore >= 75 ||
    (metrics.recentAccuracy <= 50 && metrics.repeatedErrorsCount >= 1 && topic.isHighYield)
  ) {
    status = 'critical';
  } else if (
    priorityScore >= 55 ||
    (revisionStatus.isDue && revisionStatus.overdueDays >= 3 && topic.isHighYield) ||
    (metrics.recentAccuracy < 60 && topic.isHighYield)
  ) {
    status = 'high_priority';
  } else if (priorityScore >= 40 || (metrics.totalAttempts >= 3 && metrics.recentAccuracy < 65)) {
    status = 'needs_attention';
  } else if (priorityScore < 35 && masteryScore >= 75 && metrics.repeatedErrorsCount === 0) {
    status = 'stable';
  } else {
    status = 'learning';
  }

  // Recommended Pathway
  const recommendedPathway = getRecommendedLearningPathway(
    priorityScore,
    masteryScore,
    metrics.repeatedErrorsCount,
    status
  );

  // Recommended Action
  const recommendedAction = generateTopicStudyAction(
    subject,
    topic,
    priorityScore,
    masteryScore,
    status,
    metrics,
    revisionStatus,
    unreviewedErrorCount,
    recommendedPathway
  );

  // Human-Readable Explanation ("Why recommended")
  const explanationParts: string[] = [];
  if (topic.isHighYield) {
    explanationParts.push(`Very High FMGE Weight (~${subject.weightage}M)`);
  }
  if (metrics.totalAttempts === 0) {
    explanationParts.push('Core syllabus topic currently unattempted');
  } else {
    if (metrics.repeatedErrorsCount >= 2) {
      explanationParts.push(`${metrics.repeatedErrorsCount} repeated mistakes on key concepts`);
    }
    if (metrics.recentAccuracy < 55) {
      explanationParts.push(`recent accuracy below target (${metrics.recentAccuracy}%)`);
    } else if (metrics.accuracy < 65) {
      explanationParts.push(`accuracy needs reinforcement (${metrics.accuracy}%)`);
    }
  }
  if (revisionStatus.isDue) {
    explanationParts.push(
      revisionStatus.overdueDays > 0
        ? `spaced revision overdue by ${revisionStatus.overdueDays}d`
        : 'scheduled spaced revision due today'
    );
  }
  if (isGtWeakSubject) {
    explanationParts.push('flagged weak subject in recent Grand Test');
  }
  if (daysLeft <= 30 && topic.isHighYield) {
    explanationParts.push('critical for final exam conditioning window');
  }

  const explanation =
    explanationParts.length > 0
      ? explanationParts.join(' + ')
      : `${subject.name} core topic requiring periodic active recall practice.`;

  const scoreBreakdown: TopicAdaptivePriorityScoreBreakdown = {
    fmgeWeightContribution,
    weaknessContribution,
    recencyDecayContribution,
    errorBurdenContribution,
    revisionUrgencyContribution,
    grandTestContribution,
    unattemptedBonusContribution,
    examProximityAdjustment,
    masteryProtectionDeduction,
  };

  return {
    topicId: topic.id,
    topicName: topic.name,
    subjectId: subject.id,
    subjectName: subject.name,
    subjectCode: subject.code,
    subjectColor: subject.color,
    phase: subject.phase,
    subjectWeightage: subject.weightage,
    isHighYield: topic.isHighYield,
    priorityScore,
    masteryScore,
    status,
    dataConfidence,
    fmgeImportanceScore,
    accuracy: metrics.accuracy,
    recentAccuracy: metrics.recentAccuracy,
    attemptCount: metrics.totalAttempts,
    errorCount: metrics.incorrectAnswers,
    repeatedErrorCount: metrics.repeatedErrorsCount,
    daysSinceLastStudy: daysSinceLastStudy === 999 ? 0 : daysSinceLastStudy,
    revisionDue: revisionStatus.isDue,
    revisionOverdueDays: revisionStatus.overdueDays,
    revisionStage: revisionStatus.stage as any,
    grandTestWeakness: isGtWeakSubject,
    grandTestMistakeCount: topicErrorItems.length,
    recommendedAction,
    explanation,
    scoreBreakdown,
    recommendedPathway,
  };
}

/**
 * Calculates adaptive priority for all ~198 topics across the 19 FMGE subjects.
 * Strictly sorts topics in descending order of Priority Score.
 */
export function calculateAllTopicsAdaptivePriority(state: AppState): TopicAdaptivePriority[] {
  const daysRemaining = getDaysRemainingToExam(state);
  const results: TopicAdaptivePriority[] = [];

  for (const subject of FMGE_SUBJECTS) {
    const customTopics = state.subjectProgress?.[subject.id]?.customTopics || [];
    const allTopics = [...subject.topics, ...customTopics];

    for (const topic of allTopics) {
      const priorityItem = calculateTopicAdaptivePriority(subject, topic, state, daysRemaining);
      results.push(priorityItem);
    }
  }

  // Sort descending by priorityScore; tie-break on subject weightage then mastery (lower mastery first)
  results.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    if (b.subjectWeightage !== a.subjectWeightage) {
      return b.subjectWeightage - a.subjectWeightage;
    }
    return a.masteryScore - b.masteryScore;
  });

  return results;
}

/**
 * Returns the Top N priority topics to study right now.
 */
export function getTopPriorityTopics(
  state: AppState,
  limit = 5
): TopicAdaptivePriority[] {
  const all = calculateAllTopicsAdaptivePriority(state);
  return all.slice(0, limit);
}

/**
 * Aggregates topic priorities to calculate subject-level priority scores and diagnostics.
 */
export function calculateSubjectAdaptivePriorities(state: AppState): SubjectAdaptivePriority[] {
  const allTopicPriorities = calculateAllTopicsAdaptivePriority(state);
  const subjectMap = new Map<string, TopicAdaptivePriority[]>();

  for (const item of allTopicPriorities) {
    const list = subjectMap.get(item.subjectId) || [];
    list.push(item);
    subjectMap.set(item.subjectId, list);
  }

  const gts = Array.isArray(state.grandTests) ? state.grandTests : [];
  const latestGt = gts.length > 0
    ? [...gts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[gts.length - 1]
    : null;
  const weakSubjectSet = new Set(latestGt?.weakSubjectIds || []);

  const results: SubjectAdaptivePriority[] = [];

  for (const subject of FMGE_SUBJECTS) {
    const topics = subjectMap.get(subject.id) || [];
    const totalTopics = topics.length;

    let totalScore = 0;
    let totalMastery = 0;
    let criticalCount = 0;
    let highPriorityCount = 0;
    let unattemptedCount = 0;
    let totalAttempts = 0;
    let totalCorrect = 0;

    for (const t of topics) {
      totalScore += t.priorityScore;
      totalMastery += t.masteryScore;
      if (t.status === 'critical') criticalCount++;
      if (t.status === 'high_priority') highPriorityCount++;
      if (t.status === 'unattempted') unattemptedCount++;
      totalAttempts += t.attemptCount;
      totalCorrect += Math.round((t.accuracy / 100) * t.attemptCount);
    }

    const avgScore = totalTopics > 0 ? totalScore / totalTopics : 0;
    const avgMastery = totalTopics > 0 ? Math.round(totalMastery / totalTopics) : 0;
    const subjectAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
    const isGtWeakness = weakSubjectSet.has(subject.id);

    // Subject priority combines topic priority average + subject weightage + GT weakness
    let subjectPriorityRaw =
      avgScore * 0.7 +
      Math.min(20, (subject.weightage / 45) * 20) +
      (isGtWeakness ? 10 : 0);

    if (criticalCount >= 2) {
      subjectPriorityRaw += 5;
    }

    const priorityScore = Math.min(100, Math.max(0, Math.round(subjectPriorityRaw)));

    // Rationale explanation
    const reasons: string[] = [];
    if (criticalCount > 0) reasons.push(`${criticalCount} critical weak topic${criticalCount > 1 ? 's' : ''}`);
    if (highPriorityCount > 0) reasons.push(`${highPriorityCount} high-priority area${highPriorityCount > 1 ? 's' : ''}`);
    if (isGtWeakness) reasons.push('Grand Test flagged weakness');
    if (unattemptedCount > 0 && subject.weightage >= 25) reasons.push(`${unattemptedCount} unattempted high-yield topics`);

    const explanation =
      reasons.length > 0
        ? reasons.join(' + ')
        : `High-yield syllabus with ${avgMastery}% average mastery.`;

    results.push({
      subjectId: subject.id,
      subjectName: subject.name,
      subjectCode: subject.code,
      subjectColor: subject.color,
      phase: subject.phase,
      weightage: subject.weightage,
      priorityScore,
      averageMastery: avgMastery,
      criticalTopicCount: criticalCount,
      highPriorityTopicCount: highPriorityCount,
      unattemptedCount,
      totalTopics,
      totalAttempts,
      subjectAccuracy,
      isGrandTestWeakness: isGtWeakness,
      explanation,
      topTopics: topics.slice(0, 3),
    });
  }

  // Sort descending by priorityScore
  results.sort((a, b) => b.priorityScore - a.priorityScore);
  return results;
}

/**
 * Returns the single highest-value Next Best Study Action for the student right now.
 * Used to power recommended actions and daily study guidance.
 */
export function getNextBestStudyAction(state: AppState): NextBestStudyAction {
  const topTopics = getTopPriorityTopics(state, 5);

  if (topTopics.length === 0) {
    const firstSubject = FMGE_SUBJECTS[0];
    const firstTopic = firstSubject.topics[0];
    return {
      id: 'default-study-action',
      type: 'practice_mcqs',
      topicId: firstTopic.id,
      topicName: firstTopic.name,
      subjectId: firstSubject.id,
      subjectName: firstSubject.name,
      subjectCode: firstSubject.code,
      subjectColor: firstSubject.color,
      weightage: firstSubject.weightage,
      priorityScore: 75,
      masteryScore: 0,
      status: 'high_priority',
      actionLabel: `Start Practice — ${firstSubject.name} → ${firstTopic.name}`,
      actionDescription: 'Begin high-yield practice on core FMGE syllabus questions.',
      reason: `High-yield core topic in ${firstSubject.name}.`,
      allocatedMinutes: 20,
      urgencyLevel: 'high',
      recommendedPathway: ['slides', 'cases', 'flashcards', 'video', 'mcqs'],
    };
  }

  // 1. If any top topic has an active Error Vault burden, prioritize Error Review
  const errorActionTopic = topTopics.find(
    (t) => t.repeatedErrorCount >= 2 || (t.errorCount >= 3 && t.accuracy < 50)
  );
  if (errorActionTopic) {
    return errorActionTopic.recommendedAction;
  }

  // 2. If any top topic has an Overdue Revision, prioritize Revision
  const revisionActionTopic = topTopics.find((t) => t.revisionDue && t.revisionOverdueDays >= 2);
  if (revisionActionTopic) {
    return revisionActionTopic.recommendedAction;
  }

  // 3. Otherwise return the #1 highest priority action
  return topTopics[0].recommendedAction;
}
