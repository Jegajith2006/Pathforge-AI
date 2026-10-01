import React, { useState } from 'react';
import { HeatmapDay } from '../../types';
import { Flame, Calendar, Info } from 'lucide-react';

interface LearningHeatmapProps {
  data: HeatmapDay[];
  currentStreak?: number;
}

export const LearningHeatmap: React.FC<LearningHeatmapProps> = ({
  data,
  currentStreak = 14,
}) => {
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);

  // Group days into columns of 7 (representing weeks)
  const weeks: HeatmapDay[][] = [];
  let currentWeek: HeatmapDay[] = [];

  data.forEach((day, index) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || index === data.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const getCellColor = (count: number) => {
    switch (count) {
      case 1:
        return 'bg-indigo-950/80 border-indigo-800/40 text-indigo-300';
      case 2:
        return 'bg-indigo-800/80 border-indigo-700/60 text-indigo-200';
      case 3:
        return 'bg-indigo-600 border-indigo-500 text-white';
      case 4:
        return 'bg-sky-400 border-cyan-300 text-slate-900 shadow-sm shadow-cyan-400/50';
      default:
        return 'bg-slate-900/60 border-slate-800/60';
    }
  };

  const dayLabels = ['Mon', 'Wed', 'Fri', 'Sun'];

  return (
    <div className="bg-[#151C2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display">
              Learning Activity & Velocity Heatmap
            </h3>
            <p className="text-xs text-slate-400">
              Daily study sessions, practice problem drills, and evidence commits over 18 weeks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 self-start sm:self-auto">
          <Flame className="w-4 h-4 fill-amber-400 text-amber-400 animate-bounce-slow" />
          <span className="text-xs font-bold">{currentStreak} Days Streak</span>
        </div>
      </div>

      {/* Grid Canvas */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[620px]">
          <div className="flex gap-1.5 items-start">
            {/* Day indicator column */}
            <div className="flex flex-col justify-between h-[116px] text-[10px] text-slate-400 pr-2 pt-1">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
              <span>Sun</span>
            </div>

            {/* Weeks Columns */}
            <div className="flex gap-1.5 flex-1">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1.5 flex-1">
                  {week.map((day) => (
                    <div
                      key={day.date}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`h-3.5 rounded-[4px] border cursor-pointer transition-all duration-150 hover:scale-125 ${getCellColor(
                        day.count
                      )}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend & Tooltip readout */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800/80 mt-4 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px]">Less</span>
          <span className="w-3 h-3 rounded-[3px] bg-slate-900 border border-slate-800" />
          <span className="w-3 h-3 rounded-[3px] bg-indigo-950 border border-indigo-800" />
          <span className="w-3 h-3 rounded-[3px] bg-indigo-700 border border-indigo-600" />
          <span className="w-3 h-3 rounded-[3px] bg-sky-400 border border-cyan-300" />
          <span className="text-[11px] ml-1">More (4+ hrs)</span>
        </div>

        {/* Dynamic hover state readout */}
        <div className="text-[11px] text-slate-300 h-5 flex items-center">
          {hoveredDay ? (
            <span className="font-medium text-indigo-300">
              📅 {hoveredDay.date}:{' '}
              <strong>{hoveredDay.hours} hours logged</strong> (
              {hoveredDay.activities.length > 0
                ? hoveredDay.activities[0]
                : 'Rest & review day'}
              )
            </span>
          ) : (
            <span className="text-slate-400">
              Hover over any square to view study session breakdown
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
