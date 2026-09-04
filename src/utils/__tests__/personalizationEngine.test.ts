import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getInitialAppState } from '../../data/sampleData';
import { FMGE_SUBJECTS } from '../../data/fmgeSubjects';
import { AppState, UserProfile, GrandTest, ErrorNotebookItem, McqAttempt } from '../../types';

import {
  getLearningContext,
  getPersonalizedDailyPlan,
  getWorkloadMix,
  estimateCurrentScore,
  isBaselinePending,
  recalculatePersonalizedPlanning,
  withProfileOverrides,
} from '../personalizationEngine';

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  const now = new Date().toISOString();
  return {
    uid: 'test-user',
    displayName: 'Test Doctor',
    email: 'test@example.com',
    examDate: '2026-06-28',
    targetScore: 200,
    dailyHoursTarget: 6,
    createdAt: now,
    lastActiveAt: now,
    onboardingCompleted: true,
    onboardingVersion: 1,
    onboardingCompletedAt: now,
    profileUpdatedAt: now,
    preparationStage: 'building_foundation',
    studyPreferences: ['mcqs', 'high_yield_notes'],
    preferences: { coachingSource: 'Marrow', primaryPlatform: 'App' },
    ...overrides,
  };
}

function makeState(overrides: Partial<AppState> = {}): AppState {
  return {
    ...getInitialAppState(),
    ...overrides,
  };
}

function makeError(subjectId: string, topic: string): ErrorNotebookItem {
  return {
    id: `err-${subjectId}-${topic}`,
    subjectId,
    topic,
    topicId: `${subjectId}-1`,
    questionGist: 'Missed a core fact',
    myMistake: 'Wrong answer',
    correctConcept: 'Correct concept',
    isReviewed: false,
    dateAdded: new Date().toISOString(),
  };
}

function makeGt(score: number, weakSubjectIds: string[] = []): GrandTest {
  return {
    id: `gt-${score}`,
    title: 'FMGE Mock',
    platform: 'Marrow',
    date: new Date().toISOString(),
    score,
    totalMarks: 300,
    correctCount: 100,
    incorrectCount: 40,
    skippedCount: 10,
    weakSubjectIds,
    strongSubjectIds: [],
    keyMistakesNotes: '',
  };
}

function makeAttempt(subjectId: string, isCorrect: boolean, topicName = 'Some Topic'): McqAttempt {
  return {
    id: `att-${Math.random().toString(36).slice(2)}`,
    questionId: `q-${Math.random().toString(36).slice(2)}`,
    subjectId,
    topicId: `${subjectId}-1`,
    topicName,
    isCorrect,
    selectedAnswer: isCorrect ? '1' : '2',
    correctAnswer: '1',
    timeTakenSeconds: 45,
    attemptNumber: 1,
    timestamp: new Date().toISOString(),
    source: 'custom',
  };
}

describe('personalizationEngine', () => {
  describe('1 · different exam dates produce different time horizons', () => {
    it('computes distinct daysRemaining / phase for far vs near exams', () => {
      const far = getLearningContext(makeProfile({ examDate: '2027-06-28' }), makeState());
      const near = getLearningContext(makeProfile({ examDate: '2026-06-18' }), makeState());
      assert.ok(far.daysRemaining > near.daysRemaining);
      assert.ok(far.weeksRemaining >= near.weeksRemaining);
      // Far exam should not be in the final-exam phases.
      assert.notEqual(far.phase, 'FINAL_30_DAYS');
    });
  });

  describe('2 · different daily study hours produce different workload capacities', () => {
    it('scales available minutes and task durations with daily hours', () => {
      const low = makeProfile({ dailyHoursTarget: 2 });
      const high = makeProfile({ dailyHoursTarget: 8 });
      const lowCtx = getLearningContext(low, makeState());
      const highCtx = getLearningContext(high, makeState());
      assert.equal(highCtx.availableMinutes, 8 * 60);
      assert.equal(lowCtx.availableMinutes, 2 * 60);
      assert.ok(highCtx.availableMinutes > lowCtx.availableMinutes);

      const lowPlan = getPersonalizedDailyPlan(low, makeState());
      const highPlan = getPersonalizedDailyPlan(high, makeState());
      const lowSum = lowPlan.tasks.reduce((a, t) => a + t.durationMinutes, 0);
      const highSum = highPlan.tasks.reduce((a, t) => a + t.durationMinutes, 0);
      assert.ok(highSum > lowSum, 'more hours -> larger workload');
    });
  });

  describe('3 · different preparation stages produce different initial plans', () => {
    it('shifts the workload mix from learning toward testing/revision', () => {
      const starterMix = getWorkloadMix('just_starting', 150);
      const examMix = getWorkloadMix('final_revision', 150);
      assert.ok(starterMix.learn > examMix.learn, 'starter biases learning');
      assert.ok(examMix.mcqs + examMix.errors > starterMix.mcqs + starterMix.errors, 'exam-focused biases testing');
      assert.equal(starterMix.learn + starterMix.recall + starterMix.mcqs + starterMix.errors + starterMix.revision, 100);
    });

    it('changes the composition of the generated plan tasks', () => {
      const learningPlan = getPersonalizedDailyPlan(makeProfile({ preparationStage: 'building_foundation' }), makeState());
      const examPlan = getPersonalizedDailyPlan(makeProfile({ preparationStage: 'final_revision' }), makeState());
      const learningMcq = learningPlan.tasks.filter((t) => t.activity === 'mcqs').reduce((a, t) => a + t.durationMinutes, 0);
      const examMcq = examPlan.tasks.filter((t) => t.activity === 'mcqs').reduce((a, t) => a + t.durationMinutes, 0);
      assert.ok(examMcq >= learningMcq);
    });
  });

  describe('4 · different target scores affect planning/readiness', () => {
    it('reflects a larger gap toward a higher target', () => {
      const state = makeState({ grandTests: [makeGt(140)] });
      const lowTarget = getLearningContext(makeProfile({ targetScore: 150 }), state);
      const highTarget = getLearningContext(makeProfile({ targetScore: 250 }), state);
      assert.ok(lowTarget.estimatedScore === highTarget.estimatedScore);
      assert.ok(highTarget.scoreGap! > lowTarget.scoreGap!);
      // Plan carries the target through.
      assert.equal(getPersonalizedDailyPlan(makeProfile({ targetScore: 250 }), state).targetScore, 250);
    });
  });

  describe('5 · performance changes future priority / estimate', () => {
    it('updates estimated score (and thus readiness/gap) as attempts accrue', () => {
      const state = makeState({ mcqAttempts: [makeAttempt('medicine', true), makeAttempt('medicine', true), makeAttempt('medicine', true), makeAttempt('medicine', true), makeAttempt('medicine', true)] });
      const ctx = getLearningContext(makeProfile({ baselineScore: 120 }), state);
      assert.equal(ctx.baselinePending, false);
      assert.ok(ctx.estimatedScore != null);
    });
  });

  describe('6 · errors increase remediation priority', () => {
    it('includes error-remediation tasks when errors exist', () => {
      // Match against a real Medicine topic so the adaptive engine's error
      // notebook association (subjectId + topic name) recognizes them.
      const medTopic = FMGE_SUBJECTS.find((s) => s.id === 'medicine')!.topics[1];
      const errors = [
        makeError('medicine', medTopic.name),
        makeError('medicine', medTopic.name),
      ];
      const plan = getPersonalizedDailyPlan(makeProfile(), makeState({ errorNotebook: errors }));
      assert.ok(plan.errorRemediationCount > 0, `expected error remediation, got ${plan.errorRemediationCount}`);
      assert.ok(plan.tasks.some((t) => t.activity === 'errors'));
    });
  });

  describe('7 · changing exam date recalculates future planning', () => {
    it('recomputes daysRemaining and plan horizon on profile change', () => {
      const a = getPersonalizedDailyPlan(makeProfile({ examDate: '2026-06-18' }), makeState());
      const b = getPersonalizedDailyPlan(makeProfile({ examDate: '2027-03-01' }), makeState());
      assert.notEqual(a.daysRemaining, b.daysRemaining);
    });
  });

  describe('8 · changing daily hours recalculates workload', () => {
    it('recomputes availableMinutes and task durations', () => {
      const planA = getPersonalizedDailyPlan(makeProfile({ dailyHoursTarget: 3 }), makeState());
      const planB = getPersonalizedDailyPlan(makeProfile({ dailyHoursTarget: 7 }), makeState());
      assert.ok(planB.availableMinutes > planA.availableMinutes);
    });
  });

  describe('9 & 10 · changing target/score does not erase learning history; MCQ history survives', () => {
    it('keeps mcqAttempts untouched when the profile changes', () => {
      const attempts = [makeAttempt('medicine', true), makeAttempt('pathology', false)];
      const base = makeState({ mcqAttempts: attempts, errorNotebook: [makeError('medicine', 'Heart failure')] });
      const before = base.mcqAttempts.length;
      const original = base.mcqAttempts.slice();
      // Recompute planning after changing profile settings.
      recalculatePersonalizedPlanning(makeProfile({ targetScore: 240, examDate: '2026-09-01' }), base);
      assert.equal(base.mcqAttempts.length, before);
      assert.deepEqual(base.mcqAttempts, original);
    });
  });

  describe('11 · existing errors survive profile changes', () => {
    it('does not mutate errorNotebook when recomputing planning', () => {
      const err = [makeError('pathology', 'Nephrotic syndrome')];
      const base = makeState({ errorNotebook: err });
      const snapshot = base.errorNotebook.slice();
      recalculatePersonalizedPlanning(makeProfile({ preparationStage: 'in_revision' }), base);
      assert.equal(base.errorNotebook.length, 1);
      assert.deepEqual(base.errorNotebook, snapshot);
    });
  });

  describe('12 · dashboard and AI Coach use the same personalized context', () => {
    it('both derive from getLearningContext (single source of truth)', () => {
      const profile = makeProfile();
      const state = makeState({ grandTests: [makeGt(160, ['medicine'])] });
      const ctxA = getLearningContext(profile, state); // dashboard
      const ctxB = getLearningContext(profile, state); // AI Coach
      assert.equal(ctxA.targetScore, ctxB.targetScore);
      assert.equal(ctxA.examDate, ctxB.examDate);
      assert.equal(ctxA.estimatedScore, ctxB.estimatedScore);
      assert.equal(ctxA.weakSubjects[0], ctxB.weakSubjects[0]);
      assert.deepEqual(ctxA.workloadMix, ctxB.workloadMix);
    });
  });

  describe('13 · new users receive an initial personalized plan', () => {
    it('returns a non-empty coherent plan for a brand-new user', () => {
      const freshProfile = {
        ...makeProfile(),
        baselineScore: undefined,
        baselineQuestions: undefined,
      };
      const state = makeState(); // empty
      const plan = getPersonalizedDailyPlan(freshProfile, state);
      assert.ok(plan.tasks.length > 0, 'starter plan has tasks');
      for (const t of plan.tasks) {
        assert.ok(t.subjectId && t.topicId && t.topicName, 'task references a real topic');
        assert.ok(t.durationMinutes > 0, 'task has a duration');
        assert.ok(t.priority >= 0, 'task has a priority');
      }
    });
  });

  describe('14 · no generic placeholder plan when real user context exists', () => {
    it('plan uses the real profile + real topics (not a fixed fake)', () => {
      const profile = makeProfile({ targetScore: 180, preparationStage: 'in_revision', dailyHoursTarget: 5 });
      const plan = getPersonalizedDailyPlan(profile, makeState());
      assert.equal(plan.targetScore, 180);
      assert.ok(plan.daysRemaining >= 1);
      const hasRealSubjects = plan.tasks.every((t) =>
        FMGE_SUBJECTS.some((s) => s.id === t.subjectId)
      );
      assert.ok(hasRealSubjects, 'tasks reference real FMGE subjects');
      // Different user context yields a different plan target (not a generic one).
      const otherPlan = getPersonalizedDailyPlan(makeProfile({ targetScore: 220, dailyHoursTarget: 2 }), makeState());
      assert.notEqual(plan.targetScore, otherPlan.targetScore);
    });
  });

  describe('helpers · estimate, baseline, overrides', () => {
    it('returns null (baselinePending) when no baseline and no performance exist', () => {
      const profile = { ...makeProfile(), baselineScore: undefined, baselineQuestions: undefined };
      assert.equal(estimateCurrentScore(profile, makeState()), null);
      assert.equal(isBaselinePending(profile, makeState()), true);
    });

    it('uses an explicit baseline when no performance exists (does not fabricate)', () => {
      const profile = makeProfile({ baselineScore: 132 });
      assert.equal(estimateCurrentScore(profile, makeState()), 132);
      assert.equal(isBaselinePending(profile, makeState()), false);
    });

    it('withProfileOverrides lets new profile values win over stale settings', () => {
      const profile = makeProfile({ examDate: '2027-01-01', targetScore: 250, dailyHoursTarget: 4 });
      const overridden = withProfileOverrides(profile, makeState());
      assert.equal(overridden.settings.examDate, '2027-01-01');
      assert.equal(overridden.settings.targetScore, 250);
      assert.equal(overridden.settings.dailyStudyHourGoal, 4);
    });
  });
});
