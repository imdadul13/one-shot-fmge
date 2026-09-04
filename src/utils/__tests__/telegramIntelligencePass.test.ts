import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  ingestTelegramPayload,
  classifyTelegramContent,
  computeContentFingerprint,
  extractEmbeddedOptionsFromText,
  randomizeOptionKeys,
  RawTelegramPayload,
} from '../telegramIngestionEngine';
import { TelegramMCQ, AppState } from '../../types';
import { getInitialAppState } from '../../data/sampleData';
import { recordMcqAttempt } from '../performanceEngine';

describe('ONE SHOT FMGE — Pass 3: Telegram Intelligence & MCQ Bank Suite', () => {
  const existingQuestions: TelegramMCQ[] = [];

  // 1. Normal MCQ with Poll Options
  it('1. Parses normal Telegram poll MCQ and classifies into FMGE syllabus', () => {
    const payload: RawTelegramPayload = {
      messageId: '1001',
      channelName: '@marrow_fmge_daily',
      text: 'Which of the following is the drug of choice for paroxysmal supraventricular tachycardia (PSVT)?',
      pollOptions: [
        { text: 'Adenosine', isCorrect: true, voterCount: 150 },
        { text: 'Amiodarone', voterCount: 30 },
        { text: 'Verapamil', voterCount: 20 },
        { text: 'Digoxin', voterCount: 10 },
      ],
      correctOptionKey: 'A',
    };

    const res = ingestTelegramPayload(payload, existingQuestions);
    assert.equal(res.type, 'mcq');
    assert(res.mcq, 'MCQ object created');
    assert.equal(res.matchedSubjectId, 'pharmacology');
    assert.equal(res.mcq.options.length, 4);
    assert(res.mcq.correctKey, 'Correct key assigned');
    assert.equal(res.isDuplicate, false);

    existingQuestions.push(res.mcq);
  });

  // 2. MCQ with Image (IBQ)
  it('2. Ingests image-based MCQ (IBQ) preserving high-res image URL', () => {
    const payload: RawTelegramPayload = {
      messageId: '1002',
      channelName: '@radiology_fmge_images',
      text: 'Identify the characteristic radiological sign seen in this chest X-ray of a 5-year-old child presenting with croup:',
      photoUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514',
      pollOptions: [
        { text: 'Steeple sign', isCorrect: true },
        { text: 'Thumbprint sign' },
        { text: 'Sail sign' },
        { text: 'Boot shaped heart' },
      ],
    };

    const res = ingestTelegramPayload(payload, existingQuestions);
    assert.equal(res.type, 'mcq');
    assert.equal(res.mcq?.questionType, 'ibq');
    assert.equal(res.mcq?.imageUrl, 'https://images.unsplash.com/photo-1516549655169-df83a0774514');
    assert(res.mcq?.options.some((o) => o.text === 'Steeple sign'));

    existingQuestions.push(res.mcq!);
  });

  // 3. MCQ with Video
  it('3. Ingests video-based MCQ with embedded video URL', () => {
    const payload: RawTelegramPayload = {
      messageId: '1003',
      channelName: '@clinical_skills_fmge',
      text: 'Observe the involuntary movement in this patient video. What is the most likely diagnosis?',
      videoUrl: 'https://www.youtube.com/embed/3B3g6W4d5J4',
      pollOptions: [
        { text: 'Hemiballismus', isCorrect: true },
        { text: 'Chorea' },
        { text: 'Athetosis' },
        { text: 'Dystonia' },
      ],
    };

    const res = ingestTelegramPayload(payload, existingQuestions);
    assert.equal(res.type, 'mcq');
    assert.equal(res.mcq?.questionType, 'video');
    assert.equal(res.mcq?.videoUrl, 'https://www.youtube.com/embed/3B3g6W4d5J4');

    existingQuestions.push(res.mcq!);
  });

  // 4. High-Yield text post -> Medical Pearl
  it('4. Converts non-MCQ high-yield Telegram post into permanent Medical Pearl', () => {
    const payload: RawTelegramPayload = {
      messageId: '1004',
      channelName: '@fmge_pearls_mnemonics',
      text: 'HIGH YIELD PEARL: Stages of Vaccine Vial Monitor (VVM)\nStage 1: Inner square lighter than outer circle -> USE\nStage 2: Inner square still lighter -> USE FAST\nStage 3: Inner square matches outer circle -> DO NOT USE\nStage 4: Inner square darker -> DO NOT USE',
      isHighYield: true,
    };

    const res = ingestTelegramPayload(payload, existingQuestions);
    assert.equal(res.type, 'high_yield_note');
    assert(res.pearl, 'Pearl created');
    assert.equal(res.matchedSubjectId, 'psm');
    assert(res.pearl.explanation.includes('Vaccine Vial Monitor'));
  });

  // 5. Malformed post handled gracefully
  it('5. Handles empty or malformed payload without crashing', () => {
    const payload: RawTelegramPayload = {
      messageId: '1005',
      text: '',
    };

    const res = ingestTelegramPayload(payload, existingQuestions);
    assert.equal(res.type, 'unrecognized');
    assert.equal(res.classificationConfidence, 0);
  });

  // 6. Duplicate Detection via Content Fingerprint
  it('6. Detects duplicate question with slightly different spacing or prefix', () => {
    const payload1: RawTelegramPayload = {
      messageId: '1006a',
      text: 'Q. Which organism causes Pseudomembranous colitis following antibiotic use?',
      pollOptions: [
        { text: 'Clostridioides difficile', isCorrect: true },
        { text: 'Staphylococcus aureus' },
      ],
    };

    const res1 = ingestTelegramPayload(payload1, existingQuestions);
    assert.equal(res1.isDuplicate, false);
    existingQuestions.push(res1.mcq!);

    // Duplicate submission with formatting variance
    const payload2: RawTelegramPayload = {
      messageId: '1006b',
      text: 'Which organism causes pseudomembranous colitis following antibiotic use?   ',
      pollOptions: [
        { text: 'Clostridioides difficile' },
        { text: 'Staphylococcus aureus' },
      ],
    };

    const res2 = ingestTelegramPayload(payload2, existingQuestions);
    assert.equal(res2.isDuplicate, true);
  });

  // 7. Embedded Option & Answer Text Parsing
  it('7. Parses plain-text MCQ with embedded A/B/C/D and Ans: B format', () => {
    const rawText = `A 45-year-old male presents with crushing retrosternal chest pain radiating to the left arm. ECG reveals ST elevation in leads II, III, and aVF. Which coronary artery is occluded?
A) Right Coronary Artery (RCA)
B) Left Anterior Descending (LAD)
C) Left Circumflex (LCx)
D) Left Main Coronary Artery
Ans: A
Explanation: ST elevations in II, III, aVF represent Inferior Wall MI, most commonly caused by RCA occlusion.`;

    const parsed = extractEmbeddedOptionsFromText(rawText);
    assert.equal(parsed.options.length, 4);
    assert.equal(parsed.inferredAnswer, 'A');
    assert(parsed.extractedExplanation?.includes('Inferior Wall MI'));

    const payload: RawTelegramPayload = {
      messageId: '1007',
      text: rawText,
    };

    const res = ingestTelegramPayload(payload, existingQuestions);
    assert.equal(res.type, 'mcq');
    assert.equal(res.matchedSubjectId, 'medicine');
  });

  // 8. Topic Classification Accuracy
  it('8. Accurately maps clinical topics to 19 FMGE subjects', () => {
    const card = classifyTelegramContent('Myocardial infarction ECG ST elevation troponin cardiac biomarkers');
    assert.equal(card.subjectId, 'medicine');

    const surg = classifyTelegramContent('Parkland formula burns fluid calculation resuscitation rule of nines');
    assert.equal(surg.subjectId, 'surgery');

    const psm = classifyTelegramContent('Screening sensitivity specificity positive predictive value false positive rate');
    assert.equal(psm.subjectId, 'psm');

    const obg = classifyTelegramContent('Preeclampsia eclampsia magnesium sulfate Pritchard regimen hypertension pregnancy');
    assert.equal(obg.subjectId, 'obg');
  });

  // 9. Answer Option Shuffling
  it('9. Randomizes option keys without losing correct answer association', () => {
    const options = [
      { key: 'A', text: 'Correct Answer' },
      { key: 'B', text: 'Distractor 1' },
      { key: 'C', text: 'Distractor 2' },
      { key: 'D', text: 'Distractor 3' },
    ];

    const distribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };

    for (let i = 0; i < 40; i++) {
      const { shuffledOptions, newCorrectKey } = randomizeOptionKeys(options, 'A');
      const correctOpt = shuffledOptions.find((o) => o.key === newCorrectKey);
      assert.equal(correctOpt?.text, 'Correct Answer');
      distribution[newCorrectKey] = (distribution[newCorrectKey] || 0) + 1;
    }

    // Verify it is not always 'A'
    assert(distribution.B > 0 || distribution.C > 0 || distribution.D > 0);
  });

  // 10. Error Vault Logging upon incorrect attempt on Telegram MCQ
  it('10. Automatically registers mistakes on Telegram MCQs into the Error Vault', () => {
    let state: AppState = getInitialAppState();
    const testTelegramMcq: TelegramMCQ = {
      id: 'tg-test-999',
      messageId: '999',
      sourceChannel: '@fmge_clinical',
      subjectId: 'medicine',
      topic: 'Cardiology - Arrhythmias',
      question: 'Which antiarrhythmic drug causes pulmonary fibrosis and thyroid dysfunction?',
      options: [
        { key: 'A', text: 'Amiodarone' },
        { key: 'B', text: 'Lidocaine' },
        { key: 'C', text: 'Flecainide' },
        { key: 'D', text: 'Procainamide' },
      ],
      correctKey: 'A',
      explanation: 'Amiodarone contains iodine and causes thyroid abnormalities and pulmonary toxicity.',
      tags: ['medicine', 'cardiology'],
      datePulled: '2026-08-31',
    };

    // User chooses 'B' (Incorrect)
    const { updatedState, attempt } = recordMcqAttempt(state, {
      questionId: testTelegramMcq.id,
      subjectId: testTelegramMcq.subjectId,
      topicId: 'med-1',
      topicName: testTelegramMcq.topic,
      isCorrect: false,
      selectedAnswer: 'B',
      correctAnswer: 'A',
      timeTakenSeconds: 22,
      difficulty: 'high-yield',
      source: 'telegram',
    });

    assert.equal(attempt.isCorrect, false);
    assert.equal(updatedState.errorNotebook.length, 1);
    assert.equal(updatedState.errorNotebook[0].subjectId, 'medicine');
    assert.equal(updatedState.errorNotebook[0].isReviewed, false);
  });
});
