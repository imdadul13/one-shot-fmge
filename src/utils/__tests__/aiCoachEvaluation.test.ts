import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getVerifiedSubjectQuestion } from '../../../server/fmge-routes';

describe('FMGE AI Coach - Quality Control & Formatting Verification', () => {
  it('1. All 19 subjects return complete clinical vignettes with matching subjects', () => {
    const subjects = [
      'Anatomy', 'Physiology', 'Biochemistry', 'Pathology', 'Pharmacology',
      'Microbiology', 'Forensic Medicine', 'PSM / Community Medicine', 'ENT',
      'Ophthalmology', 'General Medicine', 'General Surgery', 'Obstetrics & Gynecology',
      'Pediatrics', 'Orthopedics', 'Dermatology', 'Psychiatry', 'Radiology', 'Anesthesia'
    ];

    for (const sub of subjects) {
      const q = getVerifiedSubjectQuestion(sub);
      assert.ok(q, `Question for ${sub} must exist`);
      assert.ok(q.question && q.question.length > 50, `Question stem for ${sub} must be a full clinical scenario`);
      assert.ok(Array.isArray(q.options) && q.options.length === 4, `Question for ${sub} must have exactly 4 options`);
      assert.ok(['A', 'B', 'C', 'D'].includes(q.correctKey || q.correctAnswer), `Question for ${sub} must have a valid correct key`);
      assert.ok(q.explanation && q.explanation.length > 20, `Question for ${sub} must have a detailed explanation`);
    }
  });

  it('2. Anatomy question tests genuine Anatomy and NOT Cardiology', () => {
    const anatomyQ = getVerifiedSubjectQuestion('Anatomy');
    assert.ok(
      anatomyQ.question.toLowerCase().includes('brachial plexus') ||
      anatomyQ.question.toLowerCase().includes('peroneal') ||
      anatomyQ.question.toLowerCase().includes('nerve') ||
      anatomyQ.question.toLowerCase().includes('ligament') ||
      anatomyQ.topic.toLowerCase().includes('limb') ||
      anatomyQ.topic.toLowerCase().includes('anatomy'),
      'Anatomy question must test genuine anatomical structures'
    );
    assert.ok(!anatomyQ.question.toLowerCase().includes('stemi'), 'Anatomy must not contain STEMI');
    assert.ok(!anatomyQ.question.toLowerCase().includes('nitroglycerin'), 'Anatomy must not contain Nitroglycerin');
  });

  it('3. Medicine Cardiology question tests genuine Cardiovascular medicine', () => {
    const medQ = getVerifiedSubjectQuestion('General Medicine', 'Cardiology');
    assert.ok(
      medQ.topic.toLowerCase().includes('cardiology') ||
      medQ.question.toLowerCase().includes('stemi') ||
      medQ.question.toLowerCase().includes('heart block') ||
      medQ.question.toLowerCase().includes('ecg'),
      'Cardiology question must test genuine cardiology pathology'
    );
  });

  it('4. Options contain plausible distractors and no All of the Above / None of the Above', () => {
    const q = getVerifiedSubjectQuestion('Pharmacology');
    for (const opt of q.options) {
      assert.notEqual(opt.text.toLowerCase(), 'all of the above');
      assert.notEqual(opt.text.toLowerCase(), 'none of the above');
      assert.ok(opt.text.trim().length > 3);
    }
  });

  it('5. Distractor analysis explains why other options are wrong', () => {
    const q = getVerifiedSubjectQuestion('Obstetrics & Gynecology');
    assert.ok(q.distractorExplanations || q.explanation, 'Distractor explanations or comprehensive rationale must be present');
    if (q.distractorExplanations) {
      const keys = Object.keys(q.distractorExplanations);
      assert.ok(keys.length >= 1, 'Should provide specific rationale for incorrect options');
    }
  });
});
