/**
 * Database service for Streakly — Supabase backend.
 * All queries are automatically scoped to the authenticated user via RLS.
 * INSERT operations include user_id explicitly.
 */
import { supabase } from './supabase';
import type { Habit, Completion, AppSettings } from '../types';
import { today } from '../utils/dateUtils';

// ─── Habits ───────────────────────────────────────────────────────────────────

export async function getAllHabits(): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .order('order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map(mapHabitFromDb);
}

export async function getActiveHabits(): Promise<Habit[]> {
  const habits = await getAllHabits();
  return habits.filter(h => h.active);
}

export async function getHabit(id: string): Promise<Habit | undefined> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return undefined;
  return mapHabitFromDb(data);
}

export async function saveHabit(habit: Habit, userId: string): Promise<void> {
  const { error } = await supabase.from('habits').upsert({
    id: habit.id,
    user_id: userId,
    name: habit.name,
    icon: habit.icon,
    active: habit.active,
    order: habit.order,
    created_at: habit.createdAt,
  });

  if (error) throw error;
}

export async function deleteHabit(id: string): Promise<void> {
  // Completions are cascade-deleted by FK, but let's be explicit
  await supabase.from('habit_completions').delete().eq('habit_id', id);
  const { error } = await supabase.from('habits').delete().eq('id', id);
  if (error) throw error;
}

export async function reorderHabits(orderedIds: string[]): Promise<void> {
  // Update each habit's order
  const updates = orderedIds.map((id, index) =>
    supabase.from('habits').update({ order: index }).eq('id', id)
  );
  await Promise.all(updates);
}

// ─── Completions ──────────────────────────────────────────────────────────────

export async function getAllCompletions(): Promise<Completion[]> {
  const { data, error } = await supabase
    .from('habit_completions')
    .select('*');

  if (error) throw error;
  return (data ?? []).map(mapCompletionFromDb);
}

export async function getCompletionsForHabit(habitId: string): Promise<Completion[]> {
  const { data, error } = await supabase
    .from('habit_completions')
    .select('*')
    .eq('habit_id', habitId);

  if (error) throw error;
  return (data ?? []).map(mapCompletionFromDb);
}

export async function getCompletionForDate(
  habitId: string,
  date: string
): Promise<Completion | undefined> {
  const { data, error } = await supabase
    .from('habit_completions')
    .select('*')
    .eq('habit_id', habitId)
    .eq('date', date)
    .maybeSingle();

  if (error) throw error;
  return data ? mapCompletionFromDb(data) : undefined;
}

/**
 * Toggle completion for a habit on a date.
 * Returns the new completion state.
 */
export async function toggleCompletion(
  habitId: string,
  userId: string,
  date: string = today()
): Promise<boolean> {
  const existing = await getCompletionForDate(habitId, date);

  if (existing) {
    const newState = !existing.completed;
    await supabase
      .from('habit_completions')
      .update({
        completed: newState,
        completed_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    return newState;
  } else {
    await supabase.from('habit_completions').insert({
      user_id: userId,
      habit_id: habitId,
      date,
      completed: true,
      completed_at: new Date().toISOString(),
    });
    return true;
  }
}

/**
 * Set completion for a habit on a date to a specific value.
 */
export async function setCompletion(
  habitId: string,
  userId: string,
  date: string,
  completed: boolean
): Promise<void> {
  const existing = await getCompletionForDate(habitId, date);

  if (existing) {
    await supabase
      .from('habit_completions')
      .update({
        completed,
        completed_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else if (completed) {
    await supabase.from('habit_completions').insert({
      user_id: userId,
      habit_id: habitId,
      date,
      completed: true,
      completed_at: new Date().toISOString(),
    });
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: false,
  notificationTime: '20:00',
  theme: 'system'
};

export async function getSettings(userId: string): Promise<AppSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return DEFAULT_SETTINGS;

  return {
    notificationsEnabled: data.notifications_enabled ?? false,
    notificationTime: data.notification_time ?? '20:00',
    theme: (data.theme as AppSettings['theme']) ?? 'system',
  };
}

export async function saveSettings(userId: string, settings: AppSettings): Promise<void> {
  const { error } = await supabase.from('user_settings').upsert({
    user_id: userId,
    notifications_enabled: settings.notificationsEnabled,
    notification_time: settings.notificationTime,
    theme: settings.theme,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

// ─── Data Export / Import ─────────────────────────────────────────────────────

export async function exportData(userId: string): Promise<string> {
  const [habits, completions, settings] = await Promise.all([
    getAllHabits(),
    getAllCompletions(),
    getSettings(userId),
  ]);

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, avatar_url')
    .eq('id', userId)
    .single();

  const exportObj = {
    version: 2,
    exportedAt: new Date().toISOString(),
    profile: profile || undefined,
    habits,
    completions,
    settings
  };

  return JSON.stringify(exportObj, null, 2);
}

export async function importData(jsonStr: string, userId: string): Promise<void> {
  let data: {
    version?: number;
    habits?: any[];
    completions?: any[];
    settings?: AppSettings;
  };

  try {
    data = JSON.parse(jsonStr);
  } catch {
    throw new Error('Invalid JSON file');
  }

  if (!data.habits || !Array.isArray(data.habits)) {
    throw new Error('Invalid data format: missing habits');
  }

  // Clear existing user data
  await supabase.from('habit_completions').delete().eq('user_id', userId);
  await supabase.from('habits').delete().eq('user_id', userId);

  // Import habits
  for (const habit of data.habits) {
    if (habit.name) {
      await supabase.from('habits').insert({
        user_id: userId,
        name: habit.name,
        icon: habit.icon || '✨',
        active: habit.active ?? true,
        order: habit.order ?? 0,
        created_at: habit.createdAt || new Date().toISOString(),
      });
    }
  }

  // Re-fetch habits to get their new IDs for completion mapping
  const newHabits = await getAllHabits();
  const habitNameMap = new Map(newHabits.map(h => [h.name, h.id]));

  // Import completions (map by habit name since IDs may differ)
  if (data.completions && Array.isArray(data.completions)) {
    for (const completion of data.completions) {
      // Try to find matching habit by original habit reference
      const oldHabit = data.habits.find(h =>
        h.id === completion.habitId || h.id === completion.habit_id
      );
      const habitName = oldHabit?.name;
      const newHabitId = habitName ? habitNameMap.get(habitName) : null;

      if (newHabitId && (completion.date || completion.date)) {
        await supabase.from('habit_completions').upsert({
          user_id: userId,
          habit_id: newHabitId,
          date: completion.date,
          completed: completion.completed ?? true,
          completed_at: completion.completedAt || completion.completed_at || new Date().toISOString(),
        }, { onConflict: 'user_id,habit_id,date' });
      }
    }
  }

  // Import settings
  if (data.settings) {
    await saveSettings(userId, data.settings);
  }
}

export async function resetAllData(userId: string): Promise<void> {
  await supabase.from('habit_completions').delete().eq('user_id', userId);
  await supabase.from('habits').delete().eq('user_id', userId);
  await supabase.from('user_settings').delete().eq('user_id', userId);
}

// ─── Seed Default Habits ──────────────────────────────────────────────────────

export const DEFAULT_HABITS: Array<{ name: string; icon: string }> = [
  { name: 'Yoga', icon: '🧘' },
  { name: 'LeetCode', icon: '💻' },
  { name: 'Drink 3L Water', icon: '💧' },
  { name: 'Gym', icon: '🏋️' },
];

export async function seedDefaultHabits(userId: string): Promise<void> {
  // Check if user already has any habits
  const { count } = await supabase
    .from('habits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (count && count > 0) return;

  const now = new Date().toISOString();
  for (let i = 0; i < DEFAULT_HABITS.length; i++) {
    await supabase.from('habits').insert({
      user_id: userId,
      name: DEFAULT_HABITS[i].name,
      icon: DEFAULT_HABITS[i].icon,
      active: true,
      order: i,
      created_at: now,
    });
  }
}

// ─── DB Row → App Type Mappers ────────────────────────────────────────────────

function mapHabitFromDb(row: any): Habit {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    active: row.active,
    order: row.order,
    createdAt: row.created_at,
  };
}

function mapCompletionFromDb(row: any): Completion {
  return {
    id: row.id,
    habitId: row.habit_id,
    date: row.date,
    completed: row.completed,
    completedAt: row.completed_at,
  };
}
