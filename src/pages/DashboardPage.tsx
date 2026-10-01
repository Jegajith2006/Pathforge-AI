import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatCard } from '../components/common/StatCard';
import { PageHeader } from '../components/common/PageHeader';
import { CareerGoalCard } from '../components/dashboard/CareerGoalCard';
import { CareerReadinessRing } from '../components/dashboard/CareerReadinessRing';
import { SkillProgressBar } from '../components/common/SkillProgressBar';
import {
  Sparkles,
  BookOpen,
  Briefcase,
  Award,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  PlusCircle,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  // Recommended next actions with interactive toggle state
  const [tasks, setTasks] = useState([
    {
      id: 'task_1',
      title: 'Complete SQL Intermediate course (Window Functions)',
      tag: 'Missing Competency',
      tagColor: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
      actionUrl: '/app/courses',
      completed: false,
    },
    {
      id: 'task_2',
      title: 'Build Sales Performance Dashboard in Tableau',
      tag: 'Portfolio Project',
      tagColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
      actionUrl: '/app/projects',
      completed: false,
    },
    {
      id: 'task_3',
      title: 'Upload GitHub repo for Evidence Vault verification',
      tag: 'Proof of Mastery',
      tagColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      actionUrl: '/app/evidence',
      completed: true,
    },
    {
      id: 'task_4',
      title: 'Submit customer segmentation project for mentor review',
      tag: 'Mentor Review',
      tagColor: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      actionUrl: '/app/mentor',
      completed: true,
    },
  ]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextState = !t.completed;
          if (nextState) {
            addToast('Task Completed', `"${t.title}" checked off your sprint.`, 'success');
          }
          return { ...t, completed: nextState };
        }
        return t;
      })
    );
  };

  const handleAddToRoadmap = (skillName: string) => {
    addToast(
      'Added to Roadmap',
      `"${skillName}" added to next sprint milestones.`,
      'success'
    );
  };

  const topSkillGaps = [
    { name: 'SQL & Window Functions', priority: 'High', current: 35, required: 90, status: 'missing' as const },
    { name: 'Tableau & PowerBI', priority: 'High', current: 40, required: 85, status: 'missing' as const },
    { name: 'Data Warehousing & Modeling', priority: 'Medium', current: 55, required: 80, status: 'developing' as const },
    { name: 'Statistical Hypothesis Testing', priority: 'Medium', current: 65, required: 85, status: 'developing' as const },
  ];

  const recentTimeline = [
    {
      title: 'Course Module Finished',
      desc: 'Advanced Pandas & Data Wrangling (Coursera)',
      time: 'Today at 2:15 PM',
      icon: BookOpen,
      iconColor: 'text-indigo-400 bg-indigo-500/10',
    },
    {
      title: 'Evidence Item Verified',
      desc: 'E-Commerce Churn Analysis repository verified with 92% benchmark score',
      time: 'Yesterday',
      icon: Award,
      iconColor: 'text-emerald-400 bg-emerald-500/10',
    },
    {
      title: 'Mentor Feedback Received',
      desc: 'Sarah Chen logged 5★ review on Exploratory Data Analysis project',
      time: '2 days ago',
      icon: Sparkles,
      iconColor: 'text-sky-400 bg-sky-500/10',
    },
    {
      title: 'Readiness Index Updated',
      desc: 'Overall Career Readiness jumped from 64% → 69%',
      time: '3 days ago',
      icon: TrendingUp,
      iconColor: 'text-amber-400 bg-amber-500/10',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title={`AI Career Command Center`}
        subtitle="Explainable machine-learning skill intelligence and real-time career readiness analytics."
        badge="Live Telemetry"
        actions={
          <Link
            to="/app/roadmap"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-950/50 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Resume Active Sprint
          </Link>
        }
      />

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Skills Tracked"
          value={user?.stats?.skillsTracked ?? 12}
          change="+3 this month"
          trend="up"
          icon={Sparkles}
          accentColor="indigo"
        />
        <StatCard
          label="Courses in Progress"
          value={user?.stats?.coursesInProgress ?? 3}
          change="1 completed recently"
          trend="neutral"
          icon={BookOpen}
          accentColor="sky"
        />
        <StatCard
          label="Projects Completed"
          value={user?.stats?.projectsCompleted ?? user?.completedProjects ?? 5}
          change="+2 in Evidence Vault"
          trend="up"
          icon={Briefcase}
          accentColor="emerald"
        />
        <StatCard
          label="Career Readiness Score"
          value={`${user?.readinessScore ?? user?.overallReadiness ?? 69}%`}
          change="+5% since last review"
          trend="up"
          icon={Award}
          accentColor="amber"
        />
      </div>

      {/* Core Split: Career Goal & Readiness Ring */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 flex flex-col justify-between">
          <CareerGoalCard />
        </div>
        <div className="lg:col-span-5 flex flex-col justify-between">
          <CareerReadinessRing
            score={user?.readinessScore ?? user?.overallReadiness ?? 69}
            skillMatch={70}
            learningProgress={60}
            practicalEvidence={80}
            targetRole={user?.targetCareer || 'Data Analyst'}
          />
        </div>
      </div>

      {/* Secondary Split: Top Skill Gaps & Recommended Next Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Skill Gaps */}
        <div className="lg:col-span-6 bg-[#151C2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Top Priority Skill Gaps
              </h3>
              <p className="text-xs text-slate-400">
                Critical missing competencies blocking your Tier-1 target readiness
              </p>
            </div>
            <Link
              to="/app/skills"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              Full Matrix <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-4 pt-1">
            {topSkillGaps.map((sg) => (
              <div
                key={sg.name}
                className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{sg.name}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        sg.priority === 'High'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {sg.priority} Priority
                    </span>
                  </div>
                  <button
                    onClick={() => handleAddToRoadmap(sg.name)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Add to roadmap
                  </button>
                </div>

                <SkillProgressBar
                  label=""
                  currentLevel={sg.current}
                  requiredLevel={sg.required}
                  status={sg.status}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Next Actions Checklist */}
        <div className="lg:col-span-6 bg-[#151C2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Recommended Next Actions
              </h3>
              <p className="text-xs text-slate-400">
                AI-synthesized priority tasks to raise your score toward 80%+
              </p>
            </div>
            <span className="text-xs text-emerald-400 font-bold">
              {tasks.filter((t) => t.completed).length}/{tasks.length} Completed
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                  task.completed
                    ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    className="mt-1 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <span
                      className={`text-xs font-semibold block ${
                        task.completed ? 'line-through text-slate-500' : 'text-slate-200'
                      }`}
                    >
                      {task.title}
                    </span>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${task.tagColor}`}
                    >
                      {task.tag}
                    </span>
                  </div>
                </div>

                <Link
                  to={task.actionUrl}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors shrink-0 flex items-center gap-1"
                >
                  Start
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Learning Activity Timeline */}
      <div className="bg-[#151C2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Recent Intelligence & Telemetry Activity
              </h3>
              <p className="text-xs text-slate-400">
                Audited stream of milestone events, model recalculations, and evidence verifications
              </p>
            </div>
          </div>

          <Link
            to="/app/progress"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            View Progress Charts <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentTimeline.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${item.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">{item.time}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1 font-display">{item.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
