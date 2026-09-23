import React, { useState } from 'react';
import type { Completion } from '../types';
import {
  daysInMonth,
  firstDayOfMonth,
  formatMonthYear,
  today,
  toLocalDateString
} from '../utils/dateUtils';

interface CalendarViewProps {
  completions: Completion[];
  habitId: string;
  habitCreatedAt?: string;
  /** Initial year, defaults to current */
  initialYear?: number;
  /** Initial month (1-indexed), defaults to current */
  initialMonth?: number;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function CalendarView({
  completions,
  habitId,
  habitCreatedAt,
  initialYear,
  initialMonth
}: CalendarViewProps) {
  const now = new Date();
  const [year, setYear] = useState(initialYear ?? now.getFullYear());
  const [month, setMonth] = useState(initialMonth ?? now.getMonth() + 1);

  const todayStr = today();
  const daysCount = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month); // 0=Sun

  // Build a set of completed dates for quick lookup
  const completedSet = new Set(
    completions
      .filter(c => c.habitId === habitId && c.completed)
      .map(c => c.date)
  );

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    const n = new Date();
    const currentYM = `${year}-${String(month).padStart(2, '0')}`;
    const nowYM = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
    if (currentYM >= nowYM) return; // Can't go to future months
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const isCurrentMonth = () => {
    const n = new Date();
    return year === n.getFullYear() && month === n.getMonth() + 1;
  };

  const days: Array<{ date: string | null; dayNum: number | null }> = [];

  // Empty slots before first day
  for (let i = 0; i < firstDay; i++) {
    days.push({ date: null, dayNum: null });
  }

  for (let d = 1; d <= daysCount; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ date: dateStr, dayNum: d });
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button
          className="calendar-nav-btn"
          onClick={prevMonth}
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="calendar-month-title">{formatMonthYear(year, month)}</span>
        <button
          className="calendar-nav-btn"
          onClick={nextMonth}
          aria-label="Next month"
          disabled={isCurrentMonth()}
          style={{ opacity: isCurrentMonth() ? 0.3 : 1 }}
        >
          ›
        </button>
      </div>

      <div className="calendar-grid">
        <div className="calendar-weekdays" aria-hidden="true">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="calendar-weekday">{d}</div>
          ))}
        </div>

        <div className="calendar-days" role="grid" aria-label={`${formatMonthYear(year, month)} calendar`}>
          {days.map((day, i) => {
            if (!day.date || !day.dayNum) {
              return <div key={`empty-${i}`} className="calendar-day empty" role="gridcell" aria-hidden="true" />;
            }

            const isToday = day.date === todayStr;
            const isFuture = day.date > todayStr;
            const isCompleted = completedSet.has(day.date);
            const isBeforeCreation = habitCreatedAt ? day.date < habitCreatedAt.slice(0, 10) : false;

            let className = 'calendar-day';
            if (isFuture) className += ' future';
            else if (isCompleted) className += ' completed';
            else if (isBeforeCreation) className += ' before-creation';
            else className += ' missed';
            if (isToday) className += ' today';

            return (
              <div
                key={day.date}
                className={className}
                role="gridcell"
                aria-label={`${day.date}: ${isCompleted ? 'completed' : isFuture ? 'upcoming' : 'missed'}`}
              >
                {day.dayNum}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
