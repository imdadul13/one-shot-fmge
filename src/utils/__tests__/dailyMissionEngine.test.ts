import {
  generateDailyMission,
  markDailyMissionTaskComplete,
  calculateStudyStreak,
  getDailyMissionSummary,
} from '../dailyMissionEngine';
import { recordMcqAttempt } from '../performanceEngine';
import { getInitialAppState } from '../../data/sampleData';
import { AppState } from '../../types';
import { getLocalDateKey } from '../date';

async function runDailyMissionEngineTests() {
  console.log('================================================================');
  console.log('       TEST SUITE: START MY DAY · DAILY MISSION SYSTEM         ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✓ ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      failed++;
    }
  }

  const baseState: AppState = getInitialAppState();
  const todayKey = getLocalDateKey();

  // ===========================================================================
  // TEST 1: 30-MINUTE MISSION DURATION BUDGET
  // ===========================================================================
  console.log('--- TEST 1: 30-Minute Time Budget ---');
  {
    const mission30 = generateDailyMission(baseState, 30);
    assert(mission30.timeBudgetMinutes === 30, 'Mission budget set to 30 min');
    assert(mission30.totalAllocatedMinutes <= 35, `Total allocated time fits budget (actual: ${mission30.totalAllocatedMinutes}m)`);
    assert(mission30.tasks.length >= 1 && mission30.tasks.length <= 3, `Appropriate task count (actual: ${mission30.tasks.length})`);
    for (const t of mission30.tasks) {
      assert(Boolean(t.actionLabel), `Task "${t.topicName}" has actionLabel: "${t.actionLabel}"`);
      assert(Boolean(t.reason), `Task has clear reason: "${t.reason}"`);
    }
  }

  // ===========================================================================
  // TEST 2: 1-HOUR MISSION DURATION BUDGET
  // ===========================================================================
  console.log('\n--- TEST 2: 1-Hour Time Budget ---');
  {
    const mission60 = generateDailyMission(baseState, 60);
    assert(mission60.timeBudgetMinutes === 60, 'Mission budget set to 60 min');
    assert(mission60.totalAllocatedMinutes >= 45 && mission60.totalAllocatedMinutes <= 70, `Total allocated time fits 1h budget (actual: ${mission60.totalAllocatedMinutes}m)`);
    assert(mission60.tasks.length >= 2, `Allocated at least 2 tasks (actual: ${mission60.tasks.length})`);
  }

  // ===========================================================================
  // TEST 3: 2-HOUR MISSION DURATION BUDGET (DEFAULT)
  // ===========================================================================
  console.log('\n--- TEST 3: 2-Hour Time Budget (Default) ---');
  {
    const mission120 = generateDailyMission(baseState, 120);
    assert(mission120.timeBudgetMinutes === 120, 'Mission budget set to 120 min');
    assert(mission120.totalAllocatedMinutes >= 95 && mission120.totalAllocatedMinutes <= 135, `Total allocated time fits 2h budget (actual: ${mission120.totalAllocatedMinutes}m)`);
    assert(mission120.tasks.length >= 3, `Allocated multi-step mission (actual: ${mission120.tasks.length} tasks)`);
  }

  // ===========================================================================
  // TEST 4: 4-HOUR MISSION DURATION BUDGET
  // ===========================================================================
  console.log('\n--- TEST 4: 4-Hour Time Budget ---');
  {
    const mission240 = generateDailyMission(baseState, 240);
    assert(mission240.timeBudgetMinutes === 240, 'Mission budget set to 240 min');
    assert(mission240.totalAllocatedMinutes >= 180 && mission240.totalAllocatedMinutes <= 250, `Total allocated time fits 4h budget (actual: ${mission240.totalAllocatedMinutes}m)`);
    assert(mission240.tasks.length >= 5, `Deep comprehensive study mission (actual: ${mission240.tasks.length} tasks)`);
  }

  // ===========================================================================
  // TEST 5: COLD-START / NO PERFORMANCE DATA USER
  // ===========================================================================
  console.log('\n--- TEST 5: Cold-Start / No Performance Data User ---');
  {
    const cleanState: AppState = { ...baseState, mcqAttempts: [] };
    const mission = generateDailyMission(cleanState, 120);

    assert(mission.tasks.length >= 3, 'Constructs mission using FMGE importance and syllabus coverage');
    const firstTask = mission.tasks[0];
    assert(firstTask.isHighYield === true, 'First task is High-Yield core topic');
    assert(
      firstTask.type === 'MASTER_TOPIC' || firstTask.type === 'PRACTICE_MCQS',
      `Appropriate discovery task assigned (${firstTask.type})`
    );
  }

  // ===========================================================================
  // TEST 6: USER WITH MANY REPEATED ERRORS
  // ===========================================================================
  console.log('\n--- TEST 6: User with Repeated Errors ---');
  {
    let stateWithErrors: AppState = { ...baseState, mcqAttempts: [] };
    // Simulate 3 misses on same question in Pharmacology Autonomic Drugs
    for (let i = 1; i <= 3; i++) {
      stateWithErrors = recordMcqAttempt(stateWithErrors, {
        questionId: 'q-pharm-atropine-1',
        subjectId: 'pharmacology',
        topicId: 'pharm-1',
        source: 'qbank',
        selectedAnswer: 'C',
        correctAnswer: 'A',
        isCorrect: false,
        attemptNumber: i,
      }).updatedState;
    }

    const mission = generateDailyMission(stateWithErrors, 120);
    const errorTask = mission.tasks.find((t) => t.topicId === 'pharm-1');

    assert(Boolean(errorTask), 'Pharmacology Autonomic Drugs included in mission');
    assert(
      errorTask?.type === 'REVIEW_ERROR_VAULT',
      `Task type is REVIEW_ERROR_VAULT (actual: ${errorTask?.type})`
    );
    assert(
      errorTask?.actionLabel.includes('Review') || errorTask?.actionLabel.includes('Error'),
      `Action label targets error remediation ("${errorTask?.actionLabel}")`
    );
  }

  // ===========================================================================
  // TEST 7: USER WITH OVERDUE SPACED REVISIONS
  // ===========================================================================
  console.log('\n--- TEST 7: User with Overdue Spaced Revisions ---');
  {
    const stateWithOverdue: AppState = {
      ...baseState,
      topicsState: {
        'obg-obg-2': {
          notesDone: true,
          r1Done: true,
          r1Date: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(), // R2 overdue by ~10 days
        },
      },
    };

    const mission = generateDailyMission(stateWithOverdue, 120);
    const revisionTask = mission.tasks.find((t) => t.topicId === 'obg-2');

    assert(Boolean(revisionTask), 'Overdue OBG topic included in mission');
    assert(
      revisionTask?.type === 'REVISION' || revisionTask?.type === 'MASTER_TOPIC',
      `Task type triggers revision or master topic (actual: ${revisionTask?.type})`
    );
  }

  // ===========================================================================
  // TEST 8: NO DUPLICATE TOPICS IN ONE MISSION
  // ===========================================================================
  console.log('\n--- TEST 8: Topic Deduplication & Coherence ---');
  {
    const mission = generateDailyMission(baseState, 240);
    const seenTopics = new Set<string>();
    let hasDuplicate = false;

    for (const t of mission.tasks) {
      if (t.type !== 'MIXED_HIGH_YIELD_MCQS') {
        const key = `${t.subjectId}-${t.topicId}`;
        if (seenTopics.has(key)) {
          hasDuplicate = true;
          break;
        }
        seenTopics.add(key);
      }
    }

    assert(!hasDuplicate, 'All mission tasks have distinct, non-duplicate topics');
  }

  // ===========================================================================
  // TEST 9: TASK COMPLETION, LOGGING & SUMMARY SCREEN
  // ===========================================================================
  console.log('\n--- TEST 9: Task Completion & Study Log Update ---');
  {
    let state = baseState;
    const initialMission = generateDailyMission(state, 60);
    const taskToComplete = initialMission.tasks[0];

    const { updatedState, mission: updatedMission } = markDailyMissionTaskComplete(
      state,
      taskToComplete.id,
      { accuracy: 80, minutesSpent: taskToComplete.durationMinutes },
      60
    );

    const completedTask = updatedMission.tasks.find((t) => t.id === taskToComplete.id);
    assert(completedTask?.isCompleted === true, 'Task marked as completed');
    assert(updatedMission.completedTaskCount >= 1, 'Completed task count incremented');

    const todayLog = updatedState.studyLogs?.[todayKey];
    assert(Boolean(todayLog), 'Today study log exists');
    assert(todayLog?.studyMinutes >= taskToComplete.durationMinutes, 'Study minutes recorded in daily log');

    // Complete all remaining tasks
    let finalState = updatedState;
    for (const task of updatedMission.tasks) {
      if (!task.isCompleted) {
        finalState = markDailyMissionTaskComplete(finalState, task.id, undefined, 60).updatedState;
      }
    }

    const finalMission = generateDailyMission(finalState, 60);
    assert(finalMission.isCompleted === true, 'Full mission marked completed when all tasks complete');

    const summary = getDailyMissionSummary(finalState, finalMission);
    assert(summary.timeSpentMinutes > 0, `Daily summary calculated time spent (${summary.timeSpentMinutes}m)`);
    assert(summary.topicsImproved === finalMission.totalTaskCount, `Summary counts ${summary.topicsImproved} topics improved`);
  }

  // ===========================================================================
  // TEST 10: STUDY STREAK CALCULATION
  // ===========================================================================
  console.log('\n--- TEST 10: Study Streak Calculation ---');
  {
    const todayLocalKey = getLocalDateKey();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = getLocalDateKey(yesterday);

    const dayBefore = new Date();
    dayBefore.setDate(dayBefore.getDate() - 2);
    const dayBeforeKey = getLocalDateKey(dayBefore);

    const mockLogs = {
      [dayBeforeKey]: { date: dayBeforeKey, studyMinutes: 60, questionsSolved: 30, completedTaskIds: [], mood: 'great' as const },
      [yesterdayKey]: { date: yesterdayKey, studyMinutes: 90, questionsSolved: 45, completedTaskIds: [], mood: 'great' as const },
      [todayLocalKey]: { date: todayLocalKey, studyMinutes: 45, questionsSolved: 20, completedTaskIds: [], mood: 'great' as const },
    };

    const streak = calculateStudyStreak(mockLogs);
    assert(streak >= 3, `Calculated consecutive study streak correctly (${streak} days)`);
  }

  console.log('\n================================================================');
  console.log(` ALL DAILY MISSION TESTS COMPLETED: ${passed} passed, ${failed} failed.`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runDailyMissionEngineTests();
