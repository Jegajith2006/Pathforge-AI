import React, { useState } from 'react';
import {
  Brain,
  BookOpen,
  Code2,
  ShieldCheck,
  MessageSquareQuote,
  Award,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

const iconMap = {
  Brain,
  BookOpen,
  Code2,
  ShieldCheck,
  MessageSquareQuote,
  Award,
};

// Six fixed nodes with explicit positions as required:
// Top: Mentor Feedback
// Top Right: Career Readiness
// Right Bottom: Skills
// Bottom: Courses
// Bottom Left: Projects
// Top Left: Evidence
const ORBIT_NODES = [
  {
    id: 'mentor',
    label: 'Mentor Feedback',
    metric: '4.8 / 5.0 Peer Rating',
    color: '#F59E0B',
    icon: 'MessageSquareQuote',
    position: 'top',
    // In coordinate space 640 x 520 (center is 320, 260)
    x: 320,
    y: 105,
    desc: 'Qualitative rubric assessments from Staff and Principal engineers with actionable code reviews.',
  },
  {
    id: 'readiness',
    label: 'Career Readiness',
    metric: '68% Readiness Score',
    color: '#8B5CF6',
    icon: 'Award',
    position: 'top-right',
    x: 495,
    y: 195,
    desc: 'Explainable composite index benchmarked against live employer job requisitions.',
  },
  {
    id: 'skills',
    label: 'Skills',
    metric: '82% Python · 64% Machine Learning',
    color: '#6366F1',
    icon: 'Brain',
    position: 'right-bottom',
    x: 485,
    y: 335,
    desc: 'Deep multi-layer competency telemetry across 18 specialized technical skills.',
  },
  {
    id: 'courses',
    label: 'Courses',
    metric: '9 Completed · 2 Active',
    color: '#06B6D4',
    icon: 'BookOpen',
    position: 'bottom',
    x: 320,
    y: 415,
    desc: 'Adaptive curriculum that filters out fluff and targets pinpoint skill gaps.',
  },
  {
    id: 'projects',
    label: 'Projects',
    metric: '5 Production Repositories',
    color: '#3B82F6',
    icon: 'Code2',
    position: 'bottom-left',
    x: 155,
    y: 335,
    desc: 'Real-world capstones built with industry architectures and CI/CD pipelines.',
  },
  {
    id: 'evidence',
    label: 'Evidence',
    metric: '8 Verified Proofs',
    color: '#10B981',
    icon: 'ShieldCheck',
    position: 'top-left',
    x: 145,
    y: 195,
    desc: 'Cryptographically hashed proof-of-work, GitHub test suites, and test percentiles.',
  },
];

export const CareerOrbit = () => {
  const [activeNodeId, setActiveNodeId] = useState('skills');

  const activeNode = ORBIT_NODES.find((n) => n.id === activeNodeId) || ORBIT_NODES[0];

  const center = { x: 320, y: 260 };
  const rx = 195;
  const ry = 155;

  return (
    <div className="relative w-full max-w-2xl mx-auto flex flex-col items-center">
      {/* Top Status Beacon */}
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface)] border border-cyan-500/30 text-xs font-semibold shadow-xs dark:shadow-lg dark:shadow-cyan-950/40 mb-3 animate-fade-in">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
        </span>
        <span className="text-cyan-700 dark:text-cyan-300 font-mono text-[11px] tracking-wide font-medium">
          AI-powered career intelligence
        </span>
      </div>

      {/* 
        DESKTOP & TABLET: 4-Layer Orbital Geometry (Hidden on Mobile)
        Layer 0: SVG Connectors & Guide Rings (z-0)
        Layer 2: Circular Node Buttons (z-20)
        Layer 3: Separated Labels & Metric Text (z-30)
        Layer 4: Central Career Goal Core (z-40)
      */}
      <div className="hidden sm:block relative w-full aspect-[640/520] select-none">
        {/* Ambient background glow behind everything */}
        <div className="absolute inset-12 rounded-full bg-gradient-to-tr from-indigo-500/10 via-cyan-400/8 to-violet-500/10 dark:from-indigo-600/20 dark:via-cyan-500/15 dark:to-violet-600/20 blur-3xl pointer-events-none" />

        {/* LAYER 0: SVG Connector & Guide Ring Layer (z-0) */}
        <svg
          viewBox="0 0 640 520"
          className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="centerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="50%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>

            <linearGradient id="orbitRingsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(99, 102, 241, 0.35)" />
              <stop offset="50%" stopColor="rgba(6, 182, 212, 0.3)" />
              <stop offset="100%" stopColor="rgba(139, 92, 246, 0.35)" />
            </linearGradient>

            <filter id="nodeGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer Guide Ellipse */}
          <ellipse
            cx={center.x}
            cy={center.y}
            rx={rx}
            ry={ry}
            fill="none"
            stroke="url(#orbitRingsGrad)"
            strokeWidth="1.5"
            strokeDasharray="4 6"
          />

          {/* Inner Harmonic Ellipse */}
          <ellipse
            cx={center.x}
            cy={center.y}
            rx={rx * 0.58}
            ry={ry * 0.58}
            fill="none"
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800/80"
            strokeWidth="1"
            strokeDasharray="2 4"
          />

          {/* Rays from Center to Each Node */}
          {ORBIT_NODES.map((node) => {
            const isSelected = activeNodeId === node.id;
            return (
              <g key={`connector-${node.id}`}>
                <line
                  x1={center.x}
                  y1={center.y}
                  x2={node.x}
                  y2={node.y}
                  stroke={isSelected ? node.color : 'rgba(148, 163, 184, 0.35)'}
                  strokeWidth={isSelected ? 2.5 : 1.2}
                  strokeDasharray={isSelected ? 'none' : '3 3'}
                  className="transition-colors duration-300"
                />

                {/* Pulse dot moving along ray when active */}
                {isSelected && (
                  <circle
                    cx={(center.x + node.x) / 2}
                    cy={(center.y + node.y) / 2}
                    r="3"
                    fill={node.color}
                    filter="url(#nodeGlow)"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* LAYER 4: Central Career Goal Core (z-40) */}
        <div
          style={{
            position: 'absolute',
            left: `${(center.x / 640) * 100}%`,
            top: `${(center.y / 520) * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className="z-40 pointer-events-auto"
        >
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[var(--surface-elevated)] border-2 border-indigo-500/40 dark:border-cyan-500/40 shadow-xl dark:shadow-cyan-950/60 flex flex-col items-center justify-center text-center p-2.5 transition-all">
            <span className="text-[9px] font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              YOUR CAREER GOAL
            </span>
            <span className="text-xs sm:text-sm font-extrabold font-display text-[var(--text-primary)] leading-tight mt-1">
              Machine Learning
            </span>
            <span className="text-[11px] sm:text-xs font-bold font-display text-cyan-600 dark:text-cyan-400 leading-tight">
              Engineer
            </span>
            <div className="flex items-center gap-1 mt-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" />
              <span className="text-[9px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                Active Goal
              </span>
            </div>
          </div>
        </div>

        {/* LAYER 2: Orbit Node Layer (Circular Icon Containers) (z-20) */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          {ORBIT_NODES.map((node) => {
            const isSelected = activeNodeId === node.id;
            const IconComponent = iconMap[node.icon] || Sparkles;

            return (
              <button
                key={`node-${node.id}`}
                type="button"
                onClick={() => setActiveNodeId(node.id)}
                style={{
                  position: 'absolute',
                  left: `${(node.x / 640) * 100}%`,
                  top: `${(node.y / 520) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`
                  pointer-events-auto
                  cursor-pointer
                  w-12
                  h-12
                  sm:w-13
                  sm:h-13
                  rounded-full
                  flex
                  items-center
                  justify-center
                  transition-colors
                  duration-200
                  focus:outline-hidden
                  focus-visible:ring-2
                  focus-visible:ring-cyan-400
                  ${
                    isSelected
                      ? 'bg-[var(--surface-elevated)] border-2 shadow-lg'
                      : 'bg-[var(--surface)] border border-[var(--border-strong)] hover:border-cyan-500/60 shadow-xs'
                  }
                `}
                aria-label={`Select ${node.label} telemetry node`}
              >
                {/* Active Outer Ring / Glow */}
                <div
                  className="w-full h-full rounded-full flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: isSelected ? `${node.color}18` : 'transparent',
                    borderColor: isSelected ? node.color : undefined,
                    boxShadow: isSelected ? `0 0 16px ${node.color}40` : undefined,
                  }}
                >
                  <IconComponent
                    className="w-5 h-5 transition-colors"
                    style={{ color: node.color }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* LAYER 3: Orbit Label Layer (Independent Label Cards & Metrics) (z-30) */}
        <div className="absolute inset-0 z-30 pointer-events-none">
          {ORBIT_NODES.map((node) => {
            const isSelected = activeNodeId === node.id;
            const IconComponent = iconMap[node.icon] || Sparkles;

            // Geometry-specific positioning to guarantee zero overlaps:
            // Top: Above node
            // Top Right: Upper Right / Right of node
            // Right Bottom: Right of node
            // Bottom: Below node
            // Bottom Left: Left of node
            // Top Left: Upper Left / Left of node
            let positionStyles = {};
            let alignmentClasses = '';

            if (node.position === 'top') {
              positionStyles = {
                left: `${(node.x / 640) * 100}%`,
                top: `${((node.y - 34) / 520) * 100}%`,
                transform: 'translate(-50%, -100%)',
              };
              alignmentClasses = 'items-center text-center';
            } else if (node.position === 'top-right') {
              positionStyles = {
                left: `${((node.x + 34) / 640) * 100}%`,
                top: `${(node.y / 520) * 100}%`,
                transform: 'translateY(-50%)',
              };
              alignmentClasses = 'items-start text-left';
            } else if (node.position === 'right-bottom') {
              positionStyles = {
                left: `${((node.x + 34) / 640) * 100}%`,
                top: `${(node.y / 520) * 100}%`,
                transform: 'translateY(-50%)',
              };
              alignmentClasses = 'items-start text-left';
            } else if (node.position === 'bottom') {
              positionStyles = {
                left: `${(node.x / 640) * 100}%`,
                top: `${((node.y + 34) / 520) * 100}%`,
                transform: 'translate(-50%, 0)',
              };
              alignmentClasses = 'items-center text-center';
            } else if (node.position === 'bottom-left') {
              positionStyles = {
                right: `${(1 - (node.x - 34) / 640) * 100}%`,
                top: `${(node.y / 520) * 100}%`,
                transform: 'translateY(-50%)',
              };
              alignmentClasses = 'items-end text-right';
            } else if (node.position === 'top-left') {
              positionStyles = {
                right: `${(1 - (node.x - 34) / 640) * 100}%`,
                top: `${(node.y / 520) * 100}%`,
                transform: 'translateY(-50%)',
              };
              alignmentClasses = 'items-end text-right';
            }

            return (
              <div
                key={`label-${node.id}`}
                style={positionStyles}
                className={`absolute flex flex-col ${alignmentClasses} pointer-events-auto`}
              >
                <button
                  type="button"
                  onClick={() => setActiveNodeId(node.id)}
                  className={`
                    inline-flex
                    items-center
                    gap-1.5
                    px-2.5
                    py-1
                    rounded-xl
                    text-xs
                    font-bold
                    font-display
                    whitespace-nowrap
                    shadow-xs
                    transition-all
                    cursor-pointer
                    ${
                      isSelected
                        ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] border-2 shadow-md'
                        : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--text-primary)] hover:border-cyan-500/50'
                    }
                  `}
                  style={{
                    borderColor: isSelected ? node.color : undefined,
                    boxShadow: isSelected ? `0 2px 8px ${node.color}25` : undefined,
                  }}
                >
                  <IconComponent
                    className="w-3 h-3 shrink-0"
                    style={{ color: node.color }}
                  />
                  <span>{node.label}</span>
                </button>

                <span className="text-[10.5px] font-mono text-[var(--text-muted)] mt-1 whitespace-nowrap">
                  {node.metric}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 
        MOBILE RESPONSIVE COMPACT MODE (< 640px / 320px–375px)
        Presents clean Career Goal card at top + 2-column grid of the 6 intelligence areas.
        Guarantees 0 text overlap, 0 clipped labels, and 0 horizontal scroll!
      */}
      <div className="block sm:hidden w-full space-y-3">
        {/* Mobile Goal Header Card */}
        <div className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center justify-between gap-3">
          <div>
            <span className="text-[9px] font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              YOUR CAREER GOAL
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm font-extrabold font-display text-[var(--text-primary)]">
                Machine Learning
              </span>
              <span className="text-xs font-bold font-display text-cyan-600 dark:text-cyan-400">
                Engineer
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
              Active Orbit
            </span>
          </div>
        </div>

        {/* Mobile 2-Column Grid */}
        <div className="grid grid-cols-2 gap-2">
          {ORBIT_NODES.map((node) => {
            const isSelected = activeNodeId === node.id;
            const IconComponent = iconMap[node.icon] || Sparkles;

            return (
              <button
                key={`mobile-node-${node.id}`}
                type="button"
                onClick={() => setActiveNodeId(node.id)}
                className={`
                  p-2.5
                  rounded-xl
                  border
                  text-left
                  flex
                  flex-col
                  justify-between
                  gap-2
                  transition-all
                  cursor-pointer
                  ${
                    isSelected
                      ? 'bg-[var(--surface-elevated)] border-2 shadow-sm'
                      : 'bg-[var(--surface)] border-[var(--border)] hover:border-cyan-500/40'
                  }
                `}
                style={{
                  borderColor: isSelected ? node.color : undefined,
                  boxShadow: isSelected ? `0 2px 8px ${node.color}20` : undefined,
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${node.color}18`,
                      color: node.color,
                    }}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold font-display text-[var(--text-primary)] truncate">
                    {node.label}
                  </span>
                </div>

                <span className="text-[10px] font-mono text-[var(--text-muted)] truncate">
                  {node.metric}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Node Telemetry Card / Dynamic Explanation */}
      <div className="w-full mt-3 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] dark:bg-[#0E1326]/90 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            <div
              className="p-2.5 rounded-xl border shrink-0"
              style={{
                backgroundColor: `${activeNode.color}18`,
                borderColor: `${activeNode.color}40`,
                color: activeNode.color,
              }}
            >
              {React.createElement(iconMap[activeNode.icon] || Sparkles, {
                className: 'w-4 h-4',
              })}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                  Orbit Telemetry Node:
                </span>
                <span className="text-sm font-bold text-[var(--text-primary)] font-display truncate">
                  {activeNode.label}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                {activeNode.desc}
              </p>
            </div>
          </div>

          <span
            className="self-start sm:self-center text-xs font-mono font-bold px-2.5 py-1 rounded-lg shrink-0 border whitespace-nowrap"
            style={{
              backgroundColor: `${activeNode.color}15`,
              color: activeNode.color,
              borderColor: `${activeNode.color}40`,
            }}
          >
            {activeNode.metric}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CareerOrbit;

