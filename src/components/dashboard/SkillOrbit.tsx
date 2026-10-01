import React, { useState } from 'react';
import { Sparkles, Award, BookOpen, Briefcase, FileCheck, Users, Compass } from 'lucide-react';

interface OrbitNode {
  id: string;
  label: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  glow: string;
  angle: number; // in degrees
  radius: number; // in px
  stats: string;
}

interface SkillOrbitProps {
  careerGoal?: string;
  interactive?: boolean;
}

export const SkillOrbit: React.FC<SkillOrbitProps> = ({
  careerGoal = 'Data Analyst',
  interactive = true,
}) => {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  const nodes: OrbitNode[] = [
    {
      id: 'skills',
      label: 'Skills Intelligence',
      category: '12 Analyzed',
      icon: Sparkles,
      color: 'from-indigo-500 to-sky-400',
      glow: 'shadow-indigo-500/50',
      angle: 0,
      radius: 140,
      stats: '5 Strong • 4 Developing • 3 Missing',
    },
    {
      id: 'courses',
      label: 'Personalized Courses',
      category: '6 Recommended',
      icon: BookOpen,
      color: 'from-blue-500 to-indigo-600',
      glow: 'shadow-blue-500/50',
      angle: 60,
      radius: 140,
      stats: 'SQL Mastery & Tableau Specialization',
    },
    {
      id: 'projects',
      label: 'Practical Projects',
      category: '4 Scenarios',
      icon: Briefcase,
      color: 'from-violet-500 to-purple-600',
      glow: 'shadow-violet-500/50',
      angle: 120,
      radius: 140,
      stats: 'Enterprise SaaS Churn & BI Mart',
    },
    {
      id: 'evidence',
      label: 'Evidence Vault',
      category: '6 Artifacts',
      icon: FileCheck,
      color: 'from-emerald-500 to-teal-500',
      glow: 'shadow-emerald-500/50',
      angle: 180,
      radius: 140,
      stats: '4 Verified • 1 In Queue • 1 Needs Rev',
    },
    {
      id: 'mentor',
      label: 'Mentor Feedback',
      category: '3 Reviews',
      icon: Users,
      color: 'from-amber-500 to-orange-500',
      glow: 'shadow-amber-500/50',
      angle: 240,
      radius: 140,
      stats: 'Monzo, Spotify & Stripe mentors',
    },
    {
      id: 'readiness',
      label: 'Career Readiness',
      category: '69% Index',
      icon: Award,
      color: 'from-cyan-400 to-blue-600',
      glow: 'shadow-cyan-500/50',
      angle: 300,
      radius: 140,
      stats: 'Level 3 Apprentice • Pace +18% MoM',
    },
  ];

  return (
    <div className="relative w-full max-w-[480px] aspect-square mx-auto flex items-center justify-center p-4">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-radial from-indigo-600/15 via-violet-900/10 to-transparent blur-3xl pointer-events-none" />

      {/* SVG Orbit Rings & Radial Rays */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400">
        {/* Orbital rings */}
        <circle cx="200" cy="200" r="140" fill="none" stroke="rgba(99, 102, 241, 0.15)" strokeWidth="1.5" strokeDasharray="4 6" />
        <circle cx="200" cy="200" r="95" fill="none" stroke="rgba(147, 197, 253, 0.1)" strokeWidth="1" />
        <circle cx="200" cy="200" r="185" fill="none" stroke="rgba(168, 85, 247, 0.08)" strokeWidth="1" />

        {/* Dynamic connection lines to nodes */}
        {nodes.map((node) => {
          const rad = (node.angle * Math.PI) / 180;
          const x = 200 + node.radius * Math.cos(rad);
          const y = 200 + node.radius * Math.sin(rad);
          const isActive = activeNode === node.id;

          return (
            <g key={`line-${node.id}`}>
              <line
                x1="200"
                y1="200"
                x2={x}
                y2={y}
                stroke={isActive ? 'rgba(129, 140, 248, 0.8)' : 'rgba(99, 102, 241, 0.25)'}
                strokeWidth={isActive ? 2.5 : 1.2}
                strokeDasharray={isActive ? 'none' : '3 3'}
              />
              {/* Pulse particle along active line */}
              {isActive && (
                <circle cx={(200 + x) / 2} cy={(200 + y) / 2} r="3" fill="#67E8F9" className="animate-ping" />
              )}
            </g>
          );
        })}
      </svg>

      {/* Central Goal Beacon */}
      <div className="relative z-20 flex flex-col items-center justify-center w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#1E1B4B] via-[#0F172A] to-[#1E1B4B] border-2 border-indigo-500/40 shadow-2xl shadow-indigo-950/80 p-3 text-center transition-all duration-300 hover:scale-105 hover:border-indigo-400">
        <div className="absolute -top-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-500 text-white shadow-md">
          Target Goal
        </div>
        <Compass className="w-5 h-5 text-sky-400 mb-1 animate-spin-slow" />
        <span className="text-xs sm:text-sm font-extrabold text-white leading-tight font-display">
          {careerGoal}
        </span>
        <span className="text-[10px] text-emerald-400 font-semibold mt-0.5">
          Active Roadmap
        </span>
      </div>

      {/* Orbiting Satellite Nodes */}
      {nodes.map((node) => {
        const rad = (node.angle * Math.PI) / 180;
        // Map 140px radius relative to container center (50%)
        const xPercent = 50 + (node.radius / 200) * 44 * Math.cos(rad);
        const yPercent = 50 + (node.radius / 200) * 44 * Math.sin(rad);
        const Icon = node.icon;
        const isActive = activeNode === node.id;

        return (
          <div
            key={node.id}
            style={{
              left: `${xPercent}%`,
              top: `${yPercent}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute z-30 group"
            onMouseEnter={() => interactive && setActiveNode(node.id)}
            onMouseLeave={() => interactive && setActiveNode(null)}
          >
            <button
              type="button"
              className={`relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#111827] border transition-all duration-300 shadow-lg ${
                isActive
                  ? `border-white scale-110 shadow-xl ${node.glow}`
                  : 'border-slate-700/70 hover:border-indigo-400'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${node.color} flex items-center justify-center text-white shadow-xs`}>
                <Icon className="w-4 h-4" />
              </div>
            </button>

            {/* Hover Tooltip card */}
            <div
              className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 p-2.5 rounded-xl bg-[#0B0F19]/95 border border-slate-700 shadow-2xl backdrop-blur-md pointer-events-none transition-all duration-200 z-40 ${
                isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            >
              <p className="text-xs font-bold text-white leading-tight">{node.label}</p>
              <p className="text-[10px] text-indigo-400 font-medium">{node.category}</p>
              <p className="text-[10px] text-slate-300 mt-1 leading-relaxed border-t border-slate-800 pt-1">
                {node.stats}
              </p>
            </div>
          </div>
        );
      })}

      {/* Floating skill badge micro-chips around perimeter */}
      <div className="absolute top-4 left-6 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 backdrop-blur-xs hidden sm:block animate-bounce-slow">
        ✦ Explainable ML
      </div>
      <div className="absolute bottom-6 right-8 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 backdrop-blur-xs hidden sm:block">
        ✓ Verified Evidence
      </div>
      <div className="absolute top-12 right-6 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/20 backdrop-blur-xs hidden sm:block">
        ⚡ Gap Detection
      </div>
    </div>
  );
};
