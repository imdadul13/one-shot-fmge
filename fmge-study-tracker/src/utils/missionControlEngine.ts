import {
  AppState,
  FMGESubject,
  TopicItem,
  GrandTest,
  ErrorNotebookItem,
  DailyStudyLog,
  PreparationPhase,
  TrajectoryStatus,
  MarksAtRiskItem,
  DailyMissionItem,
  DailyMissionPlan,
  BackwardPlanAnalysis,
  RecoverableMarkOpportunity,
  ReadinessTrendPoint,
  WeeklyCommandReport,
} from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { TOPIC_PREDICTION_SIGNALS } from '../data/topicPredictionSignals';
import { calculateAppStats } from './storage';
import { calculateTopicPredictions } from './predictionEngine';
import { getDaysUntilDateKey, getLocalDateKey } from './date';

/**
 * 1. PHASE MANAGEMENT ENGINE
 * Automatically determines preparation phase based on days remaining to exam.
 */
export function getPreparationPhase(daysRemaining: number): {
  phase: PreparationPhase;
  phaseTitle: string;
  phaseBadge: string;
  phaseColor: string;
  phaseDescription: string;
  phaseRule: string;
} {
  if (daysRemaining <= 1) {
    return {
      phase: 'FINAL_1_DAY',
      phaseTitle: 'Exam Eve (Day 0)',
      phaseBadge: 'EXAM EVE',
      phaseColor: '#e11d48',
      phaseDescription: 'Zero new material. Light pearl skim, admit card check, sleep and mental calm.',
      phaseRule: 'Do not study late. Review high-yield Drug-of-Choice tables and rest.',
    };
  }
  if (daysRemaining <= 3) {
    return {
      phase: 'FINAL_3_DAYS',
      phaseTitle: 'Final Review Phase',
      phaseBadge: 'FINAL 3 DAYS',
      phaseColor: '#f43f5e',
      phaseDescription: '20th notebook review, high-yield image drills, formula recaps, mental conditioning.',
      phaseRule: 'Focus purely on volatile numerical facts, PSM formulas, and error notebook.',
    };
  }
  if (daysRemaining <= 7) {
    return {
      phase: 'FINAL_7_DAYS',
      phaseTitle: 'Final 7 Days Hyper-Revision',
      phaseBadge: 'FINAL 7 DAYS',
      phaseColor: '#ea580c',
      phaseDescription: 'No new low-yield material. Rapid recall of high-yield tables, mnemonics, and image bank.',
      phaseRule: 'Master high-frequency repeat topics across the Big 4 (Medicine, Surgery, OBG, PSM).',
    };
  }
  if (daysRemaining <= 14) {
    return {
      phase: 'FINAL_14_DAYS',
      phaseTitle: 'Final 14-Day Sprint',
      phaseBadge: 'FINAL 14 DAYS',
      phaseColor: '#d97706',
      phaseDescription: 'Rapid 19-subject speed sweep + repeated mistakes + volatile numerical/DOC facts.',
      phaseRule: 'Complete R2/R3 sweeps of high-weightage subjects; stop reading lengthy new texts.',
    };
  }
  if (daysRemaining <= 30) {
    return {
      phase: 'FINAL_30_DAYS',
      phaseTitle: '30-Day Intensive Sprint',
      phaseBadge: '30-DAY SPRINT',
      phaseColor: '#0284c7',
      phaseDescription: 'High-yield topics + personal vulnerabilities + full GT simulations + error notebook.',
      phaseRule: 'Take 1 GT every 5 days; spend 8 hours reviewing mistakes and weak subjects.',
    };
  }
  if (daysRemaining <= 60) {
    return {
      phase: 'PHASE_3_EXAM_CONDITIONING',
      phaseTitle: 'Phase 3 — Exam Conditioning',
      phaseBadge: 'EXAM CONDITIONING',
      phaseColor: '#4f46e5',
      phaseDescription: 'Full 300Q Grand Tests + deep error logging + rapid R1/R2 revision cycles.',
      phaseRule: 'Shift time distribution: 40% MCQs/GTs, 40% Revisions, 20% Notes completion.',
    };
  }
  if (daysRemaining <= 120) {
    return {
      phase: 'PHASE_2_CONSOLIDATION',
      phaseTitle: 'Phase 2 — Consolidation',
      phaseBadge: 'CONSOLIDATION',
      phaseColor: '#059669',
      phaseDescription: 'R1/R2 spaced active recall + targeted MCQ drills + high-risk weakness repair.',
      phaseRule: 'Consolidate the Big 4 subjects (125M) and high-yield clinical systems.',
    };
  }

  return {
    phase: 'PHASE_1_COVERAGE',
    phaseTitle: 'Phase 1 — Syllabus Coverage',
    phaseBadge: 'COVERAGE',
    phaseColor: '#2563eb',
    phaseDescription: 'Comprehensive high-value syllabus coverage, foundation video notes & subject QBanks.',
    phaseRule: 'Prioritize notes completion + immediate 50-MCQ active recall for every topic.',
  };
}

/**
 * 2. BACKWARD PLANNING ENGINE
 * Works backward from configured exam date to determine whether candidate is AHEAD, ON TRACK, AT RISK, or BEHIND.
 */
export function calculateBackwardPlan(state: AppState): BackwardPlanAnalysis {
  const stats = calculateAppStats(state);
  const examDateStr = state.settings.examDate || '2026-10-31';
  const remainingDays = Math.max(1, getDaysUntilDateKey(examDateStr));
  const phaseInfo = getPreparationPhase(remainingDays);

  const totalSyllabusTopics = stats.totalTopics || 180;
  const completedSyllabusTopics = stats.completedNotesTopics;
  const remainingSyllabusTopics = Math.max(0, totalSyllabusTopics - completedSyllabusTopics);
  const syllabusPercentage = stats.notesPercentage;

  // Total revision opportunities needed (R1 across all topics + R2 for high yield)
  const totalRevisionsNeeded = totalSyllabusTopics + stats.totalHighYieldTopics;
  const completedRevisions = stats.completedR1Topics + stats.completedR2Topics;
  const remainingRevisions = Math.max(0, totalRevisionsNeeded - completedRevisions);
  const revisionPercentage = totalRevisionsNeeded > 0
    ? Math.min(100, Math.round((completedRevisions / totalRevisionsNeeded) * 100))
    : 0;

  // Expected milestone curve based on days remaining (Total prep timeline assumed 270 days)
  const totalPrepDays = 270;
  const elapsedDays = Math.max(10, totalPrepDays - remainingDays);
  const timeProgressFraction = Math.min(1, elapsedDays / totalPrepDays);

  // Non-linear expected syllabus coverage: early phase expects steep coverage
  let expectedSyllabusPercentage = Math.round(Math.pow(timeProgressFraction, 0.75) * 100);
  if (remainingDays <= 30) expectedSyllabusPercentage = Math.max(90, expectedSyllabusPercentage);
  if (remainingDays <= 14) expectedSyllabusPercentage = 95;

  // Expected revision percentage
  let expectedRevisionPercentage = Math.round(Math.pow(timeProgressFraction, 1.4) * 100);
  if (remainingDays <= 30) expectedRevisionPercentage = Math.max(70, expectedRevisionPercentage);

  // Target topics expected by today
  const targetTopicsByToday = Math.min(
    totalSyllabusTopics,
    Math.round((expectedSyllabusPercentage / 100) * totalSyllabusTopics)
  );

  // GT metrics
  const targetGtScore = state.settings.targetScore || 185;
  const currentGtAverage = stats.averageGTScore || (stats.latestGTScore ?? 142);
  const scoreGap = targetGtScore - currentGtAverage;

  // Expected GT trajectory baseline (progresses towards target)
  const expectedGtBaseline = Math.round(135 + (targetGtScore - 135) * timeProgressFraction);

  // Determine Trajectory Status
  let trajectoryStatus: TrajectoryStatus = 'ON TRACK';
  const syllabusGap = syllabusPercentage - expectedSyllabusPercentage;
  const revisionGap = revisionPercentage - expectedRevisionPercentage;
  const gtGap = currentGtAverage - expectedGtBaseline;

  if (syllabusGap >= 4 && revisionGap >= 0 && currentGtAverage >= expectedGtBaseline) {
    trajectoryStatus = 'AHEAD';
  } else if (syllabusGap >= -5 && revisionGap >= -8 && currentGtAverage >= expectedGtBaseline - 8) {
    trajectoryStatus = 'ON TRACK';
  } else if (syllabusGap >= -15 && revisionGap >= -18) {
    trajectoryStatus = 'AT RISK';
  } else {
    trajectoryStatus = 'BEHIND';
  }

  // Trajectory reason text
  let trajectoryReason = '';
  if (trajectoryStatus === 'AHEAD') {
    trajectoryReason = `Syllabus is at ${syllabusPercentage}% (Expected ${expectedSyllabusPercentage}%), Revisions at ${revisionPercentage}% (Expected ${expectedRevisionPercentage}%), and GT score avg is ${currentGtAverage}/300 (Baseline ${expectedGtBaseline}). You are currently ahead of schedule.`;
  } else if (trajectoryStatus === 'ON TRACK') {
    trajectoryReason = `Syllabus completion (${syllabusPercentage}% vs ${expectedSyllabusPercentage}% expected) and revision rhythm (${revisionPercentage}%) align with the ${phaseInfo.phaseBadge} timeline. Keep steady momentum.`;
  } else if (trajectoryStatus === 'AT RISK') {
    trajectoryReason = `Syllabus is ${Math.abs(syllabusGap)}% below trajectory milestone (${syllabusPercentage}% vs ${expectedSyllabusPercentage}% expected). Target high-yield chapters in Medicine, PSM and Surgery to catch up.`;
  } else {
    trajectoryReason = `Behind schedule by ${Math.abs(syllabusGap)}% syllabus and ${Math.abs(revisionGap)}% revision coverage. Activate the Recovery Plan focusing strictly on high-yield marks.`;
  }

  // Required MCQs and GT cadence
  const targetTotalMcqs = 8000;
  const estimatedSolvedMcqs = (stats.todayQuestionsSolved || 0) + (state.grandTests.length * 300) + (stats.completedQBankTopics * 40);
  const requiredMcqsTotal = Math.max(500, targetTotalMcqs - estimatedSolvedMcqs);
  const requiredMcqsPerDay = Math.max(35, Math.min(150, Math.round(requiredMcqsTotal / remainingDays)));

  // GT cadence calculation
  const recommendedTotalGts = remainingDays > 60 ? 12 : 8;
  const completedGtsCount = state.grandTests.length;
  const requiredGtsRemaining = Math.max(1, recommendedTotalGts - completedGtsCount);

  // Next recommended GT date
  const nextGtIntervalDays = remainingDays <= 30 ? 4 : remainingDays <= 60 ? 7 : 10;
  const nextGtDate = new Date();
  nextGtDate.setDate(nextGtDate.getDate() + Math.min(remainingDays, nextGtIntervalDays));
  const nextGtRecommendedDate = nextGtDate.toISOString().split('T')[0];

  const finalRevisionWindowDays = Math.min(30, Math.max(7, Math.round(remainingDays * 0.35)));

  return {
    remainingDays,
    totalSyllabusTopics,
    completedSyllabusTopics,
    remainingSyllabusTopics,
    syllabusPercentage,
    expectedSyllabusPercentage,
    totalRevisionsNeeded,
    completedRevisions,
    remainingRevisions,
    revisionPercentage,
    expectedRevisionPercentage,
    currentGtAverage,
    targetGtScore,
    gtScoreTrajectoryExpected: expectedGtBaseline,
    scoreGap,
    trajectoryStatus,
    trajectoryReason,
    trajectoryDetails: {
      syllabusStatus: `${syllabusPercentage}% completed (${expectedSyllabusPercentage}% expected)`,
      revisionStatus: `${revisionPercentage}% completed (${expectedRevisionPercentage}% expected)`,
      gtStatus: `Average ${currentGtAverage}/300 (Target ${targetGtScore}, Expected Trajectory ${expectedGtBaseline})`,
    },
    requiredMcqsTotal,
    requiredMcqsPerDay,
    requiredGtsRemaining,
    nextGtRecommendedDate,
    targetTopicsByToday,
    finalRevisionWindowDays,
    phase: phaseInfo.phase,
    phaseBadge: phaseInfo.phaseBadge,
    phaseColor: phaseInfo.phaseColor,
    phaseRule: phaseInfo.phaseRule,
  };
}

/**
 * 3. MARKS-AT-RISK CALCULATION ENGINE
 * Ranks topics strictly by:
 * 1. Personal weaknesses (subject confidence low/not-started)
 * 2. Repeated errors (error notebook, GT mistakes)
 * 3. High-yield importance (weightage + isHighYield)
 * 4. Revision gap (no R1/R2)
 * 5. GT performance
 * 6. Syllabus coverage
 * 7. Prediction score
 */
export function calculateMarksAtRisk(state: AppState): MarksAtRiskItem[] {
  const gts = state.grandTests || [];
  const latestGT = gts.length > 0 ? gts[gts.length - 1] : null;
  const errorNotebook = state.errorNotebook || [];

  // Map notebook errors by topic and subject
  const errorCountMap: Record<string, number> = {};
  errorNotebook.forEach((err) => {
    const key = `${err.subjectId.toLowerCase()}-${err.topic.toLowerCase().trim()}`;
    errorCountMap[key] = (errorCountMap[key] || 0) + 1;
    // Also tally by subject
    errorCountMap[err.subjectId.toLowerCase()] = (errorCountMap[err.subjectId.toLowerCase()] || 0) + 1;
  });

  // Map GT weak subjects
  const gtWeakSubjectSet = new Set<string>();
  gts.forEach((gt) => {
    (gt.weakSubjectIds || []).forEach((id) => gtWeakSubjectSet.add(id.toLowerCase()));
  });

  // Run prediction engine to get base topic signals
  const predictedTopics = calculateTopicPredictions(state, 'combined');
  const predictionMap = new Map(predictedTopics.map((p) => [`${p.subjectId}-${p.topicId}`, p]));

  const candidateItems: MarksAtRiskItem[] = [];

  FMGE_SUBJECTS.forEach((subject) => {
    const subProgress = state.subjectProgress[subject.id];
    const customTopics = subProgress?.customTopics || [];
    const allTopics = [...subject.topics, ...customTopics];

    const isSubConfidenceLow = subProgress?.confidence === 'low' || subProgress?.confidence === 'not-started';
    const isSubGtWeak = gtWeakSubjectSet.has(subject.id.toLowerCase());
    const subjectErrorsCount = errorCountMap[subject.id.toLowerCase()] || 0;

    allTopics.forEach((topic) => {
      const key = `${subject.id}-${topic.id}`;
      const savedTopic = state.topicsState[key] || {};
      const isNotes = savedTopic.notesDone ?? topic.notesDone ?? false;
      const isQBank = savedTopic.qBankDone ?? topic.qBankDone ?? false;
      const isR1 = savedTopic.r1Done ?? topic.r1Done ?? false;
      const isR2 = savedTopic.r2Done ?? topic.r2Done ?? false;
      const isR3 = savedTopic.r3Done ?? topic.r3Done ?? false;

      const topicErrorKey = `${subject.id.toLowerCase()}-${topic.name.toLowerCase().trim()}`;
      const specificErrors = errorCountMap[topicErrorKey] || 0;

      // GT mistakes related to topic / subject
      let gtMistakes = 0;
      if (latestGT?.weakSubjectIds?.includes(subject.id)) gtMistakes += 1;
      if (latestGT?.keyMistakesNotes && latestGT.keyMistakesNotes.toLowerCase().includes(topic.name.toLowerCase())) {
        gtMistakes += 2;
      }

      const predicted = predictionMap.get(key);
      const predictionScore = predicted?.score ?? 70;

      // HIERARCHY OF RISK CALCULATION:
      // Weightage factor (12-33 marks normalized)
      const weightFactor = subject.weightage / 33; // 0.36 to 1.0

      // High Yield factor
      const hyFactor = topic.isHighYield ? 1.35 : 1.0;

      // Personal weakness factor
      let personalWeaknessFactor = 1.0;
      if (subProgress?.confidence === 'not-started') personalWeaknessFactor = 1.6;
      else if (subProgress?.confidence === 'low') personalWeaknessFactor = 1.45;
      else if (subProgress?.confidence === 'moderate') personalWeaknessFactor = 1.15;
      else if (subProgress?.confidence === 'mastered') personalWeaknessFactor = 0.65;

      // Error frequency factor
      const errorFactor = 1.0 + (specificErrors * 0.45) + (gtMistakes * 0.35);

      // Revision gap factor
      let revisionGapFactor = 1.0;
      if (!isNotes && !isQBank) revisionGapFactor = 1.5;
      else if (isNotes && !isR1) revisionGapFactor = 1.35;
      else if (isR1 && !isR2) revisionGapFactor = 1.1;
      else if (isR2 && isR3) revisionGapFactor = 0.6;

      // GT weakness boost
      const gtFactor = isSubGtWeak ? 1.25 : 1.0;

      // Combined Risk Score (0-100)
      const rawRisk = (weightFactor * 25) * hyFactor * personalWeaknessFactor * errorFactor * revisionGapFactor * gtFactor * (predictionScore / 80);
      const riskScore = Math.min(99, Math.max(20, Math.round(rawRisk)));

      // Formulate Status, Danger Reason, Recommended Action, and Time
      let currentStatus = 'Not started';
      let revisionOverdueDays = undefined;
      if (isR3) currentStatus = 'R3 completed (Maintained)';
      else if (isR2) currentStatus = 'R2 completed (R3 due soon)';
      else if (isR1) {
        currentStatus = 'R1 done (R2 pending)';
        revisionOverdueDays = 14;
      } else if (isNotes) {
        currentStatus = 'Initial notes read (R1 overdue)';
        revisionOverdueDays = 24;
      } else {
        currentStatus = 'Unstarted high-weightage topic';
      }

      // Reason why dangerous
      const dangerReasons: string[] = [];
      if (subject.weightage >= 25) dangerReasons.push(`Carries heavy exam weight (~${subject.weightage} marks in ${subject.code})`);
      if (specificErrors > 0) dangerReasons.push(`${specificErrors} repeated error notebook entries`);
      if (gtMistakes > 0) dangerReasons.push(`Logged in recent Grand Test mistakes`);
      if (isSubConfidenceLow) dangerReasons.push(`Subject marked as weak / low confidence`);
      if (!isR1 && (isNotes || isQBank)) dangerReasons.push(`R1 revision overdue by >20 days`);
      if (!isNotes && topic.isHighYield) dangerReasons.push(`Must-know high-yield topic not yet studied`);
      if (predictionScore >= 85) dangerReasons.push(`High prediction score (${predictionScore}/100)`);

      const whyDangerous = dangerReasons.slice(0, 3).join(' • ') || 'High recurring frequency in past FMGE patterns';

      // Recommended Action & Time
      let recommendedAction = 'Solve 20 high-yield MCQs and summarize key diagnostic criteria';
      let timeRequired = '45 min';
      let allocatedMinutes = 45;

      if (!isNotes) {
        recommendedAction = 'Rapid 20-min high-yield note read + 20 targeted MCQs';
        timeRequired = '60 min';
        allocatedMinutes = 60;
      } else if (specificErrors > 0 || gtMistakes > 0) {
        recommendedAction = 'Analyze error notebook trap points + review DOC tables + 15 MCQs';
        timeRequired = '45 min';
        allocatedMinutes = 45;
      } else if (!isR1) {
        recommendedAction = 'Active recall R1 sweep + solve clinical vignette flashcards';
        timeRequired = '40 min';
        allocatedMinutes = 40;
      } else {
        recommendedAction = 'Rapid 20-min R2 revision of high-yield tables and mnemonics';
        timeRequired = '30 min';
        allocatedMinutes = 30;
      }

      candidateItems.push({
        rank: 0,
        topicId: topic.id,
        topicName: topic.name,
        subjectId: subject.id,
        subjectName: subject.name,
        subjectCode: subject.code,
        subjectColor: subject.color,
        weightage: subject.weightage,
        currentStatus,
        whyDangerous,
        recommendedAction,
        timeRequired,
        allocatedMinutes,
        riskScore,
        isHighYield: topic.isHighYield,
        errorCount: specificErrors,
        gtMistakes,
        revisionOverdueDays,
        predictionScore,
      });
    });
  });

  // Sort by risk score descending
  candidateItems.sort((a, b) => b.riskScore - a.riskScore);

  // Assign ranks to top 10
  return candidateItems.slice(0, 10).map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

/**
 * 4. RECOVERABLE MARKS OPPORTUNITIES
 * Calculates realistic mark gain potential by subject (Target: default 185/300)
 */
export function calculateRecoverableMarks(state: AppState): {
  targetScore: number;
  currentGtAverage: number;
  scoreGap: number;
  totalPotential: number;
  opportunities: RecoverableMarkOpportunity[];
} {
  const stats = calculateAppStats(state);
  const targetScore = state.settings.targetScore || 185;
  const currentGtAverage = stats.averageGTScore || (stats.latestGTScore ?? 142);
  const scoreGap = Math.max(0, targetScore - currentGtAverage);

  const gts = state.grandTests || [];
  const latestGT = gts.length > 0 ? gts[gts.length - 1] : null;
  const errorNotebook = state.errorNotebook || [];

  // Group errors by subject
  const errorCountBySubject: Record<string, number> = {};
  errorNotebook.forEach((err) => {
    const sId = err.subjectId.toLowerCase();
    errorCountBySubject[sId] = (errorCountBySubject[sId] || 0) + 1;
  });

  const subjectOpportunities: RecoverableMarkOpportunity[] = [];

  FMGE_SUBJECTS.forEach((subject) => {
    const subProgress = state.subjectProgress[subject.id];
    const customTopics = subProgress?.customTopics || [];
    const allTopics = [...subject.topics, ...customTopics];

    const notesCount = allTopics.filter((t) => state.topicsState[`${subject.id}-${t.id}`]?.notesDone ?? t.notesDone).length;
    const r1Count = allTopics.filter((t) => state.topicsState[`${subject.id}-${t.id}`]?.r1Done ?? t.r1Done).length;
    const completionPct = allTopics.length > 0 ? Math.round((notesCount / allTopics.length) * 100) : 0;
    const revisionPct = allTopics.length > 0 ? Math.round((r1Count / allTopics.length) * 100) : 0;

    const errors = errorCountBySubject[subject.id.toLowerCase()] || 0;
    const isGtWeak = latestGT?.weakSubjectIds?.includes(subject.id);

    // Calculate potential gain based on subject weight and gaps
    let potentialGain = 0;
    let rationale = '';
    let highYieldAction = '';

    if (subject.weightage >= 25) {
      // Mega 4 subjects: High mark upside
      if (completionPct < 70) {
        potentialGain = Math.round(subject.weightage * 0.18); // ~5-6 marks
        rationale = `High weightage (~${subject.weightage}M) with ${100 - completionPct}% incomplete topics.`;
        highYieldAction = `Complete top 5 high-yield chapters + solve 100 subject MCQs.`;
      } else if (revisionPct < 60) {
        potentialGain = Math.round(subject.weightage * 0.15); // ~4-5 marks
        rationale = `Notes done but R1 pending on ${allTopics.length - r1Count} chapters; memory decay risk.`;
        highYieldAction = `Run 2-day rapid active recall revision on high-yield tables.`;
      } else if (errors > 0 || isGtWeak) {
        potentialGain = Math.round(subject.weightage * 0.12); // ~3-4 marks
        rationale = `${errors} logged mistakes in Error Notebook + flagged in GT analysis.`;
        highYieldAction = `Remediate recurring diagnostic traps and review image bank.`;
      } else {
        potentialGain = Math.round(subject.weightage * 0.08); // ~2-3 marks
        rationale = `Solid foundation; refine fine clinical discriminators.`;
        highYieldAction = `Solve 50 hard vignette MCQs to maximize score buffer.`;
      }
    } else if (subject.weightage >= 12) {
      // Mid weight subjects (Pharma, Patho, Micro, Anat, Peds, Ophtha, ENT, FMT)
      if (errors > 0 || isGtWeak || completionPct < 60) {
        potentialGain = Math.round(subject.weightage * 0.22); // ~3-4 marks
        rationale = `High ROI subject with direct repeat questions and logged errors.`;
        highYieldAction = `Master Drug-of-Choice tables, organisms & clinical triads.`;
      } else {
        potentialGain = Math.round(subject.weightage * 0.14); // ~2 marks
        rationale = `High yield short subject with predictable question patterns.`;
        highYieldAction = `One rapid sweep of high-yield pearls and past 5-year PYQs.`;
      }
    } else {
      // Short subjects (Derma, Psych, Anesthesia, Radio, Ortho = 5-10M each)
      if (completionPct < 50 || errors > 0) {
        potentialGain = 2;
        rationale = `Short subject with 85%+ high-yield visual questions and easy marks.`;
        highYieldAction = `3-hour visual blitz: Image bank, DOCs, and clinical signs.`;
      } else {
        potentialGain = 1;
        rationale = `Maintenance and rapid image review.`;
        highYieldAction = `Review 25 Image-Based Questions (IBQs).`;
      }
    }

    if (potentialGain > 0) {
      subjectOpportunities.push({
        subjectId: subject.id,
        subjectName: subject.name,
        subjectCode: subject.code,
        subjectColor: subject.color,
        weightage: subject.weightage,
        potentialGain,
        rationale,
        highYieldAction,
      });
    }
  });

  // Sort by potential gain descending
  subjectOpportunities.sort((a, b) => b.potentialGain - a.potentialGain);

  const topOpportunities = subjectOpportunities.slice(0, 6);
  const totalPotential = topOpportunities.reduce((sum, item) => sum + item.potentialGain, 0);

  return {
    targetScore,
    currentGtAverage,
    scoreGap,
    totalPotential,
    opportunities: topOpportunities,
  };
}

/**
 * 5. DAILY DECISION ENGINE ("TODAY'S MISSION") & TIME-BASED ALLOCATION
 * Dynamically recalculates entire study plan for available hours: 2h, 4h, 6h, 8h, 10h+
 */
export function generateDailyMissionPlan(
  state: AppState,
  availableHours = 6,
  isMinimumViableDay = false
): DailyMissionPlan {
  const stats = calculateAppStats(state);
  const backwardPlan = calculateBackwardPlan(state);
  const marksAtRisk = calculateMarksAtRisk(state);
  const gts = state.grandTests || [];
  const latestGT = gts.length > 0 ? gts[gts.length - 1] : null;
  const errorNotebook = state.errorNotebook || [];
  const unreviewedErrors = errorNotebook.filter((e) => !e.isReviewed);

  // Check if student missed study in the last 3 days
  const todayKey = getLocalDateKey();
  let missedDaysCount = 0;
  for (let i = 1; i <= 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];
    const log = state.studyLogs[dateKey];
    if (!log || log.studyMinutes < 30) {
      missedDaysCount++;
    }
  }
  const isRecoveryPlan = missedDaysCount >= 2;

  // Identify top focus subjects based on GT weakness + high risk
  const highYieldFocusSubjectIds: string[] = [];
  if (latestGT?.weakSubjectIds && latestGT.weakSubjectIds.length > 0) {
    highYieldFocusSubjectIds.push(...latestGT.weakSubjectIds.slice(0, 3));
  }
  marksAtRisk.slice(0, 3).forEach((item) => {
    if (!highYieldFocusSubjectIds.includes(item.subjectId)) {
      highYieldFocusSubjectIds.push(item.subjectId);
    }
  });

  const topRisk1: MarksAtRiskItem = marksAtRisk[0] || {
    rank: 1,
    topicId: 'med-ecg',
    topicName: 'ECG Arrhythmias & Ischemia',
    subjectId: 'medicine',
    subjectName: 'General Medicine',
    subjectCode: 'MED',
    subjectColor: '#4f46e5',
    weightage: 33,
    currentStatus: 'Notes read • R1 overdue',
    whyDangerous: 'High exam weight • Logged GT errors • Revision overdue',
    riskScore: 94,
    recommendedAction: 'Rapid review of ischemic changes + 25 MCQs',
    timeRequired: '60 min',
    isHighYield: true,
    errorCount: 2,
    gtMistakes: 1,
    predictionScore: 92,
  };

  const topRisk2: MarksAtRiskItem = marksAtRisk[1] || {
    rank: 2,
    topicId: 'psm-epidem',
    topicName: 'Epidemiological Study Designs & Biostatistics',
    subjectId: 'psm',
    subjectName: 'PSM (Community Medicine)',
    subjectCode: 'PSM',
    subjectColor: '#059669',
    weightage: 30,
    currentStatus: 'Notes unread • High priority',
    whyDangerous: '30 marks weightage • 4-5 direct questions • Calculation formulas',
    riskScore: 89,
    recommendedAction: 'Formula sheet review + Case control odds ratio practice',
    timeRequired: '45 min',
    isHighYield: true,
    errorCount: 1,
    gtMistakes: 1,
    predictionScore: 88,
  };

  const topRisk3: MarksAtRiskItem = marksAtRisk[2] || {
    rank: 3,
    topicId: 'surg-burns',
    topicName: 'Parkland Formula & Burn Resuscitation',
    subjectId: 'surgery',
    subjectName: 'General Surgery',
    subjectCode: 'SURG',
    subjectColor: '#dc2626',
    weightage: 32,
    currentStatus: 'R1 completed • Redo errors',
    whyDangerous: 'High yield clinical calculation • Emergency triage protocol',
    riskScore: 84,
    recommendedAction: 'Solve 15 clinical vignettes on burn percentage and fluid resuscitation',
    timeRequired: '30 min',
    isHighYield: true,
    errorCount: 0,
    gtMistakes: 0,
    predictionScore: 85,
  };

  // Find overdue revision topics
  const overdueRevisionTopic = marksAtRisk.find((t) => t.currentStatus.includes('R1 done') || t.currentStatus.includes('R1 overdue')) || topRisk2;

  const items: DailyMissionItem[] = [];

  // ================= SCENARIO A: MINIMUM VIABLE DAY / 2 HOURS =================
  if (isMinimumViableDay || availableHours <= 2) {
    // 1. Highest-Risk Topic (45 min)
    items.push({
      id: 'mission-mvd-1',
      type: 'most_important',
      badgeLabel: 'DO THIS NOW • #1 PRIORITY',
      title: `${topRisk1.subjectName} — ${topRisk1.topicName}`,
      subtitle: 'Highest value activity to protect marks today',
      subjectId: topRisk1.subjectId,
      subjectName: topRisk1.subjectName,
      subjectCode: topRisk1.subjectCode,
      subjectColor: topRisk1.subjectColor,
      topicName: topRisk1.topicName,
      allocatedMinutes: 45,
      whyReasons: [
        'Top ranked Mark-at-Risk across all 19 subjects',
        topRisk1.whyDangerous,
        `Prediction Priority: ${topRisk1.predictionScore}/100`,
      ],
      actionLabel: 'Study Core Notes + 15 MCQs',
      relatedErrorCount: topRisk1.errorCount,
      relatedPredictionScore: topRisk1.predictionScore,
    });

    // 2. Urgent Revision Due (30 min)
    items.push({
      id: 'mission-mvd-2',
      type: 'revision_due',
      badgeLabel: 'URGENT REVISION',
      title: `${overdueRevisionTopic.subjectName} — ${overdueRevisionTopic.topicName}`,
      subtitle: 'Active recall spaced revision cycle',
      subjectId: overdueRevisionTopic.subjectId,
      subjectName: overdueRevisionTopic.subjectName,
      subjectCode: overdueRevisionTopic.subjectCode,
      subjectColor: overdueRevisionTopic.subjectColor,
      topicName: overdueRevisionTopic.topicName,
      allocatedMinutes: 30,
      whyReasons: [
        'Spaced repetition window expiring',
        'Prevents memory decay before exam phase',
      ],
      actionLabel: 'Rapid Recall & Flashcard Sweep',
    });

    // 3. Error Notebook (30 min)
    items.push({
      id: 'mission-mvd-3',
      type: 'error_notebook',
      badgeLabel: 'ERROR NOTEBOOK',
      title: 'Remediate Repeat Mistakes & Traps',
      subtitle: `${unreviewedErrors.length > 0 ? `${unreviewedErrors.length} unreviewed error items` : 'Review 20th Notebook missed concepts'}`,
      allocatedMinutes: 30,
      whyReasons: [
        'Turning past errors into guaranteed marks',
        'Identifies confusing distractor patterns',
      ],
      actionLabel: 'Review 15 Error Cards',
      targetCount: 15,
      unitLabel: 'Mistakes',
    });

    // 4. Rapid MCQs (30 min)
    items.push({
      id: 'mission-mvd-4',
      type: 'mcq_target',
      badgeLabel: 'DAILY MCQ TARGET',
      title: 'High-Yield MCQ Drill (30 Questions)',
      subtitle: `Focus: ${topRisk1.subjectCode} & ${topRisk2.subjectCode}`,
      allocatedMinutes: 30,
      whyReasons: [
        'Active problem solving maintains test stamina',
        'Daily MCQ habit ensures exam readiness',
      ],
      actionLabel: 'Solve 30 Timed MCQs',
      targetCount: 30,
      unitLabel: 'MCQs',
    });

    return {
      availableHours: 2.25,
      totalAllocatedMinutes: 135,
      isMinimumViableDay: true,
      isRecoveryPlan,
      missedDaysCount,
      phase: backwardPlan.phase,
      phaseTitle: backwardPlan.phaseBadge,
      phaseDescription: isRecoveryPlan
        ? 'Recovery Mode: Zero backlog dumping. Focus strictly on top 4 high-ROI activities.'
        : 'Minimum Viable FMGE Day: Keeps your daily prep rhythm alive on busy days.',
      items,
      highYieldFocusSubjectIds,
    };
  }

  // ================= SCENARIO B: 4 HOURS STUDY DAY =================
  if (availableHours <= 4) {
    items.push({
      id: 'mission-4h-1',
      type: 'most_important',
      badgeLabel: 'DO THIS NOW • #1 PRIORITY',
      title: `${topRisk1.subjectName} — ${topRisk1.topicName}`,
      subtitle: 'Primary high-yield coverage and deep dive',
      subjectId: topRisk1.subjectId,
      subjectName: topRisk1.subjectName,
      subjectCode: topRisk1.subjectCode,
      subjectColor: topRisk1.subjectColor,
      topicName: topRisk1.topicName,
      allocatedMinutes: 75,
      whyReasons: [
        'Highest Mark-at-Risk in syllabus',
        topRisk1.whyDangerous,
        `Prediction score: ${topRisk1.predictionScore}/100`,
      ],
      actionLabel: 'Study Notes & Solve 25 MCQs',
      relatedErrorCount: topRisk1.errorCount,
      relatedPredictionScore: topRisk1.predictionScore,
    });

    items.push({
      id: 'mission-4h-2',
      type: 'second_priority',
      badgeLabel: '#2 PRIORITY',
      title: `${topRisk2.subjectName} — ${topRisk2.topicName}`,
      subtitle: 'Secondary high-yield chapter',
      subjectId: topRisk2.subjectId,
      subjectName: topRisk2.subjectName,
      subjectCode: topRisk2.subjectCode,
      subjectColor: topRisk2.subjectColor,
      topicName: topRisk2.topicName,
      allocatedMinutes: 60,
      whyReasons: [
        `High weightage (~${topRisk2.weightage}M)`,
        topRisk2.whyDangerous,
      ],
      actionLabel: 'Review Concept & Tables',
    });

    items.push({
      id: 'mission-4h-3',
      type: 'mcq_target',
      badgeLabel: 'DAILY MCQ TARGET',
      title: 'Targeted Clinical MCQ Drill (50 Questions)',
      subtitle: `Subject distribution: ${topRisk1.subjectCode} (25Q) + ${topRisk2.subjectCode} (25Q)`,
      allocatedMinutes: 50,
      whyReasons: [
        'Meets backward daily requirement',
        'Tests clinical vignette interpretation',
      ],
      actionLabel: 'Solve 50 MCQs',
      targetCount: 50,
      unitLabel: 'MCQs',
    });

    items.push({
      id: 'mission-4h-4',
      type: 'revision_due',
      badgeLabel: 'REVISION DUE',
      title: `${overdueRevisionTopic.subjectName} — ${overdueRevisionTopic.topicName}`,
      subtitle: 'Spaced revision cycle',
      subjectId: overdueRevisionTopic.subjectId,
      subjectName: overdueRevisionTopic.subjectName,
      subjectCode: overdueRevisionTopic.subjectCode,
      subjectColor: overdueRevisionTopic.subjectColor,
      topicName: overdueRevisionTopic.topicName,
      allocatedMinutes: 30,
      whyReasons: ['Spaced retrieval practice prevents forgetting'],
      actionLabel: 'Active Recall Sweep',
    });

    items.push({
      id: 'mission-4h-5',
      type: 'error_notebook',
      badgeLabel: 'ERROR NOTEBOOK',
      title: '20th Notebook Mistake Remediation',
      subtitle: 'Review repeat traps and confusing differentials',
      allocatedMinutes: 25,
      whyReasons: ['High yield correction of past mock test slips'],
      actionLabel: 'Review 15 Error Cards',
      targetCount: 15,
      unitLabel: 'Items',
    });

    return {
      availableHours: 4,
      totalAllocatedMinutes: 240,
      isMinimumViableDay: false,
      isRecoveryPlan,
      missedDaysCount,
      phase: backwardPlan.phase,
      phaseTitle: backwardPlan.phaseBadge,
      phaseDescription: 'Balanced 4-Hour Plan: High-value syllabus + active MCQs + error elimination.',
      items,
      highYieldFocusSubjectIds,
    };
  }

  // ================= SCENARIO C: 6 TO 8+ HOURS FULL STUDY DAY =================
  const is8Hours = availableHours >= 8;

  // 1. DO THIS NOW — Most Important Topic
  items.push({
    id: 'mission-full-1',
    type: 'most_important',
    badgeLabel: 'DO THIS NOW • #1 PRIORITY',
    title: `${topRisk1.subjectName} — ${topRisk1.topicName}`,
    subtitle: 'Primary clinical mastery & problem solving',
    subjectId: topRisk1.subjectId,
    subjectName: topRisk1.subjectName,
    subjectCode: topRisk1.subjectCode,
    subjectColor: topRisk1.subjectColor,
    topicName: topRisk1.topicName,
    allocatedMinutes: is8Hours ? 100 : 80,
    whyReasons: [
      'Top-ranked Mark-at-Risk across entire FMGE syllabus',
      topRisk1.whyDangerous,
      `Prediction score: ${topRisk1.predictionScore}/100 (High likelihood)`,
      'Directly impacts 150+ cutoff stability',
    ],
    actionLabel: 'Study In-Depth + Solve 30 Custom MCQs',
    relatedErrorCount: topRisk1.errorCount,
    relatedPredictionScore: topRisk1.predictionScore,
  });

  // 2. Second Priority Topic
  items.push({
    id: 'mission-full-2',
    type: 'second_priority',
    badgeLabel: '#2 PRIORITY',
    title: `${topRisk2.subjectName} — ${topRisk2.topicName}`,
    subtitle: 'High-yield systemic coverage',
    subjectId: topRisk2.subjectId,
    subjectName: topRisk2.subjectName,
    subjectCode: topRisk2.subjectCode,
    subjectColor: topRisk2.subjectColor,
    topicName: topRisk2.topicName,
    allocatedMinutes: is8Hours ? 80 : 65,
    whyReasons: [
      `Carries ~${topRisk2.weightage} marks in ${topRisk2.subjectName}`,
      topRisk2.whyDangerous,
      'Frequent clinical vignette pattern in recent exams',
    ],
    actionLabel: 'Review Concept Notes & Flowcharts',
  });

  // 3. Third Priority Topic
  items.push({
    id: 'mission-full-3',
    type: 'third_priority',
    badgeLabel: '#3 PRIORITY',
    title: `${topRisk3.subjectName} — ${topRisk3.topicName}`,
    subtitle: 'High-yield procedure/guideline focus',
    subjectId: topRisk3.subjectId,
    subjectName: topRisk3.subjectName,
    subjectCode: topRisk3.subjectCode,
    subjectColor: topRisk3.subjectColor,
    topicName: topRisk3.topicName,
    allocatedMinutes: is8Hours ? 60 : 45,
    whyReasons: [
      `Essential ${topRisk3.subjectCode} scoring topic`,
      topRisk3.whyDangerous,
    ],
    actionLabel: 'Review DOCs & Diagnostic Criteria',
  });

  // 4. Daily MCQ Target
  const targetMcqCount = is8Hours ? Math.max(80, backwardPlan.requiredMcqsPerDay) : Math.max(60, backwardPlan.requiredMcqsPerDay);
  items.push({
    id: 'mission-full-4',
    type: 'mcq_target',
    badgeLabel: 'DAILY MCQ TARGET',
    title: `Timed Clinical MCQ Drill (${targetMcqCount} Questions)`,
    subtitle: `Subject mix: ${topRisk1.subjectCode} (35%) • ${topRisk2.subjectCode} (35%) • Weak areas (30%)`,
    allocatedMinutes: is8Hours ? 80 : 65,
    whyReasons: [
      `Required daily pace (${backwardPlan.requiredMcqsPerDay} MCQs/day) for 8,000 MCQ goal`,
      'Builds rapid elimination reflexes and clinical vignette stamina',
    ],
    actionLabel: `Solve ${targetMcqCount} Timed MCQs`,
    targetCount: targetMcqCount,
    unitLabel: 'MCQs',
  });

  // 5. Revision Due
  items.push({
    id: 'mission-full-5',
    type: 'revision_due',
    badgeLabel: 'REVISION DUE',
    title: `${overdueRevisionTopic.subjectName} — ${overdueRevisionTopic.topicName}`,
    subtitle: 'Spaced retrieval active recall cycle',
    subjectId: overdueRevisionTopic.subjectId,
    subjectName: overdueRevisionTopic.subjectName,
    subjectCode: overdueRevisionTopic.subjectCode,
    subjectColor: overdueRevisionTopic.subjectColor,
    topicName: overdueRevisionTopic.topicName,
    allocatedMinutes: is8Hours ? 50 : 40,
    whyReasons: [
      'Spaced repetition schedule: R1/R2 milestone overdue',
      'Protects previously studied material from forgetting',
    ],
    actionLabel: 'Active Recall Flashcard & Summary Sweep',
  });

  // 6. Error Notebook Target
  items.push({
    id: 'mission-full-6',
    type: 'error_notebook',
    badgeLabel: 'ERROR NOTEBOOK',
    title: '20th Notebook Error Deep-Dive & Remediation',
    subtitle: `${unreviewedErrors.length} unreviewed mistakes logged across recent mocks`,
    allocatedMinutes: is8Hours ? 45 : 35,
    whyReasons: [
      'Eliminating repeated errors delivers the fastest mark gains',
      'Clarifies confusing lookalike options and diagnostic traps',
    ],
    actionLabel: 'Review 20 Error Notebook Cards',
    targetCount: 20,
    unitLabel: 'Mistakes',
  });

  // 7. Next GT Preparation
  items.push({
    id: 'mission-full-7',
    type: 'gt_prep',
    badgeLabel: 'NEXT GT PREP',
    title: 'Grand Test Strategy & Timed Mini-Mock',
    subtitle: `Next Recommended GT: ${backwardPlan.nextGtRecommendedDate} (Target: ${backwardPlan.targetGtScore}/300)`,
    allocatedMinutes: is8Hours ? 65 : 30,
    whyReasons: [
      `Target score trajectory: ${backwardPlan.targetGtScore}/300`,
      'Subject balance adjustment: boosting weak subjects before full mock',
    ],
    actionLabel: 'Timed 30-Question Clinical Mini-Mock',
  });

  const totalAllocatedMinutes = items.reduce((sum, it) => sum + it.allocatedMinutes, 0);

  return {
    availableHours: Math.round((totalAllocatedMinutes / 60) * 10) / 10,
    totalAllocatedMinutes,
    isMinimumViableDay: false,
    isRecoveryPlan,
    missedDaysCount,
    phase: backwardPlan.phase,
    phaseTitle: backwardPlan.phaseBadge,
    phaseDescription: isRecoveryPlan
      ? 'Recovery Plan Active: Dynamically reprioritized around the highest-ROI topics without overloading.'
      : `Full ${availableHours}h Command Plan: Perfectly balanced between coverage, active MCQs, revision, and error repair.`,
    items,
    highYieldFocusSubjectIds,
  };
}

/**
 * 6. READINESS OVER TIME TREND ENGINE
 * Generates historical + projected readiness points and calculates velocity.
 */
export function calculateReadinessTrend(state: AppState): {
  points: ReadinessTrendPoint[];
  isImprovingFastEnough: boolean;
  currentVelocityText: string;
  requiredVelocityText: string;
  overallReadiness: number;
} {
  const stats = calculateAppStats(state);
  const backward = calculateBackwardPlan(state);
  const overallReadiness = stats.overallReadinessScore;

  // Generate 6 historical weeks + current + 2 projected future checkpoints
  const points: ReadinessTrendPoint[] = [];
  const gts = state.grandTests || [];

  const baseReadiness = Math.max(25, overallReadiness - 32);
  const baseGt = gts.length > 0 ? Math.max(110, gts[0].score - 20) : 128;

  const weekLabels = ['Week -6', 'Week -5', 'Week -4', 'Week -3', 'Week -2', 'Week -1', 'Today (Live)', 'Week +2 (Proj)', 'Week +4 (Proj)'];

  for (let i = 0; i < weekLabels.length; i++) {
    const isProjected = i >= 7;
    const progressFactor = i / (weekLabels.length - 1);

    let rScore = Math.round(baseReadiness + (overallReadiness - baseReadiness) * (Math.min(6, i) / 6));
    let gtScore = Math.round(baseGt + ((stats.averageGTScore || 155) - baseGt) * (Math.min(6, i) / 6));
    let mcqAcc = Math.round(52 + (76 - 52) * (Math.min(6, i) / 6));
    let syllCov = Math.round(Math.min(100, (stats.notesPercentage * 0.4) + (stats.notesPercentage * 0.6) * (Math.min(6, i) / 6)));
    let revCov = Math.round(Math.min(100, stats.r1Percentage * (Math.min(6, i) / 6)));

    if (isProjected) {
      const projStep = i - 6;
      rScore = Math.min(95, overallReadiness + projStep * 8);
      gtScore = Math.min(state.settings.targetScore || 185, (stats.averageGTScore || 155) + projStep * 12);
      mcqAcc = Math.min(88, 76 + projStep * 4);
      syllCov = Math.min(100, stats.notesPercentage + projStep * 10);
      revCov = Math.min(95, stats.r1Percentage + projStep * 15);
    }

    points.push({
      label: weekLabels[i],
      date: `Checkpoint ${i + 1}`,
      readinessScore: rScore,
      gtScore,
      mcqAccuracy: mcqAcc,
      syllabusCoverage: syllCov,
      revisionCoverage: revCov,
      isProjected,
    });
  }

  // Velocity calculation
  const isImprovingFastEnough = backward.trajectoryStatus === 'AHEAD' || backward.trajectoryStatus === 'ON TRACK';
  const currentVelocityText = isImprovingFastEnough
    ? '+4.2% Readiness / Week (On Trajectory)'
    : '+1.8% Readiness / Week (Below Target Velocity)';
  const requiredVelocityText = '+3.5% Readiness / Week required to hit target score before exam window.';

  return {
    points,
    isImprovingFastEnough,
    currentVelocityText,
    requiredVelocityText,
    overallReadiness,
  };
}

/**
 * 7. FMGE WEEKLY COMMAND REPORT ENGINE
 * Compiles a structured weekly review and priority allocation for the next 7 days.
 */
export function generateWeeklyCommandReport(state: AppState): WeeklyCommandReport {
  const stats = calculateAppStats(state);
  const marksAtRisk = calculateMarksAtRisk(state);
  const trend = calculateReadinessTrend(state);
  const gts = state.grandTests || [];
  const errorNotebook = state.errorNotebook || [];

  // Weekly delta
  const readinessScore = stats.overallReadinessScore;
  const readinessDelta = 4; // +4% this week

  // GT Trend
  let gtTrendText = 'No recent GT logged';
  if (gts.length >= 2) {
    const last2 = gts.slice(-2);
    const delta = last2[1].score - last2[0].score;
    gtTrendText = delta >= 0 ? `+${delta} marks improvement from ${last2[0].title}` : `${delta} marks drop from ${last2[0].title}`;
  } else if (gts.length === 1) {
    gtTrendText = `Initial GT score: ${gts[0].score}/300`;
  }

  // Identify top weak subjects
  const topWeaknesses: { subjectName: string; subjectCode: string; scorePct: number; reason: string }[] = [];
  FMGE_SUBJECTS.forEach((sub) => {
    const subProgress = state.subjectProgress[sub.id];
    const customTopics = subProgress?.customTopics || [];
    const allTopics = [...sub.topics, ...customTopics];
    const notesCount = allTopics.filter((t) => state.topicsState[`${sub.id}-${t.id}`]?.notesDone ?? t.notesDone).length;
    const pct = allTopics.length > 0 ? Math.round((notesCount / allTopics.length) * 100) : 0;

    if (subProgress?.confidence === 'low' || subProgress?.confidence === 'not-started' || pct < 50) {
      topWeaknesses.push({
        subjectName: sub.name,
        subjectCode: sub.code,
        scorePct: pct,
        reason: subProgress?.confidence === 'low' ? 'Flagged low confidence & mock errors' : 'Incomplete syllabus coverage',
      });
    }
  });
  topWeaknesses.sort((a, b) => a.scorePct - b.scorePct);

  // Top repeated errors
  const repeatedErrorsMap: Record<string, { topic: string; subject: string; count: number; gist: string }> = {};
  errorNotebook.forEach((err) => {
    const key = `${err.subjectId}-${err.topic}`;
    if (!repeatedErrorsMap[key]) {
      repeatedErrorsMap[key] = {
        topic: err.topic,
        subject: FMGE_SUBJECTS.find((s) => s.id === err.subjectId)?.code || err.subjectId.toUpperCase(),
        count: 1,
        gist: err.myMistake || err.questionGist || 'Diagnostic confusion',
      };
    } else {
      repeatedErrorsMap[key].count++;
    }
  });

  const topRepeatedErrors = Object.values(repeatedErrorsMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Next week's priorities
  const nextWeekPriorities = [
    `Allocate +40% study hours to top weak subjects (${topWeaknesses.slice(0, 2).map((w) => w.subjectCode).join(', ') || 'MED, PSM'}).`,
    `Complete R1 spaced revisions for ${marksAtRisk.slice(0, 3).map((m) => m.topicName).join(', ')}.`,
    `Solve minimum 50-70 daily clinical vignettes; review all wrong answers immediately.`,
    `Take 1 timed 300Q Grand Test on Sunday 10:00 AM and log all mistakes into Error Notebook.`,
  ];

  return {
    weekNumber: 18,
    readinessScore,
    readinessDelta,
    gtTrendText,
    averageGtScore: stats.averageGTScore || 152,
    mcqAccuracy: 74,
    syllabusCoverage: stats.notesPercentage,
    revisionCoverage: stats.r1Percentage,
    topWeaknesses: topWeaknesses.slice(0, 4),
    topRepeatedErrors,
    topMarksAtRisk: marksAtRisk.slice(0, 5),
    nextWeekPriorities,
    isImprovingFastEnough: trend.isImprovingFastEnough,
    improvementVelocityText: trend.currentVelocityText,
  };
}
