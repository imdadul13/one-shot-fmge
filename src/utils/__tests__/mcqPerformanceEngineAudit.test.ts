import { getVerifiedTopicQuestions, validateComprehensiveMcq } from '../practiceSessionEngine';
import {
  recordMcqAttempt,
  calculateTopicPerformanceMetrics,
  calculateSubjectPerformanceMetrics,
  calculateOverallPerformance,
  countRepeatedErrors,
  calculateRecentAccuracy,
  determineMasteryStatus,
} from '../performanceEngine';
import { getInitialAppState } from '../../data/sampleData';
import { AppState, McqAttempt, PracticeSessionQuestion } from '../../types';

async function runMcqPerformanceEngineAudit() {
  console.log('================================================================');
  console.log('        AUDIT: MCQ ATTEMPT & PERFORMANCE ENGINE ARCHITECTURE    ');
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

  // ===========================================================================
  // 1. SAMPLE AND ANALYZE AT LEAST 100+ MCQS FOR ANSWER POSITION DISTRIBUTION
  // ===========================================================================
  console.log('--- 1. AUDITING 100+ MCQS FOR ANSWER POSITION DISTRIBUTION ---');

  const testTopicList = [
    { subjectId: 'anatomy', topicId: 'anat-4', topicName: 'Lower Limb - Knee Joint & Nerve Lesions (Peroneal/Tibial)' },
    { subjectId: 'anatomy', topicId: 'anat-1', topicName: 'Upper Limb - Brachial Plexus & Nerve Injuries' },
    { subjectId: 'anatomy', topicId: 'anat-5', topicName: 'Thorax - Mediastinum, Heart & Coronary Circulation' },
    { subjectId: 'medicine', topicId: 'med-1', topicName: 'Cardiology (ECG, MI, Arrhythmias, Heart Failure)' },
    { subjectId: 'medicine', topicId: 'med-1', topicName: 'Acute Coronary Syndrome & STEMI' },
    { subjectId: 'pharmacology', topicId: 'pharm-1', topicName: 'Autonomic Nervous System Drugs' },
    { subjectId: 'pathology', topicId: 'path-4', topicName: 'Neoplasia - Hallmarks, Oncogenes & Tumor Markers' },
    { subjectId: 'obg', topicId: 'obg-2', topicName: 'Pre-eclampsia, Eclampsia & MgSO4 Pritchard Regimen' },
    { subjectId: 'surgery', topicId: 'surg-1', topicName: 'Acute Abdomen & Appendicitis' },
    { subjectId: 'pediatrics', topicId: 'peds-1', topicName: 'Neonatal Resuscitation & APGAR Scoring' },
    { subjectId: 'microbiology', topicId: 'micro-1', topicName: 'Gram Positive Cocci & Staphylococcal Toxins' },
    { subjectId: 'biochemistry', topicId: 'biochem-1', topicName: 'Inborn Errors of Metabolism' },
  ];

  const allSampledQuestions: PracticeSessionQuestion[] = [];
  const distribution: Record<'A' | 'B' | 'C' | 'D', number> = { A: 0, B: 0, C: 0, D: 0 };

  for (const topic of testTopicList) {
    // Generate questions across multiple distinct session iterations to simulate real user practice
    for (let sessionIter = 0; sessionIter < 2; sessionIter++) {
      const qBatch = getVerifiedTopicQuestions(topic.subjectId, topic.topicId, topic.topicName, 10);
      for (const q of qBatch) {
        allSampledQuestions.push(q);
        const ans = q.correctAnswer as 'A' | 'B' | 'C' | 'D';
        if (distribution[ans] !== undefined) {
          distribution[ans]++;
        }
      }
    }
  }

  const totalQuestions = allSampledQuestions.length;
  const pctA = Math.round((distribution.A / totalQuestions) * 100);
  const pctB = Math.round((distribution.B / totalQuestions) * 100);
  const pctC = Math.round((distribution.C / totalQuestions) * 100);
  const pctD = Math.round((distribution.D / totalQuestions) * 100);

  console.log(`\nSampled Total MCQs: ${totalQuestions}`);
  console.log(`Answer Position Distribution:`);
  console.log(`  A: ${pctA}% (${distribution.A}/${totalQuestions})`);
  console.log(`  B: ${pctB}% (${distribution.B}/${totalQuestions})`);
  console.log(`  C: ${pctC}% (${distribution.C}/${totalQuestions})`);
  console.log(`  D: ${pctD}% (${distribution.D}/${totalQuestions})\n`);

  assert(totalQuestions >= 100, `Audited >= 100 MCQs (total: ${totalQuestions})`);
  assert(pctA < 45, `Option A is not dominant (A: ${pctA}% < 45%)`);
  assert(pctB >= 10, `Option B is adequately represented (B: ${pctB}% >= 10%)`);
  assert(pctC >= 10, `Option C is adequately represented (C: ${pctC}% >= 10%)`);
  assert(pctD >= 10, `Option D is adequately represented (D: ${pctD}% >= 10%)`);
  assert(
    distribution.A > 0 && distribution.B > 0 && distribution.C > 0 && distribution.D > 0,
    `All 4 options (A, B, C, D) are represented across sessions`
  );

  // ===========================================================================
  // 2. AUDIT 5 SPECIFIC TOPICS (METADATA, CONTENT MATCH, EXPLANATIONS, TRAPS)
  // ===========================================================================
  console.log('\n--- 2. AUDITING 5 SPECIFIC TARGET TOPICS ---');

  const TARGET_5_TOPICS = [
    {
      subjectId: 'anatomy',
      subjectName: 'Anatomy',
      topicId: 'anat-4',
      topicName: 'Lower Limb - Knee Joint & Nerve Lesions (Peroneal/Tibial)',
      expectedKeywords: ['knee', 'peroneal', 'tibial', 'acl', 'pcl', 'meniscus', 'lachman', 'popliteal', 'ligament', 'lower limb', 'nerve', 'joint'],
    },
    {
      subjectId: 'anatomy',
      subjectName: 'Anatomy',
      topicId: 'anat-1',
      topicName: 'Upper Limb - Brachial Plexus & Nerve Injuries',
      expectedKeywords: ['brachial', 'plexus', 'erb', 'klumpke', 'radial', 'ulnar', 'median', 'wrist drop', 'thoracic', 'scapula', 'nerve', 'upper limb'],
    },
    {
      subjectId: 'medicine',
      subjectName: 'Medicine',
      topicId: 'med-1',
      topicName: 'Cardiology (ECG, MI, Arrhythmias, Heart Failure)',
      expectedKeywords: ['arrhythmia', 'ecg', 'stemi', 'adenosine', 'amiodarone', 'avnrt', 'fibrillation', 'heart block', 'wpw', 'cardiology', 'cardiac', 'block', 'heart', 'failure'],
    },
    {
      subjectId: 'medicine',
      subjectName: 'Medicine',
      topicId: 'med-1',
      topicName: 'Acute Coronary Syndrome & STEMI',
      expectedKeywords: ['stemi', 'infarction', 'coronary', 'troponin', 'nitroglycerin', 'right ventricular', 'cardiac', 'cardiology', 'ecg', 'ischemia', 'heart block', 'wpw', 'arrhythmia', 'syndrome', 'heart'],
    },
    {
      subjectId: 'pharmacology',
      subjectName: 'Pharmacology',
      topicId: 'pharm-1',
      topicName: 'Autonomic Nervous System Drugs',
      expectedKeywords: ['cholinergic', 'atropine', 'pralidoxime', 'adrenergic', 'organophosphate', 'glucagon', 'propranolol', 'agonist', 'antagonist', 'autonomic', 'pharmacology'],
    },
  ];

  for (const target of TARGET_5_TOPICS) {
    console.log(`\nAuditing topic: [${target.subjectName} -> ${target.topicName}]`);

    const questions = getVerifiedTopicQuestions(target.subjectId, target.topicId, target.topicName, 10);
    assert(questions.length === 10, `[${target.topicName}] Produced exactly 10 questions`);

    const targetAnswers = questions.map((q) => q.correctAnswer);
    const uniqueAnswers = new Set(targetAnswers);
    assert(uniqueAnswers.size >= 2, `[${target.topicName}] Answer positions vary (${Array.from(uniqueAnswers).join(', ')})`);

    for (let idx = 0; idx < questions.length; idx++) {
      const q = questions[idx];

      // Metadata check
      assert(q.subjectId === target.subjectId, `[${target.topicName}] Q#${idx + 1} has correct subjectId (${q.subjectId})`);
      assert(q.topicId === target.topicId, `[${target.topicName}] Q#${idx + 1} has correct topicId (${q.topicId})`);
      assert(Boolean(q.correctOptionId), `[${target.topicName}] Q#${idx + 1} has stable correctOptionId (${q.correctOptionId})`);

      // Content match check
      const combinedText = (q.scenario + ' ' + q.question + ' ' + q.explanation + ' ' + (q.highYieldPearl || '')).toLowerCase();
      const hasKeyword = target.expectedKeywords.some((kw) => combinedText.includes(kw.toLowerCase()));
      assert(hasKeyword, `[${target.topicName}] Q#${idx + 1} content accurately matches topic concepts`);

      // Correct option integrity
      const matchedOpt = q.options.find((o) => o.key === q.correctAnswer);
      assert(Boolean(matchedOpt), `[${target.topicName}] Q#${idx + 1} correctAnswer (${q.correctAnswer}) exists in options`);
      assert(
        matchedOpt?.optionId === q.correctOptionId || Boolean(matchedOpt?.isCorrect),
        `[${target.topicName}] Q#${idx + 1} option key matches correctOptionId`
      );

      // Explanation match check
      assert(q.explanation.length > 25, `[${target.topicName}] Q#${idx + 1} has comprehensive clinical explanation`);

      // 10-point MCQ quality validation
      const validation = validateComprehensiveMcq(q, target.subjectName, target.topicName);
      assert(validation.isValid, `[${target.topicName}] Q#${idx + 1} passed 10-point MCQ quality validator`);
    }
  }

  // ===========================================================================
  // 3. AUDIT MCQ ATTEMPT RECORDING & ALL 13 METADATA FIELDS
  // ===========================================================================
  console.log('\n--- 3. AUDITING MCQ ATTEMPT RECORDING & METADATA COMPLETENESS ---');

  let state: AppState = getInitialAppState();
  state = {
    ...state,
    mcqAttempts: [],
  };

  const sampleSessionId = `session-audit-${Date.now()}`;
  const sampleTopic = TARGET_5_TOPICS[0];
  const sampleQ = getVerifiedTopicQuestions(sampleTopic.subjectId, sampleTopic.topicId, sampleTopic.topicName, 1)[0];
  const selectedOpt = sampleQ.options.find((o) => o.key === sampleQ.correctAnswer)!;

  const sampleAttemptInput = {
    questionId: sampleQ.id,
    subjectId: sampleTopic.subjectId,
    topicId: sampleTopic.topicId,
    topicName: sampleTopic.topicName,
    subtopicId: sampleQ.subtopic || 'knee-joint-anatomy',
    subtopic: sampleQ.subtopic || 'Knee Joint Anatomy',
    source: 'recommended_video_practice' as const,
    selectedAnswer: sampleQ.correctAnswer,
    selectedOptionId: selectedOpt.optionId,
    correctAnswer: sampleQ.correctAnswer,
    correctOptionId: sampleQ.correctOptionId,
    isCorrect: true,
    timeTakenSeconds: 38,
    confidence: 'high' as const,
    attemptNumber: 1,
    timestamp: new Date().toISOString(),
    sessionId: sampleSessionId,
    practiceSessionId: sampleSessionId,
  };

  const { updatedState, attempt: recordedAttempt } = recordMcqAttempt(state, sampleAttemptInput);

  // Field by field verification
  assert(Boolean(recordedAttempt.id), 'Attempt has unique ID');
  assert(recordedAttempt.questionId === sampleQ.id, `Attempt questionId recorded (${recordedAttempt.questionId})`);
  assert(recordedAttempt.subjectId === sampleTopic.subjectId, `Attempt subjectId recorded (${recordedAttempt.subjectId})`);
  assert(recordedAttempt.topicId === sampleTopic.topicId, `Attempt topicId recorded (${recordedAttempt.topicId})`);
  assert(Boolean(recordedAttempt.subtopicId), `Attempt subtopicId recorded (${recordedAttempt.subtopicId})`);
  assert(recordedAttempt.source === 'recommended_video_practice', `Attempt source recorded (${recordedAttempt.source})`);
  assert(recordedAttempt.selectedOptionId === selectedOpt.optionId, `Attempt selectedOptionId recorded (${recordedAttempt.selectedOptionId})`);
  assert(recordedAttempt.correctOptionId === sampleQ.correctOptionId, `Attempt correctOptionId recorded (${recordedAttempt.correctOptionId})`);
  assert(recordedAttempt.isCorrect === true, 'Attempt correctness recorded (true)');
  assert(recordedAttempt.timeTakenSeconds === 38, `Attempt timeTakenSeconds recorded (${recordedAttempt.timeTakenSeconds}s)`);
  assert(recordedAttempt.confidence === 'high', `Attempt confidence recorded (${recordedAttempt.confidence})`);
  assert(recordedAttempt.attemptNumber === 1, `Attempt attemptNumber recorded (${recordedAttempt.attemptNumber})`);
  assert(Boolean(recordedAttempt.timestamp), `Attempt timestamp recorded (${recordedAttempt.timestamp})`);
  assert(recordedAttempt.sessionId === sampleSessionId, `Attempt sessionId recorded (${recordedAttempt.sessionId})`);
  assert(recordedAttempt.practiceSessionId === sampleSessionId, `Attempt practiceSessionId recorded (${recordedAttempt.practiceSessionId})`);

  assert(updatedState.mcqAttempts.length === 1, 'Updated state contains recorded attempt');

  // ===========================================================================
  // 4. AUDIT MULTI-ATTEMPT SIMULATION & PERFORMANCE METRIC CALCULATION
  // ===========================================================================
  console.log('\n--- 4. AUDITING PERFORMANCE METRICS CALCULATION FROM STORED ATTEMPTS ---');

  // Simulate 10 attempts on Knee Joint: 8 correct, 2 incorrect on same question (repeated error)
  let simState: AppState = { ...state, mcqAttempts: [] };
  const kneeQs = getVerifiedTopicQuestions('anatomy', 'anat-4', 'Lower Limb - Knee Joint', 10);

  // 1st attempt: 8 correct, 2 incorrect
  for (let i = 0; i < 8; i++) {
    const q = kneeQs[i];
    const { updatedState: nextState } = recordMcqAttempt(simState, {
      questionId: q.id,
      subjectId: 'anatomy',
      topicId: 'anat-4',
      topicName: 'Lower Limb - Knee Joint',
      subtopicId: q.subtopic,
      source: 'recommended_video_practice',
      selectedAnswer: q.correctAnswer,
      selectedOptionId: q.correctOptionId,
      correctAnswer: q.correctAnswer,
      correctOptionId: q.correctOptionId,
      isCorrect: true,
      timeTakenSeconds: 30,
      attemptNumber: 1,
      sessionId: 'session-sim-1',
    });
    simState = nextState;
  }

  // 2 failed attempts for question #9 (repeated error)
  const failedQ = kneeQs[8];
  const { updatedState: sFail1 } = recordMcqAttempt(simState, {
    questionId: failedQ.id,
    subjectId: 'anatomy',
    topicId: 'anat-4',
    topicName: 'Lower Limb - Knee Joint',
    subtopicId: failedQ.subtopic,
    source: 'recommended_video_practice',
    selectedAnswer: 'Z',
    correctAnswer: failedQ.correctAnswer,
    correctOptionId: failedQ.correctOptionId,
    isCorrect: false,
    timeTakenSeconds: 50,
    attemptNumber: 1,
    sessionId: 'session-sim-1',
  });
  simState = sFail1;

  const { updatedState: sFail2 } = recordMcqAttempt(simState, {
    questionId: failedQ.id,
    subjectId: 'anatomy',
    topicId: 'anat-4',
    topicName: 'Lower Limb - Knee Joint',
    subtopicId: failedQ.subtopic,
    source: 'error_vault',
    selectedAnswer: 'Y',
    correctAnswer: failedQ.correctAnswer,
    correctOptionId: failedQ.correctOptionId,
    isCorrect: false,
    timeTakenSeconds: 40,
    attemptNumber: 2,
    sessionId: 'session-sim-2',
  });
  simState = sFail2;

  // 10th attempt: Q#10 correct
  const q10 = kneeQs[9];
  const { updatedState: s10 } = recordMcqAttempt(simState, {
    questionId: q10.id,
    subjectId: 'anatomy',
    topicId: 'anat-4',
    topicName: 'Lower Limb - Knee Joint',
    subtopicId: q10.subtopic,
    source: 'recommended_video_practice',
    selectedAnswer: q10.correctAnswer,
    correctAnswer: q10.correctAnswer,
    correctOptionId: q10.correctOptionId,
    isCorrect: true,
    timeTakenSeconds: 25,
    attemptNumber: 1,
    sessionId: 'session-sim-1',
  });
  simState = s10;

  // Calculate Metrics
  const topicMetrics = calculateTopicPerformanceMetrics('anatomy', 'anat-4', simState.mcqAttempts);
  const subjectMetrics = calculateSubjectPerformanceMetrics('anatomy', simState);
  const overallMetrics = calculateOverallPerformance(simState);

  console.log(`\nCalculated Topic Metrics for Anatomy -> anat-4:`);
  console.log(`  Total Attempts: ${topicMetrics.totalAttempts}`);
  console.log(`  Correct: ${topicMetrics.correctAnswers}, Incorrect: ${topicMetrics.incorrectAnswers}`);
  console.log(`  Accuracy: ${topicMetrics.accuracy}%`);
  console.log(`  Recent Accuracy (last 5): ${topicMetrics.recentAccuracy}%`);
  console.log(`  Average Time: ${topicMetrics.avgResponseTimeSeconds}s`);
  console.log(`  Repeated Errors: ${topicMetrics.repeatedErrorsCount}`);
  console.log(`  Last Attempted Date: ${topicMetrics.lastAttemptedDate}`);
  console.log(`  Mastery Status: ${topicMetrics.masteryStatus}`);

  // Metric verification
  assert(topicMetrics.totalAttempts === 11, `Topic total attempts is 11 (actual: ${topicMetrics.totalAttempts})`);
  assert(topicMetrics.correctAnswers === 9, `Topic correct answers is 9 (actual: ${topicMetrics.correctAnswers})`);
  assert(topicMetrics.incorrectAnswers === 2, `Topic incorrect answers is 2 (actual: ${topicMetrics.incorrectAnswers})`);
  assert(topicMetrics.accuracy === 82, `Topic accuracy is 82% (actual: ${topicMetrics.accuracy}%)`);
  assert(topicMetrics.repeatedErrorsCount === 1, `Topic repeated errors detected accurately (count: 1)`);
  assert(topicMetrics.masteryStatus === 'proficient', `Topic mastery status is proficient (actual: ${topicMetrics.masteryStatus})`);
  assert(determineMasteryStatus(10, 85, 2) === 'struggling', 'Repeated errors (>=2) shifts status to struggling');
  assert(determineMasteryStatus(10, 45, 0) === 'struggling', 'Low accuracy (<50%) shifts status to struggling');
  assert(determineMasteryStatus(10, 60, 0) === 'developing', 'Moderate accuracy (50-69%) shifts status to developing');
  assert(determineMasteryStatus(10, 90, 0) === 'mastered', 'High accuracy (>=85% with >=5 attempts) shifts status to mastered');
  assert(determineMasteryStatus(0, 0, 0) === 'unattempted', 'Zero attempts is unattempted');

  // Subject metric verification
  assert(subjectMetrics.totalAttempts === 11, `Subject total attempts is 11 (actual: ${subjectMetrics.totalAttempts})`);
  assert(subjectMetrics.accuracy === 82, `Subject accuracy is 82% (actual: ${subjectMetrics.accuracy}%)`);
  assert(subjectMetrics.sourceBreakdown.recommended_video_practice.attempts === 10, 'Source breakdown tracks video practice attempts');
  assert(subjectMetrics.sourceBreakdown.error_vault.attempts === 1, 'Source breakdown tracks error vault attempts');

  // Overall metric verification
  assert(overallMetrics.totalAttempts === 11, `Overall total attempts is 11 (actual: ${overallMetrics.totalAttempts})`);
  assert(overallMetrics.overallAccuracy === 82, `Overall accuracy is 82% (actual: ${overallMetrics.overallAccuracy}%)`);

  console.log('\n================================================================');
  console.log(` AUDIT COMPLETE: ${passed} assertions passed, ${failed} failed.`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runMcqPerformanceEngineAudit();
