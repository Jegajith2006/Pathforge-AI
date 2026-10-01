import React, { useState } from 'react';
import { Target, Sparkles, Edit3, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';

export const CareerGoalCard: React.FC = () => {
  const { user, updateCareerGoal } = useAuth();
  const { addToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user?.targetCareer || 'Data Analyst');

  const careerOptions = [
    {
      role: 'Data Analyst',
      desc: 'Synthesizing complex enterprise data into actionable visual insights, predictive KPI forecasts, and executive dashboards.',
      readiness: '69%',
    },
    {
      role: 'Machine Learning Engineer',
      desc: 'Deploying end-to-end ML inference pipelines, feature stores, and continuous model monitoring in production clouds.',
      readiness: '48%',
    },
    {
      role: 'Analytics Engineer',
      desc: 'Designing modular data models in dbt, star-schema data marts, and automated CI/CD schema testing.',
      readiness: '62%',
    },
    {
      role: 'Business Intelligence Architect',
      desc: 'Architecting executive BI reporting layers, semantic data cubes, and self-service analytics frameworks.',
      readiness: '65%',
    },
  ];

  const handleSave = () => {
    updateCareerGoal(selectedRole);
    setIsModalOpen(false);
    addToast('Career Goal Updated', `Target career changed to ${selectedRole}. Skill gap metrics recalculated.`, 'success');
  };

  return (
    <>
      <div className="relative overflow-hidden bg-[#151C2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        {/* Glow ambient accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Target Career Goal
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active Focus
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1 font-display tracking-tight">
                {user?.targetCareer || 'Data Analyst'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
                {user?.careerDescription ||
                  'Synthesizing complex enterprise data into actionable visual insights, predictive KPI forecasts, and executive dashboards.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-xl transition-all shadow-xs self-start shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
            Change Career
          </button>
        </div>

        {/* Progress Bar towards Career Readiness */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400 font-medium">
              Progress Toward Goal:{' '}
              <strong className="text-white">{user?.careerProgress || 69}%</strong>
            </span>
            <span className="text-indigo-400 font-medium text-[11px]">
              Next milestone: {user?.nextMilestone ? 'Senior Associate Benchmark' : 'L3 Benchmark'}
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${user?.careerProgress || 69}%` }}
            />
          </div>
        </div>
      </div>

      {/* Change Career Goal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Switch Target Career Goal"
        subtitle="PathForge AI will recalibrate your skill gap matrix, course recommendations, and roadmap timeline."
        maxWidth="lg"
      >
        <div className="space-y-3">
          {careerOptions.map((opt) => (
            <div
              key={opt.role}
              onClick={() => setSelectedRole(opt.role)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedRole === opt.role
                  ? 'bg-indigo-600/15 border-indigo-500 shadow-md shadow-indigo-950/40'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{opt.role}</span>
                <span className="text-xs font-semibold text-indigo-400">
                  Est. Readiness: {opt.readiness}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{opt.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setIsModalOpen(false)}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-900/30 transition-all"
          >
            <Check className="w-4 h-4" />
            Recalibrate Command Center
          </button>
        </div>
      </Modal>
    </>
  );
};
