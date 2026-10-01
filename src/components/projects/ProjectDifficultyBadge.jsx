import React from 'react';

/**
 * ProjectDifficultyBadge
 * Reusable difficulty badge with theme-aware colors
 */
export const ProjectDifficultyBadge = ({ difficulty = 'Intermediate', size = 'sm' }) => {
  const getStyle = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'beginner':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'advanced':
        return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      case 'capstone':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'intermediate':
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  const sizeClass = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-0.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${getStyle(
        difficulty
      )} ${sizeClass}`}
    >
      {difficulty}
    </span>
  );
};

export default ProjectDifficultyBadge;
