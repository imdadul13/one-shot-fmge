import { StudyPreferenceKey, OnboardingPreparationStage } from '../types';
import { getDaysUntilDateKey, getLocalDateKey } from './date';

/**
 * Onboarding helpers — pure logic kept separate from UI so it can be unit tested
 * independently of React components and the auth/Firestore layer.
 */

export const FMGE_PASS_MARK = 150;
export const FMGE_MAX_SCORE = 300;

export const TARGET_SCORE_OPTIONS = [150, 180, 200, 220, 240, 250, 260, 270, 280, 290, 300];

export const DAILY_STUDY_HOURS_OPTIONS = [2, 3, 4, 5, 6, 7, 8];

export const PREPARATION_STAGE_OPTIONS: Array<{
  id: OnboardingPreparationStage;
  label: string;
  description: string;
}> = [
  { id: 'just_starting', label: 'Just starting', description: 'Beginning my subjects from scratch' },
  { id: 'building_foundation', label: 'Building my foundation', description: 'Working through core subjects' },
  { id: 'most_subjects_completed', label: "Most subjects completed", description: 'Nearly done with all subjects' },
  { id: 'in_revision', label: "I'm in revision", description: 'Consolidating and retaining what I learned' },
  { id: 'mostly_mcqs_gt', label: 'Mostly MCQs / GTs', description: 'Focusing on questions and grand tests' },
  { id: 'final_revision', label: 'Final revision', description: 'High-yield rapid review before the exam' },
];

export const STUDY_PREFERENCES_OPTIONS: Array<{ id: StudyPreferenceKey; label: string }> = [
  { id: 'high_yield_notes', label: 'High-yield notes' },
  { id: 'clinical_cases', label: 'Clinical cases' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'mcqs', label: 'MCQs' },
  { id: 'grand_tests', label: 'Grand tests' },
  { id: 'videos_lectures', label: 'Videos / lectures' },
  { id: 'rapid_revision', label: 'Rapid revision' },
];

/**
 * Days remaining to an exam date, computed consistently in the local timezone.
 * Never hardcoded — always derived from the stored exam date.
 *
 * @param examDate A `YYYY-MM-DD` string, or empty/undefined when the user has
 *                 not picked a date yet.
 * @returns The number of full days remaining (>= 0). Returns `null` when no
 *          valid date is provided or the date has already passed, so callers
 *          can decide how to render gracefully.
 */
export function getDaysRemaining(examDate?: string | null, from: Date = new Date()): number | null {
  if (!examDate) return null;
  const parsed = parseLocalDate(examDate);
  if (!parsed) return null;
  const remaining = getDaysUntilDateKey(examDate, from);
  if (remaining <= 0) return null; // already passed or today isn't a usable runway in this helper
  return remaining;
}

/** Parse a `YYYY-MM-DD` string into a local-time Date, or null if invalid. */
export function parseLocalDate(dateKey: string): Date | null {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (![year, month, day].every(Number.isFinite)) return null;
  const d = new Date(year, month - 1, day);
  if (Number.isNaN(d.getTime())) return null;
  // Guard against rollover (e.g. 2026-02-31 -> 2026-03-03).
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d;
}

/** Whether the date is set and in the future (usable as an exam target). */
export function isUsableExamDate(examDate?: string | null): boolean {
  if (!examDate) return false;
  const parsed = parseLocalDate(examDate);
  if (!parsed) return false;
  const today = getLocalDateKey();
  return examDate >= today;
}

export function isValidTargetScore(value: number | undefined | null): boolean {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= FMGE_PASS_MARK &&
    value <= FMGE_MAX_SCORE
  );
}

export function isValidDailyStudyHours(value: number | undefined | null): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= 2 && value <= 8;
}

export function isValidBaselineScore(value: number | undefined | null): boolean {
  if (value === undefined || value === null) return true; // optional
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= FMGE_MAX_SCORE
  );
}

export function isValidPreparationStage(value: unknown): value is OnboardingPreparationStage {
  return PREPARATION_STAGE_OPTIONS.some((o) => o.id === value);
}

export function isValidStudyPreferences(value: unknown): value is StudyPreferenceKey[] {
  return (
    Array.isArray(value) &&
    value.every((v) => STUDY_PREFERENCES_OPTIONS.some((o) => o.id === v))
  );
}

/** Format a `YYYY-MM-DD` string into a human-friendly date, e.g. "December 15, 2026". */
export function formatExamDate(examDate?: string | null): string {
  if (!examDate) return '—';
  const parsed = parseLocalDate(examDate);
  if (!parsed) return examDate;
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export const PREPARATION_STAGE_LABELS: Record<OnboardingPreparationStage, string> = {
  just_starting: 'Just starting',
  building_foundation: 'Building my foundation',
  most_subjects_completed: 'Most subjects completed',
  in_revision: "I'm in revision",
  mostly_mcqs_gt: 'Mostly MCQs / GTs',
  final_revision: 'Final revision',
};

export const STUDY_PREFERENCE_LABELS: Record<StudyPreferenceKey, string> = {
  high_yield_notes: 'High-yield notes',
  clinical_cases: 'Clinical cases',
  flashcards: 'Flashcards',
  mcqs: 'MCQs',
  grand_tests: 'Grand tests',
  videos_lectures: 'Videos / lectures',
  rapid_revision: 'Rapid revision',
};

/** Full month names, index-aligned (0 = January). */
export const MONTH_NAMES: string[] = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Short month labels, index-aligned (0 = Jan). */
export const MONTHS_SHORT: string[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Month of the stored exam date (0-11), or null when unset/invalid. */
export function getExamMonth(examDate?: string | null): number | null {
  const parsed = parseLocalDate(examDate ?? '');
  return parsed ? parsed.getMonth() : null;
}

/** Year of the stored exam date, or null when unset/invalid. */
export function getExamYear(examDate?: string | null): number | null {
  const parsed = parseLocalDate(examDate ?? '');
  return parsed ? parsed.getFullYear() : null;
}

/** Day-of-month (1-31) of the stored exam date, or null when unset/invalid. */
export function getExamDay(examDate?: string | null): number | null {
  const parsed = parseLocalDate(examDate ?? '');
  return parsed ? parsed.getDate() : null;
}

/** Number of days in a given month (handles leap years). */
export function daysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Build a `YYYY-MM-DD` exam date from an explicit day + month + year
 * (local-timezone-safe). The day is clamped to the month's length.
 */
export function buildFullExamDate(day: number, month: number, year: number): string {
  const clamp = Math.min(Math.max(day, 1), daysInMonth(month, year));
  const dd = String(clamp).padStart(2, '0');
  const mm = String(month + 1).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/**
 * Whether a specific day/month/year is usable as an exam target (not in the past).
 * The exact date must be today or in the future.
 */
export function isValidExamMonthDayYear(
  month: number,
  day: number,
  year: number,
  from: Date = new Date()
): boolean {
  const date = new Date(year, month, day);
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return date.getTime() >= today.getTime();
}

/**
 * Build a `YYYY-MM-DD` exam date from an explicit month + year. Uses the first day
 * of the selected month as a stable representative date (local-timezone-safe), so
 * the countdown is deterministic and the value round-trips through month/year cleanly.
 */
export function buildExamDate(month: number, year: number): string {
  const mm = String(month + 1).padStart(2, '0');
  return `${year}-${mm}-01`;
}

/**
 * Whether a chosen month/year is usable as an exam target (not in the past).
 * Compare on the first-of-month boundary so "current month" stays selectable.
 */
export function isValidExamMonthYear(month: number, year: number, from: Date = new Date()): boolean {
  const firstOfMonth = new Date(year, month, 1);
  const today = new Date(from.getFullYear(), from.getMonth(), 1);
  return firstOfMonth.getTime() >= today.getTime();
}
