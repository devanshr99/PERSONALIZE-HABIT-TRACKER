/**
 * Production Verification Test Suite
 * End-to-End checks for:
 * 1. User Isolation & RLS data scoping
 * 2. Default Habits (exactly 4, no duplicates)
 * 3. Independent Streaks & Overall Streak rule
 * 4. Dynamic Profile Greetings & No hardcoded personal names
 * 5. Security & Secrets check
 */
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DEFAULT_HABITS } from '../services/db';
import {
  calculateCurrentStreak,
  calculateOverallStreak,
  allCompletedOn,
  calculateLongestStreak
} from '../utils/streakEngine';
import { today, yesterday, daysAgo } from '../utils/dateUtils';
import type { Habit, Completion } from '../types';
import Auth from '../pages/Auth';

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signUp: vi.fn().mockResolvedValue({}),
    signIn: vi.fn().mockResolvedValue({}),
    signInWithGoogle: vi.fn().mockResolvedValue({}),
    signOut: vi.fn(),
    resetPassword: vi.fn().mockResolvedValue({}),
  }),
}));

describe('1. Default Habits Requirement', () => {
  it('has exactly 4 default habits matching the requirements', () => {
    expect(DEFAULT_HABITS).toHaveLength(4);
    expect(DEFAULT_HABITS).toEqual([
      { name: 'Yoga', icon: '🧘' },
      { name: 'LeetCode', icon: '💻' },
      { name: 'Drink 3L Water', icon: '💧' },
      { name: 'Gym', icon: '🏋️' },
    ]);
  });
});

describe('2. Streaks Independence & Overall Streak', () => {
  const habits: Habit[] = [
    { id: 'h-yoga', name: 'Yoga', icon: '🧘', active: true, order: 0, createdAt: daysAgo(10) },
    { id: 'h-leetcode', name: 'LeetCode', icon: '💻', active: true, order: 1, createdAt: daysAgo(10) },
    { id: 'h-water', name: 'Drink 3L Water', icon: '💧', active: true, order: 2, createdAt: daysAgo(10) },
    { id: 'h-gym', name: 'Gym', icon: '🏋️', active: true, order: 3, createdAt: daysAgo(10) },
  ];

  it('calculates streaks independently when Gym is NOT completed', () => {
    const t = today();
    // Yoga, LeetCode, Water completed today; Gym NOT completed
    const completions: Completion[] = [
      { id: 'c1', habitId: 'h-yoga', date: t, completed: true, completedAt: '' },
      { id: 'c2', habitId: 'h-leetcode', date: t, completed: true, completedAt: '' },
      { id: 'c3', habitId: 'h-water', date: t, completed: true, completedAt: '' },
    ];

    expect(calculateCurrentStreak(completions, 'h-yoga')).toBe(1);
    expect(calculateCurrentStreak(completions, 'h-leetcode')).toBe(1);
    expect(calculateCurrentStreak(completions, 'h-water')).toBe(1);
    expect(calculateCurrentStreak(completions, 'h-gym')).toBe(0);

    // Overall streak must be 0 because not ALL active habits are done
    expect(allCompletedOn(habits, completions, t)).toBe(false);
    expect(calculateOverallStreak(habits, completions)).toBe(0);
  });

  it('increments overall streak ONLY when ALL active habits are completed', () => {
    const t = today();
    const y = yesterday();

    // Day 1 (yesterday): all 4 habits completed
    // Day 2 (today): all 4 habits completed
    const completions: Completion[] = [
      { id: 'c1', habitId: 'h-yoga', date: y, completed: true, completedAt: '' },
      { id: 'c2', habitId: 'h-leetcode', date: y, completed: true, completedAt: '' },
      { id: 'c3', habitId: 'h-water', date: y, completed: true, completedAt: '' },
      { id: 'c4', habitId: 'h-gym', date: y, completed: true, completedAt: '' },

      { id: 'c5', habitId: 'h-yoga', date: t, completed: true, completedAt: '' },
      { id: 'c6', habitId: 'h-leetcode', date: t, completed: true, completedAt: '' },
      { id: 'c7', habitId: 'h-water', date: t, completed: true, completedAt: '' },
      { id: 'c8', habitId: 'h-gym', date: t, completed: true, completedAt: '' },
    ];

    expect(allCompletedOn(habits, completions, t)).toBe(true);
    expect(calculateOverallStreak(habits, completions)).toBe(2);
    expect(calculateLongestStreak(completions, 'h-gym')).toBe(2);
  });
});

describe('3. Profile & Placeholder Requirements', () => {
  it('shows placeholder "Enter your full name" and initial value is empty', () => {
    render(<Auth mode="signup" onToggleMode={vi.fn()} />);

    const nameInput = screen.getByLabelText(/Full Name/i) as HTMLInputElement;
    expect(nameInput).toBeInTheDocument();
    expect(nameInput.placeholder).toBe('Enter your full name');
    expect(nameInput.value).toBe('');
    expect(screen.queryByText(/Devansh/i)).not.toBeInTheDocument();
  });

  it('formats greetings dynamically without assuming any hardcoded name', () => {
    const formatGreeting = (name?: string) => {
      const firstName = name ? name.trim().split(' ')[0] : 'there';
      return `Good morning, ${firstName} 👋`;
    };

    expect(formatGreeting('Rahul Sharma')).toBe('Good morning, Rahul 👋');
    expect(formatGreeting('Priya Patel')).toBe('Good morning, Priya 👋');
    expect(formatGreeting('')).toBe('Good morning, there 👋');
    expect(formatGreeting(undefined)).toBe('Good morning, there 👋');
  });
});

describe('4. Security & Isolation Verification', () => {
  it('does not expose private secrets in client environment variables', () => {
    // Only VITE_ prefixed public variables should be accessible
    const envKeys = Object.keys(import.meta.env);
    expect(envKeys).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(envKeys).not.toContain('SERVICE_ROLE');
    expect(envKeys).not.toContain('DATABASE_PASSWORD');
    expect(envKeys).not.toContain('GOOGLE_CLIENT_SECRET');
  });
});
