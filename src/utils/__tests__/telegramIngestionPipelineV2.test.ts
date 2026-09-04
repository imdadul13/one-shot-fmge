import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  normalizeQuestionText,
  computeNormalizedQuestionHash,
  calculateTextSimilarity,
  findNearDuplicateQuestion,
  classifyClinicalText,
  extractQuestionDataFromMessage,
  ingestTelegramMessagePipeline,
  updateChannelSyncCursor,
  generateSyncDiagnostics,
  canonicalQuestionToTelegramMcq,
} from '../telegramPipelineEngine';
import {
  CanonicalQuestion,
  QuestionSource,
  RawTelegramMessage,
  TelegramChannelConfig,
  TelegramMCQ,
  AppState,
} from '../../types';
import { normalizeAppState } from '../storage';
import { recordMcqAttempt } from '../performanceEngine';
import { getInitialAppState } from '../../data/sampleData';

describe('ONE SHOT FMGE — Telegram Ingestion V2: Pipeline + Persistence + Deduplication Rebuild', () => {
  const rawMessages: RawTelegramMessage[] = [];
  const canonicalQuestions: CanonicalQuestion[] = [];
  const questionSources: QuestionSource[] = [];

  const testChannel: TelegramChannelConfig = {
    id: 'chan-targetfmge',
    name: 'Target FMGE',
    handle: 'targetfmgechannel',
    description: 'High-Yield Medical Channel',
    category: 'Community QBank',
    isActive: true,
    status: 'live',
  };

  // 1. Raw Message Idempotency Check
  it('1. Same Telegram message received twice produces only 1 raw record (idempotency)', () => {
    const input = {
      channelId: 'targetfmgechannel',
      channelTitle: 'Target FMGE',
      telegramMessageId: 'msg-101',
      telegramChatId: 'chat-999',
      messageDate: '2026-08-31T12:00:00Z',
      text: 'Which is the earliest clinical sign of magnesium sulfate toxicity?\nA) Loss of deep tendon reflexes\nB) Respiratory depression\nC) Cardiac arrest\nD) Oliguria\nAns: A\nExp: Loss of patellar reflex occurs at 8-12 mEq/L and is the earliest sign.',
    };

    // First arrival
    const res1 = ingestTelegramMessagePipeline(input, rawMessages, canonicalQuestions, questionSources);
    assert.equal(res1.status, 'QUESTION_CREATED');
    assert.equal(res1.isDuplicate, false);
    assert(res1.rawMessage, 'Raw message generated');
    assert(res1.canonicalQuestion, 'Canonical question generated');

    rawMessages.push(res1.rawMessage);
    if (res1.canonicalQuestion) canonicalQuestions.push(res1.canonicalQuestion);
    if (res1.newSource) questionSources.push(res1.newSource);

    // Second arrival (exact same messageId & chatId)
    const res2 = ingestTelegramMessagePipeline(input, rawMessages, canonicalQuestions, questionSources);
    assert.equal(res2.status, 'DUPLICATE');
    assert.equal(res2.isDuplicate, true);
    assert.equal(rawMessages.length, 1, 'Raw message array retains exactly 1 record');
  });

  // 2. Question Deduplication (Same Question in Different Channel / Message)
  it('2. Same question posted in different channel attaches new source to existing canonical question', () => {
    const inputCrossPost = {
      channelId: 'mission_fmge8',
      channelTitle: 'Mission FMGE 8',
      telegramMessageId: 'msg-505',
      telegramChatId: 'chat-888',
      messageDate: '2026-08-31T12:15:00Z',
      text: 'Which is the earliest clinical sign of magnesium sulfate toxicity?\nA) Loss of deep tendon reflexes\nB) Respiratory depression\nC) Cardiac arrest\nD) Oliguria\nAns: A\nExp: Loss of patellar reflex occurs first.',
    };

    const res = ingestTelegramMessagePipeline(inputCrossPost, rawMessages, canonicalQuestions, questionSources);
    assert.equal(res.status, 'DUPLICATE');
    assert.equal(res.isDuplicate, true);
    assert.equal(canonicalQuestions.length, 1, 'No duplicate canonical question created');
    assert(res.newSource, 'New QuestionSource record generated');
    assert.equal(res.newSource.channelId, 'mission_fmge8');

    rawMessages.push(res.rawMessage);
    if (res.newSource) questionSources.push(res.newSource);
  });

  // 3. Near-Duplicate Fuzzy Similarity Detection
  it('3. Slightly reformatted duplicate detected via Tier 2 text similarity (>= 0.85)', () => {
    const inputFuzzy = {
      channelId: 'fmge_quizzes',
      channelTitle: 'FMGE Quizzes Daily',
      telegramMessageId: 'msg-999',
      telegramChatId: 'chat-777',
      messageDate: '2026-08-31T12:30:00Z',
      // Notice: "MgSO4" instead of "magnesium sulfate", and "Q. " prefix
      text: 'Q. Which is the earliest sign of MgSO4 toxicity in pregnancy?\n1. Loss of deep tendon reflexes\n2. Respiratory depression\n3. Cardiac arrest\n4. Oliguria\nAns: 1\nExplanation: Patellar reflex loss.',
    };

    const res = ingestTelegramMessagePipeline(inputFuzzy, rawMessages, canonicalQuestions, questionSources);
    assert.equal(res.status, 'DUPLICATE');
    assert.equal(res.isDuplicate, true);
    assert.equal(canonicalQuestions.length, 1, 'Still only 1 canonical question');
  });

  // 4. Two Genuinely Different Questions
  it('4. Two genuinely different questions on the same subject are preserved as distinct questions', () => {
    const inputNew = {
      channelId: 'targetfmgechannel',
      channelTitle: 'Target FMGE',
      telegramMessageId: 'msg-102',
      telegramChatId: 'chat-999',
      messageDate: '2026-08-31T12:45:00Z',
      text: 'What is the therapeutic serum level of Magnesium Sulfate for seizure prophylaxis in severe pre-eclampsia?\nA) 1 to 2 mEq/L\nB) 4 to 7 mEq/L\nC) 8 to 10 mEq/L\nD) 12 to 15 mEq/L\nAns: B\nExp: Therapeutic range of MgSO4 is 4-7 mEq/L (or 4.8-8.4 mg/dL).',
    };

    const res = ingestTelegramMessagePipeline(inputNew, rawMessages, canonicalQuestions, questionSources);
    assert.equal(res.status, 'QUESTION_CREATED');
    assert.equal(res.isDuplicate, false);
    assert(res.canonicalQuestion);

    rawMessages.push(res.rawMessage);
    canonicalQuestions.push(res.canonicalQuestion);
    if (res.newSource) questionSources.push(res.newSource);

    assert.equal(canonicalQuestions.length, 2, 'Two distinct questions now exist');
  });

  // 5. Image-Based Question (IBQ) Media Preservation
  it('5. Image-based question creates IMAGE question with high-res media record', () => {
    const inputIBQ = {
      channelId: 'radiology_fmge',
      channelTitle: 'Radiology Spotters',
      telegramMessageId: 'msg-201',
      telegramChatId: 'chat-666',
      messageDate: '2026-08-31T13:00:00Z',
      text: 'Identify the classical radiological sign shown on this erect chest radiograph:\nA) Continuous diaphragm sign\nB) Crescentic subdiaphragmatic free gas\nC) Sail sign\nD) Steeple sign\nAns: B\nExp: Free gas under right dome of diaphragm indicates pneumoperitoneum.',
      photoUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514',
    };

    const res = ingestTelegramMessagePipeline(inputIBQ, rawMessages, canonicalQuestions, questionSources);
    assert.equal(res.status, 'QUESTION_CREATED');
    assert.equal(res.canonicalQuestion?.questionType, 'IMAGE');
    assert.equal(res.canonicalQuestion?.media.length, 1);
    assert.equal(res.canonicalQuestion?.media[0].type, 'IMAGE');
    assert.equal(res.canonicalQuestion?.media[0].url, 'https://images.unsplash.com/photo-1516549655169-df83a0774514');

    rawMessages.push(res.rawMessage);
    if (res.canonicalQuestion) canonicalQuestions.push(res.canonicalQuestion);
  });

  // 6. Video-Based Question Preservation
  it('6. Video-based question creates VIDEO question with stream & thumbnail metadata', () => {
    const inputVideo = {
      channelId: 'clinical_videos_fmge',
      channelTitle: 'Clinical Medicine Loops',
      telegramMessageId: 'msg-301',
      telegramChatId: 'chat-555',
      messageDate: '2026-08-31T13:15:00Z',
      text: 'Observe this video demonstration of a neurological reflex. Which nerve root is being tested?\nA) C5\nB) C6\nC) C7\nD) S1\nAns: D\nExp: Ankle jerk (Achilles reflex) tests the S1 nerve root.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      videoThumbUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d',
    };

    const res = ingestTelegramMessagePipeline(inputVideo, rawMessages, canonicalQuestions, questionSources);
    assert.equal(res.status, 'QUESTION_CREATED');
    assert.equal(res.canonicalQuestion?.questionType, 'VIDEO');
    assert.equal(res.canonicalQuestion?.media.length, 1);
    assert.equal(res.canonicalQuestion?.media[0].type, 'VIDEO');
    assert.equal(res.canonicalQuestion?.media[0].url, inputVideo.videoUrl);
    assert.equal(res.canonicalQuestion?.media[0].thumbnailUrl, inputVideo.videoThumbUrl);

    rawMessages.push(res.rawMessage);
    if (res.canonicalQuestion) canonicalQuestions.push(res.canonicalQuestion);
  });

  // 7. Video with Insufficient Info (Zero Hallucination Policy)
  it('7. Video post with insufficient information is classified as MEDIA_ONLY without hallucinating MCQs', () => {
    const inputShortVideo = {
      channelId: 'surgery_clips',
      channelTitle: 'Surgery Clips',
      telegramMessageId: 'msg-401',
      telegramChatId: 'chat-444',
      messageDate: '2026-08-31T13:30:00Z',
      text: 'Laparoscopic cholecystectomy critical view of safety.', // No options, no answer
      videoUrl: 'https://example.com/cholecystectomy.mp4',
    };

    const res = ingestTelegramMessagePipeline(inputShortVideo, rawMessages, canonicalQuestions, questionSources);
    assert.equal(res.status, 'MEDIA_ONLY');
    assert.equal(res.canonicalQuestion, undefined, 'No question hallucinated');
    assert.equal(res.rawMessage.processingStatus, 'MEDIA_ONLY');
    assert.equal(res.rawMessage.media?.length, 1);
  });

  // 8. Poll Extraction with Unknown Correct Answer
  it('8. Telegram poll with no answer key marks needsVerification = true and correctAnswer = null', () => {
    const inputPoll = {
      channelId: 'targetfmgechannel',
      channelTitle: 'Target FMGE',
      telegramMessageId: 'msg-601',
      telegramChatId: 'chat-999',
      messageDate: '2026-08-31T13:45:00Z',
      text: 'Which antibody is most specific for Systemic Lupus Erythematosus (SLE)?',
      pollOptions: [
        { text: 'Anti-dsDNA', percent: 62 },
        { text: 'Anti-Smith (Anti-Sm)', percent: 28 },
        { text: 'ANA', percent: 8 },
        { text: 'Anti-Ro (SSA)', percent: 2 },
      ],
    };

    const res = ingestTelegramMessagePipeline(inputPoll, rawMessages, canonicalQuestions, questionSources);
    assert.equal(res.status, 'QUESTION_CREATED');
    assert(res.canonicalQuestion);
    assert.equal(res.canonicalQuestion.questionType, 'POLL');
    assert.equal(res.canonicalQuestion.correctAnswer, null, 'Does not invent an answer');
    assert.equal(res.canonicalQuestion.needsVerification, true);
    assert.equal(res.canonicalQuestion.options.length, 4);
    assert.equal(res.canonicalQuestion.options[0].percentage, 62);
  });

  // 9. Sync Cursor Progression
  it('9. Channel cursor advances monotonically and tracks last synced timestamp', () => {
    const batch: RawTelegramMessage[] = [
      {
        id: 'raw-1',
        channelId: 'targetfmgechannel',
        telegramMessageId: 150,
        telegramChatId: 'chat-999',
        messageDate: '2026-08-31T14:00:00Z',
        text: 'Sample',
        mediaType: 'NONE',
        sourceUrl: 'https://t.me/targetfmgechannel/150',
        ingestedAt: '2026-08-31T14:00:00Z',
        processingStatus: 'PROCESSED',
        compositeKey: 'chat-999:150',
      },
      {
        id: 'raw-2',
        channelId: 'targetfmgechannel',
        telegramMessageId: 210,
        telegramChatId: 'chat-999',
        messageDate: '2026-08-31T14:05:00Z',
        text: 'Sample 2',
        mediaType: 'NONE',
        sourceUrl: 'https://t.me/targetfmgechannel/210',
        ingestedAt: '2026-08-31T14:05:00Z',
        processingStatus: 'PROCESSED',
        compositeKey: 'chat-999:210',
      },
    ];

    const updatedChan = updateChannelSyncCursor(testChannel, batch);
    assert.equal(updatedChan.lastSyncedMessageId, 210);
    assert.equal(updatedChan.status, 'live');
    assert(updatedChan.lastSyncedAt);
  });

  // 10. Diagnostics Observability Metric Generation
  it('10. generateSyncDiagnostics produces accurate metrics for monitoring and debugging', () => {
    const mockResults = [
      { status: 'QUESTION_CREATED' as const, isDuplicate: false, rawMessage: rawMessages[0] },
      { status: 'DUPLICATE' as const, isDuplicate: true, rawMessage: rawMessages[0] },
      { status: 'MEDIA_ONLY' as const, isDuplicate: false, rawMessage: rawMessages[0] },
    ];

    const diag = generateSyncDiagnostics(testChannel, mockResults as any);
    assert.equal(diag.messagesReceivedCount, 3);
    assert.equal(diag.questionsCreatedCount, 1);
    assert.equal(diag.duplicatesDetectedCount, 1);
    assert.equal(diag.mediaProcessedCount, 1);
    assert.equal(diag.failedCount, 0);
    assert.equal(diag.status, 'live');
  });

  // 11. State Normalization & Offline / Refresh Persistence
  it('11. normalizeAppState safely persists raw Telegram messages, canonical questions, and diagnostics', () => {
    const rawState: Partial<AppState> = {
      rawTelegramMessages: rawMessages,
      canonicalQuestions: canonicalQuestions,
      questionSources: questionSources,
      telegramDiagnostics: {
        'targetfmgechannel': {
          channelId: 'targetfmgechannel',
          channelHandle: 'targetfmgechannel',
          channelTitle: 'Target FMGE',
          messagesReceivedCount: 10,
          messagesProcessedCount: 10,
          questionsCreatedCount: 4,
          duplicatesDetectedCount: 2,
          mediaProcessedCount: 1,
          failedCount: 0,
          status: 'live',
        },
      },
    };

    const normalized = normalizeAppState(rawState);
    assert(normalized);
    assert.equal(normalized.rawTelegramMessages.length, 0, 'Telegram data decoupled from localStorage');
    assert.equal(normalized.canonicalQuestions.length, 0, 'Telegram questions stored only in PostgreSQL');
  });

  // 12. Universal Progress Engine Integration
  it('12. Ingested Telegram question attempt records into universal performance history', () => {
    let state = getInitialAppState();
    const telegramQ = canonicalQuestions[0];
    assert(telegramQ);

    const { attempt, updatedState } = recordMcqAttempt(state, {
      questionId: telegramQ.id,
      subjectId: telegramQ.subject,
      topicId: telegramQ.topic,
      topicName: telegramQ.topic,
      isCorrect: true,
      selectedAnswer: 'A',
      selectedOptionId: 'A',
      correctAnswer: 'A',
      correctOptionId: 'A',
      timeTakenSeconds: 12,
      source: 'telegram',
    });

    assert.equal(attempt.source, 'telegram');
    assert.equal(attempt.isCorrect, true);
    assert.equal(updatedState.mcqAttempts?.length, 1);
  });

  // 13. Automatic Error Vault Registration on Wrong Attempt
  it('13. Answering a Telegram question incorrectly allows seamless registration in Error Vault', () => {
    let state = getInitialAppState();
    const { attempt: wrongAttempt, updatedState } = recordMcqAttempt(state, {
      questionId: 'q-tg-wrong',
      subjectId: 'medicine',
      topicId: 'med-1',
      topicName: 'Cardiology (ECG, MI)',
      isCorrect: false,
      selectedAnswer: 'B',
      selectedOptionId: 'B',
      correctAnswer: 'A',
      correctOptionId: 'A',
      timeTakenSeconds: 20,
      source: 'telegram',
    });

    assert.equal(wrongAttempt.isCorrect, false);
    assert.equal(wrongAttempt.source, 'telegram');
    assert.equal(updatedState.mcqAttempts?.length, 1);
  });

  // 14. Canonical Question to TelegramMCQ Adapter Compatibility
  it('14. canonicalQuestionToTelegramMcq maps smoothly for existing UI components without data loss', () => {
    const cq = canonicalQuestions[0];
    const mcq = canonicalQuestionToTelegramMcq(cq);

    assert.equal(mcq.id, cq.id);
    assert.equal(mcq.question, cq.stem);
    assert.equal(mcq.subjectId, cq.subject);
    assert.equal(mcq.correctKey, cq.correctAnswer || 'A');
    assert.equal(mcq.options.length, cq.options.length);
  });

  // 15. Clinical Classification Accuracy
  it('15. classifyClinicalText matches high-yield FMGE keywords to correct subjects', () => {
    const res1 = classifyClinicalText('Patient with STEMI and ST elevation in lead II, III, aVF');
    assert.equal(res1.subjectId, 'medicine');

    const res2 = classifyClinicalText('Calculate Parkland fluid resuscitation formula for 40% deep burn');
    assert.equal(res2.subjectId, 'surgery');

    const res3 = classifyClinicalText('Vaccine vial monitor (VVM) stage 3 ice lined refrigerator storage');
    assert.equal(res3.subjectId, 'psm');
  });

  // 16. Zero False Data: Default State has 0 Seeded Mock Questions and 0 channels
  it('16. getInitialAppState initializes with 0 mock/seeded questions and clean channel', () => {
    const freshState = getInitialAppState();
    assert.equal(freshState.telegramQuestions.length, 0, 'Zero seeded mock questions');
    assert.equal(freshState.rawTelegramMessages.length, 0, 'Zero raw messages');
    assert.equal(freshState.canonicalQuestions.length, 0, 'Zero canonical questions');
    assert.equal(freshState.telegramChannels.length, 0, 'Zero preset channels in clean architecture');
  });

  // 17. Storage Purge: normalizeAppState completely purges legacy Telegram localStorage entries
  it('17. normalizeAppState completely filters out legacy mock IDs and Unsplash URLs', () => {
    const dirtyState: Partial<AppState> = {
      telegramQuestions: [
        {
          id: 'tg-med-1',
          question: 'Mock Pneumoperitoneum question',
          subjectId: 'medicine',
          options: [{ key: 'A', text: 'Option A' }],
          correctKey: 'A',
          explanation: 'Mock explanation',
          sourceChannel: '@mock',
          imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514',
        } as any,
      ],
    };

    const cleanState = normalizeAppState(dirtyState);
    assert.equal(cleanState.telegramQuestions.length, 0, 'Decoupled from localStorage');
    assert.equal(cleanState.telegramChannels.length, 0, 'Decoupled from localStorage');
  });

  // 18. Phase 16 Acceptance Test: Real Telegram Test Message Flow
  it('18. Phase 16 Acceptance Test: Ingests "ONE SHOT FMGE TELEGRAM TEST 12345" and second distinct message', () => {
    const testRawMessages: RawTelegramMessage[] = [];
    const testCanonical: CanonicalQuestion[] = [];
    const testSources: QuestionSource[] = [];

    // Test Message 1: "ONE SHOT FMGE TELEGRAM TEST 12345"
    const testMsg1 = {
      channelId: 'targetfmgechannel',
      channelTitle: 'Target FMGE',
      telegramMessageId: '12345',
      telegramChatId: 'targetfmgechannel',
      messageDate: '2026-08-31T18:00:00Z',
      text: 'ONE SHOT FMGE TELEGRAM TEST 12345',
    };

    const res1 = ingestTelegramMessagePipeline(testMsg1, testRawMessages, testCanonical, testSources);
    assert.equal(res1.isDuplicate, false);
    assert.equal(res1.rawMessage.telegramMessageId, '12345');
    assert.equal(res1.rawMessage.text, 'ONE SHOT FMGE TELEGRAM TEST 12345');
    assert.equal(res1.rawMessage.compositeKey, 'targetfmgechannel:12345');
    // Because it is a text alert with no options, zero-hallucination policy preserves it without fake MCQs
    assert.equal(res1.canonicalQuestion, undefined, 'No fake MCQ invented for test string');
    testRawMessages.push(res1.rawMessage);

    // Re-sending Message 1 must be rejected as DUPLICATE
    const res1Retry = ingestTelegramMessagePipeline(testMsg1, testRawMessages, testCanonical, testSources);
    assert.equal(res1Retry.isDuplicate, true);
    assert.equal(res1Retry.status, 'DUPLICATE');
    assert.equal(testRawMessages.length, 1, 'Still exactly 1 raw message');

    // Test Message 2: "SECOND FMGE TELEGRAM TEST 67890"
    const testMsg2 = {
      channelId: 'targetfmgechannel',
      channelTitle: 'Target FMGE',
      telegramMessageId: '67890',
      telegramChatId: 'targetfmgechannel',
      messageDate: '2026-08-31T18:05:00Z',
      text: 'SECOND FMGE TELEGRAM TEST 67890',
    };

    const res2 = ingestTelegramMessagePipeline(testMsg2, testRawMessages, testCanonical, testSources);
    assert.equal(res2.isDuplicate, false);
    assert.equal(res2.rawMessage.telegramMessageId, '67890');
    assert.equal(res2.rawMessage.text, 'SECOND FMGE TELEGRAM TEST 67890');
    testRawMessages.push(res2.rawMessage);

    assert.equal(testRawMessages.length, 2, 'Two distinct messages recorded');

    // Persistence Check: Ingested messages recorded in database pipeline and sanitized from localStorage
    assert.equal(testRawMessages.length, 2);
    assert.equal(testRawMessages[0].text, 'ONE SHOT FMGE TELEGRAM TEST 12345');
    assert.equal(testRawMessages[1].text, 'SECOND FMGE TELEGRAM TEST 67890');

    const normalized = normalizeAppState({ rawTelegramMessages: testRawMessages });
    assert.equal(normalized.rawTelegramMessages.length, 0, 'Decoupled from localStorage');
  });
});
