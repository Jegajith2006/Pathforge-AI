import React from 'react';

/**
 * ProjectSkillTags
 * Renders technical competencies developed by a practical project
 */
export const ProjectSkillTags = ({ skills = [], maxVisible = 4, size = 'sm' }) => {
  if (!skills || skills.length === 0) return null;

  const visibleSkills = maxVisible ? skills.slice(0, maxVisible) : skills;
  const remainingCount = maxVisible ? skills.length - maxVisible : 0;

  const tagSize = size === 'xs' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-0.5';

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visibleSkills.map((skill, idx) => (
        <span
          key={idx}
          className={`rounded-md bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border)] font-medium ${tagSize}`}
        >
          {skill}
        </span>
      ))}
      {remainingCount > 0 && (
        <span
          className={`rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium ${tagSize}`}
        >
          +{remainingCount} more
        </span>
      )}
    </div>
  );
};

export default ProjectSkillTags;
