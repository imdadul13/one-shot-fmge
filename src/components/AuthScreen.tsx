import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  Target,
  Zap,
  Copy,
  Check,
  PlayCircle,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { resolveAuthError } from '../utils/authErrors';
import OneShotLogo from './OneShotLogo';

/* ─── ONE SHOT brand mark ─── */
const OneShotMark: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const dims =
    size === 'sm'
      ? 'h-8 w-8'
      : size === 'lg'
      ? 'h-16 w-16'
      : 'h-11 w-11';
  return (
    <OneShotLogo
      variant="icon"
      className={`rounded-2xl shadow-sm shrink-0 ${dims}`}
    />
  );
};

/* ─── Google colour SVG ─── */
const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'h-5 w-5' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

/* ─── Shared input style ─── */
const inputCls =
  'rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:outline-none w-full text-slate-800 placeholder:text-slate-400 transition-all';

/* ─── Decorative right-panel study dashboard illustration (Educational Style) ─── */
const StudyDashIllustration: React.FC = () => (
  <div className="flex flex-col gap-4 w-full max-w-sm mx-auto select-none">
    <div className="flex items-center justify-between mb-1">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Today&apos;s High-Yield Plan</p>
        <p className="text-lg font-bold font-['Outfit'] text-slate-800">Cardiology &amp; Trauma · Day 42</p>
      </div>
      <div className="h-9 w-9 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold text-xs">Dr</div>
    </div>
    {[
      { subject: 'General Medicine', topic: 'ECGs & Arrhythmias', time: '20 min', weight: '35M', bg: 'bg-sky-50 border-sky-100', dot: 'bg-sky-500', badge: 'bg-sky-100 text-sky-700' },
      { subject: 'General Surgery',  topic: 'Trauma & ATLS Protocol', time: '25 min', weight: '35M', bg: 'bg-amber-50 border-amber-100', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' },
      { subject: 'Obstetrics & Gyn', topic: 'Preeclampsia & MgSO4', time: '15 min', weight: '30M', bg: 'bg-rose-50 border-rose-100', dot: 'bg-rose-400', badge: 'bg-rose-100 text-rose-700' },
    ].map((item) => (
      <div key={item.topic} className={`flex items-center gap-3.5 rounded-2xl border ${item.bg} p-3.5 shadow-xs`}>
        <div className={`h-3 w-3 rounded-full ${item.dot} shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-800 truncate">{item.subject}</p>
          <p className="text-[11px] text-slate-500 truncate">{item.topic} · {item.time}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${item.badge}`}>{item.weight}</span>
      </div>
    ))}
    <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-slate-500">Readiness Score</span>
        <span className="text-sm font-extrabold font-['Outfit'] text-slate-900">182 / 300</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full w-[68%] bg-slate-900 rounded-full" />
      </div>
      <div className="flex justify-between items-center mt-2.5">
        <span className="text-[10px] text-slate-400">19 FMGE Subjects Active</span>
        <span className="text-[10px] font-bold text-emerald-600">Passing Track ✓</span>
      </div>
    </div>
  </div>
);

type AuthMode = 'welcome' | 'signin' | 'signup' | 'forgot';

export const AuthScreen: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset, continueAsGuest } = useAuth();

  const [mode, setMode] = useState<AuthMode>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';

  const clearMessages = () => {
    setErrorMsg(null);
    setErrorCode(null);
    setSuccessMsg(null);
  };

  const handleCopyDomain = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentHost);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const handleGoogleSignIn = async () => {
    clearMessages();
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setIsLoading(false);
      const { code, message } = resolveAuthError(err, 'google', currentHost);
      setErrorCode(code);
      setErrorMsg(message);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    clearMessages();
    setIsLoading(true);
    try {
      await signInWithEmail(cleanEmail, password);
    } catch (err: any) {
      setIsLoading(false);
      const { code, message } = resolveAuthError(err, 'signin');
      setErrorCode(code);
      setErrorMsg(message);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanName = displayName.trim();
    if (!cleanEmail || !password) {
      setErrorMsg('Please enter your email and a secure password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password should be at least 6 characters.');
      return;
    }
    clearMessages();
    setIsLoading(true);
    try {
      await signUpWithEmail(cleanEmail, password, cleanName || 'Dr. Aspirant');
    } catch (err: any) {
      setIsLoading(false);
      const { code, message } = resolveAuthError(err, 'signup');
      setErrorCode(code);
      setErrorMsg(message);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Please enter your email address to receive password reset instructions.');
      return;
    }
    clearMessages();
    setIsLoading(true);
    try {
      await sendPasswordReset(cleanEmail);
      setIsLoading(false);
      setSuccessMsg('Password reset link sent! Please check your inbox.');
    } catch (err: any) {
      setIsLoading(false);
      const { code, message } = resolveAuthError(err, 'forgot');
      setErrorCode(code);
      setErrorMsg(message);
    }
  };

  const handleGuestEntry = () => {
    continueAsGuest(displayName.trim() || 'Dr. Aspirant');
  };

  /* ─────────────────────────────────────────────────────────────
     1. WELCOME SCREEN (Inspired by Reference Welcome Design)
  ───────────────────────────────────────────────────────────── */
  if (mode === 'welcome') {
    return (
      <div className="min-h-screen bg-[#F7F9F8] flex flex-col justify-between p-4 sm:p-6 lg:p-10">
        {/* Top Header Brand */}
        <header className="w-full max-w-6xl mx-auto flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <OneShotMark size="md" />
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 font-['Outfit']">ONE SHOT FMGE</span>
              <span className="hidden sm:inline-block ml-2 rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                300 Marks Blueprint
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <ShieldCheck className="h-4 w-4 text-slate-700" />
            <span className="hidden sm:inline">Encrypted Offline &amp; Cloud Sync</span>
          </div>
        </header>

        {/* Main Hero Container */}
        <main className="w-full max-w-6xl mx-auto my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Brand & Actions */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Your FMGE. One focused plan.</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-['Outfit'] text-slate-900 tracking-tight leading-[1.1]">
                Master high-yield topics in one shot.
              </h1>
              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                Know what to study. Practice what matters. Fix what you get wrong. A deterministic, closed-loop system designed for first-attempt FMGE success.
              </p>
            </div>

            {/* 3 Value Propositions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {[
                { title: '19 Subjects', desc: 'NBE weighted blueprint' },
                { title: 'Adaptive Priority', desc: 'Topic priority 0-100' },
                { title: 'Closed-Loop', desc: 'Error Vault remediation' },
              ].map((val) => (
                <div key={val.title} className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <CheckCircle2 className="h-3.5 w-3.5 text-sky-600" />
                    <span>{val.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{val.desc}</p>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setMode('signup');
                }}
                className="flex-1 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 px-6 py-4 text-base font-bold font-['Outfit'] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setMode('signin');
                }}
                className="rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 px-6 py-4 text-base font-semibold transition-all flex items-center justify-center cursor-pointer shadow-xs"
              >
                Sign In
              </button>
            </div>

            {/* Local Practice Mode option */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGuestEntry}
                className="text-xs text-slate-500 hover:text-slate-900 font-medium underline underline-offset-4 cursor-pointer transition-colors"
              >
                Continue directly in Local Practice Mode (No sign-in required) →
              </button>
            </div>
          </div>

          {/* Right Column: Visual Study Preview Card (Desktop) */}
          <div className="hidden lg:block lg:col-span-5">
            <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-md">
              <StudyDashIllustration />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full max-w-6xl mx-auto py-3 text-center text-xs text-slate-400">
          ONE SHOT FMGE · FMGE Preparation Platform
        </footer>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     2. AUTH MODES (Sign In / Sign Up / Forgot Password)
  ───────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#F7F9F8] flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Back to welcome */}
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              clearMessages();
              setMode('welcome');
            }}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            ← Back to Welcome
          </button>
          <span className="text-xs text-slate-400 font-mono">ONE SHOT</span>
        </div>

        {/* Main Auth Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm backdrop-blur-xl">
          {/* Card Header */}
          <div className="text-center mb-6">
            <div className="inline-flex mb-3">
              <OneShotMark size="md" />
            </div>
            <h1 className="text-2xl font-bold font-['Outfit'] tracking-tight text-slate-900">
              {mode === 'signin' && 'Sign In to ONE SHOT'}
              {mode === 'signup' && 'Create Your Account'}
              {mode === 'forgot' && 'Reset Password'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {mode === 'signin' && 'Welcome back, Doctor. Pick up your FMGE plan.'}
              {mode === 'signup' && 'Set up your personalized FMGE target and daily rhythm.'}
              {mode === 'forgot' && 'Enter your email to receive recovery instructions.'}
            </p>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="mb-5 flex flex-col gap-2 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                <div className="flex-1 font-medium leading-relaxed">{errorMsg}</div>
              </div>
              {errorCode === 'auth/unauthorized-domain' && (
                <div className="pt-2 border-t border-red-200 flex items-center justify-between bg-white/90 p-2 rounded-xl">
                  <span className="font-mono text-[11px] truncate text-red-900 max-w-[200px]">{currentHost}</span>
                  <button
                    type="button"
                    onClick={handleCopyDomain}
                    className="text-[11px] font-bold text-slate-800 bg-white px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 shrink-0"
                  >
                    {copiedDomain ? 'Copied!' : 'Copy Domain'}
                  </button>
                </div>
              )}
            </div>
          )}

          {successMsg && (
            <div className="mb-5 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 p-3.5 text-xs text-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Google Sign In Option */}
          {mode !== 'forgot' && (
            <div className="space-y-3 mb-5">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <GoogleIcon className="h-4 w-4" />
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-slate-100" />
                <span className="absolute bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  or with email
                </span>
              </div>
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === 'signin' && (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@example.com"
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setMode('forgot');
                    }}
                    className="text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputCls} pl-10 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 text-sm transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Don&apos;t have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setMode('signup');
                  }}
                  className="text-xs font-bold text-slate-900 hover:underline cursor-pointer"
                >
                  Create account
                </button>
              </div>
            </form>
          )}

          {/* SIGN UP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Doctor / Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Dr. Aman Sharma"
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@example.com"
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Create Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className={`${inputCls} pl-10 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 text-sm transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setMode('signin');
                  }}
                  className="text-xs font-bold text-slate-900 hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Your Registered Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@example.com"
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 text-sm transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Sending Link...' : 'Send Password Reset Link'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setMode('signin');
                  }}
                  className="text-xs font-bold text-slate-700 hover:underline cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Local Mode fallback */}
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={handleGuestEntry}
            className="text-xs text-slate-500 hover:text-slate-900 font-medium underline underline-offset-2 cursor-pointer"
          >
            Start instantly in Local Practice Mode
          </button>
        </div>
      </div>
    </div>
  );
};
