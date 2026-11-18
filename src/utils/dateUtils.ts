import { DayOfWeek, ScheduleBlock, StudySession } from '../types/studymate';

const JS_DAY_TO_DOW: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getOffsetIso(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayDayOfWeek(): DayOfWeek {
  return JS_DAY_TO_DOW[new Date().getDay()];
}

export function daysUntil(isoDate: string): number | null {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const [y, m, d] = isoDate.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function formatDisplayDate(isoDate: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return 'No date';
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export function getLast7Days(): { iso: string; label: string }[] {
  const result: { iso: string; label: string }[] = [];
  for (let i = -6; i <= 0; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    result.push({
      iso: `${y}-${m}-${d}`,
      label: date.toLocaleDateString('en-IN', { weekday: 'short' }),
    });
  }
  return result;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hrs}h` : `${hrs}h ${mins}m`;
}

export interface StudyStreakInfo {
  currentStreak: number;
  bestStreak: number;
  studiedToday: boolean;
}

export function calculateStudyStreak(
  sessions: StudySession[],
  blocks: ScheduleBlock[]
): StudyStreakInfo {
  const activeDates = new Set<string>();
  sessions.forEach((s) => {
    if (s.sessionDate) activeDates.add(s.sessionDate);
  });
  blocks.forEach((b) => {
    if (b.lastCompletedDate) activeDates.add(b.lastCompletedDate);
  });

  const todayIso = getTodayIso();
  const studiedToday = activeDates.has(todayIso);

  if (activeDates.size === 0) {
    return { currentStreak: 0, bestStreak: 0, studiedToday: false };
  }

  // Current streak: count backwards from today, or from yesterday if today isn't logged yet
  let currentStreak = 0;
  let offset = studiedToday ? 0 : -1;
  while (activeDates.has(getOffsetIso(offset))) {
    currentStreak += 1;
    offset -= 1;
  }

  // Best streak across all recorded dates
  const sortedDates = Array.from(activeDates).sort();
  let bestStreak = 0;
  let run = 0;
  let prevTime: number | null = null;

  for (const iso of sortedDates) {
    const [y, m, d] = iso.split('-').map(Number);
    const t = new Date(y, m - 1, d).getTime();
    if (prevTime !== null && Math.round((t - prevTime) / (1000 * 60 * 60 * 24)) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > bestStreak) bestStreak = run;
    prevTime = t;
  }

  return { currentStreak, bestStreak, studiedToday };
}
