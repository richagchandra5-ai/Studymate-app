import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { ArrowRight, CheckCircle2, GraduationCap, Loader2, X } from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { completeOnboardingWithStarter, StarterStream } from '../services/studymateService';
import { SCHEMA_LIMITS, UserProfile } from '../types/studymate';

interface AuthModalProps {
  initialMode: 'signin' | 'signup';
  onClose: () => void;
  onAuthenticated: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode,
  onClose,
  onAuthenticated,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleAuth = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await signInWithPopup(auth, googleProvider);
      onAuthenticated();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to sign in with Google.';
      if (msg.includes('popup-closed-by-user')) {
        setErrorMsg('Sign-in popup was closed before completing. Please try again.');
      } else if (msg.includes('popup-blocked')) {
        setErrorMsg('Please allow popups for this site to sign in with Google.');
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 sm:p-7 space-y-6 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sign in dialog"
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-700">
            <GraduationCap className="w-5 h-5" />
            <span className="font-display font-bold text-base text-slate-900">StudyMate</span>
          </div>
          <h2 id="auth-modal-title" className="font-display text-2xl font-bold text-slate-900">
            {mode === 'signin' ? 'Welcome back' : 'Create your student account'}
          </h2>
          <p className="text-sm text-slate-600">
            {mode === 'signin'
              ? 'Sign in to access your study timetable, syllabus progress, and revision tracker.'
              : 'Set up your personalized study schedule in under 60 seconds.'}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-semibold rounded-md transition-colors ${
              mode === 'signin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-semibold rounded-md transition-colors ${
              mode === 'signup'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting Google Account...</span>
              </>
            ) : (
              <>
                <span>
                  {mode === 'signin' ? 'Continue with Google' : 'Sign Up with Google'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {errorMsg && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed"
            >
              {errorMsg}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Verified cloud sync across desktop and mobile</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Free Basic tier included — no card required</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface OnboardingViewProps {
  profile: UserProfile;
  onCompleted: () => void;
}

const STREAM_OPTIONS: { id: StarterStream; label: string; desc: string }[] = [
  {
    id: 'business',
    label: 'Business & MBA',
    desc: 'Managerial Economics, Corporate Finance, Quantitative Methods',
  },
  {
    id: 'engineering',
    label: 'Engineering & CS',
    desc: 'Data Structures & Algorithms, Operating Systems, DBMS',
  },
  {
    id: 'commerce',
    label: 'Commerce & Finance',
    desc: 'Financial Accounting, Business Law, Microeconomics',
  },
  {
    id: 'blank',
    label: 'Start with Blank Slate',
    desc: 'Add your own subjects and custom timetable from scratch',
  },
];

export const OnboardingView: React.FC<OnboardingViewProps> = ({ profile, onCompleted }) => {
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [university, setUniversity] = useState(
    profile.university || 'DBS Global University, Dehradun'
  );
  const [program, setProgram] = useState(profile.program || 'MBA / Undergraduate');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(profile.dailyGoalMinutes || 180);
  const [starterStream, setStarterStream] = useState<StarterStream>('business');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !university.trim() || !program.trim()) {
      setError('Please complete your name, university, and program.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await completeOnboardingWithStarter(profile.uid, {
        displayName,
        university,
        program,
        dailyGoalMinutes,
        starterStream,
      });
      onCompleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save onboarding profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="space-y-1.5 border-b border-slate-200 pb-5">
          <p className="text-xs font-medium text-blue-700">Step 1 of 1 · Student Setup</p>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Personalize your StudyMate workspace
          </h1>
          <p className="text-sm text-slate-600">
            Tell us your academic focus and daily study goal so we can configure your planner.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ob-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                id="ob-name"
                type="text"
                required
                maxLength={SCHEMA_LIMITS.DISPLAY_NAME_MAX}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., Richa Chandra"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="ob-program"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Degree / Program
              </label>
              <input
                id="ob-program"
                type="text"
                required
                maxLength={SCHEMA_LIMITS.PROGRAM_MAX}
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                placeholder="e.g., MBA Semester 2"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="ob-university"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                University / College
              </label>
              <input
                id="ob-university"
                type="text"
                required
                maxLength={SCHEMA_LIMITS.UNIVERSITY_MAX}
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="e.g., DBS Global University, Dehradun"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="ob-goal" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Daily Study Target
              </label>
              <select
                id="ob-goal"
                value={dailyGoalMinutes}
                onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
              >
                <option value={90}>1.5 hours / day (90 mins)</option>
                <option value={120}>2 hours / day (120 mins)</option>
                <option value={180}>3 hours / day (180 mins)</option>
                <option value={240}>4 hours / day (240 mins)</option>
                <option value={300}>5 hours / day (300 mins)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2.5">
            <span className="block text-xs font-semibold text-slate-700">
              Starter Subject & Timetable Pack
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {STREAM_OPTIONS.map((opt) => {
                const selected = starterStream === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStarterStream(opt.id)}
                    className={`text-left p-3.5 rounded-lg border transition-colors ${
                      selected
                        ? 'bg-blue-50/70 border-blue-700'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-sm font-semibold text-slate-900">{opt.label}</div>
                    <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700"
            >
              {error}
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Setting Up Workspace...</span>
                </>
              ) : (
                <>
                  <span>Launch StudyMate Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
