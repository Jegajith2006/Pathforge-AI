import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Clock, BookOpen, FolderGit2, Flame, TrendingUp, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { mockDashboardProgress } from '../../data/mockData';

export const ProgressOverview = () => {
  const navigate = useNavigate();
  const { theme } = useApp();
  const isDark = theme === 'dark';

  const weeklyHours = mockDashboardProgress.weeklyHours || 8.5;
  const completedCourses = mockDashboardProgress.completedCourses || 6;
  const completedProjects = mockDashboardProgress.completedProjects || 3;
  const learningStreak = mockDashboardProgress.learningStreak || 12;
  const chartData = mockDashboardProgress.chartData || [];

  // Theme-aware styles for recharts
  const axisColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)';

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-lg text-xs">
          <p className="font-bold text-[var(--text-primary)] font-mono mb-1">{label} Telemetry</p>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
            <span>Study Time:</span>
            <span className="font-mono text-sm">{data.hours} hrs</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-muted)] mt-0.5">
            <span>Daily Target:</span>
            <span className="font-mono">{data.target} hrs</span>
          </div>
          {data.completed > 0 && (
            <div className="mt-1.5 pt-1.5 border-t border-[var(--border)] text-emerald-600 dark:text-emerald-400 font-medium">
              ✓ {data.completed} module{data.completed > 1 ? 's' : ''} completed
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-sm hover:border-indigo-500/30 transition-all duration-200">
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-mono">
                Study Velocity
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] font-display leading-tight">
                Progress Overview
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/progress')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors self-start sm:self-center cursor-pointer"
          >
            <span>View Full Analytics</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Core Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
            <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-cyan-500" />
              Weekly Study
            </span>
            <p className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] font-mono mt-1">
              {weeklyHours} <span className="text-xs font-normal text-[var(--text-muted)]">hrs</span>
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              +12% vs last week
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
            <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 font-medium">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              Courses
            </span>
            <p className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] font-mono mt-1">
              {completedCourses} <span className="text-xs font-normal text-[var(--text-muted)]">done</span>
            </p>
            <span className="text-[10px] text-[var(--text-muted)]">2 in progress</span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
            <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 font-medium">
              <FolderGit2 className="w-3.5 h-3.5 text-violet-500" />
              Projects
            </span>
            <p className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] font-mono mt-1">
              {completedProjects} <span className="text-xs font-normal text-[var(--text-muted)]">verified</span>
            </p>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">1 in review</span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
            <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 font-medium">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Active Streak
            </span>
            <p className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] font-mono mt-1">
              {learningStreak} <span className="text-xs font-normal text-[var(--text-muted)]">days</span>
            </p>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Top 5% streak</span>
          </div>
        </div>

        {/* Recharts Bar Chart Container */}
        <div className="p-3 rounded-xl bg-[var(--surface-secondary)]/60 border border-[var(--border)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-medium mb-2 px-1">
            <span>Daily Study Hours (Current Week)</span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-indigo-500" />
                Actual
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-[var(--border)]" />
                Target (2h)
              </span>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: axisColor, fontSize: 11, fontFamily: 'JetBrains Mono' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: axisColor, fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  domain={[0, 4]}
                  ticks={[0, 1, 2, 3, 4]}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }} />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.hours >= 2.0 ? '#6366f1' : entry.hours > 0 ? '#818cf8' : isDark ? '#1e293b' : '#cbd5e1'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Footer link */}
      <div className="pt-4 flex justify-between items-center text-xs text-[var(--text-muted)]">
        <span>Target: 12.0 hours / week</span>
        <button
          type="button"
          onClick={() => navigate('/progress')}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
        >
          View detailed breakdown →
        </button>
      </div>
    </div>
  );
};

export default ProgressOverview;
