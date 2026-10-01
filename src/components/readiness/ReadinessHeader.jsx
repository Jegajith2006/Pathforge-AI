import React from 'react';
import { PageHeader } from '../layout/PageHeader';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { RefreshCw, Download, Sliders, Target, Sparkles } from 'lucide-react';

export const ReadinessHeader = ({
  targetRole = 'Machine Learning Engineer',
  onRecalculate,
  onOpenSimulator,
  onExportReport,
  isRecalculating = false,
}) => {
  return (
    <div className="space-y-3">
      <PageHeader
        title="Career Readiness Score"
        description="An explainable composite score measuring your preparation for your target role across 5 core engineering pillars."
        badge={
          <span className="flex items-center gap-1.5 font-mono">
            <Target className="w-3.5 h-3.5 text-indigo-400" />
            Target: {targetRole}
          </span>
        }
        badgeVariant="indigo"
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={onOpenSimulator}
              variant="outline"
              size="sm"
              leftIcon={Sliders}
              className="text-xs"
            >
              Simulate Score
            </Button>
            <Button
              onClick={onRecalculate}
              variant="outline"
              size="sm"
              disabled={isRecalculating}
              leftIcon={RefreshCw}
              className={`text-xs ${isRecalculating ? 'animate-spin' : ''}`}
            >
              {isRecalculating ? 'Calculating...' : 'Recalculate'}
            </Button>
            <Button
              onClick={onExportReport}
              variant="primary"
              size="sm"
              leftIcon={Download}
              className="text-xs"
            >
              Export Report
            </Button>
          </div>
        }
      />
    </div>
  );
};
