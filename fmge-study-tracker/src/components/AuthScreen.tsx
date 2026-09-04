import React, { useState } from 'react';
import {
  Sparkles,
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
  BookOpen,
  Target,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'welcome' | 'signin' | 'signup' | 'forgot';

export const AuthScreen: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const clearMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleGoogleSignIn = async () => {
    clearMessages();
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setIsLoading(false);
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setErrorMsg('Google sign-in was cancelled.');
      } else if (code === 'auth/popup-blocked') {
        setErrorMsg('Sign-in pop-up was blocked by your browser. Please allow popups.');
      } else if (code === 'auth/cancelled-popup-request') {
        setErrorMsg('Sign-in request was cancelled.');
      } else if (code === 'auth/network-request-failed') {
        setErrorMsg('Network error. Please check your internet connection.');
      } else {
        setErrorMsg(err.message || 'Google sign-in failed. Please try again.');
      }
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
      const code = err?.code || '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setErrorMsg('Incorrect email or password. Please verify and try again.');
      } else if (code === 'auth/operation-not-allowed') {
        setErrorMsg('Email/Password provider is not enabled on this Firebase project. Please sign in with Google.');
      } else if (code === 'auth/invalid-email') {
        setErrorMsg('Please enter a valid email address.');
      } else if (code === 'auth/user-disabled') {
        setErrorMsg('This account has been disabled. Please contact support.');
      } else if (code === 'auth/too-many-requests') {
        setErrorMsg('Too many failed attempts. Please wait a few minutes or sign in with Google.');
      } else if (code === 'auth/network-request-failed') {
        setErrorMsg('Network error. Please check your internet connection.');
      } else {
        setErrorMsg(err.message || 'Failed to sign in. Please check your credentials.');
      }
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
      await signUpWithEmail(cleanEmail, password, cleanName);
    } catch (err: any) {
      setIsLoading(false);
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setErrorMsg('An account with this email already exists. Please sign in with your password or use Google Sign-In.');
      } else if (code === 'auth/operation-not-allowed') {
        setErrorMsg('Email/Password registration is not enabled on this Firebase project. Please sign in with Google.');
      } else if (code === 'auth/weak-password') {
        setErrorMsg('Please choose a stronger password (at least 6 characters).');
      } else if (code === 'auth/invalid-email') {
        setErrorMsg('Please enter a valid email address.');
      } else if (code === 'auth/network-request-failed') {
        setErrorMsg('Network error. Please check your internet connection.');
      } else {
        setErrorMsg(err.message || 'Failed to create account. Please try again.');
      }
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Please enter your email address to receive the password reset link.');
      return;
    }
    clearMessages();
    setIsLoading(true);
    try {
      await sendPasswordReset(cleanEmail);
      setSuccessMsg(`Password reset email sent to ${cleanEmail}. Please check your inbox.`);
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        setErrorMsg('No registered account found with this email.');
      } else if (code === 'auth/operation-not-allowed') {
        setErrorMsg('Email password reset is not enabled on this Firebase project. Please use Google Sign-In.');
      } else if (code === 'auth/invalid-email') {
        setErrorMsg('Please enter a valid email address.');
      } else if (code === 'auth/network-request-failed') {
        setErrorMsg('Network error. Please check your internet connection.');
      } else {
        setErrorMsg(err.message || 'Failed to send reset email. Please verify your email address.');
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f7faf9] flex flex-col justify-between selection:bg-[#d5edea] selection:text-[#084d50]">
      {/* Background Subtle Medical Grid Pattern */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(#084d50 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-[14px] bg-[#084d50] text-white shadow-sm">
            <span className="absolute -right-2 -top-2 h-7 w-7 rounded-full bg-[#e8806d]/80" />
            <span className="relative font-display text-2xl italic leading-none">F</span>
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-[-.03em] text-[#183d3b]">FMGE Study Tracker</span>
              <span className="rounded-full bg-[#e5f2ef] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.15em] text-[#0d6866]">
                300 marks
              </span>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#7b9697]">
              Cross-Device Cloud Sync
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#527776]">
          <ShieldCheck className="h-4 w-4 text-[#0d6866]" />
          <span className="hidden sm:inline font-medium">Encrypted Personal Storage</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="rounded-3xl border border-[#cfe2df] bg-white/95 p-6 sm:p-8 shadow-sm backdrop-blur-xl transition-all">
            
            {/* Header / Intro */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-[#e3f0ee] text-[#084d50] mb-3 shadow-inner">
                <Sparkles className="h-6 w-6 text-[#0d6866]" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#183d3b]">
                FMGE Study Tracker
              </h1>
              <p className="text-sm italic font-serif text-[#557b7a] mt-1">
                &ldquo;Your preparation. Your progress. Your history.&rdquo;
              </p>
            </div>

            {/* Error & Success Alerts */}
            {errorMsg && (
              <div className="mb-5 flex flex-col gap-2 rounded-2xl border border-[#fecaca] bg-[#fff1f2] p-3.5 text-xs text-[#991b1b]">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#dc2626]" />
                  <div className="flex-1 font-medium">{errorMsg}</div>
                </div>
                {(errorMsg.includes('Google') || errorMsg.includes('already exists')) && (
                  <div className="flex items-center gap-2 pt-1 border-t border-[#fecaca]/60">
                    {errorMsg.includes('already exists') && mode === 'signup' && (
                      <button
                        type="button"
                        onClick={() => {
                          clearMessages();
                          setMode('signin');
                        }}
                        className="text-[11px] font-bold text-[#084d50] bg-white px-2.5 py-1 rounded-lg border border-[#cfe2df] hover:bg-[#f2f8f7] transition-all"
                      >
                        Sign in with this email →
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                      className="text-[11px] font-bold text-[#084d50] bg-white px-2.5 py-1 rounded-lg border border-[#cfe2df] hover:bg-[#f2f8f7] transition-all flex items-center gap-1.5"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      Continue with Google
                    </button>
                  </div>
                )}
              </div>
            )}

            {successMsg && (
              <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] p-3.5 text-xs text-[#166534]">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-[#16a34a]" />
                <div className="flex-1">{successMsg}</div>
              </div>
            )}

            {/* VIEW 1: WELCOME SCREEN (Default) */}
            {mode === 'welcome' && (
              <div className="space-y-4">
                {/* Google Sign-in Button */}
                <button
                  type="button"
                  id="auth-google-btn"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl border border-[#cfe2df] bg-white px-5 py-3.5 text-sm font-semibold text-[#183d3b] shadow-xs hover:bg-[#f5faf9] hover:border-[#b5d3cf] transition-all disabled:opacity-60"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="relative my-4 flex items-center justify-center">
                  <div className="w-full border-t border-[#e2edea]" />
                  <span className="absolute bg-white px-3 text-[11px] font-semibold uppercase tracking-wider text-[#87a0a1]">
                    or
                  </span>
                </div>

                {/* Sign In with Email */}
                <button
                  type="button"
                  id="auth-email-signin-btn"
                  onClick={() => {
                    clearMessages();
                    setMode('signin');
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#084d50] px-5 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#063c3e] transition-all"
                >
                  <Mail className="h-4 w-4" />
                  <span>Sign in with Email</span>
                </button>

                {/* Create Account */}
                <button
                  type="button"
                  id="auth-create-account-btn"
                  onClick={() => {
                    clearMessages();
                    setMode('signup');
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-[#cfe2df] bg-[#f2f8f7] px-5 py-3 text-sm font-semibold text-[#0d6866] hover:bg-[#e6f2f0] transition-all"
                >
                  <User className="h-4 w-4" />
                  <span>Create Account</span>
                </button>

                {/* Features Highlight */}
                <div className="mt-6 pt-4 border-t border-[#e8f1ef] grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-[#f7faf9]">
                    <Clock className="h-4 w-4 mx-auto text-[#0d6866] mb-1" />
                    <span className="block text-[10px] font-bold text-[#345856]">Mac, iPhone & iPad</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#f7faf9]">
                    <Target className="h-4 w-4 mx-auto text-[#e8806d] mb-1" />
                    <span className="block text-[10px] font-bold text-[#345856]">19 Subjects & GTs</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#f7faf9]">
                    <Zap className="h-4 w-4 mx-auto text-[#0d6866] mb-1" />
                    <span className="block text-[10px] font-bold text-[#345856]">Offline Cached</span>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: SIGN IN WITH EMAIL */}
            {mode === 'signin' && (
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#345856] mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#88a5a4]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="doctor@example.com"
                      className="w-full rounded-xl border border-[#cfe2df] bg-[#fbfdfc] pl-10 pr-4 py-2.5 text-sm text-[#183d3b] placeholder:text-[#9ab1b0] focus:border-[#0d6866] focus:outline-none focus:ring-2 focus:ring-[#0d6866]/10"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#345856]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        clearMessages();
                        setMode('forgot');
                      }}
                      className="text-xs font-semibold text-[#0d6866] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#88a5a4]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-[#cfe2df] bg-[#fbfdfc] pl-10 pr-10 py-2.5 text-sm text-[#183d3b] placeholder:text-[#9ab1b0] focus:border-[#0d6866] focus:outline-none focus:ring-2 focus:ring-[#0d6866]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-[#88a5a4] hover:text-[#345856]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#084d50] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#063c3e] transition-all disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setMode('welcome');
                    }}
                    className="text-xs font-semibold text-[#6a8b8a] hover:text-[#183d3b]"
                  >
                    ← Back to options
                  </button>
                </div>
              </form>
            )}

            {/* VIEW 3: CREATE ACCOUNT */}
            {mode === 'signup' && (
              <form onSubmit={handleEmailSignUp} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#345856] mb-1.5">
                    Your Name / Title
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-[#88a5a4]" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Dr. Imdadul"
                      className="w-full rounded-xl border border-[#cfe2df] bg-[#fbfdfc] pl-10 pr-4 py-2.5 text-sm text-[#183d3b] placeholder:text-[#9ab1b0] focus:border-[#0d6866] focus:outline-none focus:ring-2 focus:ring-[#0d6866]/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#345856] mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#88a5a4]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="doctor@example.com"
                      className="w-full rounded-xl border border-[#cfe2df] bg-[#fbfdfc] pl-10 pr-4 py-2.5 text-sm text-[#183d3b] placeholder:text-[#9ab1b0] focus:border-[#0d6866] focus:outline-none focus:ring-2 focus:ring-[#0d6866]/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#345856] mb-1.5">
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#88a5a4]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full rounded-xl border border-[#cfe2df] bg-[#fbfdfc] pl-10 pr-10 py-2.5 text-sm text-[#183d3b] placeholder:text-[#9ab1b0] focus:border-[#0d6866] focus:outline-none focus:ring-2 focus:ring-[#0d6866]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-[#88a5a4] hover:text-[#345856]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#084d50] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#063c3e] transition-all disabled:opacity-60 mt-2"
                >
                  {isLoading ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <span>Create Free Account</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setMode('welcome');
                    }}
                    className="text-xs font-semibold text-[#6a8b8a] hover:text-[#183d3b]"
                  >
                    ← Back to options
                  </button>
                </div>
              </form>
            )}

            {/* VIEW 4: FORGOT PASSWORD */}
            {mode === 'forgot' && (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="text-left mb-2">
                  <h3 className="text-sm font-bold text-[#183d3b]">Reset your password</h3>
                  <p className="text-xs text-[#557b7a]">
                    Enter your registered email and we&apos;ll send you a link to reset your password.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#345856] mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#88a5a4]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="doctor@example.com"
                      className="w-full rounded-xl border border-[#cfe2df] bg-[#fbfdfc] pl-10 pr-4 py-2.5 text-sm text-[#183d3b] placeholder:text-[#9ab1b0] focus:border-[#0d6866] focus:outline-none focus:ring-2 focus:ring-[#0d6866]/10"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#084d50] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#063c3e] transition-all disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setMode('signin');
                    }}
                    className="text-xs font-semibold text-[#6a8b8a] hover:text-[#183d3b]"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}

          </div>

          {/* Privacy & Cloud Architecture Note */}
          <div className="mt-6 text-center text-xs text-[#7b9697]">
            <p>
              Your study records, GT logs, and notes are securely isolated to your account and synced across your devices.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 text-center text-xs text-[#87a0a1]">
        FMGE 300 Marks Preparation Workspace · Encrypted Cloud Sync
      </footer>
    </div>
  );
};
