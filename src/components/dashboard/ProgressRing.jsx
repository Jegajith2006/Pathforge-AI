import React from 'react';

/**
 * Reusable animated circular progress ring.
 * Contains only the score percentage and the centered label inside the ring.
 * All level badges and sublabels are kept outside the SVG to eliminate visual overlap.
 */
export const ProgressRing = ({
  score = 68,
  size = 180,
  strokeWidth = 12,
  label = 'READINESS SCORE',
  id = 'dashboard-readiness-ring',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size, maxWidth: '100%' }}
    >
      <svg
        className="transform -rotate-90 overflow-visible"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <defs>
          <linearGradient id={`${id}-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>

        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-[var(--surface-secondary)]"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Animated value ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${id}-gradient)`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          style={{
            transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </svg>

      {/* Center content: ONLY Score & Label (centered horizontally and vertically) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <div className="text-4xl sm:text-5xl font-extrabold text-[var(--text-primary)] font-display tracking-tight flex items-baseline justify-center">
          {score}
          <span className="text-xl sm:text-2xl font-bold text-indigo-500 ml-0.5">%</span>
        </div>
        <div className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-[var(--text-muted)] mt-1 font-mono">
          {label}
        </div>
      </div>
    </div>
  );
};

export default ProgressRing;
