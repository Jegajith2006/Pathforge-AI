import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Target, Calendar, Award } from 'lucide-react';
import { Badge } from '../common/Badge';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-3.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] shadow-xl shadow-slate-900/15 dark:shadow-slate-950/60 text-xs space-y-1.5 min-w-[150px]">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-1">
          <span className="font-semibold text-[var(--text-primary)]">
            {data.label || label}
          </span>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">2026</span>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[var(--text-secondary)]">Composite Readiness:</span>
          <span className="text-sm font-bold font-mono text-indigo-500 dark:text-indigo-400">
            {data.score}%
          </span>
        </div>
        <p className="text-[10px] text-[var(--text-muted)] pt-0.5">
          {data.score >= 80
            ? 'Senior hiring benchmark'
            : data.score >= 60
            ? 'Associate ML hiring bar'
            : 'Early foundational phase'}
        </p>
      </div>
    );
  }
  return null;
};

export const ReadinessTrendChart = ({ trendData = [] }) => {
  const milestones = [
    { month: 'Jan', event: 'Initial diagnostic assessment (42%)' },
    { month: 'Mar', event: 'Completed Churn XGBoost Model' },
    { month: 'May', event: 'Staff PR review on Fraud Pipeline' },
    { month: 'Jun', event: 'Achieved 68% Associate Engineering threshold' },
  ];

  return (
    <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--border)] shadow-sm shadow-slate-900/5 dark:shadow-slate-950/40 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold font-display text-[var(--text-primary)]">
              Readiness Score Velocity & Trajectory
            </h3>
            <Badge variant="indigo" size="sm" className="font-mono text-[10px]">
              +26 pts in 6 mo
            </Badge>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Historical 6-month trajectory showing progression toward the 80% Senior Hiring Bar.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
            <span className="text-[var(--text-secondary)]">Your Score</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 border-t-2 border-dashed border-emerald-500 shrink-0" />
            <span className="text-[var(--text-secondary)]">Target (80%)</span>
          </div>
        </div>
      </div>

      {/* Recharts Area Container */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={trendData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="readinessGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--border)"
              opacity={0.6}
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            />
            <YAxis
              domain={[30, 100]}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              unit="%"
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Target 80% Benchmark Line */}
            <ReferenceLine
              y={80}
              stroke="#10b981"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'Target Bar: 80%',
                position: 'insideTopRight',
                fill: '#10b981',
                fontSize: 11,
                fontWeight: 600,
              }}
            />
            {/* Baseline 60% Bar Line */}
            <ReferenceLine
              y={60}
              stroke="#06b6d4"
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{
                value: 'Associate Bar: 60%',
                position: 'insideBottomRight',
                fill: '#06b6d4',
                fontSize: 10,
              }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#6366f1"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#readinessGradient)"
              activeDot={{ r: 6, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Historical Milestones Tracker row */}
      <div className="pt-3 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
        {milestones.map((m, i) => (
          <div
            key={i}
            className="p-2.5 rounded-xl bg-[var(--surface-secondary)]/50 border border-[var(--border)] flex items-start gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
            <div>
              <span className="font-mono text-[10px] text-indigo-500 dark:text-indigo-400 uppercase font-bold block">
                {m.month} Milestone
              </span>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-snug">
                {m.event}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
