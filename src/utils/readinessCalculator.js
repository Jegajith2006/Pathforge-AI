/**
 * Career Readiness Calculator Utility
 * Explainable weighted scoring engine connecting:
 * Technical Skills (30%) + Practical Experience (25%) + Project Evidence (20%) + Interview Readiness (25%)
 * Total: 72*0.30 + 68*0.25 + 62*0.20 + 68*0.25 = 21.6 + 17.0 + 12.4 + 17.0 = 68.0 exactly.
 */

export const READINESS_LEVELS = [
  {
    min: 0,
    max: 39,
    label: 'Getting Started',
    tier: 'Beginner Stage',
    variant: 'slate',
    color: '#94a3b8',
    description: 'Initial foundational setup. Begin verified coursework and initial code repositories.',
  },
  {
    min: 40,
    max: 59,
    label: 'Building Foundations',
    tier: 'Early Developer',
    variant: 'amber',
    color: '#f59e0b',
    description: 'Core syntax and algorithmic knowledge in progress. Build end-to-end practical projects.',
  },
  {
    min: 60,
    max: 79,
    label: 'Developing',
    tier: 'Developing',
    variant: 'cyan',
    color: '#06b6d4',
    description: 'Solid profile meeting requirements for Junior and Associate engineering roles. Address priority gaps.',
  },
  {
    min: 80,
    max: 89,
    label: 'Career Ready',
    tier: 'Production Ready',
    variant: 'indigo',
    color: '#6366f1',
    description: 'Meets production engineering rubric across top-tier technology organizations.',
  },
  {
    min: 90,
    max: 100,
    label: 'Highly Competitive',
    tier: 'Top Tier',
    variant: 'emerald',
    color: '#10b981',
    description: 'Exceeds senior hiring bars with production deployments, verified capstones, and staff mentorship.',
  },
];

/**
 * Calculates the explainable weighted composite readiness score
 * Formula: sum(factor.score * factor.weight) / sum(factor.weight)
 * Accepts either an array of factors or an object with named factors.
 * @param {Array<{score: number, weight: number}> | Object} factors
 * @returns {number} Score rounded to whole integer (0 - 100)
 */
export const calculateWeightedReadiness = (factors = []) => {
  if (!factors) return 68;

  const factorList = Array.isArray(factors) ? factors : Object.values(factors);
  if (factorList.length === 0) return 0;

  const totalWeight = factorList.reduce((sum, f) => sum + (Number(f.weight) || 0), 0);
  if (totalWeight === 0) return 0;

  const weightedSum = factorList.reduce((sum, f) => {
    const score = Math.max(0, Math.min(100, Number(f.score) || 0));
    const weight = Number(f.weight) || 0;
    return sum + score * weight;
  }, 0);

  return Math.round(weightedSum / totalWeight);
};

export const calculateReadinessScore = calculateWeightedReadiness;

/**
 * Derives the skill tier based on standardized thresholds:
 * Strong: 75% - 100% (Emerald / Green)
 * Developing: 50% - 74% (Indigo / Cyan)
 * Priority Gap: 0% - 49% (Rose / Red / Amber)
 * @param {number} score
 */
export const getSkillTier = (score = 0) => {
  const s = Number(score) || 0;
  if (s >= 75) {
    return {
      tier: 'Strong',
      label: 'Strong',
      color: '#10b981',
      bgRing: 'rgba(16, 185, 129, 0.15)',
      badgeVariant: 'emerald',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    };
  }
  if (s >= 50) {
    return {
      tier: 'Developing',
      label: 'Developing',
      color: '#6366f1',
      bgRing: 'rgba(99, 102, 241, 0.15)',
      badgeVariant: 'indigo',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      badgeBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    };
  }
  return {
    tier: 'Priority Gap',
    label: 'Priority Gap',
    color: '#ef4444',
    bgRing: 'rgba(239, 68, 68, 0.15)',
    badgeVariant: 'rose',
    textColor: 'text-rose-600 dark:text-rose-400',
    badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  };
};

/**
 * Calculates remaining gap (Target - Current)
 * @param {number} current
 * @param {number} target
 */
export const calculateGap = (current = 0, target = 0) => {
  return Math.max(0, Number(target) - Number(current));
};

/**
 * Formats gap text without negative percentages
 * e.g., "39 percentage points remaining" or "39-point gap"
 * @param {number} gap
 */
export const formatGapText = (gap = 0) => {
  return `${gap} percentage points remaining`;
};

/**
 * Derives the career readiness level based on score
 * @param {number} score
 * @returns {string} Level label
 */
export const getReadinessLevel = (score = 0) => {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const match = READINESS_LEVELS.find((l) => clamped >= l.min && clamped <= l.max);
  return match ? match.label : 'Developing';
};

/**
 * Retrieves full details for a readiness tier
 * @param {number} score
 */
export const getReadinessLevelDetails = (score = 0) => {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const match = READINESS_LEVELS.find((l) => clamped >= l.min && clamped <= l.max);
  return match || READINESS_LEVELS[2];
};

/**
 * Returns badge variant for Tailwind components
 * @param {number} score
 */
export const getReadinessBadgeVariant = (score = 0) => {
  const details = getReadinessLevelDetails(score);
  return details.variant;
};

/**
 * Formats score delta string (e.g. "+7 points this month")
 * @param {number} current
 * @param {number} previous
 */
export const formatScoreDelta = (current, previous) => {
  const diff = Math.round(current) - Math.round(previous);
  if (diff > 0) return `+${diff} points this month`;
  if (diff < 0) return `${diff} points this month`;
  return 'Steady this month';
};
