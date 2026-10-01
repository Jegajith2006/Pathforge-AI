import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';
import { Send, Sparkles, FolderGit2, CheckCircle2 } from 'lucide-react';

export const RequestFeedbackModal = ({ isOpen, onClose, onRequestSubmitted }) => {
  const { addToast } = useToast();

  const [project, setProject] = useState('Customer Churn Prediction');
  const [reviewType, setReviewType] = useState('Project Review');
  const [mentorPreference, setMentorPreference] = useState('Any Staff ML Engineer');
  const [repoLink, setRepoLink] = useState('https://github.com/pathforge-learner/ml-churn-prediction');
  const [focusAreas, setFocusAreas] = useState('Model evaluation strategy, latency in FastAPI routes, and Docker deployment configurations.');
  const [urgency, setUrgency] = useState('Standard');

  const handleSubmit = (e) => {
    e.preventDefault();

    const newRequestFeedback = {
      id: `mf-${Date.now()}`,
      mentorName: mentorPreference === 'Any Staff ML Engineer' ? 'AI Review Engine & Staff Pool' : mentorPreference,
      mentorRole: 'Staff Engineer & Review Board',
      company: 'PathForge Verified Network',
      avatarInitials: 'PF',
      category: reviewType === 'Career Readiness Review' ? 'Career Readiness' : 'Projects',
      relatedProjectId: 'proj-new',
      relatedProjectTitle: project,
      rating: 0,
      rubricScore: 'Pending Review',
      status: 'New',
      date: 'Just requested',
      summary: `Review request queued: Focus on ${focusAreas.slice(0, 100)}... Assigned to reviewer network.`,
      strengths: ['Pending initial mentor evaluation'],
      improvementAreas: ['Pending rubric assessment'],
      actionItems: [
        {
          id: `ai_${Date.now()}_1`,
          text: 'Await mentor architectural comments & code annotations',
          completed: false,
          priority: 'High',
        },
      ],
      skillsTagged: ['Code Review', 'Architecture', 'Best Practices'],
      reviewType,
      timeline: [
        {
          date: 'Just now',
          action: `Submitted ${reviewType} request`,
          actor: 'Jegajith',
          notes: focusAreas,
        },
      ],
    };

    if (onRequestSubmitted) {
      onRequestSubmitted(newRequestFeedback);
    }

    addToast(
      'Feedback Request Submitted',
      `Your request for ${project} has been sent to mentors.`,
      'success'
    );

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Mentor Feedback"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1 text-xs">
        <p className="text-xs text-[var(--text-secondary)]">
          Submit your work for asynchronous review by staff engineers and senior industry mentors.
        </p>

        <div>
          <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
            Select Project or Learning Artifact
          </label>
          <select
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="Customer Churn Prediction">Customer Churn Prediction (Project #1)</option>
            <option value="Fraud Detection Pipeline">Fraud Detection Pipeline (Project #2)</option>
            <option value="FastAPI Production Inference Container">FastAPI Production Inference Container (Project #3)</option>
            <option value="Machine Learning Portfolio & Resume">Machine Learning Portfolio & Resume</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
              Review Type
            </label>
            <select
              value={reviewType}
              onChange={(e) => setReviewType(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="Project Review">Project Review</option>
              <option value="Skill Review">Skill Assessment</option>
              <option value="Course Review">Course Milestone</option>
              <option value="Career Readiness Review">Career & Portfolio Review</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
              Preferred Reviewer
            </label>
            <select
              value={mentorPreference}
              onChange={(e) => setMentorPreference(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="Any Staff ML Engineer">Next Available Staff Mentor</option>
              <option value="Dr. Arun Kumar">Dr. Arun Kumar (ML Systems)</option>
              <option value="Sarah Chen">Sarah Chen (Stripe)</option>
              <option value="Marcus Vance">Marcus Vance (MLOps & Career)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
            Repository URL or PR Link
          </label>
          <input
            type="url"
            value={repoLink}
            onChange={(e) => setRepoLink(e.target.value)}
            placeholder="https://github.com/username/repository"
            className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
            What should mentors focus on?
          </label>
          <textarea
            rows={3}
            value={focusAreas}
            onChange={(e) => setFocusAreas(e.target.value)}
            placeholder="Specific questions (e.g., Is my feature transformation pipeline cleanly structured? How can I improve my Dockerfile?)..."
            className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
          <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Typical turnaround: 24–48 hours
          </span>

          <div className="flex items-center gap-2">
            <Button type="button" onClick={onClose} variant="ghost" size="sm" className="text-xs">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" leftIcon={Send} className="text-xs">
              Submit Request
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
