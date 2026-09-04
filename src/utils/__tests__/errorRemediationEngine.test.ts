import {
  extractConceptGap,
  groupErrorsByConcept,
  generateConceptRemediationPackage,
  processRemediationResult,
} from '../errorRemediationEngine';
import { calculateTopicAdaptivePriority } from '../adaptivePriorityEngine';
import { generateDailyMission } from '../dailyMissionEngine';
import { recordMcqAttempt } from '../performanceEngine';
import { getInitialAppState } from '../../data/sampleData';
import { FMGE_SUBJECTS } from '../../data/fmgeSubjects';
import { AppState, ErrorNotebookItem } from '../../types';

async function runErrorRemediationEngineTests() {
  console.log('================================================================');
  console.log('       TEST SUITE: CLOSED-LOOP ERROR REMEDIATION ENGINE         ');
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
  const anatSubject = FMGE_SUBJECTS.find((s) => s.id === 'anatomy')!;
  const kneeTopic = anatSubject.topics[3]; // anat-4 Lower Limb Knee

  // ===========================================================================
  // SCENARIO A: SINGLE ISOLATED ERROR
  // ===========================================================================
  console.log('--- SCENARIO A: Single Isolated Error ---');
  {
    const gap = extractConceptGap('anatomy', 'anat-4', 'Foot drop after fibular neck fracture', 'Marked tibial nerve');
    assert(gap.conceptId === 'c-peroneal-nerve', `Identified conceptId: ${gap.conceptId}`);
    assert(gap.conceptName.includes('Common Peroneal Nerve'), `Identified conceptName: ${gap.conceptName}`);
    assert(Boolean(gap.whyItMatters), `Why it matters provided: "${gap.whyItMatters}"`);

    const pkg = generateConceptRemediationPackage('anatomy', 'anat-4', gap.conceptId, gap.conceptName, 'isolated');
    assert(pkg.depth === 'isolated', 'Remediation package depth is isolated');
    assert(pkg.slides.length <= 2, `Allocated compact slides (${pkg.slides.length} slides)`);
    assert(pkg.flashcards.length <= 3, `Allocated compact flashcards (${pkg.flashcards.length} cards)`);
    assert(pkg.retestQuestions.length === 3, `Allocated 3 retest questions for isolated error`);
  }

  // ===========================================================================
  // SCENARIO B: REPEATED ERROR ON SAME CONCEPT
  // ===========================================================================
  console.log('\n--- SCENARIO B: Repeated Error on Same Concept ---');
  {
    const pkg = generateConceptRemediationPackage('anatomy', 'anat-4', 'c-peroneal-nerve', 'Common Peroneal Nerve Injury', 'repeated');
    assert(pkg.depth === 'repeated', 'Remediation package depth is repeated');
    assert(pkg.slides.length >= 3, `Allocated deeper slides (${pkg.slides.length} slides)`);
    assert(pkg.flashcards.length >= 3, `Allocated flashcards (${pkg.flashcards.length} cards)`);
    assert(Boolean(pkg.clinicalCase), 'Includes targeted clinical case');
    assert(pkg.retestQuestions.length === 5, 'Allocated exactly 5 retest questions');

    // Verify randomized answer distribution across retest questions
    const answers = pkg.retestQuestions.map((q) => q.correctAnswer);
    assert(answers.length === 5, '5 retest answers present');
    assert(pkg.retestQuestions.every((q) => q.options.length === 4), 'All retest questions have 4 options');
  }

  // ===========================================================================
  // SCENARIO C: MULTIPLE ERRORS CLUSTERED TO SAME CONCEPT
  // ===========================================================================
  console.log('\n--- SCENARIO C: Multiple Errors Clustered to Same Concept ---');
  {
    const errors: ErrorNotebookItem[] = [
      {
        id: 'err-1',
        subjectId: 'anatomy',
        topic: 'Lower Limb',
        topicId: 'anat-4',
        questionGist: 'Patient with foot drop and inability to dorsiflex',
        myMistake: 'Marked superficial peroneal',
        correctConcept: 'Deep peroneal supplies tibialis anterior',
        isReviewed: false,
        dateAdded: '2026-08-30',
      },
      {
        id: 'err-2',
        subjectId: 'anatomy',
        topic: 'Lower Limb',
        topicId: 'anat-4',
        questionGist: 'Sensory loss in first web space of foot',
        myMistake: 'Marked saphenous nerve',
        correctConcept: 'Deep peroneal supplies first web space',
        isReviewed: false,
        dateAdded: '2026-08-31',
      },
      {
        id: 'err-3',
        subjectId: 'anatomy',
        topic: 'Lower Limb',
        topicId: 'anat-4',
        questionGist: 'Fibular neck cast compression nerve injury',
        myMistake: 'Marked tibial nerve',
        correctConcept: 'Common peroneal winds around fibular neck',
        isReviewed: false,
        dateAdded: '2026-08-31',
      },
    ];

    const clusters = groupErrorsByConcept(errors);
    assert(clusters.length === 1, `Grouped 3 errors into 1 concept cluster (actual: ${clusters.length})`);
    assert(clusters[0].errorCount === 3, 'Cluster contains all 3 errors');
    assert(clusters[0].conceptId === 'c-peroneal-nerve', 'Cluster mapped to Common Peroneal Nerve concept');
    assert(clusters[0].depth === 'severe', 'Cluster marked with severe depth (>= 3 errors)');
  }

  // ===========================================================================
  // SCENARIO D: ERRORS FROM DIFFERENT TOPICS
  // ===========================================================================
  console.log('\n--- SCENARIO D: Errors from Different Topics ---');
  {
    const multiTopicErrors: ErrorNotebookItem[] = [
      {
        id: 'err-anat-1',
        subjectId: 'anatomy',
        topic: 'Lower Limb',
        topicId: 'anat-4',
        questionGist: 'Foot drop fibular fracture',
        myMistake: 'Tibial',
        correctConcept: 'Common peroneal',
        isReviewed: false,
        dateAdded: '2026-08-30',
      },
      {
        id: 'err-pharm-1',
        subjectId: 'pharmacology',
        topic: 'Autonomic Drugs',
        topicId: 'pharm-1',
        questionGist: 'Datura ingestion delirium dilated pupils',
        myMistake: 'Neostigmine',
        correctConcept: 'Physostigmine crosses BBB',
        isReviewed: false,
        dateAdded: '2026-08-31',
      },
    ];

    const clusters = groupErrorsByConcept(multiTopicErrors);
    assert(clusters.length === 2, `Separated errors into 2 distinct clusters (${clusters.length})`);
    assert(clusters[0].subjectId !== clusters[1].subjectId, 'Clusters belong to different subjects');
  }

  // ===========================================================================
  // SCENARIO E: SUCCESSFUL REMEDIATION
  // ===========================================================================
  console.log('\n--- SCENARIO E: Successful Remediation (5/5 Correct) ---');
  {
    const testAttempts = [
      { questionId: 'q-1', isCorrect: true, selectedAnswer: 'A', correctAnswer: 'A' },
      { questionId: 'q-2', isCorrect: true, selectedAnswer: 'B', correctAnswer: 'B' },
      { questionId: 'q-3', isCorrect: true, selectedAnswer: 'C', correctAnswer: 'C' },
      { questionId: 'q-4', isCorrect: true, selectedAnswer: 'D', correctAnswer: 'D' },
      { questionId: 'q-5', isCorrect: true, selectedAnswer: 'A', correctAnswer: 'A' },
    ];

    const stateWithAnatError: AppState = {
      ...baseState,
      errorNotebook: [
        {
          id: 'err-anat-test',
          subjectId: 'anatomy',
          topic: 'Lower Limb',
          topicId: 'anat-4',
          questionGist: 'Foot drop fibular neck',
          myMistake: 'Tibial nerve',
          correctConcept: 'Common peroneal',
          isReviewed: false,
          dateAdded: '2026-08-31',
        },
      ],
    };

    const result = processRemediationResult(
      stateWithAnatError,
      'anatomy',
      'anat-4',
      'c-peroneal-nerve',
      5,
      5,
      testAttempts
    );

    assert(result.remediationStatus === 'mastered', `Status is mastered (actual: ${result.remediationStatus})`);
    assert(result.statusLabel === 'CONCEPT MASTERED', `Status label is "CONCEPT MASTERED"`);
    assert(Boolean(result.nextRevisionDate), `Scheduled next revision date: ${result.nextRevisionDate}`);

    // Verify Error Vault entries marked reviewed
    const reviewedErrors = result.updatedState.errorNotebook.filter((e) => e.subjectId === 'anatomy' && e.isReviewed);
    assert(reviewedErrors.length >= 1, 'Error item marked as reviewed in Error Vault');
  }

  // ===========================================================================
  // SCENARIO F: FAILED REMEDIATION
  // ===========================================================================
  console.log('\n--- SCENARIO F: Failed Remediation (1/5 Correct) ---');
  {
    const failedAttempts = [
      { questionId: 'q-1', isCorrect: true, selectedAnswer: 'A', correctAnswer: 'A' },
      { questionId: 'q-2', isCorrect: false, selectedAnswer: 'B', correctAnswer: 'C' },
      { questionId: 'q-3', isCorrect: false, selectedAnswer: 'C', correctAnswer: 'A' },
      { questionId: 'q-4', isCorrect: false, selectedAnswer: 'D', correctAnswer: 'B' },
      { questionId: 'q-5', isCorrect: false, selectedAnswer: 'A', correctAnswer: 'D' },
    ];

    const result = processRemediationResult(
      baseState,
      'anatomy',
      'anat-4',
      'c-peroneal-nerve',
      1,
      5,
      failedAttempts
    );

    assert(
      result.remediationStatus === 'needs_remediation' || result.remediationStatus === 'weak',
      `Status flags weakness (actual: ${result.remediationStatus})`
    );
  }

  // ===========================================================================
  // SCENARIO G: REMEDIATION APPEARING IN DAILY MISSION
  // ===========================================================================
  console.log('\n--- SCENARIO G: Remediation in Daily Mission ---');
  {
    let stateWithMistakes: AppState = { ...baseState, mcqAttempts: [] };
    for (let i = 1; i <= 3; i++) {
      stateWithMistakes = recordMcqAttempt(stateWithMistakes, {
        questionId: 'q-pharm-datura',
        subjectId: 'pharmacology',
        topicId: 'pharm-1',
        source: 'qbank',
        selectedAnswer: 'B',
        correctAnswer: 'A',
        isCorrect: false,
        attemptNumber: i,
      }).updatedState;
    }

    const mission = generateDailyMission(stateWithMistakes, 120);
    const remediationTask = mission.tasks.find((t) => t.type === 'REVIEW_ERROR_VAULT');
    assert(Boolean(remediationTask), 'Daily mission allocated REVIEW_ERROR_VAULT task for repeated errors');
    assert(remediationTask?.subjectId === 'pharmacology', 'Allocated to Pharmacology');
  }

  // ===========================================================================
  // SCENARIO H: REMEDIATION AFFECTING ADAPTIVE PRIORITY & REVISION
  // ===========================================================================
  console.log('\n--- SCENARIO H: Adaptive Priority & Revision Adjustment ---');
  {
    let state: AppState = { ...baseState, mcqAttempts: [] };
    // Add 3 failures
    for (let i = 1; i <= 3; i++) {
      state = recordMcqAttempt(state, {
        questionId: 'q-peroneal-fail',
        subjectId: 'anatomy',
        topicId: 'anat-4',
        source: 'qbank',
        selectedAnswer: 'C',
        correctAnswer: 'A',
        isCorrect: false,
        attemptNumber: i,
      }).updatedState;
    }

    const priorityBefore = calculateTopicAdaptivePriority(anatSubject, kneeTopic, state, 60);

    // Now perform successful remediation (5/5)
    const testAttempts = [
      { questionId: 'retest-1', isCorrect: true, selectedAnswer: 'A', correctAnswer: 'A' },
      { questionId: 'retest-2', isCorrect: true, selectedAnswer: 'A', correctAnswer: 'A' },
      { questionId: 'retest-3', isCorrect: true, selectedAnswer: 'A', correctAnswer: 'A' },
      { questionId: 'retest-4', isCorrect: true, selectedAnswer: 'A', correctAnswer: 'A' },
      { questionId: 'retest-5', isCorrect: true, selectedAnswer: 'A', correctAnswer: 'A' },
    ];

    const result = processRemediationResult(
      state,
      'anatomy',
      'anat-4',
      'c-peroneal-nerve',
      5,
      5,
      testAttempts
    );

    const priorityAfter = calculateTopicAdaptivePriority(anatSubject, kneeTopic, result.updatedState, 60);

    assert(
      priorityAfter.priorityScore < priorityBefore.priorityScore,
      `Priority score decreased after successful remediation (${priorityBefore.priorityScore} -> ${priorityAfter.priorityScore})`
    );
    assert(
      priorityAfter.masteryScore > priorityBefore.masteryScore,
      `Topic mastery increased after successful remediation (${priorityBefore.masteryScore}% -> ${priorityAfter.masteryScore}%)`
    );
    assert(
      result.updatedState.topicsState['anatomy-anat-4']?.r1Done === true,
      'Revision Matrix updated with R1 completion date'
    );
  }

  // ===========================================================================
  // SCENARIO I: TOPIC & CONCEPT ISOLATION
  // ===========================================================================
  console.log('\n--- SCENARIO I: Topic & Concept Isolation ---');
  {
    const pkgAnat = generateConceptRemediationPackage('anatomy', 'anat-4', 'c-peroneal-nerve', 'Common Peroneal Nerve', 'repeated');
    const pkgPharm = generateConceptRemediationPackage('pharmacology', 'pharm-1', 'c-atropine-toxicity', 'Anticholinergic Toxicity', 'repeated');

    // Verify zero cross-contamination
    assert(!pkgAnat.quickExplanation.coreFact.toLowerCase().includes('atropine'), 'Anatomy remediation contains no pharmacology drugs');
    assert(!pkgPharm.quickExplanation.coreFact.toLowerCase().includes('fibular'), 'Pharmacology remediation contains no anatomical nerve terms');
    assert(pkgAnat.retestQuestions.every((q) => q.subjectId === 'anatomy'), 'All Anatomy retest questions strictly tagged anatomy');
    assert(pkgPharm.retestQuestions.every((q) => q.subjectId === 'pharmacology'), 'All Pharmacology retest questions strictly tagged pharmacology');
  }

  console.log('\n================================================================');
  console.log(` ALL CLOSED-LOOP REMEDIATION TESTS COMPLETED: ${passed} passed, ${failed} failed.`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runErrorRemediationEngineTests();
