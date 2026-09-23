export interface Habit {
  id: string;
  name: string;
  icon: string;
  active: boolean;
  createdAt: string; // ISO date string
  order: number;
}

export interface Completion {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD local date
  completed: boolean;
  completedAt: string; // ISO timestamp
}

export interface HabitStats {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  completionRate: number; // 0–1
  completedToday: boolean;
}

export interface OverallStats {
  currentStreak: number;
  longestStreak: number;
  todayCompleted: number;
  todayTotal: number;
  allDoneToday: boolean;
  weekConsistency: number;
  monthConsistency: number;
  totalCompletions: number;
}

export interface AppSettings {
  notificationsEnabled: boolean;
  notificationTime: string; // "HH:MM"
  theme: 'light' | 'dark' | 'system';
}

export interface ExportData {
  version: number;
  exportedAt: string;
  habits: Habit[];
  completions: Completion[];
  settings: AppSettings;
}

export type TabName = 'home' | 'history' | 'stats' | 'settings';

export interface DayEntry {
  date: string; // YYYY-MM-DD
  completions: Completion[];
  total: number;
  completed: number;
  allDone: boolean;
}
