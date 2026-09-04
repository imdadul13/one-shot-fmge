import React, { useState } from 'react';
import { Sparkles, Calendar, Target, Clock, BookOpen, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const OnboardingModal: React.FC = () => {
  const { profile, completeOnboarding } = useAuth();
  
  const [examDate, setExamDate] = useState(profile?.examDate || '2026-10-15');
  const [targetScore, setTargetScore] = useState<number>(profile?.targetScore || 185);
  const [dailyHours, setDailyHours] = useState<number>(profile?.dailyHoursTarget || 6);
  const [coachingSource, setCoachingSource] = useState<string>(
    profile?.preferences?.coachingSource || 'Marrow'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await completeOnboarding(examDate, targetScore, dailyHours, coachingSource);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const platforms = ['Marrow', 'Prepladder', 'Cerebellum', 'DAMS', 'Bhatia', 'Self Study'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-[#cfe2df] bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#084d50] to-[#0d6866] p-6 text-white text-center relative">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md mb-2 shadow-inner">
            <Sparkles className="h-6 w-6 text-[#f5d58b]" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Let&apos;s set up your FMGE plan</h2>
          <p className="text-xs text-[#b8ded9] mt-1">
            Welcome, {profile?.displayName || 'Doctor'}. Personalize your timeline and daily rhythm.
          </p>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Target Exam Date */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-[#183d3b] mb-1.5">
              <Calendar className="h-4 w-4 text-[#0d6866]" />
              <span>Target FMGE Exam Date</span>
            </label>
            <input
              type="date"
              required
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full rounded-xl border border-[#cfe2df] bg-[#fbfdfc] px-3.5 py-2.5 text-sm font-medium text-[#183d3b] focus:border-[#0d6866] focus:outline-none focus:ring-2 focus:ring-[#0d6866]/10"
            />
            <p className="text-[11px] text-[#739291] mt-1">
              October 2026 Session (or customized date)
            </p>
          </div>

          {/* Target Score */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-2 text-xs font-bold text-[#183d3b]">
                <Target className="h-4 w-4 text-[#e8806d]" />
                <span>Target Score (out of 300)</span>
              </label>
              <span className="font-mono text-sm font-bold text-[#0d6866]">{targetScore} / 300</span>
            </div>
            <input
              type="range"
              min={150}
              max={260}
              step={5}
              value={targetScore}
              onChange={(e) => setTargetScore(Number(e.target.value))}
              className="w-full accent-[#0d6866] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#739291] font-mono mt-0.5">
              <span>150 (Pass)</span>
              <span>185 (Safe Target)</span>
              <span>220+ (High Rank)</span>
            </div>
          </div>

          {/* Daily Study Hours */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-2 text-xs font-bold text-[#183d3b]">
                <Clock className="h-4 w-4 text-[#0d6866]" />
                <span>Daily Study-Hour Target</span>
              </label>
              <span className="font-mono text-sm font-bold text-[#0d6866]">{dailyHours} hours/day</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[4, 6, 8, 10].map((hours) => (
                <button
                  type="button"
                  key={hours}
                  onClick={() => setDailyHours(hours)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    dailyHours === hours
                      ? 'bg-[#0d6866] text-white border-[#0d6866] shadow-xs'
                      : 'bg-[#f4f9f8] text-[#345856] border-[#cfe2df] hover:bg-[#e6f2f0]'
                  }`}
                >
                  {hours} Hours
                </button>
              ))}
            </div>
          </div>

          {/* Coaching Platform */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-[#183d3b] mb-1.5">
              <BookOpen className="h-4 w-4 text-[#0d6866]" />
              <span>Primary Coaching / QBank Resource</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setCoachingSource(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                    coachingSource === p
                      ? 'bg-[#e5f2ef] text-[#084d50] border-[#0d6866] font-bold'
                      : 'bg-white text-[#527776] border-[#cfe2df] hover:bg-[#f7faf9]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#084d50] px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#063c3e] transition-all disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Launch FMGE Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
