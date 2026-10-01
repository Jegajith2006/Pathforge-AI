import React, { useState } from 'react';
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
import { useApp } from '../../context/AppContext';
import { Clock, CheckSquare, FolderGit2 } from 'lucide-react';
import { mockWeeklyLearningHoursData } from '../../data/mockData';

const METRIC_CONFIG = {
  hours: {
    label: 'Learning Hours',
    key: 'hours',
    unit: 'hrs',
    icon: Clock,
    barColor: '#6366f1',
    hoverColor: '#4f46e5',
    yDomain: [0, 5],
  },
  completedTasks: {
    label: 'Completed Tasks',
    key: 'completedTasks',
    unit: 'tasks',
    icon: CheckSquare,
    barColor: '#06b6d4',
    hoverColor: '#0891b2',
    yDomain: [0, 10],
  },
  projectActivity: {
    label: 'Project Activity',
    key: 'projectActivity',
    unit: 'commits/runs',
    icon: FolderGit2,
    barColor: '#10b981',
    hoverColor: '#059669',
    yDomain: [0, 8],
  },
};

export const ProgressChart = () => {
  const { theme } = useApp();
  const [activeMetric, setActiveMetric] = useState('hours');
  const isDark = theme === 'dark';

  const config = METRIC_CONFIG[activeMetric];
  const chartData = mockWeeklyLearningHoursData;

  const totalCurrentMetric = chartData.reduce((acc, cur) => acc + (cur[config.key] || 0), 0);
  const avgCurrentMetric = (totalCurrentMetric / chartData.length).toFixed(1);

  // Custom theme-aware tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] shadow-xl text-xs space-y-1 z-50">
          <p className="font-bold text-[var(--text-primary)]">{dataPoint.day}</p>
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: config.barColor }}
            />
            <span className="text-[var(--text-secondary)]">{config.label}:</span>
            <span className="font-mono font-bold text-[var(--text-primary)]">
              {dataPoint[config.key]} {config.unit}
            </span>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border)]">
            Tasks: {dataPoint.completedTasks} • Projects: {dataPoint.projectActivity} commits
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold font-display text-[var(--text-primary)]">
            Learning Activity
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Weekly velocity across study hours, task completions, and project development.
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div
          className="inline-flex p-1 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] self-start sm:self-auto"
          role="tablist"
          aria-label="Activity metric selector"
        >
          {Object.entries(METRIC_CONFIG).map(([key, item]) => {
            const isActive = activeMetric === key;
            const Icon = item.icon;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveMetric(key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI mini-bar */}
      <div className="flex items-center gap-6 py-2 px-3 rounded-xl bg-[var(--surface-secondary)]/60 border border-[var(--border)] text-xs">
        <div>
          <span className="text-[var(--text-muted)]">Weekly Total: </span>
          <span className="font-bold text-[var(--text-primary)] font-mono">
            {totalCurrentMetric} {config.unit}
          </span>
        </div>
        <div className="h-3 w-px bg-[var(--border)]" />
        <div>
          <span className="text-[var(--text-muted)]">Daily Average: </span>
          <span className="font-bold text-[var(--text-primary)] font-mono">
            {avgCurrentMetric} {config.unit}/day
          </span>
        </div>
        <div className="h-3 w-px bg-[var(--border)]" />
        <div>
          <span className="text-[var(--text-muted)]">Peak Day: </span>
          <span className="font-bold text-indigo-500 dark:text-indigo-400 font-mono">
            Saturday (4.0 hrs)
          </span>
        </div>
      </div>

      {/* Responsive Recharts Bar Chart */}
      <div className="w-full h-64 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}
            />
            <XAxis
              dataKey="shortDay"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: isDark ? '#94a3b8' : '#64748b',
                fontSize: 12,
                fontWeight: 500,
              }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              domain={config.yDomain}
              tick={{
                fill: isDark ? '#94a3b8' : '#64748b',
                fontSize: 12,
              }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                fill: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                radius: 8,
              }}
            />
            <Bar
              dataKey={config.key}
              radius={[6, 6, 2, 2]}
              fill={config.barColor}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.hours === 4.0 && activeMetric === 'hours' ? '#818cf8' : config.barColor}
                  className="transition-all duration-300 hover:opacity-85"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
        <span>Sprint Target: 8.0 hrs/wk</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
          14.5 hours logged this week (Exceeding Goal)
        </span>
      </div>
    </div>
  );
};

export default ProgressChart;
