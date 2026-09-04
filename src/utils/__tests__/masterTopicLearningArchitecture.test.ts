import { getInitialAppState } from '../../data/sampleData';
import { getNormalizedTopicIntelligence, generateTopicSearchQueries, calculateSemanticRelevanceScore } from '../topicIntelligence';
import { generateFlashcardDeck } from '../flashcardEngine';
import { generateSlideDeck } from '../slideEngine';
import { getVerifiedTopicQuestions, shuffleQuestionOptions, validateComprehensiveMcq } from '../practiceSessionEngine';
import { recordMcqAttempt, calculateTopicPerformanceMetrics, countRepeatedErrors } from '../performanceEngine';
import { identifyCandidateTopics } from '../videoRecommendationEngine';
import { INITIAL_TELEGRAM_MCQS } from '../../data/telegramPresetData';
import { CandidateTopicRecommendation, PracticeOption } from '../../types';

async function runMasterLearningArchitectureTests() {
  console.log('=== RUNNING MASTER TOPIC LEARNING ARCHITECTURE & RANDOMIZATION TESTS ===\n');
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

  const TEST_TOPICS = [
    {
      subjectId: 'anatomy',
      subjectName: 'Anatomy',
      topicId: 'anat-4',
      topicName: 'Lower Limb - Knee Joint & Nerve Lesions (Peroneal/Tibial)',
      expectedConcepts: ['ACL', 'PCL', 'menisci', 'peroneal', 'tibial', 'Lachman', 'popliteal'],
    },
    {
      subjectId: 'anatomy',
      subjectName: 'Anatomy',
      topicId: 'anat-1',
      topicName: 'Upper Limb - Brachial Plexus & Nerve Injuries',
      expectedConcepts: ['brachial plexus', 'Erb', 'Klumpke', 'radial', 'ulnar', 'median'],
    },
    {
      subjectId: 'medicine',
      subjectName: 'Medicine',
      topicId: 'med-1',
      topicName: 'Cardiology (ECG, MI, Arrhythmias, Heart Failure)',
      expectedConcepts: ['arrhythmias', 'ECG', 'STEMI', 'adenosine', 'amiodarone'],
    },
    {
      subjectId: 'medicine',
      subjectName: 'Medicine',
      topicId: 'med-1',
      topicName: 'Acute Coronary Syndrome & STEMI',
      expectedConcepts: ['STEMI', 'infarction', 'coronary', 'troponin'],
    },
    {
      subjectId: 'pharmacology',
      subjectName: 'Pharmacology',
      topicId: 'pharm-1',
      topicName: 'Autonomic Nervous System Drugs',
      expectedConcepts: ['cholinergic', 'adrenergic', 'atropine', 'pralidoxime', 'pilocarpine'],
    },
    {
      subjectId: 'obg',
      subjectName: 'Obstetrics & Gynecology',
      topicId: 'obg-2',
      topicName: 'Pre-eclampsia, Eclampsia & MgSO4 Pritchard Regimen',
      expectedConcepts: ['preeclampsia', 'eclampsia', 'Pritchard', 'MgSO4', 'calcium gluconate'],
    },
  ];

  // =========================================================================
  // TEST SUITE 1: TOPIC INTELLIGENCE & MULTI-QUERY SEARCH GENERATION
  // =========================================================================
  console.log('\n--- 1. Testing Topic Intelligence, Concept Clusters & Multi-Query Generation ---');

  for (const t of TEST_TOPICS) {
    const intel = getNormalizedTopicIntelligence(t.subjectId, t.topicId, t.topicName);
    assert(Boolean(intel.canonicalName), `[${t.topicName}] Has canonical name: ${intel.canonicalName}`);
    assert(intel.conceptClusters.length >= 3, `[${t.topicName}] Has >= 3 concept clusters (${intel.conceptClusters.length})`);
    assert(intel.highYieldKeywords.length >= 3, `[${t.topicName}] Has >= 3 high-yield keywords`);

    const queries = generateTopicSearchQueries(intel);
    assert(queries.length >= 3, `[${t.topicName}] Generated ${queries.length} targeted search queries`);
    assert(!queries.includes(t.topicName), `[${t.topicName}] Does NOT search raw literal string only`);

    // Verify negative filter rejecting off-target cardiology in Anatomy
    if (t.subjectId === 'anatomy') {
      const offTargetCheck = calculateSemanticRelevanceScore('Acute ST-elevation myocardial infarction management', intel);
      assert(!offTargetCheck.isRelevant, `[${t.topicName}] Off-target STEMI/ECG text strictly rejected`);
    }
  }

  // =========================================================================
  // TEST SUITE 2: MCQ OPTION-A BIAS ELIMINATION & DETERMINISTIC SHUFFLING
  // =========================================================================
  console.log('\n--- 2. Testing MCQ Option Shuffling & Answer-Position Randomization ---');

  const letterCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  const totalQuestionsTested = 120;

  for (let i = 0; i < totalQuestionsTested; i++) {
    const rawOptions: Array<{ text: string; isCorrect: boolean }> = [
      { text: 'Target Correct Therapy', isCorrect: true },
      { text: 'Incorrect distractor 1', isCorrect: false },
      { text: 'Incorrect distractor 2', isCorrect: false },
      { text: 'Incorrect distractor 3', isCorrect: false },
    ];

    const result = shuffleQuestionOptions(rawOptions);
    assert(result.shuffledOptions.length === 4, `Question #${i + 1} has exactly 4 options`);
    assert(Boolean(result.correctOptionId), `Question #${i + 1} has stable correctOptionId: ${result.correctOptionId}`);
    assert(['A', 'B', 'C', 'D'].includes(result.correctAnswer), `Question #${i + 1} has valid correct letter: ${result.correctAnswer}`);

    letterCounts[result.correctAnswer] = (letterCounts[result.correctAnswer] || 0) + 1;
  }

  console.log('Answer distribution across 120 randomized questions:', letterCounts);
  assert(letterCounts.A > 0 && letterCounts.B > 0 && letterCounts.C > 0 && letterCounts.D > 0, 'All 4 answer positions (A, B, C, D) are actively represented');
  assert(letterCounts.A < totalQuestionsTested * 0.5, `Option A is NOT over-represented (A count: ${letterCounts.A} / ${totalQuestionsTested})`);

  // Verify 0-mock architecture clean start for presets
  assert(INITIAL_TELEGRAM_MCQS.length === 0, 'INITIAL_TELEGRAM_MCQS starts with 0 presets in clean architecture');

  // =========================================================================
  // TEST SUITE 3: FLASHCARD & SLIDE GENERATION ENGINES
  // =========================================================================
  console.log('\n--- 3. Testing High-Yield Flashcard & Visual Slide Engines ---');

  for (const t of TEST_TOPICS) {
    const flashcards = generateFlashcardDeck(t.subjectId, t.topicId, t.topicName);
    assert(flashcards.cards.length >= 5, `[${t.topicName}] Flashcard deck contains ${flashcards.cards.length} cards`);
    assert(flashcards.cards.every((c) => c.front.length > 10 && c.back.length > 5), `[${t.topicName}] All flashcards have substantial front/back content`);

    const slides = generateSlideDeck(t.subjectId, t.topicId, t.topicName);
    assert(slides.slides.length >= 4, `[${t.topicName}] Slide deck contains ${slides.slides.length} slides`);
    assert(slides.slides.some((s) => s.bullets.length >= 2), `[${t.topicName}] Slides have structured bullet points`);
  }

  // =========================================================================
  // TEST SUITE 4: 10-QUESTION MCQ SESSIONS & 10-POINT VALIDATION
  // =========================================================================
  console.log('\n--- 4. Testing 10-Question MCQ Practice Sessions & Validation ---');

  for (const t of TEST_TOPICS) {
    const questions = getVerifiedTopicQuestions(t.subjectId, t.topicId, t.topicName, 10);
    assert(questions.length === 10, `[${t.topicName}] Produced exactly 10 questions`);

    const sessionLetters = new Set(questions.map((q) => q.correctAnswer));
    assert(sessionLetters.size >= 2, `[${t.topicName}] 10-question session has varied answer positions (contains: ${Array.from(sessionLetters).join(', ')})`);

    for (let idx = 0; idx < questions.length; idx++) {
      const q = questions[idx];
      const val = validateComprehensiveMcq(q, t.subjectName, t.topicName);
      assert(val.isValid, `[${t.topicName}] Q${idx + 1} passed 10-point comprehensive MCQ validator`);
    }
  }

  // =========================================================================
  // TEST SUITE 5: PERFORMANCE ENGINE & REVISION INTEGRATION
  // =========================================================================
  console.log('\n--- 5. Testing Performance Engine & Error Vault Connection ---');
  let state = getInitialAppState();

  const kneeQuestions = getVerifiedTopicQuestions('anatomy', 'anat-4', 'Lower Limb - Knee Joint', 10);
  for (let idx = 0; idx < kneeQuestions.length; idx++) {
    const q = kneeQuestions[idx];
    const isCorrect = idx < 7; // 7 correct, 3 incorrect
    const selectedOpt = isCorrect
      ? q.options.find((o) => o.key === q.correctAnswer)
      : q.options.find((o) => o.key !== q.correctAnswer);

    const res = recordMcqAttempt(state, {
      questionId: q.id,
      subjectId: q.subjectId,
      topicId: q.topicId,
      topicName: q.topicName,
      subtopic: q.subtopic,
      isCorrect,
      selectedAnswer: selectedOpt?.key || 'A',
      correctAnswer: q.correctAnswer,
      timeTakenSeconds: 30,
      source: 'recommended_video_practice',
    });
    state = res.updatedState;
  }

  assert(state.mcqAttempts?.length === 10, '10 MCQ attempts saved in State');
  const metrics = calculateTopicPerformanceMetrics('anatomy', 'anat-4', state.mcqAttempts || []);
  assert(metrics.totalAttempts === 10, 'Metrics calculated 10 total attempts for anat-4');
  assert(metrics.accuracy === 70, `Metrics calculated 70% accuracy (Actual: ${metrics.accuracy}%)`);

  // Repeat an incorrect question to test Error Vault trigger
  const repeatQ = kneeQuestions[8];
  const repeatRes = recordMcqAttempt(state, {
    questionId: repeatQ.id,
    subjectId: repeatQ.subjectId,
    topicId: repeatQ.topicId,
    topicName: repeatQ.topicName,
    isCorrect: false,
    selectedAnswer: 'D',
    correctAnswer: repeatQ.correctAnswer,
    timeTakenSeconds: 25,
    source: 'recommended_video_practice',
  });
  state = repeatRes.updatedState;

  const repeatedErrCount = countRepeatedErrors(state.mcqAttempts || []);
  assert(repeatedErrCount === 1, 'Error Vault detected and counted 1 repeated error');

  console.log(`\n================================================`);
  console.log(`ALL MASTER LEARNING TESTS COMPLETED: ${passed} passed, ${failed} failed.`);
  console.log(`================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runMasterLearningArchitectureTests();
