import React, { useState } from 'react';
import {
  Check,
  Edit2,
  Layers,
  Plus,
  RotateCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  PriorityLevel,
  SCHEMA_LIMITS,
  StudyTask,
  Subject,
  TaskCategory,
  TaskStatus,
} from '../../types/studymate';
import {
  createStudyTask,
  deleteStudyTask,
  updateStudyTaskDetails,
  updateStudyTaskProgress,
} from '../../services/studymateService';
import { daysUntil, formatDisplayDate, getTodayIso } from '../../utils/dateUtils';

interface TasksViewProps {
  uid: string;
  subjects: Subject[];
  tasks: StudyTask[];
  onGoToSubjects: () => void;
}

const CATEGORY_EMOJI: Record<TaskCategory, string> = {
  assignment: '📝',
  revision: '🔁',
  exam: '🎯',
};

export const TasksView: React.FC<TasksViewProps> = ({
  uid,
  subjects,
  tasks,
  onGoToSubjects,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | TaskCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'completed'>('active');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('assignment');
  const [dueDate, setDueDate] = useState(getTodayIso());
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  const openCreateModal = () => {
    setEditingTask(null);
    setSubjectId(subjects[0]?.id ?? '');
    setTitle('');
    setCategory('assignment');
    setDueDate(getTodayIso());
    setPriority('medium');
    setNotes('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (task: StudyTask) => {
    setEditingTask(task);
    setSubjectId(task.subjectId);
    setTitle(task.title);
    setCategory(task.category);
    setDueDate(task.dueDate);
    setPriority(task.priority);
    setNotes(task.notes);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const subj = subjectMap.get(subjectId);
    if (!subj) {
      setFormError('Please select a subject.');
      return;
    }
    if (!title.trim()) {
      setFormError('Please enter a task title.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editingTask) {
        await updateStudyTaskDetails(uid, editingTask.id, {
          subjectId: subj.id,
          subjectName: subj.name,
          title,
          category,
          dueDate,
          priority,
          notes,
        });
      } else {
        await createStudyTask(uid, {
          subjectId: subj.id,
          subjectName: subj.name,
          title,
          category,
          dueDate,
          priority,
          notes,
        });
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save task.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleComplete = async (task: StudyTask) => {
    const nextStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    await updateStudyTaskProgress(uid, task.id, nextStatus, task.revisionStage);
  };

  const handleAdvanceRevision = async (task: StudyTask) => {
    const nextStage = Math.min(3, task.revisionStage + 1);
    const nextStatus: TaskStatus = nextStage >= 3 ? 'completed' : 'in-progress';
    await updateStudyTaskProgress(uid, task.id, nextStatus, nextStage);
  };

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter === 'active' && task.status === 'completed') return false;
    if (statusFilter === 'completed' && task.status !== 'completed') return false;
    if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        task.title.toLowerCase().includes(q) ||
        task.subjectName.toLowerCase().includes(q) ||
        task.notes.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            🔁 Assignments & Revision Tracker
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Track deadlines and step through Day 1, Day 3, and Day 7 revision checkpoints.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          disabled={subjects.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sm-accent disabled:opacity-50 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Task or Revision
        </button>
      </div>

      {subjects.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-amber-900">
            Create a subject before logging assignments or revision milestones 🌱
          </p>
          <button
            type="button"
            onClick={onGoToSubjects}
            className="px-3.5 py-2 text-xs font-semibold text-amber-900 bg-white border border-amber-300 rounded-xl hover:bg-amber-100 whitespace-nowrap shrink-0"
          >
            Go to Subjects →
          </button>
        </div>
      )}

      {/* Search & Segmented Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-sm rounded-3xl p-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-sm-accent opacity-70 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by task, subject, or notes..."
            className="w-full pl-9 pr-3 py-2 text-sm sm-input rounded-2xl"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-sm-soft rounded-2xl">
            {(['all', 'assignment', 'revision', 'exam'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl capitalize transition-colors whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-sm-accent'
                }`}
              >
                {cat === 'all' ? 'All Types' : `${cat}s`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 bg-sm-soft rounded-2xl">
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap ${
                statusFilter === 'active'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-sm-accent'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap ${
                statusFilter === 'completed'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-sm-accent'
              }`}
            >
              Completed
            </button>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white border border-dashed border-sm rounded-3xl p-10 text-center space-y-3">
          <Layers className="w-8 h-8 text-sm-accent opacity-70 mx-auto" />
          <h2 className="font-display text-base font-bold text-slate-900">
            No matching {statusFilter} tasks ✨
          </h2>
          <p className="text-sm text-slate-600">
            {searchTerm
              ? 'Try clearing your search query or switching filters.'
              : 'Add an assignment deadline, exam prep checklist, or spaced revision task.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const done = task.status === 'completed';
            const diff = daysUntil(task.dueDate);
            const overdue = !done && diff !== null && diff < 0;

            return (
              <div
                key={task.id}
                className={`bg-white border rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover-lift ${
                  done ? 'border-emerald-200 bg-emerald-50/30' : 'border-sm'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(task)}
                    aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
                    className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                      done
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-white border-sm text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span aria-hidden="true">{CATEGORY_EMOJI[task.category]}</span>
                      <span className="font-semibold text-slate-800">{task.subjectName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{task.category}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`capitalize ${
                          task.priority === 'high' ? 'text-amber-700 font-semibold' : ''
                        }`}
                      >
                        {task.priority} priority
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`font-mono tabular-nums ${
                          overdue ? 'text-rose-700 font-semibold' : 'text-slate-600'
                        }`}
                      >
                        {overdue
                          ? `Overdue (${formatDisplayDate(task.dueDate)})`
                          : `Due ${formatDisplayDate(task.dueDate)}`}
                      </span>
                    </div>

                    <div
                      className={`text-sm font-bold ${
                        done ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {task.title}
                    </div>

                    {task.notes && (
                      <p className="text-xs text-slate-600 line-clamp-1">{task.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-8 sm:pl-0">
                  {task.category === 'revision' && (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-600 tabular-nums">
                        Cycle {task.revisionStage}/3
                      </span>
                      {!done && (
                        <button
                          type="button"
                          onClick={() => handleAdvanceRevision(task)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-sm-accent bg-sm-soft hover:bg-sm-accent-soft border border-sm rounded-xl transition-colors whitespace-nowrap"
                        >
                          <RotateCw className="w-3 h-3" />
                          {task.revisionStage >= 3 ? 'Finish' : 'Next Cycle'}
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(task)}
                      aria-label={`Edit ${task.title}`}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-sm-soft rounded-xl"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteStudyTask(uid, task.id)}
                      aria-label={`Delete ${task.title}`}
                      className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Task Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-sm rounded-3xl max-w-md w-full p-6 space-y-5 relative shadow-lg">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              aria-label="Close modal"
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-900 rounded-xl"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="font-display text-lg font-bold text-slate-900">
              {editingTask ? '✏️ Edit Task' : '📝 Add Assignment or Revision'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Subject
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 text-sm sm-input rounded-2xl"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  required
                  maxLength={SCHEMA_LIMITS.TASK_TITLE_MAX}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Submit Finance Case Study Report"
                  className="w-full px-3 py-2.5 text-sm sm-input rounded-2xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TaskCategory)}
                    className="w-full px-2.5 py-2.5 text-sm sm-input rounded-2xl"
                  >
                    <option value="assignment">Assignment</option>
                    <option value="revision">Revision</option>
                    <option value="exam">Exam Prep</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                    className="w-full px-2.5 py-2.5 text-sm sm-input rounded-2xl"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-2 py-2.5 text-xs sm-input rounded-2xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Notes / Resources
                </label>
                <textarea
                  rows={2}
                  maxLength={SCHEMA_LIMITS.TASK_NOTES_MAX}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Chapter numbers, submission link, or revision focus..."
                  className="w-full px-3 py-2.5 text-sm sm-input rounded-2xl"
                />
              </div>

              {formError && (
                <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-sm-accent disabled:opacity-60 rounded-xl"
                >
                  {saving ? 'Saving...' : editingTask ? 'Save Changes' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
