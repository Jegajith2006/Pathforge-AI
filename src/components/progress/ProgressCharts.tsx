import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import {
  mockWeeklyHoursChart,
  mockCourseCompletionChart,
  mockSkillRadarData,
} from '../../data/mockData';

// Custom dark theme tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0B0F19] border border-slate-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs">
        <p className="font-bold text-white mb-1.5">{label}</p>
        {payload.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center gap-2 text-slate-300">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: item.color || item.fill || item.stroke }}
            />
            <span className="capitalize">{item.name}:</span>
            <strong className="text-white">{item.value}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const WeeklyHoursChart: React.FC<{ data?: typeof mockWeeklyHoursChart }> = ({
  data = mockWeeklyHoursChart,
}) => {
  return (
    <div className="bg-[#151C2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white font-display">
            Weekly Learning Hours vs Target
          </h3>
          <p className="text-xs text-slate-400">Target benchmark: 15 hrs / week</p>
        </div>
        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
          +18% Above Target
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis
              dataKey="week"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="hours"
              name="Hours Logged"
              stroke="#6366F1"
              strokeWidth={3}
              dot={{ r: 4, fill: '#6366F1', stroke: '#151C2E', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#38BDF8' }}
            />
            <Line
              type="monotone"
              dataKey="target"
              name="Target Pace"
              stroke="#334155"
              strokeDasharray="4 4"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const CourseCompletionBarChart: React.FC<{
  data?: typeof mockCourseCompletionChart;
}> = ({ data = mockCourseCompletionChart }) => {
  return (
    <div className="bg-[#151C2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white font-display">
            Curriculum Domain Completion
          </h3>
          <p className="text-xs text-slate-400">Completed vs planned modules per domain</p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis
              dataKey="category"
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              interval={0}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="completed"
              name="Completed"
              fill="#10B981"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="total"
              name="Total Curated"
              fill="#334155"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const SkillRadarVisualizer: React.FC<{
  data?: typeof mockSkillRadarData;
}> = ({ data = mockSkillRadarData }) => {
  return (
    <div className="bg-[#151C2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-base font-bold text-white font-display">
            Competency Radar vs Role Benchmark
          </h3>
          <p className="text-xs text-slate-400">Current proficiency compared to target</p>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
            <PolarGrid stroke="#1E293B" />
            <PolarAngleAxis dataKey="subject" stroke="#94A3B8" fontSize={11} />
            <PolarRadiusAxis stroke="#475569" angle={30} domain={[0, 100]} />
            <Radar
              name="Current Level"
              dataKey="current"
              stroke="#6366F1"
              fill="#6366F1"
              fillOpacity={0.45}
            />
            <Radar
              name="Target Benchmark"
              dataKey="required"
              stroke="#06B6D4"
              fill="#06B6D4"
              fillOpacity={0.15}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
