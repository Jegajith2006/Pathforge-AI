import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, CheckCircle2, AlertCircle, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '../common/Button';
import { companyMatchData } from '../../data/companyMatchData';

/**
 * CompanyMatchTeaser component
 * Dashboard widget highlighting live employer target readiness benchmarks and direct link to /company-match.
 */
export const CompanyMatchTeaser = () => {
  const navigate = useNavigate();
  const topMatches = companyMatchData.slice(0, 3);

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm hover:border-indigo-500/30 transition-all duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--accent-surface)] text-indigo-600 dark:text-cyan-400 border border-indigo-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold font-display text-[var(--text-primary)]">
                Company Readiness Matching
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-2.5 h-2.5" /> Live Benchmarks
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Compare your current verified skills against active hiring bars at tier-1 tech employers.
            </p>
          </div>
        </div>

        <Link
          to="/company-match"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-cyan-400 hover:text-indigo-500 transition-colors shrink-0"
        >
          <span>View All Companies</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 3 Top Company Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        {topMatches.map((item) => {
          const matchedCount = item.requiredSkills.filter(
            (s) => s.status === 'Matched' || s.status === 'Close Match'
          ).length;
          const topGap = item.priorityGaps[0];

          return (
            <div
              key={item.id}
              onClick={() => navigate('/company-match')}
              className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-indigo-500/40 transition-all cursor-pointer group flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 text-white text-xs font-extrabold flex items-center justify-center font-display shadow-sm">
                      {item.logoText || item.company.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)] font-display group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">
                        {item.company}
                      </h4>
                      <p className="text-[11px] text-[var(--text-muted)] truncate max-w-[140px]">
                        {item.role}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black font-display text-indigo-600 dark:text-cyan-400">
                      {item.matchScore}%
                    </span>
                    <span className="block text-[10px] font-mono text-[var(--text-muted)] leading-none">
                      match
                    </span>
                  </div>
                </div>

                {/* Match bar */}
                <div className="w-full bg-[var(--surface-tertiary)] h-1.5 rounded-full overflow-hidden mt-3">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                    style={{ width: `${item.matchScore}%` }}
                  />
                </div>

                {/* Key specs */}
                <div className="pt-3 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>{matchedCount} Matched Skills</span>
                    </span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {item.salaryRange.split('+')[0].trim()}
                    </span>
                  </div>

                  {topGap && (
                    <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-[10px] font-mono pt-1">
                      <span className="flex items-center gap-1 truncate">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span className="truncate">Top Gap: {topGap.skill}</span>
                      </span>
                      <span className="font-semibold shrink-0">-{topGap.gap}%</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span className="font-mono">{item.readinessLevel}</span>
                <span className="group-hover:translate-x-1 transition-transform text-indigo-600 dark:text-cyan-400 font-semibold">
                  Inspect →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Call to action strip */}
      <div className="mt-4 p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <TrendingUp className="w-4 h-4 text-cyan-500 shrink-0" />
          <span>
            Closing your <strong className="text-[var(--text-primary)]">PyTorch</strong> &amp; <strong className="text-[var(--text-primary)]">Docker</strong> gaps raises Stripe match to 91%.
          </span>
        </div>
        <Button
          variant="primary"
          size="xs"
          onClick={() => navigate('/company-match')}
        >
          Compare All Roles
        </Button>
      </div>
    </div>
  );
};

export default CompanyMatchTeaser;
