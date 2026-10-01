import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { EvidenceCard } from '../components/evidence/EvidenceCard';
import { Modal } from '../components/common/Modal';
import { apiService } from '../services/api';
import { EvidenceItem } from '../types';
import { Plus, ShieldCheck, Filter, Upload, Check, Link as LinkIcon, FileText } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const EvidencePage: React.FC = () => {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [filter, setFilter] = useState<'All' | 'Verified' | 'Pending Review' | 'Needs Revision'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  // Form states for adding new evidence
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EvidenceItem['type']>('GitHub Repository');
  const [relatedSkill, setRelatedSkill] = useState('SQL & Window Functions');
  const [linkUrl, setLinkUrl] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchEvidence = async () => {
      try {
        const data = await apiService.getEvidence();
        setEvidenceList(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvidence();
  }, []);

  const filteredEvidence = filter === 'All'
    ? evidenceList
    : evidenceList.filter((e) => e.verificationStatus === filter);

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !linkUrl) {
      addToast('Missing Required Fields', 'Please enter a title and URL for the evidence item.', 'warning');
      return;
    }

    const newItem: EvidenceItem = {
      id: `ev_${Date.now()}`,
      title,
      type,
      relatedSkill,
      verificationStatus: 'Pending Review',
      submissionDate: 'Just now',
      linkUrl,
      notes: notes || 'Submitted for automated unit tests & mentor evaluation.',
    };

    setEvidenceList([newItem, ...evidenceList]);
    setIsModalOpen(false);
    setTitle('');
    setLinkUrl('');
    setNotes('');

    addToast(
      'Artifact Deposited into Vault',
      `"${title}" submitted for automated CI testing and mentor verification.`,
      'success'
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Evidence Vault"
        subtitle="Cryptographically verified portfolio artifacts, GitHub repositories, and certified test percentiles."
        badge="Proof of Mastery"
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-950/40 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Deposit New Evidence
          </button>
        }
      />

      {/* Top Vault Security Banner */}
      <div className="bg-gradient-to-r from-[#151C2E] via-[#1E1B4B]/50 to-[#151C2E] border border-indigo-500/25 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-display">
              Cryptographic & Peer-Verified Portfolio Integrity
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Every artifact deposited in the Vault generates a tamper-evident audit record, empowering hiring managers to review verified work rather than hollow bullet points.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold shrink-0">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="block text-emerald-400 font-bold text-base">
              {evidenceList.filter((e) => e.verificationStatus === 'Verified').length}
            </span>
            <span className="text-slate-400 text-[11px]">Verified</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="block text-amber-400 font-bold text-base">
              {evidenceList.filter((e) => e.verificationStatus === 'Pending Review').length}
            </span>
            <span className="text-slate-400 text-[11px]">In Review</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#151C2E] border border-slate-800 overflow-x-auto">
        <Filter className="w-4 h-4 text-slate-400 ml-2 mr-1 shrink-0" />
        {['All', 'Verified', 'Pending Review', 'Needs Revision'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filter === f
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-800/40'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Evidence Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvidence.map((item) => (
          <EvidenceCard key={item.id} item={item} />
        ))}
      </div>

      {/* Deposit New Evidence Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Deposit Evidence into Vault"
        subtitle="Submit code repositories, project reports, certificates, or live dashboard links for verification."
        maxWidth="md"
      >
        <form onSubmit={handleSubmitNew} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Artifact Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Real-Time Fraud Analytics Pipeline"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#111827] border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Evidence Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#111827] border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
              >
                <option value="GitHub Repository">GitHub Repository</option>
                <option value="Certificate">Certificate / Credential</option>
                <option value="Portfolio Project">Portfolio Project</option>
                <option value="Assessment Result">Assessment Result</option>
                <option value="Internship Record">Internship Record</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Competency Skill
              </label>
              <select
                value={relatedSkill}
                onChange={(e) => setRelatedSkill(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#111827] border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
              >
                <option value="SQL & Window Functions">SQL & Window Functions</option>
                <option value="Tableau & PowerBI">Tableau & PowerBI</option>
                <option value="Python Data Analysis">Python Data Analysis</option>
                <option value="Data Warehousing & Modeling">Data Warehousing & Modeling</option>
                <option value="Machine Learning Modeling">Machine Learning Modeling</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Live URL / Public Repository Link
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                required
                placeholder="https://github.com/username/repo-name"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#111827] border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Methodology Notes & Scope Summary
            </label>
            <textarea
              rows={3}
              placeholder="Detail architecture choices, datasets used, and testing coverage..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#111827] border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-950/40 transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              Deposit & Verify
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
