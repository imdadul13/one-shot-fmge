import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Target,
  Gauge,
  Clock,
  Layers,
  TrendingUp,
} from 'lucide-react';
import OneShotLogo from './OneShotLogo';
import { useAuth } from '../context/AuthContext';
import {
  OnboardingPreparationStage,
  StudyPreferenceKey,
} from '../types';
import {
  getDaysRemaining,
  formatExamDate,
  isValidTargetScore,
  isValidBaselineScore,
  isValidDailyStudyHours,
  isUsableExamDate,
  getExamMonth,
  getExamYear,
  getExamDay,
  buildFullExamDate,
  isValidExamMonthYear,
  isValidExamMonthDayYear,
  daysInMonth,
  MONTH_NAMES,
  TARGET_SCORE_OPTIONS,
  DAILY_STUDY_HOURS_OPTIONS,
  PREPARATION_STAGE_OPTIONS,
  STUDY_PREFERENCES_OPTIONS,
  PREPARATION_STAGE_LABELS,
} from '../utils/onboarding';

type StepId =
  | 'welcome'
  | 'examDate'
  | 'targetScore'
  | 'preparationStage'
  | 'dailyStudyHours'
  | 'studyPreferences'
  | 'baseline'
  | 'building'
  | 'ready';

const STEP_ORDER: StepId[] = [
  'welcome',
  'examDate',
  'targetScore',
  'preparationStage',
  'dailyStudyHours',
  'studyPreferences',
  'baseline',
  'building',
  'ready',
];

/** Numbered progress indicator counts only the "answer" steps. */
const ANSWER_STEPS: StepId[] = [
  'examDate',
  'targetScore',
  'preparationStage',
  'dailyStudyHours',
  'studyPreferences',
  'baseline',
];

/** Candidate exam years: the current year range, extended via the stepper. */
function buildYearWindow(currentYear: number, startYear: number): number[] {
  return Array.from({ length: 7 }, (_, i) => startYear + i);
}

const CALM_ACCENT = 'text-sky-700';
const CALM_ACCENT_ICON = 'text-sky-700';

export const OnboardingFlow: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const { profile, completeOnboarding, saveOnboardingProgress } = useAuth();
  const reduceMotion = useReducedMotion();

  const [step, setStep] = useState<StepId>('welcome');

  const [examDate, setExamDate] = useState<string>(profile?.examDate || '');
  const [targetScore, setTargetScore] = useState<number | ''>(profile?.targetScore || '');
  const [preparationStage, setPreparationStage] = useState<OnboardingPreparationStage | null>(
    profile?.preparationStage || null
  );
  const [dailyStudyHours, setDailyStudyHours] = useState<number>(
    profile?.dailyHoursTarget || 6
  );
  const [studyPreferences, setStudyPreferences] = useState<StudyPreferenceKey[]>(
    profile?.studyPreferences || []
  );
  const [hasBaseline, setHasBaseline] = useState<boolean>(
    profile?.baselineScore !== undefined && profile?.baselineScore !== null
  );
  const [baselineScore, setBaselineScore] = useState<number | ''>(
    profile?.baselineScore ?? ''
  );
  const [baselineQuestions, setBaselineQuestions] = useState<number | ''>(
    profile?.baselineQuestions ?? 50
  );
  const [coachingSource, setCoachingSource] = useState<string>(
    profile?.preferences?.coachingSource || 'Marrow'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();

  // Month / day / year selection for the exam-date screen. Decoupled from the
  // persisted examDate string: we only push decisions INTO examDate, never read
  // them back reactively (which would lock the UI against further changes).
  const initialMonth = useMemo(() => getExamMonth(profile?.examDate), [profile]);
  const initialYear = useMemo(() => getExamYear(profile?.examDate) ?? currentYear, [profile, currentYear]);
  const initialDay = useMemo(() => getExamDay(profile?.examDate), [profile]);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(initialMonth);
  const [selectedYear, setSelectedYear] = useState<number | null>(initialYear);
  const [selectedDay, setSelectedDay] = useState<number | null>(initialDay);
  const [yearStart, setYearStart] = useState<number>(() => initialYear - 3);

  const stepIndex = STEP_ORDER.indexOf(step);
  const answerIndex = ANSWER_STEPS.indexOf(step);
  const answerProgress = answerIndex === -1 ? null : answerIndex;
  const totalSteps = ANSWER_STEPS.length;

  const daysRemaining = useMemo(() => getDaysRemaining(examDate), [examDate]);

  const togglePreference = (key: StudyPreferenceKey) => {
    setStudyPreferences((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Push the chosen month into the examDate, keeping the current year and day
  // (clamped to the new month's length if needed). Never blocks the interaction.
  const selectMonth = (month: number) => {
    const year = selectedYear ?? currentYear;
    const day = selectedDay === null ? 1 : Math.min(selectedDay, daysInMonth(month, year));
    setSelectedMonth(month);
    setSelectedYear(year);
    setSelectedDay(day);
    setExamDate(buildFullExamDate(day, month, year));
  };

  // Push the chosen year into the examDate, keeping the current month and day
  // (clamped to the new month's length if a leap/shorter month shrinks it).
  const selectYear = (year: number) => {
    const month = selectedMonth ?? 0;
    const day = selectedDay === null ? 1 : Math.min(selectedDay, daysInMonth(month, year));
    setSelectedYear(year);
    setSelectedDay(day);
    setExamDate(buildFullExamDate(day, month, year));
  };

  // Push the chosen day into the examDate.
  const selectDay = (day: number) => {
    const month = selectedMonth ?? 0;
    const year = selectedYear ?? currentYear;
    const clamped = Math.min(day, daysInMonth(month, year));
    setSelectedDay(clamped);
    setExamDate(buildFullExamDate(clamped, month, year));
  };

  const selectedDaysInCurrentMonth =
    selectedMonth !== null && selectedYear !== null ? daysInMonth(selectedMonth, selectedYear) : 0;

  const canContinueExamDate =
    selectedMonth !== null &&
    selectedYear !== null &&
    selectedDay !== null &&
    isValidExamMonthDayYear(selectedMonth, selectedDay, selectedYear, now) &&
    isUsableExamDate(examDate);
  const canContinueTargetScore = isValidTargetScore(targetScore === '' ? undefined : targetScore);
  const canContinueHours = isValidDailyStudyHours(dailyStudyHours);

  const goBack = () => {
    setStep(STEP_ORDER[Math.max(0, stepIndex - 1)]);
  };

  const goNext = async () => {
    if (step === 'welcome') {
      setStep('examDate');
      return;
    }
    if (step === 'examDate') {
      if (!canContinueExamDate) return;
      try {
        await saveOnboardingProgress({ examDate, dailyHoursTarget: dailyStudyHours });
      } catch {}
      setStep('targetScore');
      return;
    }
    if (step === 'targetScore') {
      try {
        await saveOnboardingProgress({ targetScore: Number(targetScore) });
      } catch {}
      setStep('preparationStage');
      return;
    }
    if (step === 'preparationStage') {
      if (preparationStage) {
        try {
          await saveOnboardingProgress({ preparationStage });
        } catch {}
      }
      setStep('dailyStudyHours');
      return;
    }
    if (step === 'dailyStudyHours') {
      try {
        await saveOnboardingProgress({ dailyHoursTarget: dailyStudyHours });
      } catch {}
      setStep('studyPreferences');
      return;
    }
    if (step === 'studyPreferences') {
      if (studyPreferences.length > 0) {
        try {
          await saveOnboardingProgress({ studyPreferences });
        } catch {}
      }
      setStep('baseline');
      return;
    }
    if (step === 'baseline') {
      await handleBuildPlan();
    }
  };

  const handleBuildPlan = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await completeOnboarding(examDate, Number(targetScore), dailyStudyHours, {
        source: coachingSource,
        preparationStage: preparationStage || undefined,
        studyPreferences,
        baselineScore: hasBaseline && baselineScore !== '' ? Number(baselineScore) : undefined,
        baselineQuestions: hasBaseline && baselineQuestions !== '' ? Number(baselineQuestions) : undefined,
      });
      setStep('building');
      // Brief, deterministic "building" transition. Kept short; not a routing mechanism.
      await new Promise((r) => setTimeout(r, reduceMotion ? 80 : 900));
      setStep('ready');
      onComplete?.();
    } catch (err) {
      console.error('Failed to save onboarding:', err);
      setSaveError("Couldn't save your plan. Please try again.");
      setStep('baseline');
      setIsSaving(false);
    }
  };

  const finish = async () => {
    onComplete?.();
  };

  const years = useMemo(() => buildYearWindow(currentYear, yearStart), [yearStart, currentYear]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F7F9F8] selection:bg-[#89f5e7] selection:text-[#00201d]">
      {/* Header / progress — stays fixed at the top */}
      <header className="shrink-0 w-full max-w-3xl mx-auto px-5 sm:px-8 pt-[calc(env(safe-area-inset-top)+1.25rem)] sm:pt-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <OneShotLogo variant="compact" />
        </div>

        <div className="flex items-center gap-3">
          {answerProgress !== null && answerProgress < totalSteps - 1 && (
            <span className="text-xs font-semibold font-mono text-slate-400 tabular-nums">
              {String(answerProgress + 1).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')}
            </span>
          )}
          {answerProgress !== null && answerProgress >= totalSteps - 1 && (
            <span className="text-xs font-mono tabular-nums text-emerald-600 font-semibold">
              Final step
            </span>
          )}
        </div>
      </header>

      {/* Thin progress bar */}
      <div className="shrink-0 w-full max-w-3xl mx-auto px-5 sm:px-8 pt-4">
        <div className="h-[3px] w-full rounded-full bg-slate-200/80 overflow-hidden">
          <motion.div
            className="h-full bg-slate-900 rounded-full"
            initial={false}
            animate={{
              width: answerProgress === null ? '0%' : `${((answerProgress + 1) / totalSteps) * 100}%`,
            }}
            transition={{ duration: reduceMotion ? 0 : 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Scrollable body — flex-1 with min-h-0 so it scrolls on short viewports */}
      <main className="min-h-0 flex-1 overflow-y-auto px-5 sm:px-8 py-8">
        <div className="w-full max-w-xl mx-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
            >
              {/* SCREEN 1 — WELCOME */}
              {step === 'welcome' && (
                <div className="space-y-8 text-center pt-6 sm:pt-10">
                  <div className="space-y-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-sky-50 text-sky-800 text-[11px] font-semibold tracking-wide">
                      Personalized setup
                    </span>
                    <h1 className="font-['Outfit'] text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                      Build your FMGE plan.
                    </h1>
                    <p className="text-sm sm:text-[15px] text-slate-500 max-w-md mx-auto leading-relaxed">
                      A few focused questions about your exam date, your goal, and where you are
                      in your preparation. It takes under two minutes.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('examDate')}
                    className="group inline-flex items-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-sm font-semibold text-white hover:bg-slate-800 active:scale-[0.99] transition-all disabled:opacity-40 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2"
                  >
                    Get Started
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              )}

              {/* SCREEN 2 — EXAM DATE (custom month/year selector) */}
              {step === 'examDate' && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <div className={`flex items-center gap-2 ${CALM_ACCENT}`}>
                      <CalendarDays className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        Exam date
                      </span>
                    </div>
                    <h2 className="font-['Outfit'] text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 leading-tight">
                      When is your FMGE?
                    </h2>
                    <p className="text-sm text-slate-500">
                      Choose the month and year. We'll pace your plan around your countdown.
                    </p>
                  </div>

                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={examDate || 'none'}
                      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.2 }}
                      className="rounded-2xl border border-slate-200 bg-white p-5"
                    >
                      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1">
                        Selected exam date
                      </p>
                      <p className="font-['Outfit'] text-xl font-bold text-slate-900 tabular-nums">
                        {examDate ? formatExamDate(examDate) : 'Not selected yet'}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-sm">
                        {daysRemaining !== null && daysRemaining >= 0 ? (
                          <>
                            <span className="font-semibold text-slate-900">{daysRemaining} days</span>
                            <span className="text-slate-400">remaining from today</span>
                          </>
                        ) : (
                          <span className="text-slate-400">Pick a date to see your countdown.</span>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Month grid */}
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">Month</p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {MONTH_NAMES.map((name, m) => {
                        const disabled =
                          !selectedYear ||
                          !isValidExamMonthYear(m, selectedYear, now);
                        const active = selectedMonth === m;
                        return (
                          <button
                            key={name}
                            type="button"
                            disabled={disabled}
                            onClick={() => selectMonth(m)}
                            aria-pressed={active}
                            className={`h-11 rounded-xl border text-[13px] font-semibold transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-1 ${
                              active
                                ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {MONTH_NAMES[m].slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Day grid — only enabled once a month is chosen */}
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">Day</p>
                    {selectedMonth === null || selectedYear === null ? (
                      <p className="text-xs text-slate-400">
                        Choose a month and year first.
                      </p>
                    ) : (
                      <div className="grid grid-cols-8 gap-1.5">
                        {Array.from({ length: selectedDaysInCurrentMonth }, (_, i) => i + 1).map(
                          (d) => {
                            const disabled =
                              !isValidExamMonthDayYear(selectedMonth!, d, selectedYear!, now);
                            const active = selectedDay === d;
                            return (
                              <button
                                key={d}
                                type="button"
                                disabled={disabled}
                                onClick={() => selectDay(d)}
                                aria-pressed={active}
                                className={`h-10 rounded-lg border text-sm font-semibold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-1 ${
                                  active
                                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {d}
                              </button>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>

                  {/* Year grid */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-600">Year</p>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setYearStart((y) => y - 7)}
                          aria-label="Earlier years"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setYearStart((y) => y + 7)}
                          aria-label="Later years"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {years.map((year) => {
                        // A year is selectable if it's the current year or later;
                        // the per-month grid handles which months within it are
                        // still in the future. (Gating on January would wrongly
                        // lock out the current year once Jan has passed.)
                        const disabled = year < currentYear;
                        const active = selectedYear === year;
                        return (
                          <button
                            key={year}
                            type="button"
                            disabled={disabled}
                            onClick={() => selectYear(year)}
                            aria-pressed={active}
                            className={`h-11 rounded-xl border text-sm font-semibold transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-1 ${
                              active
                                ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {year}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setExamDate('');
                      setSelectedMonth(null);
                      setSelectedYear(currentYear);
                      setSelectedDay(null);
                    }}
                    className={`text-xs font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 rounded ${
                      !examDate
                        ? 'text-slate-900 border-b border-slate-900'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    I haven't decided yet
                  </button>
                </div>
              )}

              {/* SCREEN 3 — TARGET SCORE */}
              {step === 'targetScore' && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Target className={`h-4 w-4 ${CALM_ACCENT_ICON}`} />
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        Target score
                      </span>
                    </div>
                    <h2 className="font-['Outfit'] text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 leading-tight">
                      What score are you aiming for?
                    </h2>
                    <p className="text-sm text-slate-500">
                      Passing is 150/300. Your target calibrates your chapter priorities.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {TARGET_SCORE_OPTIONS.map((score) => {
                      const active = targetScore === score;
                      return (
                        <button
                          key={score}
                          type="button"
                          onClick={() => setTargetScore(score)}
                          aria-pressed={active}
                          className={`h-12 rounded-xl border text-sm font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-1 ${
                            active
                              ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {score}+
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-2">
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-600">
                        Or enter a custom score (/300)
                      </span>
                      <input
                        type="number"
                        min={150}
                        max={300}
                        value={targetScore === '' ? '' : targetScore}
                        onChange={(e) =>
                          setTargetScore(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        className="mt-1.5 w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-700/10 placeholder:text-slate-400"
                        placeholder="e.g. 235"
                      />
                    </label>
                    {targetScore !== '' && !isValidTargetScore(targetScore) && (
                      <p className="text-xs font-semibold text-rose-600">
                        Target must be between 150 and 300.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* SCREEN 4 — PREPARATION STAGE */}
              {step === 'preparationStage' && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Gauge className={`h-4 w-4 ${CALM_ACCENT_ICON}`} />
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        Preparation
                      </span>
                    </div>
                    <h2 className="font-['Outfit'] text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 leading-tight">
                      Where are you right now?
                    </h2>
                    <p className="text-sm text-slate-500">
                      This helps us shape what you focus on next.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {PREPARATION_STAGE_OPTIONS.map((option) => {
                      const active = preparationStage === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setPreparationStage(option.id)}
                          aria-pressed={active}
                          className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-1 ${
                            active
                              ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-900">{option.label}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{option.description}</p>
                          </div>
                          {active && <Check className="h-4 w-4 text-slate-900 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SCREEN 5 — DAILY STUDY HOURS */}
              {step === 'dailyStudyHours' && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Clock className={`h-4 w-4 ${CALM_ACCENT_ICON}`} />
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        Study time
                      </span>
                    </div>
                    <h2 className="font-['Outfit'] text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 leading-tight">
                      How much time per day?
                    </h2>
                    <p className="text-sm text-slate-500">
                      We'll size your daily workload to fit, whatever your schedule allows.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {DAILY_STUDY_HOURS_OPTIONS.map((hours) => {
                      const active = dailyStudyHours === hours;
                      return (
                        <button
                          key={hours}
                          type="button"
                          onClick={() => setDailyStudyHours(hours)}
                          aria-pressed={active}
                          className={`rounded-xl border text-center transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-1 ${
                            active
                              ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="block py-3 font-['Outfit'] text-lg font-bold">{hours}</span>
                          <span className="block pb-2.5 text-[10px] font-semibold uppercase tracking-wide opacity-70">
                            hrs / day
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SCREEN 6 — STUDY PREFERENCES */}
              {step === 'studyPreferences' && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Layers className={`h-4 w-4 ${CALM_ACCENT_ICON}`} />
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        Preferences
                      </span>
                    </div>
                    <h2 className="font-['Outfit'] text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 leading-tight">
                      How do you learn best?
                    </h2>
                    <p className="text-sm text-slate-500">
                      Select all that apply — we'll tailor recommendations to match.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {STUDY_PREFERENCES_OPTIONS.map((pref) => {
                      const active = studyPreferences.includes(pref.id);
                      return (
                        <button
                          key={pref.id}
                          type="button"
                          onClick={() => togglePreference(pref.id)}
                          aria-pressed={active}
                          className={`p-3.5 rounded-2xl border text-sm font-semibold transition-all flex items-center justify-between cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-1 ${
                            active
                              ? 'border-slate-900 bg-slate-50 text-slate-900 ring-1 ring-slate-900'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>{pref.label}</span>
                          <span
                            className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${
                              active ? 'bg-slate-900 border-slate-900' : 'border-slate-300'
                            }`}
                          >
                            {active && <Check className="h-3.5 w-3.5 text-white" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SCREEN 7 — OPTIONAL BASELINE */}
              {step === 'baseline' && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <TrendingUp className={`h-4 w-4 ${CALM_ACCENT_ICON}`} />
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        Baseline
                      </span>
                    </div>
                    <h2 className="font-['Outfit'] text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 leading-tight">
                      Have you taken a Grand Test lately?
                    </h2>
                    <p className="text-sm text-slate-500">
                      Optional — an approximate score helps us gauge where you stand.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setHasBaseline(true)}
                      aria-pressed={hasBaseline}
                      className={`h-12 rounded-xl border text-sm font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-1 ${
                        hasBaseline
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHasBaseline(false);
                        setBaselineScore('');
                      }}
                      aria-pressed={!hasBaseline}
                      className={`h-12 rounded-xl border text-sm font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-1 ${
                        !hasBaseline
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      No
                    </button>
                  </div>

                  {hasBaseline && (
                    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
                      <label className="block">
                        <span className="text-xs font-semibold text-slate-600">
                          Approx. Grand Test score (/300)
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={300}
                          value={baselineScore === '' ? '' : baselineScore}
                          onChange={(e) =>
                            setBaselineScore(e.target.value === '' ? '' : Number(e.target.value))
                          }
                          className="mt-1.5 w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-700/10 placeholder:text-slate-400"
                          placeholder="e.g. 165"
                        />
                        {baselineScore !== '' && !isValidBaselineScore(baselineScore) && (
                          <p className="text-xs font-semibold text-rose-600 mt-1">
                            Score must be between 0 and 300.
                          </p>
                        )}
                      </label>

                      <label className="block">
                        <span className="text-xs font-semibold text-slate-600">
                          About how many questions did you answer?
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={1000}
                          value={baselineQuestions === '' ? '' : baselineQuestions}
                          onChange={(e) =>
                            setBaselineQuestions(
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          className="mt-1.5 w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-700/10 placeholder:text-slate-400"
                          placeholder="e.g. 100"
                        />
                      </label>
                    </div>
                  )}

                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600">
                      Primary coaching platform (optional)
                    </span>
                    <select
                      value={coachingSource}
                      onChange={(e) => setCoachingSource(e.target.value)}
                      className="mt-1.5 w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-700/10 cursor-pointer"
                    >
                      <option value="Marrow">Marrow</option>
                      <option value="Marrow / Prepladder">Marrow / Prepladder</option>
                      <option value="Prepladder">Prepladder</option>
                      <option value="Cerebellum">Cerebellum</option>
                      <option value="DAMS">DAMS</option>
                      <option value="Bhatia">Bhatia</option>
                      <option value="Self Study / Standard Textbooks">Self Study / Standard Textbooks</option>
                    </select>
                  </label>
                </div>
              )}

              {/* SCREEN 8 — BUILDING */}
              {step === 'building' && (
                <div className="text-center space-y-5 py-10">
                  <div className="flex items-center justify-center gap-2 text-slate-500">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-2 w-2 rounded-full bg-slate-400"
                        animate={reduceMotion ? {} : { opacity: [0.3, 1, 0.3], scale: [0.9, 1, 0.9] }}
                        transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
                      />
                    ))}
                  </div>
                  <div>
                    <h2 className="font-['Outfit'] text-2xl font-bold tracking-tight text-slate-900">
                      Building your FMGE roadmap
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Weighing exam distance, your target, and your starting point.
                    </p>
                  </div>
                </div>
              )}

              {/* SCREEN 9 — PLAN READY */}
              {step === 'ready' && (
                <div className="space-y-6 pt-4">
                  <div className="space-y-2 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                      <Check className="h-3 w-3" />
                      Your plan is ready
                    </span>
                    <h2 className="font-['Outfit'] text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 leading-tight">
                      Your FMGE plan is set.
                    </h2>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">
                      Here's the roadmap we've built around your exam.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 text-sm">
                    <div className="bg-white p-4">
                      <p className="text-[10px] font-mono uppercase text-slate-400">Exam</p>
                      <p className="font-bold text-slate-900 mt-0.5">{formatExamDate(examDate)}</p>
                    </div>
                    <div className="bg-white p-4">
                      <p className="text-[10px] font-mono uppercase text-slate-400">Days remaining</p>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {daysRemaining !== null && daysRemaining >= 0 ? daysRemaining : '—'} days
                      </p>
                    </div>
                    <div className="bg-white p-4">
                      <p className="text-[10px] font-mono uppercase text-slate-400">Target</p>
                      <p className="font-bold text-slate-900 mt-0.5">{targetScore}+</p>
                    </div>
                    <div className="bg-white p-4">
                      <p className="text-[10px] font-mono uppercase text-slate-400">Daily study</p>
                      <p className="font-bold text-slate-900 mt-0.5">{dailyStudyHours}h / day</p>
                    </div>
                    <div className="bg-white p-4 col-span-2">
                      <p className="text-[10px] font-mono uppercase text-slate-400">Preparation stage</p>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {preparationStage ? PREPARATION_STAGE_LABELS[preparationStage] : '—'}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 text-center leading-relaxed max-w-sm mx-auto">
                    ONE SHOT FMGE will use this to prioritize what to study, revise, and practice.
                  </p>

                  <button
                    type="button"
                    onClick={finish}
                    className="w-full rounded-full bg-slate-900 py-4 text-sm font-semibold text-white hover:bg-slate-800 active:scale-[0.99] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2"
                  >
                    Start Studying
                    <ArrowRight className="h-4 w-4 inline ml-2" />
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Action bar — stays reachable; content scrolls above it */}
      {step !== 'welcome' && step !== 'building' && step !== 'ready' && (
        <footer className="shrink-0 w-full bg-[#F7F9F8]/95 backdrop-blur-sm border-t border-[#DCE4E1]/70 px-5 sm:px-8 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-4">
          <div className="w-full max-w-3xl mx-auto">
            {saveError && (
              <p className="mb-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold p-3">
                {saveError}
              </p>
            )}
            <div className="flex items-center justify-between gap-3">
              {stepIndex > 0 ? (
                <button
                  type="button"
                  onClick={goBack}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 rounded"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <span />
              )}

              <button
                type="button"
                onClick={goNext}
                disabled={
                  isSaving ||
                  (step === 'examDate' && !canContinueExamDate) ||
                  (step === 'targetScore' && !canContinueTargetScore)
                }
                className="group inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2"
              >
                {isSaving ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Saving&hellip;
                  </>
                ) : step === 'baseline' ? (
                  <>Build My Plan</>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* Ready screen: no persistent action bar; content owns its CTA. */}
      {step === 'ready' && (
        <footer className="shrink-0 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]" />
      )}
    </div>
  );
};
