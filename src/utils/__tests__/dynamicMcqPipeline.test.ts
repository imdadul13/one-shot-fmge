import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { classifyTopicAndSubject, generateStructuredClinicalMCQ } from '../../../server/dynamic-mcq-engine';

describe('FMGE Structured MCQ Generation Pipeline Verification', () => {
  it('1. Heart Blocks generates genuine Complete Heart Block clinical scenario', () => {
    const rawQuery = 'Give me an FMGE MCQ on heart blocks';
    const { subject, topic } = classifyTopicAndSubject(rawQuery);
    assert.equal(subject, 'General Medicine');
    assert.ok(topic.includes('Heart Blocks'), 'Topic must be Heart Blocks');
    assert.ok(!topic.includes('Give me an'), 'Topic must NOT contain user prompt text');

    const mcq = generateStructuredClinicalMCQ(rawQuery);
    assert.equal(mcq.questionType, 'clinical_vignette');
    assert.ok(mcq.stem.includes('Stokes-Adams') || mcq.stem.includes('AV dissociation') || mcq.stem.includes('syncope'), 'Stem must describe clinical heart block presentation');
    assert.ok(mcq.question.length > 10, 'Specific question must be present');
    assert.equal(mcq.options.length, 4, 'Must have exactly 4 options');
    assert.equal(mcq.correctAnswer, 'A', 'Correct answer must be Option A (PPI)');
    assert.ok(mcq.options[0].text.toLowerCase().includes('pacemaker'), 'Option A must be Pacemaker');
    assert.ok(mcq.distractorBreakdown['B'].includes('Digoxin'), 'Distractor B must explain Digoxin contraindication');
    assert.ok(mcq.distractorBreakdown['C'].includes('Amiodarone'), 'Distractor C must explain Amiodarone');
    assert.ok(mcq.fmgeTakeaway.length > 20, 'FMGE takeaway must be present');
    assert.ok(mcq.memoryHook.length > 10, 'Memory hook must be present');
  });

  it('2. Nephrotic syndrome generates genuine pediatric Minimal Change Disease scenario', () => {
    const rawQuery = 'Give me an FMGE MCQ on nephrotic syndrome';
    const { subject, topic } = classifyTopicAndSubject(rawQuery);
    assert.ok(subject.includes('Medicine'));
    assert.ok(topic.includes('Nephrotic'));

    const mcq = generateStructuredClinicalMCQ(rawQuery);
    assert.ok(mcq.stem.includes('proteinuria') && mcq.stem.includes('podocyte'), 'Stem must describe podocyte effacement and heavy proteinuria');
    assert.equal(mcq.options.length, 4);
    assert.equal(mcq.correctAnswer, 'A');
    assert.ok(mcq.options[0].text.includes('Prednisolone'));
  });

  it('3. Crohn\'s disease generates genuine IBD pathology and serology question', () => {
    const rawQuery = 'Give me an FMGE MCQ on Crohn\'s disease';
    const { subject, topic } = classifyTopicAndSubject(rawQuery);
    assert.ok(subject.includes('Medicine') || subject.includes('Surgery'));
    assert.ok(topic.includes('Inflammatory Bowel'));

    const mcq = generateStructuredClinicalMCQ(rawQuery);
    assert.ok(mcq.stem.includes('skip lesions') || mcq.stem.includes('granulomas'));
    assert.equal(mcq.options.length, 4);
    assert.equal(mcq.correctAnswer, 'A');
    assert.ok(mcq.options[0].text.includes('ASCA'));
    assert.ok(mcq.distractorBreakdown['B'].includes('p-ANCA'));
  });

  it('4. Cavernous sinus generates genuine Head & Neck Anatomy question', () => {
    const rawQuery = 'Give me an anatomy MCQ on the cavernous sinus';
    const { subject, topic } = classifyTopicAndSubject(rawQuery);
    assert.equal(subject, 'Anatomy');
    assert.ok(topic.includes('Cavernous Sinus'));

    const mcq = generateStructuredClinicalMCQ(rawQuery);
    assert.ok(mcq.stem.includes('danger area of the face') || mcq.stem.includes('abduct'));
    assert.equal(mcq.options.length, 4);
    assert.equal(mcq.correctAnswer, 'C');
    assert.ok(mcq.options[2].text.includes('Abducens nerve (CN VI)'));
    assert.ok(mcq.distractorBreakdown['A'].includes('lateral wall'));
  });
});
