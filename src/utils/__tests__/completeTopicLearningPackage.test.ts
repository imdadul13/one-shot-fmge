import { getTopicLearningContext, generateTopicSearchQueries, calculateSemanticRelevanceScore } from '../topicIntelligence';
import { generateSlideDeck } from '../slideEngine';
import { generateFlashcardDeck } from '../flashcardEngine';
import { generateTopicClinicalCasesDeck } from '../clinicalCaseEngine';
import { generateTopicPearls } from '../pearlEngine';
import { getVerifiedTopicQuestions, validateComprehensiveMcq } from '../practiceSessionEngine';
import { recordMcqAttempt, calculateTopicPerformanceMetrics } from '../performanceEngine';
import { getInitialAppState } from '../../data/sampleData';

async function runCompleteTopicLearningPackageTests() {
  console.log('=== RUNNING COMPLETE TOPIC LEARNING PACKAGE ARCHITECTURE TESTS ===\n');
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

  const TEST_8_TOPICS = [
    {
      subjectId: 'anatomy',
      subjectName: 'Anatomy',
      topicId: 'anat-4',
      topicName: 'Lower Limb - Knee Joint & Nerve Lesions (Peroneal/Tibial)',
      expectedKeywords: ['knee', 'peroneal', 'tibial', 'acl', 'pcl', 'meniscus'],
    },
    {
      subjectId: 'anatomy',
      subjectName: 'Anatomy',
      topicId: 'anat-5',
      topicName: 'Thorax - Mediastinum, Heart & Coronary Circulation',
      expectedKeywords: ['mediastinum', 'heart', 'coronary', 'pericardium', 'rca', 'lad', 'pda'],
    },
    {
      subjectId: 'anatomy',
      subjectName: 'Anatomy',
      topicId: 'anat-1',
      topicName: 'Upper Limb - Brachial Plexus & Nerve Injuries',
      expectedKeywords: ['brachial', 'plexus', 'erb', 'klumpke', 'radial', 'ulnar', 'median'],
    },
    {
      subjectId: 'medicine',
      subjectName: 'Medicine',
      topicId: 'med-1',
      topicName: 'Cardiology (ECG, MI, Arrhythmias, Heart Failure)',
      expectedKeywords: ['arrhythmia', 'ecg', 'stemi', 'adenosine', 'amiodarone'],
    },
    {
      subjectId: 'medicine',
      subjectName: 'Medicine',
      topicId: 'med-1',
      topicName: 'Acute Coronary Syndrome & STEMI',
      expectedKeywords: ['stemi', 'infarction', 'coronary', 'troponin'],
    },
    {
      subjectId: 'pharmacology',
      subjectName: 'Pharmacology',
      topicId: 'pharm-1',
      topicName: 'Autonomic Nervous System Drugs',
      expectedKeywords: ['cholinergic', 'atropine', 'pralidoxime', 'adrenergic', 'organophosphate'],
    },
    {
      subjectId: 'pathology',
      subjectName: 'Pathology',
      topicId: 'path-4',
      topicName: 'Neoplasia - Hallmarks, Oncogenes & Tumor Markers',
      expectedKeywords: ['tp53', 'bcr-abl', 'c-myc', 'afp', 'translocation', 'tumor'],
    },
    {
      subjectId: 'obg',
      subjectName: 'Obstetrics & Gynecology',
      topicId: 'obg-2',
      topicName: 'Pre-eclampsia, Eclampsia & MgSO4 Pritchard Regimen',
      expectedKeywords: ['preeclampsia', 'eclampsia', 'pritchard', 'mgso4', 'calcium gluconate'],
    },
    {
      subjectId: 'psm',
      subjectName: 'PSM & Biostatistics',
      topicId: 'psm-2',
      topicName: 'Vaccine Storage & Cold Chain Management',
      expectedKeywords: ['vaccine', 'vvm', 'cold chain', 'ilr'],
    },
    {
      subjectId: 'surgery',
      subjectName: 'General Surgery',
      topicId: 'surg-1',
      topicName: 'Burns - Parkland Formula & Resuscitation',
      expectedKeywords: ['burns', 'parkland', 'resuscitation', 'tbsa'],
    },
  ];

  for (const t of TEST_8_TOPICS) {
    console.log(`\n--- Testing Topic: [${t.subjectName} -> ${t.topicName}] ---`);

    // 1. CANONICAL TOPIC LEARNING CONTEXT
    const context = getTopicLearningContext(t.subjectId, t.topicId, t.topicName);
    assert(Boolean(context.topicName), `[${t.topicName}] Context canonical name: ${context.topicName}`);
    assert(context.conceptClusters.length >= 3, `[${t.topicName}] Has ${context.conceptClusters.length} concept clusters`);
    assert(context.estimatedMarks >= 2, `[${t.topicName}] Estimated marks: ${context.estimatedMarks}`);
    assert(context.clinicalConcepts.length >= 2, `[${t.topicName}] Has clinical concepts`);
    assert(context.commonExamTraps.length >= 1, `[${t.topicName}] Has common exam traps`);

    // 2. HIGH-YIELD SLIDES
    const slideDeck = generateSlideDeck(t.subjectId, t.topicId, t.topicName);
    assert(slideDeck.slides.length >= 4, `[${t.topicName}] Generates ${slideDeck.slides.length} slides (>=4)`);
    assert(slideDeck.slides.every((s) => s.bullets.length >= 2), `[${t.topicName}] All slides contain structured bullets`);
    assert(slideDeck.slides.some((s) => Boolean(s.keyTakeaways || s.examTrapWarning)), `[${t.topicName}] Contains exam takeaways / traps`);

    // 3. CLINICAL CASES
    const casesDeck = generateTopicClinicalCasesDeck(t.subjectId, t.topicId, t.topicName);
    assert(casesDeck.cases.length >= 2, `[${t.topicName}] Generates ${casesDeck.cases.length} clinical cases (>=2)`);
    for (let cIdx = 0; cIdx < casesDeck.cases.length; cIdx++) {
      const c = casesDeck.cases[cIdx];
      assert(c.options.length === 4, `[${t.topicName}] Case #${cIdx + 1} has 4 options`);
      assert(['A', 'B', 'C', 'D'].includes(c.correctAnswer), `[${t.topicName}] Case #${cIdx + 1} valid correct letter (${c.correctAnswer})`);
      assert(c.clinicalExplanation.length > 20, `[${t.topicName}] Case #${cIdx + 1} has deep clinical explanation`);
      assert(Boolean(c.examPearl), `[${t.topicName}] Case #${cIdx + 1} has clinical exam pearl`);
    }

    // 4. FLASHCARDS
    const flashcardDeck = generateFlashcardDeck(t.subjectId, t.topicId, t.topicName);
    assert(flashcardDeck.cards.length >= 5, `[${t.topicName}] Generates ${flashcardDeck.cards.length} flashcards (>=5)`);
    assert(flashcardDeck.cards.every((fc) => fc.front.length > 10 && fc.back.length > 5), `[${t.topicName}] All flashcards have rich front/back`);

    // 5. HIGH-YIELD PEARLS
    const pearls = generateTopicPearls(t.subjectId, t.topicId, t.topicName);
    assert(pearls.length >= 3, `[${t.topicName}] Generates ${pearls.length} pearls (>=3)`);
    assert(pearls.every((p) => p.statement.length > 15), `[${t.topicName}] All pearls have substantive statements`);

    // 6. PRACTICE 10 MCQS & 10-POINT VALIDATION
    const questions = getVerifiedTopicQuestions(t.subjectId, t.topicId, t.topicName, 10);
    assert(questions.length === 10, `[${t.topicName}] Generates exactly 10 questions`);
    const letters = new Set(questions.map((q) => q.correctAnswer));
    assert(letters.size >= 2, `[${t.topicName}] Questions have randomized answer positions (${Array.from(letters).join(', ')})`);

    for (let qIdx = 0; qIdx < questions.length; qIdx++) {
      const q = questions[qIdx];
      const val = validateComprehensiveMcq(q, t.subjectName, t.topicName);
      assert(val.isValid, `[${t.topicName}] Question #${qIdx + 1} passed 10-point MCQ validator`);
    }

    // 7. YOUTUBE CONCEPT SEARCH EXPANSION & NON-LITERAL QUERIES
    const searchQueries = generateTopicSearchQueries(context);
    assert(searchQueries.length >= 3, `[${t.topicName}] Generates ${searchQueries.length} diverse queries`);
    assert(!searchQueries.includes(t.topicName), `[${t.topicName}] Search queries do NOT just use raw literal topic string`);
  }

  // =========================================================================
  // TEST SUITE: TOPIC CONTENT ISOLATION & NO DATA LEAKAGE
  // =========================================================================
  console.log('\n--- 8. Testing Topic Content Isolation & No Data Leakage ---');

  const kneeCases = generateTopicClinicalCasesDeck('anatomy', 'anat-4', 'Lower Limb Knee Joint');
  const mediastinumCases = generateTopicClinicalCasesDeck('anatomy', 'anat-5', 'Thorax Mediastinum Heart');

  const kneeText = JSON.stringify(kneeCases).toLowerCase();
  const mediastinumText = JSON.stringify(mediastinumCases).toLowerCase();

  assert(kneeText.includes('peroneal') || kneeText.includes('lachman') || kneeText.includes('meniscus'), 'Knee cases contain knee concepts');
  assert(!kneeText.includes('mediastinum') && !kneeText.includes('coronary sinus'), 'Knee cases do NOT leak mediastinum concepts');

  assert(mediastinumText.includes('coronary') || mediastinumText.includes('mediastinum'), 'Mediastinum cases contain thorax concepts');
  assert(!mediastinumText.includes('peroneal') && !mediastinumText.includes('unholy triad'), 'Mediastinum cases do NOT leak knee concepts');

  console.log(`\n================================================`);
  console.log(`ALL TOPIC LEARNING TESTS COMPLETED: ${passed} passed, ${failed} failed.`);
  console.log(`================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runCompleteTopicLearningPackageTests();
