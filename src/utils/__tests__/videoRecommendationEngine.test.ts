import { getInitialAppState } from '../../data/sampleData';
import {
  identifyCandidateTopics,
  getCuratedVideosForTopic,
  recordVideoView,
  rateVideoInteraction,
  buildTopicSearchQueries,
  isRelevantMedicalVideo,
  CURATED_MEDICAL_VIDEOS,
} from '../videoRecommendationEngine';
import { recordMcqAttempt } from '../performanceEngine';
import { GrandTest } from '../../types';

function runVideoEngineTests() {
  console.log('=== RUNNING RIGOROUS VIDEO RECOMMENDATION ENGINE TESTS ===');
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

  // =========================================================================
  // TEST SUITE A: 5 TARGET MEDICAL TOPICS VALIDATION
  // =========================================================================
  const targetTopics = [
    {
      subjectId: 'anatomy',
      subjectName: 'Anatomy',
      topicId: 'anat-4',
      topicName: 'Lower Limb - Knee Joint & Nerve Lesions (Peroneal/Tibial)',
      expectedKeywords: ['knee', 'nerve', 'lesions'],
    },
    {
      subjectId: 'medicine',
      subjectName: 'Medicine',
      topicId: 'med-1',
      topicName: 'Cardiology (ECG, MI, Arrhythmias, Heart Failure)',
      expectedKeywords: ['cardiology', 'ecg', 'arrhythmias'],
    },
    {
      subjectId: 'pharmacology',
      subjectName: 'Pharmacology',
      topicId: 'pharm-1',
      topicName: 'Autonomic Nervous System Drugs',
      expectedKeywords: ['autonomic', 'nervous', 'drugs'],
    },
    {
      subjectId: 'pathology',
      subjectName: 'Pathology',
      topicId: 'path-4',
      topicName: 'Neoplasia - Hallmarks, Oncogenes & Tumor Markers',
      expectedKeywords: ['neoplasia', 'oncogenes', 'tumor'],
    },
    {
      subjectId: 'obg',
      subjectName: 'Obstetrics & Gynecology',
      topicId: 'obg-2',
      topicName: 'Pre-eclampsia, Eclampsia & MgSO4 Pritchard Regimen',
      expectedKeywords: ['eclampsia', 'pritchard', 'regimen'],
    },
  ];

  console.log('\n--- 1. Testing 5 Specific FMGE Topics ---');
  for (const t of targetTopics) {
    // 1. Check search queries
    const queries = buildTopicSearchQueries(t.subjectName, t.topicName);
    assert(queries.length >= 3, `Topic [${t.topicName}] generated ${queries.length} search queries`);
    assert(
      queries.some((q) => q.toLowerCase().includes(t.subjectName.toLowerCase())),
      `Query for [${t.topicName}] includes subject name "${t.subjectName}"`
    );
    assert(
      !queries.some((q) => q.toLowerCase().includes('generic') || q.toLowerCase().includes('all subjects')),
      `Query for [${t.topicName}] is strictly specific and not generic`
    );

    // 2. Check curated videos mapping strictly
    const videos = getCuratedVideosForTopic(t.subjectId, t.topicId);
    assert(videos.length > 0, `Found verified curated videos for [${t.topicName}]`);
    for (const v of videos) {
      assert(v.subjectId === t.subjectId, `Video "${v.title}" subjectId matches strictly (${v.subjectId})`);
      assert(v.topicId === t.topicId, `Video "${v.title}" topicId matches strictly (${v.topicId})`);
      assert(Boolean(v.youtubeUrl && v.youtubeUrl.includes('youtube.com/watch?v=')), `Video "${v.title}" has valid youtubeUrl`);
      assert(Boolean(v.embedUrl && v.embedUrl.includes('youtube.com/embed/')), `Video "${v.title}" has valid embedUrl`);
      assert(Boolean(v.id && !v.id.includes(' ')), `Video ID is valid format (${v.id})`);
      assert(Boolean(v.channelName), `Video channel name is present (${v.channelName})`);

      // Check relevance
      const isRel = isRelevantMedicalVideo(v, t.subjectName, t.topicName);
      assert(isRel, `Video "${v.title}" passed strict topic relevance check for ${t.topicName}`);
    }

    // 3. Verify NO cross-subject video leakage
    const otherVideos = CURATED_MEDICAL_VIDEOS.filter((v) => v.subjectId !== t.subjectId);
    for (const ov of otherVideos) {
      const leaked = getCuratedVideosForTopic(t.subjectId, t.topicId).some((v) => v.id === ov.id);
      assert(!leaked, `No leak: "${ov.title}" from (${ov.subjectId}) never returned for (${t.subjectId})`);
    }
  }

  // =========================================================================
  // TEST SUITE B: CANDIDATE IDENTIFICATION & PERFORMANCE SCORING
  // =========================================================================
  console.log('\n--- 2. Performance Scoring & Weak Topic Prioritization ---');
  let state = getInitialAppState();

  // Test: Anatomy Knee Joint failure prioritizes Anatomy Knee Joint
  for (let i = 0; i < 3; i++) {
    const res = recordMcqAttempt(state, {
      questionId: 'q-anat-peroneal',
      subjectId: 'anatomy',
      topicId: 'anat-4',
      topicName: 'Lower Limb - Knee Joint & Nerve Lesions (Peroneal/Tibial)',
      isCorrect: false,
      selectedAnswer: 'C',
      correctAnswer: 'A',
      timeTakenSeconds: 45,
      source: 'qbank',
    });
    state = res.updatedState;
  }

  const candidatesAfterErrors = identifyCandidateTopics(state);
  const topCandidate = candidatesAfterErrors[0];
  assert(topCandidate.subjectId === 'anatomy' && topCandidate.topicId === 'anat-4',
    'Anatomy Knee Joint & Nerve Lesions ranked #1 after student mistakes');
  assert(topCandidate.accuracy === 0, 'Accuracy calculated as 0%');
  assert(topCandidate.repeatedErrorsCount === 1, '1 repeated error detected');
  assert(topCandidate.recommendationScore >= 70, 'Recommendation score elevated >= 70');

  // Verify changing active candidate changes video recommendations
  const anatVideos = getCuratedVideosForTopic('anatomy', 'anat-4');
  const pharmVideos = getCuratedVideosForTopic('pharmacology', 'pharm-1');
  assert(anatVideos[0].id !== pharmVideos[0].id, 'Switching candidate topic returns completely different video');
  assert(!anatVideos.some((v) => v.title.includes('Autonomic')), 'Anatomy videos do not include Pharmacology titles');
  assert(!pharmVideos.some((v) => v.title.includes('Knee')), 'Pharmacology videos do not include Knee Joint titles');

  // =========================================================================
  // TEST SUITE C: USER INTERACTION & UNHELPFUL FEEDBACK PENALTY
  // =========================================================================
  console.log('\n--- 3. Video Interactions & Feedback Demotion ---');
  // Record view
  state = recordVideoView(state, '3B3g6W4d5J4', 'anatomy', 'anat-4', 'Lower Limb');
  assert(state.videoInteractions?.length === 1, 'Video view recorded');
  assert(state.videoInteractions?.[0].openedCount === 1, 'Opened count is 1');

  // Rate not helpful
  state = rateVideoInteraction(state, '3B3g6W4d5J4', 'not_helpful', 'anatomy', 'anat-4');
  assert(state.videoInteractions?.[0].userRating === 'not_helpful', 'User rating is not_helpful');

  const afterFeedbackCandidates = identifyCandidateTopics(state);
  const demotedAnat = afterFeedbackCandidates.find((c) => c.subjectId === 'anatomy' && c.topicId === 'anat-4');
  assert(
    (demotedAnat?.recommendationScore || 0) < topCandidate.recommendationScore,
    'Topic score demoted after unhelpful feedback'
  );

  console.log(`\n================================================`);
  console.log(`ALL TESTS COMPLETED: ${passed} passed, ${failed} failed.`);
  console.log(`================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runVideoEngineTests();
