import { UserProfile, AppState, OnboardingPreparationStage, StudyPreferenceKey, PreparationPhase, LearningPathwayStep, TopicAdaptivePriority } from '../types';
import { calculateAppStats } from './storage';
import {
  getTopPriorityTopics,
  getDaysRemainingToExam,
} from './adaptivePriorityEngine';
import { getPreparationPhase } from './missionControlEngine';
import { calculateStudyReadiness } from './readinessEngine';
import { getLocalDateKey } from './date';

/**
 * PERSONALIZATION / PLANNING ENGINE
 *
 * This is the single source of truth that connects the ONBOARDING profile to the
 * rest of the app. It deliberately REUSES the existing planning engines
 * (adaptive priority, preparation phase, readiness, app stats) rather than
 * duplicating them. It adds the missing "profile-aware" glue so that the
 * onboarding answers actually shape:
 *
 *   - examDate            -> days/weeks remaining, phase, workload, GT cadence
 *   - targetScore         -> the bar the estimated score is measured against (gap)
 *   - preparationStage    -> the shape of the plan (learn vs revise vs exam-focus)
 *   - dailyHoursTarget    -> available minutes and per-activity workload split
 *   - studyPreferences    -> how tasks are presented/scheduled
 *   - baselineScore       -> starting estimated score (or baselinePending)
 *
 * Everything here is a PURE derivation of (profile, state). There is no stored
 * plan, so any profile change recalculates future recommendations without ever
 * touching learning history (topics, errors, GTs, MCQ attempts, logs).
 */

export type PlanActivityType = 'learn' | 'recall' | 'mcqs' | 'errors' | 'revision';

export interface WorkloadMix {
  learn: number;
  recall: number;
  mcqs: number;
  errors: number;
  revision: number;
}

export interface PersonalizedPlanTask {
  id: string;
  activity: PlanActivityType;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  subjectColor: string;
  topicId: string;
  topicName: string;
  activityLabel: string; // human label e.g. "MCQ drill", "Error review"
  durationMinutes: number;
  priority: number; // 0 - 100 from adaptive engine
  reason: string;
  actionLabel: string;
  recommendedPathway: LearningPathwayStep[];
  isHighYield: boolean;
}

export interface PersonalizedPlan {
  date: string;
  availableMinutes: number;
  phase: PreparationPhase;
  phaseTitle: string;
  phaseDescription: string;
  targetScore: number;
  estimatedScore: number | null;
  scoreGap: number | null;
  daysRemaining: number;
  weeksRemaining: number;
  revisionDueCount: number;
  errorRemediationCount: number;
  gtCadenceDays: number;
  tasks: PersonalizedPlanTask[];
}

export interface LearningContext {
  uid: string;
  displayName: string;
  examDate: string;
  daysRemaining: number;
  weeksRemaining: number;
  targetScore: number;
  preparationStage: OnboardingPreparationStage | null | undefined;
  studyPreferences: StudyPreferenceKey[];
  dailyHoursTarget: number;
  availableMinutes: number;
  coachingSource?: string | null;
  primaryPlatform?: string | null;
  baselinePending: boolean;
  baselineScore: number | null;
  baselineQuestions: number | null;
  estimatedScore: number | null;
  scoreGap: number | null;
  readiness: number | null;
  phase: PreparationPhase;
  phaseTitle: string;
  phaseDescription: string;
  workloadMix: WorkloadMix;
  gtCadenceDays: number;
  revisionFocus: 'high' | 'medium' | 'low';
  weakSubjects: string[];
  weakTopics: string[];
  gtFrequencyLabel: string;
}

const STAGE_TO_MIX: Record<string, Partial<WorkloadMix> & { revisionFocus: 'high' | 'medium' | 'low' }> = {
  // Learning-heavy stages: lots of new content, light testing.
  just_starting: { learn: 45, recall: 15, mcqs: 20, errors: 5, revision: 15, revisionFocus: 'medium' },
  building_foundation: { learn: 40, recall: 15, mcqs: 25, errors: 5, revision: 15, revisionFocus: 'medium' },
  // Most subjects done / in revision: shift toward recall + revision + testing.
  most_subjects_completed: { learn: 20, recall: 25, mcqs: 30, errors: 10, revision: 15, revisionFocus: 'high' },
  in_revision: { learn: 15, recall: 25, mcqs: 30, errors: 10, revision: 20, revisionFocus: 'high' },
  // Exam-focused: minimal new learning, maximum testing + errors + high-yield revision.
  mostly_mcqs_gt: { learn: 5, recall: 15, mcqs: 45, errors: 20, revision: 15, revisionFocus: 'high' },
  final_revision: { learn: 0, recall: 20, mcqs: 40, errors: 25, revision: 15, revisionFocus: 'high' },
};

const DEFAULT_MIX: WorkloadMix & { revisionFocus: 'medium' } = {
  learn: 30,
  recall: 18,
  mcqs: 30,
  errors: 8,
  revision: 14,
  revisionFocus: 'medium',
};

/**
 * Convert an eventual typed stage (or its string) into a workload mix + revision
 * focus. Falls back to a sensible blended default for unknown stages.
 */
function mixForStage(stage?: OnboardingPreparationStage | string | null): {
  mix: WorkloadMix;
  revisionFocus: 'high' | 'medium' | 'low';
} {
  const entry = stage ? STAGE_TO_MIX[stage] : undefined;
  if (!entry) {
    return {
      mix: {
        learn: DEFAULT_MIX.learn,
        recall: DEFAULT_MIX.recall,
        mcqs: DEFAULT_MIX.mcqs,
        errors: DEFAULT_MIX.errors,
        revision: DEFAULT_MIX.revision,
      },
      revisionFocus: DEFAULT_MIX.revisionFocus,
    };
  }
  return {
    mix: {
      learn: entry.learn ?? DEFAULT_MIX.learn,
      recall: entry.recall ?? DEFAULT_MIX.recall,
      mcqs: entry.mcqs ?? DEFAULT_MIX.mcqs,
      errors: entry.errors ?? DEFAULT_MIX.errors,
      revision: entry.revision ?? DEFAULT_MIX.revision,
    },
    revisionFocus: entry.revisionFocus,
  };
}

/**
 * Apply exam-proximity pressure on top of the stage mix. The closer the exam
 * (mirroring the established getPreparationPhase boundaries), the more weight
 * shifts from learning toward repeated recall, error remediation and high-yield
 * revision, and the less new content we assign.
 */
function applyPhasePressure(mix: WorkloadMix, daysRemaining: number): WorkloadMix {
  const next = { ...mix };
  if (daysRemaining <= 30) {
    next.learn = Math.min(5, Math.round(next.learn * 0.15));
    next.mcqs = next.mcqs + 10;
    next.errors = next.errors + 8;
    next.revision = next.revision + 4;
  } else if (daysRemaining <= 60) {
    next.learn = Math.min(12, Math.round(next.learn * 0.4));
    next.mcqs = next.mcqs + 8;
    next.errors = next.errors + 5;
    next.revision = next.revision + 3;
  } else if (daysRemaining >= 150) {
    // Early: long runway, allow more foundational learning depth.
    next.learn = next.learn + 5;
    next.mcqs = Math.max(18, next.mcqs - 6);
  }
  return normalizeMix(next);
}

function normalizeMix(mix: WorkloadMix): WorkloadMix {
  const sum =
    mix.learn + mix.recall + mix.mcqs + mix.errors + mix.revision;
  const total = sum === 0 ? 1 : sum;
  const raw = {
    learn: (mix.learn / total) * 100,
    recall: (mix.recall / total) * 100,
    mcqs: (mix.mcqs / total) * 100,
    errors: (mix.errors / total) * 100,
    revision: (mix.revision / total) * 100,
  };
  // Largest-remainder rounding so percentages always sum to exactly 100.
  const floored = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, Math.floor(v)])
  ) as { [K in keyof WorkloadMix]: number };
  let assigned = floored.learn + floored.recall + floored.mcqs + floored.errors + floored.revision;
  const remainderOrder = (Object.entries(raw) as [keyof WorkloadMix, number][])
    .sort((a, b) => b[1] - Math.floor(b[1]) - (a[1] - Math.floor(a[1])));
  let i = 0;
  while (assigned < 100) {
    const key = remainderOrder[i % remainderOrder.length][0];
    floored[key] += 1;
    assigned += 1;
    i += 1;
  }
  return {
    learn: floored.learn,
    recall: floored.recall,
    mcqs: floored.mcqs,
    errors: floored.errors,
    revision: floored.revision,
  };
}

/** Coherent current-performance estimate. Never inflated; null when genuinely unknown. */
export function estimateCurrentScore(profile: UserProfile | null | undefined, state: AppState): number | null {
  const stats = calculateAppStats(state);
  const syllabusEstimate = Number.isFinite(stats.estimatedMasteredMarks)
    ? stats.estimatedMasteredMarks
    : null;

  const gts = Array.isArray(state.grandTests) ? state.grandTests : [];
  const gtScores = gts.filter((g) => Number.isFinite(g.score)).map((g) => g.score);
  const avgGT = gtScores.length ? gtScores.reduce((a, b) => a + b, 0) / gtScores.length : null;

  const attempts = Array.isArray(state.mcqAttempts) ? state.mcqAttempts.length : 0;
  const hasPerformance = gtScores.length > 0 || attempts > 0;

  if (hasPerformance) {
    // Live performance is the strongest signal; blend a syllabus-mastery estimate
    // when we have at least some question data to anchor it.
    let est =
      avgGT != null && syllabusEstimate != null ? avgGT * 0.55 + syllabusEstimate * 0.45
      : avgGT != null ? avgGT
      : syllabusEstimate ?? null;
    if (est == null) return null;
    return Math.min(300, Math.max(0, Math.round(est)));
  }

  // No performance yet — only use an explicitly provided baseline (never fabricate).
  if (profile && typeof profile.baselineScore === 'number') {
    return Math.min(300, Math.max(0, Math.round(profile.baselineScore)));
  }

  return null;
}

const clampScore = (n: number) => Math.min(300, Math.max(0, Math.round(n)));

export function isBaselinePending(
  profile: UserProfile | null | undefined,
  state: AppState
): boolean {
  const attempts = Array.isArray(state.mcqAttempts) ? state.mcqAttempts.length : 0;
  const gts = Array.isArray(state.grandTests) ? state.grandTests : [];
  const gtScores = gts.some((g) => Number.isFinite(g.score));
  const hasBaseline = !!profile && typeof profile.baselineScore === 'number';
  return !hasBaseline && !gtScores && attempts === 0;
}

function computeWeakSubjects(profile: UserProfile | null | undefined, state: AppState): string[] {
  const weak: string[] = [];
  const gts = Array.isArray(state.grandTests) ? state.grandTests : [];
  const latestGT = gts.length ? gts[gts.length - 1] : null;
  if (latestGT?.weakSubjectIds?.length) {
    weak.push(...latestGT.weakSubjectIds.slice(0, 3));
  }
  const errorNotebook = Array.isArray(state.errorNotebook) ? state.errorNotebook : [];
  const bySubject = new Map<string, number>();
  for (const e of errorNotebook) {
    if (e.subjectId) bySubject.set(e.subjectId, (bySubject.get(e.subjectId) || 0) + 1);
  }
  const topErrorSubjects = [...bySubject.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([s]) => s);
  for (const s of topErrorSubjects) {
    if (!weak.includes(s)) weak.push(s);
  }
  return weak.slice(0, 3);
}

function computeWeakTopics(profile: UserProfile | null | undefined, state: AppState): string[] {
  const errorNotebook = Array.isArray(state.errorNotebook) ? state.errorNotebook : [];
  return errorNotebook.slice(-6).map((e) => e.topic || e.title || '');
}

function gtCadenceFor(phase: PreparationPhase, stage?: OnboardingPreparationStage | null): {
  days: number;
  label: string;
} {
  // Exam-focused stages / final weeks -> frequent full simulations.
  if (stage === 'mostly_mcqs_gt' || stage === 'final_revision') {
    return { days: 3, label: 'Every 3 days · full GT' };
  }
  if (phase === 'FINAL_30_DAYS') return { days: 5, label: 'Every 5 days · full GT' };
  if (phase === 'PHASE_3_EXAM_CONDITIONING' || phase === 'FINAL_14_DAYS') {
    return { days: 7, label: 'Every 7 days · full GT' };
  }
  if (phase === 'PHASE_2_CONSOLIDATION' || phase === 'FINAL_7_DAYS' || phase === 'FINAL_3_DAYS' || phase === 'FINAL_1_DAY') {
    return { days: 14, label: 'Biweekly diagnostic GT' };
  }
  // Long runway + starting -> light testing, build foundations first.
  return { days: 21, label: 'Every 3 weeks · baseline diagnostic' };
}

/**
 * Produce a synthetic AppState whose settings reflect the authenticated profile.
 * This guarantees the existing adaptive/planning engines see the latest exam date,
 * target and daily hours even before any cloud sync, keeping a single source of truth.
 */
export function withProfileOverrides(profile: UserProfile | null | undefined, state: AppState): AppState {
  if (!profile) return state;
  return {
    ...state,
    settings: {
      ...state.settings,
      examDate: profile.examDate || state.settings.examDate,
      targetScore: profile.targetScore || state.settings.targetScore,
      dailyStudyHourGoal: profile.dailyHoursTarget || state.settings.dailyStudyHourGoal,
      userName: profile.displayName || state.settings.userName,
      coachingSource: profile.preferences?.coachingSource ?? state.settings.coachingSource,
      primaryPlatform: profile.preferences?.primaryPlatform ?? state.settings.primaryPlatform,
    },
  };
}

export function getWorkloadMix(
  stage: OnboardingPreparationStage | string | null | undefined,
  daysRemaining: number
): WorkloadMix {
  const { mix } = mixForStage(stage);
  return applyPhasePressure(mix, daysRemaining);
}

export function getRevisionFocus(
  stage: OnboardingPreparationStage | string | null | undefined
): 'high' | 'medium' | 'low' {
  return mixForStage(stage).revisionFocus;
}

/**
 * Build the full, shared learning context used by the Dashboard, AI Coach and
 * any other consumer. This is THE single source of truth.
 */
export function getLearningContext(
  profile: UserProfile | null | undefined,
  state: AppState
): LearningContext {
  const s = withProfileOverrides(profile, state);
  const daysRemaining = getDaysRemainingToExam(s);
  const weeksRemaining = Math.ceil(daysRemaining / 7);
  const phaseInfo = getPreparationPhase(daysRemaining);
  const stage = profile?.preparationStage;
  const workloadMix = getWorkloadMix(stage, daysRemaining);
  const revisionFocus = getRevisionFocus(stage);

  const dailyHoursTarget =
    (typeof profile?.dailyHoursTarget === 'number' && profile.dailyHoursTarget > 0)
      ? profile.dailyHoursTarget
      : (typeof s.settings.dailyStudyHourGoal === 'number' && s.settings.dailyStudyHourGoal > 0)
        ? s.settings.dailyStudyHourGoal
        : 6;
  const availableMinutes = Math.round(dailyHoursTarget * 60);

  const estimatedScore = estimateCurrentScore(profile, state);
  const scoreGap = estimatedScore == null ? null : clampScore(s.settings.targetScore - estimatedScore);
  const baselinePending = isBaselinePending(profile, state);

  const readiness = calculateStudyReadiness(s).score;

  const weakSubjects = computeWeakSubjects(profile, state);
  const weakTopics = computeWeakTopics(profile, state);

  const gtInfo = gtCadenceFor(phaseInfo.phase, stage);

  return {
    uid: profile?.uid || s.settings.userName || 'user',
    displayName: profile?.displayName || s.settings.userName || 'Doctor',
    examDate: s.settings.examDate,
    daysRemaining,
    weeksRemaining,
    targetScore: s.settings.targetScore,
    preparationStage: stage,
    studyPreferences: profile?.studyPreferences || [],
    dailyHoursTarget,
    availableMinutes,
    coachingSource: profile?.preferences?.coachingSource ?? s.settings.coachingSource,
    primaryPlatform: profile?.preferences?.primaryPlatform ?? s.settings.primaryPlatform,
    baselinePending,
    baselineScore: typeof profile?.baselineScore === 'number' ? profile.baselineScore : null,
    baselineQuestions: typeof profile?.baselineQuestions === 'number' ? profile.baselineQuestions : null,
    estimatedScore,
    scoreGap,
    readiness,
    phase: phaseInfo.phase,
    phaseTitle: phaseInfo.phaseTitle,
    phaseDescription: phaseInfo.phaseDescription,
    workloadMix,
    gtCadenceDays: gtInfo.days,
    revisionFocus,
    weakSubjects,
    weakTopics,
    gtFrequencyLabel: gtInfo.label,
  };
}

/**
 * Generate a structured personalized daily plan from the learning profile +
 * adaptive priority + time budget + performance. Returns structured data (not UI
 * text) with each task carrying enough to route into the existing Study system.
 *
 * When the user has no real study context yet, this deliberately returns a
 * minimal starter plan (never a fake generic one).
 */
export function getPersonalizedDailyPlan(
  profile: UserProfile | null | undefined,
  state: AppState,
  date?: string
): PersonalizedPlan {
  const s = withProfileOverrides(profile, state);
  const ctx = getLearningContext(profile, state);
  const today = date || getLocalDateKey();

  const topTopics = getTopPriorityTopics(s, 10);

  // Error Vault burden: reuse the adaptive engine's association rule
  // (subjectId + topic name/id substring match) to count error-notebook entries
  // per top topic. MCQ-derived errorCount/repeatedErrorCount are also honored.
  const errorNotebook = Array.isArray(state.errorNotebook) ? state.errorNotebook : [];
  const errorBurden = (t: TopicAdaptivePriority) => {
    const notebookHits = errorNotebook.filter(
      (e) =>
        e.subjectId === t.subjectId &&
        ((e.topic || '').toLowerCase().includes(t.topicId.toLowerCase()) ||
          (e.topic || '').toLowerCase().includes(t.topicName.toLowerCase()))
    ).length;
    return notebookHits + (t.repeatedErrorCount || 0) * 2 + (t.errorCount || 0);
  };

  const errorTopics = topTopics.filter((t) => errorBurden(t) >= 2);
  const revisionDueTopics = topTopics.filter((t) => t.revisionDue);

  // Split the budget across activities using the phase mix.
  const budget: Record<PlanActivityType, number> = {
    learn: Math.round((ctx.availableMinutes * ctx.workloadMix.learn) / 100),
    recall: Math.round((ctx.availableMinutes * ctx.workloadMix.recall) / 100),
    mcqs: Math.round((ctx.availableMinutes * ctx.workloadMix.mcqs) / 100),
    errors: Math.round((ctx.availableMinutes * ctx.workloadMix.errors) / 100),
    revision: Math.round((ctx.availableMinutes * ctx.workloadMix.revision) / 100),
  };

  const tasks: PersonalizedPlanTask[] = [];

  // 1. Error remediation — highest priority, feeds personalization back in.
  errorTopics.forEach((t, i) => {
    const min = i === 0 ? Math.max(20, budget.errors) : Math.min(25, Math.max(15, Math.round(budget.errors / 2)));
    if (min <= 0) return;
    tasks.push({
      id: `plan-${today}-errors-${t.topicId}`,
      activity: 'errors',
      subjectId: t.subjectId,
      subjectName: t.subjectName,
      subjectCode: t.subjectCode,
      subjectColor: t.subjectColor,
      topicId: t.topicId,
      topicName: t.topicName,
      activityLabel: 'Error review & remediation',
      durationMinutes: min,
      priority: t.priorityScore,
      reason: 'Repeated errors keep this topic loaded in your Error Vault.',
      actionLabel: `Review errors — ${t.topicName}`,
      recommendedPathway: t.recommendedPathway,
      isHighYield: t.isHighYield,
    });
  });

  // 2. Overdue revision.
  revisionDueTopics.forEach((t, i) => {
    const min = i === 0 ? Math.max(20, budget.revision) : Math.min(25, Math.max(15, Math.round(budget.revision / 2)));
    if (min <= 0) return;
    tasks.push({
      id: `plan-${today}-revision-${t.topicId}`,
      activity: 'revision',
      subjectId: t.subjectId,
      subjectName: t.subjectName,
      subjectCode: t.subjectCode,
      subjectColor: t.subjectColor,
      topicId: t.topicId,
      topicName: t.topicName,
      activityLabel: 'Spaced revision',
      durationMinutes: min,
      priority: t.priorityScore,
      reason: 'Revision window is due — spaced recall backs retention.',
      actionLabel: `Revise — ${t.topicName}`,
      recommendedPathway: t.recommendedPathway,
      isHighYield: t.isHighYield,
    });
  });

  // 3. Core learning / recall / practice on the top ranked topics.
  const primary = topTopics[0];
  if (primary && budget.mcqs > 0) {
    tasks.push({
      id: `plan-${today}-learn-${primary.topicId}`,
      activity: 'learn',
      subjectId: primary.subjectId,
      subjectName: primary.subjectName,
      subjectCode: primary.subjectCode,
      subjectColor: primary.subjectColor,
      topicId: primary.topicId,
      topicName: primary.topicName,
      activityLabel: 'Active learning & recall',
      durationMinutes: Math.max(20, budget.learn + budget.recall),
      priority: primary.priorityScore,
      reason: primary.explanation || 'Highest adaptive priority right now.',
      actionLabel: primary.recommendedAction.actionLabel,
      recommendedPathway: primary.recommendedPathway,
      isHighYield: primary.isHighYield,
    });
  } else if (primary && budget.learn + budget.recall > 0) {
    tasks.push({
      id: `plan-${today}-learn-${primary.topicId}`,
      activity: 'learn',
      subjectId: primary.subjectId,
      subjectName: primary.subjectName,
      subjectCode: primary.subjectCode,
      subjectColor: primary.subjectColor,
      topicId: primary.topicId,
      topicName: primary.topicName,
      activityLabel: 'Active learning & recall',
      durationMinutes: Math.max(20, budget.learn + budget.recall),
      priority: primary.priorityScore,
      reason: primary.explanation || 'Highest adaptive priority right now.',
      actionLabel: primary.recommendedAction.actionLabel,
      recommendedPathway: primary.recommendedPathway,
      isHighYield: primary.isHighYield,
    });
  }

  // 4. Fill remaining MCQ/practice budget with the next ranked topics.
  const used = new Set<string>([
    primary?.topicId,
    ...errorTopics.map((t) => t.topicId),
    ...revisionDueTopics.map((t) => t.topicId),
  ].filter(Boolean));
  let mcqBudget = budget.mcqs;
  for (const t of topTopics) {
    if (used.has(t.topicId)) continue;
    if (mcqBudget <= 0) break;
    const min = Math.min(30, Math.max(15, mcqBudget));
    tasks.push({
      id: `plan-${today}-mcq-${t.topicId}`,
      activity: 'mcqs',
      subjectId: t.subjectId,
      subjectName: t.subjectName,
      subjectCode: t.subjectCode,
      subjectColor: t.subjectColor,
      topicId: t.topicId,
      topicName: t.topicName,
      activityLabel: 'Targeted MCQ drill',
      durationMinutes: min,
      priority: t.priorityScore,
      reason: 'High-priority topic needs active MCQ practice to lock recall.',
      actionLabel: `Practice MCQs — ${t.topicName}`,
      recommendedPathway: t.recommendedPathway,
      isHighYield: t.isHighYield,
    });
    mcqBudget -= min;
    used.add(t.topicId);
  }

  // If we had zero useful topics (empty syllabus or all mastered), return a
  // minimal honest starter plan rather than a fabricated generic one.
  if (tasks.length === 0) {
    const starter = topTopics[0];
    if (starter) {
      tasks.push({
        id: `plan-${today}-starter-${starter.topicId}`,
        activity: 'learn',
        subjectId: starter.subjectId,
        subjectName: starter.subjectName,
        subjectCode: starter.subjectCode,
        subjectColor: starter.subjectColor,
        topicId: starter.topicId,
        topicName: starter.topicName,
        activityLabel: 'Active learning & recall',
        durationMinutes: Math.max(25, ctx.availableMinutes),
        priority: starter.priorityScore,
        reason: starter.explanation || 'Begin today\'s highest value topic.',
        actionLabel: starter.recommendedAction.actionLabel,
        recommendedPathway: starter.recommendedPathway,
        isHighYield: starter.isHighYield,
      });
    }
  }

  return {
    date: today,
    availableMinutes: ctx.availableMinutes,
    phase: ctx.phase,
    phaseTitle: ctx.phaseTitle,
    phaseDescription: ctx.phaseDescription,
    targetScore: ctx.targetScore,
    estimatedScore: ctx.estimatedScore,
    scoreGap: ctx.scoreGap,
    daysRemaining: ctx.daysRemaining,
    weeksRemaining: ctx.weeksRemaining,
    revisionDueCount: revisionDueTopics.length,
    errorRemediationCount: errorTopics.length,
    gtCadenceDays: ctx.gtCadenceDays,
    tasks,
  };
}

/**
 * Recomputation entry point used when profile settings change. Because the plan
 * and context are pure derivations, this simply recomputes them from the new
 * profile. Historical learning data is preserved by the caller automatically
 * (the plan never writes to state).
 */
export function recalculatePersonalizedPlanning(
  profile: UserProfile | null | undefined,
  state: AppState,
  date?: string
): { context: LearningContext; plan: PersonalizedPlan } {
  return {
    context: getLearningContext(profile, state),
    plan: getPersonalizedDailyPlan(profile, state, date),
  };
}
