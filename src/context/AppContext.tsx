/**
 * Global app context — holds habits, completions, settings in memory.
 * All data flows through this context to avoid prop drilling.
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

interface AppContextValue {
  habits: Habit[];
  completions: Completion[];
  settings: AppSettings;
  loading: boolean;

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

export function AppProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    notificationsEnabled: false,
    notificationTime: '20:00',
    theme: 'system'
  });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    await seedDefaultHabits();
    const [h, c, s] = await Promise.all([
      getAllHabits(),
      getAllCompletions(),
      getSettings()
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

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    return () => clearReminder();
  }, [loadData]);

  const refresh = useCallback(async () => {
    const [h, c] = await Promise.all([getAllHabits(), getAllCompletions()]);
    setHabits(h);
    setCompletions(c);
  }, []);

  const addHabit = useCallback(
    async (habitData: Omit<Habit, 'id' | 'createdAt' | 'order'>) => {
      const maxOrder = habits.reduce((max, h) => Math.max(max, h.order), -1);
      const newHabit: Habit = {
        ...habitData,
        id: `habit-${Date.now()}`,
        createdAt: new Date().toISOString(),
        order: maxOrder + 1
      };
      await saveHabit(newHabit);
      await refresh();
    },
    [habits, refresh]
  );

  const updateHabit = useCallback(
    async (habit: Habit) => {
      await saveHabit(habit);
      await refresh();
    },
    [refresh]
  );

  const removeHabit = useCallback(
    async (id: string) => {
      await dbDeleteHabit(id);
      await refresh();
    },
    [refresh]
  );

  const reorderHabits = useCallback(
    async (orderedIds: string[]) => {
      await dbReorderHabits(orderedIds);
      await refresh();
    },
    [refresh]
  );

  const toggleCompletion = useCallback(
    async (habitId: string, date?: string) => {
      await dbToggle(habitId, date);
      await refresh();
    },
    [refresh]
  );

  const setCompletion = useCallback(
    async (habitId: string, date: string, completed: boolean) => {
      await dbSetCompletion(habitId, date, completed);
      await refresh();
    },
    [refresh]
  );

  const updateSettings = useCallback(
    async (newSettings: AppSettings) => {
      await saveSettings(newSettings);
      setSettings(newSettings);
      applyTheme(newSettings.theme);

      if (newSettings.notificationsEnabled) {
        scheduleReminder(newSettings.notificationTime);
      } else {
        clearReminder();
      }
    },
    []
  );

  const handleExport = useCallback(async () => {
    return exportData();
  }, []);

  const handleImport = useCallback(
    async (json: string) => {
      await importData(json);
      await loadData();
    },
    [loadData]
  );

  const resetData = useCallback(async () => {
    await resetAllData();
    await loadData();
  }, [loadData]);

  return (
    <AppContext.Provider
      value={{
        habits,
        completions,
        settings,
        loading,
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
    // System: use prefers-color-scheme
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }
}
