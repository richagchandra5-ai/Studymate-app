import React, { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import {
  BookOpen,
  CalendarDays,
  Clock,
  CreditCard,
  Home,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
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
import { DashboardTab, OverviewView } from './dashboard/OverviewView';
import { TimetableView } from './dashboard/TimetableView';
import { SubjectsView } from './dashboard/SubjectsView';
import { TasksView } from './dashboard/TasksView';
import { FocusTimerView } from './dashboard/FocusTimerView';
import { PlanFeedbackView } from './dashboard/PlanFeedbackView';

interface DashboardWorkspaceProps {
  profile: UserProfile;
  onGoToLanding: () => void;
}

const NAV_ITEMS: { id: DashboardTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
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
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
      <div className="space-y-6">
        <div className="px-2 flex items-center justify-between">
          <button
            type="button"
            onClick={onGoToLanding}
            className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap"
          >
            StudyMate
          </button>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
            className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-blue-50 text-blue-800 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-700' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Student Account Card */}
      <div className="pt-4 border-t border-slate-200 space-y-3">
        <div className="px-2">
          <div className="text-sm font-semibold text-slate-900 truncate">{profile.displayName}</div>
          <div className="text-xs text-slate-500 truncate">{profile.program}</div>
          <div className="text-xs font-mono text-blue-700 mt-1">
            {profile.planTier === 'plus' ? 'Student Plus · ₹49/mo' : 'Basic Free Plan'}
          </div>
        </div>

        <div className="space-y-1">
          <button
            type="button"
            onClick={onGoToLanding}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Landing Page</span>
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop Sidebar (256px) */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white border-r border-slate-200 sticky top-0 h-screen">
        {SidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative z-10 w-64 max-w-[80vw] bg-white h-full border-r border-slate-200">
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Compact Sticky Workspace Top Bar (<= 56px) */}
        <header className="sticky top-0 z-20 h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
              className="lg:hidden p-2 -ml-2 text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-500 hidden sm:inline">StudyMate</span>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <span className="font-semibold text-slate-900 truncate">{activeNavLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {activeTab !== 'focus' && (
              <button
                type="button"
                onClick={() => setActiveTab('focus')}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Focus Timer
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {!dataReady ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-8 w-64 bg-slate-200 rounded-lg" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl" />
                ))}
              </div>
              <div className="h-72 bg-white border border-slate-200 rounded-xl" />
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
    </div>
  );
};
