import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowRight } from 'lucide-react';
import { mockReadinessData } from '../../data/mockData';
import { calculateWeightedReadiness } from '../../utils/readinessCalculator';
import { ReadinessHeader } from './ReadinessHeader';
import { ReadinessScoreCard } from './ReadinessScoreCard';
import { ReadinessBreakdown } from './ReadinessBreakdown';
import { ReadinessTrendChart } from './ReadinessTrendChart';
import { ReadinessStrengths } from './ReadinessStrengths';
import { ReadinessPriorityGaps } from './ReadinessPriorityGaps';
import { ReadinessImprovementPlan } from './ReadinessImprovementPlan';
import { ReadinessSimulatorModal } from './ReadinessSimulatorModal';
import { ReadinessReportModal } from './ReadinessReportModal';
import { useToast } from '../../context/ToastContext';

export const ReadinessContent = () => {
  const { addToast } = useToast();
  const [readinessData, setReadinessData] = useState(mockReadinessData);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const handleRecalculate = () => {
    setIsRecalculating(true);
    addToast('Audit In Progress', 'Re-evaluating verified evidence, project tests, and mentor reviews...', 'info');

    setTimeout(() => {
      const recalculatedScore = calculateWeightedReadiness(readinessData.factors);
      setReadinessData((prev) => ({
        ...prev,
        currentScore: recalculatedScore,
        lastCalculated: new Date().toISOString().split('T')[0],
      }));
      setIsRecalculating(false);
      addToast(
        'Readiness Audit Complete',
        `Composite score verified at ${recalculatedScore}%. Up to date with all evidence items.`,
        'success'
      );
    }, 1000);
  };

  const handleApplySimulation = (newScore, updatedFactors) => {
    setReadinessData((prev) => ({
      ...prev,
      currentScore: newScore,
      factors: updatedFactors,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <ReadinessHeader
        targetRole={readinessData.targetRole}
        onRecalculate={handleRecalculate}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onExportReport={() => setIsReportOpen(true)}
        isRecalculating={isRecalculating}
      />

      {/* Hero Score Card */}
      <ReadinessScoreCard
        score={readinessData.currentScore}
        previousScore={readinessData.previousScore}
        scoreDelta={readinessData.scoreDelta}
        lastCalculated={readinessData.lastCalculated}
        summaryExplanation={readinessData.summaryExplanation}
        factors={readinessData.factors}
      />

      {/* Score Composition & Explainable Breakdown */}
      <ReadinessBreakdown factors={readinessData.factors} />

      {/* Velocity & Trend Recharts Chart */}
      <ReadinessTrendChart trendData={readinessData.trend} />

      {/* Two Column Grid: Strengths & Priority Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReadinessStrengths strengths={readinessData.strengths} />
        <ReadinessPriorityGaps priorityGaps={readinessData.priorityGaps} />
      </div>

      {/* Ranked Action Roadmap */}
      <ReadinessImprovementPlan improvementPlan={readinessData.improvementPlan} />

      {/* Cross-Module Company Match Intelligence Teaser */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-cyan-500/10 to-indigo-500/5 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold font-display text-[var(--text-primary)]">
              Benchmark Against Target Hiring Bars
            </h4>
            <p className="text-xs text-[var(--text-secondary)]">
              See how your 74% readiness measures against real job requisitions at Google, Microsoft, Amazon, NVIDIA, and OpenAI.
            </p>
          </div>
        </div>

        <Link
          to="/company-match"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm shrink-0"
        >
          <span>Compare Company Match</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Interactive Simulator Modal */}
      <ReadinessSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        initialFactors={readinessData.factors}
        currentScore={readinessData.currentScore}
        onApplySimulation={handleApplySimulation}
      />

      {/* Audit Report Export Modal */}
      <ReadinessReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        readinessData={readinessData}
      />
    </div>
  );
};
