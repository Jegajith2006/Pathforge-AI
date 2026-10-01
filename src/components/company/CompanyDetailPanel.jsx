import React from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  MapPin,
  DollarSign,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen,
  FolderGit2,
  GitFork,
  ShieldCheck,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { ReadinessBadge } from './ReadinessBadge';
import { Button } from '../common/Button';

/**
 * CompanyDetailPanel component
 * Detailed inspection modal showcasing full hiring rubrics, required skills, and roadmap actions.
 */
export const CompanyDetailPanel = ({
  isOpen = false,
  onClose,
  opportunity,
  onSetTarget,
}) => {
  if (!opportunity) return null;

  const {
    company,
    role,
    logoText,
    team,
    location,
    salaryRange,
    matchScore = 0,
    readinessLevel,
    hiringStage,
    jobDescriptionSummary,
    scoreBreakdown = [],
    requiredSkills = [],
    priorityGaps = [],
    strengths = [],
    recommendations = [],
  } = opportunity;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-3xl"
      title={`${role} @ ${company}`}
    >
      <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[var(--border)] pb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-600 text-white font-extrabold font-display flex items-center justify-center text-xl shadow-md shrink-0">
              {logoText || company.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-sm font-bold font-display text-[var(--text-secondary)]">
                  {company}
                </span>
                <span className="text-[var(--text-muted)]">•</span>
                <ReadinessBadge tier={readinessLevel} score={matchScore} size="sm" />
                {hiringStage && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
                    {hiringStage}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[var(--text-primary)]">
                {role}
              </h2>
              {team && (
                <p className="text-xs text-[var(--text-muted)] font-mono">
                  Team: {team}
                </p>
              )}
            </div>
          </div>

          {/* Overall Match Circle / Score */}
          <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-center min-w-[110px] self-start sm:self-auto shrink-0">
            <span className="text-3xl font-black font-display text-indigo-600 dark:text-cyan-400 block">
              {matchScore}%
            </span>
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">
              Fit Score
            </span>
          </div>
        </div>

        {/* Location, Compensation, Summary */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[var(--text-secondary)]">
            {location && (
              <span className="flex items-center gap-1.5 bg-[var(--surface-secondary)] px-2.5 py-1 rounded-lg border border-[var(--border)]">
                <MapPin className="w-3.5 h-3.5 text-indigo-500 dark:text-cyan-400" />
                <span>{location}</span>
              </span>
            )}
            {salaryRange && (
              <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-semibold">
                <DollarSign className="w-3.5 h-3.5" />
                <span>{salaryRange}</span>
              </span>
            )}
          </div>

          {jobDescriptionSummary && (
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed bg-[var(--surface-secondary)] p-4 rounded-xl border border-[var(--border)]">
              {jobDescriptionSummary}
            </p>
          )}
        </div>

        {/* Verified Strengths */}
        {strengths.length > 0 && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Verified Competency Strengths ({strengths.length})</span>
            </h4>
            <div className="space-y-1.5">
              {strengths.map((str, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15 text-xs text-[var(--text-secondary)] flex items-start gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                  <span>{str}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing Requirements & Gaps */}
        {priorityGaps.length > 0 && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>Critical Gaps to Bridge Before Applying</span>
            </h4>
            <div className="space-y-2">
              {priorityGaps.map((gap, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/15 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--text-primary)]">{gap.skill}</span>
                    <span className="font-mono text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                      Gap: -{gap.gap}%
                    </span>
                  </div>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    {gap.whyItMatters}
                  </p>
                  {gap.recommendedAction && (
                    <div className="text-[11px] font-mono text-indigo-600 dark:text-cyan-400 pt-1">
                      Action: {gap.recommendedAction}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preparation Plan & Quick Navigation */}
        {recommendations.length > 0 && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Recommended Preparation Steps</span>
            </h4>
            <div className="space-y-2">
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-[var(--text-primary)] block">
                      {idx + 1}. {rec.title}
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)] block">
                      {rec.explanation}
                    </span>
                  </div>

                  {rec.relatedRoute && (
                    <Link to={rec.relatedRoute} onClick={onClose} className="shrink-0">
                      <Button variant="outline" size="xs" rightIcon={ArrowRight}>
                        {rec.actionLabel || 'Go'}
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>

          <Button
            variant="cyan"
            size="sm"
            onClick={() => {
              onSetTarget?.(opportunity);
              onClose?.();
            }}
          >
            Set as Current Target Benchmark
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CompanyDetailPanel;
