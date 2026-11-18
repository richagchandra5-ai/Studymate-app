import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  AppThemeId,
  BlockType,
  DayOfWeek,
  FocusMode,
  PilotFeedback,
  PlanTier,
  PriorityLevel,
  SCHEMA_LIMITS,
  ScheduleBlock,
  StudySession,
  StudyTask,
  Subject,
  SubjectColor,
  TaskCategory,
  TaskStatus,
  UserProfile,
  WillingnessToPay,
} from '../types/studymate';
import { getOffsetIso } from '../utils/dateUtils';

function sanitizeText(val: string, maxLen: number): string {
  return val.trim().slice(0, maxLen);
}

function clampNumber(val: number, min: number, max: number): number {
  if (Number.isNaN(val)) return min;
  return Math.min(max, Math.max(min, Math.round(val)));
}

export type StarterStream = 'business' | 'engineering' | 'commerce' | 'blank';

interface StarterSubjectSeed {
  name: string;
  code: string;
  color: SubjectColor;
  daysToExam: number;
  totalTopics: number;
  completedTopics: number;
  priority: PriorityLevel;
  notesSummary: string;
}

const STREAM_SEEDS: Record<Exclude<StarterStream, 'blank'>, StarterSubjectSeed[]> = {
  business: [
    {
      name: 'Managerial Economics',
      code: 'MBA-101',
      color: 'cobalt',
      daysToExam: 18,
      totalTopics: 12,
      completedTopics: 7,
      priority: 'high',
      notesSummary: 'Demand elasticity, cost curves, and oligopoly market models.',
    },
    {
      name: 'Corporate Finance',
      code: 'MBA-104',
      color: 'emerald',
      daysToExam: 24,
      totalTopics: 10,
      completedTopics: 5,
      priority: 'high',
      notesSummary: 'Capital budgeting (NPV/IRR), WACC, and working capital ratios.',
    },
    {
      name: 'Quantitative Methods',
      code: 'MBA-107',
      color: 'amber',
      daysToExam: 30,
      totalTopics: 14,
      completedTopics: 6,
      priority: 'medium',
      notesSummary: 'Hypothesis testing, regression models, and linear programming.',
    },
  ],
  engineering: [
    {
      name: 'Data Structures & Algorithms',
      code: 'CS-201',
      color: 'cobalt',
      daysToExam: 16,
      totalTopics: 16,
      completedTopics: 9,
      priority: 'high',
      notesSummary: 'Trees, graphs, dynamic programming, and complexity analysis.',
    },
    {
      name: 'Operating Systems',
      code: 'CS-204',
      color: 'teal',
      daysToExam: 22,
      totalTopics: 12,
      completedTopics: 6,
      priority: 'high',
      notesSummary: 'CPU scheduling, deadlocks, virtual memory, and file systems.',
    },
    {
      name: 'Database Management Systems',
      code: 'CS-208',
      color: 'emerald',
      daysToExam: 29,
      totalTopics: 10,
      completedTopics: 5,
      priority: 'medium',
      notesSummary: 'Normalization, B+ trees, ACID properties, and SQL joins.',
    },
  ],
  commerce: [
    {
      name: 'Financial Accounting',
      code: 'COM-102',
      color: 'cobalt',
      daysToExam: 15,
      totalTopics: 12,
      completedTopics: 7,
      priority: 'high',
      notesSummary: 'Final accounts, depreciation methods, and cash flow statements.',
    },
    {
      name: 'Business Law & Ethics',
      code: 'COM-105',
      color: 'amber',
      daysToExam: 21,
      totalTopics: 10,
      completedTopics: 4,
      priority: 'medium',
      notesSummary: 'Indian Contract Act, Companies Act provisions, and case briefs.',
    },
    {
      name: 'Microeconomics',
      code: 'COM-109',
      color: 'emerald',
      daysToExam: 27,
      totalTopics: 11,
      completedTopics: 6,
      priority: 'medium',
      notesSummary: 'Consumer equilibrium, indifference curves, and market structures.',
    },
  ],
};

// -------------------------------------------------------------------------
// User Profile & Onboarding
// -------------------------------------------------------------------------
export async function getOrCreateUserProfile(
  uid: string,
  displayName: string,
  email: string
): Promise<UserProfile> {
  const path = `users/${uid}`;
  const ref = doc(db, 'users', uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }

    const cleanName = sanitizeText(displayName || 'Student', SCHEMA_LIMITS.DISPLAY_NAME_MAX);
    const cleanEmail = sanitizeText(email || 'student@example.com', SCHEMA_LIMITS.EMAIL_MAX);

    const payload = {
      uid,
      displayName: cleanName,
      email: cleanEmail,
      university: 'DBS Global University, Dehradun',
      program: 'Undergraduate / Postgraduate',
      dailyGoalMinutes: 180,
      planTier: 'free' as PlanTier,
      theme: 'pastel-dream' as AppThemeId,
      onboardingComplete: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, payload);
    const createdSnap = await getDoc(ref);
    return createdSnap.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeUserProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void
): Unsubscribe {
  const path = `users/${uid}`;
  return onSnapshot(
    doc(db, 'users', uid),
    (snapshot) => {
      onData(snapshot.exists() ? (snapshot.data() as UserProfile) : null);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function completeOnboardingWithStarter(
  uid: string,
  input: {
    displayName: string;
    university: string;
    program: string;
    dailyGoalMinutes: number;
    starterStream: StarterStream;
  }
): Promise<void> {
  const path = `users/${uid}`;
  try {
    const batch = writeBatch(db);
    const userRef = doc(db, 'users', uid);

    batch.update(userRef, {
      displayName: sanitizeText(input.displayName || 'Student', SCHEMA_LIMITS.DISPLAY_NAME_MAX),
      university: sanitizeText(
        input.university || 'DBS Global University, Dehradun',
        SCHEMA_LIMITS.UNIVERSITY_MAX
      ),
      program: sanitizeText(input.program || 'MBA / Undergraduate', SCHEMA_LIMITS.PROGRAM_MAX),
      dailyGoalMinutes: clampNumber(input.dailyGoalMinutes, 30, 720),
      onboardingComplete: true,
      updatedAt: serverTimestamp(),
    });

    if (input.starterStream !== 'blank') {
      const seeds = STREAM_SEEDS[input.starterStream];
      const days: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

      seeds.forEach((seed, idx) => {
        const subjectRef = doc(collection(db, 'users', uid, 'subjects'));
        batch.set(subjectRef, {
          ownerId: uid,
          name: seed.name,
          code: seed.code,
          color: seed.color,
          examDate: getOffsetIso(seed.daysToExam),
          totalTopics: seed.totalTopics,
          completedTopics: seed.completedTopics,
          priority: seed.priority,
          notesSummary: seed.notesSummary,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        const blockRef1 = doc(collection(db, 'users', uid, 'scheduleBlocks'));
        batch.set(blockRef1, {
          ownerId: uid,
          subjectId: subjectRef.id,
          subjectName: seed.name,
          title: `${seed.name} Core Practice`,
          dayOfWeek: days[idx % days.length],
          startTime: idx === 0 ? '17:00' : idx === 1 ? '18:30' : '20:00',
          durationMinutes: 60,
          blockType: 'study' as BlockType,
          lastCompletedDate: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        const blockRef2 = doc(collection(db, 'users', uid, 'scheduleBlocks'));
        batch.set(blockRef2, {
          ownerId: uid,
          subjectId: subjectRef.id,
          subjectName: seed.name,
          title: `${seed.name} Spaced Revision`,
          dayOfWeek: days[(idx + 2) % days.length],
          startTime: '19:00',
          durationMinutes: 45,
          blockType: 'revision' as BlockType,
          lastCompletedDate: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        const taskRef = doc(collection(db, 'users', uid, 'tasks'));
        batch.set(taskRef, {
          ownerId: uid,
          subjectId: subjectRef.id,
          subjectName: seed.name,
          title: idx === 0 ? `Complete Unit 3 Problem Set` : `Revise Core Concepts (Day 1-3-7)`,
          category: (idx === 0 ? 'assignment' : 'revision') as TaskCategory,
          dueDate: getOffsetIso(idx + 2),
          priority: seed.priority,
          status: 'pending' as TaskStatus,
          revisionStage: idx === 0 ? 0 : 1,
          notes: seed.notesSummary,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserProfileDetails(
  uid: string,
  input: {
    displayName: string;
    university: string;
    program: string;
    dailyGoalMinutes: number;
  }
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName: sanitizeText(input.displayName, SCHEMA_LIMITS.DISPLAY_NAME_MAX),
      university: sanitizeText(input.university, SCHEMA_LIMITS.UNIVERSITY_MAX),
      program: sanitizeText(input.program, SCHEMA_LIMITS.PROGRAM_MAX),
      dailyGoalMinutes: clampNumber(input.dailyGoalMinutes, 30, 720),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updatePlanTier(uid: string, planTier: PlanTier): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      planTier,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateUserTheme(uid: string, theme: AppThemeId): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      theme,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// -------------------------------------------------------------------------
// Subscriptions (All queries enforce where('ownerId', '==', uid))
// -------------------------------------------------------------------------
export function subscribeSubjects(
  uid: string,
  onData: (items: Subject[]) => void
): Unsubscribe {
  const path = `users/${uid}/subjects`;
  const q = query(collection(db, 'users', uid, 'subjects'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list: Subject[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Subject, 'id'>),
      }));
      list.sort((a, b) => a.name.localeCompare(b.name));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeScheduleBlocks(
  uid: string,
  onData: (items: ScheduleBlock[]) => void
): Unsubscribe {
  const path = `users/${uid}/scheduleBlocks`;
  const q = query(collection(db, 'users', uid, 'scheduleBlocks'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list: ScheduleBlock[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ScheduleBlock, 'id'>),
      }));
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeTasks(
  uid: string,
  onData: (items: StudyTask[]) => void
): Unsubscribe {
  const path = `users/${uid}/tasks`;
  const q = query(collection(db, 'users', uid, 'tasks'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list: StudyTask[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<StudyTask, 'id'>),
      }));
      list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeStudySessions(
  uid: string,
  onData: (items: StudySession[]) => void
): Unsubscribe {
  const path = `users/${uid}/studySessions`;
  const q = query(collection(db, 'users', uid, 'studySessions'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list: StudySession[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<StudySession, 'id'>),
      }));
      list.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeMyPilotFeedback(
  uid: string,
  onData: (items: PilotFeedback[]) => void
): Unsubscribe {
  const path = `pilotFeedback`;
  const q = query(collection(db, 'pilotFeedback'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list: PilotFeedback[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<PilotFeedback, 'id'>),
      }));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// -------------------------------------------------------------------------
// Subjects CRUD
// -------------------------------------------------------------------------
export async function createSubject(
  uid: string,
  input: {
    name: string;
    code: string;
    color: SubjectColor;
    examDate: string;
    totalTopics: number;
    completedTopics: number;
    priority: PriorityLevel;
    notesSummary: string;
  }
): Promise<void> {
  const path = `users/${uid}/subjects`;
  try {
    const total = clampNumber(input.totalTopics, 1, 500);
    const completed = clampNumber(input.completedTopics, 0, total);
    const newRef = doc(collection(db, 'users', uid, 'subjects'));
    await setDoc(newRef, {
      ownerId: uid,
      name: sanitizeText(input.name, SCHEMA_LIMITS.SUBJECT_NAME_MAX),
      code: sanitizeText(input.code, SCHEMA_LIMITS.SUBJECT_CODE_MAX),
      color: input.color,
      examDate: input.examDate.trim(),
      totalTopics: total,
      completedTopics: completed,
      priority: input.priority,
      notesSummary: sanitizeText(input.notesSummary, SCHEMA_LIMITS.SUBJECT_NOTES_MAX),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateSubject(
  uid: string,
  subjectId: string,
  input: {
    name: string;
    code: string;
    color: SubjectColor;
    examDate: string;
    totalTopics: number;
    completedTopics: number;
    priority: PriorityLevel;
    notesSummary: string;
  }
): Promise<void> {
  const path = `users/${uid}/subjects/${subjectId}`;
  try {
    const total = clampNumber(input.totalTopics, 1, 500);
    const completed = clampNumber(input.completedTopics, 0, total);
    await updateDoc(doc(db, 'users', uid, 'subjects', subjectId), {
      name: sanitizeText(input.name, SCHEMA_LIMITS.SUBJECT_NAME_MAX),
      code: sanitizeText(input.code, SCHEMA_LIMITS.SUBJECT_CODE_MAX),
      color: input.color,
      examDate: input.examDate.trim(),
      totalTopics: total,
      completedTopics: completed,
      priority: input.priority,
      notesSummary: sanitizeText(input.notesSummary, SCHEMA_LIMITS.SUBJECT_NOTES_MAX),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteSubjectCascade(
  uid: string,
  subjectId: string,
  blocks: ScheduleBlock[],
  tasks: StudyTask[]
): Promise<void> {
  const path = `users/${uid}/subjects/${subjectId}`;
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'users', uid, 'subjects', subjectId));
    blocks
      .filter((b) => b.subjectId === subjectId)
      .forEach((b) => batch.delete(doc(db, 'users', uid, 'scheduleBlocks', b.id)));
    tasks
      .filter((t) => t.subjectId === subjectId)
      .forEach((t) => batch.delete(doc(db, 'users', uid, 'tasks', t.id)));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------------------
// Schedule Blocks CRUD
// -------------------------------------------------------------------------
export async function createScheduleBlock(
  uid: string,
  input: {
    subjectId: string;
    subjectName: string;
    title: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    durationMinutes: number;
    blockType: BlockType;
  }
): Promise<void> {
  const path = `users/${uid}/scheduleBlocks`;
  try {
    const newRef = doc(collection(db, 'users', uid, 'scheduleBlocks'));
    await setDoc(newRef, {
      ownerId: uid,
      subjectId: input.subjectId,
      subjectName: sanitizeText(input.subjectName, SCHEMA_LIMITS.SUBJECT_NAME_MAX),
      title: sanitizeText(input.title, SCHEMA_LIMITS.BLOCK_TITLE_MAX),
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      durationMinutes: clampNumber(input.durationMinutes, 15, 360),
      blockType: input.blockType,
      lastCompletedDate: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateScheduleBlock(
  uid: string,
  blockId: string,
  input: {
    subjectId: string;
    subjectName: string;
    title: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    durationMinutes: number;
    blockType: BlockType;
  }
): Promise<void> {
  const path = `users/${uid}/scheduleBlocks/${blockId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'scheduleBlocks', blockId), {
      subjectId: input.subjectId,
      subjectName: sanitizeText(input.subjectName, SCHEMA_LIMITS.SUBJECT_NAME_MAX),
      title: sanitizeText(input.title, SCHEMA_LIMITS.BLOCK_TITLE_MAX),
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      durationMinutes: clampNumber(input.durationMinutes, 15, 360),
      blockType: input.blockType,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleScheduleBlockDate(
  uid: string,
  blockId: string,
  lastCompletedDate: string
): Promise<void> {
  const path = `users/${uid}/scheduleBlocks/${blockId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'scheduleBlocks', blockId), {
      lastCompletedDate,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteScheduleBlock(uid: string, blockId: string): Promise<void> {
  const path = `users/${uid}/scheduleBlocks/${blockId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'scheduleBlocks', blockId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------------------
// Study Tasks & Revision Cycles CRUD
// -------------------------------------------------------------------------
export async function createStudyTask(
  uid: string,
  input: {
    subjectId: string;
    subjectName: string;
    title: string;
    category: TaskCategory;
    dueDate: string;
    priority: PriorityLevel;
    notes: string;
  }
): Promise<void> {
  const path = `users/${uid}/tasks`;
  try {
    const newRef = doc(collection(db, 'users', uid, 'tasks'));
    await setDoc(newRef, {
      ownerId: uid,
      subjectId: input.subjectId,
      subjectName: sanitizeText(input.subjectName, SCHEMA_LIMITS.SUBJECT_NAME_MAX),
      title: sanitizeText(input.title, SCHEMA_LIMITS.TASK_TITLE_MAX),
      category: input.category,
      dueDate: input.dueDate,
      priority: input.priority,
      status: 'pending' as TaskStatus,
      revisionStage: input.category === 'revision' ? 1 : 0,
      notes: sanitizeText(input.notes, SCHEMA_LIMITS.TASK_NOTES_MAX),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateStudyTaskDetails(
  uid: string,
  taskId: string,
  input: {
    subjectId: string;
    subjectName: string;
    title: string;
    category: TaskCategory;
    dueDate: string;
    priority: PriorityLevel;
    notes: string;
  }
): Promise<void> {
  const path = `users/${uid}/tasks/${taskId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'tasks', taskId), {
      subjectId: input.subjectId,
      subjectName: sanitizeText(input.subjectName, SCHEMA_LIMITS.SUBJECT_NAME_MAX),
      title: sanitizeText(input.title, SCHEMA_LIMITS.TASK_TITLE_MAX),
      category: input.category,
      dueDate: input.dueDate,
      priority: input.priority,
      notes: sanitizeText(input.notes, SCHEMA_LIMITS.TASK_NOTES_MAX),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateStudyTaskProgress(
  uid: string,
  taskId: string,
  status: TaskStatus,
  revisionStage: number
): Promise<void> {
  const path = `users/${uid}/tasks/${taskId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'tasks', taskId), {
      status,
      revisionStage: clampNumber(revisionStage, 0, 3),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteStudyTask(uid: string, taskId: string): Promise<void> {
  const path = `users/${uid}/tasks/${taskId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'tasks', taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------------------
// Study Sessions CRUD
// -------------------------------------------------------------------------
export async function logStudySession(
  uid: string,
  input: {
    subjectId: string;
    subjectName: string;
    durationMinutes: number;
    sessionDate: string;
    focusMode: FocusMode;
    notes: string;
  }
): Promise<void> {
  const path = `users/${uid}/studySessions`;
  try {
    const newRef = doc(collection(db, 'users', uid, 'studySessions'));
    await setDoc(newRef, {
      ownerId: uid,
      subjectId: input.subjectId,
      subjectName: sanitizeText(input.subjectName, SCHEMA_LIMITS.SUBJECT_NAME_MAX),
      durationMinutes: clampNumber(input.durationMinutes, 1, 480),
      sessionDate: input.sessionDate,
      focusMode: input.focusMode,
      notes: sanitizeText(input.notes, SCHEMA_LIMITS.SESSION_NOTES_MAX),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteStudySession(uid: string, sessionId: string): Promise<void> {
  const path = `users/${uid}/studySessions/${sessionId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'studySessions', sessionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------------------
// Campus Pilot Feedback
// -------------------------------------------------------------------------
export async function submitPilotFeedback(
  uid: string,
  input: {
    university: string;
    biggestChallenge: string;
    willingnessToPay: WillingnessToPay;
    rating: number;
    comments: string;
  }
): Promise<void> {
  const path = 'pilotFeedback';
  try {
    const newRef = doc(collection(db, 'pilotFeedback'));
    await setDoc(newRef, {
      ownerId: uid,
      university: sanitizeText(input.university, SCHEMA_LIMITS.UNIVERSITY_MAX),
      biggestChallenge: sanitizeText(input.biggestChallenge, SCHEMA_LIMITS.FEEDBACK_CHALLENGE_MAX),
      willingnessToPay: input.willingnessToPay,
      rating: clampNumber(input.rating, 1, 5),
      comments: sanitizeText(input.comments, SCHEMA_LIMITS.FEEDBACK_COMMENTS_MAX),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
