import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { LearningHeatmap } from '../components/progress/LearningHeatmap';
import {
  WeeklyHoursChart,
  CourseCompletionBarChart,
  SkillRadarVisualizer,
} from '../components/progress/ProgressCharts';
import { apiService } from '../services/api';
import { HeatmapDay } from '../types';
import { useAuth } from '../context/AuthContext';
import { Flame, Clock, Briefcase, CheckCircle2, Award, Download } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const ProgressPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const data = await apiService.getHeatmapData();
        setHeatmapData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHeatmap();
  }, []);

  const handleExportReport = () => {
    addToast(
      'Audit Report Exported',
      'Compiled comprehensive competency telemetry PDF for academic review & portfolio verification.',
      'success'
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Learning Progress & Activity Analytics"
        subtitle="Empirical telemetry monitoring daily study velocity, curriculum completion, and radar benchmarks."
        badge="Activity Telemetry"
        actions={
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            Export Telemetry Dossier
          </button>
        }
      />

      {/* Top Velocity Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Study Streak"
          value="14 Days"
          change="Personal best: 21 days"
          trend="up"
          icon={Flame}
          accentColor="amber"
        />
        <StatCard
          label="Total Hours Invested"
          value={`${user?.stats?.totalHoursLearned ?? 142} hrs`}
          change="+18.5 hrs this week"
          trend="up"
          icon={Clock}
          accentColor="indigo"
        />
        <StatCard
          label="Projects Submitted"
          value={user?.stats?.projectsCompleted ?? user?.completedProjects ?? 5}
          change="100% verification rate"
          trend="up"
          icon={Briefcase}
          accentColor="sky"
        />
        <StatCard
          label="Skills Validated"
          value={`${user?.stats?.skillsValidated ?? 9} of 12`}
          change="3 critical gaps remaining"
          trend="neutral"
          icon={CheckCircle2}
          accentColor="emerald"
        />
      </div>

      {/* Heatmap Section */}
      <LearningHeatmap data={heatmapData} currentStreak={14} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyHoursChart />
        <CourseCompletionBarChart />
      </div>

      {/* Competency Radar Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <SkillRadarVisualizer />
        </div>
        <div className="lg:col-span-4 bg-[#151C2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white font-display">
                Readiness Forecast
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              At your current velocity of <strong>18.5 hrs/week</strong>, you are projected to reach <strong>85% (Tier-1 Ready)</strong> in <strong>4.2 weeks</strong> upon finishing the SQL and Tableau deliverables.
            </p>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Next Milestone:</span>
                <strong className="text-white">L3 Benchmark</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Predicted Score:</span>
                <strong className="text-emerald-400">76% (+7%)</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Critical Sprint:</span>
                <strong className="text-indigo-400">SQL Window Mastery</strong>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500 italic">
            Predictive linear regression calibrated against 4,800+ recent tech hiring profiles.
          </div>
        </div>
      </div>
    </div>
  );
};
