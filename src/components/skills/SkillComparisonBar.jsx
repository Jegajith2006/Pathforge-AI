import React from 'react';

/**
 * SkillComparisonBar component
 * Visual comparison bar displaying user's current proficiency vs employer required threshold,
 * highlighting any competency gap with clear markers and accessible labels.
 */
export const SkillComparisonBar = ({
  currentScore = 0,
  requiredScore = 80,
  gap = 0,
  status = 'Developing',
  showLabels = true,
  compact = false,
  className = '',
}) => {
  const currentPct = Math.min(100, Math.max(0, currentScore));
  const requiredPct = Math.min(100, Math.max(0, requiredScore));
  const actualGap = Math.max(0, requiredPct - currentPct);
  const isMastered = currentPct >= requiredPct;

  // Determine color scheme based on status and gap
  const getBarColor = () => {
    if (isMastered || currentPct >= 75) {
      return 'bg-gradient-to-r from-emerald-500 to-teal-400';
    }
    if (actualGap >= 30 || currentPct < 45) {
      return 'bg-gradient-to-r from-rose-500 to-amber-500';
    }
    return 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-400';
  };

  const getTextColor = () => {
    if (isMastered || currentPct >= 75) {
      return 'text-emerald-600 dark:text-emerald-400';
    }
    if (actualGap >= 30 || currentPct < 45) {
      return 'text-rose-600 dark:text-rose-400';
    }
    return 'text-indigo-600 dark:text-indigo-400';
  };

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {/* Top Labels Row */}
      {showLabels && (
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-secondary)] font-sans text-[11px]">
              Current:
            </span>
            <span className={`font-bold ${getTextColor()}`}>
              {currentScore}%
            </span>
          </div>

          <div className="flex items-center gap-3">
            {actualGap > 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                Gap: -{actualGap}%
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                Target Met ✓
              </span>
            )}

            <div className="flex items-center gap-1 text-[var(--text-muted)] text-[11px]">
              <span className="hidden sm:inline font-sans">Target:</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {requiredScore}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Visual Multi-Segment Bar */}
      <div
        className={`relative w-full rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] overflow-visible ${
          compact ? 'h-2' : 'h-2.5'
        }`}
        role="progressbar"
        aria-valuenow={currentScore}
        aria-valuemin={0}
        aria-valuemax={requiredScore}
        aria-label={`Proficiency: ${currentScore}% out of ${requiredScore}% required`}
      >
        {/* Gap Warning Shade (region between current and required) */}
        {actualGap > 0 && (
          <div
            className="absolute top-0 bottom-0 bg-amber-500/15 dark:bg-amber-500/20 border-r border-dashed border-amber-500/40 rounded-r-full"
            style={{
              left: `${currentPct}%`,
              width: `${actualGap}%`,
            }}
            title={`Competency gap: ${actualGap}%`}
          />
        )}

        {/* Current Proficiency Filled Bar */}
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${getBarColor()}`}
          style={{ width: `${currentPct}%` }}
        />

        {/* Target Requirement Vertical Marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-1 h-4 rounded-full bg-slate-700 dark:bg-slate-200 shadow-sm z-10 transition-all pointer-events-none"
          style={{ left: `calc(${requiredPct}% - 2px)` }}
          aria-hidden="true"
        >
          {/* Subtle triangle indicator on top */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-slate-700 dark:border-t-slate-200" />
        </div>
      </div>
    </div>
  );
};

export default SkillComparisonBar;
