import { readinessData } from '../data/readinessData';
import { calculateReadinessScore, getReadinessLevel } from './readinessCalculator';

/**
 * Normalizes multi-factor career readiness scoring from API or local responses.
 */
export function normalizeReadiness(raw) {
  if (!raw) return readinessData;

  const rawScore = raw.score ?? raw.readinessScore ?? raw.readiness_score ?? raw.overallScore;
  const factors = raw.factors || readinessData.factors;
  const score = rawScore !== undefined ? Number(rawScore) : calculateReadinessScore(factors);
  const level = raw.level || raw.readinessLevel || getReadinessLevel(score);

  return {
    score,
    overallScore: score,
    level,
    tier: level,
    readinessLevel: `Readiness Level: ${level}`,
    targetRole: raw.targetRole || raw.target_role || readinessData.targetRole,
    factors,
    domainScores: Array.isArray(raw.domainScores || raw.domain_scores)
      ? (raw.domainScores || raw.domain_scores)
      : readinessData.radarSkills,
    explainability:
      raw.explainability ||
      raw.explanation ||
      raw.summaryExplanation ||
      readinessData.summaryExplanation,
    priorityGaps: raw.priorityGaps || readinessData.priorityGaps,
    nextBestAction: raw.nextBestAction || raw.next_best_action || readinessData.nextBestAction,
  };
}

export default normalizeReadiness;
