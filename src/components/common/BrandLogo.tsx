import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  linkTo?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showTagline = false,
  linkTo = '/',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  }[size];

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl sm:text-3xl',
  }[size];

  const content = (
    <div className="flex items-center gap-3 group select-none">
      {/* Visual Logo Concept: Path + glowing node + forward arrow + connected skill network */}
      <div
        className={`relative ${iconSizes} rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-0.5 shadow-lg shadow-indigo-950/60 flex items-center justify-center overflow-hidden border border-indigo-400/30 group-hover:border-indigo-400/60 transition-all duration-300`}
      >
        <div className="absolute inset-0 bg-radial from-indigo-400/20 to-transparent pointer-events-none" />
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1.5 drop-shadow"
        >
          {/* Constellation connection lines */}
          <path
            d="M6 22 L14 16 L20 20 L26 8"
            stroke="rgba(199, 210, 254, 0.4)"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Main curved path forward */}
          <path
            d="M6 26 C11 25, 14 19, 18 14 C22 9, 24 8, 27 7"
            stroke="url(#pathGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Arrow tip pointing forward */}
          <path
            d="M23 6 L27 7 L26 11"
            stroke="#67E8F9"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Glowing nodes */}
          <circle cx="6" cy="22" r="2" fill="#818CF8" />
          <circle cx="14" cy="16" r="2.2" fill="#A78BFA" />
          <circle cx="20" cy="20" r="1.8" fill="#38BDF8" />
          {/* Destination glowing beacon */}
          <circle cx="26" cy="8" r="2.8" fill="#38BDF8" />
          <circle cx="26" cy="8" r="5" stroke="#38BDF8" strokeWidth="1" opacity="0.6" />

          <defs>
            <linearGradient id="pathGrad" x1="6" y1="26" x2="27" y2="7" gradientUnits="userSpaceOnUse">
              <stop stopColor="#818CF8" />
              <stop offset="0.5" stopColor="#A855F7" />
              <stop offset="1" stopColor="#38BDF8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`font-extrabold text-[var(--text-primary)] tracking-tight font-display ${textSizes}`}>
            Path<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-sky-400 to-violet-500 dark:from-indigo-400 dark:via-sky-300 dark:to-violet-400">Forge</span>
          </span>
          <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 rounded-md">
            AI
          </span>
        </div>
        {showTagline && (
          <span className="text-[11px] text-[var(--text-muted)] font-medium tracking-wide">
            Your skills. Your path. Your future.
          </span>
        )}
      </div>
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="inline-block">
        {content}
      </Link>
    );
  }

  return content;
};
