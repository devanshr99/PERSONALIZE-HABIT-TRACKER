/**
 * Streak Engine — Pure functions for all streak/stats calculations.
 * Fully testable, no UI dependencies.
 */
import type { Habit, Completion, HabitStats, OverallStats } from '../types';
import {
  today,
  yesterday,
  addDays,
  dateRange,
  areConsecutive,
  compareDates,
  daysAgo
} from './dateUtils';

/** Check if a habit was completed on a specific date */
export function isCompletedOn(
  completions: Completion[],
  habitId: string,
  date: string
): boolean {
  return completions.some(
    c => c.habitId === habitId && c.date === date && c.completed
  );
}

/** Check if a habit was completed today */
export function isCompletedToday(
  completions: Completion[],
  habitId: string
): boolean {
  return isCompletedOn(completions, habitId, today());
}

/**
 * Get sorted unique completed dates for a habit (ascending).
 */
export function getCompletedDates(
  completions: Completion[],
  habitId: string
): string[] {
  const dates = completions
    .filter(c => c.habitId === habitId && c.completed)
    .map(c => c.date);
  // deduplicate and sort
  return [...new Set(dates)].sort();
}

/**
 * Calculate current streak for a habit.
 *
 * Logic:
 * - Count consecutive completed days ending at today or yesterday.
 * - If today is not yet completed, we don't break the streak — we allow 
 *   "yesterday was last" to still show a positive streak until midnight.
 * - If a full calendar day was missed, streak resets to 0.
 */
export function calculateCurrentStreak(
  completions: Completion[],
  habitId: string
): number {
  const completed = getCompletedDates(completions, habitId);
  if (completed.length === 0) return 0;

  const t = today();
  const y = yesterday();

  // Start from today if completed, otherwise yesterday
  const anchor = completed.includes(t) ? t : y;
  if (!completed.includes(anchor)) return 0;

  let streak = 0;
  let current = anchor;

  while (completed.includes(current)) {
    streak++;
    current = addDays(current, -1);
  }

  return streak;
}

/**
 * Calculate longest streak for a habit.
 */
export function calculateLongestStreak(
  completions: Completion[],
  habitId: string
): number {
  const completed = getCompletedDates(completions, habitId);
  if (completed.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < completed.length; i++) {
    if (areConsecutive(completed[i - 1], completed[i])) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

/**
 * Calculate total completed days for a habit.
 */
export function calculateTotalCompleted(
  completions: Completion[],
  habitId: string
): number {
  return getCompletedDates(completions, habitId).length;
}

/**
 * Calculate completion rate for a habit since it was created.
 */
export function calculateCompletionRate(
  completions: Completion[],
  habitId: string,
  createdAt: string
): number {
  const start = createdAt.slice(0, 10); // YYYY-MM-DD
  const t = today();
  if (start > t) return 0;
  const allDays = dateRange(start, t);
  if (allDays.length === 0) return 0;
  const total = calculateTotalCompleted(completions, habitId);
  return total / allDays.length;
}

/**
 * Get completion stats for a habit in a given date range.
 */
export function getCompletionsInRange(
  completions: Completion[],
  habitId: string,
  start: string,
  end: string
): number {
  return completions.filter(
    c =>
      c.habitId === habitId &&
      c.completed &&
      c.date >= start &&
      c.date <= end
  ).length;
}

/**
 * Get full stats for a single habit.
 */
export function getHabitStats(
  habit: Habit,
  completions: Completion[]
): HabitStats {
  return {
    habitId: habit.id,
    currentStreak: calculateCurrentStreak(completions, habit.id),
    longestStreak: calculateLongestStreak(completions, habit.id),
    totalCompleted: calculateTotalCompleted(completions, habit.id),
    completionRate: calculateCompletionRate(
      completions,
      habit.id,
      habit.createdAt
    ),
    completedToday: isCompletedToday(completions, habit.id)
  };
}

/**
 * Determine if ALL active habits were completed on a given day.
 */
export function allCompletedOn(
  activeHabits: Habit[],
  completions: Completion[],
  date: string
): boolean {
  if (activeHabits.length === 0) return false;
  return activeHabits.every(h => isCompletedOn(completions, h.id, date));
}

/**
 * Calculate the overall streak (all active habits completed).
 *
 * Only counts habits that were active at the time (created before that date).
 * For simplicity and UX correctness:
 * - Uses currently active habits for the streak calculation.
 * - A day counts if all currently active habits are completed that day.
 */
export function calculateOverallStreak(
  activeHabits: Habit[],
  completions: Completion[]
): number {
  if (activeHabits.length === 0) return 0;

  const t = today();
  const y = yesterday();

  // Start from today if all done, else yesterday
  const anchor = allCompletedOn(activeHabits, completions, t) ? t : y;
  if (!allCompletedOn(activeHabits, completions, anchor)) return 0;

  let streak = 0;
  let current = anchor;

  while (allCompletedOn(activeHabits, completions, current)) {
    streak++;
    current = addDays(current, -1);
    // Safety: don't go back more than 3 years
    if (current < addDays(t, -1095)) break;
  }

  return streak;
}

/**
 * Calculate longest overall streak.
 */
export function calculateLongestOverallStreak(
  activeHabits: Habit[],
  completions: Completion[]
): number {
  if (activeHabits.length === 0 || completions.length === 0) return 0;

  // Get all unique dates in completions
  const allDates = [...new Set(completions.map(c => c.date))].sort();
  if (allDates.length === 0) return 0;

  let longest = 0;
  let current = 0;

  for (let i = 0; i < allDates.length; i++) {
    if (allCompletedOn(activeHabits, completions, allDates[i])) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }

    // Check if consecutive with next
    if (i < allDates.length - 1) {
      if (!areConsecutive(allDates[i], allDates[i + 1])) {
        current = 0;
      }
    }
  }

  return longest;
}

/**
 * Get how many of the active habits are completed today.
 */
export function getTodayProgress(
  activeHabits: Habit[],
  completions: Completion[]
): { completed: number; total: number } {
  const t = today();
  const completed = activeHabits.filter(h =>
    isCompletedOn(completions, h.id, t)
  ).length;
  return { completed, total: activeHabits.length };
}

/**
 * Calculate consistency percentage for a date range across all active habits.
 */
export function calculateConsistency(
  activeHabits: Habit[],
  completions: Completion[],
  start: string,
  end: string
): number {
  if (activeHabits.length === 0) return 0;
  const days = dateRange(start, end);
  if (days.length === 0) return 0;

  let totalSlots = 0;
  let completedSlots = 0;

  for (const day of days) {
    for (const habit of activeHabits) {
      // Only count days since habit was created
      if (day >= habit.createdAt.slice(0, 10)) {
        totalSlots++;
        if (isCompletedOn(completions, habit.id, day)) {
          completedSlots++;
        }
      }
    }
  }

  return totalSlots === 0 ? 0 : completedSlots / totalSlots;
}

/**
 * Calculate all overall stats.
 */
export function calculateOverallStats(
  activeHabits: Habit[],
  completions: Completion[]
): OverallStats {
  const { completed, total } = getTodayProgress(activeHabits, completions);
  const t = today();
  const weekStart = daysAgo(6);
  const monthStart = daysAgo(29);

  return {
    currentStreak: calculateOverallStreak(activeHabits, completions),
    longestStreak: calculateLongestOverallStreak(activeHabits, completions),
    todayCompleted: completed,
    todayTotal: total,
    allDoneToday: total > 0 && completed === total,
    weekConsistency: calculateConsistency(
      activeHabits,
      completions,
      weekStart,
      t
    ),
    monthConsistency: calculateConsistency(
      activeHabits,
      completions,
      monthStart,
      t
    ),
    totalCompletions: completions.filter(c => c.completed).length
  };
}

/**
 * Get a sorted list of unique dates that have any completion data, descending.
 */
export function getHistoryDates(
  completions: Completion[],
  habits: Habit[],
  limit = 60
): string[] {
  if (habits.length === 0 && completions.length === 0) return [];

  // Determine start date: earliest habit creation OR earliest completion
  let start = today();
  if (habits.length > 0) {
    const earliestHabit = habits.reduce((earliest, h) =>
      h.createdAt < earliest.createdAt ? h : earliest
    );
    start = earliestHabit.createdAt.slice(0, 10);
  }

  for (const c of completions) {
    if (c.date < start) start = c.date;
  }

  const end = today();
  const all = dateRange(start, end).reverse().slice(0, limit);

  // Also add any dates in completions
  const completionDates = completions.map(c => c.date);

  const combined = [...new Set([...all, ...completionDates, today()])];
  return combined.sort((a, b) => compareDates(b, a)).slice(0, limit);
}

/**
 * Check if a date is a milestone (7, 30, 50, 100 days).
 */
export function isMilestone(streak: number): number | null {
  const milestones = [7, 30, 50, 100, 200, 365];
  return milestones.includes(streak) ? streak : null;
}

/**
 * Get 7-day completion data for chart (today and 6 days back).
 */
export function getWeeklyChartData(
  activeHabits: Habit[],
  completions: Completion[]
): Array<{ date: string; completed: number; total: number; percentage: number }> {
  return Array.from({ length: 7 }, (_, i) => {
    const date = daysAgo(6 - i);
    const dayHabits = activeHabits.filter(
      h => h.createdAt.slice(0, 10) <= date
    );
    const total = dayHabits.length;
    const completed = dayHabits.filter(h =>
      isCompletedOn(completions, h.id, date)
    ).length;
    return {
      date,
      completed,
      total,
      percentage: total === 0 ? 0 : completed / total
    };
  });
}
