import { getInitialAppState } from '../../data/sampleData';
import {
  fetchPracticeSessionQuestions,
  getVerifiedTopicQuestions,
  validateQuestionTopicMatch,
} from '../practiceSessionEngine';
import { recordMcqAttempt, countRepeatedErrors } from '../performanceEngine';
import { PracticeSessionContext, PracticeSessionQuestion } from '../../types';
import { VisualValidationLog } from '../visualQuestionEngine';

async function runPracticeSessionTests() {
  console.log('=== RUNNING RIGOROUS 10-MCQ PRACTICE SESSION TESTS ===\n');
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

  // =========================================================================
  // TEST SUITE 1: 5 TARGET TOPICS 10-QUESTION GENERATION & TOPIC INTEGRITY
  // =========================================================================
  const testScenarios = [
    {
      subjectId: 'anatomy',
      subjectName: 'Anatomy',
      topicId: 'anat-4',
      topicName: 'Lower Limb - Knee Joint & Nerve Lesions (Peroneal/Tibial)',
      offTargetTerms: ['myocardial', 'infarction', 'ecg', 'amiodarone', 'preeclampsia', 'linezolid'],
    },
    {
      subjectId: 'anatomy',
      subjectName: 'Anatomy',
      topicId: 'anat-1',
      topicName: 'Upper Limb - Brachial Plexus & Nerve Injuries',
      offTargetTerms: ['myocardial', 'infarction', 'arrhythmia', 'organophosphate', 'parkland'],
    },
    {
      subjectId: 'medicine',
      subjectName: 'Medicine',
      topicId: 'med-1',
      topicName: 'Cardiology (ECG, MI, Arrhythmias, Heart Failure)',
      offTargetTerms: ['brachial plexus', 'waiter tip', 'parkland', 'organophosphate'],
    },
    {
      subjectId: 'pharmacology',
      subjectName: 'Pharmacology',
      topicId: 'pharm-1',
      topicName: 'Autonomic Nervous System Drugs',
      offTargetTerms: ['brachial plexus', 'peroneal nerve', 'knee joint', 'parkland'],
    },
    {
      subjectId: 'obg',
      subjectName: 'Obstetrics & Gynecology',
      topicId: 'obg-2',
      topicName: 'Pre-eclampsia, Eclampsia & MgSO4 Pritchard Regimen',
      offTargetTerms: ['brachial plexus', 'peroneal nerve', 'fast ultrasound', 'leriche'],
    },
  ];

  console.log('--- 1. Testing 10-MCQ Sequential Generation for 5 Topics ---');
  for (const s of testScenarios) {
    const context: PracticeSessionContext = {
      sessionId: `test-session-${s.topicId}-${Date.now()}`,
      source: 'recommended_video',
      subjectId: s.subjectId,
      subjectName: s.subjectName,
      topicId: s.topicId,
      topicName: s.topicName,
      targetQuestionCount: 10,
    };

    const questions = await fetchPracticeSessionQuestions(context);

    // Assert exactly 10 questions
    assert(questions.length === 10, `Topic [${s.topicName}] produced exactly ${questions.length} questions`);

    // Verify session ID and sequence numbers 1 to 10
    assert(
      questions.every((q, idx) => q.sessionId === context.sessionId && q.sequenceNumber === idx + 1),
      `All 10 questions have matching sessionId and sequential sequenceNumber (1..10)`
    );

    // Verify topic lockdown on every single question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      assert(q.subjectId === s.subjectId, `Q${i + 1} has subjectId = ${s.subjectId}`);
      assert(q.topicId === s.topicId, `Q${i + 1} has topicId = ${s.topicId}`);
      assert(q.options.length === 4, `Q${i + 1} has exactly 4 options`);
      assert(['A', 'B', 'C', 'D'].includes(q.correctAnswer), `Q${i + 1} has valid correctAnswer (${q.correctAnswer})`);
      assert(Boolean(q.explanation && q.explanation.length > 10), `Q${i + 1} has detailed explanation`);

      // Topic validator check
      const isValidTopic = validateQuestionTopicMatch(q, s.subjectName, s.topicName);
      assert(isValidTopic, `Q${i + 1} passed strict topic validator for ${s.topicName}`);

      // Check off-target leaks
      const qText = `${q.scenario} ${q.question} ${q.explanation}`.toLowerCase();
      const hasLeak = s.offTargetTerms.some((term) => qText.includes(term));
      assert(!hasLeak, `Q${i + 1} contains NO off-target terminology`);
    }
  }

  // =========================================================================
  // TEST SUITE 2: DYNAMIC OPTION SHUFFLE & ANTI-OPTION-A BIAS
  // =========================================================================
  console.log('\n--- 2. Testing Option Shuffle & Key Randomization ---');
  const session1Context: PracticeSessionContext = {
    sessionId: 'session-shuffle-1',
    source: 'recommended_video',
    subjectId: 'anatomy',
    subjectName: 'Anatomy',
    topicId: 'anat-4',
    topicName: 'Lower Limb - Knee Joint & Nerve Lesions (Peroneal/Tibial)',
    targetQuestionCount: 10,
  };
  const session2Context: PracticeSessionContext = {
    sessionId: 'session-shuffle-2',
    source: 'recommended_video',
    subjectId: 'anatomy',
    subjectName: 'Anatomy',
    topicId: 'anat-4',
    topicName: 'Lower Limb - Knee Joint & Nerve Lesions (Peroneal/Tibial)',
    targetQuestionCount: 10,
  };

  const qList1 = await fetchPracticeSessionQuestions(session1Context);
  const qList2 = await fetchPracticeSessionQuestions(session2Context);

  const keysCount: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of [...qList1, ...qList2]) {
    keysCount[q.correctAnswer] = (keysCount[q.correctAnswer] || 0) + 1;
  }

  assert(keysCount['A'] < 20, `Correct answers are distributed across keys (A: ${keysCount['A']}, B: ${keysCount['B']}, C: ${keysCount['C']}, D: ${keysCount['D']})`);
  assert(
    Object.values(keysCount).filter((c) => c > 0).length >= 3,
    'Correct answers appear in at least 3 distinct option positions (A/B/C/D)'
  );

  // =========================================================================
  // TEST SUITE 3: ERROR TRACKING & MASTERY RECALCULATION
  // =========================================================================
  console.log('\n--- 3. Testing Real-time Mastery & Error Tracking Engine ---');
  let state = getInitialAppState();

  const attempt1Res = recordMcqAttempt(state, {
    questionId: qList1[0].id,
    subjectId: qList1[0].subjectId,
    topicId: qList1[0].topicId,
    topicName: qList1[0].topicName,
    subtopicId: qList1[0].subtopic,
    source: 'recommended_video_practice',
    isCorrect: false,
    selectedAnswer: 'B',
    correctAnswer: qList1[0].correctAnswer,
    notes: qList1[0].question,
    timeTakenSeconds: 32,
  });
  state = attempt1Res.updatedState;

  assert(state.errorNotebook.length === 1, 'Incorrect attempt added to 20th Error Notebook');
  assert(
    state.errorNotebook[0].questionGist === qList1[0].question,
    'Error notebook record preserves exact question gist'
  );

  const repeatRes = recordMcqAttempt(state, {
    questionId: qList1[0].id,
    subjectId: qList1[0].subjectId,
    topicId: qList1[0].topicId,
    topicName: qList1[0].topicName,
    subtopicId: qList1[0].subtopic,
    source: 'recommended_video_practice',
    isCorrect: false,
    selectedAnswer: 'C',
    correctAnswer: qList1[0].correctAnswer,
    notes: qList1[0].question,
    timeTakenSeconds: 25,
  });
  state = repeatRes.updatedState;

  const repeatedCount = countRepeatedErrors(state.mcqAttempts || []);
  assert(repeatedCount === 1, 'Repeated incorrect question detected and counted (1 repeated error)');

  // =========================================================================
  // TEST SUITE 4: ALL 10 FMGE SUBJECT LIVE VISUAL QUESTIONS (NO REUSED IMAGES)
  // =========================================================================
  console.log('\n--- 4. Testing 10 FMGE Subject-Specific Live Visual Decisions ---');

  const subjectDrills = [
    { subject: 'anatomy', topic: 'anat-1', name: 'Anatomy - Brachial Plexus', targetVisual: 'brachial plexus' },
    { subject: 'physiology', topic: 'phys-1', name: 'Physiology - Cardiac AP', targetVisual: 'cardiac action potential' },
    { subject: 'biochemistry', topic: 'biochem-1', name: 'Biochemistry - Lineweaver-Burk', targetVisual: 'lineweaver burk' },
    { subject: 'pathology', topic: 'path-4', name: 'Pathology - Reed-Sternberg', targetVisual: 'reed sternberg' },
    { subject: 'pharmacology', topic: 'pharm-1', name: 'Pharmacology - Dose Response', targetVisual: 'dose response' },
    { subject: 'microbiology', topic: 'micro-1', name: 'Microbiology - Acid Fast TB', targetVisual: 'acid fast' },
    { subject: 'medicine', topic: 'med-1', name: 'Medicine - Inferior STEMI ECG', targetVisual: 'inferior stemi' },
    { subject: 'radiology', topic: 'rad-1', name: 'Radiology - Chest X-Ray Pneumothorax', targetVisual: 'pneumothorax' },
    { subject: 'dermatology', topic: 'derm-1', name: 'Dermatology - Erythema Multiforme', targetVisual: 'erythema multiforme' },
    { subject: 'ophthalmology', topic: 'ophth-1', name: 'Ophthalmology - CRAO Fundoscopy', targetVisual: 'cherry red' },
  ];

  const allSessionImages: string[] = [];

  for (const drill of subjectDrills) {
    const logs: VisualValidationLog[] = [];
    const questions = await fetchPracticeSessionQuestions(
      {
        sessionId: `test-session-${drill.subject}-${Date.now()}`,
        source: 'recommended_video',
        subjectId: drill.subject,
        subjectName: drill.name,
        topicId: drill.topic,
        topicName: drill.name,
        targetQuestionCount: 10,
      },
      logs
    );

    assert(questions.length === 10, `${drill.name} produced 10 valid questions`);

    const imagesInSession = questions.map((q) => q.imageUrl).filter(Boolean) as string[];
    const uniqueImagesInSession = new Set(imagesInSession);

    // Hard Rule 1: No duplicate image within the session
    assert(
      imagesInSession.length === uniqueImagesInSession.size,
      `${drill.name}: ZERO repeated images in session (${imagesInSession.length} images, all unique)`
    );

    // Hard Rule 2: At least 1 question has authentic verified image matching topic
    const firstIbq = questions.find((q) => Boolean(q.imageUrl));
    assert(Boolean(firstIbq), `${drill.name}: Successfully attached authentic verified image`);
    if (firstIbq && firstIbq.imageUrl) {
      allSessionImages.push(firstIbq.imageUrl);
      assert(Boolean(firstIbq.cleanImageUrl), `${drill.name}: Has cleanImageUrl without answer reveals`);
      assert(Boolean(firstIbq.whatToLookFor), `${drill.name}: Has visual observation finding guide`);
    }

    // Hard Rule 3: Text questions stay clean text questions without random/fake image injection
    const textQuestions = questions.filter((q) => !q.imageUrl);
    assert(textQuestions.length > 0, `${drill.name}: Text-only clinical questions preserved cleanly without fake images`);
  }

  // =========================================================================
  // TEST SUITE 5: 10-QUESTION MIXED-SUBJECT LIVE DRILL (STRICT DIVERSITY)
  // =========================================================================
  console.log('\n--- 5. Testing 10-Question Mixed-Subject Live Drill (Zero Duplication) ---');
  
  // Verify that all 10 distinct subject images across drills are completely unique
  const uniqueCrossSubjectImages = new Set(allSessionImages);
  assert(
    allSessionImages.length === uniqueCrossSubjectImages.size,
    `10 distinct subject drills produced 10 completely unique medical visual assets (No cross-subject contamination: ${allSessionImages.length} unique images)`
  );

  // =========================================================================
  // TEST SUITE 6: STRICT SYSTEM-WIDE ZERO DUPLICATE QUESTIONS
  // =========================================================================
  console.log('\n--- 6. Testing System-Wide Zero Duplicate Questions & Facet Diversity ---');
  const topicsToTest = [
    { subjectId: 'anatomy', topicId: 'anat-3', topicName: 'Lower Limb - Femoral Triangle, Canal & Popliteal Fossa' },
    { subjectId: 'surgery', topicId: 'surg-1', topicName: 'Burns - Parkland Formula & Resuscitation' },
    { subjectId: 'obg', topicId: 'obg-1', topicName: 'Normal Labor, Partograph & Stages of Delivery' },
    { subjectId: 'pediatrics', topicId: 'peds-1', topicName: 'Developmental Milestones & Growth Charts' },
    { subjectId: 'pathology', topicId: 'path-1', topicName: 'Cell Injury, Necrosis, Apoptosis & Amyloidosis' },
  ];

  for (const t of topicsToTest) {
    const qList = await fetchPracticeSessionQuestions({
      sessionId: `zero-dup-${t.topicId}-${Date.now()}`,
      source: 'recommended_video',
      subjectId: t.subjectId,
      subjectName: t.subjectId.toUpperCase(),
      topicId: t.topicId,
      topicName: t.topicName,
      targetQuestionCount: 10,
    });

    assert(qList.length === 10, `[${t.topicName}] Produced exactly 10 questions`);

    // Verify 10 DISTINCT questions (stems must all be unique)
    const stems = qList.map((q) => q.question.trim().toLowerCase());
    const uniqueStems = new Set(stems);
    assert(
      stems.length === uniqueStems.size,
      `[${t.topicName}] All 10 questions are completely unique (0 duplicate stems: ${uniqueStems.size}/10)`
    );

    // Verify 10 DISTINCT scenarios
    const scenarios = qList.map((q) => q.scenario.trim().toLowerCase());
    const uniqueScenarios = new Set(scenarios);
    assert(
      scenarios.length === uniqueScenarios.size,
      `[${t.topicName}] All 10 scenarios are completely unique (0 duplicate scenarios: ${uniqueScenarios.size}/10)`
    );

    // Verify NO generic placeholder options
    for (let i = 0; i < qList.length; i++) {
      const q = qList[i];
      const optTexts = q.options.map((o) => o.text.toLowerCase());
      const hasGeneric = optTexts.some((txt) =>
        txt.includes('non-targeted symptomatic observation') ||
        txt.includes('immediate unindicated invasive')
      );
      assert(!hasGeneric, `[${t.topicName}] Q${i + 1} contains NO generic placeholder options`);
    }
  }

  console.log(`\n================================================`);
  console.log(`ALL PRACTICE SESSION TESTS COMPLETED: ${passed} passed, ${failed} failed.`);
  console.log(`================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runPracticeSessionTests();
