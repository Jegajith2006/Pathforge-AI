import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  File,
  CheckCircle2,
  AlertCircle,
  Plus,
  Link as LinkIcon,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { mockCoursesInProgress, mockProjectsInProgress } from '../../data/mockData';

const EVIDENCE_TYPES = [
  'Certificate',
  'Project Repository',
  'Project Report',
  'Assessment Result',
  'Portfolio Link',
  'Mentor Validation',
  'Internship Experience',
  'Competition Achievement',
];

const SKILLS_LIST = [
  'Python',
  'Machine Learning',
  'SQL',
  'Statistics',
  'Deep Learning',
  'Model Deployment',
  'Data Analysis',
  'Model Evaluation',
  'MLOps',
];

export const AddEvidenceModal = ({ isOpen, onClose, onAddEvidence }) => {
  const { addToast } = useToast();

  const [title, setTitle] = useState('');
  const [type, setType] = useState('Project Repository');
  const [relatedSkill, setRelatedSkill] = useState('Machine Learning');
  const [relatedContext, setRelatedContext] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [completionDate, setCompletionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [portfolioReady, setPortfolioReady] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleSimulatedFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile({
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile({
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Evidence title is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (url && !/^https?:\/\//i.test(url)) {
      newErrors.url = 'URL must begin with http:// or https://';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      addToast('Please complete all required fields.', 'error');
      return;
    }

    const newItem = {
      id: `ev-${Date.now()}`,
      title: title.trim(),
      type,
      relatedSkill,
      relatedCourseId: relatedContext.startsWith('course-') ? relatedContext : undefined,
      relatedProjectId: relatedContext.startsWith('proj-') ? relatedContext : undefined,
      description: description.trim(),
      url: url.trim() || undefined,
      fileName: selectedFile?.name || (type === 'Certificate' ? 'verified_certificate.pdf' : 'project_archive.zip'),
      dateAdded: new Date().toISOString().split('T')[0],
      completionDate: completionDate || new Date().toISOString().split('T')[0],
      verificationStatus: 'Pending Review',
      portfolioReady,
      verificationDetails: 'Under automated code and syllabus verification queue.',
      credentialHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
    };

    onAddEvidence(newItem);
    addToast(`"${title}" submitted for verification. Status: Pending Review.`, 'success');

    // Reset state & close
    setTitle('');
    setType('Project Repository');
    setDescription('');
    setUrl('');
    setSelectedFile(null);
    setErrors({});
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 id="modal-title" className="text-base font-bold font-display text-[var(--text-primary)]">
                Deposit New Evidence
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Submit an authenticated artifact, code repository, or certification for verification.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar text-xs">
          {/* Title */}
          <div className="space-y-1">
            <label className="block font-semibold text-[var(--text-primary)]">
              Evidence Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Distributed Model Serving with Ray Train"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl bg-[var(--surface-secondary)] border text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.title ? 'border-rose-500' : 'border-[var(--border)]'
              }`}
            />
            {errors.title && <p className="text-rose-500 text-[11px]">{errors.title}</p>}
          </div>

          {/* Type & Skill Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block font-semibold text-[var(--text-primary)]">
                Evidence Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {EVIDENCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-[var(--text-primary)]">
                Primary Related Skill <span className="text-rose-500">*</span>
              </label>
              <select
                value={relatedSkill}
                onChange={(e) => setRelatedSkill(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {SKILLS_LIST.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Associated Course/Project */}
          <div className="space-y-1">
            <label className="block font-semibold text-[var(--text-primary)]">
              Associated Course or Project (Optional)
            </label>
            <select
              value={relatedContext}
              onChange={(e) => setRelatedContext(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Independent Study / General Proof</option>
              <optgroup label="Courses">
                {mockCoursesInProgress.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Projects">
                {mockProjectsInProgress.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block font-semibold text-[var(--text-primary)]">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Outline architecture, performance benchmarks, AUC, unit test coverage, or key achievements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl bg-[var(--surface-secondary)] border text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.description ? 'border-rose-500' : 'border-[var(--border)]'
              }`}
            />
            {errors.description && <p className="text-rose-500 text-[11px]">{errors.description}</p>}
          </div>

          {/* URL */}
          <div className="space-y-1">
            <label className="block font-semibold text-[var(--text-primary)]">
              Artifact or Repository URL (Optional)
            </label>
            <div className="relative">
              <LinkIcon className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                placeholder="https://github.com/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--surface-secondary)] border text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.url ? 'border-rose-500' : 'border-[var(--border)]'
                }`}
              />
            </div>
            {errors.url && <p className="text-rose-500 text-[11px]">{errors.url}</p>}
          </div>

          {/* Completion Date & Portfolio Ready Checkbox */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-1">
            <div className="space-y-1">
              <label className="block font-semibold text-[var(--text-primary)]">
                Completion Date
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-5">
              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] cursor-pointer hover:border-indigo-500/30 transition-colors">
                <input
                  type="checkbox"
                  checked={portfolioReady}
                  onChange={(e) => setPortfolioReady(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-[var(--border)]"
                />
                <div className="min-w-0">
                  <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    Portfolio Ready
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)]">
                    Feature directly on public employer profile
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* File Upload Area */}
          <div className="space-y-1 pt-1">
            <label className="block font-semibold text-[var(--text-primary)]">
              File Attachment (PDF, ZIP, IPYNB, JSON)
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="p-4 border-2 border-dashed border-[var(--border)] hover:border-indigo-500/50 rounded-xl bg-[var(--surface-secondary)]/40 text-center transition-colors relative"
            >
              <input
                type="file"
                id="file-upload"
                onChange={handleSimulatedFileUpload}
                className="hidden"
                accept=".pdf,.zip,.ipynb,.json,.md,.tar.gz"
              />

              {selectedFile ? (
                <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] text-left">
                  <div className="flex items-center gap-2 min-w-0">
                    <File className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--text-primary)] truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] font-mono">
                        {selectedFile.size}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-1 text-rose-500 hover:bg-rose-500/10 rounded"
                    aria-label="Remove attached file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label htmlFor="file-upload" className="cursor-pointer block space-y-1">
                  <UploadCloud className="w-7 h-7 text-indigo-500 mx-auto" />
                  <div className="font-semibold text-[var(--text-primary)]">
                    Drag and drop file here, or{' '}
                    <span className="text-indigo-600 dark:text-indigo-400 underline">browse</span>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Supports code archives, certificates, or evaluation notebooks up to 50MB.
                  </p>
                </label>
              )}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[var(--border)] bg-[var(--surface-secondary)]/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--card-bg)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
          >
            Deposit Evidence
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEvidenceModal;
