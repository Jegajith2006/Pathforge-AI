import React, { useState } from 'react';
import { Calendar, Info, Flame, Check } from 'lucide-react';
import { mockConsistencyHeatmap } from '../../data/mockData';

const LEVEL_LABELS = {
  0: 'No activity',
  1: 'Low activity (0.5 - 1.0 hr)',
  2: 'Medium activity (1.5 - 2.5 hrs)',
  3: 'High activity (3.0 - 4.0 hrs)',
  4: 'Very high activity (4.5+ hrs)',
};

export const LearningHeatmap = () => {
  const [hoveredCell, setHoveredCell] = useState(null);

  // Group into weeks (columns of 7)
  const heatmapData = mockConsistencyHeatmap;
  const weeks = [];
  let currentWeek = [];

  heatmapData.forEach((day, index) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || index === heatmapData.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const getCellClasses = (level) => {
    switch (level) {
      case 1:
        return 'bg-indigo-200/90 dark:bg-indigo-950/90 border-indigo-300 dark:border-indigo-800/80';
      case 2:
        return 'bg-indigo-400 dark:bg-indigo-800 border-indigo-400 dark:border-indigo-700';
      case 3:
        return 'bg-indigo-600 dark:bg-indigo-600 border-indigo-500 dark:border-indigo-500 shadow-sm';
      case 4:
        return 'bg-cyan-400 dark:bg-cyan-400 border-cyan-300 dark:border-cyan-300 shadow-sm shadow-cyan-500/30';
      default:
        return 'bg-slate-100 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800/80';
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-[var(--text-primary)]">
              Consistency Map
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Continuous study, code commits, and verification drills over the past 16 weeks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Flame className="w-3.5 h-3.5" />
            7-Day Streak Active
          </span>
        </div>
      </div>

      {/* Heatmap Grid inside isolated horizontal scroll container for mobile */}
      <div className="w-full overflow-x-auto custom-scrollbar pb-2 pt-1">
        <div className="min-w-[680px] flex gap-3">
          {/* Day of week labels */}
          <div className="flex flex-col justify-between pt-5 pb-1 text-[10px] font-mono text-[var(--text-muted)] select-none">
            <span>Sun</span>
            <span>Tue</span>
            <span>Thu</span>
            <span>Sat</span>
          </div>

          {/* Weeks Columns */}
          <div className="flex-1">
            {/* Months indicators row */}
            <div className="flex justify-between text-[11px] font-mono text-[var(--text-muted)] mb-1 px-1">
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
              <span>Aug</span>
              <span>Sep (Now)</span>
            </div>

            <div className="flex gap-1.5">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1.5">
                  {week.map((day, dIdx) => (
                    <button
                      key={day.date || `${wIdx}-${dIdx}`}
                      type="button"
                      onMouseEnter={() => setHoveredCell(day)}
                      onMouseLeave={() => setHoveredCell(null)}
                      onFocus={() => setHoveredCell(day)}
                      onBlur={() => setHoveredCell(null)}
                      aria-label={`${day.displayDate}: ${LEVEL_LABELS[day.level]}, ${day.hours} hours logged`}
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[4px] border transition-transform duration-150 hover:scale-125 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${getCellClasses(
                        day.level
                      )}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hover Info Banner or Default Guidance */}
      <div className="min-h-[44px] flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs">
        {hoveredCell ? (
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[var(--text-primary)]">
              {hoveredCell.displayDate}
            </span>
            <span className="text-[var(--text-muted)]">•</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
              {hoveredCell.hours} hrs logged
            </span>
            <span className="text-[var(--text-muted)]">•</span>
            <span className="text-[var(--text-secondary)]">
              {hoveredCell.activities.length > 0
                ? hoveredCell.activities.join(', ')
                : 'Rest day / No active sessions'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Hover or focus on any date cell to inspect hours logged and verified achievements.</span>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <span className="text-[11px] text-[var(--text-muted)]">Less</span>
          <div className="flex items-center gap-1" aria-label="Activity intensity scale">
            {[0, 1, 2, 3, 4].map((level) => (
              <span
                key={level}
                title={LEVEL_LABELS[level]}
                className={`w-3 h-3 rounded-[3px] border ${getCellClasses(level)}`}
              />
            ))}
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">More</span>
        </div>
      </div>
    </div>
  );
};

export default LearningHeatmap;
