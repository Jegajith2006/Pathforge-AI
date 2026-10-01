import React from 'react';
import { EvidenceItem } from '../../types';
import {
  Github,
  Award,
  Globe,
  FileText,
  ClipboardCheck,
  Building2,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface EvidenceCardProps {
  item: EvidenceItem;
  onView?: (item: EvidenceItem) => void;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ item, onView }) => {
  const getTypeIcon = () => {
    switch (item.type) {
      case 'GitHub Repository':
        return <Github className="w-5 h-5 text-purple-400" />;
      case 'Certificate':
        return <Award className="w-5 h-5 text-amber-400" />;
      case 'Portfolio Project':
        return <Globe className="w-5 h-5 text-sky-400" />;
      case 'Assessment Result':
        return <ClipboardCheck className="w-5 h-5 text-emerald-400" />;
      case 'Internship Record':
        return <Building2 className="w-5 h-5 text-blue-400" />;
      default:
        return <FileText className="w-5 h-5 text-indigo-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (item.verificationStatus) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified
          </span>
        );
      case 'Pending Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            Pending Review
          </span>
        );
      case 'Needs Revision':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            Needs Revision
          </span>
        );
    }
  };

  return (
    <div className="bg-[#151C2E] border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all duration-300 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            {getTypeIcon()}
          </div>
          {getStatusBadge()}
        </div>

        <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block">
          {item.type}
        </span>
        <h3 className="text-base font-bold text-white mt-1 font-display tracking-tight">
          {item.title}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Related Skill: <strong className="text-slate-200">{item.relatedSkill}</strong>
        </p>

        {item.notes && (
          <p className="text-xs text-slate-400 mt-3 p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 leading-relaxed">
            {item.notes}
          </p>
        )}

        {item.score && (
          <div className="mt-3 flex items-center justify-between text-xs font-medium text-slate-400 border-t border-slate-800/60 pt-2">
            <span>Score/Benchmark:</span>
            <span className="text-emerald-400 font-bold">{item.score}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-[11px] text-slate-500">Submitted {item.submissionDate}</span>

        <a
          href={item.linkUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
        >
          View Artifact
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
