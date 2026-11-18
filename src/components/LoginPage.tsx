import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Layers,
  Loader2,
  Lock,
  Mail,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { Avatar } from './Avatar';
import { useApp } from '../context/AppContext';
import type { AppView } from '../types';

type AuthMode = 'signin' | 'signup' | 'reset';

const VIEW_LABELS: Partial<Record<AppView, string>> = {
  overview: 'Dashboard Overview',
  'explore-projects': 'Explore Projects',
  'find-developers': 'Developer Directory',
  'ai-analyzer': 'AI Project Analyzer',
  'ai-planner': 'AI Project Planner',
  'team-builder': 'Team Builder',
  'team-workspace': 'Team Workspace',
  'my-projects': 'My Projects',
};

function getPasswordStrength(pw: string): { score: number; label: string; tone: string } {
  if (!pw) return { score: 0, label: 'Enter 8+ characters', tone: 'text-[#656D76]' };
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) score += 1;

  if (score <= 1) return { score: 1, label: 'Weak · add numbers or uppercase', tone: 'text-[#CF222E]' };
  if (score === 2) return { score: 2, label: 'Fair · getting stronger', tone: 'text-[#9A6700]' };
  if (score === 3) return { score: 3, label: 'Good · solid password', tone: 'text-[#0969DA]' };
  return { score: 4, label: 'Strong · ready to lock in', tone: 'text-[#1A7F37]' };
}

export const LoginPage: React.FC = () => {
  const {
    authUser,
    emailVerified,
    authLoading,
    authError,
    clearAuthError,
    setActiveView,
    postLoginView,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    sendPasswordReset,
    resendVerificationEmail,
    refreshVerificationStatus,
    logout,
  } = useApp();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [resetSentTo, setResetSentTo] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const displayError = localError || authError;
  const targetViewLabel = postLoginView ? VIEW_LABELS[postLoginView] || 'your workspace' : null;

  const switchMode = (nextMode: AuthMode) => {
    clearAuthError();
    setLocalError(null);
    setResetSentTo(null);
    setMode(nextMode);
  };

  const handleGoogleAuth = async () => {
    clearAuthError();
    setLocalError(null);
    await loginWithGoogle();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setLocalError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    if (mode === 'reset') {
      const ok = await sendPasswordReset(trimmedEmail);
      if (ok) {
        setResetSentTo(trimmedEmail);
      }
      return;
    }

    if (mode === 'signup') {
      if (name.trim().length < 2) {
        setLocalError('Enter your full name (at least 2 characters).');
        return;
      }
      if (password.length < 8) {
        setLocalError('Password must be at least 8 characters long.');
        return;
      }
      await registerWithEmail({ name: name.trim(), email: trimmedEmail, password });
      return;
    }

    if (!password) {
      setLocalError('Enter your password to sign in.');
      return;
    }
    await loginWithEmail(trimmedEmail, password);
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    const ok = await resendVerificationEmail();
    if (ok) setResendCooldown(30);
  };

  const leftHeadline =
    authUser && !emailVerified
      ? 'Almost in. Confirm your inbox.'
      : mode === 'reset'
        ? 'Locked out? Back in seconds.'
        : mode === 'signup'
          ? 'Stop building solo. Find your crew.'
          : 'Back to building. Pick up your sprint.';

  const leftSubtitle =
    authUser && !emailVerified
      ? 'We require verified email addresses to protect project workspaces, team invites, and member profiles.'
      : mode === 'reset'
        ? 'Enter your SkillBridge email and we will send a secure password reset link straight to your inbox.'
        : 'SkillBridge pairs Gemini project roadmaps with 5-factor skill matching so student builders and engineers ship faster together.';

  return (
    <div className="min-h-screen bg-[#F6F8FA] text-[#1F2328] flex flex-col relative overflow-x-hidden">
      {/* Subtle architectural blueprint backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-blueprint-grid [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.45),transparent)]"
      />

      {/* Top Bar */}
      <header className="relative z-10 bg-white/95 backdrop-blur-sm border-b border-[#D1D9E0]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => {
              clearAuthError();
              setActiveView('landing');
            }}
            className="shrink-0"
          >
            <BrandLogo size="md" />
          </button>

          <button
            type="button"
            onClick={() => {
              clearAuthError();
              setActiveView('landing');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#656D76] hover:text-[#1F2328] hover:bg-[#F6F8FA] border border-transparent hover:border-[#D1D9E0] rounded-lg transition-all duration-150 whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </button>
        </div>
      </header>

      {/* Main Split Workspace */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-10 lg:py-14">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Gen-Z Builder Pitch & Bento Preview */}
          <div className="lg:col-span-6 space-y-7">
            <div>
              <p className="text-xs font-semibold text-[#0969DA] tracking-wide">
                SkillBridge · Build Squads That Actually Ship
              </p>
              <h1 className="mt-2.5 text-[clamp(2rem,3.5vw,3rem)] font-bold tracking-tight leading-[1.1] text-[#1F2328] text-balance">
                {leftHeadline}
              </h1>
              <p className="mt-3.5 text-sm sm:text-base text-[#656D76] leading-relaxed max-w-lg">
                {leftSubtitle}
              </p>
            </div>

            {/* Crisp Single-Level Bento Highlight Cards (no nested card sandwiches) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2 bg-white border border-[#D1D9E0] rounded-xl p-5 shadow-[0_1px_2px_rgba(31,35,40,0.03)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-[#FFF8C5] border border-[#FACC15]/50 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-[#9A6700]" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-[#1F2328]">
                        Idea Prompt to Live Team Blueprint
                      </h2>
                      <p className="mt-1 text-xs text-[#656D76] leading-relaxed">
                        Drop your rough hackathon or startup concept. Gemini maps your roles, tech stack, and sprint tasks in one click.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3.5 border-t border-[#EAEFF4] flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-mono text-[#656D76]">
                  <span className="text-[#1F2328] font-medium">React</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#1F2328] font-medium">TypeScript</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#1F2328] font-medium">Firebase</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#0969DA]">Gemini Spec Ready</span>
                </div>
              </div>

              <div className="bg-white border border-[#D1D9E0] rounded-xl p-4 shadow-[0_1px_2px_rgba(31,35,40,0.03)]">
                <Layers className="w-4 h-4 text-[#0969DA] mb-2.5" />
                <h2 className="text-sm font-semibold text-[#1F2328]">Zero-Guesswork Matching</h2>
                <p className="mt-1 text-xs text-[#656D76] leading-relaxed">
                  Ranked across skill overlap, depth, experience, and real weekly availability.
                </p>
              </div>

              <div className="bg-white border border-[#D1D9E0] rounded-xl p-4 shadow-[0_1px_2px_rgba(31,35,40,0.03)]">
                <Users className="w-4 h-4 text-[#1A7F37] mb-2.5" />
                <h2 className="text-sm font-semibold text-[#1F2328]">Shared Squad HQ</h2>
                <p className="mt-1 text-xs text-[#656D76] leading-relaxed">
                  Kanban sprints, engineering channels, milestones, and shared notes in sync.
                </p>
              </div>
            </div>

            {/* Clean Builder Strip */}
            <div className="flex items-center gap-3.5 pt-1">
              <div className="flex -space-x-2 shrink-0">
                <Avatar
                  name="Elena Rostova"
                  src="/src/assets/images/avatar_dev_elena_1795019045410.jpg"
                  size="sm"
                />
                <Avatar
                  name="Marcus Vance"
                  src="/src/assets/images/avatar_dev_marcus_1795019046552.jpg"
                  size="sm"
                />
                <Avatar
                  name="Mei Lin Chen"
                  src="/src/assets/images/avatar_dev_mei_1795019047094.jpg"
                  size="sm"
                />
              </div>
              <p className="text-xs text-[#656D76] leading-snug">
                Made for campus capstones, 48-hour hackathons, and indie builders who ship.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Auth Card */}
          <div className="lg:col-span-6">
            <div className="bg-white border border-[#D1D9E0] rounded-xl p-6 sm:p-8 shadow-[0_14px_40px_-14px_rgba(31,35,40,0.1)]">
              {/* STATE 1: Verified & Signed In */}
              {authUser && emailVerified ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <Avatar name={authUser.displayName || authUser.email || 'Developer'} src={authUser.photoURL || ''} size="md" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#1A7F37]">Signed in &amp; verified</p>
                      <h2 className="text-lg font-bold text-[#1F2328] truncate">
                        {authUser.displayName || 'Developer Account'}
                      </h2>
                      <p className="text-xs text-[#656D76] truncate">{authUser.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveView('overview')}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0969DA] hover:bg-[#0550AE] rounded-lg transition-all duration-150 active:scale-[0.99] whitespace-nowrap"
                    >
                      Open Workspace
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={logout}
                      className="px-4 py-2.5 text-sm font-medium text-[#1F2328] bg-[#F6F8FA] hover:bg-[#EAEFF4] border border-[#D1D9E0] rounded-lg transition-colors whitespace-nowrap"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : authUser && !emailVerified ? (
                /* STATE 2: Email Verification Gate for newly created Email/Password accounts */
                <div className="space-y-5">
                  <div className="w-11 h-11 rounded-xl bg-[#DDF4FF] border border-[#B6E3FF] flex items-center justify-center">
                    <MailCheck className="w-5 h-5 text-[#0969DA]" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-[#1F2328]">Verify your email</h2>
                    <p className="mt-1.5 text-xs text-[#656D76] leading-relaxed">
                      We sent a verification link to{' '}
                      <span className="font-semibold text-[#1F2328]">{authUser.email}</span>. Click the link in your inbox (or spam folder), then press Continue below.
                    </p>
                  </div>

                  {displayError && (
                    <div className="p-3 rounded-lg bg-[#FFEBE9] border border-[#FF8182] flex items-start gap-2 text-xs text-[#CF222E] leading-relaxed">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{displayError}</span>
                    </div>
                  )}

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      disabled={authLoading}
                      onClick={refreshVerificationStatus}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0969DA] hover:bg-[#0550AE] disabled:opacity-60 rounded-lg transition-all duration-150 active:scale-[0.99] whitespace-nowrap"
                    >
                      {authLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Checking verification...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          I&apos;ve verified my email — Continue
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={authLoading || resendCooldown > 0}
                      onClick={handleResendVerification}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#1F2328] bg-[#F6F8FA] hover:bg-[#EAEFF4] disabled:opacity-60 border border-[#D1D9E0] rounded-lg transition-colors whitespace-nowrap"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      {resendCooldown > 0
                        ? `Resend available in ${resendCooldown}s`
                        : 'Resend verification email'}
                    </button>
                  </div>

                  <div className="pt-4 border-t border-[#D1D9E0] flex items-center justify-between gap-3 text-xs text-[#656D76]">
                    <span>Wrong address or prefer Google?</span>
                    <button
                      type="button"
                      onClick={logout}
                      className="font-semibold text-[#0969DA] hover:underline whitespace-nowrap"
                    >
                      Switch account
                    </button>
                  </div>
                </div>
              ) : mode === 'reset' ? (
                /* STATE 3: Reset Password Flow */
                <div className="space-y-5">
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#656D76] hover:text-[#1F2328] transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Sign In
                  </button>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F6F8FA] border border-[#D1D9E0] flex items-center justify-center shrink-0">
                      <KeyRound className="w-4 h-4 text-[#0969DA]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#1F2328]">Reset your password</h2>
                      <p className="mt-1 text-xs text-[#656D76] leading-relaxed">
                        We&apos;ll email you a secure link to choose a new password.
                      </p>
                    </div>
                  </div>

                  {resetSentTo ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-[#DAFBE1]/60 border border-[#ACEEBB] flex items-start gap-2.5 text-xs text-[#1A7F37] leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">Reset link sent</p>
                          <p className="mt-0.5 text-[#1F2328]">
                            Check <span className="font-semibold">{resetSentTo}</span> (and your spam folder) for your password reset email.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <button
                          type="button"
                          onClick={() => switchMode('signin')}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0969DA] hover:bg-[#0550AE] rounded-lg transition-colors whitespace-nowrap"
                        >
                          Back to Sign In
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={authLoading}
                          onClick={async () => {
                            await sendPasswordReset(resetSentTo);
                          }}
                          className="px-4 py-2.5 text-xs font-semibold text-[#1F2328] bg-[#F6F8FA] hover:bg-[#EAEFF4] border border-[#D1D9E0] rounded-lg transition-colors whitespace-nowrap"
                        >
                          Resend link
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleEmailSubmit} noValidate className="space-y-4">
                      {displayError && (
                        <div className="p-3 rounded-lg bg-[#FFEBE9] border border-[#FF8182] flex items-start gap-2 text-xs text-[#CF222E] leading-relaxed">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{displayError}</span>
                        </div>
                      )}

                      <div>
                        <label htmlFor="reset-email" className="block text-xs font-semibold text-[#1F2328] mb-1.5">
                          Email address
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-[#656D76] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            id="reset-email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@university.edu"
                            className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F6F8FA] focus:bg-white border border-[#D1D9E0] focus:border-[#0969DA] rounded-lg focus:outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0969DA] hover:bg-[#0550AE] disabled:opacity-60 rounded-lg transition-all duration-150 active:scale-[0.99] whitespace-nowrap"
                      >
                        {authLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending reset link...
                          </>
                        ) : (
                          <>
                            Send Reset Link
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                /* STATE 4: Sign In / Create Account */
                <div className="space-y-5">
                  {/* Segmented Mode Control */}
                  <div className="grid grid-cols-2 gap-1 p-1 bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg">
                    <button
                      type="button"
                      onClick={() => switchMode('signin')}
                      className={`py-2 text-xs font-semibold rounded-md transition-all duration-150 whitespace-nowrap ${
                        mode === 'signin'
                          ? 'bg-white text-[#1F2328] border border-[#D1D9E0] shadow-xs'
                          : 'text-[#656D76] hover:text-[#1F2328]'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => switchMode('signup')}
                      className={`py-2 text-xs font-semibold rounded-md transition-all duration-150 whitespace-nowrap ${
                        mode === 'signup'
                          ? 'bg-white text-[#1F2328] border border-[#D1D9E0] shadow-xs'
                          : 'text-[#656D76] hover:text-[#1F2328]'
                      }`}
                    >
                      Create Account
                    </button>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-[#1F2328]">
                      {mode === 'signin' ? 'Welcome back, builder' : 'Claim your builder profile'}
                    </h2>
                    <p className="mt-1 text-xs text-[#656D76] leading-relaxed">
                      {mode === 'signin'
                        ? 'Sign in with Google or your email to jump back into your projects.'
                        : 'Create your account in seconds. You will set up your skills and stack next.'}
                    </p>
                  </div>

                  {targetViewLabel && (
                    <div className="p-3 rounded-lg bg-[#DDF4FF]/60 border border-[#B6E3FF] text-xs text-[#0550AE]">
                      Sign in to jump straight into <span className="font-semibold">{targetViewLabel}</span>.
                    </div>
                  )}

                  {/* Google OAuth Button */}
                  <button
                    type="button"
                    disabled={authLoading}
                    onClick={handleGoogleAuth}
                    className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-[#1F2328] bg-white hover:bg-[#F6F8FA] border border-[#D1D9E0] hover:border-[#B6C2CE] disabled:opacity-60 rounded-lg transition-all duration-150 active:scale-[0.99] whitespace-nowrap"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                      />
                    </svg>
                    {mode === 'signin' ? 'Continue with Google' : 'Sign up with Google'}
                  </button>

                  {/* Divider */}
                  <div className="relative flex items-center py-0.5">
                    <div className="flex-grow border-t border-[#D1D9E0]" />
                    <span className="px-3 text-[11px] font-medium text-[#656D76]">or continue with email</span>
                    <div className="flex-grow border-t border-[#D1D9E0]" />
                  </div>

                  {/* Inline Error */}
                  {displayError && (
                    <div className="p-3 rounded-lg bg-[#FFEBE9] border border-[#FF8182] flex items-start gap-2 text-xs text-[#CF222E] leading-relaxed">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span>{displayError}</span>
                        {(displayError.toLowerCase().includes('password') ||
                          displayError.toLowerCase().includes('already exists')) && (
                          <button
                            type="button"
                            onClick={() => switchMode('reset')}
                            className="ml-1.5 font-semibold underline text-[#CF222E] hover:text-[#A40E26]"
                          >
                            Reset password
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Email & Password Form */}
                  <form onSubmit={handleEmailSubmit} noValidate className="space-y-4">
                    {mode === 'signup' && (
                      <div>
                        <label htmlFor="auth-name" className="block text-xs font-semibold text-[#1F2328] mb-1.5">
                          Full name
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-[#656D76] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            id="auth-name"
                            type="text"
                            autoComplete="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Alex Rivera"
                            className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F6F8FA] focus:bg-white border border-[#D1D9E0] focus:border-[#0969DA] rounded-lg focus:outline-none transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label htmlFor="auth-email" className="block text-xs font-semibold text-[#1F2328] mb-1.5">
                        Email address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#656D76] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="auth-email"
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@university.edu"
                          className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F6F8FA] focus:bg-white border border-[#D1D9E0] focus:border-[#0969DA] rounded-lg focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <label htmlFor="auth-password" className="text-xs font-semibold text-[#1F2328]">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => switchMode('reset')}
                          className="text-xs font-semibold text-[#0969DA] hover:text-[#0550AE] hover:underline whitespace-nowrap"
                        >
                          Reset password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#656D76] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="auth-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={mode === 'signin' ? 'Enter your password' : 'Create a strong password (8+ chars)'}
                          className="w-full pl-9 pr-10 py-2.5 text-sm bg-[#F6F8FA] focus:bg-white border border-[#D1D9E0] focus:border-[#0969DA] rounded-lg focus:outline-none transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#656D76] hover:text-[#1F2328] rounded"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {mode === 'signup' && (
                        <div className="mt-2 space-y-1.5">
                          <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
                            {[1, 2, 3, 4].map((step) => (
                              <div
                                key={step}
                                className={`h-1 rounded-full transition-colors ${
                                  passwordStrength.score >= step
                                    ? passwordStrength.score <= 1
                                      ? 'bg-[#CF222E]'
                                      : passwordStrength.score === 2
                                        ? 'bg-[#D97706]'
                                        : passwordStrength.score === 3
                                          ? 'bg-[#0969DA]'
                                          : 'bg-[#1A7F37]'
                                    : 'bg-[#EAEFF4]'
                                }`}
                              />
                            ))}
                          </div>
                          <p className={`text-[11px] font-medium ${passwordStrength.tone}`}>
                            {passwordStrength.label}
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-[#0969DA] hover:bg-[#0550AE] disabled:opacity-60 rounded-lg transition-all duration-150 active:scale-[0.99] whitespace-nowrap"
                    >
                      {authLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                        </>
                      ) : (
                        <>
                          {mode === 'signin' ? 'Sign in to SkillBridge' : 'Create Developer Account'}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Account Footer Notes */}
                  <div className="pt-4 border-t border-[#D1D9E0] space-y-2 text-xs text-[#656D76]">
                    <div className="flex items-start gap-2">
                      <Bot className="w-4 h-4 text-[#0969DA] shrink-0 mt-0.5" />
                      <span>
                        New builders are guided straight into Developer Profile Setup (skills, stack, GitHub &amp; availability).
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#1A7F37] shrink-0 mt-0.5" />
                      <span>
                        Secured with Firebase Auth. Email signups confirm inbox ownership before accessing Firestore.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
