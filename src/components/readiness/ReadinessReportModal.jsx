import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useToast } from '../../context/ToastContext';
import {
  Download,
  Copy,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Award,
} from 'lucide-react';

export const ReadinessReportModal = ({
  isOpen,
  onClose,
  readinessData,
}) => {
  const { addToast } = useToast();

  if (!readinessData) return null;

  const handleCopyMarkdown = () => {
    const md = `# PathForge AI — Career Readiness Audit Report
**Learner:** Jegajith  
**Target Role:** ${readinessData.targetRole}  
**Composite Readiness Score:** ${readinessData.currentScore} / 100 (${readinessData.readinessLevel})  
**Audit Date:** ${readinessData.lastCalculated}  

## Pillar Breakdown
${readinessData.factors
  .map((f) => `- **${f.name}** (${f.weight}% weight): ${f.score}% — ${f.shortExplanation}`)
  .join('\n')}

## Top Strengths
${readinessData.strengths.map((s) => `- ${s.title}: ${s.explanation}`).join('\n')}

## Recommended Priority Actions
${readinessData.priorityGaps
  .map((g) => `- [${g.impact} Impact] ${g.skill}: ${g.recommendedAction}`)
  .join('\n')}
`;
    navigator.clipboard.writeText(md);
    addToast('Report Copied', 'Markdown readiness audit copied to clipboard.', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="PathForge Verified Career Readiness Audit"
      size="xl"
    >
      <div className="space-y-6 pt-1 text-xs max-h-[78vh] overflow-y-auto pr-1">
        {/* Audit Header Certificate Banner */}
        <div className="p-5 rounded-2xl bg-[var(--surface-secondary)]/80 border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-500 dark:text-indigo-400 font-bold block">
              Official Candidate Evaluation Report
            </span>
            <h3 className="text-lg font-bold font-display text-[var(--text-primary)]">
              Jegajith — Machine Learning Engineer
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Audited against Tier-1 Engineering Competency Rubric
            </p>
          </div>

          <div className="flex sm:flex-col items-start sm:items-end justify-between gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border)]">
            <span className="text-3xl font-extrabold font-display text-indigo-600 dark:text-indigo-400">
              {readinessData.currentScore}%
            </span>
            <Badge variant="indigo" size="sm">
              {readinessData.readinessLevel}
            </Badge>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
            Composite Factor Evaluation
          </h4>
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-secondary)] text-[var(--text-muted)] font-mono text-[10px] uppercase">
                <tr>
                  <th className="p-3">Evaluation Pillar</th>
                  <th className="p-3">Weight</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Assessment Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {readinessData.factors.map((f) => (
                  <tr key={f.id} className="hover:bg-[var(--surface-secondary)]/40">
                    <td className="p-3 font-semibold text-[var(--text-primary)]">{f.name}</td>
                    <td className="p-3 font-mono text-[var(--text-secondary)]">{f.weight}%</td>
                    <td className="p-3 font-mono font-bold text-indigo-500">{f.score}%</td>
                    <td className="p-3 text-[var(--text-secondary)] leading-relaxed">
                      {f.shortExplanation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Strengths & Priority Gaps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 space-y-2">
            <h5 className="font-bold text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1.5 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Verified Strengths</span>
            </h5>
            <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
              {readinessData.strengths.slice(0, 3).map((s) => (
                <li key={s.id} className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>{s.title}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 space-y-2">
            <h5 className="font-bold text-amber-600 dark:text-amber-400 text-xs flex items-center gap-1.5 uppercase tracking-wider">
              <AlertCircle className="w-4 h-4" />
              <span>Priority Action Items</span>
            </h5>
            <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
              {readinessData.priorityGaps.map((g) => (
                <li key={g.id} className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span>{g.skill}: {g.recommendedAction}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Verification Credential Footer */}
        <div className="p-3 rounded-xl bg-[var(--surface-secondary)]/50 border border-[var(--border)] text-[11px] font-mono text-[var(--text-muted)] flex items-center justify-between flex-wrap gap-2">
          <span>Audit Hash: 0x9f8b2d1...4a67</span>
          <span>Certified by: PathForge Career Engine & Staff ML Board</span>
        </div>

        {/* Actions Footer */}
        <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
          <Button
            onClick={handleCopyMarkdown}
            variant="outline"
            size="sm"
            leftIcon={Copy}
            className="text-xs"
          >
            Copy Markdown
          </Button>

          <div className="flex items-center gap-2">
            <Button onClick={onClose} variant="ghost" size="sm" className="text-xs">
              Close
            </Button>
            <Button
              onClick={handlePrint}
              variant="primary"
              size="sm"
              leftIcon={Printer}
              className="text-xs"
            >
              Print / Save PDF
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
