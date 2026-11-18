import React, { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import {
  BookOpen,
  CalendarDays,
  Clock,
  CreditCard,
  Flame,
  Home,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
  X,
} from 'lucide-react';
import { auth } from '../lib/firebase';
import {
  subscribeMyPilotFeedback,
  subscribeScheduleBlocks,
  subscribeStudySessions,
  subscribeSubjects,
  subscribeTasks,
} from '../services/studymateService';
import {
  PilotFeedback,
  ScheduleBlock,
  StudySession,
  StudyTask,
  Subject,
  UserProfile,
} from '../types/studymate';
import { calculateStudyStreak } from '../utils/dateUtils';
import { DashboardTab, OverviewView } from './dashboard/OverviewView';
import { TimetableView } from './dashboard/TimetableView';
import { SubjectsView } from './dashboard/SubjectsView';
import { TasksView } from './dashboard/TasksView';
import { FocusTimerView } from './dashboard/FocusTimerView';
import { PlanFeedbackView } from './dashboard/PlanFeedbackView';
import { OwlAvatar } from './OwlMascot';
import { ThemePickerTable } from './ThemePickerTable';
import { APP_THEMES, useTheme } from '../contexts/ThemeContext';

interface DashboardWorkspaceProps {
  profile: UserProfile;
  onGoToLanding: () => void;
}

const NAV_ITEMS: {
  id: DashboardTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'timetable', label: 'Timetable', icon: CalendarDays },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'tasks', label: 'Revision & Tasks', icon: Layers },
  { id: 'focus', label: 'Focus Timer', icon: Clock },
  { id: 'account', label: 'Plan & Pilot', icon: CreditCard },
];

export const DashboardWorkspace: React.FC<DashboardWorkspaceProps> = ({
  profile,
  onGoToLanding,
}) => {
  const { theme } = useTheme();
  const activeThemeMeta = APP_THEMES.find((t) => t.id === theme) ?? APP_THEMES[0];

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [focusSubjectId, setFocusSubjectId] = useState<string | undefined>(undefined);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [myFeedback, setMyFeedback] = useState<PilotFeedback[]>([]);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    let loadedSubjects = false;
    let loadedBlocks = false;
    const markReady = () => {
      if (loadedSubjects && loadedBlocks) setDataReady(true);
    };

    const unsubSubjects = subscribeSubjects(profile.uid, (items) => {
      setSubjects(items);
      loadedSubjects = true;
      markReady();
    });
    const unsubBlocks = subscribeScheduleBlocks(profile.uid, (items) => {
      setBlocks(items);
      loadedBlocks = true;
      markReady();
    });
    const unsubTasks = subscribeTasks(profile.uid, setTasks);
    const unsubSessions = subscribeStudySessions(profile.uid, setSessions);
    const unsubFeedback = subscribeMyPilotFeedback(profile.uid, setMyFeedback);

    return () => {
      unsubSubjects();
      unsubBlocks();
      unsubTasks();
      unsubSessions();
      unsubFeedback();
    };
  }, [profile.uid]);

  const streakInfo = calculateStudyStreak(sessions, blocks);

  const handleSelectTab = (tab: DashboardTab) => {
    setActiveTab(tab);
    setMobileNavOpen(false);
  };

  const handleStartFocusForSubject = (subjectId: string) => {
    setFocusSubjectId(subjectId);
    setActiveTab('focus');
  };

  const handleSignOut = async () => {
    await signOut(auth);
    onGoToLanding();
  };

  const activeNavLabel = NAV_ITEMS.find((i) => i.id === activeTab)?.label ?? 'Overview';

  const SidebarContent = (
    <div className="flex flex-col h-full justify-between p-4">
      <div className="space-y-5">
        <div className="px-2 flex items-center justify-between">
          <button
            type="button"
            onClick={onGoToLanding}
            className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap"
          >
            <OwlAvatar size="sm" mood="happy" />
            <span>StudyMate</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
            className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-xl"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Study Streak Mini Card */}
        <div className="mx-1 bg-gradient-to-r from-amber-50 to-rose-50/70 border border-amber-200/80 rounded-2xl p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-white border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <Flame className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                {streakInfo.currentStreak} {streakInfo.currentStreak === 1 ? 'day' : 'days'}
              </div>
              <div className="text-[11px] text-amber-800 truncate">
                {streakInfo.studiedToday ? 'Streak safe today! ✨' : 'Study today to keep!'}
              </div>
            </div>
          </div>
        </div>

        <nav className="space-y-1" aria-label="Dashboard Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-2xl transition-all duration-150 whitespace-nowrap ${
                  active
                    ? 'bg-sm-accent-soft text-sm-accent font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-sm-soft'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${active ? 'text-sm-accent' : 'text-slate-500'}`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Student Account Card */}
      <div className="pt-4 border-t border-sm-subtle space-y-3">
        <div className="px-2.5 py-2 rounded-2xl bg-sm-soft border border-sm-subtle">
          <div className="text-sm font-semibold text-slate-900 truncate">{profile.displayName}</div>
          <div className="text-xs text-slate-500 truncate">{profile.program}</div>
          <div className="text-xs font-mono text-sm-accent mt-1 font-medium">
            {profile.planTier === 'plus' ? '✨ Student Plus · ₹49/mo' : '🌱 Basic Free Plan'}
          </div>
        </div>

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              setMobileNavOpen(false);
              setThemeModalOpen(true);
            }}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:text-sm-accent hover:bg-sm-soft rounded-xl transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Palette className="w-3.5 h-3.5 text-sm-accent" />
              <span>Theme Style</span>
            </span>
            <span className="text-[11px] font-semibold text-sm-accent">
              {activeThemeMeta.emoji} {activeThemeMeta.name}
            </span>
          </button>
          <button
            type="button"
            onClick={onGoToLanding}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-sm-soft rounded-xl transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Landing Page</span>
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-sm-canvas text-slate-800 flex">
      {/* Desktop Sidebar (256px) */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white border-r border-sm-subtle sticky top-0 h-screen">
        {SidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative z-10 w-64 max-w-[82vw] bg-white h-full border-r border-sm-subtle">
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Compact Sticky Workspace Top Bar (<= 56px) */}
        <header className="sticky top-0 z-20 h-14 bg-white/90 backdrop-blur-md border-b border-sm-subtle px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
              className="lg:hidden p-2 -ml-2 text-slate-700 hover:bg-sm-soft rounded-xl"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-500 hidden sm:inline">🦉 StudyMate</span>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <span className="font-display font-bold text-slate-900 truncate">
                {activeNavLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-800 tabular-nums">
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              {streakInfo.currentStreak}d streak
            </span>
            <button
              type="button"
              onClick={() => setThemeModalOpen(true)}
              title="Switch cute theme style"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-sm-soft border border-sm rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              <span aria-hidden="true">{activeThemeMeta.emoji}</span>
              <span className="hidden md:inline">{activeThemeMeta.name}</span>
              <span className="md:hidden">Theme</span>
            </button>
            {activeTab !== 'focus' && (
              <button
                type="button"
                onClick={() => setActiveTab('focus')}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sm-accent rounded-xl transition-colors whitespace-nowrap shrink-0"
              >
                ⏱️ Focus Timer
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {!dataReady ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-20 bg-sm-accent-soft rounded-3xl" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 bg-white border border-sm-subtle rounded-3xl" />
                ))}
              </div>
              <div className="h-72 bg-white border border-sm-subtle rounded-3xl" />
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewView
                  profile={profile}
                  subjects={subjects}
                  blocks={blocks}
                  tasks={tasks}
                  sessions={sessions}
                  onNavigate={handleSelectTab}
                  onStartFocusForSubject={handleStartFocusForSubject}
                />
              )}
              {activeTab === 'timetable' && (
                <TimetableView
                  uid={profile.uid}
                  subjects={subjects}
                  blocks={blocks}
                  onGoToSubjects={() => handleSelectTab('subjects')}
                />
              )}
              {activeTab === 'subjects' && (
                <SubjectsView
                  profile={profile}
                  subjects={subjects}
                  blocks={blocks}
                  tasks={tasks}
                  onUpgradeRequested={() => handleSelectTab('account')}
                />
              )}
              {activeTab === 'tasks' && (
                <TasksView
                  uid={profile.uid}
                  subjects={subjects}
                  tasks={tasks}
                  onGoToSubjects={() => handleSelectTab('subjects')}
                />
              )}
              {activeTab === 'focus' && (
                <FocusTimerView
                  profile={profile}
                  subjects={subjects}
                  sessions={sessions}
                  initialSubjectId={focusSubjectId}
                  onGoToSubjects={() => handleSelectTab('subjects')}
                  onUpgradeRequested={() => handleSelectTab('account')}
                />
              )}
              {activeTab === 'account' && (
                <PlanFeedbackView profile={profile} myFeedback={myFeedback} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Cute Theme Picker Modal */}
      {themeModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Choose StudyMate Theme"
        >
          <div className="max-w-xl w-full relative space-y-3">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setThemeModalOpen(false)}
                aria-label="Close theme picker"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-sm rounded-2xl shadow-sm hover:bg-sm-soft"
              >
                <X className="w-3.5 h-3.5" />
                <span>Done</span>
              </button>
            </div>
            <ThemePickerTable
              uid={profile.uid}
              onSelected={() => setThemeModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
