import React, { useCallback, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import HabitCard from '../components/HabitCard';
import ProgressCard from '../components/ProgressCard';
import { Toast, useToast } from '../components/Toast';
import { getGreeting, getTodayDisplay } from '../utils/dateUtils';
import { calculateCurrentStreak, isMilestone } from '../utils/streakEngine';
import type { Habit } from '../types';

interface HomeProps {
  onOpenDetail: (habit: Habit) => void;
}

export default function Home({ onOpenDetail }: HomeProps) {
  const { habits, completions, toggleCompletion } = useApp();
  const { toast, show: showToast, clear: clearToast } = useToast();
  const prevStreaks = useRef<Record<string, number>>({});

  const activeHabits = habits.filter(h => h.active);

  const handleToggle = useCallback(
    async (habitId: string) => {
      const prevStreak = prevStreaks.current[habitId] ?? 0;
      await toggleCompletion(habitId);

      // Check for milestone after toggle
      const newStreak = calculateCurrentStreak(completions, habitId);
      const milestone = isMilestone(newStreak);
      if (milestone && newStreak > prevStreak) {
        const habit = habits.find(h => h.id === habitId);
        showToast(`🔥 ${milestone}-day streak! Keep it up!`);
        prevStreaks.current[habitId] = newStreak;
      }
    },
    [toggleCompletion, completions, habits, showToast]
  );

  // Update prev streaks ref when completions change
  useEffect(() => {
    activeHabits.forEach(h => {
      prevStreaks.current[h.id] = calculateCurrentStreak(completions, h.id);
    });
  }, [completions, activeHabits]);

  return (
    <div className="page-content">
      <div className="page-inner">
        {toast && <Toast message={toast} onDone={clearToast} />}

        <header className="page-header">
          <h1 className="page-greeting">{getGreeting()}, Devansh 👋</h1>
          <p className="page-date">{getTodayDisplay()}</p>
          <p className="page-subtitle">Small progress every day.</p>
        </header>

        <ProgressCard
          activeHabits={activeHabits}
          completions={completions}
        />

        <div className="section-header">
          <span className="section-title">Your Habits</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            tap to complete
          </span>
        </div>

        {activeHabits.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✨</div>
            <div className="empty-state-title">No habits yet</div>
            <p className="empty-state-text">Go to Settings → Manage Habits to add your first habit.</p>
          </div>
        ) : (
          <div className="habit-list">
            {activeHabits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                completions={completions}
                onToggle={handleToggle}
                onOpenDetail={onOpenDetail}
              />
            ))}
          </div>
        )}

        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
