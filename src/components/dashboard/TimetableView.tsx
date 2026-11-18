import React, { useState } from 'react';
import { CalendarDays, Check, Edit2, Plus, Trash2, X } from 'lucide-react';
import {
  BlockType,
  DAYS_OF_WEEK,
  DayOfWeek,
  SCHEMA_LIMITS,
  ScheduleBlock,
  Subject,
  SUBJECT_COLOR_STYLES,
} from '../../types/studymate';
import {
  createScheduleBlock,
  deleteScheduleBlock,
  toggleScheduleBlockDate,
  updateScheduleBlock,
} from '../../services/studymateService';
import { getTodayDayOfWeek, getTodayIso } from '../../utils/dateUtils';

interface TimetableViewProps {
  uid: string;
  subjects: Subject[];
  blocks: ScheduleBlock[];
  onGoToSubjects: () => void;
}

const BLOCK_EMOJI: Record<BlockType, string> = {
  study: '📘',
  revision: '🔁',
  assignment: '📝',
  'exam-prep': '🎯',
};

export const TimetableView: React.FC<TimetableViewProps> = ({
  uid,
  subjects,
  blocks,
  onGoToSubjects,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | 'ALL'>(getTodayDayOfWeek());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null);

  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(getTodayDayOfWeek());
  const [startTime, setStartTime] = useState('17:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [blockType, setBlockType] = useState<BlockType>('study');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const todayIso = getTodayIso();
  const todayDow = getTodayDayOfWeek();
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  const openCreateModal = (presetDay?: DayOfWeek) => {
    setEditingBlock(null);
    setSubjectId(subjects[0]?.id ?? '');
    setTitle('');
    setDayOfWeek(presetDay ?? (selectedDay === 'ALL' ? todayDow : selectedDay));
    setStartTime('17:00');
    setDurationMinutes(60);
    setBlockType('study');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (block: ScheduleBlock) => {
    setEditingBlock(block);
    setSubjectId(block.subjectId);
    setTitle(block.title);
    setDayOfWeek(block.dayOfWeek);
    setStartTime(block.startTime);
    setDurationMinutes(block.durationMinutes);
    setBlockType(block.blockType);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosenSubject = subjectMap.get(subjectId);
    if (!chosenSubject) {
      setFormError('Please select a subject first.');
      return;
    }
    if (!title.trim()) {
      setFormError('Please enter a topic or session title.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editingBlock) {
        await updateScheduleBlock(uid, editingBlock.id, {
          subjectId: chosenSubject.id,
          subjectName: chosenSubject.name,
          title,
          dayOfWeek,
          startTime,
          durationMinutes,
          blockType,
        });
      } else {
        await createScheduleBlock(uid, {
          subjectId: chosenSubject.id,
          subjectName: chosenSubject.name,
          title,
          dayOfWeek,
          startTime,
          durationMinutes,
          blockType,
        });
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save study block.');
    } finally {
      setSaving(false);
    }
  };

  const visibleDays = selectedDay === 'ALL' ? DAYS_OF_WEEK : [selectedDay];
  const totalWeeklyMins = blocks.reduce((sum, b) => sum + b.durationMinutes, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            📅 Personalized Study Timetable
          </h1>
          <p className="text-sm text-slate-600 mt-0.5 font-mono tabular-nums">
            {blocks.length} weekly blocks · {Math.round((totalWeeklyMins / 60) * 10) / 10} hours
            planned per week
          </p>
        </div>

        <button
          type="button"
          onClick={() => openCreateModal()}
          disabled={subjects.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sm-accent disabled:opacity-50 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Study Block
        </button>
      </div>

      {subjects.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-amber-900">
            Add at least one subject first so you can assign timetable blocks to it! 📚
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

      {/* Day Filter Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white border border-sm rounded-2xl">
        <button
          type="button"
          onClick={() => setSelectedDay('ALL')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 ${
            selectedDay === 'ALL'
              ? 'bg-sm-accent text-white'
              : 'text-slate-600 hover:text-sm-accent hover:bg-sm-soft'
          }`}
        >
          All Week
        </button>
        {DAYS_OF_WEEK.map((day) => {
          const count = blocks.filter((b) => b.dayOfWeek === day).length;
          const isToday = day === todayDow;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                selectedDay === day
                  ? 'bg-sm-accent text-white'
                  : 'text-slate-600 hover:text-sm-accent hover:bg-sm-soft'
              }`}
            >
              <span>{day}</span>
              {isToday && selectedDay !== day && (
                <span className="text-[10px] text-sm-accent font-bold">(Today)</span>
              )}
              <span className="font-mono opacity-75 tabular-nums">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Timetable Day Columns / Cards */}
      <div
        className={
          selectedDay === 'ALL'
            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5'
            : 'space-y-4'
        }
      >
        {visibleDays.map((day) => {
          const dayBlocks = blocks.filter((b) => b.dayOfWeek === day);
          const dayMins = dayBlocks.reduce((sum, b) => sum + b.durationMinutes, 0);
          return (
            <section
              key={day}
              className="bg-white border border-sm rounded-3xl p-5 flex flex-col justify-between space-y-4 hover-lift"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-sm-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-sm-accent" />
                    <h2 className="font-display text-base font-bold text-slate-900">
                      {day}
                      {day === todayDow ? ' · Today ☀️' : ''}
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-slate-500 tabular-nums">
                    {dayMins} mins
                  </span>
                </div>

                {dayBlocks.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-sm bg-sm-soft/50 rounded-2xl space-y-2">
                    <p className="text-xs text-slate-500">No study blocks planned for {day} 🌱</p>
                    {subjects.length > 0 && (
                      <button
                        type="button"
                        onClick={() => openCreateModal(day)}
                        className="text-xs font-semibold text-sm-accent hover:underline"
                      >
                        + Add {day} Block
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {dayBlocks.map((block) => {
                      const subj = subjectMap.get(block.subjectId);
                      const style = subj
                        ? SUBJECT_COLOR_STYLES[subj.color]
                        : SUBJECT_COLOR_STYLES.cobalt;
                      const doneToday =
                        day === todayDow && block.lastCompletedDate === todayIso;

                      return (
                        <div
                          key={block.id}
                          className={`p-3.5 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 ${
                            doneToday
                              ? 'bg-emerald-50/80 border-emerald-200'
                              : `${style.surface} ${style.border}`
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0">
                              {day === todayDow && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleScheduleBlockDate(
                                      uid,
                                      block.id,
                                      doneToday ? '' : todayIso
                                    )
                                  }
                                  aria-label={`Toggle completion for ${block.title}`}
                                  className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                                    doneToday
                                      ? 'bg-emerald-500 border-emerald-500 text-white'
                                      : 'bg-white border-sm text-transparent'
                                  }`}
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <span aria-hidden="true">{BLOCK_EMOJI[block.blockType]}</span>
                                  <span className={`font-semibold ${style.text}`}>
                                    {block.subjectName}
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span className="capitalize">
                                    {block.blockType.replace('-', ' ')}
                                  </span>
                                </div>
                                <div
                                  className={`text-sm font-semibold mt-0.5 ${
                                    doneToday ? 'line-through text-slate-500' : 'text-slate-900'
                                  }`}
                                >
                                  {block.title}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => openEditModal(block)}
                                aria-label={`Edit ${block.title}`}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white/80 rounded-lg"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteScheduleBlock(uid, block.id)}
                                aria-label={`Delete ${block.title}`}
                                className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-white/80 rounded-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-white/70 flex items-center justify-between font-mono text-xs text-slate-700 tabular-nums">
                            <span>Starts {block.startTime}</span>
                            <span>{block.durationMinutes} min</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Add/Edit Block Modal */}
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
              {editingBlock ? '✏️ Edit Study Block' : '📅 Add Study Block'}
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
                  Study Focus / Topic
                </label>
                <input
                  type="text"
                  required
                  maxLength={SCHEMA_LIMITS.BLOCK_TITLE_MAX}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Unit 2 Elasticity Practice"
                  className="w-full px-3 py-2.5 text-sm sm-input rounded-2xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Day of Week
                  </label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
                    className="w-full px-3 py-2.5 text-sm sm-input rounded-2xl"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Block Type
                  </label>
                  <select
                    value={blockType}
                    onChange={(e) => setBlockType(e.target.value as BlockType)}
                    className="w-full px-3 py-2.5 text-sm sm-input rounded-2xl"
                  >
                    <option value="study">📘 Core Study</option>
                    <option value="revision">🔁 Spaced Revision</option>
                    <option value="assignment">📝 Assignment</option>
                    <option value="exam-prep">🎯 Exam Prep</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm sm-input rounded-2xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={360}
                    step={5}
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2.5 text-sm sm-input rounded-2xl font-mono"
                  />
                </div>
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
                  {saving ? 'Saving...' : editingBlock ? 'Save Changes' : 'Add Block'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
