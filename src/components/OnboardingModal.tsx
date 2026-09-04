import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  Target,
  Clock,
  BookOpen,
  Check,
  ArrowRight,
  ArrowLeft,
  Flame,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const OnboardingModal: React.FC = () => {
  const { profile, completeOnboarding } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [examDate, setExamDate] = useState(profile?.examDate || '2026-12-15');
  const [targetScore, setTargetScore] = useState<number>(profile?.targetScore || 185);
  const [prepLevel, setPrepLevel] = useState<'beginner' | 'intermediate' | 'revision'>('intermediate');
  const [dailyHours, setDailyHours] = useState<number>(profile?.dailyHoursTarget || 6);
  const [coachingSource, setCoachingSource] = useState<string>(
    profile?.preferences?.coachingSource || 'Marrow'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReadyScreen, setIsReadyScreen] = useState(false);

  const platforms = ['Marrow', 'Prepladder', 'Cerebellum', 'DAMS', 'Bhatia', 'Self Study'];

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await completeOnboarding(examDate, targetScore, dailyHours, { source: 'onboarding-modal' });
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const daysRemaining = Math.max(
    1,
    Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm font-['Plus_Jakarta_Sans']">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {!isReadyScreen ? (
          <>
            {/* Header & Step Indicator */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white font-bold font-['Outfit'] text-xs">
                  1S
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 font-['Outfit']">Personalize Your FMGE Plan</h2>
                  <p className="text-[11px] text-slate-500">Welcome, {profile?.displayName || 'Doctor'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-full text-xs font-bold text-slate-700">
                <span>Step {step} of 5</span>
              </div>
            </div>

            {/* Step Progress Line */}
            <div className="h-1 w-full bg-slate-100">
              <div
                className="h-full bg-slate-900 transition-all duration-300"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>

            {/* Step Content */}
            <div className="p-6 space-y-6">
              {/* STEP 1: Exam Date */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Step 1 — Timeline</span>
                    <h3 className="text-xl font-bold font-['Outfit'] text-slate-900">When is your target FMGE exam?</h3>
                    <p className="text-xs text-slate-500">We calibrate your daily revision rhythm and backward pacing based on days remaining.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Exam Date</label>
                    <input
                      type="date"
                      required
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                    <p className="text-xs text-slate-400 mt-2">
                      Estimated: <span className="font-bold text-slate-800">{daysRemaining} days</span> remaining to exam.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 2: Target Score */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Step 2 — Goal</span>
                    <h3 className="text-xl font-bold font-['Outfit'] text-slate-900">What is your target score?</h3>
                    <p className="text-xs text-slate-500">FMGE passing benchmark is 150/300 marks. We recommend aiming for 180+ for safety buffer.</p>
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                      <span className="text-xs font-bold text-slate-600">Target Score</span>
                      <span className="text-2xl font-extrabold font-['Outfit'] text-slate-900">{targetScore} <span className="text-sm font-normal text-slate-500">/ 300</span></span>
                    </div>
                    <input
                      type="range"
                      min={150}
                      max={260}
                      step={5}
                      value={targetScore}
                      onChange={(e) => setTargetScore(Number(e.target.value))}
                      className="w-full accent-slate-900 cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                      <span>150 (Passing Cutoff)</span>
                      <span>185 (Recommended)</span>
                      <span>250+ (High Rank)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Current Prep Level */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Step 3 — Baseline</span>
                    <h3 className="text-xl font-bold font-['Outfit'] text-slate-900">What is your current preparation stage?</h3>
                    <p className="text-xs text-slate-500">Helps the Adaptive Priority Engine prioritize 1st-read vs high-yield drills.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 pt-1">
                    {[
                      { id: 'beginner', label: 'Starting 1st Read', desc: 'Covering core clinical subjects for the first time' },
                      { id: 'intermediate', label: 'Mid-Preparation (Active Practice)', desc: 'Completed major subjects, focusing on QBanks and GTs' },
                      { id: 'revision', label: 'Final Revision & High-Yield', desc: 'Rapid 10-MCQ drills, Error Vault, and GT remediation' },
                    ].map((lvl) => (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setPrepLevel(lvl.id as any)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          prepLevel === lvl.id
                            ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900">{lvl.label}</p>
                          <p className="text-[11px] text-slate-500">{lvl.desc}</p>
                        </div>
                        {prepLevel === lvl.id && <Check className="h-4 w-4 text-slate-900 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: Daily Study Hours */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Step 4 — Study Rhythm</span>
                    <h3 className="text-xl font-bold font-['Outfit'] text-slate-900">How many hours can you study daily?</h3>
                    <p className="text-xs text-slate-500">We size your Daily Mission tasks to fit comfortably in your study budget.</p>
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                      <span className="text-xs font-bold text-slate-600">Daily Study Target</span>
                      <span className="text-2xl font-extrabold font-['Outfit'] text-slate-900">{dailyHours} <span className="text-sm font-normal text-slate-500">hours/day</span></span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={12}
                      step={1}
                      value={dailyHours}
                      onChange={(e) => setDailyHours(Number(e.target.value))}
                      className="w-full accent-slate-900 cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                      <span>2 hrs (Light)</span>
                      <span>6-8 hrs (Standard)</span>
                      <span>12 hrs (Full-Time)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Resources */}
              {step === 5 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Step 5 — Resources</span>
                    <h3 className="text-xl font-bold font-['Outfit'] text-slate-900">What is your primary coaching source?</h3>
                    <p className="text-xs text-slate-500">Optional tag to organize notes and question cross-references.</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                    {platforms.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCoachingSource(p)}
                        className={`p-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                          coachingSource === p
                            ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>
              ) : (
                <span className="text-xs text-slate-400 font-medium">ONE SHOT Setup</span>
              )}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 transition-all shadow-xs cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsReadyScreen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 transition-all shadow-xs cursor-pointer"
                >
                  <span>Build My Plan</span>
                  <Sparkles className="h-3.5 w-3.5 text-sky-300" />
                </button>
              )}
            </div>
          </>
        ) : (
          /* COMPLETION SCREEN */
          <div className="p-8 text-center space-y-6">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-white font-['Outfit'] text-2xl font-bold shadow-md">
              1S
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Calibration Complete</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-['Outfit'] text-slate-900 tracking-tight">
                YOUR FMGE PLAN IS READY
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                Synthesized 19 FMGE subjects, 200 topics, and calibrated your personalized daily mission.
              </p>
            </div>

            {/* Plan Highlights */}
            <div className="grid grid-cols-3 gap-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left">
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Days Left</span>
                <span className="text-base font-extrabold font-['Outfit'] text-slate-900">{daysRemaining}d</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Target Score</span>
                <span className="text-base font-extrabold font-['Outfit'] text-slate-900">{targetScore}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Daily Target</span>
                <span className="text-base font-extrabold font-['Outfit'] text-slate-900">{dailyHours}h / day</span>
              </div>
            </div>

            {/* First Priority Task Highlight */}
            <div className="p-4 rounded-2xl border border-sky-100 bg-sky-50 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">First Priority Recommendation</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">Cardiology — ECGs &amp; STEMI (Medicine 35M)</p>
              <p className="text-xs text-slate-600 mt-0.5">Highest yield Mega-4 core gap. Rapid 10-MCQ session ready.</p>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinish}
              className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold font-['Outfit'] py-3.5 text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Finalizing Setup...' : "Start Today's Plan"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
