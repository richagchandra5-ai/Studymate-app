import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface OwlMascotProps {
  size?: 'sm' | 'md' | 'lg';
  mood?: 'happy' | 'focused' | 'cheering';
  className?: string;
}

export const OwlAvatar: React.FC<OwlMascotProps> = ({
  size = 'md',
  mood = 'happy',
  className = '',
}) => {
  const dims =
    size === 'sm' ? 'w-11 h-11' : size === 'lg' ? 'w-20 h-20' : 'w-14 h-14';

  return (
    <svg
      viewBox="0 0 120 120"
      className={`${dims} shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      {/* Soft pastel halo */}
      <circle cx="60" cy="62" r="52" fill="#EDE9FE" />
      {/* Little owl ears */}
      <path d="M30 42 L24 22 L45 32 Z" fill="#8B5CF6" />
      <path d="M90 42 L96 22 L75 32 Z" fill="#8B5CF6" />
      {/* Round cozy body */}
      <ellipse cx="60" cy="68" rx="34" ry="36" fill="#A78BFA" />
      {/* Cream belly */}
      <ellipse cx="60" cy="78" rx="22" ry="23" fill="#FFFBEB" />
      {/* Belly feathers */}
      <path
        d="M50 74 Q53 78 56 74 M60 74 Q63 78 66 74 M55 83 Q58 87 61 83 M64 83 Q67 87 70 83"
        fill="none"
        stroke="#FDE68A"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Left & Right Wings */}
      <ellipse
        cx="28"
        cy="70"
        rx="8"
        ry="18"
        transform="rotate(12 28 70)"
        fill="#7C3AED"
      />
      <ellipse
        cx="92"
        cy="70"
        rx="8"
        ry="18"
        transform="rotate(-12 92 70)"
        fill="#7C3AED"
      />
      {/* Eye patches */}
      <circle cx="46" cy="51" r="13" fill="#FFFFFF" />
      <circle cx="74" cy="51" r="13" fill="#FFFFFF" />
      {/* Cute round study glasses */}
      <circle
        cx="46"
        cy="51"
        r="14.5"
        fill="none"
        stroke="#4C1D95"
        strokeWidth="2.5"
      />
      <circle
        cx="74"
        cy="51"
        r="14.5"
        fill="none"
        stroke="#4C1D95"
        strokeWidth="2.5"
      />
      <line x1="60.5" y1="51" x2="59.5" y2="51" stroke="#4C1D95" strokeWidth="2.5" />
      {/* Pupils based on mood */}
      {mood === 'cheering' ? (
        <>
          <path
            d="M40 52 Q46 45 52 52"
            fill="none"
            stroke="#1E1B4B"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M68 52 Q74 45 80 52"
            fill="none"
            stroke="#1E1B4B"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <circle cx="47" cy="51" r="5.2" fill="#1E1B4B" />
          <circle cx="73" cy="51" r="5.2" fill="#1E1B4B" />
          <circle cx="49" cy="49" r="1.8" fill="#FFFFFF" />
          <circle cx="75" cy="49" r="1.8" fill="#FFFFFF" />
        </>
      )}
      {/* Rosy cheeks */}
      <ellipse cx="34" cy="60" rx="4.5" ry="2.8" fill="#FDA4AF" opacity="0.85" />
      <ellipse cx="86" cy="60" rx="4.5" ry="2.8" fill="#FDA4AF" opacity="0.85" />
      {/* Cute beak */}
      <path d="M56 56 L64 56 L60 63 Z" fill="#F59E0B" />
      {/* Mini study cap / graduation tassel accent for focused/happy */}
      {mood === 'focused' && (
        <g>
          <polygon points="60,18 82,25 60,32 38,25" fill="#312E81" />
          <line x1="78" y1="26" x2="82" y2="38" stroke="#FBBF24" strokeWidth="2" />
          <circle cx="82" cy="39" r="2.2" fill="#FBBF24" />
        </g>
      )}
      {/* Little feet */}
      <ellipse cx="49" cy="103" rx="6" ry="3" fill="#F59E0B" />
      <ellipse cx="71" cy="103" rx="6" ry="3" fill="#F59E0B" />
    </svg>
  );
};

interface OwlCompanionBannerProps {
  studentName?: string;
  streak: number;
  todayMinutes: number;
  goalMinutes: number;
  openTasksCount: number;
  onQuickAction?: () => void;
}

const GENERAL_PEP_TALKS = [
  'Small 25-minute focus blocks beat all-night cramming every single time! 📚',
  'One chapter checked off today means less stress before exam week. You got this! ✨',
  'Remember to sip some water and stretch between Pomodoro rounds! 💧',
  'Consistency builds confidence—even 15 minutes of quick revision keeps your streak alive! 🌱',
  'Reviewing Day 1 → Day 3 → Day 7 helps facts stick twice as long! 🧠',
];

export const OwlCompanionBanner: React.FC<OwlCompanionBannerProps> = ({
  studentName,
  streak,
  todayMinutes,
  goalMinutes,
  openTasksCount,
  onQuickAction,
}) => {
  const [messageIndex, setMessageIndex] = useState(0);

  const firstName = studentName ? studentName.split(' ')[0] : 'friend';

  const contextMessages: string[] = [];
  if (todayMinutes >= goalMinutes) {
    contextMessages.push(
      `Woohoo, ${firstName}! You hit your daily study goal of ${goalMinutes}m today! 🎉`
    );
  } else if (todayMinutes > 0) {
    const remaining = Math.max(1, goalMinutes - todayMinutes);
    contextMessages.push(
      `Great start, ${firstName}! Just ${remaining}m more to hit today’s goal! 🌟`
    );
  } else {
    contextMessages.push(
      `Ready for a cozy study block, ${firstName}? Start a quick 25m timer to kick off today! 🦉`
    );
  }

  if (streak >= 3) {
    contextMessages.push(
      `Look at that ${streak}-day study streak! Keep that steady rhythm going! 🔥`
    );
  }

  if (openTasksCount > 0) {
    contextMessages.push(
      `You have ${openTasksCount} open ${openTasksCount === 1 ? 'task' : 'tasks'}—knock out the easiest one first for an instant win! ✅`
    );
  }

  const allMessages = [...contextMessages, ...GENERAL_PEP_TALKS];
  const currentMessage = allMessages[messageIndex % allMessages.length];

  const mood: 'happy' | 'focused' | 'cheering' =
    todayMinutes >= goalMinutes ? 'cheering' : todayMinutes > 0 ? 'focused' : 'happy';

  return (
    <div className="bg-gradient-to-r from-violet-50 via-rose-50/60 to-amber-50/70 border border-violet-200/80 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover-lift">
      <div className="flex items-center gap-4 min-w-0">
        <button
          type="button"
          onClick={() => setMessageIndex((prev) => prev + 1)}
          title="Tap Ollie the Owl for another encouraging note"
          className="shrink-0 rounded-2xl p-1 hover:scale-105 transition-transform bg-white/80 border border-violet-100 shadow-xs"
        >
          <OwlAvatar size="md" mood={mood} />
        </button>

        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-violet-800">
            <span>Ollie the Study Owl</span>
            <span aria-hidden="true">·</span>
            <span className="text-violet-600 font-medium">Tap Ollie for a pep talk</span>
          </div>
          <p className="text-sm sm:text-base font-medium text-slate-800 leading-snug">
            {currentMessage}
          </p>
        </div>
      </div>

      {onQuickAction && (
        <button
          type="button"
          onClick={onQuickAction}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-violet-900 bg-white hover:bg-violet-100/70 border border-violet-200 rounded-2xl transition-colors whitespace-nowrap shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-600" />
          <span>Start Focus Session</span>
        </button>
      )}
    </div>
  );
};
