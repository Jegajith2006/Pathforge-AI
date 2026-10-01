import React from 'react';
import { CompanyComparison } from '../../types';
import { CheckCircle2, AlertTriangle, XCircle, Building2, Sparkles, ArrowRight } from 'lucide-react';

interface CompanyMatchTableProps {
  comparison: CompanyComparison;
}

export const CompanyMatchTable: React.FC<CompanyMatchTableProps> = ({ comparison }) => {
  const getStatusChip = (status: 'Matched' | 'Partial' | 'Missing') => {
    switch (status) {
      case 'Matched':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Matched
          </span>
        );
      case 'Partial':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Partial
          </span>
        );
      case 'Missing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Missing
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Match Card */}
      <div className="bg-gradient-to-r from-[#151C2E] via-[#1A2238] to-[#151C2E] border border-indigo-500/30 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-extrabold text-lg font-display shadow-inner">
            {comparison.companyLogoText}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Target Role Benchmark
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                Verified J.D.
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white font-display mt-0.5">
              {comparison.jobRole} @ {comparison.companyName}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Comparing your real profile competencies against hiring rubric requirements.
            </p>
          </div>
        </div>

        {/* Overall Match Circle / Score */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 shrink-0">
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Role Compatibility</span>
            <span className="text-xs text-emerald-400 font-bold">Strong Candidate Match</span>
          </div>
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500 flex items-center justify-center text-white font-black text-xl shadow-lg font-display">
            {comparison.overallMatch}%
          </div>
        </div>
      </div>

      {/* Recommended Preparation Steps Box */}
      <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20">
        <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-sky-400" />
          Recommended Hiring Prep Steps for {comparison.companyName}:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {comparison.recommendedSteps.map((step, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-[#111827]/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5"
            >
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="leading-snug">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-[#151C2E] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800">
          <h3 className="text-base font-bold text-white font-display">
            Granular Skill Evaluation Table
          </h3>
          <p className="text-xs text-slate-400">
            Side-by-side gap matrix against {comparison.companyName}'s technical hiring criteria
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-5 font-semibold">Skill Requirement</th>
                <th className="py-3.5 px-5 font-semibold">Requirement Weight</th>
                <th className="py-3.5 px-5 font-semibold">Company Target</th>
                <th className="py-3.5 px-5 font-semibold">Your Verified Level</th>
                <th className="py-3.5 px-5 font-semibold">Status Match</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {comparison.skillTable.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-4 px-5 font-semibold text-white">
                    {row.skill}
                  </td>
                  <td className="py-4 px-5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.relevance === 'Core'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {row.relevance}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-slate-300 font-medium">
                    {row.requiredLevel}
                  </td>
                  <td className="py-4 px-5">
                    <span
                      className={`font-semibold ${
                        row.matchStatus === 'Matched'
                          ? 'text-emerald-400'
                          : row.matchStatus === 'Partial'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {row.yourLevel}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    {getStatusChip(row.matchStatus)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
