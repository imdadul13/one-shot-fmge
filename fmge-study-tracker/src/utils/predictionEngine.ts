import {
  AppState,
  FMGESubject,
  TopicItem,
  PredictedTopicItem,
  PredictionLevel,
  PredictionMode,
  PredictionWeights,
  PredictionSignalBreakdown,
  TopicPrepStatus,
  SubjectRiskSummary,
} from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { TOPIC_PREDICTION_SIGNALS, TopicSignalData } from '../data/topicPredictionSignals';

// Default initial configurable weights
export const DEFAULT_PREDICTION_WEIGHTS: Record<PredictionMode, PredictionWeights> = {
  combined: {
    priorityScore: 0.20,
    subjectWeight: 0.15,
    highYieldSignal: 0.15,
    clinicalVignettePotential: 0.10,
    imageBasedPotential: 0.05,
    docPotential: 0.10,
    userErrorSignal: 0.10,
    revisionGap: 0.10,
    telegramRecurrence: 0.05,
  },
  exam: {
    priorityScore: 0.10,
    subjectWeight: 0.25,
    highYieldSignal: 0.25,
    clinicalVignettePotential: 0.15,
    imageBasedPotential: 0.10,
    docPotential: 0.15,
    userErrorSignal: 0.00,
    revisionGap: 0.00,
    telegramRecurrence: 0.00,
  },
  personal: {
    priorityScore: 0.10,
    subjectWeight: 0.05,
    highYieldSignal: 0.10,
    clinicalVignettePotential: 0.05,
    imageBasedPotential: 0.05,
    docPotential: 0.05,
    userErrorSignal: 0.35,
    revisionGap: 0.20,
    telegramRecurrence: 0.05,
  },
};

/**
 * Computes prediction level category and color indicators based on 0-100 score
 */
export function getPredictionLevel(score: number): { level: PredictionLevel; label: string } {
  if (score >= 90) return { level: 'VERY_HIGH', label: 'VERY HIGH' };
  if (score >= 80) return { level: 'HIGH', label: 'HIGH' };
  if (score >= 70) return { level: 'MODERATE', label: 'MODERATE' };
  if (score >= 60) return { level: 'LOW', label: 'LOW' };
  return { level: 'MAINTAIN', label: 'MAINTAIN' };
}

/**
 * Calculates preparation and revision state for a specific topic
 */
export function getTopicPrepStatus(
  subjectId: string,
  topic: TopicItem,
  state: AppState
): TopicPrepStatus {
  const key = `${subjectId}-${topic.id}`;
  const custom = state.topicsState[key] || {};

  const notesDone = custom.notesDone ?? topic.notesDone ?? false;
  const qBankDone = custom.qBankDone ?? topic.qBankDone ?? false;
  const r1Done = custom.r1Done ?? topic.r1Done ?? false;
  const r2Done = custom.r2Done ?? topic.r2Done ?? false;
  const r3Done = custom.r3Done ?? topic.r3Done ?? false;
  const r1Date = custom.r1Date || topic.r1Date;
  const r2Date = custom.r2Date || topic.r2Date;
  const r3Date = custom.r3Date || topic.r3Date;

  // Completion calculation (0-100)
  let steps = 0;
  if (notesDone) steps += 25;
  if (qBankDone) steps += 25;
  if (r1Done) steps += 20;
  if (r2Done) steps += 15;
  if (r3Done) steps += 15;

  let lastRevisionText = 'Not started';
  if (r3Done) lastRevisionText = r3Date ? `R3 on ${r3Date}` : 'R3 completed';
  else if (r2Done) lastRevisionText = r2Date ? `R2 on ${r2Date}` : 'R2 completed';
  else if (r1Done) lastRevisionText = r1Date ? `R1 on ${r1Date}` : 'R1 completed';
  else if (notesDone || qBankDone) lastRevisionText = 'Initial read only (R1 pending)';

  return {
    notesDone,
    qBankDone,
    r1Done,
    r2Done,
    r3Done,
    r1Date,
    r2Date,
    r3Date,
    lastRevisionText,
    completionRate: steps,
  };
}

/**
 * Evaluates individual raw signals (0-100) for a given topic
 */
export function computeTopicSignals(
  subject: FMGESubject,
  topic: TopicItem,
  state: AppState,
  prep: TopicPrepStatus,
  signalData?: TopicSignalData
): {
  priorityScore: number;
  subjectWeight: number;
  highYieldSignal: number;
  clinicalVignettePotential: number;
  imageBasedPotential: number;
  docPotential: number;
  userErrorSignal: number;
  revisionGap: number;
  telegramRecurrence: number;
  gtErrorCount: number;
  notebookErrorCount: number;
} {
  // A. Priority Score (0-100): High Yield base + Subject importance
  const basePriority = topic.isHighYield ? 88 : 55;
  const subWeightBoost = Math.min(12, Math.round((subject.weightage / 33) * 12));
  const priorityScore = Math.min(100, Math.max(0, basePriority + subWeightBoost));

  // B. Subject Weight (0-100): Max weight is Medicine at 33 marks
  const subjectWeight = Math.min(100, Math.round((subject.weightage / 33) * 100));

  // C. Historical / High Yield Signal (0-100)
  const highYieldSignal = signalData?.historicalFrequency ?? (topic.isHighYield ? 85 : 55);

  // D. Clinical Vignette Potential (0-100)
  const clinicalVignettePotential = signalData?.vignettePotential ?? (topic.isHighYield ? 80 : 50);

  // E. Image Based Potential (0-100)
  const imageBasedPotential = signalData?.ibqPotential ?? (topic.isHighYield ? 75 : 45);

  // F. Management / DOC Potential (0-100)
  const docPotential = signalData?.docPotential ?? (topic.isHighYield ? 80 : 45);

  // G. User Error Signal (0-100)
  // Check weak subjects in Grand Tests
  const weakInGT = (state.grandTests || []).some(
    (gt) => gt.weakSubjectIds?.includes(subject.id) || gt.weakSubjectIds?.includes(subject.code)
  );

  // Check matching Error Notebook items
  const topicLower = topic.name.toLowerCase();
  const matchingNotebookErrors = (state.errorNotebook || []).filter((err) => {
    if (err.subjectId === subject.id) {
      if (err.topic && topicLower.includes(err.topic.toLowerCase())) return true;
      if (err.questionGist && topicLower.split(' ').some((word) => word.length > 4 && err.questionGist.toLowerCase().includes(word))) return true;
      return true;
    }
    return false;
  });

  const notebookErrorCount = matchingNotebookErrors.length;
  const gtErrorCount = weakInGT ? 1 : 0;

  let rawError = 25; // neutral baseline for unattempted/normal
  if (weakInGT) rawError += 30;
  if (notebookErrorCount > 0) rawError += Math.min(45, notebookErrorCount * 20);
  if (!prep.notesDone && !prep.qBankDone) rawError += 10;
  if (prep.r3Done && notebookErrorCount === 0 && !weakInGT) rawError = 15; // well mastered
  const userErrorSignal = Math.min(100, Math.max(10, rawError));

  // H. Revision Gap (0-100)
  let rawGap = 0;
  if (!prep.notesDone) rawGap += 25;
  if (!prep.qBankDone) rawGap += 25;
  if (!prep.r1Done) rawGap += 30;
  else if (!prep.r2Done) rawGap += 15;
  else if (!prep.r3Done) rawGap += 10;
  else rawGap = 10; // R3 finished
  const revisionGap = Math.min(100, Math.max(10, rawGap));

  // I. Telegram / MCQ Recurrence (0-100)
  const matchingTg = (state.telegramQuestions || []).filter(
    (q) => q.subjectId === subject.id || (q.topic && topicLower.includes(q.topic.toLowerCase()))
  );
  let tgScore = 40; // baseline
  if (matchingTg.length > 0) {
    tgScore += Math.min(40, matchingTg.length * 15);
    const hasIncorrect = matchingTg.some((q) => q.userStatus === 'incorrect');
    if (hasIncorrect) tgScore += 20;
  }
  const telegramRecurrence = Math.min(100, tgScore);

  return {
    priorityScore,
    subjectWeight,
    highYieldSignal,
    clinicalVignettePotential,
    imageBasedPotential,
    docPotential,
    userErrorSignal,
    revisionGap,
    telegramRecurrence,
    gtErrorCount,
    notebookErrorCount,
  };
}

/**
 * Builds why reasons and action bullets
 */
function buildWhyReasons(
  subject: FMGESubject,
  signals: ReturnType<typeof computeTopicSignals>,
  prep: TopicPrepStatus,
  signalData?: TopicSignalData
): { whyReasons: string[]; recommendedAction: string } {
  const why: string[] = [];

  if (signalData?.keyWhyTags && signalData.keyWhyTags.length > 0) {
    why.push(...signalData.keyWhyTags);
  }

  if (subject.weightage >= 30) {
    why.push(`Mega subject yield (${subject.weightage} marks in FMGE)`);
  } else if (subject.weightage >= 15) {
    why.push(`Major core subject (${subject.weightage} marks)`);
  }

  if (signals.clinicalVignettePotential >= 90) {
    why.push('High clinical vignette case scenario yield');
  }

  if (signals.docPotential >= 90) {
    why.push('Critical Drug of Choice (DOC) & emergency management focus');
  }

  if (signals.imageBasedPotential >= 90) {
    why.push('Classic image-based question (IBQ) & visual spotter');
  }

  if (signals.userErrorSignal >= 70) {
    why.push('Personal mistake signal from Grand Tests or Error Notebook');
  }

  if (signals.revisionGap >= 75) {
    why.push('Active revision gap: R1 multi-cycle spaced repetition overdue');
  }

  // Deduplicate and limit to top 4 crisp reasons
  const uniqueWhy = Array.from(new Set(why)).slice(0, 4);

  // Recommended Action
  let recommendedAction = 'Revise key concepts and solve 15 clinical MCQs';
  if (signals.docPotential >= 90) {
    recommendedAction = 'Memorize Drug of Choice (DOC) protocols and contraindications';
  } else if (signals.imageBasedPotential >= 90) {
    recommendedAction = 'Review classic radiological/histopathological image spotters';
  } else if (signals.userErrorSignal >= 70) {
    recommendedAction = 'Review logged error traps & redo related Grand Test questions';
  } else if (!prep.r1Done) {
    recommendedAction = 'Complete 1st spaced revision cycle (R1) today';
  } else if (!prep.r2Done) {
    recommendedAction = 'Complete 2nd spaced revision cycle (R2)';
  }

  return {
    whyReasons: uniqueWhy.length ? uniqueWhy : ['High-frequency FMGE core syllabus concept'],
    recommendedAction,
  };
}

/**
 * Predicts and ranks all topics in the FMGE database
 */
export function calculateTopicPredictions(
  state: AppState,
  mode: PredictionMode = 'combined',
  customWeights?: Partial<PredictionWeights>
): PredictedTopicItem[] {
  const activeWeights: PredictionWeights = {
    ...DEFAULT_PREDICTION_WEIGHTS[mode],
    ...(customWeights || {}),
  };

  const results: Omit<PredictedTopicItem, 'rank'>[] = [];

  FMGE_SUBJECTS.forEach((subject) => {
    // Combine standard topics with any user custom topics
    const customList = state.subjectProgress[subject.id]?.customTopics || [];
    const allTopics = [...subject.topics, ...customList];

    allTopics.forEach((topic) => {
      const prep = getTopicPrepStatus(subject.id, topic, state);
      const signalData = TOPIC_PREDICTION_SIGNALS[topic.id];
      const sigs = computeTopicSignals(subject, topic, state, prep, signalData);

      // Weighted Calculation
      const weightedSum =
        sigs.priorityScore * activeWeights.priorityScore +
        sigs.subjectWeight * activeWeights.subjectWeight +
        sigs.highYieldSignal * activeWeights.highYieldSignal +
        sigs.clinicalVignettePotential * activeWeights.clinicalVignettePotential +
        sigs.imageBasedPotential * activeWeights.imageBasedPotential +
        sigs.docPotential * activeWeights.docPotential +
        sigs.userErrorSignal * activeWeights.userErrorSignal +
        sigs.revisionGap * activeWeights.revisionGap +
        sigs.telegramRecurrence * activeWeights.telegramRecurrence;

      // Normalization: round to integer 0 - 100
      const score = Math.min(100, Math.max(0, Math.round(weightedSum)));
      const { level, label: levelLabel } = getPredictionLevel(score);

      // Personal Risk Score (Errors + Gap + Subject Weight + High Yield)
      const personalRiskScore = Math.min(
        100,
        Math.max(
          0,
          Math.round(
            sigs.userErrorSignal * 0.40 +
            sigs.revisionGap * 0.35 +
            sigs.subjectWeight * 0.15 +
            sigs.highYieldSignal * 0.10
          )
        )
      );

      const confidence: PredictedTopicItem['confidence'] =
        score >= 88 ? 'High' : score >= 72 ? 'Moderate' : 'Tentative';

      const { whyReasons, recommendedAction } = buildWhyReasons(subject, sigs, prep, signalData);

      // Detailed breakdown object for explanation drawer
      const breakdown: PredictionSignalBreakdown = {
        priorityScore: {
          raw: sigs.priorityScore,
          weight: Math.round(activeWeights.priorityScore * 100),
          weighted: +(sigs.priorityScore * activeWeights.priorityScore).toFixed(1),
          label: 'Topic Priority Base',
        },
        subjectWeight: {
          raw: sigs.subjectWeight,
          weight: Math.round(activeWeights.subjectWeight * 100),
          weighted: +(sigs.subjectWeight * activeWeights.subjectWeight).toFixed(1),
          label: `Subject Weight (${subject.weightage} marks)`,
        },
        highYieldSignal: {
          raw: sigs.highYieldSignal,
          weight: Math.round(activeWeights.highYieldSignal * 100),
          weighted: +(sigs.highYieldSignal * activeWeights.highYieldSignal).toFixed(1),
          label: 'Historical / High-Yield Signal',
        },
        clinicalVignettePotential: {
          raw: sigs.clinicalVignettePotential,
          weight: Math.round(activeWeights.clinicalVignettePotential * 100),
          weighted: +(sigs.clinicalVignettePotential * activeWeights.clinicalVignettePotential).toFixed(1),
          label: 'Clinical Vignette Potential',
        },
        imageBasedPotential: {
          raw: sigs.imageBasedPotential,
          weight: Math.round(activeWeights.imageBasedPotential * 100),
          weighted: +(sigs.imageBasedPotential * activeWeights.imageBasedPotential).toFixed(1),
          label: 'Image-Based Question (IBQ) Potential',
        },
        docPotential: {
          raw: sigs.docPotential,
          weight: Math.round(activeWeights.docPotential * 100),
          weighted: +(sigs.docPotential * activeWeights.docPotential).toFixed(1),
          label: 'Management / Drug-of-Choice (DOC)',
        },
        userErrorSignal: {
          raw: sigs.userErrorSignal,
          weight: Math.round(activeWeights.userErrorSignal * 100),
          weighted: +(sigs.userErrorSignal * activeWeights.userErrorSignal).toFixed(1),
          label: 'User Error / GT Mistake Signal',
        },
        revisionGap: {
          raw: sigs.revisionGap,
          weight: Math.round(activeWeights.revisionGap * 100),
          weighted: +(sigs.revisionGap * activeWeights.revisionGap).toFixed(1),
          label: 'Spaced Revision Gap (R1/R2/R3)',
        },
        telegramRecurrence: {
          raw: sigs.telegramRecurrence,
          weight: Math.round(activeWeights.telegramRecurrence * 100),
          weighted: +(sigs.telegramRecurrence * activeWeights.telegramRecurrence).toFixed(1),
          label: 'MCQ & Telegram Recurrence',
        },
      };

      results.push({
        topicId: topic.id,
        topicName: topic.name,
        subjectId: subject.id,
        subjectName: subject.name,
        subjectCode: subject.code,
        subjectColor: subject.color,
        subjectWeightage: subject.weightage,
        phase: subject.phase,
        isHighYield: topic.isHighYield,
        score,
        level,
        levelLabel,
        personalRiskScore,
        confidence,
        whyReasons,
        recommendedAction,
        prepStatus: prep,
        signals: breakdown,
        gtErrorCount: sigs.gtErrorCount,
        notebookErrorCount: sigs.notebookErrorCount,
        highYieldPearl: signalData?.highYieldPearl,
      });
    });
  });

  // Sort descending by score, then by personal risk score
  results.sort((a, b) => b.score - a.score || b.personalRiskScore - a.personalRiskScore);

  // Assign sequential 1-based ranks
  return results.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}

/**
 * Computes high-level summary metrics across all subjects
 */
export function calculatePredictionDashboardMetrics(
  predictions: PredictedTopicItem[],
  state: AppState
): {
  top10: PredictedTopicItem[];
  top20: PredictedTopicItem[];
  highYieldWeaknesses: PredictedTopicItem[];
  immediateRevisions: PredictedTopicItem[];
  highPredictionLowPrep: PredictedTopicItem[];
  highPredictionWithErrors: PredictedTopicItem[];
  subjectRiskSummaries: SubjectRiskSummary[];
  highestRiskSubject: SubjectRiskSummary | null;
} {
  const top10 = predictions.slice(0, 10);
  const top20 = predictions.slice(0, 20);

  // High-Yield + User Weakness: sorted by personalRiskScore
  const highYieldWeaknesses = [...predictions]
    .filter((p) => p.isHighYield && (p.signals.userErrorSignal.raw >= 60 || p.signals.revisionGap.raw >= 65))
    .sort((a, b) => b.personalRiskScore - a.personalRiskScore)
    .slice(0, 8);

  // Topics needing immediate revision: high prediction score with R1 not completed
  const immediateRevisions = predictions
    .filter((p) => !p.prepStatus.r1Done && p.score >= 75)
    .slice(0, 8);

  // High prediction + low preparation: score >= 80 and completion < 50%
  const highPredictionLowPrep = predictions
    .filter((p) => p.score >= 80 && p.prepStatus.completionRate < 50)
    .slice(0, 8);

  // High prediction + repeated user errors: score >= 75 and (gtErrorCount > 0 or notebookErrorCount > 0)
  const highPredictionWithErrors = predictions
    .filter((p) => p.score >= 75 && (p.gtErrorCount > 0 || p.notebookErrorCount > 0))
    .slice(0, 8);

  // Subject Risk Summaries
  const subjectMap = new Map<string, PredictedTopicItem[]>();
  predictions.forEach((p) => {
    if (!subjectMap.has(p.subjectId)) subjectMap.set(p.subjectId, []);
    subjectMap.get(p.subjectId)!.push(p);
  });

  const subjectRiskSummaries: SubjectRiskSummary[] = FMGE_SUBJECTS.map((sub) => {
    const list = subjectMap.get(sub.id) || [];
    const avgScore = list.length
      ? Math.round(list.reduce((acc, t) => acc + t.score, 0) / list.length)
      : 0;
    const topRiskCount = list.filter((t) => t.level === 'VERY_HIGH' || t.level === 'HIGH').length;
    const unrevisedCount = list.filter((t) => !t.prepStatus.r1Done).length;
    const userErrorCount = list.reduce(
      (acc, t) => acc + t.gtErrorCount + t.notebookErrorCount,
      0
    );

    return {
      subjectId: sub.id,
      subjectName: sub.name,
      subjectCode: sub.code,
      subjectColor: sub.color,
      weightage: sub.weightage,
      averagePredictionScore: avgScore,
      topRiskTopicCount: topRiskCount,
      unrevisedTopicCount: unrevisedCount,
      userErrorCount,
    };
  }).sort((a, b) => b.averagePredictionScore - a.averagePredictionScore || b.weightage - a.weightage);

  const highestRiskSubject = subjectRiskSummaries[0] || null;

  return {
    top10,
    top20,
    highYieldWeaknesses,
    immediateRevisions,
    highPredictionLowPrep,
    highPredictionWithErrors,
    subjectRiskSummaries,
    highestRiskSubject,
  };
}

/**
 * Generates Top 5 targeted revision topics for Today's Planned Study session
 */
export function getTodaysPredictedRevisions(
  predictions: PredictedTopicItem[],
  limit = 5
): PredictedTopicItem[] {
  // Score formula: High Prediction Score + Personal Risk + Unfinished R1/R2
  const candidateList = [...predictions].filter((p) => !p.prepStatus.r3Done);

  candidateList.sort((a, b) => {
    const scoreA = a.score * 0.5 + a.personalRiskScore * 0.35 + a.signals.revisionGap.raw * 0.15;
    const scoreB = b.score * 0.5 + b.personalRiskScore * 0.35 + b.signals.revisionGap.raw * 0.15;
    return scoreB - scoreA;
  });

  return candidateList.slice(0, limit);
}
