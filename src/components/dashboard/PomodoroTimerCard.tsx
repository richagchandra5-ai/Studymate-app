import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Coffee, Pause, Play, RotateCcw, Square } from 'lucide-react';
import {
  FocusMode,
  SCHEMA_LIMITS,
  Subject,
  UserProfile,
} from '../../types/studymate';
import { logStudySession } from '../../services/studymateService';
import { getTodayIso } from '../../utils/dateUtils';
import { OwlAvatar } from '../OwlMascot';

type TimerPhase = 'focus' | 'short-break' | 'long-break';

interface PomodoroPreset {
  id: string;
  label: string;
  phase: TimerPhase;
  focusMode: FocusMode;
  minutes: number;
}

const PRESETS: PomodoroPreset[] = [
  { id: 'pomo', label: '🍅 Focus 25m', phase: 'focus', focusMode: 'pomodoro', minutes: 25 },
  { id: 'deep', label: '🧠 Deep 50m', phase: 'focus', focusMode: 'deep-work', minutes: 50 },
  { id: 'quick', label: '⚡ Quick 15m', phase: 'focus', focusMode: 'quick-review', minutes: 15 },
  { id: 'short-break', label: '☕ Break 5m', phase: 'short-break', focusMode: 'pomodoro', minutes: 5 },
  { id: 'long-break', label: '🌿 Rest 15m', phase: 'long-break', focusMode: 'pomodoro', minutes: 15 },
];

function playGentleChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);
      gain.gain.setValueAtTime(0.001, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.14 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.5);
    });
  } catch {
    // Ignore audio context restrictions
  }
}

interface PomodoroTimerCardProps {
  profile: UserProfile;
  subjects: Subject[];
  initialSubjectId?: string;
  compact?: boolean;
  onGoToSubjects?: () => void;
  onSessionLogged?: (minutes: number, subjectName: string) => void;
}

export const PomodoroTimerCard: React.FC<PomodoroTimerCardProps> = ({
  profile,
  subjects,
  initialSubjectId,
  compact = false,
  onGoToSubjects,
  onSessionLogged,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('pomo');
  const [phase, setPhase] = useState<TimerPhase>('focus');
  const [focusMode, setFocusMode] = useState<FocusMode>('pomodoro');
  const [targetMinutes, setTargetMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedRounds, setCompletedRounds] = useState(0);

  const [subjectId, setSubjectId] = useState(initialSubjectId || subjects[0]?.id || '');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const completionHandledRef = useRef(false);

  useEffect(() => {
    if (initialSubjectId && subjects.some((s) => s.id === initialSubjectId)) {
      setSubjectId(initialSubjectId);
    } else if (!subjectId && subjects[0]) {
      setSubjectId(subjects[0].id);
    }
  }, [initialSubjectId, subjects, subjectId]);

  useEffect(() => {
    if (!isRunning) return;
    completionHandledRef.current = false;
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

  // Handle natural countdown completion (00:00)
  useEffect(() => {
    if (secondsLeft !== 0 || isRunning || completionHandledRef.current) return;
    completionHandledRef.current = true;
    playGentleChime();

    if (phase === 'focus') {
      const subj = subjects.find((s) => s.id === subjectId);
      const nextRound = completedRounds + 1;
      setCompletedRounds(nextRound);

      if (subj) {
        setSaving(true);
        void logStudySession(profile.uid, {
          subjectId: subj.id,
          subjectName: subj.name,
          durationMinutes: targetMinutes,
          sessionDate: getTodayIso(),
          focusMode,
          notes,
        })
          .then(() => {
            setNotes('');
            setStatusBanner(
              `Logged ${targetMinutes}m for ${subj.name}! Take a ${nextRound % 4 === 0 ? '15m rest' : '5m break'} ☕`
            );
            onSessionLogged?.(targetMinutes, subj.name);
          })
          .finally(() => setSaving(false));
      }

      // Queue next break automatically ready to start
      const nextBreak = nextRound % 4 === 0 ? PRESETS[4] : PRESETS[3];
      setSelectedPresetId(nextBreak.id);
      setPhase(nextBreak.phase);
      setTargetMinutes(nextBreak.minutes);
      setSecondsLeft(nextBreak.minutes * 60);
    } else {
      setStatusBanner('Break complete! Ready for your next focus round 🦉');
      const focusPreset = PRESETS[0];
      setSelectedPresetId(focusPreset.id);
      setPhase(focusPreset.phase);
      setFocusMode(focusPreset.focusMode);
      setTargetMinutes(focusPreset.minutes);
      setSecondsLeft(focusPreset.minutes * 60);
    }
  }, [
    secondsLeft,
    isRunning,
    phase,
    subjects,
    subjectId,
    completedRounds,
    profile.uid,
    targetMinutes,
    focusMode,
    notes,
    onSessionLogged,
  ]);

  const selectPreset = (preset: PomodoroPreset) => {
    setIsRunning(false);
    setSelectedPresetId(preset.id);
    setPhase(preset.phase);
    setFocusMode(preset.focusMode);
    setTargetMinutes(preset.minutes);
    setSecondsLeft(preset.minutes * 60);
    setStatusBanner(null);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(targetMinutes * 60);
    setStatusBanner(null);
  };

  const handleStopAndSave = async () => {
    setIsRunning(false);
    if (phase !== 'focus') {
      // Stopping a break simply resets back to Focus 25m
      selectPreset(PRESETS[0]);
      setStatusBanner('Break stopped — switched back to Focus mode.');
      return;
    }

    const subj = subjects.find((s) => s.id === subjectId);
    if (!subj) return;

    const elapsedSeconds = targetMinutes * 60 - secondsLeft;
    const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

    if (elapsedSeconds < 30) {
      setSecondsLeft(targetMinutes * 60);
      setStatusBanner('Timer stopped (under 30s — not logged).');
      return;
    }

    setSaving(true);
    try {
      await logStudySession(profile.uid, {
        subjectId: subj.id,
        subjectName: subj.name,
        durationMinutes: elapsedMinutes,
        sessionDate: getTodayIso(),
        focusMode,
        notes,
      });
      setSecondsLeft(targetMinutes * 60);
      setNotes('');
      setCompletedRounds((prev) => prev + 1);
      setStatusBanner(`Saved ${elapsedMinutes}m study session for ${subj.name} 🎉`);
      onSessionLogged?.(elapsedMinutes, subj.name);
    } finally {
      setSaving(false);
    }
  };

  const totalSeconds = targetMinutes * 60;
  const elapsedSeconds = totalSeconds - secondsLeft;
  const hasStarted = elapsedSeconds > 0 && secondsLeft > 0;
  const minsDisplay = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secsDisplay = String(secondsLeft % 60).padStart(2, '0');

  const radius = compact ? 58 : 84;
  const svgSize = compact ? 140 : 192;
  const center = svgSize / 2;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalSeconds > 0 ? elapsedSeconds / totalSeconds : 0;
  const dashOffset = circumference * (1 - progressRatio);

  const isBreak = phase !== 'focus';
  const ringStroke = isBreak ? '#10b981' : 'var(--sm-ring-stroke)';
  const trackStroke = isBreak ? '#d1fae5' : 'var(--sm-ring-track)';

  return (
    <section
      className={`border rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-4 ${
        isBreak
          ? 'bg-gradient-to-br from-white to-emerald-50/60 border-emerald-200'
          : 'bg-white border-sm'
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            {isBreak ? '☕ Pomodoro Break Timer' : '🍅 Pomodoro Focus Timer'}
          </h2>
          <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
            Round {(completedRounds % 4) + 1} of 4 · {completedRounds} completed today
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-medium text-sm-accent bg-sm-soft border border-sm-subtle px-2.5 py-1 rounded-xl">
          {isBreak ? <Coffee className="w-3.5 h-3.5 text-emerald-600" /> : null}
          <span>{isRunning ? (isBreak ? 'Resting' : 'Focusing') : 'Ready'}</span>
        </div>
      </div>

      {/* Mode Presets */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-sm-soft rounded-2xl">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => selectPreset(preset)}
            className={`flex-1 min-w-[82px] py-1.5 px-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap ${
              selectedPresetId === preset.id
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-sm-accent'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Circular Ring + Owl Companion */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-5 py-1">
        <div
          className="relative flex items-center justify-center shrink-0"
          style={{ width: svgSize, height: svgSize }}
        >
          <svg
            width={svgSize}
            height={svgSize}
            viewBox={`0 0 ${svgSize} ${svgSize}`}
            className="-rotate-90"
          >
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={trackStroke}
              strokeWidth={compact ? 8 : 10}
            />
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={ringStroke}
              strokeWidth={compact ? 8 : 10}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`font-mono font-bold text-slate-900 tabular-nums ${
                compact ? 'text-2xl' : 'text-4xl'
              }`}
            >
              {minsDisplay}:{secsDisplay}
            </span>
            <span className="text-[11px] font-medium text-slate-500 mt-0.5 capitalize">
              {phase.replace('-', ' ')}
            </span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-2.5">
          {!isBreak && (
            <>
              {subjects.length === 0 ? (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                  <p>Add a subject first to track study minutes per paper.</p>
                  {onGoToSubjects && (
                    <button
                      type="button"
                      onClick={onGoToSubjects}
                      className="font-semibold text-amber-950 underline"
                    >
                      Add Subject →
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Subject
                    </label>
                    <select
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm sm-input rounded-xl"
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
                      Session Goal (Optional)
                    </label>
                    <input
                      type="text"
                      maxLength={SCHEMA_LIMITS.SESSION_NOTES_MAX}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g., Chapter 4 numericals"
                      className="w-full px-3 py-2 text-xs sm:text-sm sm-input rounded-xl"
                    />
                  </div>
                </>
              )}
            </>
          )}

          {isBreak && (
            <div className="bg-white/80 border border-emerald-200 rounded-2xl p-3 flex items-center gap-3">
              <OwlAvatar size="sm" mood="cheering" />
              <p className="text-xs text-emerald-950 leading-snug">
                Step away from your desk, stretch, and hydrate before the next round! 🌿
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Controls: Start / Pause, Stop & Save, Reset */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => {
            setStatusBanner(null);
            setIsRunning((prev) => !prev);
          }}
          disabled={!isBreak && subjects.length === 0}
          className={`flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white rounded-2xl transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 ${
            isBreak ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sm-accent'
          }`}
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{isRunning ? 'Pause' : hasStarted ? 'Resume' : 'Start Session'}</span>
        </button>

        {(isRunning || hasStarted) && (
          <button
            type="button"
            onClick={handleStopAndSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs sm:text-sm font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-2xl transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>{isBreak ? 'End Break' : saving ? 'Saving...' : 'Stop & Log'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleReset}
          aria-label="Reset timer"
          className="p-2.5 text-slate-700 bg-sm-soft hover:bg-sm-accent-soft border border-sm-subtle rounded-2xl transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {!isRunning && !hasStarted && !isBreak && subjects.length > 0 && (
        <button
          type="button"
          onClick={async () => {
            const subj = subjects.find((s) => s.id === subjectId);
            if (!subj) return;
            setSaving(true);
            try {
              await logStudySession(profile.uid, {
                subjectId: subj.id,
                subjectName: subj.name,
                durationMinutes: targetMinutes,
                sessionDate: getTodayIso(),
                focusMode,
                notes,
              });
              setNotes('');
              setStatusBanner(`Logged ${targetMinutes}m session for ${subj.name} ✅`);
              onSessionLogged?.(targetMinutes, subj.name);
            } finally {
              setSaving(false);
            }
          }}
          disabled={saving}
          className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl transition-colors disabled:opacity-50"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{saving ? 'Logging...' : `Quick-Log Completed ${targetMinutes}m Session`}</span>
        </button>
      )}

      {statusBanner && (
        <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 text-center font-medium">
          {statusBanner}
        </div>
      )}
    </section>
  );
};
