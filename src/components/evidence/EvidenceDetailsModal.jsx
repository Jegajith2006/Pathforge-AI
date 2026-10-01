import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Calendar,
  Sparkles,
  ShieldCheck,
  FileCode2,
  Trash2,
  Edit3,
  Check,
  Download,
  Hash,
  AlertTriangle,
  FolderGit2,
  CheckCircle2,
} from 'lucide-react';
import { EvidenceTypeBadge } from './EvidenceTypeBadge';
import { EvidenceStatusBadge } from './EvidenceStatusBadge';
import { useToast } from '../../context/ToastContext';
import { mockCoursesInProgress, mockProjectsInProgress } from '../../data/mockData';

export const EvidenceDetailsModal = ({
  item,
  isOpen,
  onClose,
  onTogglePortfolioReady,
  onUpdateEvidence,
  onDeleteEvidence,
}) => {
  const { addToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit fields
  const [editTitle, setEditTitle] = useState(item?.title || '');
  const [editDescription, setEditDescription] = useState(item?.description || '');
  const [editUrl, setEditUrl] = useState(item?.url || item?.linkUrl || '');
  const [editPortfolioReady, setEditPortfolioReady] = useState(!!item?.portfolioReady);

  // Reset editing on item change
  React.useEffect(() => {
    if (item) {
      setEditTitle(item.title || '');
      setEditDescription(item.description || '');
      setEditUrl(item.url || item.linkUrl || '');
      setEditPortfolioReady(!!item.portfolioReady);
      setIsEditing(false);
      setShowDeleteConfirm(false);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const relatedCourse = mockCoursesInProgress.find((c) => c.id === item.relatedCourseId);
  const relatedProject = mockProjectsInProgress.find((p) => p.id === item.relatedProjectId);

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editDescription.trim()) {
      addToast('Title and description cannot be blank.', 'error');
      return;
    }

    const updated = {
      ...item,
      title: editTitle.trim(),
      description: editDescription.trim(),
      url: editUrl.trim() || undefined,
      linkUrl: editUrl.trim() || undefined,
      portfolioReady: editPortfolioReady,
    };

    onUpdateEvidence(updated);
    setIsEditing(false);
    addToast('Evidence artifact updated successfully.', 'success');
  };

  const handleConfirmDelete = () => {
    onDeleteEvidence(item.id);
    setShowDeleteConfirm(false);
    addToast(`"${item.title}" removed from vault.`, 'info');
    onClose();
  };

  const handleMockDownload = () => {
    addToast(`Downloading verified artifact "${item.fileName || 'evidence_artifact.zip'}"...`, 'info');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="details-modal-title"
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="space-y-1.5 min-w-0 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <EvidenceTypeBadge type={item.type} />
              <EvidenceStatusBadge
                status={item.verificationStatus}
                portfolioReady={item.portfolioReady}
              />
            </div>
            {!isEditing && (
              <h2
                id="details-modal-title"
                className="text-lg font-bold font-display text-[var(--text-primary)]"
              >
                {item.title}
              </h2>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar text-xs">
          {/* Delete Confirmation Warning */}
          {showDeleteConfirm && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Confirm Permanent Deletion</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Are you sure you want to remove <strong>{item.title}</strong> from your cryptographic vault? This will also remove it from any linked job applications.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors"
                >
                  Yes, Delete Artifact
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--card-bg)] text-[var(--text-primary)] border border-[var(--border)] font-semibold text-xs hover:bg-[var(--surface-hover)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {isEditing ? (
            /* Inline Edit Mode */
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="block font-semibold text-[var(--text-primary)]">
                  Artifact Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[var(--text-primary)]">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[var(--text-primary)]">
                  External URL
                </label>
                <input
                  type="url"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editPortfolioReady}
                  onChange={(e) => setEditPortfolioReady(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-[var(--text-primary)]">
                  Include in Public Showcase Portfolio
                </span>
              </label>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--surface-hover)] font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            /* Read Mode */
            <div className="space-y-5">
              {/* Description Section */}
              <div className="space-y-1">
                <h4 className="font-semibold text-[var(--text-primary)] text-xs">
                  Artifact Abstract & Methodology
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--surface-secondary)]/50 p-3.5 rounded-xl border border-[var(--border)]">
                  {item.description}
                </p>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--surface-secondary)]/60 border border-[var(--border)] space-y-1">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                    Target Skill
                  </span>
                  <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    {item.relatedSkill}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--surface-secondary)]/60 border border-[var(--border)] space-y-1">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                    Curriculum / Project Reference
                  </span>
                  <div className="font-bold text-[var(--text-primary)] truncate" title={relatedCourse?.title || relatedProject?.title || 'Independent Work'}>
                    {relatedCourse?.title || relatedProject?.title || 'Independent Work'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--surface-secondary)]/60 border border-[var(--border)] space-y-1">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                    Date Deposited
                  </span>
                  <div className="font-mono text-[var(--text-primary)] font-semibold">
                    {item.dateAdded || item.submissionDate || '2026-08-28'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--surface-secondary)]/60 border border-[var(--border)] space-y-1">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                    Completion Date
                  </span>
                  <div className="font-mono text-[var(--text-primary)] font-semibold">
                    {item.completionDate || '2026-08-25'}
                  </div>
                </div>
              </div>

              {/* Audit Verification / Credential Hash */}
              <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verification & Audit Trail</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  {item.verificationDetails || 'Cryptographically verified with sha256 checksum and automated grading pipeline.'}
                </p>
                <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-[var(--text-muted)]">
                  <Hash className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Proof ID:</span>
                  <span className="text-[var(--text-primary)] font-semibold truncate">
                    {item.credentialHash || `0x${item.id}-verified-sha256`}
                  </span>
                </div>
              </div>

              {/* Attached File & External Link */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileCode2 className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold text-[var(--text-primary)] truncate">
                      {item.fileName || 'verified_artifact.zip'}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono">
                      Authentic Vault File • SHA-256 Validated
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleMockDownload}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--card-bg)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Download</span>
                  </button>

                  {(item.url || item.linkUrl) && (
                    <a
                      href={item.url || item.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shadow-sm"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-6 py-4 border-t border-[var(--border)] bg-[var(--surface-secondary)]/30">
          <div className="flex items-center gap-2">
            {/* Toggle Portfolio Ready */}
            <button
              type="button"
              onClick={() => {
                onTogglePortfolioReady(item.id);
                addToast(
                  item.portfolioReady
                    ? `Removed "${item.title}" from Showcase Portfolio.`
                    : `Marked "${item.title}" as Portfolio Ready!`,
                  'success'
                );
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                item.portfolioReady
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20'
                  : 'bg-[var(--card-bg)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>{item.portfolioReady ? 'Portfolio Ready ✓' : 'Mark Portfolio Ready'}</span>
            </button>

            {/* Edit Button */}
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[var(--card-bg)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>Edit</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Delete Trigger */}
            {!showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                title="Delete Artifact"
                aria-label="Delete Artifact"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--card-bg)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvidenceDetailsModal;
