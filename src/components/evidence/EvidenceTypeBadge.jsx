import React from 'react';
import {
  Award,
  FolderGit2,
  FileText,
  ClipboardCheck,
  Globe,
  ShieldCheck,
  Briefcase,
  Trophy,
} from 'lucide-react';

export const EvidenceTypeBadge = ({ type }) => {
  const getBadgeConfig = (evidenceType) => {
    switch (evidenceType) {
      case 'Certificate':
        return {
          icon: Award,
          label: 'Certificate',
          style: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        };
      case 'Project Repository':
      case 'GitHub Repository':
        return {
          icon: FolderGit2,
          label: 'Project Repository',
          style: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        };
      case 'Project Report':
        return {
          icon: FileText,
          label: 'Project Report',
          style: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        };
      case 'Assessment Result':
        return {
          icon: ClipboardCheck,
          label: 'Assessment Result',
          style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        };
      case 'Portfolio Link':
      case 'Portfolio Project':
        return {
          icon: Globe,
          label: 'Portfolio Link',
          style: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
        };
      case 'Mentor Validation':
        return {
          icon: ShieldCheck,
          label: 'Mentor Validation',
          style: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        };
      case 'Internship Experience':
      case 'Internship Record':
        return {
          icon: Briefcase,
          label: 'Internship Experience',
          style: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
        };
      case 'Competition Achievement':
        return {
          icon: Trophy,
          label: 'Competition Achievement',
          style: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        };
      default:
        return {
          icon: FileText,
          label: evidenceType || 'Evidence',
          style: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
        };
    }
  };

  const { icon: Icon, label, style } = getBadgeConfig(type);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
};

export default EvidenceTypeBadge;
