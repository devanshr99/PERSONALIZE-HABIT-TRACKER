/**
 * Global app context — holds habits, completions, settings in memory.
 * All data flows through this context to avoid prop drilling.
 * Scoped to the authenticated user from AuthContext.
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode
} from 'react';
import type { Habit, Completion, AppSettings } from '../types';
import {
  getAllHabits,
  getAllCompletions,
  getSettings,
  saveHabit,
  deleteHabit as dbDeleteHabit,
  toggleCompletion as dbToggle,
  setCompletion as dbSetCompletion,
  saveSettings,
  seedDefaultHabits,
  reorderHabits as dbReorderHabits,
  exportData,
  importData,
  resetAllData
} from '../services/db';
import { scheduleReminder, clearReminder } from '../services/notifications';
import { useAuth } from './AuthContext';

interface AppContextValue {
  habits: Habit[];
  completions: Completion[];
  settings: AppSettings;
  loading: boolean;
  error: string | null;

  // Habit actions
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'order'>) => Promise<void>;
  updateHabit: (habit: Habit) => Promise<void>;
  removeHabit: (id: string) => Promise<void>;
  reorderHabits: (orderedIds: string[]) => Promise<void>;

  // Completion actions
  toggleCompletion: (habitId: string, date?: string) => Promise<void>;
  setCompletion: (habitId: string, date: string, completed: boolean) => Promise<void>;

  // Settings
  updateSettings: (settings: AppSettings) => Promise<void>;

  // Data management
  exportData: () => Promise<string>;
  importData: (json: string) => Promise<void>;
  resetData: () => Promise<void>;

  // Force refresh
  refresh: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback RFC 4122 v4 UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    notificationsEnabled: false,
    notificationTime: '20:00',
    theme: 'system'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) {
      setHabits([]);
      setCompletions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Seed defaults if this user has 0 habits
      await seedDefaultHabits(user.id);

      // 2. Fetch habits, completions, and user settings
      const [h, c, s] = await Promise.all([
        getAllHabits(user.id),
        getAllCompletions(user.id),
        getSettings(user.id)
      ]);

      setHabits(h);
      setCompletions(c);
      setSettings(s);

      // Apply theme
      applyTheme(s.theme);

      // Schedule notifications if enabled
      if (s.notificationsEnabled) {
        scheduleReminder(s.notificationTime);
      }
    } catch (err: any) {
      console.error('Failed to load user data:', err);
      setError(err?.message || 'Failed to load habits. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
    return () => clearReminder();
  }, [loadData]);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const [h, c] = await Promise.all([
        getAllHabits(user.id),
        getAllCompletions(user.id)
      ]);
      setHabits(h);
      setCompletions(c);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    }
  }, [user]);

  const addHabit = useCallback(
    async (habitData: Omit<Habit, 'id' | 'createdAt' | 'order'>) => {
      if (!user) throw new Error('Not authenticated');

      const maxOrder = habits.reduce((max, h) => Math.max(max, h.order ?? 0), -1);
      const newHabit: Habit = {
        ...habitData,
        id: generateUUID(),
        createdAt: new Date().toISOString(),
        order: maxOrder + 1
      };

      await saveHabit(newHabit, user.id);
      await refresh();
    },
    [habits, refresh, user]
  );

  const updateHabit = useCallback(
    async (habit: Habit) => {
      if (!user) throw new Error('Not authenticated');
      await saveHabit(habit, user.id);
      await refresh();
    },
    [refresh, user]
  );

  const removeHabit = useCallback(
    async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      await dbDeleteHabit(id, user.id);
      await refresh();
    },
    [refresh, user]
  );

  const reorderHabits = useCallback(
    async (orderedIds: string[]) => {
      if (!user) throw new Error('Not authenticated');
      await dbReorderHabits(orderedIds, user.id);
      await refresh();
    },
    [refresh, user]
  );

  const toggleCompletion = useCallback(
    async (habitId: string, date?: string) => {
      if (!user) throw new Error('Not authenticated');
      await dbToggle(habitId, user.id, date);
      await refresh();
    },
    [refresh, user]
  );

  const setCompletion = useCallback(
    async (habitId: string, date: string, completed: boolean) => {
      if (!user) throw new Error('Not authenticated');
      await dbSetCompletion(habitId, user.id, date, completed);
      await refresh();
    },
    [refresh, user]
  );

  const updateSettings = useCallback(
    async (newSettings: AppSettings) => {
      if (!user) return;
      await saveSettings(user.id, newSettings);
      setSettings(newSettings);
      applyTheme(newSettings.theme);

      if (newSettings.notificationsEnabled) {
        scheduleReminder(newSettings.notificationTime);
      } else {
        clearReminder();
      }
    },
    [user]
  );

  const handleExport = useCallback(async () => {
    if (!user) throw new Error('Not authenticated');
    return exportData(user.id);
  }, [user]);

  const handleImport = useCallback(
    async (json: string) => {
      if (!user) throw new Error('Not authenticated');
      await importData(json, user.id);
      await loadData();
    },
    [loadData, user]
  );

  const resetData = useCallback(async () => {
    if (!user) return;
    await resetAllData(user.id);
    await loadData();
  }, [loadData, user]);

  return (
    <AppContext.Provider
      value={{
        habits,
        completions,
        settings,
        loading,
        error,
        addHabit,
        updateHabit,
        removeHabit,
        reorderHabits,
        toggleCompletion,
        setCompletion,
        updateSettings,
        exportData: handleExport,
        importData: handleImport,
        resetData,
        refresh
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

function applyTheme(theme: AppSettings['theme']) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else if (theme === 'light') {
    root.setAttribute('data-theme', 'light');
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }
}
