/**
 * Streak Engine Tests
 * Tests all edge cases as specified in requirements.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateCurrentStreak,
  calculateLongestStreak,
  calculateOverallStreak,
  calculateLongestOverallStreak,
  isCompletedOn,
  isCompletedToday,
  getCompletedDates,
  getHabitStats
} from '../utils/streakEngine';
import type { Habit, Completion } from '../types';
import {
  today,
  yesterday,
  daysAgo,
  addDays,
  toLocalDateString
} from '../utils/dateUtils';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    name: 'Test Habit',
    icon: '✅',
    active: true,
    order: 0,
    createdAt: daysAgo(365),
    ...overrides
  };
}

function makeCompletion(
  habitId: string,
  date: string,
  completed = true
): Completion {
  return {
    id: `${habitId}-${date}`,
    habitId,
    date,
    completed,
    completedAt: new Date().toISOString()
  };
}

function completions(dates: string[], habitId = 'habit-1'): Completion[] {
  return dates.map(d => makeCompletion(habitId, d));
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('Streak Engine', () => {
  // 1. Empty history
  describe('1. Empty history', () => {
    it('currentStreak should be 0 with no completions', () => {
      expect(calculateCurrentStreak([], 'habit-1')).toBe(0);
    });

    it('longestStreak should be 0 with no completions', () => {
      expect(calculateLongestStreak([], 'habit-1')).toBe(0);
    });

    it('isCompletedToday should be false', () => {
      expect(isCompletedToday([], 'habit-1')).toBe(false);
    });
  });

  // 2. One completed day — today
  describe('2. One completed day (today)', () => {
    const c = completions([today()]);

    it('currentStreak should be 1', () => {
      expect(calculateCurrentStreak(c, 'habit-1')).toBe(1);
    });

    it('longestStreak should be 1', () => {
      expect(calculateLongestStreak(c, 'habit-1')).toBe(1);
    });

    it('isCompletedToday should be true', () => {
      expect(isCompletedToday(c, 'habit-1')).toBe(true);
    });
  });

  // 3. One completed day — yesterday
  describe('3. One completed day (yesterday, today not done)', () => {
    const c = completions([yesterday()]);

    it('currentStreak should be 1 (grace period — yesterday counts)', () => {
      expect(calculateCurrentStreak(c, 'habit-1')).toBe(1);
    });

    it('isCompletedToday should be false', () => {
      expect(isCompletedToday(c, 'habit-1')).toBe(false);
    });
  });

  // 4. Three consecutive days
  describe('4. Three consecutive days', () => {
    const c = completions([daysAgo(2), daysAgo(1), today()]);

    it('currentStreak should be 3', () => {
      expect(calculateCurrentStreak(c, 'habit-1')).toBe(3);
    });

    it('longestStreak should be 3', () => {
      expect(calculateLongestStreak(c, 'habit-1')).toBe(3);
    });
  });

  // 5. Missing middle day
  describe('5. Missing middle day', () => {
    const c = completions([daysAgo(3), daysAgo(1), today()]);

    it('currentStreak should be 2 (today + yesterday)', () => {
      expect(calculateCurrentStreak(c, 'habit-1')).toBe(2);
    });

    it('longestStreak should be 2', () => {
      expect(calculateLongestStreak(c, 'habit-1')).toBe(2);
    });
  });

  // 6. Missing today but yesterday was done
  describe('6. Missing today (grace period)', () => {
    const c = completions([daysAgo(2), daysAgo(1)]);

    it('currentStreak should be 2 (yesterday + day before)', () => {
      expect(calculateCurrentStreak(c, 'habit-1')).toBe(2);
    });
  });

  // 7. Completing today (toggle from false to true)
  describe('7. Completing today', () => {
    it('isCompletedToday returns true after adding today completion', () => {
      const c: Completion[] = [];
      expect(isCompletedToday(c, 'habit-1')).toBe(false);

      c.push(makeCompletion('habit-1', today()));
      expect(isCompletedToday(c, 'habit-1')).toBe(true);
    });
  });

  // 8. Duplicate completion (same habit, same date)
  describe('8. Duplicate completions', () => {
    it('should deduplicate and count as one day', () => {
      const c = [
        makeCompletion('habit-1', today()),
        makeCompletion('habit-1', today())
      ];
      expect(calculateCurrentStreak(c, 'habit-1')).toBe(1);
    });
  });

  // 9. Undoing completion (completed = false)
  describe('9. Undoing completion', () => {
    it('should not count uncompleted entries', () => {
      const c: Completion[] = [
        { id: '1', habitId: 'habit-1', date: today(), completed: false, completedAt: '' }
      ];
      expect(isCompletedToday(c, 'habit-1')).toBe(false);
      expect(calculateCurrentStreak(c, 'habit-1')).toBe(0);
    });
  });

  // 10. Long streak calculation
  describe('10. Longer streak', () => {
    it('should calculate a 7-day streak correctly', () => {
      const dates = Array.from({ length: 7 }, (_, i) => daysAgo(6 - i));
      const c = completions(dates);
      expect(calculateCurrentStreak(c, 'habit-1')).toBe(7);
    });
  });

  // 11. Longest streak across a gap
  describe('11. Longest streak across a gap', () => {
    it('should find the longest streak even with gaps', () => {
      // Old 10-day streak, then a gap, then current 3-day streak
      const oldStreak = Array.from({ length: 10 }, (_, i) =>
        daysAgo(30 + 9 - i)
      );
      const newStreak = [daysAgo(2), daysAgo(1), today()];
      const c = completions([...oldStreak, ...newStreak]);

      expect(calculateLongestStreak(c, 'habit-1')).toBe(10);
      expect(calculateCurrentStreak(c, 'habit-1')).toBe(3);
    });
  });

  // 12. Overall streak — all habits done
  describe('12. Overall streak', () => {
    it('should calculate overall streak when all habits are completed', () => {
      const h1 = makeHabit({ id: 'h1' });
      const h2 = makeHabit({ id: 'h2' });
      const habits = [h1, h2];

      const c: Completion[] = [
        makeCompletion('h1', today()),
        makeCompletion('h2', today()),
        makeCompletion('h1', yesterday()),
        makeCompletion('h2', yesterday())
      ];

      expect(calculateOverallStreak(habits, c)).toBe(2);
    });

    it('should NOT count a day if even one habit is missing', () => {
      const h1 = makeHabit({ id: 'h1' });
      const h2 = makeHabit({ id: 'h2' });
      const habits = [h1, h2];

      // Today h2 not done
      const c: Completion[] = [
        makeCompletion('h1', today()),
        makeCompletion('h1', yesterday()),
        makeCompletion('h2', yesterday())
      ];

      // Today not all done, so overall streak = 1 (yesterday)
      expect(calculateOverallStreak(habits, c)).toBe(1);
    });
  });

  // 13. Deactivated habit excluded from overall streak
  describe('13. Deactivated habit', () => {
    it('should exclude inactive habits from overall streak', () => {
      const h1 = makeHabit({ id: 'h1', active: true });
      const h2 = makeHabit({ id: 'h2', active: false }); // inactive
      const activeHabits = [h1]; // only pass active habits

      // Only h1 completed, but that's all that's active
      const c: Completion[] = [
        makeCompletion('h1', today()),
        makeCompletion('h1', yesterday())
      ];

      expect(calculateOverallStreak(activeHabits, c)).toBe(2);
    });
  });

  // 14. New habit (only created today)
  describe('14. New habit', () => {
    it('should have 0 streak with no completions', () => {
      const habit = makeHabit({ createdAt: new Date().toISOString() });
      const stats = getHabitStats(habit, []);
      expect(stats.currentStreak).toBe(0);
      expect(stats.totalCompleted).toBe(0);
    });

    it('should have streak 1 after completing today', () => {
      const habit = makeHabit({ createdAt: new Date().toISOString() });
      const c = [makeCompletion('habit-1', today())];
      const stats = getHabitStats(habit, c);
      expect(stats.currentStreak).toBe(1);
      expect(stats.completedToday).toBe(true);
    });
  });

  // 15. Month boundary
  describe('15. Month boundary', () => {
    it('should count streak across month boundary', () => {
      // Simulate end of Jan / start of Feb
      const jan31 = '2026-01-31';
      const feb1 = '2026-02-01';
      const feb2 = '2026-02-02';

      // Create a fake completion set
      const c: Completion[] = [
        makeCompletion('habit-1', jan31),
        makeCompletion('habit-1', feb1),
        makeCompletion('habit-1', feb2)
      ];

      const dates = getCompletedDates(c, 'habit-1');
      expect(dates).toContain(jan31);
      expect(dates).toContain(feb1);
      expect(dates).toContain(feb2);
      expect(calculateLongestStreak(c, 'habit-1')).toBe(3);
    });
  });

  // 16. Year boundary
  describe('16. Year boundary', () => {
    it('should count streak across year boundary', () => {
      const dec31 = '2025-12-31';
      const jan1 = '2026-01-01';
      const jan2 = '2026-01-02';

      const c: Completion[] = [
        makeCompletion('habit-1', dec31),
        makeCompletion('habit-1', jan1),
        makeCompletion('habit-1', jan2)
      ];

      expect(calculateLongestStreak(c, 'habit-1')).toBe(3);
    });
  });

  // 17. isCompletedOn correct date matching
  describe('17. Date matching', () => {
    it('should correctly identify completion on a specific date', () => {
      const c = [makeCompletion('habit-1', daysAgo(5))];
      expect(isCompletedOn(c, 'habit-1', daysAgo(5))).toBe(true);
      expect(isCompletedOn(c, 'habit-1', daysAgo(4))).toBe(false);
      expect(isCompletedOn(c, 'habit-1', today())).toBe(false);
    });
  });

  // 18. Completions for wrong habit don't count
  describe('18. Multi-habit isolation', () => {
    it('should not mix completions between habits', () => {
      const c = [
        makeCompletion('habit-1', today()),
        makeCompletion('habit-2', yesterday()),
        makeCompletion('habit-2', today())
      ];

      expect(calculateCurrentStreak(c, 'habit-1')).toBe(1);
      expect(calculateCurrentStreak(c, 'habit-2')).toBe(2);
      expect(isCompletedToday(c, 'habit-1')).toBe(true);
      expect(isCompletedToday(c, 'habit-2')).toBe(true);
    });
  });
});
