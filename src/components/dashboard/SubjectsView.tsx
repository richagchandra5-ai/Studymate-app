import React, { useState } from 'react';
import { BookOpen, Edit2, Minus, Plus, Trash2, X } from 'lucide-react';
import {
  PriorityLevel,
  SCHEMA_LIMITS,
  ScheduleBlock,
  StudyTask,
  Subject,
  SUBJECT_COLOR_STYLES,
  SubjectColor,
  UserProfile,
} from '../../types/studymate';
import {
  createSubject,
  deleteSubjectCascade,
  updateSubject,
} from '../../services/studymateService';
import { daysUntil, formatDisplayDate } from '../../utils/dateUtils';

interface SubjectsViewProps {
  profile: UserProfile;
  subjects: Subject[];
  blocks: ScheduleBlock[];
  tasks: StudyTask[];
  onUpgradeRequested: () => void;
}

const COLOR_OPTIONS: SubjectColor[] = ['cobalt', 'emerald', 'amber', 'teal', 'rose', 'slate'];

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  profile,
  subjects,
  blocks,
  tasks,
  onUpgradeRequested,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState<SubjectColor>('cobalt');
  const [examDate, setExamDate] = useState('');
  const [totalTopics, setTotalTopics] = useState(10);
  const [completedTopics, setCompletedTopics] = useState(0);
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [notesSummary, setNotesSummary] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const atFreeLimit =
    profile.planTier === 'free' && subjects.length >= SCHEMA_LIMITS.FREE_SUBJECT_LIMIT;

  const openCreateModal = () => {
    if (atFreeLimit) {
      onUpgradeRequested();
      return;
    }
    setEditingSubject(null);
    setName('');
    setCode('');
    setColor('cobalt');
    setExamDate('');
    setTotalTopics(10);
    setCompletedTopics(0);
    setPriority('medium');
    setNotesSummary('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (subj: Subject) => {
    setEditingSubject(subj);
    setName(subj.name);
    setCode(subj.code);
    setColor(subj.color);
    setExamDate(subj.examDate);
    setTotalTopics(subj.totalTopics);
    setCompletedTopics(subj.completedTopics);
    setPriority(subj.priority);
    setNotesSummary(subj.notesSummary);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setFormError('Subject name and course code are required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editingSubject) {
        await updateSubject(profile.uid, editingSubject.id, {
          name,
          code,
          color,
          examDate,
          totalTopics,
          completedTopics,
          priority,
          notesSummary,
        });
      } else {
        await createSubject(profile.uid, {
          name,
          code,
          color,
          examDate,
          totalTopics,
          completedTopics,
          priority,
          notesSummary,
        });
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save subject.');
    } finally {
      setSaving(false);
    }
  };

  const adjustTopicCount = async (subj: Subject, delta: number) => {
    const nextCompleted = Math.min(subj.totalTopics, Math.max(0, subj.completedTopics + delta));
    if (nextCompleted === subj.completedTopics) return;
    await updateSubject(profile.uid, subj.id, {
      name: subj.name,
      code: subj.code,
      color: subj.color,
      examDate: subj.examDate,
      totalTopics: subj.totalTopics,
      completedTopics: nextCompleted,
      priority: subj.priority,
      notesSummary: subj.notesSummary,
    });
  };

  const handleConfirmDelete = async (subjectId: string) => {
    await deleteSubjectCascade(profile.uid, subjectId, blocks, tasks);
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Subjects & Syllabus Tracker
          </h1>
          <p className="text-sm text-slate-600 mt-0.5 font-mono tabular-nums">
            {subjects.length} active subjects
            {profile.planTier === 'free'
              ? ` · Free plan limit: ${subjects.length}/${SCHEMA_LIMITS.FREE_SUBJECT_LIMIT}`
              : ' · Unlimited (Student Plus)'}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          {atFreeLimit ? 'Upgrade for More Subjects' : 'Add Subject'}
        </button>
      </div>

      {atFreeLimit && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-blue-950">
            You have reached the Free plan limit of {SCHEMA_LIMITS.FREE_SUBJECT_LIMIT} subjects.
            Activate Student Plus (₹49/month) to manage unlimited courses and electives.
          </p>
          <button
            type="button"
            onClick={onUpgradeRequested}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg whitespace-nowrap shrink-0"
          >
            View Student Plus →
          </button>
        </div>
      )}

      {subjects.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center space-y-3">
          <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
          <h2 className="font-display text-lg font-semibold text-slate-900">No subjects added yet</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Add your current semester papers with exam dates and topic counts to start building
            your study timetable.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" />
            Add First Subject
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {subjects.map((subj) => {
            const pct =
              subj.totalTopics > 0
                ? Math.round((subj.completedTopics / subj.totalTopics) * 100)
                : 0;
            const days = daysUntil(subj.examDate);
            const style = SUBJECT_COLOR_STYLES[subj.color];
            const isDeleting = confirmDeleteId === subj.id;

            return (
              <div
                key={subj.id}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-semibold text-slate-700">{subj.code}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{subj.priority} priority</span>
                        {days !== null && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span
                              className={`font-mono tabular-nums ${
                                days >= 0 && days <= 7
                                  ? 'text-red-700 font-semibold'
                                  : 'text-slate-600'
                              }`}
                            >
                              {days < 0
                                ? `Exam passed (${formatDisplayDate(subj.examDate)})`
                                : days === 0
                                  ? 'Exam today'
                                  : `${days}d to exam (${formatDisplayDate(subj.examDate)})`}
                            </span>
                          </>
                        )}
                      </div>
                      <h2 className="font-display text-lg font-bold text-slate-900 mt-1 truncate">
                        {subj.name}
                      </h2>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(subj)}
                        aria-label={`Edit ${subj.name}`}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(isDeleting ? null : subj.id)}
                        aria-label={`Delete ${subj.name}`}
                        className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-slate-100 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {subj.notesSummary && (
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {subj.notesSummary}
                    </p>
                  )}
                </div>

                {/* Progress Bar + Quick Topic Stepper */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-mono text-xs tabular-nums text-slate-700">
                      <span className="font-semibold text-slate-900">
                        {subj.completedTopics}/{subj.totalTopics}
                      </span>{' '}
                      topics ({pct}%)
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => adjustTopicCount(subj, -1)}
                        disabled={subj.completedTopics <= 0}
                        aria-label={`Decrease completed topics for ${subj.name}`}
                        className="p-1.5 border border-slate-200 rounded-md text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustTopicCount(subj, 1)}
                        disabled={subj.completedTopics >= subj.totalTopics}
                        aria-label={`Increase completed topics for ${subj.name}`}
                        className="p-1.5 border border-slate-200 rounded-md text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${style.bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {isDeleting && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-3">
                      <span className="text-xs text-red-800">
                        Delete subject and its linked timetable/tasks?
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmDelete(subj.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Subject Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              aria-label="Close modal"
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-900 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="font-display text-lg font-bold text-slate-900">
              {editingSubject ? 'Edit Subject' : 'Add Subject'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={SCHEMA_LIMITS.SUBJECT_NAME_MAX}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Managerial Economics"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Course Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={SCHEMA_LIMITS.SUBJECT_CODE_MAX}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g., MBA-101"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Exam Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Total Syllabus Topics
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    required
                    value={totalTopics}
                    onChange={(e) => setTotalTopics(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Completed Topics
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={totalTopics}
                    required
                    value={completedTopics}
                    onChange={(e) => setCompletedTopics(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Accent Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setColor(opt)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 ${
                        color === opt
                          ? 'border-slate-900 bg-slate-100 text-slate-900'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${SUBJECT_COLOR_STYLES[opt].dot}`}
                      />
                      <span>{SUBJECT_COLOR_STYLES[opt].label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Revision Notes / Key Chapters
                </label>
                <textarea
                  rows={3}
                  maxLength={SCHEMA_LIMITS.SUBJECT_NOTES_MAX}
                  value={notesSummary}
                  onChange={(e) => setNotesSummary(e.target.value)}
                  placeholder="Key formulas, reference textbook chapters, or module focus..."
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
                />
              </div>

              {formError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg"
                >
                  {saving ? 'Saving...' : editingSubject ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
