import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { CompanyMatchTable } from '../components/company/CompanyMatchTable';
import { apiService } from '../services/api';
import { CompanyComparison } from '../types';
import { Search, Building2, Sparkles, Briefcase, Filter } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const CompanyPage: React.FC = () => {
  const [comparisons, setComparisons] = useState<CompanyComparison[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('Spotify');
  const [customCompany, setCustomCompany] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const data = await apiService.getCompanyComparisons();
        setComparisons(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const activeComparison = comparisons.find((c) => c.companyName === selectedCompany) || comparisons[0];

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCompany || !customRole) {
      addToast('Please enter both Company and Role', 'Both fields are needed to parse hiring requirements.', 'warning');
      return;
    }

    addToast(
      'Evaluating Job Rubric',
      `Parsed qualifications for ${customRole} @ ${customCompany}. Comparison generated.`,
      'success'
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Career Match: Employer Benchmark Comparison"
        subtitle="Benchmark your verified skills against active job descriptions from top technology employers."
        badge="Job Description Matcher"
      />

      {/* Target Search & Pre-selected Companies Bar */}
      <div className="bg-[#151C2E] border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-semibold text-slate-400 mr-2 shrink-0">
              Benchmark Target:
            </span>
            {['Spotify', 'Stripe', 'Google Cloud'].map((comp) => (
              <button
                key={comp}
                onClick={() => setSelectedCompany(comp)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedCompany === comp
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {comp}
              </button>
            ))}
          </div>

          <form onSubmit={handleCustomSearch} className="flex items-center gap-2 flex-1 max-w-md">
            <input
              type="text"
              placeholder="Company (e.g. Netflix)"
              value={customCompany}
              onChange={(e) => setCustomCompany(e.target.value)}
              className="w-1/2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
            />
            <input
              type="text"
              placeholder="Role (e.g. Product Analyst)"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              className="w-1/2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 transition-colors"
            >
              Match
            </button>
          </form>
        </div>
      </div>

      {/* Main Comparison Component */}
      {activeComparison && <CompanyMatchTable comparison={activeComparison} />}
    </div>
  );
};
