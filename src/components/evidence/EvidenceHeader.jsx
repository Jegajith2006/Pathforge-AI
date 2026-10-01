import React from 'react';
import { Plus, ShieldCheck, CheckCircle2, Clock, Sparkles, FolderArchive } from 'lucide-react';

export const EvidenceHeader = ({
  totalCount = 12,
  verifiedCount = 8,
  pendingCount = 3,
  portfolioReadyCount = 6,
  onOpenAddModal,
}) => {
  return (
    <div className="space-y-4">
      {/* Top Title & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Proofs & Credentials
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text-primary)] tracking-tight">
            Evidence Vault
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
            Collect and organize proof of your skills, projects, certifications, and learning achievements.
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={onOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all active:scale-95 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Evidence</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <FolderArchive className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-[var(--text-muted)] truncate">Total Proofs</div>
            <div className="text-xs font-bold text-[var(--text-primary)] font-mono">{totalCount} Artifacts</div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-[var(--text-muted)] truncate">Verified</div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">{verifiedCount} Verified</div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-[var(--text-muted)] truncate">Pending Review</div>
            <div className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">{pendingCount} Pending</div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-[var(--text-muted)] truncate">Portfolio Ready</div>
            <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400 font-mono">{portfolioReadyCount} Showcase Ready</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvidenceHeader;
