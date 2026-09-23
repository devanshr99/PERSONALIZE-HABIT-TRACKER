import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getHistoryDates, isCompletedOn } from '../utils/streakEngine';
import { formatDateShort, today } from '../utils/dateUtils';

export default function History() {
  const { habits, completions, setCompletion } = useApp();
  const [expanded, setExpanded] = useState<string | null>(null);

  const historyDates = getHistoryDates(completions, habits);

  const toggleExpand = (date: string) => {
    setExpanded(exp => exp === date ? null : date);
  };

  if (historyDates.length === 0) {
    return (
      <div className="page-content">
        <div className="page-inner">
          <div className="page-header">
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>History</h1>
          </div>
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <div className="empty-state-title">No history yet</div>
            <p className="empty-state-text">Complete habits to see your history here.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-inner">
        <div className="page-header">
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>History</h1>
        </div>

        {historyDates.map(date => {
          // Include active habits created by this date + any inactive habit that was completed on this date
          const dateHabits = habits.filter(
            h => (h.active && h.createdAt.slice(0, 10) <= date) ||
                 (!h.active && isCompletedOn(completions, h.id, date))
          );
          const completedCount = dateHabits.filter(h =>
            isCompletedOn(completions, h.id, date)
          ).length;
          const total = dateHabits.length;
          const allDone = total > 0 && completedCount === total;
          const isToday = date === today();
          const isOpen = expanded === date;

          return (
            <div key={date} className="history-day">
              <div
                className="history-day-header"
                onClick={() => toggleExpand(date)}
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                aria-controls={`history-${date}`}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleExpand(date);
                  }
                }}
              >
                <div>
                  <div className="history-day-date">
                    {isToday ? 'Today' : formatDateShort(date)}
                  </div>
                  <div className="history-day-summary">
                    {completedCount} / {total} completed
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {allDone && (
                    <span className="history-day-badge">✓ All done</span>
                  )}
                  <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                    {isOpen ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {isOpen && (
                <div
                  id={`history-${date}`}
                  className="history-day-body"
                >
                  {dateHabits.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>
                      No habits active on this day
                    </p>
                  ) : (
                    dateHabits.map(habit => {
                      const done = isCompletedOn(completions, habit.id, date);
                      return (
                        <div key={habit.id} className="history-habit-row">
                          <div className="history-habit-left">
                            <span className="history-habit-icon">{habit.icon}</span>
                            <span className="history-habit-name">{habit.name}</span>
                          </div>
                          <button
                            className={`history-habit-toggle ${done ? 'done' : ''}`}
                            onClick={() => setCompletion(habit.id, date, !done)}
                            aria-label={`${done ? 'Unmark' : 'Mark'} ${habit.name} as completed on ${date}`}
                            aria-pressed={done}
                            id={`history-toggle-${habit.id}-${date}`}
                          >
                            {done ? '✓' : ''}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
