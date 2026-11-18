import React from 'react';
import { Download, Trash2 } from 'lucide-react';
import { StudySession, Subject, UserProfile } from '../../types/studymate';
import { deleteStudySession } from '../../services/studymateService';
import { formatDisplayDate, formatDuration, getTodayIso } from '../../utils/dateUtils';
import { PomodoroTimerCard } from './PomodoroTimerCard';

interface FocusTimerViewProps {
  profile: UserProfile;
  subjects: Subject[];
  sessions: StudySession[];
  initialSubjectId?: string;
  onGoToSubjects: () => void;
  onUpgradeRequested: () => void;
}

export const FocusTimerView: React.FC<FocusTimerViewProps> = ({
  profile,
  subjects,
  sessions,
  initialSubjectId,
  onGoToSubjects,
  onUpgradeRequested,
}) => {
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

  const todayTotal = sessions
    .filter((s) => s.sessionDate === getTodayIso())
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            ⏱️ Focus Timer & Study Log
          </h1>
          <p className="text-sm text-slate-600 mt-0.5 font-mono tabular-nums">
            Today logged: {formatDuration(todayTotal)} / {formatDuration(profile.dailyGoalMinutes)}
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-sm-soft border border-sm rounded-2xl transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          {profile.planTier === 'plus' ? 'Export Study CSV' : 'Export CSV (Plus ✨)'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Shared Pomodoro Timer Card */}
        <div className="lg:col-span-5">
          <PomodoroTimerCard
            profile={profile}
            subjects={subjects}
            initialSubjectId={initialSubjectId}
            onGoToSubjects={onGoToSubjects}
          />
        </div>

        {/* Session History Table */}
        <section className="lg:col-span-7 bg-white border border-sm rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                📖 Recent Focus Sessions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                {sessions.length} total sessions recorded
              </p>
            </div>
          </div>

          {sessions.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-sm bg-sm-soft/50 rounded-2xl space-y-2">
              <p className="text-sm font-semibold text-slate-700">No study sessions logged yet 🌱</p>
              <p className="text-xs text-slate-500">
                Start the Pomodoro timer on the left and log your first session to build your streak!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-sm-subtle text-xs font-semibold text-slate-500">
                    <th className="py-2.5 pr-3">Date</th>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3 text-right">Duration</th>
                    <th className="py-2.5 pl-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {sessions.slice(0, 15).map((sess) => (
                    <tr key={sess.id} className="hover:bg-sm-soft/50 transition-colors">
                      <td className="py-3 pr-3 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {formatDisplayDate(sess.sessionDate)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{sess.subjectName}</div>
                        {sess.notes && (
                          <div className="text-xs text-slate-500 truncate max-w-[220px]">
                            {sess.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-600 capitalize whitespace-nowrap">
                        {sess.focusMode.replace('-', ' ')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs font-bold text-sm-accent tabular-nums whitespace-nowrap">
                        {sess.durationMinutes} min
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <button
                          type="button"
                          onClick={() => deleteStudySession(profile.uid, sess.id)}
                          aria-label="Delete session"
                          className="p-1.5 text-slate-400 hover:text-rose-700 rounded-lg"
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
