import React from 'react';
import { useApp } from '../context/AppContext';
import BarChart from '../components/BarChart';
import { calculateOverallStats, getHabitStats } from '../utils/streakEngine';

export default function Stats() {
  const { habits, completions } = useApp();
  const activeHabits = habits.filter(h => h.active);
  const overall = calculateOverallStats(activeHabits, completions);

  return (
    <div className="page-content">
      <div className="page-inner">
        <div className="page-header">
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Statistics</h1>
        </div>

        {/* Overall Streaks */}
        <div className="stats-grid" style={{ marginBottom: 16 }}>
          <div className="stat-card">
            <div className="stat-value stat-accent">🔥 {overall.currentStreak}</div>
            <div className="stat-label">Overall streak</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">🏆 {overall.longestStreak}</div>
            <div className="stat-label">Best overall</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {overall.todayCompleted}/{overall.todayTotal}
            </div>
            <div className="stat-label">Today</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{overall.totalCompletions}</div>
            <div className="stat-label">Total completions</div>
          </div>
        </div>

        {/* Consistency */}
        <div className="card card-padded" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>
                {Math.round(overall.weekConsistency * 100)}%
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>This week</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                {Math.round(overall.monthConsistency * 100)}%
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>This month</div>
            </div>
          </div>
          <div className="section-title" style={{ marginBottom: 12 }}>Last 7 days</div>
          <BarChart activeHabits={activeHabits} completions={completions} />
        </div>

        {/* Per-habit stats */}
        <div className="section-header">
          <span className="section-title">Per Habit</span>
        </div>

        {activeHabits.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">No habits yet</div>
            <p className="empty-state-text">Add habits to see statistics here.</p>
          </div>
        ) : (
          <div className="card" style={{ marginBottom: 16, overflow: 'hidden' }}>
            {activeHabits.map(habit => {
              const stats = getHabitStats(habit, completions);
              return (
                <div key={habit.id} className="habit-stat-row">
                  <div className="habit-stat-icon">{habit.icon}</div>
                  <div className="habit-stat-info">
                    <div className="habit-stat-name">{habit.name}</div>
                    <div className="habit-stat-sub">
                      {stats.totalCompleted} total · {Math.round(stats.completionRate * 100)}% consistency
                    </div>
                  </div>
                  <div className="habit-stat-right">
                    <div className="habit-stat-streak">🔥 {stats.currentStreak}</div>
                    <div className="habit-stat-best">best {stats.longestStreak}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
