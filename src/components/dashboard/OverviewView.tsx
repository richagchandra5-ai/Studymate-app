import React from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  Clock,
  Flame,
  Play,
  Plus,
} from 'lucide-react';
import {
  ScheduleBlock,
  StudySession,
  StudyTask,
  Subject,
  SUBJECT_COLOR_STYLES,
  UserProfile,
} from '../../types/studymate';
import {
  calculateStudyStreak,
  daysUntil,
  formatDisplayDate,
  formatDuration,
  getLast7Days,
  getTodayDayOfWeek,
  getTodayIso,
} from '../../utils/dateUtils';
import { toggleScheduleBlockDate } from '../../services/studymateService';
import { OwlCompanionBanner } from '../OwlMascot';
import { PomodoroTimerCard } from './PomodoroTimerCard';

export type DashboardTab =
  | 'overview'
  | 'timetable'
  | 'subjects'
  | 'tasks'
  | 'focus'
  | 'account';

interface OverviewViewProps {
  profile: UserProfile;
  subjects: Subject[];
  blocks: ScheduleBlock[];
  tasks: StudyTask[];
  sessions: StudySession[];
  onNavigate: (tab: DashboardTab) => void;
  onStartFocusForSubject: (subjectId: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  profile,
  subjects,
  blocks,
  tasks,
  sessions,
  onNavigate,
  onStartFocusForSubject,
}) => {
  const todayIso = getTodayIso();
  const todayDow = getTodayDayOfWeek();

  const todayBlocks = blocks.filter((b) => b.dayOfWeek === todayDow);
  const completedTodayBlocks = todayBlocks.filter(
    (b) => b.lastCompletedDate === todayIso
  ).length;

  const todayMinutes = sessions
    .filter((s) => s.sessionDate === todayIso)
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const openTasks = tasks.filter((t) => t.status !== 'completed');
  const totalTopics = subjects.reduce((sum, s) => sum + s.totalTopics, 0);
  const completedTopics = subjects.reduce((sum, s) => sum + s.completedTopics, 0);
  const masteryPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  const streakInfo = calculateStudyStreak(sessions, blocks);

  const last7Days = getLast7Days();
  const dailyTotals = last7Days.map((day) => ({
    ...day,
    minutes: sessions
      .filter((s) => s.sessionDate === day.iso)
      .reduce((sum, s) => sum + s.durationMinutes, 0),
  }));
  const maxChartMins = Math.max(
    profile.dailyGoalMinutes,
    ...dailyTotals.map((d) => d.minutes),
    60
  );

  const upcomingExams = subjects
    .map((s) => ({ subject: s, days: daysUntil(s.examDate) }))
    .filter((item) => item.days !== null && item.days >= 0)
    .sort((a, b) => (a.days ?? 999) - (b.days ?? 999))
    .slice(0, 3);

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  const handleToggleTodayBlock = async (block: ScheduleBlock) => {
    const nextDate = block.lastCompletedDate === todayIso ? '' : todayIso;
    await toggleScheduleBlockDate(profile.uid, block.id, nextDate);
  };

  const goalPct = Math.min(100, Math.round((todayMinutes / profile.dailyGoalMinutes) * 100));

  return (
    <div className="space-y-6">
      {/* Greeting & Quick Summary */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-sm-accent">
            ☀️ {todayDow}, {formatDisplayDate(todayIso)} · {profile.university}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Hey {profile.displayName.split(' ')[0]}, ready to study? ✨
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('timetable')}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-sm-soft border border-sm rounded-2xl transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap shrink-0"
          >
            📅 Edit Timetable
          </button>
          <button
            type="button"
            onClick={() => onNavigate('focus')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sm-accent rounded-2xl transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            Full Focus Log
          </button>
        </div>
      </div>

      {/* Ollie the Study Owl Encouraging Companion Banner */}
      <OwlCompanionBanner
        studentName={profile.displayName}
        streak={streakInfo.currentStreak}
        todayMinutes={todayMinutes}
        goalMinutes={profile.dailyGoalMinutes}
        openTasksCount={openTasks.length}
        onQuickAction={() => onNavigate('focus')}
      />

      {/* 4-Column Pastel KPI Strip (with Study Streak Counter!) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-amber-50/75 border border-amber-200/80 rounded-3xl p-4 sm:p-5 space-y-2 hover-lift">
          <div className="flex items-center justify-between text-xs font-medium text-amber-900">
            <span>🔥 Study Streak</span>
            <Flame className="w-4 h-4 text-amber-600 shrink-0" />
          </div>
          <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {streakInfo.currentStreak} {streakInfo.currentStreak === 1 ? 'day' : 'days'}
          </div>
          <div className="text-xs text-amber-800 font-mono tabular-nums">
            Best streak: {streakInfo.bestStreak}d ·{' '}
            {streakInfo.studiedToday ? 'Active today' : 'Log 1 session'}
          </div>
        </div>

        <div className="bg-sm-soft border border-sm rounded-3xl p-4 sm:p-5 space-y-2 hover-lift">
          <div className="flex items-center justify-between text-xs font-medium text-sm-accent">
            <span>⏱️ Today&apos;s Focus</span>
            <Clock className="w-4 h-4 text-sm-accent shrink-0" />
          </div>
          <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {formatDuration(todayMinutes)}
          </div>
          <div className="text-xs text-sm-accent font-mono tabular-nums">
            {goalPct}% of {formatDuration(profile.dailyGoalMinutes)} goal
          </div>
        </div>

        <div className="bg-sky-50/75 border border-sky-200/80 rounded-3xl p-4 sm:p-5 space-y-2 hover-lift">
          <div className="flex items-center justify-between text-xs font-medium text-sky-900">
            <span>📅 {todayDow} Blocks</span>
            <CalendarDays className="w-4 h-4 text-sky-600 shrink-0" />
          </div>
          <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {completedTodayBlocks} / {todayBlocks.length}
          </div>
          <div className="text-xs text-sky-800">
            {todayBlocks.length === 0 ? 'Add blocks for today' : 'Scheduled today'}
          </div>
        </div>

        <div className="bg-emerald-50/75 border border-emerald-200/80 rounded-3xl p-4 sm:p-5 space-y-2 hover-lift">
          <div className="flex items-center justify-between text-xs font-medium text-emerald-900">
            <span>🌱 Syllabus Mastery</span>
            <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {masteryPct}%
          </div>
          <div className="text-xs text-emerald-800 font-mono tabular-nums">
            {completedTopics} / {totalTopics} topics ({subjects.length} subjects)
          </div>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Today's Timetable + Weekly Study Chart */}
        <div className="lg:col-span-7 space-y-6">
          {/* Today's Blocks */}
          <section className="bg-white border border-sm rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  📝 Today&apos;s Study Plan ({todayDow})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Check off completed blocks to keep your streak alive!
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('timetable')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-sm-accent hover:underline whitespace-nowrap shrink-0"
              >
                Full Timetable
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {todayBlocks.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-sm bg-sm-soft/50 rounded-2xl space-y-3">
                <p className="text-sm text-slate-600">
                  No study blocks scheduled for {todayDow} yet 🌱
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('timetable')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sm-accent rounded-2xl transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add {todayDow} Block
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayBlocks.map((block) => {
                  const done = block.lastCompletedDate === todayIso;
                  const subject = subjectMap.get(block.subjectId);
                  const colorStyle = subject
                    ? SUBJECT_COLOR_STYLES[subject.color]
                    : SUBJECT_COLOR_STYLES.cobalt;

                  return (
                    <div
                      key={block.id}
                      className={`p-3.5 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between gap-3 ${
                        done
                          ? 'bg-emerald-50/70 border-emerald-200'
                          : 'bg-sm-soft/50 border-sm-subtle hover:border-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleTodayBlock(block)}
                          aria-label={
                            done ? `Unmark ${block.title}` : `Mark ${block.title} complete`
                          }
                          className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                            done
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'bg-white border-sm text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className={`font-semibold ${colorStyle.text}`}>
                              {block.subjectName}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="capitalize">{block.blockType.replace('-', ' ')}</span>
                          </div>
                          <p
                            className={`text-sm font-semibold mt-0.5 truncate ${
                              done ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {block.title}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right font-mono text-xs tabular-nums">
                          <div className="font-semibold text-slate-900">{block.startTime}</div>
                          <div className="text-slate-500">{block.durationMinutes}m</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onStartFocusForSubject(block.subjectId)}
                          title={`Start focus timer for ${block.subjectName}`}
                          className="p-2 text-sm-accent hover:bg-sm-soft bg-white border border-sm rounded-xl transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 7-Day Focus Consistency */}
          <section className="bg-white border border-sm rounded-3xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  📊 7-Day Focus Consistency
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                  Daily goal: {formatDuration(profile.dailyGoalMinutes)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('focus')}
                className="text-xs font-semibold text-sm-accent hover:underline whitespace-nowrap"
              >
                Session History →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 sm:gap-3 pt-2 items-end h-40">
              {dailyTotals.map((day) => {
                const heightPct = Math.max(
                  day.minutes > 0 ? 10 : 4,
                  Math.round((day.minutes / maxChartMins) * 100)
                );
                const metGoal = day.minutes >= profile.dailyGoalMinutes;
                const isToday = day.iso === todayIso;
                const barStyle: React.CSSProperties = {
                  height: `${heightPct}%`,
                  ...(metGoal
                    ? {}
                    : {
                        backgroundColor: isToday ? 'var(--sm-accent)' : 'var(--sm-chart-bar)',
                      }),
                };
                return (
                  <div key={day.iso} className="flex flex-col items-center h-full justify-end gap-2">
                    <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                      {day.minutes > 0 ? `${day.minutes}m` : '0'}
                    </span>
                    <div className="w-full max-w-[36px] flex-1 flex items-end bg-sm-soft rounded-xl overflow-hidden">
                      <div
                        style={barStyle}
                        className={`w-full rounded-t-xl transition-all duration-300 ${
                          metGoal ? 'bg-emerald-400' : ''
                        }`}
                      />
                    </div>
                    <span
                      className={`text-xs ${
                        isToday ? 'font-bold text-sm-accent' : 'text-slate-500'
                      }`}
                    >
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right: Embedded Pomodoro Focus Timer + Upcoming Exams + Priority Deadlines */}
        <div className="lg:col-span-5 space-y-6">
          <PomodoroTimerCard
            profile={profile}
            subjects={subjects}
            compact
            onGoToSubjects={() => onNavigate('subjects')}
          />

          {/* Exam Countdowns */}
          <section className="bg-white border border-sm rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-lg font-bold text-slate-900">
                🎯 Upcoming Exams
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('subjects')}
                className="text-xs font-semibold text-sm-accent hover:underline whitespace-nowrap"
              >
                All Subjects →
              </button>
            </div>

            {upcomingExams.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">
                Add exam dates to your subjects to watch countdowns and syllabus readiness 🌸
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingExams.map(({ subject, days }) => {
                  const pct =
                    subject.totalTopics > 0
                      ? Math.round((subject.completedTopics / subject.totalTopics) * 100)
                      : 0;
                  const style = SUBJECT_COLOR_STYLES[subject.color];
                  return (
                    <div
                      key={subject.id}
                      className={`p-4 border rounded-2xl space-y-2.5 hover-lift ${style.surface} ${style.border}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-mono text-slate-600">{subject.code}</div>
                          <div className="text-sm font-bold text-slate-900 truncate">
                            {subject.name}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div
                            className={`font-mono text-sm font-bold tabular-nums ${
                              (days ?? 99) <= 7 ? 'text-rose-700' : 'text-slate-900'
                            }`}
                          >
                            {days === 0 ? 'Today!' : `${days}d left`}
                          </div>
                          <div className="text-[11px] text-slate-600">
                            {formatDisplayDate(subject.examDate)}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-700 font-mono tabular-nums">
                          <span>Syllabus readiness</span>
                          <span>
                            {subject.completedTopics}/{subject.totalTopics} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 bg-white/80 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${style.bar}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Priority Tasks */}
          <section className="bg-white border border-sm rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-lg font-bold text-slate-900">
                📌 Next Tasks & Revisions
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('tasks')}
                className="text-xs font-semibold text-sm-accent hover:underline whitespace-nowrap"
              >
                Manage All →
              </button>
            </div>

            {openTasks.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">
                All assignments and revision checkpoints are complete! 🎉
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {openTasks.slice(0, 5).map((task) => {
                  const diff = daysUntil(task.dueDate);
                  const overdue = diff !== null && diff < 0;
                  return (
                    <div
                      key={task.id}
                      className="py-3 first:pt-0 last:pb-0 flex justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">{task.subjectName}</span>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">{task.category}</span>
                          {task.category === 'revision' && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">
                                Stage {task.revisionStage}/3
                              </span>
                            </>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-slate-900 truncate mt-0.5">
                          {task.title}
                        </div>
                      </div>
                      <div
                        className={`text-right text-xs font-mono tabular-nums shrink-0 ${
                          overdue ? 'text-rose-700 font-semibold' : 'text-slate-600'
                        }`}
                      >
                        <div>{formatDisplayDate(task.dueDate)}</div>
                        <div className="capitalize text-[11px] font-sans">
                          {overdue ? 'Overdue' : `${task.priority} priority`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
