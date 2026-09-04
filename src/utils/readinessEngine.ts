import { AppState, ReadinessBreakdown, ReadinessComponentDetail, ReadinessExplanation } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { getLocalDateKey, getDaysUntilDateKey } from './date';

/**
 * 8-COMPONENT EXPLICIT BASE WEIGHTS (Sum = 100%)
 */
export const READINESS_BASE_WEIGHTS = {
  topicMastery: 20, // Subject-weighted syllabus completion
  highYieldMastery: 15, // Focus on 138 high-yield topics
  mcqAccuracy: 20, // QBank accuracy & solved question performance
  gtPerformance: 20, // Grand Test score relative to 300M target
  gtTrend: 5, // Score progression across consecutive mock exams
  revisionCompletion: 10, // R1, R2, and R3 revision depth
  errorBurden: 5, // Resolution rate of logged error notebook cards
  studyConsistency: 5, // Recent study logs activity & goal adherence
};

/**
 * Calculates transparent, explainable FMGE Study Readiness from actual user data.
 * Does NOT generate pseudo-medical pass probabilities; represents normalized STUDY READINESS (0-100).
 */
export function calculateStudyReadiness(state: AppState): ReadinessBreakdown {
  if (!state) {
    return createEmptyReadinessBreakdown();
  }

  // 1. GATHER RAW DATA COUNTS
  let totalTopicsCount = 0;
  let totalHighYieldTopicsCount = 0;
  let completedNotesTopics = 0;
  let completedQBankTopics = 0;
  let completedR1Topics = 0;
  let completedR2Topics = 0;
  let completedR3Topics = 0;
  let completedHighYieldNotes = 0;
  let completedHighYieldQBank = 0;
  let completedHighYieldR1 = 0;

  let totalWeightedSyllabusSum = 0;
  let totalSyllabusWeightage = 0;

  let totalAccuracySum = 0;
  let accuracyCount = 0;
  let totalQuestionsSolvedInTopics = 0;

  FMGE_SUBJECTS.forEach((subject) => {
    const customTopics = state.subjectProgress?.[subject.id]?.customTopics || [];
    const allTopics = [...subject.topics, ...customTopics];
    const subjectWeight = subject.weightage || 15;
    totalSyllabusWeightage += subjectWeight;

    let subjectTopicPoints = 0;

    allTopics.forEach((topic) => {
      totalTopicsCount++;
      if (topic.isHighYield) totalHighYieldTopicsCount++;

      const key = `${subject.id}-${topic.id}`;
      const savedTopic = state.topicsState?.[key] || {};
      const isNotes = savedTopic.notesDone ?? topic.notesDone ?? false;
      const isQBank = savedTopic.qBankDone ?? topic.qBankDone ?? false;
      const isR1 = savedTopic.r1Done ?? topic.r1Done ?? false;
      const isR2 = savedTopic.r2Done ?? topic.r2Done ?? false;
      const isR3 = savedTopic.r3Done ?? topic.r3Done ?? false;

      // Accuracy signals
      const accuracy = savedTopic.qBankAccuracy ?? topic.qBankAccuracy;
      const solvedCount = savedTopic.qBankSolvedCount ?? topic.qBankSolvedCount ?? 0;
      if (typeof accuracy === 'number' && accuracy > 0) {
        totalAccuracySum += accuracy;
        accuracyCount++;
        totalQuestionsSolvedInTopics += solvedCount;
      }

      let topicPoints = 0;
      if (isNotes) {
        completedNotesTopics++;
        topicPoints += 0.6;
        if (topic.isHighYield) completedHighYieldNotes++;
      }
      if (isQBank) {
        completedQBankTopics++;
        topicPoints += 0.4;
        if (topic.isHighYield) completedHighYieldQBank++;
      }
      if (isR1) {
        completedR1Topics++;
        if (topic.isHighYield) completedHighYieldR1++;
      }
      if (isR2) completedR2Topics++;
      if (isR3) completedR3Topics++;

      subjectTopicPoints += topicPoints;
    });

    const subjectFraction = allTopics.length > 0 ? subjectTopicPoints / allTopics.length : 0;
    totalWeightedSyllabusSum += subjectFraction * subjectWeight;
  });

  // Grand Tests data
  const gts = Array.isArray(state.grandTests) ? state.grandTests : [];
  const sortedGTs = [...gts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Error Notebook data
  const errors = Array.isArray(state.errorNotebook) ? state.errorNotebook : [];
  const reviewedErrorsCount = errors.filter((e) => e.isReviewed).length;

  // Telegram Quiz solved data
  const telegramQuestions = Array.isArray(state.telegramQuestions) ? state.telegramQuestions : [];
  const solvedTelegramQuestions = telegramQuestions.filter((q) => q.userStatus === 'correct' || q.userStatus === 'incorrect');
  const correctTelegramCount = solvedTelegramQuestions.filter((q) => q.userStatus === 'correct').length;

  // Study Logs
  const studyLogs = state.studyLogs || {};
  const activeLogDays = Object.values(studyLogs).filter(
    (log) => (log.studyMinutes || 0) > 0 || (log.questionsSolved || 0) > 0
  );

  // 2. CHECK IF USER HAS ANY REAL DATA
  const hasAnyData =
    completedNotesTopics > 0 ||
    completedQBankTopics > 0 ||
    completedR1Topics > 0 ||
    gts.length > 0 ||
    errors.length > 0 ||
    solvedTelegramQuestions.length > 0 ||
    activeLogDays.length > 0;

  if (!hasAnyData) {
    return createEmptyReadinessBreakdown();
  }

  // 3. COMPUTE INDIVIDUAL COMPONENT SCORES (0-100) & DATA STATUSES
  const components: ReadinessComponentDetail[] = [];

  // Pillar 1: Topic Mastery (Subject-Weighted) (Base Weight: 20%)
  const topicMasteryScore = totalSyllabusWeightage > 0
    ? Math.min(100, Math.round((totalWeightedSyllabusSum / totalSyllabusWeightage) * 100))
    : 0;
  const topicMasteryStatus: ReadinessComponentDetail['status'] =
    completedNotesTopics === 0 && completedQBankTopics === 0
      ? 'no_data'
      : topicMasteryScore >= 65
      ? 'good'
      : topicMasteryScore >= 30
      ? 'moderate'
      : 'needs_work';

  components.push({
    id: 'topic_mastery',
    name: 'Syllabus & Topic Mastery',
    weight: READINESS_BASE_WEIGHTS.topicMastery,
    effectiveWeight: 0,
    score: topicMasteryScore,
    status: topicMasteryStatus,
    label: `${topicMasteryScore}% Mastered`,
    details: `${completedNotesTopics}/${totalTopicsCount} notes, ${completedQBankTopics} QBanks completed across 19 subjects.`,
  });

  // Pillar 2: High-Yield Topic Mastery (Base Weight: 15%)
  const highYieldPoints = completedHighYieldNotes * 0.4 + completedHighYieldQBank * 0.3 + completedHighYieldR1 * 0.3;
  const highYieldScore = totalHighYieldTopicsCount > 0
    ? Math.min(100, Math.round((highYieldPoints / totalHighYieldTopicsCount) * 100))
    : 0;
  const highYieldStatus: ReadinessComponentDetail['status'] =
    completedHighYieldNotes === 0 && completedHighYieldR1 === 0
      ? 'no_data'
      : highYieldScore >= 60
      ? 'good'
      : highYieldScore >= 25
      ? 'moderate'
      : 'needs_work';

  components.push({
    id: 'high_yield_mastery',
    name: 'High-Yield Topic Priority',
    weight: READINESS_BASE_WEIGHTS.highYieldMastery,
    effectiveWeight: 0,
    score: highYieldScore,
    status: highYieldStatus,
    label: `${highYieldScore}% High-Yield Complete`,
    details: `${completedHighYieldNotes}/${totalHighYieldTopicsCount} core repeat topics covered.`,
  });

  // Pillar 3: MCQ Accuracy & Solving Performance (Base Weight: 20%)
  let mcqScore = 0;
  let mcqStatus: ReadinessComponentDetail['status'] = 'no_data';
  let mcqLabel = 'No MCQs logged';
  let mcqDetails = 'Solve QBanks, Telegram Daily Quizzes, or AI Coach to record accuracy.';

  const attempts = Array.isArray(state.mcqAttempts) ? state.mcqAttempts : [];
  const attemptCount = attempts.length;
  const attemptCorrect = attempts.filter((a) => a.isCorrect).length;

  if (attemptCount > 0 || accuracyCount > 0 || solvedTelegramQuestions.length > 0) {
    let totalCorrectWeight = 0;
    let totalSamples = 0;

    if (attemptCount > 0) {
      const attemptAccuracy = (attemptCorrect / attemptCount) * 100;
      totalCorrectWeight += attemptAccuracy * attemptCount;
      totalSamples += attemptCount;
    }

    if (accuracyCount > 0) {
      const avgTopicAccuracy = totalAccuracySum / accuracyCount;
      totalCorrectWeight += avgTopicAccuracy * accuracyCount;
      totalSamples += accuracyCount;
    }

    if (solvedTelegramQuestions.length > 0 && attemptCount === 0) {
      const telegramAccuracy = (correctTelegramCount / solvedTelegramQuestions.length) * 100;
      totalCorrectWeight += telegramAccuracy * solvedTelegramQuestions.length;
      totalSamples += solvedTelegramQuestions.length;
    }

    const calculatedAvgAccuracy = Math.round(totalCorrectWeight / Math.max(1, totalSamples));
    mcqScore = Math.min(100, Math.max(0, calculatedAvgAccuracy));
    mcqStatus = mcqScore >= 75 ? 'good' : mcqScore >= 60 ? 'moderate' : 'needs_work';
    mcqLabel = `${mcqScore}% MCQ Accuracy`;
    mcqDetails = `Aggregated across ${attemptCount > 0 ? `${attemptCount} logged question attempts, ` : ''}${accuracyCount} topic QBanks and ${solvedTelegramQuestions.length} daily quiz questions.`;
  } else if (completedQBankTopics > 0) {
    // Checkboxes checked without custom accuracy %
    mcqScore = 60;
    mcqStatus = 'moderate';
    mcqLabel = 'Default Benchmark (60%)';
    mcqDetails = `${completedQBankTopics} QBanks marked done without explicit accuracy percentages.`;
  }

  components.push({
    id: 'mcq_accuracy',
    name: 'MCQ Accuracy & Clinical Solving',
    weight: READINESS_BASE_WEIGHTS.mcqAccuracy,
    effectiveWeight: 0,
    score: mcqScore,
    status: mcqStatus,
    label: mcqLabel,
    details: mcqDetails,
  });

  // Pillar 4: Grand Test Performance (Base Weight: 20%)
  let gtScore = 0;
  let gtStatus: ReadinessComponentDetail['status'] = 'no_data';
  let gtLabel = 'No GTs logged';
  let gtDetails = 'Log full 300-mark mock tests to incorporate Grand Test performance.';

  if (sortedGTs.length > 0) {
    // Give 50% weight to latest GT, 50% to average of all GTs
    const latestGT = sortedGTs[sortedGTs.length - 1];
    const totalScore = sortedGTs.reduce((sum, g) => sum + g.score, 0);
    const avgScore = totalScore / sortedGTs.length;
    const weightedGtMarks = latestGT.score * 0.5 + avgScore * 0.5;

    // Direct, normalized score out of 300 marks
    gtScore = Math.min(100, Math.max(0, Math.round((weightedGtMarks / 300) * 100)));
    gtStatus = weightedGtMarks >= 170 ? 'good' : weightedGtMarks >= 145 ? 'moderate' : 'needs_work';
    gtLabel = `${Math.round(weightedGtMarks)}/300 Marks (${gtScore}%)`;
    gtDetails = `Latest: ${latestGT.score}/300 (${latestGT.platform}). Average: ${Math.round(avgScore)}/300 across ${sortedGTs.length} mock(s).`;
  }

  components.push({
    id: 'gt_performance',
    name: 'Grand Test Performance',
    weight: READINESS_BASE_WEIGHTS.gtPerformance,
    effectiveWeight: 0,
    score: gtScore,
    status: gtStatus,
    label: gtLabel,
    details: gtDetails,
  });

  // Pillar 5: Grand Test Trajectory & Trend (Base Weight: 5%)
  let gtTrendScore = 50;
  let gtTrendStatus: ReadinessComponentDetail['status'] = 'no_data';
  let gtTrendLabel = 'Single mock / insufficient trend';
  let gtTrendDetails = 'Take at least 2 Grand Tests to measure trajectory.';

  if (sortedGTs.length >= 2) {
    const latestGT = sortedGTs[sortedGTs.length - 1];
    const previousGT = sortedGTs[sortedGTs.length - 2];
    const earliestGT = sortedGTs[0];
    const deltaFromPrevious = latestGT.score - previousGT.score;
    const deltaOverall = latestGT.score - earliestGT.score;

    if (deltaFromPrevious > 10 || deltaOverall > 15) {
      gtTrendScore = 95;
      gtTrendStatus = 'good';
      gtTrendLabel = `Improving (+${Math.max(deltaFromPrevious, deltaOverall)} marks)`;
    } else if (deltaFromPrevious >= 0) {
      gtTrendScore = 80;
      gtTrendStatus = 'good';
      gtTrendLabel = `Positive Trajectory (+${deltaFromPrevious} marks)`;
    } else if (deltaFromPrevious >= -8) {
      gtTrendScore = 55;
      gtTrendStatus = 'moderate';
      gtTrendLabel = `Stable (-${Math.abs(deltaFromPrevious)} marks)`;
    } else {
      gtTrendScore = 30;
      gtTrendStatus = 'needs_work';
      gtTrendLabel = `Declining (-${Math.abs(deltaFromPrevious)} marks)`;
    }
    gtTrendDetails = `Score moved from ${earliestGT.score} to ${latestGT.score} across ${sortedGTs.length} tests.`;
  }

  components.push({
    id: 'gt_trend',
    name: 'GT Trajectory & Trend',
    weight: READINESS_BASE_WEIGHTS.gtTrend,
    effectiveWeight: 0,
    score: gtTrendScore,
    status: gtTrendStatus,
    label: gtTrendLabel,
    details: gtTrendDetails,
  });

  // Pillar 6: Revision Adherence & Cycles (Base Weight: 10%)
  const revisionPoints = completedR1Topics * 0.5 + completedR2Topics * 0.3 + completedR3Topics * 0.2;
  const revisionScore = totalTopicsCount > 0
    ? Math.min(100, Math.round((revisionPoints / totalTopicsCount) * 100))
    : 0;
  const revisionStatus: ReadinessComponentDetail['status'] =
    completedR1Topics === 0
      ? 'no_data'
      : revisionScore >= 50
      ? 'good'
      : revisionScore >= 20
      ? 'moderate'
      : 'needs_work';

  components.push({
    id: 'revision_completion',
    name: 'Revision Depth (R1/R2/R3)',
    weight: READINESS_BASE_WEIGHTS.revisionCompletion,
    effectiveWeight: 0,
    score: revisionScore,
    status: revisionStatus,
    label: `${revisionScore}% Revision Depth`,
    details: `R1: ${completedR1Topics}, R2: ${completedR2Topics}, R3: ${completedR3Topics} topics refreshed.`,
  });

  // Pillar 7: Error Notebook Remediation (Base Weight: 5%)
  let errorScore = 100;
  let errorStatus: ReadinessComponentDetail['status'] = 'no_data';
  let errorLabel = 'Zero logged mistakes';
  let errorDetails = 'Add mistake entries from GTs to maintain your 20th error notebook.';

  if (errors.length > 0) {
    const unreviewedCount = errors.length - reviewedErrorsCount;
    errorScore = Math.round((reviewedErrorsCount / errors.length) * 100);
    errorStatus = errorScore >= 70 ? 'good' : errorScore >= 40 ? 'moderate' : 'needs_work';
    errorLabel = `${errorScore}% Mistakes Remedied`;
    errorDetails = `${reviewedErrorsCount} reviewed, ${unreviewedCount} unreviewed out of ${errors.length} mistake cards.`;
  }

  components.push({
    id: 'error_burden',
    name: 'Error Notebook Remediation',
    weight: READINESS_BASE_WEIGHTS.errorBurden,
    effectiveWeight: 0,
    score: errorScore,
    status: errorStatus,
    label: errorLabel,
    details: errorDetails,
  });

  // Pillar 8: Study Consistency & Activity (Base Weight: 5%)
  const recentDays = getRecentStudyDaysCount(studyLogs, 14);
  let consistencyScore = 50;
  let consistencyStatus: ReadinessComponentDetail['status'] = 'no_data';
  let consistencyLabel = 'No recent study logs';
  let consistencyDetails = 'Log daily study hours to track consistency.';

  if (activeLogDays.length > 0) {
    if (recentDays >= 8) {
      consistencyScore = 95;
      consistencyStatus = 'good';
      consistencyLabel = 'High Consistency';
    } else if (recentDays >= 4) {
      consistencyScore = 75;
      consistencyStatus = 'good';
      consistencyLabel = 'Steady Consistency';
    } else if (recentDays >= 1) {
      consistencyScore = 50;
      consistencyStatus = 'moderate';
      consistencyLabel = 'Moderate / Inconsistent';
    } else {
      consistencyScore = 35;
      consistencyStatus = 'needs_work';
      consistencyLabel = 'Study Gap Detected';
    }
    consistencyDetails = `${recentDays} active study days logged in the last 14 days.`;
  }

  components.push({
    id: 'study_consistency',
    name: 'Study Consistency & Streak',
    weight: READINESS_BASE_WEIGHTS.studyConsistency,
    effectiveWeight: 0,
    score: consistencyScore,
    status: consistencyStatus,
    label: consistencyLabel,
    details: consistencyDetails,
  });

  // 4. DYNAMIC WEIGHT RE-NORMALIZATION
  // Filter active components (exclude those with 'no_data')
  const activeComponents = components.filter((c) => c.status !== 'no_data');
  const activeWeightSum = activeComponents.reduce((sum, c) => sum + c.weight, 0);

  if (activeWeightSum === 0) {
    return createEmptyReadinessBreakdown();
  }

  let weightedScoreSum = 0;
  components.forEach((c) => {
    if (c.status !== 'no_data') {
      const normalizedWeight = Math.round((c.weight / activeWeightSum) * 100);
      c.effectiveWeight = normalizedWeight;
      weightedScoreSum += c.score * (c.weight / activeWeightSum);
    } else {
      c.effectiveWeight = 0;
    }
  });

  const finalReadinessScore = Math.min(100, Math.max(0, Math.round(weightedScoreSum)));

  // Generate explainable bullets
  const whyExplanation: ReadinessExplanation = {
    topicMastery: `Syllabus Mastery: ${topicMasteryScore}% (${completedNotesTopics}/${totalTopicsCount} topics)`,
    highYieldMastery: `High-Yield Focus: ${highYieldScore}% (${completedHighYieldNotes}/${totalHighYieldTopicsCount} core topics)`,
    mcqAccuracy: mcqStatus !== 'no_data' ? `MCQ Accuracy: ${mcqLabel}` : 'MCQ Accuracy: Pending data',
    gtPerformance: gtStatus !== 'no_data' ? `Grand Test Performance: ${gtLabel}` : 'Grand Test: No mock tests logged yet',
    recentTrend: gtTrendStatus !== 'no_data' ? `Recent GT Trend: ${gtTrendLabel}` : 'Recent Trend: Baseline establishing',
    revisionCompletion: `Revision Depth: ${revisionScore}% (${completedR1Topics} R1, ${completedR2Topics} R2)`,
    errorBurden: errorStatus !== 'no_data' ? `Error Remediation: ${errorLabel}` : 'Error Notebook: 0 errors logged',
    studyConsistency: consistencyStatus !== 'no_data' ? `Study Activity: ${consistencyLabel}` : 'Study Activity: Pending daily logs',
  };

  let summaryText = 'Readiness is progressing steadily based on your current study milestones.';
  if (finalReadinessScore >= 75) {
    summaryText = 'Excellent comprehensive preparation across high-yield topics, MCQ accuracy, and mock exams.';
  } else if (finalReadinessScore >= 50) {
    summaryText = 'Solid foundational preparation. Continue accelerating high-yield revisions and timed Grand Tests.';
  } else {
    summaryText = 'Early-stage preparation. Prioritize syllabus coverage for the Mega 4 subjects and daily MCQ practice.';
  }

  return {
    hasEnoughData: true,
    score: finalReadinessScore,
    components,
    summaryText,
    trendText: gtTrendStatus !== 'no_data' ? gtTrendLabel : 'Establishing baseline',
    whyExplanation,
  };
}

function getRecentStudyDaysCount(studyLogs: Record<string, any>, pastDays: number): number {
  if (!studyLogs || typeof studyLogs !== 'object') return 0;
  const now = new Date();
  let count = 0;

  for (let i = 0; i < pastDays; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = getLocalDateKey(d);
    const log = studyLogs[key];
    if (log && ((log.studyMinutes || 0) > 0 || (log.questionsSolved || 0) > 0)) {
      count++;
    }
  }
  return count;
}

function createEmptyReadinessBreakdown(): ReadinessBreakdown {
  const components: ReadinessComponentDetail[] = [
    {
      id: 'topic_mastery',
      name: 'Syllabus & Topic Mastery',
      weight: READINESS_BASE_WEIGHTS.topicMastery,
      effectiveWeight: 0,
      score: 0,
      status: 'no_data',
      label: 'Not started',
      details: 'Mark syllabus topics complete to begin tracking coverage.',
    },
    {
      id: 'high_yield_mastery',
      name: 'High-Yield Topic Priority',
      weight: READINESS_BASE_WEIGHTS.highYieldMastery,
      effectiveWeight: 0,
      score: 0,
      status: 'no_data',
      label: 'Not started',
      details: 'Complete high-yield topics across the 19 FMGE subjects.',
    },
    {
      id: 'mcq_accuracy',
      name: 'MCQ Accuracy & Clinical Solving',
      weight: READINESS_BASE_WEIGHTS.mcqAccuracy,
      effectiveWeight: 0,
      score: 0,
      status: 'no_data',
      label: 'No MCQs logged',
      details: 'Solve topic QBanks or Telegram quiz questions to track accuracy.',
    },
    {
      id: 'gt_performance',
      name: 'Grand Test Performance',
      weight: READINESS_BASE_WEIGHTS.gtPerformance,
      effectiveWeight: 0,
      score: 0,
      status: 'no_data',
      label: 'No GTs logged',
      details: 'Log 300-mark mock exams to assess performance under exam conditions.',
    },
    {
      id: 'gt_trend',
      name: 'GT Trajectory & Trend',
      weight: READINESS_BASE_WEIGHTS.gtTrend,
      effectiveWeight: 0,
      score: 0,
      status: 'no_data',
      label: 'Insufficient GT data',
      details: 'Log multiple mock exams to measure score progression.',
    },
    {
      id: 'revision_completion',
      name: 'Revision Depth (R1/R2/R3)',
      weight: READINESS_BASE_WEIGHTS.revisionCompletion,
      effectiveWeight: 0,
      score: 0,
      status: 'no_data',
      label: 'Not started',
      details: 'Complete R1, R2, and R3 revision cycles.',
    },
    {
      id: 'error_burden',
      name: 'Error Notebook Remediation',
      weight: READINESS_BASE_WEIGHTS.errorBurden,
      effectiveWeight: 0,
      score: 0,
      status: 'no_data',
      label: '0 error cards',
      details: 'Add and review mistake cards from your mocks.',
    },
    {
      id: 'study_consistency',
      name: 'Study Consistency & Streak',
      weight: READINESS_BASE_WEIGHTS.studyConsistency,
      effectiveWeight: 0,
      score: 0,
      status: 'no_data',
      label: 'No recent activity',
      details: 'Log daily study time in the planner or dashboard.',
    },
  ];

  return {
    hasEnoughData: false,
    score: null,
    components,
    summaryText: 'Not enough data. Start checking off topics or logging mock test scores to calculate readiness.',
    trendText: 'Pending initial data',
    whyExplanation: {
      topicMastery: 'Topic Mastery: 0% (No topics marked)',
      highYieldMastery: 'High-Yield Mastery: 0%',
      mcqAccuracy: 'MCQ Accuracy: Pending data',
      gtPerformance: 'Grand Test Performance: No GTs logged',
      recentTrend: 'Recent Trend: Pending data',
      revisionCompletion: 'Revision Completion: 0%',
      errorBurden: 'Error Burden: No cards logged',
      studyConsistency: 'Study Activity: No logs recorded',
    },
  };
}
