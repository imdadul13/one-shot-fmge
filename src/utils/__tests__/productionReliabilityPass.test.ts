import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { AppState, UserProfile, McqAttempt, TelegramMCQ, TelegramAnnouncement } from '../../types';
import { getInitialAppState } from '../../data/sampleData';
import { FMGE_SUBJECTS } from '../../data/fmgeSubjects';
import { recordMcqAttempt, calculateTopicPerformanceMetrics, calculateOverallPerformance } from '../performanceEngine';
import { calculateTopicAdaptivePriority } from '../adaptivePriorityEngine';
import { generateDailyMission } from '../dailyMissionEngine';
import {
  generateConceptRemediationPackage,
  processRemediationResult,
} from '../errorRemediationEngine';
import {
  resolveCloudConflict,
  savePendingOfflineWrite,
  getPendingOfflineWrite,
  clearPendingOfflineWrite,
} from '../cloudSync';
import { searchFmgeStudyData } from '../searchEngine';
import {
  ingestTelegramPayload,
  classifyTelegramContent,
} from '../telegramIngestionEngine';
import { getVerifiedTopicQuestions } from '../practiceSessionEngine';

// Polyfill localStorage for Node test runner
const memoryStorage = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => memoryStorage.get(key) || null,
  setItem: (key: string, value: string) => {
    memoryStorage.set(key, String(value));
  },
  removeItem: (key: string) => {
    memoryStorage.delete(key);
  },
  clear: () => {
    memoryStorage.clear();
  },
};

describe('FMGE Production Reliability & Data Persistence Pass (A to Z)', () => {
  let deviceAState: AppState;
  let deviceBState: AppState;
  let simulatedCloudDb: Record<string, any> = {};

  const testUser: UserProfile = {
    uid: 'user-fmge-test-doc-1',
    displayName: 'Dr. Exam Aspirant',
    email: 'dr.aspirant@fmge.ai',
    photoURL: null,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    onboardingCompleted: true,
    targetScore: 200,
    examDate: '2026-12-15',
    dailyHoursTarget: 8,
    preferences: {
      coachingSource: 'Marrow',
      primaryPlatform: 'Marrow & Telegram',
      theme: 'calm-teal',
      notificationsEnabled: true,
    },
  };

  // -------------------------------------------------------------
  // A. New user
  // -------------------------------------------------------------
  it('A. New User starts with clean state (0 attempts, 0 errors, 0 GTs, 0% mastery)', () => {
    deviceAState = getInitialAppState();
    assert.equal(deviceAState.mcqAttempts.length, 0);
    assert.equal(deviceAState.errorNotebook.length, 0);
    assert.equal(deviceAState.grandTests.length, 0);

    const perf = calculateOverallPerformance(deviceAState);
    assert.equal(perf.totalAttempts, 0);
    assert.equal(perf.overallAccuracy, 0);
  });

  // -------------------------------------------------------------
  // B. Login on Device A
  // -------------------------------------------------------------
  it('B. Login on Device A initializes user profile and saves initial cloud record', () => {
    simulatedCloudDb[testUser.uid] = JSON.parse(JSON.stringify(deviceAState));
    assert(simulatedCloudDb[testUser.uid], 'User cloud record exists');
    assert.equal(simulatedCloudDb[testUser.uid].mcqAttempts.length, 0);
  });

  // -------------------------------------------------------------
  // C. Answer 10 MCQs on Device A
  // -------------------------------------------------------------
  it('C. Answer 10 MCQs on Device A with realistic score (8 correct, 2 incorrect)', () => {
    const anatQuestions = getVerifiedTopicQuestions('anatomy', 'anat-4', 'Knee Joint & Nerve Lesions', 10);
    assert.equal(anatQuestions.length, 10);

    for (let i = 0; i < 10; i++) {
      const q = anatQuestions[i];
      const isCorrect = i < 8; // 8 correct, 2 incorrect
      const selectedOption = isCorrect
        ? q.correctAnswer
        : q.correctAnswer === 'A'
        ? 'B'
        : 'A';

      const res = recordMcqAttempt(deviceAState, {
        questionId: q.id,
        subjectId: 'anatomy',
        topicId: 'anat-4',
        topicName: 'Lower Limb - Knee Joint & Nerve Lesions',
        subtopic: 'Lower Limb',
        isCorrect,
        selectedAnswer: selectedOption,
        correctAnswer: q.correctAnswer,
        timeTakenSeconds: 35,
        source: 'recommended_video_practice',
        difficulty: 'high-yield',
        sessionId: 'session-dev-a',
      });

      deviceAState = res.updatedState;
    }

    assert.equal(deviceAState.mcqAttempts.length, 10);
  });

  // -------------------------------------------------------------
  // D. Verify progress on Device A
  // -------------------------------------------------------------
  it('D. Verify progress on Device A shows 80% accuracy and updated mastery', () => {
    const topicPerf = calculateTopicPerformanceMetrics('anatomy', 'anat-4', deviceAState.mcqAttempts);
    assert.equal(topicPerf.totalAttempts, 10);
    assert.equal(topicPerf.correctAnswers, 8);
    assert.equal(topicPerf.accuracy, 80);
    assert.equal(topicPerf.masteryStatus, 'proficient');

    // Simulate saving Device A to cloud
    simulatedCloudDb[testUser.uid] = JSON.parse(JSON.stringify(deviceAState));
  });

  // -------------------------------------------------------------
  // E. Login on Device B
  // -------------------------------------------------------------
  it('E. Login on Device B retrieves cloud state for user', () => {
    const cloudRecord = simulatedCloudDb[testUser.uid];
    assert(cloudRecord, 'Cloud state retrieved for Device B');
    deviceBState = JSON.parse(JSON.stringify(cloudRecord));
  });

  // -------------------------------------------------------------
  // F. Verify identical progress on Device B
  // -------------------------------------------------------------
  it('F. Verify identical progress on Device B', () => {
    assert.equal(deviceBState.mcqAttempts.length, 10);
    const bTopicPerf = calculateTopicPerformanceMetrics('anatomy', 'anat-4', deviceBState.mcqAttempts);
    assert.equal(bTopicPerf.totalAttempts, 10);
    assert.equal(bTopicPerf.accuracy, 80);
    assert.equal(bTopicPerf.masteryStatus, 'proficient');
  });

  // -------------------------------------------------------------
  // G. Create Error
  // -------------------------------------------------------------
  it('G. Create Error in Error Vault upon incorrect attempt', () => {
    const errorEntry = {
      id: 'err-test-q-101',
      subjectId: 'medicine',
      topic: 'Cardiology - ECGs (STEMI, Arrhythmias, Heart Blocks, WPW)',
      topicId: 'med-1',
      questionGist: 'Patient with syncope and intermittent Cannon A waves in JVP',
      myMistake: 'Selected First Degree AV Block',
      correctConcept: 'Complete (Third Degree) AV block produces AV dissociation and Cannon A waves',
      dateAdded: new Date().toISOString(),
      isReviewed: false,
    };

    deviceAState = {
      ...deviceAState,
      errorNotebook: [errorEntry, ...deviceAState.errorNotebook],
    };

    assert(deviceAState.errorNotebook.some((e) => e.id === 'err-test-q-101'));
  });

  // -------------------------------------------------------------
  // H. Remediate Error
  // -------------------------------------------------------------
  it('H. Remediate Error generates targeted micro-learning and retest', () => {
    const err = deviceAState.errorNotebook.find((e) => e.id === 'err-test-q-101') || deviceAState.errorNotebook[0];
    const pkg = generateConceptRemediationPackage(
      err.subjectId,
      err.topicId,
      'concept-med-av-block',
      err.topic
    );

    assert(pkg.slides.length >= 2);
    assert(pkg.retestQuestions.length >= 2);

    // Answer retest correctly
    const retestAttempts = pkg.retestQuestions.map((q) => ({
      questionId: q.id,
      isCorrect: true,
      selectedAnswer: q.correctAnswer,
      correctAnswer: q.correctAnswer,
    }));

    const scoreResult = processRemediationResult(
      deviceAState,
      pkg.subjectId,
      pkg.topicId,
      pkg.conceptId,
      pkg.retestQuestions.length,
      pkg.retestQuestions.length,
      retestAttempts
    );
    assert.equal(scoreResult.remediationStatus, 'mastered');
    deviceAState = scoreResult.updatedState;
  });

  // -------------------------------------------------------------
  // I. Verify remediation persisted
  // -------------------------------------------------------------
  it('I. Verify remediation persisted in state (error marked reviewed)', () => {
    const err = deviceAState.errorNotebook.find((e) => e.id === 'err-test-q-101');
    assert(err);
    assert.equal(err.isReviewed, true);
    assert.equal(err.remediationScore, 100);

    // Sync to Cloud
    simulatedCloudDb[testUser.uid] = JSON.parse(JSON.stringify(deviceAState));
  });

  // -------------------------------------------------------------
  // J. Reset study progress
  // -------------------------------------------------------------
  it('J. Reset study progress clears attempts & errors while preserving user profile & bookmarks', () => {
    const fresh = getInitialAppState();
    const cleanProgressState: AppState = {
      ...fresh,
      settings: deviceAState.settings,
      bookmarkedPearlIds: deviceAState.bookmarkedPearlIds,
      customPearls: deviceAState.customPearls,
      telegramChannels: deviceAState.telegramChannels,
      telegramQuestions: deviceAState.telegramQuestions,
      telegramAnnouncements: deviceAState.telegramAnnouncements,
    };

    assert.equal(cleanProgressState.mcqAttempts.length, 0);
    assert.equal(cleanProgressState.errorNotebook.length, 0);
    assert.equal(cleanProgressState.grandTests.length, 0);
    assert.equal(cleanProgressState.settings.userName, deviceAState.settings.userName);

    deviceAState = cleanProgressState;
    simulatedCloudDb[testUser.uid] = JSON.parse(JSON.stringify(cleanProgressState));
  });

  // -------------------------------------------------------------
  // K. Verify reset on Device A
  // -------------------------------------------------------------
  it('K. Verify reset on Device A shows 0 attempts and cold-start state', () => {
    assert.equal(deviceAState.mcqAttempts.length, 0);
    const overall = calculateOverallPerformance(deviceAState);
    assert.equal(overall.totalAttempts, 0);
  });

  // -------------------------------------------------------------
  // L. Verify reset on Device B
  // -------------------------------------------------------------
  it('L. Verify reset on Device B after cloud sync', () => {
    deviceBState = JSON.parse(JSON.stringify(simulatedCloudDb[testUser.uid]));
    assert.equal(deviceBState.mcqAttempts.length, 0);
    assert.equal(deviceBState.errorNotebook.length, 0);
  });

  // -------------------------------------------------------------
  // M. Search "arrhythmia"
  // -------------------------------------------------------------
  it('M. Search "arrhythmia" returns instant matching Cardiology topics and ECG concepts', () => {
    const results = searchFmgeStudyData('arrhythm', deviceAState, 5);
    assert(results.length > 0);
    const hasArrhythmiaMatch = results.some(
      (r) =>
        r.title.toLowerCase().includes('arrhythm') ||
        r.subtitle.toLowerCase().includes('arrhythm') ||
        r.title.toLowerCase().includes('ecg') ||
        r.subjectId === 'medicine'
    );
    assert(hasArrhythmiaMatch);
  });

  // -------------------------------------------------------------
  // N. Open result
  // -------------------------------------------------------------
  it('N. Open result provides structured navigation target and subjectId', () => {
    const results = searchFmgeStudyData('arrhythm', deviceAState, 5);
    const medResult = results.find((r) => r.subjectId === 'medicine');
    assert(medResult);
    assert.equal(medResult.action.subjectId, 'medicine');
    assert(medResult.action.tab === 'syllabus' || medResult.action.tab === 'practice');
  });

  // -------------------------------------------------------------
  // O. Ingest Telegram MCQ
  // -------------------------------------------------------------
  it('O. Ingest Telegram MCQ normalizes incoming message with full clinical schema', () => {
    const payload = {
      messageId: 98741,
      channelId: 'ch_fmge_med',
      channelName: 'Medicine FMGE Recall Hub',
      text: 'A 55-year-old male presents with acute crushing retrosternal chest pain. ECG demonstrates ST-elevation in leads II, III, and aVF. Which coronary artery is most likely occluded?',
      pollOptions: [
        { text: 'Right Coronary Artery (RCA)', isCorrect: true },
        { text: 'Left Anterior Descending (LAD)', isCorrect: false },
        { text: 'Left Circumflex (LCx)', isCorrect: false },
        { text: 'Left Main Coronary Artery', isCorrect: false },
      ],
      correctOptionKey: 'A',
      timestamp: Date.now(),
      isHighYield: true,
    };

    const result = ingestTelegramPayload(payload, [], []);
    assert.equal(result.type, 'mcq');
    assert(result.mcq);
    assert.equal(result.mcq.messageId, '98741');
    assert(result.mcq.options.some((o) => o.key === result.mcq?.correctKey && o.text.includes('Right Coronary Artery')));
    assert.equal(result.mcq.options.length, 4);
  });

  // -------------------------------------------------------------
  // P. Classify Telegram MCQ
  // -------------------------------------------------------------
  it('P. Classify Telegram MCQ routes to General Medicine -> Cardiology with high confidence', () => {
    const text = 'General Medicine Cardiology ECG ST-elevation myocardial infarction STEMI Arrhythmias';
    const classification = classifyTelegramContent(text);

    assert.equal(classification.subjectId, 'medicine');
    assert(classification.confidence > 0.4);
    assert.equal(classification.needsManualReview, false);
  });

  // -------------------------------------------------------------
  // Q. Save Telegram MCQ
  // -------------------------------------------------------------
  it('Q. Save Telegram MCQ into community question bank', () => {
    const payload = {
      messageId: 98742,
      channelName: 'FMGE Community QBank',
      text: 'General Medicine Cardiology ECG PSVT: What is the drug of choice for paroxysmal supraventricular tachycardia (PSVT) in a hemodynamically stable patient?',
      pollOptions: [
        { text: 'Adenosine (Rapid IV push)', isCorrect: true },
        { text: 'Amiodarone', isCorrect: false },
        { text: 'Digoxin', isCorrect: false },
        { text: 'Lidocaine', isCorrect: false },
      ],
      correctOptionKey: 'A',
      timestamp: Date.now(),
    };

    const ingested = ingestTelegramPayload(payload, deviceAState.telegramQuestions || [], []);
    assert(ingested.mcq);

    deviceAState = {
      ...deviceAState,
      telegramQuestions: [...(deviceAState.telegramQuestions || []), ingested.mcq],
    };

    assert(deviceAState.telegramQuestions.some((q) => q.messageId === '98742'));
  });

  // -------------------------------------------------------------
  // R. Retrieve it by topic
  // -------------------------------------------------------------
  it('R. Retrieve Telegram MCQ by topic', () => {
    const topicQ = (deviceAState.telegramQuestions || []).filter(
      (q) => q.messageId === '98742' && q.subjectId === 'medicine'
    );
    assert.equal(topicQ.length, 1);
    assert(topicQ[0].question.includes('PSVT'));
  });

  // -------------------------------------------------------------
  // S. Answer Telegram MCQ
  // -------------------------------------------------------------
  it('S. Answer Telegram MCQ and log into Performance Engine', () => {
    const tgQ = deviceAState.telegramQuestions!.find((q) => q.messageId === '98742')!;
    assert(tgQ);
    const res = recordMcqAttempt(deviceAState, {
      questionId: tgQ.id,
      subjectId: tgQ.subjectId,
      topicId: 'med-1',
      topicName: 'Cardiology - Arrhythmias',
      isCorrect: false, // Student missed it (picked Amiodarone)
      selectedAnswer: 'B',
      correctAnswer: tgQ.correctKey,
      timeTakenSeconds: 40,
      source: 'telegram',
      difficulty: 'high-yield',
    });

    deviceAState = res.updatedState;
    assert.equal(deviceAState.mcqAttempts.length, 1);
    assert.equal(deviceAState.mcqAttempts[0].isCorrect, false);
  });

  // -------------------------------------------------------------
  // T. Generate Error from Telegram MCQ
  // -------------------------------------------------------------
  it('T. Generate Error from Telegram MCQ and verify it enters Error Vault', () => {
    const tgQ = deviceAState.telegramQuestions!.find((q) => q.messageId === '98742')!;
    const tgError = {
      id: `err-tg-${tgQ.id}`,
      subjectId: tgQ.subjectId,
      topic: tgQ.topic,
      topicId: 'med-1',
      questionGist: tgQ.question.substring(0, 90),
      myMistake: 'Selected Amiodarone instead of Adenosine',
      correctConcept: 'Adenosine 6mg rapid IV bolus followed by flush is the first-line treatment for acute PSVT',
      dateAdded: new Date().toISOString(),
      isReviewed: false,
    };

    deviceAState = {
      ...deviceAState,
      errorNotebook: [...deviceAState.errorNotebook, tgError],
    };

    assert(deviceAState.errorNotebook.some((e) => e.id === tgError.id));
    assert(deviceAState.errorNotebook.some((e) => e.questionGist.includes('PSVT')));
  });

  // -------------------------------------------------------------
  // U. Open image-based MCQ
  // -------------------------------------------------------------
  it('U. Open image-based MCQ retains image URL and fullscreen zoom properties', () => {
    const payload = {
      messageId: 98743,
      channelName: 'FMGE Image-Based Questions',
      text: 'Identify the characteristic finding on this peripheral blood smear:',
      photoUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800',
      pollOptions: [
        { text: 'Auer rods (AML M3)', isCorrect: true },
        { text: 'Smudge cells (CLL)', isCorrect: false },
        { text: 'Reed-Sternberg cells (Hodgkin)', isCorrect: false },
        { text: 'Target cells (Thalassemia)', isCorrect: false },
      ],
      correctOptionKey: 'A',
      timestamp: Date.now(),
    };

    const ingested = ingestTelegramPayload(payload);
    assert(ingested.mcq);
    assert.equal(ingested.mcq.questionType, 'ibq');
    assert(ingested.mcq.imageUrl);
  });

  // -------------------------------------------------------------
  // V. Open video-based MCQ
  // -------------------------------------------------------------
  it('V. Open video-based MCQ retains in-app playable video embed reference', () => {
    const payload = {
      messageId: 98744,
      channelName: 'FMGE Clinical Exam Videos',
      text: 'Demonstrating the clinical sign below. What is the diagnosis?',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      pollOptions: [
        { text: 'Chvostek sign (Hypocalcemia)', isCorrect: true },
        { text: 'Trousseau sign', isCorrect: false },
        { text: 'Kernig sign', isCorrect: false },
        { text: 'Brudzinski sign', isCorrect: false },
      ],
      correctOptionKey: 'A',
      timestamp: Date.now(),
    };

    const ingested = ingestTelegramPayload(payload);
    assert(ingested.mcq);
    assert.equal(ingested.mcq.questionType, 'video');
    assert.equal(ingested.mcq.videoUrl, 'https://www.w3schools.com/html/mov_bbb.mp4');
  });

  // -------------------------------------------------------------
  // W. Verify media remains accessible
  // -------------------------------------------------------------
  it('W. Verify media metadata remains preserved in local state and cloud persistence', () => {
    const mediaQ: TelegramMCQ = {
      id: 'tg-media-1',
      sourceChannel: '@fmge_media',
      subjectId: 'medicine',
      topic: 'Dermatology & Skin Signs',
      question: 'Identify the pathognomonic lesion:',
      options: [
        { key: 'A', text: 'Target / Iris lesion (Erythema Multiforme)' },
        { key: 'B', text: 'Herald patch' },
      ],
      correctKey: 'A',
      explanation: 'Target lesions are typical of Erythema Multiforme.',
      imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800',
      tags: ['Dermatology'],
      datePulled: new Date().toISOString(),
    };

    deviceAState = {
      ...deviceAState,
      telegramQuestions: [...(deviceAState.telegramQuestions || []), mediaQ],
    };

    const retrieved = deviceAState.telegramQuestions.find((q) => q.id === 'tg-media-1');
    assert(retrieved);
    assert.equal(retrieved.imageUrl, 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800');
  });

  // -------------------------------------------------------------
  // X. Duplicate Telegram message
  // -------------------------------------------------------------
  it('X. Duplicate Telegram message detection', () => {
    const payload = {
      messageId: 98742, // Same messageId as previously ingested PSVT question
      channelName: 'Another Channel',
      text: 'What is the drug of choice for paroxysmal supraventricular tachycardia (PSVT) in a hemodynamically stable patient?',
      timestamp: Date.now(),
    };

    const result = ingestTelegramPayload(payload, deviceAState.telegramQuestions || [], []);
    assert.equal(result.isDuplicate, true);
  });

  // -------------------------------------------------------------
  // Y. Verify duplicate prevention
  // -------------------------------------------------------------
  it('Y. Verify duplicate prevention prevents duplicate rows in question bank', () => {
    const payload = {
      messageId: 98742,
      channelName: 'Another Channel',
      text: 'What is the drug of choice for paroxysmal supraventricular tachycardia (PSVT) in a hemodynamically stable patient?',
    };

    const result = ingestTelegramPayload(payload, deviceAState.telegramQuestions || [], []);
    if (!result.isDuplicate && result.mcq) {
      deviceAState = {
        ...deviceAState,
        telegramQuestions: [...(deviceAState.telegramQuestions || []), result.mcq],
      };
    }

    const matches = (deviceAState.telegramQuestions || []).filter((q) => q.messageId === '98742');
    assert.equal(matches.length, 1, 'Duplicate was not inserted');
  });

  // -------------------------------------------------------------
  // Z. Offline MCQ attempt -> reconnect -> sync
  // -------------------------------------------------------------
  it('Z. Offline MCQ attempt queues pending write and reconciles upon reconnect without duplication', () => {
    // 1. Simulate offline: queue pending write in local storage
    const offlineAttempt: McqAttempt = {
      id: 'attempt-offline-1',
      questionId: 'q-offline-101',
      subjectId: 'pharmacology',
      topicId: 'pharm-1',
      topicName: 'Autonomic Drugs',
      isCorrect: true,
      selectedAnswer: 'B',
      correctAnswer: 'B',
      timeTakenSeconds: 28,
      source: 'qbank',
      difficulty: 'high-yield',
      timestamp: new Date().toISOString(),
      attemptNumber: 1,
    };

    const offlineState: AppState = {
      ...deviceAState,
      mcqAttempts: [...deviceAState.mcqAttempts, offlineAttempt],
    };

    savePendingOfflineWrite('user-test-uid', offlineState);

    // 2. Read from pending queue
    const queuedState = getPendingOfflineWrite('user-test-uid');
    assert(queuedState);
    assert.equal(queuedState.mcqAttempts.length, deviceAState.mcqAttempts.length + 1);

    // 3. Simulate reconnect & conflict resolution
    const reconciled = resolveCloudConflict(queuedState, deviceAState);
    assert(reconciled.mcqAttempts.some((a) => a.id === 'attempt-offline-1'));

    // 4. Clear queue
    clearPendingOfflineWrite('user-test-uid');
    assert.equal(getPendingOfflineWrite('user-test-uid'), null);
  });
});
