import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { getOrCreateUserProfile, subscribeUserProfile } from './services/studymateService';
import { UserProfile } from './types/studymate';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './components/LandingPage';
import { AuthModal, OnboardingView } from './components/AuthModal';
import { DashboardWorkspace } from './components/DashboardWorkspace';

function StudyMateApp() {
  const { syncThemeFromProfile } = useTheme();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | null>(null);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      setAuthUser(user);

      if (user) {
        try {
          const initial = await getOrCreateUserProfile(
            user.uid,
            user.displayName || 'Student',
            user.email || 'student@dgu.ac.in'
          );
          setProfile(initial);
          syncThemeFromProfile(initial.theme);
          unsubProfile = subscribeUserProfile(user.uid, (updated) => {
            if (updated) {
              setProfile(updated);
              syncThemeFromProfile(updated.theme);
            }
          });
          setView('dashboard');
        } catch (err) {
          console.error('Failed to load student profile:', err);
        }
      } else {
        setProfile(null);
        setView('landing');
      }
      setAuthInitialized(true);
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-sm-canvas flex items-center justify-center p-6">
        <div className="space-y-2 text-center">
          <div className="font-display text-xl font-bold text-slate-900">StudyMate</div>
          <p className="text-xs text-slate-500">Loading your study workspace...</p>
        </div>
      </div>
    );
  }

  if (authUser && view === 'dashboard') {
    if (!profile) {
      return (
        <div className="min-h-screen bg-sm-canvas flex items-center justify-center p-6">
          <p className="text-sm text-slate-600">Preparing your student profile...</p>
        </div>
      );
    }

    if (!profile.onboardingComplete) {
      return (
        <OnboardingView
          profile={profile}
          onCompleted={() => {
            setView('dashboard');
          }}
        />
      );
    }

    return (
      <DashboardWorkspace
        profile={profile}
        onGoToLanding={() => setView('landing')}
      />
    );
  }

  return (
    <>
      <LandingPage
        currentUser={authUser}
        onOpenAuth={(mode) => setAuthModalMode(mode)}
        onOpenDashboard={() => setView('dashboard')}
      />
      {authModalMode && (
        <AuthModal
          initialMode={authModalMode}
          onClose={() => setAuthModalMode(null)}
          onAuthenticated={() => {
            setAuthModalMode(null);
            setView('dashboard');
          }}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <StudyMateApp />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
