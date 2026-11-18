import React, { useEffect, useState } from 'react';
import { CheckCircle2, Download, Pause, Play, RotateCcw, Trash2 } from 'lucide-react';
import {
  FocusMode,
  SCHEMA_LIMITS,
  StudySession,
  Subject,
  UserProfile,
} from '../../types/studymate';
import { deleteStudySession, logStudySession } from '../../services/studymateService';
import { formatDisplayDate, formatDuration, getTodayIso } from '../../utils/dateUtils';

interface FocusTimerViewProps {
  profile: UserProfile;
  subjects: Subject[];
  sessions: StudySession[];
  initialSubjectId?: string;
  onGoToSubjects: () => void;
  onUpgradeRequested: () => void;
}

const MODE_PRESETS: { id: FocusMode; label: string; minutes: number }[] = [
  { id: 'pomodoro', label: 'Pomodoro', minutes: 25 },
  { id: 'deep-work', label: 'Deep Work', minutes: 50 },
  { id: 'quick-review', label: 'Quick Review', minutes: 15 },
];

export const FocusTimerView: React.FC<FocusTimerViewProps> = ({
  profile,
  subjects,
  sessions,
  initialSubjectId,
  onGoToSubjects,
  onUpgradeRequested,
}) => {
  const [focusMode, setFocusMode] = useState<FocusMode>('pomodoro');
  const [targetMinutes, setTargetMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  const [subjectId, setSubjectId] = useState(initialSubjectId || subjects[0]?.id || '');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loggedFeedback, setLoggedFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (initialSubjectId && subjects.some((s) => s.id === initialSubjectId)) {
      setSubjectId(initialSubjectId);
    } else if (!subjectId && subjects[0]) {
      setSubjectId(subjects[0].id);
    }
  }, [initialSubjectId, subjects, subjectId]);

  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRunning]);

  const selectPreset = (mode: FocusMode, mins: number) => {
    setIsRunning(false);
    setFocusMode(mode);
    setTargetMinutes(mins);
    setSecondsLeft(mins * 60);
    setLoggedFeedback(null);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(targetMinutes * 60);
  };

  const handleCompleteAndLog = async () => {
    const subj = subjects.find((s) => s.id === subjectId);
    if (!subj) return;

    const elapsedSeconds = targetMinutes * 60 - secondsLeft;
    const loggedMinutes =
      secondsLeft === 0
        ? targetMinutes
        : Math.max(1, Math.round(elapsedSeconds / 60) || targetMinutes);

    setSaving(true);
    try {
      await logStudySession(profile.uid, {
        subjectId: subj.id,
        subjectName: subj.name,
        durationMinutes: loggedMinutes,
        sessionDate: getTodayIso(),
        focusMode,
        notes,
      });
      setIsRunning(false);
      setSecondsLeft(targetMinutes * 60);
      setNotes('');
      setLoggedFeedback(`Logged ${loggedMinutes} minutes for ${subj.name}.`);
    } finally {
      setSaving(false);
    }
  };

  const handleExportCsv = () => {
    if (profile.planTier !== 'plus') {
      onUpgradeRequested();
      return;
    }
    const headers = ['Date', 'Subject', 'Mode', 'Minutes', 'Notes'];
    const rows = sessions.map((s) => [
      s.sessionDate,
      `"${s.subjectName.replace(/"/g, '""')}"`,
      s.focusMode,
      String(s.durationMinutes),
      `"${s.notes.replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `studymate-sessions-${getTodayIso()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const minsDisplay = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secsDisplay = String(secondsLeft % 60).padStart(2, '0');
  const totalSeconds = targetMinutes * 60;
  const progressRatio = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;
  const circumference = 2 * Math.PI * 84;
  const dashOffset = circumference * (1 - progressRatio);

  const todayTotal = sessions
    .filter((s) => s.sessionDate === getTodayIso())
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Focus Timer & Study Log
          </h1>
          <p className="text-sm text-slate-600 mt-0.5 font-mono tabular-nums">
            Today logged: {formatDuration(todayTotal)} / {formatDuration(profile.dailyGoalMinutes)}
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          {profile.planTier === 'plus' ? 'Export Study CSV' : 'Export CSV (Plus)'}
        </button>
      </div>

      {subjects.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-amber-900">
            Add a subject first so your focus sessions can be linked to your syllabus progress.
          </p>
          <button
            type="button"
            onClick={onGoToSubjects}
            className="px-3.5 py-2 text-xs font-semibold text-amber-900 bg-white border border-amber-300 rounded-lg hover:bg-amber-100 whitespace-nowrap shrink-0"
          >
            Go to Subjects →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Timer Card */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center space-y-6">
          <div className="w-full flex items-center justify-center gap-1 p-1 bg-slate-100 rounded-lg">
            {MODE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => selectPreset(preset.id, preset.minutes)}
                className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  focusMode === preset.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {preset.label} ({preset.minutes}m)
              </button>
            ))}
          </div>

          {/* Circular Progress Ring */}
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-48 h-48 -rotate-90" viewBox="0 0 192 192">
              <circle
                cx="96"
                cy="96"
                r="84"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="8"
              />
              <circle
                cx="96"
                cy="96"
                r="84"
                fill="none"
                stroke="#1d4ed8"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-4xl font-bold text-slate-900 tabular-nums">
                {minsDisplay}:{secsDisplay}
              </span>
              <span className="text-xs text-slate-500 mt-1 capitalize">
                {focusMode.replace('-', ' ')}
              </span>
            </div>
          </div>

          <div className="w-full space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Active Subject
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                disabled={subjects.length === 0}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Session Note (Optional)
              </label>
              <input
                type="text"
                maxLength={SCHEMA_LIMITS.SESSION_NOTES_MAX}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Solved 10 numerical problems"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="w-full flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setLoggedFeedback(null);
                setIsRunning((prev) => !prev);
              }}
              disabled={subjects.length === 0}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg transition-colors"
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isRunning ? 'Pause' : secondsLeft === 0 ? 'Restart' : 'Start'}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              aria-label="Reset timer"
              className="p-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleCompleteAndLog}
            disabled={saving || subjects.length === 0}
            className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{saving ? 'Logging Session...' : 'Complete & Log Session Now'}</span>
          </button>

          {loggedFeedback && (
            <div className="w-full p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 text-center">
              {loggedFeedback}
            </div>
          )}
        </section>

        {/* Session History Table */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900">
                Recent Focus Sessions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                {sessions.length} total sessions recorded
              </p>
            </div>
          </div>

          {sessions.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-200 rounded-lg space-y-2">
              <p className="text-sm font-medium text-slate-700">No study sessions logged yet</p>
              <p className="text-xs text-slate-500">
                Start the focus timer on the left and log your first session to build your streak.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                    <th className="py-2.5 pr-3">Date</th>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3 text-right">Duration</th>
                    <th className="py-2.5 pl-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {sessions.slice(0, 15).map((sess) => (
                    <tr key={sess.id} className="hover:bg-slate-50">
                      <td className="py-3 pr-3 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {formatDisplayDate(sess.sessionDate)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-900">{sess.subjectName}</div>
                        {sess.notes && (
                          <div className="text-xs text-slate-500 truncate max-w-[220px]">
                            {sess.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-600 capitalize whitespace-nowrap">
                        {sess.focusMode.replace('-', ' ')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                        {sess.durationMinutes} min
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <button
                          type="button"
                          onClick={() => deleteStudySession(profile.uid, sess.id)}
                          aria-label="Delete session"
                          className="p-1.5 text-slate-400 hover:text-red-700 rounded-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
