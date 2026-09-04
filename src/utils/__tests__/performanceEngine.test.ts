import { getInitialAppState } from '../../data/sampleData';
import {
  recordMcqAttempt,
  calculateTopicPerformanceMetrics,
  calculateSubjectPerformanceMetrics,
  calculateOverallPerformance,
  determineMasteryStatus,
  countRepeatedErrors,
  calculateRecentAccuracy,
  hydrateAttemptsFromExistingState,
} from '../performanceEngine';
import { McqAttempt } from '../../types';

function runEngineTests() {
  console.log('=== RUNNING MCQ ATTEMPT & PERFORMANCE ENGINE TESTS ===');
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

  // TEST 1: Initial state and recordMcqAttempt
  let state = getInitialAppState();
  assert(Array.isArray(state.mcqAttempts) && state.mcqAttempts.length === 0, 'Initial state has empty mcqAttempts array');

  // Record 1st attempt (correct)
  const res1 = recordMcqAttempt(state, {
    questionId: 'q-101',
    subjectId: 'psm',
    topicId: 'psm-1',
    topicName: 'Epidemiological Study Designs',
    isCorrect: true,
    selectedAnswer: 'A',
    correctAnswer: 'A',
    timeTakenSeconds: 40,
    difficulty: 'high-yield',
    source: 'qbank',
  });
  state = res1.updatedState;

  assert(state.mcqAttempts?.length === 1, '1 attempt recorded in state');
  assert(res1.attempt.attemptNumber === 1, 'First attempt has attemptNumber 1');
  assert(state.topicsState['psm-psm-1']?.qBankSolvedCount === 1, 'Topic qBankSolvedCount updated to 1');
  assert(state.topicsState['psm-psm-1']?.qBankAccuracy === 100, 'Topic qBankAccuracy updated to 100%');

  // Record 2nd attempt (same question, wrong this time)
  const res2 = recordMcqAttempt(state, {
    questionId: 'q-101',
    subjectId: 'psm',
    topicId: 'psm-1',
    isCorrect: false,
    selectedAnswer: 'C',
    correctAnswer: 'A',
    timeTakenSeconds: 50,
    source: 'qbank',
  });
  state = res2.updatedState;

  assert(state.mcqAttempts?.length === 2, '2 attempts recorded in state');
  assert(res2.attempt.attemptNumber === 2, 'Second attempt on same question has attemptNumber 2');
  assert(state.topicsState['psm-psm-1']?.qBankAccuracy === 50, 'Topic qBankAccuracy updated to 50% (1/2)');

  // Record 3rd attempt (different question, wrong)
  const res3 = recordMcqAttempt(state, {
    questionId: 'q-102',
    subjectId: 'psm',
    topicId: 'psm-1',
    isCorrect: false,
    selectedAnswer: 'B',
    correctAnswer: 'D',
    timeTakenSeconds: 60,
    source: 'telegram',
  });
  state = res3.updatedState;

  // Record 4th attempt (q-102 again, wrong again -> repeated error)
  const res4 = recordMcqAttempt(state, {
    questionId: 'q-102',
    subjectId: 'psm',
    topicId: 'psm-1',
    isCorrect: false,
    selectedAnswer: 'C',
    correctAnswer: 'D',
    timeTakenSeconds: 30,
    source: 'ai_coach',
  });
  state = res4.updatedState;

  // TEST 2: Topic Performance Metrics Calculation
  const psm1Metrics = calculateTopicPerformanceMetrics('psm', 'psm-1', state.mcqAttempts || []);
  assert(psm1Metrics.totalAttempts === 4, 'psm-1 has 4 total attempts');
  assert(psm1Metrics.correctAnswers === 1, 'psm-1 has 1 correct answer');
  assert(psm1Metrics.incorrectAnswers === 3, 'psm-1 has 3 incorrect answers');
  assert(psm1Metrics.accuracy === 25, 'psm-1 accuracy is 25% (1/4)');
  assert(psm1Metrics.avgResponseTimeSeconds === 45, 'psm-1 avg response time is 45s ((40+50+60+30)/4)');
  assert(psm1Metrics.repeatedErrorsCount === 1, 'psm-1 has 1 repeated error question (q-102 failed twice)');
  assert(psm1Metrics.masteryStatus === 'struggling', 'psm-1 mastery status is "struggling" due to <50% accuracy');
  assert(psm1Metrics.attemptsBySource.qbank === 2, 'psm-1 has 2 QBank attempts');
  assert(psm1Metrics.attemptsBySource.telegram === 1, 'psm-1 has 1 Telegram attempt');
  assert(psm1Metrics.attemptsBySource.ai_coach === 1, 'psm-1 has 1 AI Coach attempt');

  // TEST 3: Mastery Status Transitions
  assert(determineMasteryStatus(0, 0, 0) === 'unattempted', '0 attempts => unattempted');
  assert(determineMasteryStatus(4, 45, 0) === 'struggling', '<50% accuracy => struggling');
  assert(determineMasteryStatus(4, 80, 2) === 'struggling', '>=2 repeated errors => struggling');
  assert(determineMasteryStatus(5, 65, 0) === 'developing', '65% accuracy => developing');
  assert(determineMasteryStatus(3, 80, 0) === 'proficient', '80% accuracy with 3 attempts => proficient');
  assert(determineMasteryStatus(6, 90, 0) === 'mastered', '90% accuracy with 6 attempts => mastered');

  // TEST 4: Subject Performance Metrics Calculation
  const psmSubjectMetrics = calculateSubjectPerformanceMetrics('psm', state);
  assert(psmSubjectMetrics.subjectId === 'psm', 'Subject ID is psm');
  assert(psmSubjectMetrics.totalAttempts === 4, 'PSM total attempts is 4');
  assert(psmSubjectMetrics.correctAnswers === 1, 'PSM correct answers is 1');
  assert(psmSubjectMetrics.accuracy === 25, 'PSM accuracy is 25%');
  assert(psmSubjectMetrics.topicsStrugglingCount >= 1, 'PSM has at least 1 struggling topic');
  assert(psmSubjectMetrics.sourceBreakdown.qbank.attempts === 2, 'PSM QBank source breakdown attempts is 2');
  assert(psmSubjectMetrics.sourceBreakdown.telegram.attempts === 1, 'PSM Telegram source breakdown attempts is 1');
  assert(psmSubjectMetrics.sourceBreakdown.ai_coach.attempts === 1, 'PSM AI Coach source breakdown attempts is 1');

  // TEST 5: Overall Performance Summary Calculation
  const overallSummary = calculateOverallPerformance(state);
  assert(overallSummary.totalAttempts === 4, 'Overall summary total attempts is 4');
  assert(overallSummary.totalCorrect === 1, 'Overall summary total correct is 1');
  assert(overallSummary.totalIncorrect === 3, 'Overall summary total incorrect is 3');
  assert(overallSummary.overallAccuracy === 25, 'Overall accuracy is 25%');
  assert(Object.keys(overallSummary.subjectMetrics).length === 19, 'Overall summary contains all 19 medical subjects');
  assert(overallSummary.recentAttempts.length === 4, 'Recent attempts list contains 4 attempts');

  // TEST 6: Hydrate legacy state
  const legacyState = getInitialAppState();
  legacyState.telegramQuestions = [
    {
      id: 'tg-1',
      sourceChannel: '@fmge_daily',
      subjectId: 'medicine',
      topic: 'Cardiology',
      question: 'ECG in Hyperkalemia?',
      options: [{ key: 'A', text: 'Tall T waves' }],
      correctKey: 'A',
      explanation: 'Tall peaked T waves are earliest finding.',
      tags: ['ecg', 'electrolyte'],
      datePulled: '2026-08-30T10:00:00.000Z',
      userStatus: 'correct',
      userSelectedOption: 'A',
    },
  ];
  legacyState.errorNotebook = [
    {
      id: 'err-1',
      subjectId: 'surgery',
      topic: 'Burns',
      questionGist: 'Parkland formula calculation',
      myMistake: 'Forgot to divide by 2 for first 8 hours',
      correctConcept: '4ml x kg x % TBSA; half in 8h',
      isReviewed: true,
      dateAdded: '2026-08-29',
    },
  ];

  const hydrated = hydrateAttemptsFromExistingState(legacyState);
  assert(
    (hydrated.mcqAttempts?.length || 0) === 3,
    'Hydration created 3 attempts (1 Telegram + 1 Error wrong + 1 Error review correct)'
  );

  console.log(`\nTEST SUMMARY: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runEngineTests();
