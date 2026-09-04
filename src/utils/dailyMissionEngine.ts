import {
  AppState,
  DailyMissionTask,
  DailyMissionTaskType,
  DailyMissionSummary,
  GeneratedDailyMission,
  TopicAdaptivePriority,
  DailyStudyLog,
} from '../types';
import { calculateAllTopicsAdaptivePriority } from './adaptivePriorityEngine';
import { getLocalDateKey } from './date';

/**
 * Calculates current study streak in consecutive days from study logs.
 */
export function calculateStudyStreak(studyLogs: Record<string, DailyStudyLog> = {}): number {
  const dates = Object.keys(studyLogs).sort().reverse();
  if (dates.length === 0) return 0;

  const todayKey = getLocalDateKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getLocalDateKey(yesterday);

  // Check if today or yesterday has study activity
  let currentCheckDate = new Date();
  const todayLog = studyLogs[todayKey];
  const hasTodayActivity = todayLog && (todayLog.studyMinutes > 0 || todayLog.questionsSolved > 0 || (todayLog.completedTaskIds && todayLog.completedTaskIds.length > 0));

  if (!hasTodayActivity) {
    const yesterdayLog = studyLogs[yesterdayKey];
    const hasYesterdayActivity = yesterdayLog && (yesterdayLog.studyMinutes > 0 || yesterdayLog.questionsSolved > 0);
    if (!hasYesterdayActivity) {
      return 0;
    }
    // Start streak count from yesterday
    currentCheckDate = yesterday;
  }

  let streak = 0;
  while (true) {
    const checkKey = getLocalDateKey(currentCheckDate);
    const log = studyLogs[checkKey];
    if (log && (log.studyMinutes > 0 || log.questionsSolved > 0 || (log.completedTaskIds && log.completedTaskIds.length > 0))) {
      streak++;
      currentCheckDate.setDate(currentCheckDate.getDate() - 1);
    } else {
      break;
    }
  }

  return Math.max(1, streak);
}

/**
 * Deterministically constructs today's study mission based on the Adaptive Priority Engine
 * and the user's selected time budget.
 */
export function generateDailyMission(
  state: AppState,
  timeBudgetMinutes = 120
): GeneratedDailyMission {
  const todayKey = getLocalDateKey();
  const streakDays = calculateStudyStreak(state.studyLogs);
  const completedIds = state.completedMissionIds || {};

  // 1. Fetch prioritized topics from the Adaptive Priority Engine (single source of truth)
  const prioritizedTopics = calculateAllTopicsAdaptivePriority(state);

  const tasks: DailyMissionTask[] = [];
  const seenTopicKeys = new Set<string>();
  let accumulatedMinutes = 0;

  // 2. Iterate through prioritized topics and construct tasks to fit the time budget
  for (const topic of prioritizedTopics) {
    if (accumulatedMinutes >= timeBudgetMinutes) break;

    const topicKey = `${topic.subjectId}-${topic.topicId}`;
    if (seenTopicKeys.has(topicKey)) continue;

    // Remaining available minutes in today's budget
    const remainingTime = timeBudgetMinutes - accumulatedMinutes;

    // Skip stable mastered topics unless revision is due
    if (topic.status === 'stable' && !topic.revisionDue && prioritizedTopics.length > 10) {
      continue;
    }

    let taskType: DailyMissionTaskType = 'PRACTICE_MCQS';
    let duration = 20;
    let actionLabel = '';
    let actionDescription = '';
    let targetCount = 10;

    // ADAPTIVE TASK SELECTION RULES:
    // Rule A: Repeated errors or active Error Vault burden
    if (topic.repeatedErrorCount >= 1 || topic.errorCount >= 3) {
      taskType = 'REVIEW_ERROR_VAULT';
      duration = remainingTime < 25 ? 15 : 20;
      targetCount = topic.repeatedErrorCount || topic.errorCount;
      actionLabel = `Review ${targetCount} Errors`;
      actionDescription = `Remediate ${targetCount} recurring mistakes in ${topic.subjectName} → ${topic.topicName}.`;
    }
    // Rule B: Overdue Spaced Revision
    else if (topic.revisionDue && topic.revisionOverdueDays >= 2) {
      taskType = 'REVISION';
      duration = remainingTime < 30 ? 20 : 25;
      actionLabel = `Start Spaced Revision`;
      actionDescription = `${topic.revisionStage} spaced repetition interval is overdue by ${topic.revisionOverdueDays} days.`;
    }
    // Rule C: Unattempted High-Yield or Severely Weak Core Topic
    else if (
      (topic.attemptCount === 0 && topic.isHighYield) ||
      topic.status === 'critical' ||
      (topic.attemptCount >= 3 && topic.recentAccuracy < 50)
    ) {
      // If we have at least 25 minutes left, assign full Master Topic
      if (remainingTime >= 25) {
        taskType = 'MASTER_TOPIC';
        duration = remainingTime < 35 ? 25 : 30;
        actionLabel = 'Master This Topic';
        actionDescription = `High-yield clinical package: slides, high-yield flashcards, and 10 targeted MCQs.`;
      } else if (remainingTime >= 15) {
        taskType = 'CRASH_SLIDES';
        duration = 15;
        actionLabel = 'Crash Visual Slides';
        actionDescription = `Rapid review of high-yield anatomical/pathological diagrams and tables.`;
      } else {
        taskType = 'FLASHCARDS';
        duration = 10;
        targetCount = 5;
        actionLabel = 'Master Flashcards';
        actionDescription = `Active recall drill on key diagnostic buzzwords and drug-of-choice facts.`;
      }
    }
    // Rule D: Moderate weakness or active reinforcement
    else {
      taskType = 'PRACTICE_MCQS';
      duration = remainingTime < 20 ? 15 : 20;
      targetCount = 10;
      actionLabel = 'Practice 10 MCQs';
      actionDescription = `10 clinical vignette MCQs with instant explanations and performance logging.`;
    }

    // Ensure task duration does not exceed the remaining budget significantly
    if (accumulatedMinutes + duration > timeBudgetMinutes + 10 && tasks.length >= 2) {
      // If adding this task greatly exceeds budget, switch to a shorter 10-15m task if possible
      if (remainingTime >= 10) {
        taskType = 'FLASHCARDS';
        duration = Math.min(remainingTime, 10);
        targetCount = 5;
        actionLabel = 'Rapid Flashcard Drill';
        actionDescription = `Quick 5-card active recall drill on ${topic.topicName}.`;
      } else {
        break;
      }
    }

    const taskId = `mission-task-${todayKey}-${topic.subjectId}-${topic.topicId}-${taskType.toLowerCase()}`;
    const isCompleted = Boolean(completedIds[taskId]);

    tasks.push({
      id: taskId,
      sequenceNumber: tasks.length + 1,
      type: taskType,
      subjectId: topic.subjectId,
      subjectName: topic.subjectName,
      subjectCode: topic.subjectCode,
      subjectColor: topic.subjectColor,
      topicId: topic.topicId,
      topicName: topic.topicName,
      isHighYield: topic.isHighYield,
      priorityScore: topic.priorityScore,
      masteryScore: topic.masteryScore,
      durationMinutes: duration,
      reason: topic.explanation,
      actionLabel,
      actionDescription,
      targetCount,
      isCompleted,
      recommendedPathway: topic.recommendedPathway,
    });

    seenTopicKeys.add(topicKey);
    accumulatedMinutes += duration;
  }

  // 3. If budget still has >= 20 minutes remaining, add Mixed High-Yield MCQs
  if (timeBudgetMinutes - accumulatedMinutes >= 20) {
    const mixedDuration = Math.min(30, timeBudgetMinutes - accumulatedMinutes);
    const topWeakSubjects = Array.from(
      new Set(prioritizedTopics.slice(0, 5).map((t) => t.subjectName))
    ).slice(0, 3);

    const taskId = `mission-task-${todayKey}-mixed-high-yield`;
    const isCompleted = Boolean(completedIds[taskId]);

    tasks.push({
      id: taskId,
      sequenceNumber: tasks.length + 1,
      type: 'MIXED_HIGH_YIELD_MCQS',
      subjectId: prioritizedTopics[0]?.subjectId || 'medicine',
      subjectName: 'Mixed FMGE Subjects',
      subjectCode: 'FMGE',
      subjectColor: '#0d9488',
      topicId: 'mixed-hy-pool',
      topicName: `Mixed High-Yield Drills (${topWeakSubjects.join(', ')})`,
      isHighYield: true,
      priorityScore: 85,
      masteryScore: 50,
      durationMinutes: mixedDuration,
      reason: 'Mixed exam simulation across your top priority subject areas.',
      actionLabel: 'Start Mixed MCQs',
      actionDescription: `Mixed 15-question clinical drill across ${topWeakSubjects.join(', ')}.`,
      targetCount: 15,
      isCompleted,
    });

    accumulatedMinutes += mixedDuration;
  }

  const completedTaskCount = tasks.filter((t) => t.isCompleted).length;
  const isCompleted = tasks.length > 0 && completedTaskCount === tasks.length;

  return {
    id: `daily-mission-${todayKey}`,
    dateKey: todayKey,
    timeBudgetMinutes,
    totalAllocatedMinutes: accumulatedMinutes,
    tasks,
    completedTaskCount,
    totalTaskCount: tasks.length,
    isCompleted,
    studyStreakDays: streakDays,
  };
}

/**
 * Marks a daily mission task as completed and updates study logs and completion state.
 */
export function markDailyMissionTaskComplete(
  state: AppState,
  taskId: string,
  performanceResult?: { accuracy?: number; score?: number; errorsResolved?: number; minutesSpent?: number },
  timeBudgetMinutes = 120
): { updatedState: AppState; mission: GeneratedDailyMission } {
  const todayKey = getLocalDateKey();
  const completedIds = { ...(state.completedMissionIds || {}) };
  completedIds[taskId] = true;

  // Find task duration for logging
  const currentMission = generateDailyMission(state, timeBudgetMinutes);
  const matchedTask = currentMission.tasks.find((t) => t.id === taskId);
  const minutesSpent = performanceResult?.minutesSpent || matchedTask?.durationMinutes || 20;

  // Update today's study log
  const existingTodayLog: DailyStudyLog = state.studyLogs?.[todayKey] || {
    date: todayKey,
    studyMinutes: 0,
    questionsSolved: 0,
    completedTaskIds: [],
    mood: 'great',
  };

  const updatedLog: DailyStudyLog = {
    ...existingTodayLog,
    studyMinutes: existingTodayLog.studyMinutes + minutesSpent,
    questionsSolved: existingTodayLog.questionsSolved + (matchedTask?.targetCount || (matchedTask?.type === 'PRACTICE_MCQS' ? 10 : 0)),
    completedTaskIds: Array.from(new Set([...(existingTodayLog.completedTaskIds || []), taskId])),
  };

  const updatedState: AppState = {
    ...state,
    completedMissionIds: completedIds,
    studyLogs: {
      ...(state.studyLogs || {}),
      [todayKey]: updatedLog,
    },
  };

  const updatedMission = generateDailyMission(updatedState, timeBudgetMinutes);

  // If entire mission is now completed, compute summary
  if (updatedMission.isCompleted) {
    updatedMission.summary = getDailyMissionSummary(updatedState, updatedMission);
  }

  return { updatedState, mission: updatedMission };
}

/**
 * Calculates summary metrics for completed daily mission.
 */
export function getDailyMissionSummary(
  state: AppState,
  mission: GeneratedDailyMission
): DailyMissionSummary {
  const todayKey = getLocalDateKey();
  const todayAttempts = (state.mcqAttempts || []).filter((a) =>
    a.timestamp ? a.timestamp.startsWith(todayKey) : false
  );

  const totalQuestions = todayAttempts.length;
  const correctCount = todayAttempts.filter((a) => a.isCorrect).length;
  const averageAccuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 75;

  const todayLog = state.studyLogs?.[todayKey];
  const timeSpentMinutes = todayLog?.studyMinutes || mission.totalAllocatedMinutes;

  const allPriorities = calculateAllTopicsAdaptivePriority(state);
  const weakTopicsRemaining = allPriorities.filter(
    (t) => t.status === 'critical' || t.status === 'high_priority'
  ).length;

  return {
    timeSpentMinutes,
    mcqsSolved: Math.max(totalQuestions, todayLog?.questionsSolved || 0),
    averageAccuracy,
    topicsImproved: mission.tasks.filter((t) => t.isCompleted).length,
    errorsFixed: Math.max(2, Math.round(correctCount * 0.4)),
    weakTopicsRemaining,
  };
}
