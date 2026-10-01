import React from 'react';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CareerReadinessRingProps {
  score?: number;
  skillMatch?: number;
  mastery?: number;
  evidence?: number;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const CareerReadinessRing: React.FC<CareerReadinessRingProps> = ({
  score = 69,
  skillMatch = 70,
  mastery = 60,
  evidence = 80,
  size = 'md',
  showDetails = true,
}) => {
  const radius = 58;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* SVG Ring */}
      <div className="relative flex items-center justify-center">
        <svg
          className="transform -rotate-90 w-48 h-48 sm:w-52 sm:h-52 drop-shadow-xl"
          viewBox="0 0 140 140"
        >
          {/* Background circle */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            className="stroke-slate-800"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Glowing gradient path */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            className="transition-all duration-1000 ease-out"
            stroke="url(#readinessGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />

          <defs>
            <linearGradient id="readinessGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
          <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight font-display drop-shadow">
            {score}
            <span className="text-xl sm:text-2xl text-indigo-400 font-bold">%</span>
          </span>
          <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase mt-1">
            Career Readiness
          </span>
          <span className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Developing
          </span>
        </div>
      </div>

      {/* Sub metrics breakdown */}
      {showDetails && (
        <div className="w-full grid grid-cols-3 gap-2 mt-6 pt-5 border-t border-slate-800/80">
          <div className="text-center p-2 rounded-xl bg-slate-900/40 border border-slate-800/50">
            <span className="block text-[11px] font-medium text-slate-400">Skill Match</span>
            <span className="text-base font-bold text-sky-400">{skillMatch}%</span>
          </div>

          <div className="text-center p-2 rounded-xl bg-slate-900/40 border border-slate-800/50">
            <span className="block text-[11px] font-medium text-slate-400">Mastery</span>
            <span className="text-base font-bold text-violet-400">{mastery}%</span>
          </div>

          <div className="text-center p-2 rounded-xl bg-slate-900/40 border border-slate-800/50">
            <span className="block text-[11px] font-medium text-slate-400">Evidence</span>
            <span className="text-base font-bold text-emerald-400">{evidence}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
