import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { FeedbackRating } from './FeedbackRating';
import { FeedbackActionItem } from './FeedbackActionItem';
import { FeedbackTimeline } from './FeedbackTimeline';
import { useToast } from '../../context/ToastContext';
import {
  Building2,
  Calendar,
  FolderGit2,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  Sparkles,
  CheckCheck,
} from 'lucide-react';

export const FeedbackDetailsModal = ({
  feedback,
  isOpen,
  onClose,
  onUpdateFeedback,
}) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [newActionText, setNewActionText] = useState('');
  const [newActionPriority, setNewActionPriority] = useState('Medium');

  if (!feedback) return null;

  const completedCount = (feedback.actionItems || []).filter((a) => a.completed).length;
  const totalCount = (feedback.actionItems || []).length;

  const handleToggleAction = (actionId) => {
    const updatedActionItems = (feedback.actionItems || []).map((item) => {
      if (item.id === actionId) {
        const nextState = !item.completed;
        addToast(
          nextState ? 'Action Item Resolved' : 'Action Item Reopened',
          `"${item.text.slice(0, 45)}..." marked as ${nextState ? 'completed' : 'pending'}`,
          'info'
        );
        return { ...item, completed: nextState };
      }
      return item;
    });

    const allResolved = updatedActionItems.every((a) => a.completed);
    const updatedFeedback = {
      ...feedback,
      actionItems: updatedActionItems,
      status: allResolved && updatedActionItems.length > 0 ? 'Resolved' : feedback.status,
    };

    onUpdateFeedback(updatedFeedback);
  };

  const handleAddAction = (e) => {
    e.preventDefault();
    if (!newActionText.trim()) return;

    const newItem = {
      id: `ai_${Date.now()}`,
      text: newActionText.trim(),
      completed: false,
      priority: newActionPriority,
    };

    const updatedFeedback = {
      ...feedback,
      actionItems: [...(feedback.actionItems || []), newItem],
    };

    onUpdateFeedback(updatedFeedback);
    setNewActionText('');
    addToast('Action Item Added', 'New task added to your engineering checklist.', 'success');
  };

  const handleRemoveAction = (actionId) => {
    const updatedFeedback = {
      ...feedback,
      actionItems: (feedback.actionItems || []).filter((a) => a.id !== actionId),
    };
    onUpdateFeedback(updatedFeedback);
    addToast('Action Item Removed', 'Item was removed from checklist.', 'info');
  };

  const handleToggleStatus = () => {
    let nextStatus = 'Reviewed';
    if (feedback.status === 'New') nextStatus = 'Reviewed';
    else if (feedback.status === 'Reviewed') nextStatus = 'Action Required';
    else if (feedback.status === 'Action Required') nextStatus = 'Resolved';
    else nextStatus = 'Reviewed';

    const updatedFeedback = {
      ...feedback,
      status: nextStatus,
    };

    onUpdateFeedback(updatedFeedback);
    addToast(
      'Status Updated',
      `Feedback from ${feedback.mentorName} changed to "${nextStatus}"`,
      'success'
    );
  };

  const handleNavigateRelated = () => {
    onClose();
    if (feedback.relatedProjectId) {
      navigate('/projects');
    } else {
      navigate('/courses');
    }
  };

  const statusVariants = {
    New: 'indigo',
    Reviewed: 'cyan',
    'Action Required': 'warning',
    Resolved: 'success',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mentor Evaluation Details"
      size="xl"
    >
      <div className="space-y-6 pt-1 max-h-[78vh] overflow-y-auto pr-1">
        {/* Mentor profile hero header */}
        <div className="p-5 rounded-2xl bg-[var(--surface-secondary)]/70 border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {feedback.avatar ? (
              <img
                src={feedback.avatar}
                alt={feedback.mentorName}
                className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500/40 shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-indigo-500/15 border-2 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-bold text-lg flex items-center justify-center shrink-0">
                {feedback.avatarInitials ||
                  feedback.mentorName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-bold text-[var(--text-primary)] font-display">
                  {feedback.mentorName}
                </h3>
                <Badge
                  variant={statusVariants[feedback.status] || 'default'}
                  size="sm"
                  dot
                >
                  {feedback.status}
                </Badge>
              </div>

              <p className="text-xs text-[var(--text-secondary)] mt-0.5 flex items-center gap-2 flex-wrap">
                <span>{feedback.mentorRole}</span>
                {feedback.company && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {feedback.company}
                    </span>
                  </>
                )}
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {feedback.date}
                </span>
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-start sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border)]">
            <FeedbackRating rating={feedback.rating} size="lg" />
            <span className="text-xs text-[var(--text-muted)] font-mono">
              Rubric: {feedback.rubricScore || `${Number(feedback.rating).toFixed(1)} / 5.0`}
            </span>
          </div>
        </div>

        {/* Target project and metadata pills */}
        <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
              Topic:
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--surface-secondary)] text-[var(--text-primary)] font-bold border border-[var(--border)]">
              {feedback.relatedProjectId ? (
                <FolderGit2 className="w-4 h-4 text-indigo-400" />
              ) : (
                <BookOpen className="w-4 h-4 text-cyan-400" />
              )}
              {feedback.relatedProjectTitle || feedback.relatedCourseTitle || 'Core Capstone Review'}
            </span>

            <span className="px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-300 font-mono text-xs border border-violet-500/20 font-semibold">
              {feedback.category}
            </span>
          </div>

          <Button
            onClick={handleNavigateRelated}
            variant="outline"
            size="sm"
            rightIcon={ArrowUpRight}
            className="text-xs h-8"
          >
            {feedback.relatedProjectId ? 'View In Projects' : 'View In Courses'}
          </Button>
        </div>

        {/* Full narrative assessment */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
            Architectural Narrative & Rubric Review
          </h4>
          <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            {feedback.summary || feedback.feedback}
          </div>
        </div>

        {/* Strengths and Improvement Areas columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths */}
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Verified Strengths</span>
            </div>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
              {(feedback.strengths || ['High modularity', 'Clean documentation']).map(
                (str, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{str}</span>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Improvement areas */}
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>Priority Improvement Areas</span>
            </div>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
              {(feedback.improvementAreas || ['Add end-to-end integration tests']).map(
                (imp, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{imp}</span>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        {/* Action items checklist */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
                Assigned Action Items
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Check off items as you resolve reviewer feedback.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[var(--text-primary)] px-2.5 py-1 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)]">
              {completedCount} / {totalCount} completed
            </span>
          </div>

          <div className="space-y-2">
            {(feedback.actionItems || []).map((item) => (
              <FeedbackActionItem
                key={item.id}
                item={item}
                onToggle={handleToggleAction}
                onRemove={handleRemoveAction}
              />
            ))}

            {(feedback.actionItems || []).length === 0 && (
              <div className="p-4 rounded-xl border border-dashed border-[var(--border)] text-center text-xs text-[var(--text-muted)]">
                No active action items assigned for this review.
              </div>
            )}
          </div>

          {/* Inline Add Action Item Form */}
          <form onSubmit={handleAddAction} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newActionText}
              onChange={(e) => setNewActionText(e.target.value)}
              placeholder="Add another action item (e.g. 'Add unit test for NaN inputs')..."
              className="flex-1 text-xs px-3 py-2 rounded-xl bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] focus:outline-none focus:border-indigo-500"
            />
            <select
              value={newActionPriority}
              onChange={(e) => setNewActionPriority(e.target.value)}
              className="text-xs px-2.5 py-2 rounded-xl bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              leftIcon={Plus}
              className="text-xs h-9 px-3"
            >
              Add
            </Button>
          </form>
        </div>

        {/* Review Timeline */}
        {feedback.timeline && feedback.timeline.length > 0 && (
          <div className="pt-3 border-t border-[var(--border)]">
            <FeedbackTimeline timeline={feedback.timeline} />
          </div>
        )}

        {/* Modal Action Controls Footer */}
        <div className="pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Button
            onClick={handleToggleStatus}
            variant="outline"
            size="sm"
            leftIcon={CheckCheck}
            className="text-xs"
          >
            Change Status (Current: {feedback.status})
          </Button>

          <div className="flex items-center gap-2 justify-end">
            <Button onClick={onClose} variant="ghost" size="sm" className="text-xs">
              Close
            </Button>
            <Button onClick={handleNavigateRelated} variant="primary" size="sm" className="text-xs">
              Open Related Work
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
