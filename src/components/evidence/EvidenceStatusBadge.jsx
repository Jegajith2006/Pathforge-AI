import React from 'react';
import { CheckCircle2, Clock, AlertCircle, Sparkles } from 'lucide-react';

export const EvidenceStatusBadge = ({ status, portfolioReady = false }) => {
  const getStatusConfig = (s) => {
    switch (s) {
      case 'Verified':
        return {
          icon: CheckCircle2,
          label: 'Verified',
          style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        };
      case 'Pending Review':
      case 'In Review':
        return {
          icon: Clock,
          label: 'Pending Review',
          style: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        };
      case 'Rejected':
      case 'Needs Revision':
        return {
          icon: AlertCircle,
          label: s === 'Rejected' ? 'Rejected' : 'Needs Revision',
          style: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        };
      default:
        return {
          icon: Clock,
          label: status || 'Pending',
          style: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
        };
    }
  };

  const { icon: Icon, label, style } = getStatusConfig(status);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{label}</span>
      </span>

      {portfolioReady && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          <span>Portfolio Ready</span>
        </span>
      )}
    </div>
  );
};

export default EvidenceStatusBadge;
