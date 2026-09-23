import React, { useState, useCallback } from 'react';
import type { Habit, Completion } from '../types';
import { calculateCurrentStreak, isCompletedToday } from '../utils/streakEngine';

interface HabitCardProps {
  habit: Habit;
  completions: Completion[];
  onToggle: (habitId: string) => void;
  onOpenDetail: (habit: Habit) => void;
}

export default function HabitCard({
  habit,
  completions,
  onToggle,
  onOpenDetail
}: HabitCardProps) {
  const [pressing, setPressing] = useState(false);
  const completed = isCompletedToday(completions, habit.id);
  const streak = calculateCurrentStreak(completions, habit.id);

  const handleToggle = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      onToggle(habit.id);
    },
    [habit.id, onToggle]
  );

  const handleOpenDetail = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onOpenDetail(habit);
    },
    [habit, onOpenDetail]
  );

  return (
    <article
      className={`habit-card ${completed ? 'completed' : ''} ${pressing ? 'pressing' : ''}`}
      onClick={() => handleToggle()}
      onPointerDown={() => setPressing(true)}
      onPointerUp={() => setPressing(false)}
      onPointerLeave={() => setPressing(false)}
      role="button"
      tabIndex={0}
      aria-label={`${habit.name} — ${completed ? 'completed' : 'not completed'}. Streak: ${streak} days. Tap to toggle.`}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleToggle();
        }
      }}
    >
      <div className="habit-card-top">
        <div className="habit-card-left">
          <span className="habit-icon" aria-hidden="true">{habit.icon}</span>
          <span className="habit-name">{habit.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="habit-detail-btn"
            onClick={handleOpenDetail}
            aria-label={`View stats and calendar for ${habit.name}`}
            title="View details & calendar"
            id={`habit-detail-${habit.id}`}
          >
            📊
          </button>
          <button
            type="button"
            className="habit-check"
            onClick={handleToggle}
            aria-label={completed ? `Mark ${habit.name} as incomplete` : `Mark ${habit.name} as complete`}
            aria-pressed={completed}
            id={`habit-check-${habit.id}`}
          >
            {completed && '✓'}
          </button>
        </div>
      </div>

      <div className="habit-card-bottom">
        <span className="streak-badge">
          <span className="streak-fire" aria-hidden="true">🔥</span>
          <span>{streak} day{streak !== 1 ? 's' : ''}</span>
        </span>
        <span className="habit-status">
          {completed ? '✓ Completed today' : '○ Complete today'}
        </span>
      </div>
    </article>
  );
}
