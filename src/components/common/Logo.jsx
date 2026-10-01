import React from 'react';
import { Link } from 'react-router-dom';

/**
 * PathForge AI Logo
 * Abstract path concept: glowing curved route with connected skill nodes and an arrow/compass trajectory,
 * symbolizing career direction, skills growth, and forward momentum.
 */
export const Logo = ({ size = 'md', showText = true, to = '/', className = '' }) => {
  const sizeMap = {
    sm: { icon: 28, text: 'text-base', sub: 'text-[9px]' },
    md: { icon: 36, text: 'text-lg', sub: 'text-[10px]' },
    lg: { icon: 44, text: 'text-2xl', sub: 'text-xs' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const logoIcon = (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg
        width={currentSize.icon}
        height={currentSize.icon}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          <linearGradient id="pathGradient" x1="6" y1="36" x2="38" y2="8" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366F1" />
            <stop offset="0.5" stopColor="#06B6D4" />
            <stop offset="1" stopColor="#3B82F6" />
          </linearGradient>
          <filter id="pathGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer subtle shield/rounded diamond backdrop */}
        <rect
          x="3"
          y="3"
          width="38"
          height="38"
          rx="12"
          className="fill-[var(--surface-elevated)] stroke-[var(--border)] dark:stroke-indigo-500/30"
          strokeWidth="1.5"
        />

        {/* Ambient subtle background glow */}
        <circle cx="28" cy="14" r="10" fill="rgba(6, 182, 212, 0.15)" />
        <circle cx="12" cy="30" r="8" fill="rgba(99, 102, 241, 0.2)" />

        {/* S-curved career trajectory path */}
        <path
          d="M10 32C10 32 14 26 20 26C26 26 26 16 32 14"
          stroke="url(#pathGradient)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#pathGlow)"
        />

        {/* Secondary guide/progress ray */}
        <path
          d="M20 26L26 34"
          stroke="rgba(148, 163, 184, 0.3)"
          strokeWidth="1.8"
          strokeDasharray="2 2"
          strokeLinecap="round"
        />

        {/* Skill Node 1: Origin/Current Skill */}
        <circle cx="10" cy="32" r="3.2" className="fill-[var(--surface-elevated)] stroke-indigo-500" strokeWidth="2.2" />
        <circle cx="10" cy="32" r="1.4" fill="#A5B4FC" />

        {/* Skill Node 2: Adaptive Milestone Pivot */}
        <circle cx="20" cy="26" r="3.2" className="fill-[var(--surface-elevated)] stroke-cyan-500" strokeWidth="2.2" />
        <circle cx="20" cy="26" r="1.4" fill="#67E8F9" />

        {/* Skill Node 3: Project Branch */}
        <circle cx="26" cy="34" r="2" fill="#64748B" />

        {/* Forward Compass / Arrow Target Node at destination */}
        <path
          d="M31 10L36 13L33 18L30.5 15.5L26 20L24 18L28.5 13.5L26 11L31 10Z"
          fill="url(#pathGradient)"
        />
        <circle cx="34" cy="12" r="1.5" fill="#FFFFFF" />
      </svg>
    </div>
  );

  const content = (
    <div className={`inline-flex items-center gap-2.5 group cursor-pointer select-none ${className}`}>
      {logoIcon}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`font-display font-extrabold tracking-tight text-[var(--text-primary)] ${currentSize.text}`}>
              PathForge
            </span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold bg-gradient-to-r from-indigo-500 to-cyan-500 text-white tracking-wide shadow-xs shadow-indigo-900/40">
              AI
            </span>
          </div>
          <span className={`font-mono text-[var(--text-muted)] font-medium tracking-wider uppercase ${currentSize.sub}`}>
            Career Intelligence
          </span>
        </div>
      )}
    </div>
  );

  if (!to) return content;
  return (
    <Link to={to} className="inline-flex focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl">
      {content}
    </Link>
  );
};

export default Logo;
