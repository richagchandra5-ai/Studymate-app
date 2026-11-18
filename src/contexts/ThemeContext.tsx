import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppThemeId } from '../types/studymate';
import { updateUserTheme } from '../services/studymateService';

export interface ThemeMeta {
  id: AppThemeId;
  name: string;
  emoji: string;
  vibe: string;
  swatches: [string, string, string, string];
}

export const APP_THEMES: ThemeMeta[] = [
  {
    id: 'pastel-dream',
    name: 'Pastel Dream',
    emoji: '🌸',
    vibe: 'Dreamy lavender, blush rose & soft periwinkle',
    swatches: ['#FAF8FF', '#EDE9FE', '#7C3AED', '#FDA4AF'],
  },
  {
    id: 'sunset-peach',
    name: 'Sunset Peach',
    emoji: '🍑',
    vibe: 'Warm apricot, coral sunset & honey cream',
    swatches: ['#FFF8F4', '#FFEDD5', '#EA580C', '#FCD34D'],
  },
  {
    id: 'mint-garden',
    name: 'Mint Garden',
    emoji: '🌿',
    vibe: 'Fresh sage mint, eucalyptus & sky dew',
    swatches: ['#F3FBF7', '#D1FAE5', '#059669', '#7DD3FC'],
  },
];

const STORAGE_KEY = 'studymate_theme';

interface ThemeContextValue {
  theme: AppThemeId;
  setTheme: (nextTheme: AppThemeId, uid?: string) => Promise<void>;
  syncThemeFromProfile: (profileTheme?: AppThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isValidTheme(val: unknown): val is AppThemeId {
  return val === 'pastel-dream' || val === 'sunset-peach' || val === 'mint-garden';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppThemeId>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return isValidTheme(saved) ? saved : 'pastel-dream';
    } catch {
      return 'pastel-dream';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore storage restrictions
    }
  }, [theme]);

  const setTheme = async (nextTheme: AppThemeId, uid?: string) => {
    setThemeState(nextTheme);
    if (uid) {
      try {
        await updateUserTheme(uid, nextTheme);
      } catch (err) {
        console.error('Could not persist theme preference:', err);
      }
    }
  };

  const syncThemeFromProfile = (profileTheme?: AppThemeId) => {
    if (isValidTheme(profileTheme)) {
      setThemeState(profileTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, syncThemeFromProfile }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
