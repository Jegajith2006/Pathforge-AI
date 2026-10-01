import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { FeedbackRating } from './FeedbackRating';
import { useToast } from '../../context/ToastContext';
import { PlusCircle, Star, Sparkles } from 'lucide-react';

export const AddFeedbackModal = ({ isOpen, onClose, onAddFeedback }) => {
  const { addToast } = useToast();

  const [mentorName, setMentorName] = useState('');
  const [mentorRole, setMentorRole] = useState('Senior ML Engineer');
  const [company, setCompany] = useState('Google');
  const [category, setCategory] = useState('Projects');
  const [relatedTitle, setRelatedTitle] = useState('Fraud Detection Pipeline');
  const [rating, setRating] = useState(4.5);
  const [status, setStatus] = useState('Reviewed');
  const [summary, setSummary] = useState('');
  const [strengthsText, setStrengthsText] = useState('');
  const [improvementText, setImprovementText] = useState('');
  const [actionsText, setActionsText] = useState('');
  const [skillsText, setSkillsText] = useState('Python, Machine Learning');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!mentorName.trim()) {
      addToast('Missing Required Field', 'Please provide mentor name.', 'warning');
      return;
    }

    if (!summary.trim()) {
      addToast('Missing Required Field', 'Please provide feedback summary.', 'warning');
      return;
    }

    const actionItems = actionsText
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text, idx) => ({
        id: `ai_${Date.now()}_${idx}`,
        text,
        completed: false,
        priority: 'High',
      }));

    const strengths = strengthsText
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);

    const improvementAreas = improvementText
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);

    const skillsTagged = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newFeedback = {
      id: `mf-${Date.now()}`,
      mentorName: mentorName.trim(),
      mentorRole: mentorRole.trim(),
      company: company.trim(),
      avatarInitials: mentorName
        .trim()
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase(),
      category,
      relatedProjectId: category === 'Projects' ? 'proj-custom' : undefined,
      relatedCourseId: category === 'Courses' ? 'course-custom' : undefined,
      relatedProjectTitle: relatedTitle.trim(),
      rating: Number(rating),
      rubricScore: `${Number(rating).toFixed(1)} / 5.0`,
      status,
      date: 'Just now',
      summary: summary.trim(),
      strengths: strengths.length > 0 ? strengths : ['Strong foundational execution'],
      improvementAreas:
        improvementAreas.length > 0 ? improvementAreas : ['Continue test coverage'],
      actionItems,
      skillsTagged,
      reviewType: `${category} Review`,
      timeline: [
        {
          date: 'Just now',
          action: 'Manual feedback logged into PathForge',
          actor: mentorName.trim(),
        },
      ],
    };

    onAddFeedback(newFeedback);
    addToast('Feedback Saved', `Review from ${mentorName} added to your profile.`, 'success');

    // Reset form
    setMentorName('');
    setSummary('');
    setStrengthsText('');
    setImprovementText('');
    setActionsText('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Mentor Feedback"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1 text-xs max-h-[78vh] overflow-y-auto pr-1">
        <p className="text-xs text-[var(--text-secondary)]">
          Manually log verbal reviews, PR comments, or 1:1 evaluation rubrics from industry mentors and technical advisors.
        </p>

        {/* Mentor Name & Role */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
              Mentor Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={mentorName}
              onChange={(e) => setMentorName(e.target.value)}
              placeholder="e.g. Alex Chen"
              className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
              Role & Organization
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={mentorRole}
                onChange={(e) => setMentorRole(e.target.value)}
                placeholder="Role (e.g. Staff Engineer)"
                className="text-xs px-3 py-2 rounded-xl bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company (e.g. Stripe)"
                className="text-xs px-3 py-2 rounded-xl bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Category, Topic & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="Projects">Projects</option>
              <option value="Skills">Skills</option>
              <option value="Courses">Courses</option>
              <option value="Career Readiness">Career Readiness</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
              Related Project or Work
            </label>
            <input
              type="text"
              value={relatedTitle}
              onChange={(e) => setRelatedTitle(e.target.value)}
              placeholder="e.g. Fraud Detection Pipeline"
              className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="Reviewed">Reviewed</option>
              <option value="Action Required">Action Required</option>
              <option value="Resolved">Resolved</option>
              <option value="New">New</option>
            </select>
          </div>
        </div>

        {/* Interactive Rating */}
        <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)]/60 border border-[var(--border)] flex items-center justify-between">
          <div>
            <span className="font-semibold text-[var(--text-primary)] block">
              Rubric Rating
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">
              Click stars to set score from 1.0 to 5.0
            </span>
          </div>
          <FeedbackRating
            rating={rating}
            size="lg"
            interactive
            onChange={(val) => setRating(val)}
          />
        </div>

        {/* Feedback Narrative Summary */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
            Feedback Summary / Rubric Narrative <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Detailed assessment of architecture, code structure, problem solving, or interview answers..."
            className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        {/* Strengths & Improvement Areas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
              Key Strengths (One per line)
            </label>
            <textarea
              rows={2}
              value={strengthsText}
              onChange={(e) => setStrengthsText(e.target.value)}
              placeholder="e.g. Robust cross-validation&#10;Clean OOP transformers"
              className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
              Improvement Areas (One per line)
            </label>
            <textarea
              rows={2}
              value={improvementText}
              onChange={(e) => setImprovementText(e.target.value)}
              placeholder="e.g. Add latency timing middleware&#10;Add unit tests for NaN values"
              className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* Action Items */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
            Action Items (One task per line)
          </label>
          <textarea
            rows={2}
            value={actionsText}
            onChange={(e) => setActionsText(e.target.value)}
            placeholder="e.g. Generate SHAP summary plot&#10;Benchmark Platt Scaling against Isotonic Regression"
            className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        {/* Tagged Skills */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
            Skills Tagged (Comma-separated)
          </label>
          <input
            type="text"
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
            placeholder="e.g. FastAPI, Docker, Model Evaluation"
            className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Footer buttons */}
        <div className="pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2.5">
          <Button type="button" onClick={onClose} variant="ghost" size="sm" className="text-xs">
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" leftIcon={PlusCircle} className="text-xs">
            Save Feedback
          </Button>
        </div>
      </form>
    </Modal>
  );
};
