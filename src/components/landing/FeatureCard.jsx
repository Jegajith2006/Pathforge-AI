import React from 'react';
import {
  Target,
  GitBranch,
  ShieldCheck,
  Users,
  Award,
  Building2,
  ArrowUpRight,
} from 'lucide-react';
import { Badge } from '../common/Badge';

const iconMap = {
  Target,
  GitBranch,
  ShieldCheck,
  Users,
  Award,
  Building2,
};

export const FeatureCard = ({ feature, index }) => {
  const IconComponent = iconMap[feature.icon] || Target;

  return (
    <div
      className="
        group
        relative
        p-6
        sm:p-7
        rounded-2xl
        bg-[var(--surface)]
        border
        border-[var(--border)]
        dark:bg-[#0E1326]
        dark:border-slate-800/80
        hover:border-indigo-500/50
        hover:bg-[var(--surface-hover)]
        dark:hover:bg-[#13192F]
        shadow-xs
        hover:shadow-lg
        dark:shadow-slate-950/30
        dark:hover:shadow-indigo-950/30
        transition-all
        duration-300
        hover:-translate-y-1
        flex
        flex-col
        justify-between
      "
    >
      {/* Top row: Icon + Tag */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500/20 group-hover:border-indigo-400/40 group-hover:text-indigo-700 dark:group-hover:text-cyan-300 transition-colors">
            <IconComponent className="w-5 h-5" />
          </div>
          {feature.tag && (
            <Badge variant="indigo" size="sm">
              {feature.tag}
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-[var(--text-primary)] font-display group-hover:text-indigo-600 dark:group-hover:text-cyan-200 transition-colors">
          {feature.title}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2.5 leading-relaxed">
          {feature.description}
        </p>
      </div>

      {/* Subtle Bottom Accent Indicator */}
      <div className="pt-5 mt-5 border-t border-[var(--border)] dark:border-slate-800/60 flex items-center justify-between text-xs font-semibold text-[var(--text-muted)] group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
        <span>Explore Intelligence Module</span>
        <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </div>
  );
};

export default FeatureCard;
