import React from 'react';
import { useApp } from '../context/AppContext';
import CalendarView from '../components/CalendarView';
import { getHabitStats } from '../utils/streakEngine';
import { getCompletionsInRange } from '../utils/streakEngine';
import { daysAgo, today } from '../utils/dateUtils';
import type { Habit } from '../types';

interface HabitDetailProps {
  habit: Habit;
  onBack: () => void;
}

export default function HabitDetail({ habit, onBack }: HabitDetailProps) {
  const { completions } = useApp();
  const stats = getHabitStats(habit, completions);

  const now = new Date();
  const thisMonth = getCompletionsInRange(
    completions,
    habit.id,
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
    today()
  );
  const daysThisMonth = now.getDate();

  return (
    <div className="page-content">
      <div className="page-inner">
        <button
          className="back-btn"
          onClick={onBack}
          aria-label="Go back"
          id="detail-back-btn"
        >
          ‹ Back
        </button>

        <div className="detail-header">
          <div className="detail-icon-wrap" aria-hidden="true">{habit.icon}</div>
          <div>
            <h1 className="detail-title">{habit.name}</h1>
            {!habit.active && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Inactive
              </span>
            )}
          </div>
        </div>

        <div className="detail-stats-row">
          <div className="detail-stat-card">
            <div className="detail-stat-value">
              🔥 {stats.currentStreak}
            </div>
            <div className="detail-stat-label">Current streak</div>
          </div>
          <div className="detail-stat-card">
            <div className="detail-stat-value">
              🏆 {stats.longestStreak}
            </div>
            <div className="detail-stat-label">Best streak</div>
          </div>
          <div className="detail-stat-card">
            <div className="detail-stat-value">
              ✓ {stats.totalCompleted}
            </div>
            <div className="detail-stat-label">Total completed</div>
          </div>
          <div className="detail-stat-card">
            <div className="detail-stat-value">
              {Math.round(stats.completionRate * 100)}%
            </div>
            <div className="detail-stat-label">Consistency</div>
          </div>
        </div>

        <div
          className="card card-padded"
          style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>This month</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{thisMonth} / {daysThisMonth} days</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>Completion rate</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>
              {daysThisMonth > 0 ? Math.round((thisMonth / daysThisMonth) * 100) : 0}%
            </div>
          </div>
        </div>

        <div className="section-header">
          <span className="section-title">Completion History</span>
        </div>

        <CalendarView
          completions={completions}
          habitId={habit.id}
          habitCreatedAt={habit.createdAt}
        />

        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}
