import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FMGE_PASS_MARK,
  FMGE_MAX_SCORE,
  TARGET_SCORE_OPTIONS,
  DAILY_STUDY_HOURS_OPTIONS,
  PREPARATION_STAGE_OPTIONS,
  STUDY_PREFERENCES_OPTIONS,
  PREPARATION_STAGE_LABELS,
  STUDY_PREFERENCE_LABELS,
  getDaysRemaining,
  parseLocalDate,
  isUsableExamDate,
  isValidTargetScore,
  isValidDailyStudyHours,
  isValidBaselineScore,
  isValidPreparationStage,
  isValidStudyPreferences,
  formatExamDate,
  getExamMonth,
  getExamYear,
  getExamDay,
  daysInMonth,
  buildFullExamDate,
  isValidExamMonthDayYear,
} from '../onboarding';

describe('onboarding helpers', () => {
  describe('getDaysRemaining', () => {
    it('returns null when no exam date is provided (undecided)', () => {
      assert.equal(getDaysRemaining(undefined), null);
      assert.equal(getDaysRemaining(null), null);
      assert.equal(getDaysRemaining(''), null);
    });

    it('returns remaining days in the local timezone', () => {
      const from = new Date(2026, 5, 15); // Jun 15 2026 local
      // Jun 15 -> Jun 28 = 13 days
      assert.equal(getDaysRemaining('2026-06-28', from), 13);
    });

    it('returns null for a past exam date', () => {
      const from = new Date(2026, 5, 15);
      assert.equal(getDaysRemaining('2026-05-01', from), null);
    });

    it('returns null for an invalid date string', () => {
      assert.equal(getDaysRemaining('2026-02-31', new Date(2026, 0, 1)), null);
      assert.equal(getDaysRemaining('not-a-date', new Date(2026, 0, 1)), null);
      assert.equal(getDaysRemaining('2026-13-40', new Date(2026, 0, 1)), null);
    });
  });

  describe('parseLocalDate', () => {
    it('parses a valid YYYY-MM-DD key into a local Date', () => {
      const d = parseLocalDate('2026-12-15');
      assert.ok(d);
      assert.equal(d.getFullYear(), 2026);
      assert.equal(d.getMonth(), 11);
      assert.equal(d.getDate(), 15);
    });

    it('rejects rollover dates like 2026-02-31', () => {
      assert.equal(parseLocalDate('2026-02-31'), null);
    });
  });

  describe('isUsableExamDate', () => {
    it('accepts today and future dates', () => {
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 86400000);
      const fmt = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      assert.equal(isUsableExamDate(fmt(today)), true);
      assert.equal(isUsableExamDate(fmt(tomorrow)), true);
    });

    it('rejects past or missing dates', () => {
      const yesterday = new Date(Date.now() - 86400000);
      const fmt = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      assert.equal(isUsableExamDate(fmt(yesterday)), false);
      assert.equal(isUsableExamDate(undefined), false);
      assert.equal(isUsableExamDate(''), false);
    });
  });

  describe('isValidTargetScore', () => {
    it('accepts the listed target options', () => {
      for (const opt of TARGET_SCORE_OPTIONS) {
        assert.equal(isValidTargetScore(opt), true, `target ${opt} should be valid`);
      }
    });

    it('rejects scores below pass mark and above max', () => {
      assert.equal(isValidTargetScore(FMGE_PASS_MARK - 1), false);
      assert.equal(isValidTargetScore(FMGE_MAX_SCORE + 1), false);
    });

    it('rejects non-numbers', () => {
      assert.equal(isValidTargetScore(undefined), false);
      assert.equal(isValidTargetScore(null), false);
      assert.equal(isValidTargetScore(NaN), false);
    });
  });

  describe('isValidDailyStudyHours', () => {
    it('accepts the listed hour options', () => {
      for (const h of DAILY_STUDY_HOURS_OPTIONS) {
        assert.equal(isValidDailyStudyHours(h), true);
      }
    });

    it('rejects out-of-range and non-numbers', () => {
      assert.equal(isValidDailyStudyHours(1), false);
      assert.equal(isValidDailyStudyHours(9), false);
      assert.equal(isValidDailyStudyHours(undefined), false);
      assert.equal(isValidDailyStudyHours(null), false);
    });
  });

  describe('isValidBaselineScore', () => {
    it('allows an unset baseline (optional)', () => {
      assert.equal(isValidBaselineScore(undefined), true);
      assert.equal(isValidBaselineScore(null), true);
    });

    it('accepts in-range scores', () => {
      assert.equal(isValidBaselineScore(0), true);
      assert.equal(isValidBaselineScore(150), true);
      assert.equal(isValidBaselineScore(FMGE_MAX_SCORE), true);
    });

    it('rejects out-of-range baselines', () => {
      assert.equal(isValidBaselineScore(-1), false);
      assert.equal(isValidBaselineScore(FMGE_MAX_SCORE + 1), false);
    });
  });

  describe('isValidPreparationStage', () => {
    it('accepts every defined stage', () => {
      assert.equal(isValidPreparationStage('just_starting'), true);
      assert.equal(isValidPreparationStage('building_foundation'), true);
      assert.equal(isValidPreparationStage('most_subjects_completed'), true);
      assert.equal(isValidPreparationStage('in_revision'), true);
      assert.equal(isValidPreparationStage('mostly_mcqs_gt'), true);
      assert.equal(isValidPreparationStage('final_revision'), true);
      for (const stage of PREPARATION_STAGE_OPTIONS) {
        assert.equal(isValidPreparationStage(stage.id), true);
      }
    });

    it('rejects random values', () => {
      assert.equal(isValidPreparationStage('almost_done'), false);
      assert.equal(isValidPreparationStage(''), false);
      assert.equal(isValidPreparationStage(undefined), false);
    });
  });

  describe('isValidStudyPreferences', () => {
    it('accepts a subset of defined preferences', () => {
      assert.equal(isValidStudyPreferences(['mcqs', 'flashcards']), true);
      assert.equal(isValidStudyPreferences([]), true);
    });

    it('rejects unknown or malformed values', () => {
      assert.equal(isValidStudyPreferences(['not-a-pref']), false);
      assert.equal(isValidStudyPreferences('mcqs'), false);
      assert.equal(isValidStudyPreferences(undefined), false);
    });
  });

  describe('formatExamDate', () => {
    it('formats a valid date for human display', () => {
      assert.equal(formatExamDate('2026-12-15'), 'December 15, 2026');
    });

    it('returns em dash when unset', () => {
      assert.equal(formatExamDate(undefined), '—');
      assert.equal(formatExamDate(''), '—');
    });
  });

  describe('day-aware exam date helpers', () => {
    it('extracts day/month/year from a date key', () => {
      assert.equal(getExamDay('2026-12-15'), 15);
      assert.equal(getExamMonth('2026-12-15'), 11);
      assert.equal(getExamYear('2026-12-15'), 2026);
      assert.equal(getExamDay(''), null);
      assert.equal(getExamMonth(undefined), null);
    });

    it('counts days per month including leap years', () => {
      assert.equal(daysInMonth(0, 2026), 31);
      assert.equal(daysInMonth(1, 2026), 28);
      assert.equal(daysInMonth(1, 2024), 29);
      assert.equal(daysInMonth(3, 2026), 30);
    });

    it('builds a zero-padded full date', () => {
      assert.equal(buildFullExamDate(15, 11, 2026), '2026-12-15');
      assert.equal(buildFullExamDate(5, 0, 2027), '2027-01-05');
    });

    it('clamps the day to the month length', () => {
      assert.equal(buildFullExamDate(31, 1, 2026), '2026-02-28');
      assert.equal(buildFullExamDate(31, 11, 2026), '2026-12-31');
    });

    it('validates a future or today date as usable', () => {
      const from = new Date(2026, 0, 15);
      assert.equal(isValidExamMonthDayYear(0, 15, 2026, from), true); // today
      assert.equal(isValidExamMonthDayYear(0, 16, 2026, from), true); // future
      assert.equal(isValidExamMonthDayYear(0, 14, 2026, from), false); // past
      assert.equal(isValidExamMonthDayYear(11, 10, 2027, from), true); // future year
    });
  });

  describe('option integrity', () => {
    it('keeps option labels consistent with label maps', () => {
      for (const stage of PREPARATION_STAGE_OPTIONS) {
        assert.equal(PREPARATION_STAGE_LABELS[stage.id], stage.label);
      }
      for (const pref of STUDY_PREFERENCES_OPTIONS) {
        assert.equal(STUDY_PREFERENCE_LABELS[pref.id], pref.label);
      }
    });

    it('sorts target scores ascending', () => {
      const sorted = [...TARGET_SCORE_OPTIONS].sort((a, b) => a - b);
      assert.deepEqual(TARGET_SCORE_OPTIONS, sorted);
    });
  });
});