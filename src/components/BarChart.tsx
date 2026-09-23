import React from 'react';
import type { Habit, Completion } from '../types';
import { getWeeklyChartData } from '../utils/streakEngine';
import { parseLocalDate } from '../utils/dateUtils';

interface BarChartProps {
  activeHabits: Habit[];
  completions: Completion[];
}

export default function BarChart({ activeHabits, completions }: BarChartProps) {
  const data = getWeeklyChartData(activeHabits, completions);

  const dayLabels = data.map(d => {
    const date = parseLocalDate(d.date);
    return date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1);
  });

  const maxBar = 64; // px

  return (
    <div aria-label="7-day completion chart" role="img">
      <div className="bar-chart">
        {data.map((d, i) => {
          const height = d.total === 0 ? 4 : Math.max(4, d.percentage * maxBar);
          const isFull = d.total > 0 && d.completed === d.total;
          return (
            <div
              key={d.date}
              className="bar-col"
              title={`${d.date}: ${d.completed}/${d.total}`}
            >
              <div
                className={`bar ${isFull ? 'full' : ''}`}
                style={{ height: `${height}px` }}
                aria-label={`${dayLabels[i]}: ${d.completed} of ${d.total} habits`}
              />
              <span className="bar-label">{dayLabels[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
