import React from 'react';
import {
  Building2,
  Briefcase,
  ChevronDown,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { availableCompanies, companyRolesMap } from '../../data/companyMatchData';

/**
 * CompanyRoleSelector component
 * Controlled selector for target company and dynamic role options.
 */
export const CompanyRoleSelector = ({
  selectedCompany = 'Google',
  selectedRole = 'Machine Learning Engineer',
  onCompanyChange,
  onRoleChange,
  className = '',
}) => {
  const currentRoles = companyRolesMap[selectedCompany] || [];

  const handleCompanyChange = (e) => {
    const newCompany = e.target.value;
    onCompanyChange?.(newCompany);
    // Auto-select first role for the new company
    const newRoles = companyRolesMap[newCompany] || [];
    if (newRoles.length > 0 && (!newRoles.includes(selectedRole))) {
      onRoleChange?.(newRoles[0]);
    }
  };

  const handleRoleChange = (e) => {
    onRoleChange?.(e.target.value);
  };

  return (
    <div
      className={`
        p-5
        sm:p-6
        rounded-2xl
        bg-[var(--card-bg)]
        border
        border-[var(--card-border)]
        shadow-sm
        transition-colors
        duration-200
        ${className}
      `}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Title & Context */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-indigo-600 dark:text-cyan-400">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>TARGET BENCHMARK SELECTOR</span>
          </div>
          <h2 className="text-lg font-bold font-display text-[var(--text-primary)]">
            Analyze Role Fit & Readiness Rubric
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Select a hiring organization and position to calculate your verified skill alignment.
          </p>
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:w-auto w-full">
          {/* Company Selector */}
          <div className="space-y-1.5 min-w-[200px]">
            <label
              htmlFor="company-select"
              className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Target Company</span>
            </label>
            <div className="relative">
              <select
                id="company-select"
                value={selectedCompany}
                onChange={handleCompanyChange}
                className="
                  w-full
                  appearance-none
                  px-3.5
                  py-2.5
                  pr-9
                  rounded-xl
                  text-xs
                  font-semibold
                  bg-[var(--surface-secondary)]
                  border
                  border-[var(--border)]
                  text-[var(--text-primary)]
                  focus:outline-none
                  focus:ring-2
                  focus:ring-indigo-500/40
                  hover:border-indigo-500/30
                  transition-all
                  cursor-pointer
                "
              >
                {availableCompanies.map((comp) => (
                  <option key={comp} value={comp} className="bg-[var(--card-bg)] text-[var(--text-primary)]">
                    {comp}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Role Selector */}
          <div className="space-y-1.5 min-w-[240px]">
            <label
              htmlFor="role-select"
              className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5"
            >
              <Briefcase className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Job Role</span>
            </label>
            <div className="relative">
              <select
                id="role-select"
                value={selectedRole}
                onChange={handleRoleChange}
                className="
                  w-full
                  appearance-none
                  px-3.5
                  py-2.5
                  pr-9
                  rounded-xl
                  text-xs
                  font-semibold
                  bg-[var(--surface-secondary)]
                  border
                  border-[var(--border)]
                  text-[var(--text-primary)]
                  focus:outline-none
                  focus:ring-2
                  focus:ring-indigo-500/40
                  hover:border-indigo-500/30
                  transition-all
                  cursor-pointer
                "
              >
                {currentRoles.map((r) => (
                  <option key={r} value={r} className="bg-[var(--card-bg)] text-[var(--text-primary)]">
                    {r}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Select Opportunity Pills */}
      <div className="mt-4 pt-3.5 border-t border-[var(--border)] flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-mono text-[var(--text-muted)] mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-500 dark:text-cyan-400" />
          <span>Quick Benchmark:</span>
        </span>
        {[
          { company: 'Google', role: 'Machine Learning Engineer', score: 68 },
          { company: 'Microsoft', role: 'Machine Learning Engineer', score: 72 },
          { company: 'Amazon', role: 'Data Scientist', score: 76 },
          { company: 'NVIDIA', role: 'Deep Learning Engineer', score: 64 },
          { company: 'OpenAI', role: 'Research Engineer', score: 52 },
        ].map((item) => {
          const isActive = selectedCompany === item.company && selectedRole === item.role;
          return (
            <button
              key={`${item.company}-${item.role}`}
              type="button"
              onClick={() => {
                onCompanyChange?.(item.company);
                onRoleChange?.(item.role);
              }}
              className={`
                px-2.5
                py-1
                rounded-lg
                text-xs
                font-medium
                flex
                items-center
                gap-1.5
                transition-all
                cursor-pointer
                ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950/30'
                    : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] hover:border-indigo-500/30'
                }
              `}
            >
              <span>{item.company}</span>
              <span className="text-[10px] opacity-70">({item.score}%)</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CompanyRoleSelector;
