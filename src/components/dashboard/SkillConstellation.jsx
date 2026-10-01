import React, { useState } from 'react';
import { Target, AlertCircle } from 'lucide-react';
import { getSkillTier } from '../../utils/readinessCalculator';

/**
 * Interactive Skill Constellation & Radar Visualizer
 * Maps interconnected competencies with zero overlapping labels,
 * responsive selected skill detail panel, and standardized tier legend.
 */
export const SkillConstellation = ({ onSelectSkill, activeSkillId }) => {
  const [selectedId, setSelectedId] = useState(activeSkillId || 'deployment');
  const [hoveredId, setHoveredId] = useState(null);

  const skills = [
    {
      id: 'python',
      name: 'Python',
      score: 82,
      target: 90,
      tier: 'Strong',
      category: 'Core Language',
      x: 230,
      y: 45,
      color: '#10b981',
      bgRing: 'rgba(16, 185, 129, 0.15)',
      description: 'Vectorized NumPy algorithms, memory efficiency, and OOP paradigms.',
    },
    {
      id: 'ml',
      name: 'Machine Learning',
      score: 64,
      target: 85,
      tier: 'Developing',
      category: 'Modeling & Evaluation',
      x: 355,
      y: 115,
      color: '#6366f1',
      bgRing: 'rgba(99, 102, 241, 0.15)',
      description: 'Scikit-Learn pipelines, ROC-AUC calibration, and ensemble trees.',
    },
    {
      id: 'sql',
      name: 'SQL',
      score: 58,
      target: 80,
      tier: 'Developing',
      category: 'Data & Querying',
      x: 105,
      y: 115,
      color: '#06b6d4',
      bgRing: 'rgba(6, 182, 212, 0.15)',
      description: 'Partition ranking, recursive CTEs, and query planner optimization.',
    },
    {
      id: 'stats',
      name: 'Statistics',
      score: 55,
      target: 80,
      tier: 'Developing',
      category: 'Mathematical Foundations',
      x: 130,
      y: 225,
      color: '#8b5cf6',
      bgRing: 'rgba(139, 92, 246, 0.15)',
      description: 'Hypothesis testing, Bayesian inference, and regression assumptions.',
    },
    {
      id: 'deep-learning',
      name: 'Deep Learning',
      score: 42,
      target: 80,
      tier: 'Priority Gap',
      category: 'Neural Architectures',
      x: 330,
      y: 225,
      color: '#ef4444',
      bgRing: 'rgba(239, 68, 68, 0.15)',
      description: 'PyTorch autograd, transfer learning, and convolutional feature extractors.',
    },
    {
      id: 'deployment',
      name: 'Model Deployment',
      score: 36,
      target: 75,
      tier: 'Priority Gap',
      category: 'Production Systems',
      x: 230,
      y: 255,
      color: '#ef4444',
      bgRing: 'rgba(239, 68, 68, 0.15)',
      description: 'FastAPI microservices, Docker containerization, and latency budgets.',
    },
  ];

  // Interconnected relationships
  const connections = [
    { from: 'python', to: 'ml', strength: 0.8 },
    { from: 'python', to: 'sql', strength: 0.6 },
    { from: 'sql', to: 'stats', strength: 0.5 },
    { from: 'stats', to: 'ml', strength: 0.7 },
    { from: 'ml', to: 'deep-learning', strength: 0.9 },
    { from: 'deep-learning', to: 'deployment', strength: 0.7 },
    { from: 'ml', to: 'deployment', strength: 0.8 },
  ];

  const currentId = hoveredId || activeSkillId || selectedId;
  const activeSkill = skills.find((s) => s.id === currentId) || skills[5]; // defaults to deployment

  const handleSelect = (skill) => {
    setSelectedId(skill.id);
    if (onSelectSkill) {
      onSelectSkill(skill);
    }
  };

  const remainingGap = Math.max(0, activeSkill.target - activeSkill.score);
  const isPriority = activeSkill.tier === 'Priority Gap';

  return (
    <div className="relative w-full flex flex-col items-center select-none space-y-3">
      {/* Radar SVG Visualizer */}
      <div className="w-full max-w-md aspect-[460/300] relative">
        <svg
          viewBox="0 0 460 300"
          className="w-full h-full overflow-visible drop-shadow-xs"
        >
          <defs>
            <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Central concentric radar rings */}
          <circle cx="230" cy="155" r="115" fill="url(#centerGlow)" />
          <circle
            cx="230"
            cy="155"
            r="115"
            className="stroke-[var(--border)]"
            strokeWidth="1"
            strokeDasharray="4 4"
            fill="none"
            opacity="0.6"
          />
          <circle
            cx="230"
            cy="155"
            r="75"
            className="stroke-[var(--border)]"
            strokeWidth="1"
            strokeDasharray="3 3"
            fill="none"
            opacity="0.7"
          />
          <circle
            cx="230"
            cy="155"
            r="40"
            className="stroke-[var(--border)]"
            strokeWidth="1"
            fill="none"
            opacity="0.8"
          />

          {/* Axis cross lines */}
          <line
            x1="230"
            y1="40"
            x2="230"
            y2="270"
            className="stroke-[var(--border)]"
            strokeWidth="1"
            opacity="0.4"
          />
          <line
            x1="100"
            y1="155"
            x2="360"
            y2="155"
            className="stroke-[var(--border)]"
            strokeWidth="1"
            opacity="0.4"
          />

          {/* Connective Constellation Lines */}
          {connections.map((conn, idx) => {
            const fromNode = skills.find((s) => s.id === conn.from);
            const toNode = skills.find((s) => s.id === conn.to);
            if (!fromNode || !toNode) return null;

            const isHighlighted =
              currentId === fromNode.id || currentId === toNode.id;

            return (
              <line
                key={`conn-${idx}`}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={isHighlighted ? 'var(--text-primary)' : 'var(--border)'}
                strokeWidth={isHighlighted ? '1.5' : '1'}
                strokeOpacity={isHighlighted ? 0.7 : 0.3}
                strokeDasharray={isHighlighted ? 'none' : '3 3'}
                className="transition-all duration-300 pointer-events-none"
              />
            );
          })}

          {/* Polygon Shape filling current achieved competency */}
          <polygon
            points={skills.map((s) => `${s.x},${s.y}`).join(' ')}
            fill="rgba(99, 102, 241, 0.08)"
            stroke="rgba(99, 102, 241, 0.3)"
            strokeWidth="1"
            className="pointer-events-none"
          />

          {/* Skill Nodes */}
          {skills.map((skill) => {
            const isSelected = currentId === skill.id;
            const radius = 18;

            return (
              <g
                key={skill.id}
                className="cursor-pointer transition-transform duration-200"
                onClick={() => handleSelect(skill)}
                onMouseEnter={() => setHoveredId(skill.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Active selection ring */}
                {isSelected && (
                  <circle
                    cx={skill.x}
                    cy={skill.y}
                    r={radius + 6}
                    fill="none"
                    stroke={skill.color}
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    className="animate-spin-slow opacity-80"
                  />
                )}

                {/* Node outer glow */}
                <circle
                  cx={skill.x}
                  cy={skill.y}
                  r={radius + 2}
                  fill={skill.bgRing}
                />

                {/* Node main circle */}
                <circle
                  cx={skill.x}
                  cy={skill.y}
                  r={radius}
                  fill="var(--surface)"
                  stroke={skill.color}
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  className="transition-all duration-200"
                />

                {/* Score text inside node */}
                <text
                  x={skill.x}
                  y={skill.y + 4}
                  textAnchor="middle"
                  fill="var(--text-primary)"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="'JetBrains Mono', monospace"
                  className="pointer-events-none select-none"
                >
                  {skill.score}%
                </text>

                {/* Label text positioned cleanly outside node */}
                <text
                  x={skill.x}
                  y={skill.y > 180 ? skill.y + radius + 14 : skill.y - radius - 6}
                  textAnchor="middle"
                  fill={isSelected ? skill.color : 'var(--text-secondary)'}
                  fontSize="11"
                  fontWeight={isSelected ? '700' : '600'}
                  className="pointer-events-none select-none transition-colors duration-150"
                >
                  {skill.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Skill Detail Panel (Responsive: placed below radar without overlapping) */}
      <div
        className={`w-full p-3.5 rounded-xl border transition-all ${
          isPriority
            ? 'bg-rose-500/[0.04] dark:bg-rose-950/20 border-rose-500/25'
            : activeSkill.tier === 'Developing'
            ? 'bg-indigo-500/[0.04] dark:bg-indigo-950/20 border-indigo-500/25'
            : 'bg-emerald-500/[0.04] dark:bg-emerald-950/20 border-emerald-500/25'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: activeSkill.color }}
            />
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)] block">
                Skill
              </span>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                {activeSkill.name}
              </h4>
            </div>
          </div>

          <span
            className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
              isPriority
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                : activeSkill.tier === 'Developing'
                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            }`}
          >
            Status: {activeSkill.tier}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2.5 border-t border-[var(--border)] text-xs">
          <div>
            <span className="text-[10px] text-[var(--text-muted)] block">Current</span>
            <span className="font-mono font-bold text-[var(--text-primary)]">
              {activeSkill.score}%
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-muted)] block">Target</span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {activeSkill.target}%
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-muted)] block">Remaining Gap</span>
            <span
              className={`font-mono font-bold ${
                isPriority
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-[var(--text-primary)]'
              }`}
            >
              {remainingGap} percentage points
            </span>
          </div>
        </div>
      </div>

      {/* Standardized Radar Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-[var(--text-muted)] pt-2 border-t border-[var(--border)] w-full">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Strong: 75% - 100%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          <span>Developing: 50% - 74%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Priority Gap: 0% - 49%</span>
        </div>
      </div>
    </div>
  );
};

export default SkillConstellation;
