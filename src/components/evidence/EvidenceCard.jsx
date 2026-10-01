import React from 'react';
import { EvidenceTypeBadge } from './EvidenceTypeBadge';
import { EvidenceStatusBadge } from './EvidenceStatusBadge';
import {
  Calendar,
  ExternalLink,
  ChevronRight,
  Sparkles,
  FileCode2,
  CheckCircle2,
} from 'lucide-react';
import { mockCoursesInProgress, mockProjectsInProgress } from '../../data/mockData';

export const EvidenceCard = ({ item, onViewDetails }) => {
  // Resolve friendly course or project name
  const relatedCourse = mockCoursesInProgress.find((c) => c.id === item.relatedCourseId);
  const relatedProject = mockProjectsInProgress.find((p) => p.id === item.relatedProjectId);

  const relatedContext =
    relatedCourse?.title || relatedProject?.title || (item.relatedProjectId ? 'Capstone Project' : null);

  return (
    <div className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-indigo-500/40 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group space-y-4">
      {/* Card Header: Type Badge & Verification Status */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <EvidenceTypeBadge type={item.type} />
          <EvidenceStatusBadge
            status={item.verificationStatus}
            portfolioReady={item.portfolioReady}
          />
        </div>

        {/* Title */}
        <h3 className="text-base font-bold font-display text-[var(--text-primary)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
          {item.title}
        </h3>

        {/* Short Description */}
        <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
          {item.description}
        </p>
      </div>

      {/* Meta Attributes & Badges */}
      <div className="space-y-3 pt-2 border-t border-[var(--border)] text-xs">
        {/* Related Skill & Context */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-md bg-[var(--surface-secondary)] text-[var(--text-primary)] font-semibold text-[11px] border border-[var(--border)]">
            {item.relatedSkill}
          </span>
          {relatedContext && (
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium text-[11px] border border-indigo-500/20 truncate max-w-[200px]" title={relatedContext}>
              {relatedContext}
            </span>
          )}
        </div>

        {/* Date Row */}
        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[var(--text-muted)]" />
            <span>Added {item.dateAdded || item.submissionDate || 'Recently'}</span>
          </span>
          {item.completionDate && (
            <span>Completed: {item.completionDate}</span>
          )}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => onViewDetails(item)}
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[var(--surface-secondary)] hover:bg-indigo-600 hover:text-white text-[var(--text-primary)] text-xs font-semibold border border-[var(--border)] hover:border-transparent transition-all shadow-sm active:scale-98 cursor-pointer"
        >
          <span>View Details & Proof</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default EvidenceCard;
