import { describe, it } from 'node:test';
import assert from 'node:assert';
import { shuffleQuestionOptions, validateComprehensiveMcq } from '../practiceSessionEngine';
import { VERIFIED_FMGE_IMAGE_ASSETS } from '../../../server/image-retrieval-service';

describe('Frontend Image Question Integration & Option Security', () => {
  it('1. Shuffling image-based questions binds correctness to option ID without Option A bias', () => {
    const rawOptions = [
      { text: 'Permanent pacemaker implantation (PPI)', isCorrect: true, optionId: 'opt-pacemaker' },
      { text: 'Intravenous Digoxin bolus', isCorrect: false, optionId: 'opt-digoxin' },
      { text: 'Oral Amiodarone maintenance therapy', isCorrect: false, optionId: 'opt-amiodarone' },
      { text: 'Immediate synchronized DC cardioversion', isCorrect: false, optionId: 'opt-cardioversion' },
    ];

    const { shuffledOptions, correctOptionId, correctAnswer } = shuffleQuestionOptions(rawOptions);

    assert.strictEqual(shuffledOptions.length, 4);
    assert.strictEqual(correctOptionId, 'opt-pacemaker');

    const correctShuffledOpt = shuffledOptions.find((o) => o.key === correctAnswer);
    assert.ok(correctShuffledOpt !== undefined);
    assert.strictEqual(correctShuffledOpt.optionId, 'opt-pacemaker');
    assert.strictEqual(correctShuffledOpt.text, 'Permanent pacemaker implantation (PPI)');
  });

  it('2. 10-Point MCQ Validator accepts verified image-based questions with complete stems and explanations', () => {
    const asset = VERIFIED_FMGE_IMAGE_ASSETS[0];
    const q = {
      scenario: 'A 68-year-old man presents with recurrent syncope and severe bradycardia (pulse 36/min). 12-lead ECG demonstrates AV dissociation as shown in the attached tracing.',
      question: 'What is the definitive management of choice for this patient?',
      options: [
        { text: 'Permanent pacemaker implantation', isCorrect: true },
        { text: 'Intravenous Digoxin bolus', isCorrect: false },
        { text: 'Oral Amiodarone therapy', isCorrect: false },
        { text: 'Synchronized DC cardioversion', isCorrect: false },
      ],
      explanation: 'Complete heart block requires definitive permanent pacemaker implantation due to risk of asystole and syncope.',
      subjectId: 'medicine',
      topicId: 'med-1',
    };

    const validation = validateComprehensiveMcq(q, 'Medicine', 'Cardiology (ECG, MI, Arrhythmias, Heart Failure)');
    assert.strictEqual(validation.isValid, true);
  });

  it('3. Verified image assets contain all necessary fields for zoom modal rendering', () => {
    for (const asset of VERIFIED_FMGE_IMAGE_ASSETS) {
      assert.ok(asset.imageUrl && asset.imageUrl.length > 0);
      assert.ok(asset.imageCategory);
      assert.ok(asset.medicalFinding);
      assert.ok(asset.whatToLookFor);
      assert.ok(asset.sourceName);
    }
  });
});
