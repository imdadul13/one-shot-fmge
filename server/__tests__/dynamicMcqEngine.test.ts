import { describe, it } from 'node:test';
import assert from 'node:assert';
import { classifyTopicAndSubject, generateStructuredClinicalMCQ } from '../dynamic-mcq-engine';

describe('AI Coach Consecutive MCQ & Vignette Generator', () => {
  it('1. Correctly classifies initial medical prompt', () => {
    const res = classifyTopicAndSubject('Give me an FMGE MCQ on Nephrology - AKI, CKD & Glomerular Diseases');
    assert.strictEqual(res.subject, 'General Medicine');
    assert.ok(res.topic.toLowerCase().includes('nephrology'), 'Topic should include nephrology');
  });

  it('2. Extracts active topic from history when user asks "Give me another MCQ"', () => {
    const mockHistory = [
      {
        role: 'user',
        content: 'Give me an FMGE clinical vignette MCQ on Nephrology - AKI (KDIGO Criteria), CKD & Glomerular Diseases',
      },
      {
        role: 'assistant',
        content: 'Here is an authentic clinical vignette MCQ on General Medicine:\n\n[Active Clinical Question]\nSubject: General Medicine\nTopic: Nephrology · AKI (KDIGO Criteria) & ATN vs Prerenal Azotemia\nScenario: A 62-year-old male with severe dehydrating diarrhea develops oliguria...\nQuestion: Which of the following findings most reliably differentiates Acute Tubular Necrosis (ATN) from Prerenal Azotemia?',
      },
    ];

    const res = classifyTopicAndSubject('Give me another MCQ', mockHistory);
    assert.strictEqual(res.subject, 'General Medicine');
    assert.ok(res.topic.toLowerCase().includes('nephrology'), `Extracted topic from history: ${res.topic}`);
  });

  it('3. Generates completely different MCQs on consecutive "Give me another MCQ" requests', () => {
    // 1st request
    const mcq1 = generateStructuredClinicalMCQ('Give me an MCQ on nephrology', null, []);
    assert.ok(mcq1.stem.length > 20, 'MCQ 1 has clinical stem');
    assert.strictEqual(mcq1.options.length, 4, 'MCQ 1 has 4 options');

    // 2nd request with MCQ 1 in history
    const historyAfterQ1 = [
      { role: 'user', content: 'Give me an MCQ on nephrology' },
      {
        role: 'assistant',
        content: `[Active Clinical Question]\nSubject: ${mcq1.subject}\nTopic: ${mcq1.topic}\nScenario: ${mcq1.stem}\nQuestion: ${mcq1.question}`,
      },
      { role: 'user', content: 'Give me another MCQ' },
    ];

    const mcq2 = generateStructuredClinicalMCQ('Give me another MCQ', null, historyAfterQ1);
    assert.ok(mcq2.stem.length > 20, 'MCQ 2 has clinical stem');
    assert.notStrictEqual(mcq1.question, mcq2.question, 'MCQ 2 question must be DIFFERENT from MCQ 1');
    assert.notStrictEqual(mcq1.stem, mcq2.stem, 'MCQ 2 stem must be DIFFERENT from MCQ 1');

    // 3rd request with MCQ 1 and MCQ 2 in history
    const historyAfterQ2 = [
      ...historyAfterQ1,
      {
        role: 'assistant',
        content: `[Active Clinical Question]\nSubject: ${mcq2.subject}\nTopic: ${mcq2.topic}\nScenario: ${mcq2.stem}\nQuestion: ${mcq2.question}`,
      },
      { role: 'user', content: 'Give me another MCQ' },
    ];

    const mcq3 = generateStructuredClinicalMCQ('Give me another MCQ', null, historyAfterQ2);
    assert.notStrictEqual(mcq2.question, mcq3.question, 'MCQ 3 question must be DIFFERENT from MCQ 2');
    assert.notStrictEqual(mcq1.question, mcq3.question, 'MCQ 3 question must be DIFFERENT from MCQ 1');
  });

  it('4. NEVER generates placeholder text in options', () => {
    const mockTopics = [
      'Nephrology · AKI & Glomerular Diseases',
      'Cardiology · Arrhythmias & MI',
      'Lower Limb · Femoral Triangle',
      'Upper Limb · Brachial Plexus Lesions',
    ];

    for (const t of mockTopics) {
      const q = generateStructuredClinicalMCQ(t, null, []);
      for (const opt of q.options) {
        assert.ok(
          !opt.text.includes('Initiate guideline-recommended first-line pharmacotherapy'),
          `Option contains no generic placeholder: ${opt.text}`
        );
        assert.ok(
          !opt.text.includes('Non-targeted symptomatic observation'),
          `Option contains no generic placeholder: ${opt.text}`
        );
      }
    }
  });

  it('5. Correctly handles Community Medicine (PSM) Immunization & Cold Chain requests', () => {
    const prompt = 'Give me an FMGE clinical vignette MCQ on National Immunization Schedule (NIS) & Cold Chain Equipment';
    const classification = classifyTopicAndSubject(prompt);
    assert.strictEqual(classification.subject, 'Community Medicine (PSM)');
    assert.ok(classification.topic.includes('National Immunization Schedule'));

    const q1 = generateStructuredClinicalMCQ(prompt, null, []);
    assert.strictEqual(q1.subject, 'Community Medicine (PSM)');
    assert.ok(q1.stem.includes('Vaccine Vial Monitor') || q1.stem.includes('VVM') || q1.stem.includes('vaccin'));
    assert.ok(q1.options.some((o) => o.text.includes('VVM') || o.text.includes('usable') || o.text.includes('batch')));

    // Consecutive request
    const history = [
      { role: 'user', content: prompt },
      {
        role: 'assistant',
        content: `[Active Clinical Question]\nSubject: ${q1.subject}\nTopic: ${q1.topic}\nScenario: ${q1.stem}\nQuestion: ${q1.question}`,
      },
      { role: 'user', content: 'Give me another MCQ' },
    ];

    const q2 = generateStructuredClinicalMCQ('Give me another MCQ', null, history);
    assert.strictEqual(q2.subject, 'Community Medicine (PSM)');
    assert.notStrictEqual(q1.question, q2.question, 'Consecutive PSM MCQ must be different');
    assert.ok(q2.stem.includes('9-month') || q2.stem.includes('Measles') || q2.stem.includes('Refrigerator') || q2.stem.includes('ILR'));
  });
});
