import { Timestamp } from 'firebase/firestore';

export type SubjectColor = 'cobalt' | 'emerald' | 'amber' | 'rose' | 'teal' | 'slate';
export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
export type BlockType = 'study' | 'revision' | 'assignment' | 'exam-prep';
export type TaskCategory = 'assignment' | 'revision' | 'exam';
export type PriorityLevel = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in-progress' | 'completed';
export type FocusMode = 'pomodoro' | 'deep-work' | 'quick-review';
export type PlanTier = 'free' | 'plus';
export type WillingnessToPay = 'free-only' | 'inr-49' | 'inr-99';
export type AppThemeId = 'pastel-dream' | 'sunset-peach' | 'mint-garden';

export const DAYS_OF_WEEK: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const SCHEMA_LIMITS = {
  DISPLAY_NAME_MAX: 100,
  EMAIL_MAX: 160,
  UNIVERSITY_MAX: 140,
  PROGRAM_MAX: 100,
  SUBJECT_NAME_MAX: 100,
  SUBJECT_CODE_MAX: 24,
  SUBJECT_NOTES_MAX: 500,
  BLOCK_TITLE_MAX: 120,
  TASK_TITLE_MAX: 140,
  TASK_NOTES_MAX: 400,
  SESSION_NOTES_MAX: 300,
  FEEDBACK_CHALLENGE_MAX: 200,
  FEEDBACK_COMMENTS_MAX: 500,
  FREE_SUBJECT_LIMIT: 4,
} as const;

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  university: string;
  program: string;
  dailyGoalMinutes: number;
  planTier: PlanTier;
  onboardingComplete: boolean;
  theme?: AppThemeId;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Subject {
  id: string;
  ownerId: string;
  name: string;
  code: string;
  color: SubjectColor;
  examDate: string;
  totalTopics: number;
  completedTopics: number;
  priority: PriorityLevel;
  notesSummary: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ScheduleBlock {
  id: string;
  ownerId: string;
  subjectId: string;
  subjectName: string;
  title: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  durationMinutes: number;
  blockType: BlockType;
  lastCompletedDate: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface StudyTask {
  id: string;
  ownerId: string;
  subjectId: string;
  subjectName: string;
  title: string;
  category: TaskCategory;
  dueDate: string;
  priority: PriorityLevel;
  status: TaskStatus;
  revisionStage: number;
  notes: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface StudySession {
  id: string;
  ownerId: string;
  subjectId: string;
  subjectName: string;
  durationMinutes: number;
  sessionDate: string;
  focusMode: FocusMode;
  notes: string;
  createdAt?: Timestamp;
}

export interface PilotFeedback {
  id: string;
  ownerId: string;
  university: string;
  biggestChallenge: string;
  willingnessToPay: WillingnessToPay;
  rating: number;
  comments: string;
  createdAt?: Timestamp;
}

export const SUBJECT_COLOR_STYLES: Record<
  SubjectColor,
  { dot: string; bar: string; surface: string; border: string; text: string; label: string }
> = {
  cobalt: {
    dot: 'bg-indigo-400',
    bar: 'bg-indigo-500',
    surface: 'bg-indigo-50/80',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    label: 'Periwinkle',
  },
  emerald: {
    dot: 'bg-emerald-400',
    bar: 'bg-emerald-500',
    surface: 'bg-emerald-50/80',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    label: 'Mint',
  },
  amber: {
    dot: 'bg-amber-400',
    bar: 'bg-amber-500',
    surface: 'bg-amber-50/80',
    border: 'border-amber-200',
    text: 'text-amber-800',
    label: 'Buttercream',
  },
  rose: {
    dot: 'bg-rose-400',
    bar: 'bg-rose-500',
    surface: 'bg-rose-50/80',
    border: 'border-rose-200',
    text: 'text-rose-700',
    label: 'Blush',
  },
  teal: {
    dot: 'bg-sky-400',
    bar: 'bg-sky-500',
    surface: 'bg-sky-50/80',
    border: 'border-sky-200',
    text: 'text-sky-700',
    label: 'Sky',
  },
  slate: {
    dot: 'bg-violet-400',
    bar: 'bg-violet-500',
    surface: 'bg-violet-50/80',
    border: 'border-violet-200',
    text: 'text-violet-700',
    label: 'Lavender',
  },
};
