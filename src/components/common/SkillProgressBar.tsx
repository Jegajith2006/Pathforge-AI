import React from 'react';

interface SkillProgressBarProps {
  label: string;
  currentLevel: number; // 0-100
  requiredLevel?: number; // 0-100
  showLevels?: boolean;
  status?: 'strong' | 'developing' | 'missing';
}

export const SkillProgressBar: React.FC<SkillProgressBarProps> = ({
  label,
  currentLevel,
  requiredLevel = 80,
  showLevels = true,
  status = 'developing',
}) => {
  const getFillColor = () => {
    if (status === 'strong' || currentLevel >= requiredLevel) {
      return 'bg-gradient-to-r from-emerald-500 to-teal-400';
    }
    if (status === 'missing' || currentLevel < 40) {
      return 'bg-gradient-to-r from-rose-500 to-amber-500';
    }
    return 'bg-gradient-to-r from-indigo-500 to-sky-400';
  };

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-[var(--text-primary)] truncate">{label}</span>
        {showLevels && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[var(--text-secondary)]">
              Current: <strong className="text-[var(--text-primary)]">{currentLevel}%</strong>
            </span>
            {requiredLevel && (
              <span className="text-[var(--text-muted)]">
                Target: {requiredLevel}%
              </span>
            )}
          </div>
        )}
      </div>

      <div className="relative h-2 w-full bg-[var(--surface-tertiary)] rounded-full overflow-hidden border border-[var(--border)]">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${getFillColor()}`}
          style={{ width: `${Math.min(currentLevel, 100)}%` }}
        />
        {requiredLevel && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[var(--text-primary)]/70 z-10"
            style={{ left: `${requiredLevel}%` }}
            title={`Target: ${requiredLevel}%`}
          />
        )}
      </div>
    </div>
  );
};
