/**
 * Database service for Streakly — Supabase backend.
 * All queries are explicitly scoped to the authenticated user's user_id and Supabase RLS.
 * INSERT / UPSERT operations include user_id explicitly.
 */
import { supabase } from './supabase';
import type { Habit, Completion, AppSettings } from '../types';
import { today } from '../utils/dateUtils';

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

// ─── Habits ───────────────────────────────────────────────────────────────────

export async function getAllHabits(userId?: string): Promise<Habit[]> {
  let query = supabase
    .from('habits')
    .select('*')
    .order('order', { ascending: true });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Supabase error fetching habits:', error);
    throw error;
  }

  return (data ?? []).map(mapHabitFromDb);
}

export async function getActiveHabits(userId?: string): Promise<Habit[]> {
  const habits = await getAllHabits(userId);
  return habits.filter(h => h.active);
}

export async function getHabit(id: string, userId?: string): Promise<Habit | undefined> {
  let query = supabase
    .from('habits')
    .select('*')
    .eq('id', id);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.single();
  if (error || !data) return undefined;
  return mapHabitFromDb(data);
}

export async function saveHabit(habit: Habit, userId: string): Promise<void> {
  if (!userId) throw new Error('Cannot save habit without an authenticated user');

  const record: Record<string, any> = {
    user_id: userId,
    name: habit.name.trim(),
    icon: habit.icon || '✨',
    active: habit.active ?? true,
    order: habit.order ?? 0,
    created_at: habit.createdAt || new Date().toISOString(),
  };

  if (habit.id && isValidUuid(habit.id)) {
    record.id = habit.id;
  }

  const { error } = await supabase.from('habits').upsert(record);
  if (error) {
    console.error('Supabase error saving habit:', error);
    throw error;
  }
}

export async function deleteHabit(id: string, userId?: string): Promise<void> {
  let compQuery = supabase.from('habit_completions').delete().eq('habit_id', id);
  if (userId) compQuery = compQuery.eq('user_id', userId);
  const { error: compError } = await compQuery;
  if (compError) console.error('Supabase error deleting habit completions:', compError);

  let habitQuery = supabase.from('habits').delete().eq('id', id);
  if (userId) habitQuery = habitQuery.eq('user_id', userId);
  const { error } = await habitQuery;
  if (error) {
    console.error('Supabase error deleting habit:', error);
    throw error;
  }
}

export async function reorderHabits(orderedIds: string[], userId?: string): Promise<void> {
  const updates = orderedIds.map((id, index) => {
    let q = supabase.from('habits').update({ order: index }).eq('id', id);
    if (userId) q = q.eq('user_id', userId);
    return q;
  });
  const results = await Promise.all(updates);
  for (const res of results) {
    if (res.error) {
      console.error('Supabase error updating habit order:', res.error);
      throw res.error;
    }
  }
}

// ─── Completions ──────────────────────────────────────────────────────────────

export async function getAllCompletions(userId?: string): Promise<Completion[]> {
  let query = supabase.from('habit_completions').select('*');
  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Supabase error fetching habit completions:', error);
    throw error;
  }
  return (data ?? []).map(mapCompletionFromDb);
}

export async function getCompletionsForHabit(habitId: string, userId?: string): Promise<Completion[]> {
  let query = supabase
    .from('habit_completions')
    .select('*')
    .eq('habit_id', habitId);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Supabase error fetching completions for habit:', error);
    throw error;
  }
  return (data ?? []).map(mapCompletionFromDb);
}

export async function getCompletionForDate(
  habitId: string,
  date: string,
  userId?: string
): Promise<Completion | undefined> {
  let query = supabase
    .from('habit_completions')
    .select('*')
    .eq('habit_id', habitId)
    .eq('date', date);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error('Supabase error fetching completion for date:', error);
    throw error;
  }
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
  if (!userId) throw new Error('Cannot toggle completion without an authenticated user');

  const existing = await getCompletionForDate(habitId, date, userId);

  if (existing) {
    const newState = !existing.completed;
    const { error } = await supabase
      .from('habit_completions')
      .update({
        completed: newState,
        completed_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .eq('user_id', userId);

    if (error) {
      console.error('Supabase error updating completion:', error);
      throw error;
    }
    return newState;
  } else {
    const { error } = await supabase.from('habit_completions').insert({
      user_id: userId,
      habit_id: habitId,
      date,
      completed: true,
      completed_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Supabase error inserting completion:', error);
      throw error;
    }
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
  if (!userId) throw new Error('Cannot set completion without an authenticated user');

  const existing = await getCompletionForDate(habitId, date, userId);

  if (existing) {
    const { error } = await supabase
      .from('habit_completions')
      .update({
        completed,
        completed_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .eq('user_id', userId);

    if (error) {
      console.error('Supabase error updating completion:', error);
      throw error;
    }
  } else if (completed) {
    const { error } = await supabase.from('habit_completions').insert({
      user_id: userId,
      habit_id: habitId,
      date,
      completed: true,
      completed_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Supabase error inserting completion:', error);
      throw error;
    }
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: false,
  notificationTime: '20:00',
  theme: 'system'
};

export async function getSettings(userId: string): Promise<AppSettings> {
  if (!userId) return DEFAULT_SETTINGS;

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Supabase error getting settings:', error);
    return DEFAULT_SETTINGS;
  }

  if (!data) return DEFAULT_SETTINGS;

  return {
    notificationsEnabled: data.notifications_enabled ?? false,
    notificationTime: data.notification_time ?? '20:00',
    theme: (data.theme as AppSettings['theme']) ?? 'system',
  };
}

export async function saveSettings(userId: string, settings: AppSettings): Promise<void> {
  if (!userId) return;

  const { error } = await supabase.from('user_settings').upsert({
    user_id: userId,
    notifications_enabled: settings.notificationsEnabled,
    notification_time: settings.notificationTime,
    theme: settings.theme,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Supabase error saving settings:', error);
    throw error;
  }
}

// ─── Data Export / Import ─────────────────────────────────────────────────────

export async function exportData(userId: string): Promise<string> {
  const [habits, completions, settings] = await Promise.all([
    getAllHabits(userId),
    getAllCompletions(userId),
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
  if (!userId) throw new Error('Cannot import data without an authenticated user');

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
  const newHabits = await getAllHabits(userId);
  const habitNameMap = new Map(newHabits.map(h => [h.name, h.id]));

  // Import completions
  if (data.completions && Array.isArray(data.completions)) {
    for (const completion of data.completions) {
      const oldHabit = data.habits.find(h =>
        h.id === completion.habitId || h.id === completion.habit_id
      );
      const habitName = oldHabit?.name;
      const newHabitId = habitName ? habitNameMap.get(habitName) : null;

      if (newHabitId && completion.date) {
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
  if (!userId) return;
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
  if (!userId) return;

  // Check if user already has any habits
  const { count, error: countError } = await supabase
    .from('habits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) {
    console.error('Supabase error checking habits count:', countError);
    throw countError;
  }

  // If user already has habits, do not add duplicates
  if (count && count > 0) return;

  const now = new Date().toISOString();
  const defaultRecords = DEFAULT_HABITS.map((item, index) => ({
    user_id: userId,
    name: item.name,
    icon: item.icon,
    active: true,
    order: index,
    created_at: now,
  }));

  const { error: insertError } = await supabase
    .from('habits')
    .insert(defaultRecords);

  if (insertError) {
    console.error('Supabase error inserting default habits:', insertError);
    throw insertError;
  }
}

// ─── DB Row → App Type Mappers ────────────────────────────────────────────────

function mapHabitFromDb(row: any): Habit {
  return {
    id: String(row.id),
    name: row.name || 'Untitled Habit',
    icon: row.icon || '✨',
    active: row.active ?? true,
    order: typeof row.order === 'number' ? row.order : 0,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapCompletionFromDb(row: any): Completion {
  return {
    id: String(row.id),
    habitId: String(row.habit_id),
    date: row.date,
    completed: row.completed ?? true,
    completedAt: row.completed_at || new Date().toISOString(),
  };
}
