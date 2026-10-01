import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  calculateWeightedReadiness,
  getReadinessLevelDetails,
} from '../../utils/readinessCalculator';
import { useToast } from '../../context/ToastContext';
import { Sliders, RotateCcw, Sparkles, TrendingUp, Check } from 'lucide-react';

export const ReadinessSimulatorModal = ({
  isOpen,
  onClose,
  initialFactors = [],
  currentScore = 68,
  onApplySimulation,
}) => {
  const { addToast } = useToast();

  const [simulatedFactors, setSimulatedFactors] = useState(
    initialFactors.map((f) => ({ ...f }))
  );

  const simulatedScore = calculateWeightedReadiness(simulatedFactors);
  const diff = simulatedScore - currentScore;
  const levelDetails = getReadinessLevelDetails(simulatedScore);

  const handleSliderChange = (id, newScore) => {
    setSimulatedFactors((prev) =>
      prev.map((f) => (f.id === id ? { ...f, score: Number(newScore) } : f))
    );
  };

  const handleReset = () => {
    setSimulatedFactors(initialFactors.map((f) => ({ ...f })));
  };

  const handleApply = () => {
    if (onApplySimulation) {
      onApplySimulation(simulatedScore, simulatedFactors);
    }
    addToast(
      'Target Simulation Applied',
      `Target score adjusted to ${simulatedScore}% (${levelDetails.label})`,
      'success'
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Interactive What-If Readiness Simulator"
      size="lg"
    >
      <div className="space-y-5 pt-1 text-xs">
        <p className="text-xs text-[var(--text-secondary)]">
          Experiment with how finishing projects, raising test coverage, or earning mentor approvals impacts your hiring benchmark in real time.
        </p>

        {/* Live Simulation Output Box */}
        <div className="p-5 rounded-2xl bg-[var(--surface-secondary)]/70 border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
              Simulated Readiness Score
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-4xl font-extrabold font-display text-[var(--text-primary)]">
                {simulatedScore}%
              </span>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                  diff > 0
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : diff < 0
                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    : 'bg-[var(--card-bg)] text-[var(--text-muted)] border border-[var(--border)]'
                }`}
              >
                {diff > 0 ? `+${diff} points` : diff < 0 ? `${diff} points` : 'No change'}
              </span>
            </div>
          </div>

          <div className="flex sm:flex-col items-start sm:items-end justify-between gap-1.5 border-t sm:border-t-0 pt-2 sm:pt-0 border-[var(--border)]">
            <Badge variant={levelDetails.variant || 'indigo'} size="md">
              {levelDetails.label}
            </Badge>
            <span className="text-xs text-[var(--text-secondary)] font-mono">
              {levelDetails.tier}
            </span>
          </div>
        </div>

        {/* Sliders for each of the 5 factors */}
        <div className="space-y-4 pt-1">
          {simulatedFactors.map((f) => (
            <div
              key={f.id}
              className="p-3.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--text-primary)]">
                  {f.name} <span className="text-[var(--text-muted)] font-mono">({f.weight}% weight)</span>
                </span>
                <span className="font-mono font-bold text-sm text-[var(--text-primary)]">
                  {f.score}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={f.score}
                onChange={(e) => handleSliderChange(f.id, e.target.value)}
                className="w-full accent-indigo-600 h-2 bg-[var(--surface-secondary)] rounded-lg cursor-pointer"
              />

              <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
                <span>0% (Untested)</span>
                <span>50% (Baseline)</span>
                <span>100% (Staff Mastery)</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer controls */}
        <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
          <Button
            type="button"
            onClick={handleReset}
            variant="ghost"
            size="sm"
            leftIcon={RotateCcw}
            className="text-xs"
          >
            Reset to Current
          </Button>

          <div className="flex items-center gap-2">
            <Button onClick={onClose} variant="ghost" size="sm" className="text-xs">
              Close
            </Button>
            <Button
              onClick={handleApply}
              variant="primary"
              size="sm"
              leftIcon={Check}
              className="text-xs"
            >
              Set as Target Goal
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
