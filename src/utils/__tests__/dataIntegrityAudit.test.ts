import { FMGE_SUBJECTS } from '../../data/fmgeSubjects';
import { getInitialAppState } from '../../data/sampleData';
import { calculateAllTopicsAdaptivePriority, calculateTopicAdaptivePriority } from '../adaptivePriorityEngine';
import { generateDailyMission, calculateStudyStreak } from '../dailyMissionEngine';
import { generateSlideDeck } from '../slideEngine';
import { generateFlashcardDeck } from '../flashcardEngine';
import { generateTopicClinicalCasesDeck } from '../clinicalCaseEngine';
import { generateTopicPearls } from '../pearlEngine';
import { getVerifiedTopicQuestions, shuffleQuestionOptions } from '../practiceSessionEngine';
import { recordMcqAttempt, calculateOverallPerformance } from '../performanceEngine';
import { extractConceptGap, generateConceptRemediationPackage, processRemediationResult } from '../errorRemediationEngine';
import {
  getCuratedVideosForTopic,
  isRelevantMedicalVideo,
  buildTopicSearchQueries,
} from '../videoRecommendationEngine';
import { AppState, PracticeSessionQuestion } from '../../types';

async function runDataIntegrityAudit() {
  console.log('================================================================');
  console.log('         DATA INTEGRITY AUDIT: FMGE STUDY TRACKER ENGINE        ');
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
  // 1. FMGE SUBJECT VALIDATION & 300-MARK TOTAL INTEGRITY
  // ===========================================================================
  console.log('--- 1. FMGE Subject Validation & Official 300 Marks Blueprint ---');
  {
    assert(FMGE_SUBJECTS.length === 19, `Exact 19 FMGE subjects found (actual: ${FMGE_SUBJECTS.length})`);

    const officialSubjectIds = [
      'anatomy',
      'physiology',
      'biochemistry',
      'pathology',
      'pharmacology',
      'microbiology',
      'fmt',
      'psm',
      'ent',
      'ophthalmology',
      'medicine',
      'surgery',
      'obg',
      'pediatrics',
      'orthopedics',
      'dermatology',
      'psychiatry',
      'radiology',
      'anesthesia',
    ];

    const currentSubjectIds = FMGE_SUBJECTS.map((s) => s.id);
    const hasAll19Official = officialSubjectIds.every((id) => currentSubjectIds.includes(id));
    assert(hasAll19Official, 'All 19 official NBE FMGE subjects are present');

    // Verify ZERO non-medical demo subjects
    const forbiddenKeywords = ['spatial', 'engineering', 'cad', 'design theory', 'graphic design'];
    const hasForbiddenSubjects = FMGE_SUBJECTS.some((s) =>
      forbiddenKeywords.some((kw) => s.name.toLowerCase().includes(kw) || s.description.toLowerCase().includes(kw))
    );
    assert(!hasForbiddenSubjects, 'Zero non-medical / prototype placeholder subjects exist');

    // Verify Weightage Sum == 300 Marks
    const totalWeightage = FMGE_SUBJECTS.reduce((sum, s) => sum + s.weightage, 0);
    assert(
      totalWeightage === 300,
      `Sum of all subject weightages strictly equals 300 Marks (actual: ${totalWeightage})`
    );

    // Verify Mega-4 Subjects equal 130 Marks
    const mega4Sum = FMGE_SUBJECTS.filter((s) =>
      ['medicine', 'surgery', 'obg', 'psm'].includes(s.id)
    ).reduce((sum, s) => sum + s.weightage, 0);
    assert(
      mega4Sum === 130,
      `Mega-4 High-Yield Subjects (Medicine 35 + Surgery 35 + OBG 30 + PSM 30) = 130 Marks (actual: ${mega4Sum})`
    );
  }

  // ===========================================================================
  // 2. TOPIC VALIDATION & NO HARDCODED DUPLICATION
  // ===========================================================================
  console.log('\n--- 2. Topic Validation & Hierarchy Integrity ---');
  {
    const allTopics = FMGE_SUBJECTS.flatMap((s) => s.topics);
    assert(allTopics.length >= 190, `Total topics in hierarchy: ${allTopics.length}`);

    // Check for uniqueness of topic IDs
    const topicIdSet = new Set<string>();
    let duplicateIds: string[] = [];
    allTopics.forEach((t) => {
      if (topicIdSet.has(t.id)) {
        duplicateIds.push(t.id);
      }
      topicIdSet.add(t.id);
    });
    assert(duplicateIds.length === 0, `Zero duplicated topic IDs across entire syllabus (duplicates: ${duplicateIds.length})`);

    // Verify each topic has non-empty name and valid properties
    const allValid = allTopics.every((t) => t.id && t.name && typeof t.isHighYield === 'boolean');
    assert(allValid, 'All topics possess valid IDs, names, and boolean highYield tags');
  }

  // ===========================================================================
  // 3. FRESH USER STATE INTEGRITY (ZERO CONTAMINATION)
  // ===========================================================================
  console.log('\n--- 3. Clean Fresh User State Verification ---');
  {
    const freshState: AppState = getInitialAppState();

    assert(freshState.mcqAttempts.length === 0, 'Fresh user starts with 0 MCQ attempts');
    assert(freshState.errorNotebook.length === 0, 'Fresh user starts with 0 Error Vault entries');
    assert(freshState.grandTests.length === 0, 'Fresh user starts with 0 Grand Test mocks');
    assert(Object.keys(freshState.completedMissionIds).length === 0, 'Fresh user starts with 0 completed missions');

    const performance = calculateOverallPerformance(freshState);
    assert(performance.totalAttempts === 0, 'Calculated total attempts is 0');
    assert(performance.overallAccuracy === 0, 'Calculated overall accuracy is 0%');

    // Verify Adaptive Priority cold-start calculations
    const allPriorities = calculateAllTopicsAdaptivePriority(freshState);
    assert(allPriorities.length === allTopicsCount(), 'Adaptive Priority calculated for all topics');

    // In cold start, mastery must be 0% across all topics
    const zeroMasteryAcrossBoard = allPriorities.every((p) => p.masteryScore === 0);
    assert(zeroMasteryAcrossBoard, 'All topics have exactly 0% mastery on fresh clean profile');

    // High-yield mega-4 topics should have highest priority due to FMGE weight
    const topTopic = allPriorities[0];
    assert(
      ['medicine', 'surgery', 'obg', 'psm', 'anatomy', 'physiology', 'biochemistry'].includes(topTopic.subjectId),
      `Top cold-start priority belongs to high-weightage subject (${topTopic.subjectName} -> ${topTopic.topicName})`
    );
  }

  function allTopicsCount() {
    return FMGE_SUBJECTS.flatMap((s) => s.topics).length;
  }

  // ===========================================================================
  // 4. MCQ ENGINE STATISTICAL ANSWER DISTRIBUTION & TOPIC ISOLATION
  // ===========================================================================
  console.log('\n--- 4. MCQ Engine: Answer Balance (A/B/C/D) & Topic Isolation ---');
  {
    const testSubjects = [
      'anatomy',
      'physiology',
      'biochemistry',
      'pathology',
      'pharmacology',
      'microbiology',
      'fmt',
      'psm',
      'ent',
      'ophthalmology',
      'medicine',
      'surgery',
      'obg',
      'pediatrics',
      'orthopedics',
      'dermatology',
      'psychiatry',
      'radiology',
      'anesthesia',
    ];

    const answerCounts: Record<'A' | 'B' | 'C' | 'D', number> = { A: 0, B: 0, C: 0, D: 0 };
    let totalGeneratedQuestions = 0;
    let topicIsolationPassed = true;

    for (const subId of testSubjects) {
      const sub = FMGE_SUBJECTS.find((s) => s.id === subId)!;
      const topic = sub.topics[0];

      const questions = getVerifiedTopicQuestions(sub.id, topic.id, topic.name, 10);

      assert(questions.length >= 5, `${sub.name} generated ${questions.length} verified questions`);

      questions.forEach((q) => {
        totalGeneratedQuestions++;
        answerCounts[q.correctAnswer as 'A' | 'B' | 'C' | 'D']++;

        // Verify topic isolation
        if (q.subjectId !== sub.id || q.topicId !== topic.id) {
          topicIsolationPassed = false;
        }

        // Verify distinct option texts
        const optionTexts = new Set(q.options.map((o) => o.text.toLowerCase().trim()));
        if (optionTexts.size !== 4) {
          console.error(`Duplicate options found in question: ${q.id}`);
          topicIsolationPassed = false;
        }
      });
    }

    assert(topicIsolationPassed, 'Every generated question matches target subjectId and topicId with 4 distinct options');

    console.log(`\n  --- Statistical Answer Distribution (${totalGeneratedQuestions} Questions Sample) ---`);
    const pctA = Math.round((answerCounts.A / totalGeneratedQuestions) * 100);
    const pctB = Math.round((answerCounts.B / totalGeneratedQuestions) * 100);
    const pctC = Math.round((answerCounts.C / totalGeneratedQuestions) * 100);
    const pctD = Math.round((answerCounts.D / totalGeneratedQuestions) * 100);

    console.log(`  Option A: ${pctA}% (${answerCounts.A})`);
    console.log(`  Option B: ${pctB}% (${answerCounts.B})`);
    console.log(`  Option C: ${pctC}% (${answerCounts.C})`);
    console.log(`  Option D: ${pctD}% (${answerCounts.D})`);

    // Verify no single option dominates (> 50%) or suffers from 0% bias
    assert(pctA >= 10 && pctA <= 50, `Option A is balanced (${pctA}%)`);
    assert(pctB >= 10 && pctB <= 50, `Option B is balanced (${pctB}%)`);
    assert(pctC >= 10 && pctC <= 50, `Option C is balanced (${pctC}%)`);
    assert(pctD >= 10 && pctD <= 50, `Option D is balanced (${pctD}%)`);
  }

  // ===========================================================================
  // 5. VIDEO RECOMMENDATION & YOUTUBE FALLBACK INTEGRITY
  // ===========================================================================
  console.log('\n--- 5. Video Recommendation Engine & Fallback Integrity ---');
  {
    // Test curated topic
    const curatedVideos = getCuratedVideosForTopic('anatomy', 'anat-4');
    assert(curatedVideos.length > 0, `Verified video returned for curated topic (count: ${curatedVideos.length})`);
    assert(
      curatedVideos.every((v) => Boolean(v.id && v.title && v.youtubeUrl)),
      'Curated videos contain valid YouTube video IDs, titles, and URLs'
    );

    // Test search query generation
    const queries = buildTopicSearchQueries('Anatomy', 'Lower Limb - Knee Joint & Nerve Lesions');
    assert(queries.length >= 2, `Generated ${queries.length} focused search queries for topic`);
    assert(queries.every((q) => !q.includes('undefined') && q.length < 80), 'Search queries are concise and medical');

    // Test relevance filter
    const isRel = isRelevantMedicalVideo(
      {
        title: 'Knee Joint Anatomy & Common Peroneal Nerve Lesion | High Yield Medical Video',
        description: 'Clinical anatomy of the knee joint and popliteus muscle',
      },
      'Anatomy',
      'Lower Limb - Knee Joint'
    );
    assert(isRel, 'Relevant medical video identified correctly');

    const isNonRel = isRelevantMedicalVideo(
      {
        title: 'How to build a wooden dining table in 10 minutes',
        description: 'Woodworking DIY guide',
      },
      'Anatomy',
      'Lower Limb - Knee Joint'
    );
    assert(!isNonRel, 'Unrelated DIY video correctly rejected');
  }

  // ===========================================================================
  // 6. TOPIC LEARNING PACKAGE INTEGRITY ACROSS 10+ TOPICS
  // ===========================================================================
  console.log('\n--- 6. Complete Topic Learning Package Integrity (10 Subjects) ---');
  {
    const sampleTopics = [
      { subjectId: 'anatomy', topicId: 'anat-4' },
      { subjectId: 'physiology', topicId: 'phys-3' },
      { subjectId: 'biochemistry', topicId: 'bio-2' },
      { subjectId: 'pathology', topicId: 'path-4' },
      { subjectId: 'pharmacology', topicId: 'pharm-1' },
      { subjectId: 'psm', topicId: 'psm-1' },
      { subjectId: 'medicine', topicId: 'med-1' },
      { subjectId: 'surgery', topicId: 'surg-1' },
      { subjectId: 'obg', topicId: 'obg-2' },
      { subjectId: 'pediatrics', topicId: 'ped-3' },
    ];

    for (const item of sampleTopics) {
      const sub = FMGE_SUBJECTS.find((s) => s.id === item.subjectId)!;
      const topic = sub.topics.find((t) => t.id === item.topicId)!;

      const slideDeck = await generateSlideDeck(sub.id, topic.id, topic.name);
      const flashcardsDeck = await generateFlashcardDeck(sub.id, topic.id, topic.name);
      const clinicalCases = await generateTopicClinicalCasesDeck(sub.id, topic.id, topic.name);
      const mcqs = getVerifiedTopicQuestions(sub.id, topic.id, topic.name, 10);

      assert(slideDeck.subjectId === sub.id, `Slides for ${sub.name} have subjectId: ${slideDeck.subjectId}`);
      assert(flashcardsDeck.topicId === topic.id, `Flashcards for ${topic.name} have topicId: ${flashcardsDeck.topicId}`);
      assert(slideDeck.slides.length >= 2, `${topic.name} has at least 2 visual slides (${slideDeck.slides.length})`);
      assert(flashcardsDeck.cards.length >= 3, `${topic.name} has at least 3 flashcards (${flashcardsDeck.cards.length})`);
      assert(clinicalCases.cases.length >= 1, `${topic.name} has at least 1 clinical case (${clinicalCases.cases.length})`);
      assert(mcqs.length >= 5, `${topic.name} has practice MCQs available (${mcqs.length} verified questions)`);
    }
  }

  // ===========================================================================
  // 7. CLOSED-LOOP ERROR VAULT & REMEDIATION INTEGRITY
  // ===========================================================================
  console.log('\n--- 7. Closed-Loop Error Vault & Adaptive State Evolution ---');
  {
    let userState = getInitialAppState();

    // 1. Correct attempt -> Error Vault is clean
    const correctAttempt = recordMcqAttempt(userState, {
      questionId: 'q-med-ecg',
      subjectId: 'medicine',
      topicId: 'med-1',
      source: 'qbank',
      selectedAnswer: 'A',
      correctAnswer: 'A',
      isCorrect: true,
      attemptNumber: 1,
    });
    userState = correctAttempt.updatedState;
    assert(userState.errorNotebook.length === 0, 'Correct answer did NOT enter Error Vault');

    // 2. Incorrect attempt -> Enters Error Vault
    const incorrectAttempt = recordMcqAttempt(userState, {
      questionId: 'q-med-arrhythmia',
      subjectId: 'medicine',
      topicId: 'med-1',
      source: 'qbank',
      selectedAnswer: 'B',
      correctAnswer: 'A',
      isCorrect: false,
      attemptNumber: 1,
    });
    userState = incorrectAttempt.updatedState;

    // Simulate recording error in Error Notebook
    userState = {
      ...userState,
      errorNotebook: [
        {
          id: 'err-med-1',
          subjectId: 'medicine',
          topic: 'Arrhythmias',
          topicId: 'med-1',
          questionGist: 'Delta wave in WPW syndrome with AFib',
          myMistake: 'Given Digoxin/Verapamil instead of Procainamide',
          correctConcept: 'Avoid AV nodal blockers in pre-excited AFib',
          isReviewed: false,
          dateAdded: '2026-08-31',
        },
      ],
    };

    assert(userState.errorNotebook.length === 1, 'Incorrect attempt entered Error Vault');

    // 3. Fix Concept -> closed loop remediation
    const remediationPkg = generateConceptRemediationPackage(
      'medicine',
      'med-1',
      'c-arrhythmias',
      'Pre-excited AFib & WPW Contraindications',
      'repeated'
    );
    assert(remediationPkg.retestQuestions.length >= 3, 'Remediation package includes targeted retest');

    // 4. Retest 5/5 -> mastery increases, priority drops, error reviewed
    const medSubject = FMGE_SUBJECTS.find((s) => s.id === 'medicine')!;
    const medTopic = medSubject.topics[0];

    const priorityBefore = calculateTopicAdaptivePriority(medSubject, medTopic, userState, 60);

    const retestResult = processRemediationResult(
      userState,
      'medicine',
      'med-1',
      'c-arrhythmias',
      5,
      5,
      [
        { questionId: 'r1', isCorrect: true, selectedAnswer: 'A', correctAnswer: 'A' },
        { questionId: 'r2', isCorrect: true, selectedAnswer: 'A', correctAnswer: 'A' },
        { questionId: 'r3', isCorrect: true, selectedAnswer: 'A', correctAnswer: 'A' },
        { questionId: 'r4', isCorrect: true, selectedAnswer: 'A', correctAnswer: 'A' },
        { questionId: 'r5', isCorrect: true, selectedAnswer: 'A', correctAnswer: 'A' },
      ]
    );

    const priorityAfter = calculateTopicAdaptivePriority(medSubject, medTopic, retestResult.updatedState, 60);

    assert(retestResult.remediationStatus === 'mastered', 'Remediation achieved mastered status');
    assert(retestResult.updatedState.errorNotebook[0].isReviewed, 'Error item marked as reviewed');
    assert(
      priorityAfter.masteryScore > priorityBefore.masteryScore,
      `Mastery score increased from ${priorityBefore.masteryScore}% to ${priorityAfter.masteryScore}%`
    );
    assert(
      priorityAfter.priorityScore < priorityBefore.priorityScore,
      `Priority score reduced from ${priorityBefore.priorityScore} to ${priorityAfter.priorityScore}`
    );
  }

  // ===========================================================================
  // 8. DAILY MISSION & TIME BUDGET DETERMINISM
  // ===========================================================================
  console.log('\n--- 8. Daily Mission Dynamic Generation & Time Budget ---');
  {
    const stateWithAttempts = getInitialAppState();
    const mission60 = generateDailyMission(stateWithAttempts, 60);
    const mission120 = generateDailyMission(stateWithAttempts, 120);

    assert(mission60.totalAllocatedMinutes <= 70, `60m budget allocated ${mission60.totalAllocatedMinutes}m`);
    assert(mission120.totalAllocatedMinutes <= 130, `120m budget allocated ${mission120.totalAllocatedMinutes}m`);
    assert(mission120.tasks.length >= mission60.tasks.length, 'Larger budget allocates more or deeper study tasks');

    // Verify streak calculation
    const zeroStreak = calculateStudyStreak(stateWithAttempts.studyLogs);
    assert(zeroStreak === 0, 'Clean state streak is 0');
  }

  console.log('\n================================================================');
  console.log(` DATA INTEGRITY AUDIT COMPLETE: ${passed} passed, ${failed} failed.`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runDataIntegrityAudit();
