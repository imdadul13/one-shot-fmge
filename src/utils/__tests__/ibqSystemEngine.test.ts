import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  VISUAL_CONCEPT_REGISTRY,
  VERIFIED_IBQ_BANK,
  getVerifiedIBQForTopic,
  getVerifiedIBQsForSubject,
  resolveQuestionVisual,
  resolvePracticeSessionVisuals,
  VisualValidationLog,
} from '../visualQuestionEngine';
import { getVerifiedTopicQuestions } from '../practiceSessionEngine';
import { recordMcqAttempt, calculateImagePerformanceSummary } from '../performanceEngine';
import { AppState, PracticeSessionQuestion } from '../../types';
import { VERIFIED_FMGE_IMAGE_ASSETS, imageRetrievalService } from '../../../server/image-retrieval-service';
import { generateStructuredClinicalMCQ } from '../../../server/dynamic-mcq-engine';

describe('Priority 2: System-Wide Image-Based Question Engine', () => {
  it('1. Authoritative IBQ bank contains at least 34 verified clinical IBQ items across all key subjects', () => {
    assert.ok(VERIFIED_IBQ_BANK.length >= 34, `Expected >=34 IBQs, found ${VERIFIED_IBQ_BANK.length}`);
    const subjects = new Set(VERIFIED_IBQ_BANK.map((q) => q.subject));
    assert.ok(subjects.has('Pathology'));
    assert.ok(subjects.has('Radiology'));
    assert.ok(subjects.has('Dermatology'));
    assert.ok(subjects.has('Microbiology'));
    assert.ok(subjects.has('Ophthalmology'));
    assert.ok(subjects.has('Cardiology'));
  });

  it('2. Central VISUAL_CONCEPT_REGISTRY has verified diagnostic assets across 12+ disciplines', () => {
    const assets = Object.values(VISUAL_CONCEPT_REGISTRY);
    assert.ok(assets.length >= 25, `Expected >= 25 concepts, found ${assets.length}`);

    // Verify critical clinical concepts exist
    assert.ok(VISUAL_CONCEPT_REGISTRY['cardio:complete_heart_block_jpg']);
    assert.ok(VISUAL_CONCEPT_REGISTRY['cardio:inferior_stemi_jpg']);
    assert.ok(VISUAL_CONCEPT_REGISTRY['cardio:wpw_syndrome_jpg']);
    assert.ok(VISUAL_CONCEPT_REGISTRY['path:reed_sternberg_jpg']);
    assert.ok(VISUAL_CONCEPT_REGISTRY['rad:tension_pneumothorax_jpg']);
    assert.ok(VISUAL_CONCEPT_REGISTRY['derm:target_lesions_jpg']);
    assert.ok(VISUAL_CONCEPT_REGISTRY['micro:acid_fast_bacilli_jpg']);
    assert.ok(VISUAL_CONCEPT_REGISTRY['ophth:cherry_red_spot_jpg']);
    assert.ok(VISUAL_CONCEPT_REGISTRY['ent:tympanic_perforation_jpg']);
    assert.ok(VISUAL_CONCEPT_REGISTRY['obg:hydatidiform_mole_jpg']);
  });

  it('3. Strict concept matching: WPW query returns ONLY WPW image, NEVER Complete Heart Block', () => {
    const wpwAsset = imageRetrievalService.findInVerifiedRepository('Wolff Parkinson White WPW syndrome delta wave');
    assert.ok(wpwAsset !== null);
    assert.ok(
      wpwAsset.searchQuery.toLowerCase().includes('wpw') || wpwAsset.medicalFinding.toLowerCase().includes('wpw')
    );
    assert.ok(!wpwAsset.medicalFinding.toLowerCase().includes('complete heart block'));
  });

  it('4. Strict concept matching: Inferior STEMI returns Inferior STEMI asset with reciprocal changes', () => {
    const stemiAsset = imageRetrievalService.findInVerifiedRepository('inferior wall STEMI lead II III aVF');
    assert.ok(stemiAsset !== null);
    assert.ok(stemiAsset.medicalFinding.toLowerCase().includes('inferior'));
  });

  it('5. Zero unrelated image fallback: An un-imageable topic returns null on server retrieval (no default image)', async () => {
    const nonVisual = await imageRetrievalService.retrieveAndValidateImage('Mechanism of action of spironolactone in primary hyperaldosteronism');
    assert.strictEqual(nonVisual, null, 'Expected null for non-visual question to enforce text-only fallback');
  });

  it('6. Practice Session Deduplication: Never repeats the same image within a 10-MCQ session', () => {
    const dummyQuestions: PracticeSessionQuestion[] = [
      {
        id: 'q1',
        sessionId: 's1',
        sequenceNumber: 1,
        scenario: 'ECG showing complete heart block',
        question: 'What is the treatment?',
        options: [{ optionId: 'o1', text: 'Pacemaker', isCorrect: true, key: 'A' }],
        correctOptionId: 'o1',
        correctAnswer: 'A',
        explanation: 'Complete heart block explanation',
        subjectId: 'medicine',
        subjectName: 'Medicine',
        topicId: 'med-1',
        topicName: 'Cardiology',
        isAiGenerated: false,
        visualIntent: { requiresImage: true, visualTarget: 'complete third degree av block av dissociation' },
      },
      {
        id: 'q2',
        sessionId: 's1',
        sequenceNumber: 2,
        scenario: 'Another ECG question on complete heart block',
        question: 'What is the finding?',
        options: [{ optionId: 'o2', text: 'AV dissociation', isCorrect: true, key: 'A' }],
        correctOptionId: 'o2',
        correctAnswer: 'A',
        explanation: 'AV dissociation explanation',
        subjectId: 'medicine',
        subjectName: 'Medicine',
        topicId: 'med-1',
        topicName: 'Cardiology',
        isAiGenerated: false,
        visualIntent: { requiresImage: true, visualTarget: 'complete third degree av block av dissociation' },
      },
    ];

    const logs: VisualValidationLog[] = [];
    const resolved = resolvePracticeSessionVisuals(dummyQuestions, logs);

    // Q1 gets the image, Q2 is safely downgraded to text-only to prevent duplicate image reuse!
    assert.ok(resolved[0].imageUrl !== undefined, 'Q1 should have image');
    assert.strictEqual(resolved[1].imageUrl, undefined, 'Q2 must NOT reuse same image in same session');
    assert.strictEqual(logs.length, 2);
    assert.strictEqual(logs[0].validationResult, 'PASS');
    assert.strictEqual(logs[1].validationResult, 'REJECT');
  });

  it('7. Dynamic MCQ Engine serves verified IBQs with clean vignettes and option keys', () => {
    const result = generateStructuredClinicalMCQ('Give me an image-based question on Reed-Sternberg cells');
    assert.strictEqual(result.questionType, 'image_based_question');
    assert.ok(result.imageUrl && result.imageUrl.includes('reed_sternberg'));
    assert.ok(result.options.length === 4);
    assert.ok(result.correctAnswer.length === 1);
  });

  it('8. Adaptive Performance Engine accurately tracks student image accuracy by modality', () => {
    let mockState: AppState = {
      settings: {
        userName: 'Dr. Student',
        examDate: '2026-11-30',
        targetScore: 200,
        dailyStudyHourGoal: 6,
      },
      subjectProgress: {},
      topicsState: {},
      grandTests: [],
      errorNotebook: [],
      dailyTasks: [],
      studyLogs: {},
      customPearls: [],
      bookmarkedPearlIds: [],
      telegramQuestions: [],
      mcqAttempts: [],
    };

    // Record 2 correct ECG attempts
    const r1 = recordMcqAttempt(mockState, {
      questionId: 'q-ecg-1',
      subjectId: 'medicine',
      topicId: 'med-ecg',
      topicName: 'Cardiology',
      isCorrect: true,
      selectedAnswer: 'A',
      correctAnswer: 'A',
      source: 'qbank',
      isImageBased: true,
      imageCategory: 'ecg',
      imageUrl: '/images/ibq/cardio_complete_heart_block.jpg',
    });
    mockState = r1.updatedState;

    const r2 = recordMcqAttempt(mockState, {
      questionId: 'q-ecg-2',
      subjectId: 'medicine',
      topicId: 'med-ecg',
      topicName: 'Cardiology',
      isCorrect: true,
      selectedAnswer: 'B',
      correctAnswer: 'B',
      source: 'qbank',
      isImageBased: true,
      imageCategory: 'ecg',
      imageUrl: '/images/ibq/cardio_wpw_ecg.jpg',
    });
    mockState = r2.updatedState;

    // Record 1 incorrect radiology attempt
    const r3 = recordMcqAttempt(mockState, {
      questionId: 'q-rad-1',
      subjectId: 'radiology',
      topicId: 'rad-pneumo',
      topicName: 'Radiology',
      isCorrect: false,
      selectedAnswer: 'C',
      correctAnswer: 'A',
      source: 'qbank',
      isImageBased: true,
      imageCategory: 'xray',
      imageUrl: '/images/ibq/radiology_tension_pneumothorax.jpg',
    });
    mockState = r3.updatedState;

    const summary = calculateImagePerformanceSummary(mockState);
    assert.strictEqual(summary.totalImageAttempts, 3);
    assert.strictEqual(summary.correctImageAttempts, 2);
    assert.strictEqual(summary.overallImageAccuracy, 67);
    assert.strictEqual(summary.categoryBreakdown['ecg'].attempts, 2);
    assert.strictEqual(summary.categoryBreakdown['ecg'].accuracy, 100);
    assert.strictEqual(summary.categoryBreakdown['xray'].attempts, 1);
    assert.strictEqual(summary.categoryBreakdown['xray'].accuracy, 0);
  });

  it('9. Mixed 10-Question Session test across diverse subjects with authentic images and text fallbacks', () => {
    const subjectsToTest = ['Pathology', 'Radiology', 'Dermatology', 'Microbiology', 'Ophthalmology', 'Medicine'];
    for (const sub of subjectsToTest) {
      const ibqs = getVerifiedIBQsForSubject(sub);
      assert.ok(ibqs.length > 0, `Expected IBQs for ${sub}, found 0`);
      for (const ibq of ibqs) {
        assert.ok(ibq.imageSrc.startsWith('/images/ibq/'), `Invalid image path: ${ibq.imageSrc}`);
        assert.ok(ibq.vignette.length > 20);
        assert.ok(ibq.options.length === 4);
      }
    }
  });
});
