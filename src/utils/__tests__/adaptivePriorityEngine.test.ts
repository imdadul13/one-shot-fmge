import {
  calculateTopicAdaptivePriority,
  calculateAllTopicsAdaptivePriority,
  getTopPriorityTopics,
  calculateSubjectAdaptivePriorities,
  getNextBestStudyAction,
  calculateTopicDemonstratedMastery,
  getTopicRevisionMatrixStatus,
  getDaysRemainingToExam,
  getRecommendedLearningPathway,
} from '../adaptivePriorityEngine';
import { recordMcqAttempt } from '../performanceEngine';
import { getInitialAppState } from '../../data/sampleData';
import { FMGE_SUBJECTS } from '../../data/fmgeSubjects';
import { AppState, TopicItem } from '../../types';

async function runAdaptivePriorityEngineTests() {
  console.log('================================================================');
  console.log('       TEST SUITE: FMGE ADAPTIVE PRIORITY ENGINE ARCHITECTURE   ');
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
  const medSubject = FMGE_SUBJECTS.find((s) => s.id === 'medicine')!;
  const anatSubject = FMGE_SUBJECTS.find((s) => s.id === 'anatomy')!;
  const dermSubject = FMGE_SUBJECTS.find((s) => s.id === 'dermatology')!;

  const arrhythmiasTopic = medSubject.topics.find((t) => t.id === 'med-1') || medSubject.topics[0];
  const lowYieldDermTopic: TopicItem = {
    id: 'derm-99',
    name: 'Rare Dermatosis Variant',
    isHighYield: false,
    notesDone: false,
    qBankDone: false,
    r1Done: false,
    r2Done: false,
    r3Done: false,
  };

  // ===========================================================================
  // SCENARIO A: HIGH-YIELD TOPIC + UNATTEMPTED (COLD-START)
  // ===========================================================================
  console.log('--- SCENARIO A: High-Yield Topic + Unattempted (Cold-Start) ---');
  {
    const cleanState: AppState = { ...baseState, mcqAttempts: [] };
    const priority = calculateTopicAdaptivePriority(medSubject, arrhythmiasTopic, cleanState, 60);

    assert(priority.status === 'unattempted', 'Topic status is "unattempted"');
    assert(priority.attemptCount === 0, 'Attempt count is 0');
    assert(priority.accuracy === 0, 'Accuracy is 0');
    assert(priority.masteryScore === 0, 'Mastery is 0%');
    assert(priority.dataConfidence === 'preliminary', 'Data confidence is "preliminary"');
    assert(priority.priorityScore >= 40, `Unattempted high-yield topic has substantial priority (actual: ${priority.priorityScore})`);
    assert(
      priority.explanation.includes('unattempted') || priority.explanation.includes('FMGE Weight'),
      `Explanation explains unattempted status ("${priority.explanation}")`
    );
  }

  // ===========================================================================
  // SCENARIO B: HIGH-YIELD TOPIC + 40% RECENT ACCURACY + REPEATED ERRORS
  // ===========================================================================
  console.log('\n--- SCENARIO B: High-Yield Topic + Low Recent Accuracy + Repeated Errors ---');
  {
    let stateWithErrors: AppState = { ...baseState, mcqAttempts: [] };
    // Simulate 5 attempts: 2 correct, 3 incorrect (including 2 misses on same question)
    const q1 = 'q-arrh-1';
    const q2 = 'q-arrh-2';

    // Miss q1 twice (repeated error)
    stateWithErrors = recordMcqAttempt(stateWithErrors, {
      questionId: q1,
      subjectId: 'medicine',
      topicId: 'med-1',
      source: 'qbank',
      selectedAnswer: 'A',
      correctAnswer: 'B',
      isCorrect: false,
      attemptNumber: 1,
    }).updatedState;

    stateWithErrors = recordMcqAttempt(stateWithErrors, {
      questionId: q1,
      subjectId: 'medicine',
      topicId: 'med-1',
      source: 'error_vault',
      selectedAnswer: 'C',
      correctAnswer: 'B',
      isCorrect: false,
      attemptNumber: 2,
    }).updatedState;

    // Miss q2 once
    stateWithErrors = recordMcqAttempt(stateWithErrors, {
      questionId: q2,
      subjectId: 'medicine',
      topicId: 'med-1',
      source: 'qbank',
      selectedAnswer: 'D',
      correctAnswer: 'A',
      isCorrect: false,
      attemptNumber: 1,
    }).updatedState;

    // 2 correct questions
    for (let i = 3; i <= 4; i++) {
      stateWithErrors = recordMcqAttempt(stateWithErrors, {
        questionId: `q-arrh-${i}`,
        subjectId: 'medicine',
        topicId: 'med-1',
        source: 'qbank',
        selectedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        attemptNumber: 1,
      }).updatedState;
    }

    const priority = calculateTopicAdaptivePriority(medSubject, arrhythmiasTopic, stateWithErrors, 30);

    assert(priority.status === 'critical' || priority.priorityScore >= 75, `Status is critical or high priority (actual: ${priority.status}, score: ${priority.priorityScore})`);
    assert(priority.repeatedErrorCount >= 1, `Repeated error detected (actual: ${priority.repeatedErrorCount})`);
    assert(priority.recentAccuracy <= 50, `Recent accuracy is low (actual: ${priority.recentAccuracy}%)`);
    assert(
      priority.recommendedAction.type === 'review_errors' || priority.recommendedAction.type === 'master_topic',
      `Recommended action addresses errors or mastery (${priority.recommendedAction.type})`
    );
    assert(
      priority.recommendedPathway.includes('cases') && priority.recommendedPathway.includes('video'),
      'Recommended pathway provides comprehensive reinforcement for weak topic'
    );
  }

  // ===========================================================================
  // SCENARIO C: LOW-YIELD TOPIC + 95% ACCURACY
  // ===========================================================================
  console.log('\n--- SCENARIO C: Low-Yield Topic + 95% Accuracy ---');
  {
    let stateLowYield: AppState = { ...baseState, mcqAttempts: [] };
    // 10 correct attempts, 0 misses
    for (let i = 1; i <= 10; i++) {
      stateLowYield = recordMcqAttempt(stateLowYield, {
        questionId: `q-derm-${i}`,
        subjectId: 'dermatology',
        topicId: 'derm-99',
        source: 'qbank',
        selectedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        attemptNumber: 1,
      }).updatedState;
    }

    const priority = calculateTopicAdaptivePriority(dermSubject, lowYieldDermTopic, stateLowYield, 60);

    assert(priority.priorityScore <= 35, `Low-yield high-accuracy topic has low priority score (actual: ${priority.priorityScore})`);
    assert(priority.status === 'stable', `Status is stable (actual: ${priority.status})`);
    assert(priority.masteryScore >= 70, `Mastery is high (actual: ${priority.masteryScore}%)`);
  }

  // ===========================================================================
  // SCENARIO D: PREVIOUSLY STRONG TOPIC + RECENT DECLINE
  // ===========================================================================
  console.log('\n--- SCENARIO D: Previously Strong Topic + Recent Decline ---');
  {
    let stateDecline: AppState = { ...baseState, mcqAttempts: [] };
    // 10 past correct attempts (older)
    for (let i = 1; i <= 10; i++) {
      stateDecline = recordMcqAttempt(stateDecline, {
        questionId: `q-anat-old-${i}`,
        subjectId: 'anatomy',
        topicId: 'anat-4',
        source: 'qbank',
        selectedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        attemptNumber: 1,
        timestamp: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      }).updatedState;
    }

    const priorityBefore = calculateTopicAdaptivePriority(anatSubject, anatSubject.topics[3], stateDecline, 45);

    // Now student misses 4 out of last 5 attempts today
    for (let i = 1; i <= 4; i++) {
      stateDecline = recordMcqAttempt(stateDecline, {
        questionId: `q-anat-new-${i}`,
        subjectId: 'anatomy',
        topicId: 'anat-4',
        source: 'recommended_video_practice',
        selectedAnswer: 'C',
        correctAnswer: 'A',
        isCorrect: false,
        attemptNumber: 1,
        timestamp: new Date().toISOString(),
      }).updatedState;
    }

    const priorityAfter = calculateTopicAdaptivePriority(anatSubject, anatSubject.topics[3], stateDecline, 45);

    assert(
      priorityAfter.priorityScore > priorityBefore.priorityScore,
      `Priority increased after recent drop (Before: ${priorityBefore.priorityScore} -> After: ${priorityAfter.priorityScore})`
    );
    assert(priorityAfter.recentAccuracy < priorityAfter.accuracy, `Recent accuracy (${priorityAfter.recentAccuracy}%) dropped below lifetime (${priorityAfter.accuracy}%)`);
    assert(priorityAfter.status === 'needs_attention' || priorityAfter.status === 'high_priority' || priorityAfter.status === 'critical', `Status escalated (actual: ${priorityAfter.status})`);
  }

  // ===========================================================================
  // SCENARIO E: STRONG TOPIC + MASTERY PROTECTION
  // ===========================================================================
  console.log('\n--- SCENARIO E: Strong Topic + Mastery Protection ---');
  {
    let stateMastered: AppState = {
      ...baseState,
      mcqAttempts: [],
      topicsState: {
        'anatomy-anat-1': {
          notesDone: true,
          qBankDone: true,
          r1Done: true,
          r2Done: true,
          r3Done: true,
          r3Date: new Date().toISOString(),
        },
      },
    };

    // 15 correct attempts
    for (let i = 1; i <= 15; i++) {
      stateMastered = recordMcqAttempt(stateMastered, {
        questionId: `q-brachial-${i}`,
        subjectId: 'anatomy',
        topicId: 'anat-1',
        source: 'qbank',
        selectedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        attemptNumber: 1,
      }).updatedState;
    }

    const priority = calculateTopicAdaptivePriority(anatSubject, anatSubject.topics[0], stateMastered, 60);

    assert(priority.masteryScore >= 85, `Mastery is very high (actual: ${priority.masteryScore}%)`);
    assert(priority.scoreBreakdown.masteryProtectionDeduction > 0, `Mastery protection deduction active (actual: -${priority.scoreBreakdown.masteryProtectionDeduction} pts)`);
    assert(priority.status === 'stable', `Status is stable (actual: ${priority.status})`);
  }

  // ===========================================================================
  // SCENARIO F: REVISION OVERDUE
  // ===========================================================================
  console.log('\n--- SCENARIO F: Revision Overdue Increases Priority ---');
  {
    const stateNotDue: AppState = {
      ...baseState,
      topicsState: {
        'medicine-med-1': {
          notesDone: true,
          r1Done: true,
          r1Date: new Date().toISOString(), // R1 completed today, R2 not due yet
        },
      },
    };

    const stateOverdue: AppState = {
      ...baseState,
      topicsState: {
        'medicine-med-1': {
          notesDone: true,
          r1Done: true,
          r1Date: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(), // R1 done 25 days ago, R2 overdue!
        },
      },
    };

    const priorityNotDue = calculateTopicAdaptivePriority(medSubject, arrhythmiasTopic, stateNotDue, 60);
    const priorityOverdue = calculateTopicAdaptivePriority(medSubject, arrhythmiasTopic, stateOverdue, 60);

    assert(
      priorityOverdue.priorityScore > priorityNotDue.priorityScore,
      `Priority higher when revision overdue (${priorityNotDue.priorityScore} -> ${priorityOverdue.priorityScore})`
    );
    assert(priorityOverdue.revisionDue === true, 'Revision due is true');
    assert(priorityOverdue.revisionOverdueDays >= 10, `Overdue days calculated (${priorityOverdue.revisionOverdueDays} days)`);
  }

  // ===========================================================================
  // SCENARIO G: LIMITED DATA CONFIDENCE (1-2 ATTEMPTS)
  // ===========================================================================
  console.log('\n--- SCENARIO G: Limited Data Confidence (1-2 Attempts) ---');
  {
    let stateSmallData: AppState = { ...baseState, mcqAttempts: [] };
    stateSmallData = recordMcqAttempt(stateSmallData, {
      questionId: 'q-single-1',
      subjectId: 'medicine',
      topicId: 'med-1',
      source: 'qbank',
      selectedAnswer: 'A',
      correctAnswer: 'A',
      isCorrect: true,
      attemptNumber: 1,
    }).updatedState;

    const priority = calculateTopicAdaptivePriority(medSubject, arrhythmiasTopic, stateSmallData, 60);

    assert(priority.dataConfidence === 'preliminary', `Data confidence is preliminary for 1 attempt (actual: ${priority.dataConfidence})`);
    assert(priority.attemptCount === 1, 'Attempt count is 1');
  }

  // ===========================================================================
  // SCENARIO H: CROSS-TOPIC ISOLATION TEST
  // ===========================================================================
  console.log('\n--- SCENARIO H: Cross-Topic Data Isolation ---');
  {
    let stateA: AppState = { ...baseState, mcqAttempts: [] };
    const priorityPharmaBefore = calculateTopicAdaptivePriority(
      FMGE_SUBJECTS.find((s) => s.id === 'pharmacology')!,
      FMGE_SUBJECTS.find((s) => s.id === 'pharmacology')!.topics[0],
      stateA,
      60
    );

    // Record 10 attempts ONLY in Anatomy
    for (let i = 1; i <= 10; i++) {
      stateA = recordMcqAttempt(stateA, {
        questionId: `q-anat-${i}`,
        subjectId: 'anatomy',
        topicId: 'anat-4',
        source: 'qbank',
        selectedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        attemptNumber: 1,
      }).updatedState;
    }

    const priorityPharmaAfter = calculateTopicAdaptivePriority(
      FMGE_SUBJECTS.find((s) => s.id === 'pharmacology')!,
      FMGE_SUBJECTS.find((s) => s.id === 'pharmacology')!.topics[0],
      stateA,
      60
    );

    assert(
      priorityPharmaBefore.priorityScore === priorityPharmaAfter.priorityScore,
      'Modifying Anatomy attempts does NOT change Pharmacology priority'
    );
    assert(
      priorityPharmaBefore.accuracy === priorityPharmaAfter.accuracy,
      'Modifying Anatomy attempts does NOT change Pharmacology accuracy'
    );
  }

  // ===========================================================================
  // TOP 5 PRIORITIES & NEXT BEST STUDY ACTION INTEGRATION
  // ===========================================================================
  console.log('\n--- TOP 5 PRIORITIES & NEXT BEST STUDY ACTION ---');
  {
    const allPriorities = calculateAllTopicsAdaptivePriority(baseState);
    assert(allPriorities.length >= 150, `Evaluated all topics (total: ${allPriorities.length})`);

    const top5 = getTopPriorityTopics(baseState, 5);
    assert(top5.length === 5, 'Returned exactly top 5 priority topics');
    assert(top5[0].priorityScore >= top5[1].priorityScore, 'Top 5 topics are sorted in descending order of priority');

    for (let i = 0; i < top5.length; i++) {
      const item = top5[i];
      assert(Boolean(item.explanation), `Top #${i + 1} (${item.subjectName} -> ${item.topicName}) has explanation: "${item.explanation}"`);
      assert(Boolean(item.recommendedAction), `Top #${i + 1} has actionable recommendedAction`);
    }

    const nextAction = getNextBestStudyAction(baseState);
    assert(Boolean(nextAction.actionLabel), `Next best study action produced: "${nextAction.actionLabel}"`);
    assert(Boolean(nextAction.reason), `Next best action reason provided: "${nextAction.reason}"`);
    assert(nextAction.allocatedMinutes > 0, `Allocated minutes is positive (${nextAction.allocatedMinutes}m)`);

    const subjectPriorities = calculateSubjectAdaptivePriorities(baseState);
    assert(subjectPriorities.length === 19, `Calculated priorities for all 19 FMGE subjects (total: ${subjectPriorities.length})`);
    assert(subjectPriorities[0].priorityScore >= subjectPriorities[1].priorityScore, 'Subject priorities are sorted descending');
  }

  console.log('\n================================================================');
  console.log(` ALL TESTS COMPLETED: ${passed} passed, ${failed} failed.`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAdaptivePriorityEngineTests();
