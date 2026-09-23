import React from 'react';
import type { Habit, Completion } from '../types';
import { calculateOverallStreak, getTodayProgress } from '../utils/streakEngine';

interface ProgressCardProps {
  activeHabits: Habit[];
  completions: Completion[];
}

export default function ProgressCard({
  activeHabits,
  completions
}: ProgressCardProps) {
  const { completed, total } = getTodayProgress(activeHabits, completions);
  const overallStreak = calculateOverallStreak(activeHabits, completions);
  const allDone = total > 0 && completed === total;
  const percentage = total === 0 ? 0 : (completed / total) * 100;

  return (
    <div className={`today-card ${allDone ? 'all-done' : ''}`}>
      <div className="today-card-header">
        <span className="today-label">Today</span>
        {allDone && (
          <span style={{ fontSize: 18 }}>🎉</span>
        )}
      </div>

      <div className="today-count" aria-label={`${completed} of ${total} habits completed`}>
        {completed} <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>/ {total}</span>
      </div>
      <div className="today-count-sub">
        habits completed
      </div>

      <div
        className="progress-bar"
        style={{ marginTop: 14 }}
        role="progressbar"
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Today's progress"
      >
        <div
          className={`progress-bar-fill ${allDone ? 'complete' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="today-streak-row">
        <div className="streak-badge">
          <span className="streak-fire">🔥</span>
          <span>{overallStreak} day overall streak</span>
        </div>
        {allDone && (
          <span className="today-all-done">All done for today 🔥</span>
        )}
      </div>
    </div>
  );
}
