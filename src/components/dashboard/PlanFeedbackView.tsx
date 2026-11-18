import React, { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import {
  PilotFeedback,
  PlanTier,
  SCHEMA_LIMITS,
  UserProfile,
  WillingnessToPay,
} from '../../types/studymate';
import {
  submitPilotFeedback,
  updatePlanTier,
  updateUserProfileDetails,
} from '../../services/studymateService';

interface PlanFeedbackViewProps {
  profile: UserProfile;
  myFeedback: PilotFeedback[];
}

export const PlanFeedbackView: React.FC<PlanFeedbackViewProps> = ({
  profile,
  myFeedback,
}) => {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [university, setUniversity] = useState(profile.university);
  const [program, setProgram] = useState(profile.program);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(profile.dailyGoalMinutes);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [switchingPlan, setSwitchingPlan] = useState(false);

  const [biggestChallenge, setBiggestChallenge] = useState(
    'Managing multiple subjects & exam revisions'
  );
  const [willingnessToPay, setWillingnessToPay] = useState<WillingnessToPay>('inr-49');
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSaved(false);
    try {
      await updateUserProfileDetails(profile.uid, {
        displayName,
        university,
        program,
        dailyGoalMinutes,
      });
      setProfileSaved(true);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSwitchPlan = async (tier: PlanTier) => {
    if (tier === profile.planTier) return;
    setSwitchingPlan(true);
    try {
      await updatePlanTier(profile.uid, tier);
    } finally {
      setSwitchingPlan(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!biggestChallenge.trim()) return;
    setSubmittingFeedback(true);
    setFeedbackSuccess(false);
    try {
      await submitPilotFeedback(profile.uid, {
        university: profile.university,
        biggestChallenge,
        willingnessToPay,
        rating,
        comments,
      });
      setComments('');
      setFeedbackSuccess(true);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Plan, Profile & Campus Pilot Feedback
        </h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Manage your student profile, subscription tier, and share feedback for our Dehradun
          campus rollout.
        </p>
      </div>

      {/* Subscription Tier Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div
          className={`bg-white rounded-xl p-6 flex flex-col justify-between space-y-4 ${
            profile.planTier === 'free'
              ? 'border-2 border-blue-700'
              : 'border border-slate-200'
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-900">Basic Free</h2>
              <span className="font-mono text-lg font-bold text-slate-900 tabular-nums">
                ₹0 / mo
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Up to 4 subjects, weekly study timetable, assignment deadlines, and focus timer.
            </p>
          </div>
          <button
            type="button"
            disabled={profile.planTier === 'free' || switchingPlan}
            onClick={() => handleSwitchPlan('free')}
            className={`w-full py-2 px-4 text-xs font-semibold rounded-lg transition-colors ${
              profile.planTier === 'free'
                ? 'bg-slate-100 text-slate-500 cursor-default'
                : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-50'
            }`}
          >
            {profile.planTier === 'free' ? 'Current Active Plan' : 'Switch to Basic Free'}
          </button>
        </div>

        <div
          className={`bg-white rounded-xl p-6 flex flex-col justify-between space-y-4 ${
            profile.planTier === 'plus'
              ? 'border-2 border-blue-700'
              : 'border border-slate-200'
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-900">Student Plus</h2>
              <span className="font-mono text-lg font-bold text-blue-700 tabular-nums">
                ₹49 / mo
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Unlimited subjects & electives, full 1–3–7 spaced revision workflows, and CSV exports.
            </p>
          </div>
          <button
            type="button"
            disabled={profile.planTier === 'plus' || switchingPlan}
            onClick={() => handleSwitchPlan('plus')}
            className={`w-full py-2 px-4 text-xs font-semibold rounded-lg transition-colors ${
              profile.planTier === 'plus'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-default'
                : 'bg-blue-700 hover:bg-blue-800 text-white'
            }`}
          >
            {profile.planTier === 'plus'
              ? 'Current Active Plan (Pilot Preview)'
              : 'Activate Student Plus Preview'}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Form */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Student Academic Profile
          </h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                maxLength={SCHEMA_LIMITS.DISPLAY_NAME_MAX}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                University / College
              </label>
              <input
                type="text"
                required
                maxLength={SCHEMA_LIMITS.UNIVERSITY_MAX}
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Program</label>
                <input
                  type="text"
                  required
                  maxLength={SCHEMA_LIMITS.PROGRAM_MAX}
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Daily Goal (mins)
                </label>
                <input
                  type="number"
                  min={30}
                  max={720}
                  step={15}
                  required
                  value={dailyGoalMinutes}
                  onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {profileSaved ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  Profile updated
                </span>
              ) : (
                <span className="text-xs text-slate-500">{profile.email}</span>
              )}
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg disabled:opacity-60"
              >
                {savingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Profile
              </button>
            </div>
          </form>
        </section>

        {/* Campus Pilot Validation Form */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Campus Pilot Feedback Survey
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Help shape StudyMate during our Dehradun campus validation cohort.
            </p>
          </div>

          <form onSubmit={handleFeedbackSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Biggest Study Planning Challenge
              </label>
              <input
                type="text"
                required
                maxLength={SCHEMA_LIMITS.FEEDBACK_CHALLENGE_MAX}
                value={biggestChallenge}
                onChange={(e) => setBiggestChallenge(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pricing Preference
                </label>
                <select
                  value={willingnessToPay}
                  onChange={(e) => setWillingnessToPay(e.target.value as WillingnessToPay)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
                >
                  <option value="free-only">Prefer Free Basic Tier</option>
                  <option value="inr-49">Would pay ₹49 / month</option>
                  <option value="inr-99">Would pay ₹99 / month</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Usefulness Rating (1–5)
                </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none font-mono"
                >
                  <option value={5}>5 — Very Useful</option>
                  <option value={4}>4 — Useful</option>
                  <option value={3}>3 — Neutral</option>
                  <option value={2}>2 — Needs Work</option>
                  <option value={1}>1 — Not Useful</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Feature Suggestions or Comments
              </label>
              <textarea
                rows={2}
                maxLength={SCHEMA_LIMITS.FEEDBACK_COMMENTS_MAX}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="What would make StudyMate indispensable during semester exams?"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              {feedbackSuccess ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  Feedback recorded — thank you!
                </span>
              ) : (
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  {myFeedback.length} submitted
                </span>
              )}
              <button
                type="submit"
                disabled={submittingFeedback}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-60"
              >
                {submittingFeedback && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Submit Feedback
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};
