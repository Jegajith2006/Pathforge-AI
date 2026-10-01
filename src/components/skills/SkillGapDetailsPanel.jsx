import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Target,
  Zap,
  Clock,
  BookOpen,
  Code2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
  Calendar,
} from 'lucide-react';
import { SkillPriorityBadge } from './SkillPriorityBadge';
import { SkillComparisonBar } from './SkillComparisonBar';
import { useToast } from '../../context/ToastContext';

/**
 * SkillGapDetailsPanel Component
 * Deep-dive diagnostic drawer / modal showing learning roadmap, suggested projects,
 * topics, and career readiness impact for the selected competency.
 */
export const SkillGapDetailsPanel = ({
  skill,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Escape key listener for accessible closing
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when panel is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !skill) return null;

  const handleAddToRoadmap = () => {
    addToast(
      'Competency Added to Sprint',
      `${skill.name} has been queued into Milestone Phase 3 with target completion in ${skill.estimatedTime}.`,
      'success'
    );
  };

  const handleNavigateCourses = () => {
    onClose();
    navigate('/courses');
  };

  const handleNavigateProjects = () => {
    onClose();
    navigate('/projects');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="skill-details-title"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity cursor-pointer"
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-xl bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl z-10 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[var(--border)] bg-[var(--surface-secondary)]/40 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] bg-[var(--surface)] px-2 py-0.5 rounded border border-[var(--border)]">
                {skill.category}
              </span>
              <SkillPriorityBadge priority={skill.priority} type="priority" size="xs" />
              <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                Importance: {skill.importance}
              </span>
            </div>
            <h2
              id="skill-details-title"
              className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight"
            >
              {skill.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-transparent hover:border-[var(--border)] transition-colors"
            aria-label="Close competency details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Proficiency Metrics Overview */}
          <div className="p-4 rounded-2xl bg-[var(--surface-secondary)]/50 border border-[var(--border)] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--text-primary)]">Diagnostic Calibration</span>
              <span className="font-mono text-[var(--text-muted)]">Benchmark: Machine Learning Engineer</span>
            </div>

            <SkillComparisonBar
              currentScore={skill.currentScore}
              requiredScore={skill.requiredScore}
              gap={skill.gap}
              status={skill.status}
              showLabels={true}
            />

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                <div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase font-mono">Time to Close</div>
                  <div className="text-xs font-bold text-[var(--text-primary)]">{skill.estimatedTime}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase font-mono">Readiness Impact</div>
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400">+{skill.readinessImpact} Points</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Why This Skill Matters */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-500" />
              <span>Why This Skill Matters</span>
            </h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)]">
              {skill.whyItMatters || skill.description}
            </p>
          </div>

          {/* Section: Recommended Learning Topics */}
          {skill.topics && skill.topics.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-cyan-500" />
                <span>Key Curriculum Topics</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {skill.topics.map((topic, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)]"
                  >
                    <CheckCircle2 className="w-3 h-3 text-indigo-500 shrink-0" />
                    <span>{topic}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section: Suggested Project Proof */}
          {skill.suggestedProject && (
            <div className="space-y-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Suggested Portfolio Project</span>
              </h3>
              <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-all space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">
                    {skill.suggestedProject}
                  </h4>
                  <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    High Evidence
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {skill.suggestedProjectDesc || 'Implement an end-to-end reproducible codebase with automated unit tests and Docker containerization.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-5 sm:p-6 border-t border-[var(--border)] bg-[var(--surface-secondary)]/30 space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleNavigateCourses}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] transition-colors flex items-center justify-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span>Explore Courses</span>
            </button>

            <button
              onClick={handleNavigateProjects}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] transition-colors flex items-center justify-center gap-1.5"
            >
              <Code2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>View Projects</span>
            </button>
          </div>

          <button
            onClick={handleAddToRoadmap}
            className="w-full py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Add Competency to Active Roadmap</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkillGapDetailsPanel;
