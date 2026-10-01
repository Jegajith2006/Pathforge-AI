import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { SkillGapMatrix } from '../components/skills/SkillGapMatrix';
import { SkillOrbit } from '../components/dashboard/SkillOrbit';
import { apiService } from '../services/api';
import { Skill } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Sparkles, Target, Layers, ArrowRight, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SkillsPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const data = await apiService.getSkills();
        setSkills(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, []);

  const handleGeneratePlan = () => {
    addToast(
      'Dynamic Learning Plan Synthesized',
      'High-priority missing skills (SQL & Tableau) have been prioritized into your active sprint roadmap.',
      'success'
    );
    navigate('/app/roadmap');
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Skill Intelligence & Gap Matrix"
        subtitle="Transparent machine-learning gap detection benchmarked against real employer job rubrics."
        badge="Explainable ML"
        actions={
          <button
            onClick={handleGeneratePlan}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-950/40 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate Learning Plan
          </button>
        }
      />

      {/* Top Banner: Selected Career & Skill Match Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#151C2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Active Evaluation Rubric
            </span>
            <span className="text-xs text-slate-400">
              Role: <strong className="text-white">{user?.targetCareer || 'Data Analyst'}</strong>
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white font-display">
            Overall Skill Match: <span className="text-indigo-400">70% Compatible</span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Our explainable model has identified strong analytical foundations in Python, Pandas, and Exploratory Data Analysis. Closing your critical gaps in <strong>SQL Window Functions</strong> and <strong>Tableau Business Dashboards</strong> will elevate your profile to 85%+ career readiness.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>4 Strong Skills</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <span>5 Developing Skills</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span>3 Missing Skills (Priority)</span>
            </div>
          </div>
        </div>

        {/* Orbit Visualization Mini preview */}
        <div className="lg:col-span-4 flex items-center justify-center border-t lg:border-t-0 lg:border-l border-slate-800/80 pt-4 lg:pt-0 lg:pl-6">
          <div className="w-full max-w-[280px]">
            <SkillOrbit careerGoal={user?.targetCareer || 'Data Analyst'} interactive={false} />
          </div>
        </div>
      </div>

      {/* Main Visual: Skill Gap Matrix */}
      <SkillGapMatrix skills={skills} onGeneratePlan={handleGeneratePlan} />
    </div>
  );
};
