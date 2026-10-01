/**
 * Normalizes employer match comparisons and hiring bar alignment from API responses.
 */

export function normalizeCompanyMatch(raw) {
  if (!raw) return null;

  return {
    id: raw.id || raw._id || (raw.company ? raw.company.toLowerCase().replace(/\s+/g, '-') : String(Math.random())),
    company: raw.company || 'Tech Employer',
    role: raw.role || 'Machine Learning Engineer',
    logo: raw.logo || '',
    matchScore: raw.matchScore ?? raw.match_score ?? 70,
    matchTier: raw.matchTier || raw.match_tier || (raw.matchScore >= 80 ? 'High Fit' : 'Moderate Fit'),
    salaryRange: raw.salaryRange || raw.salary_range || '$140k - $175k',
    location: raw.location || 'Remote / Hybrid',
    verifiedSkills: Array.isArray(raw.verifiedSkills || raw.verified_skills)
      ? (raw.verifiedSkills || raw.verified_skills)
      : [],
    criticalGaps: Array.isArray(raw.criticalGaps || raw.critical_gaps)
      ? (raw.criticalGaps || raw.critical_gaps)
      : [],
    hiringBarExplanation: raw.hiringBarExplanation || raw.hiring_bar_explanation || 'Candidate matches core engineering requirements.',
    recommendedActions: Array.isArray(raw.recommendedActions || raw.recommended_actions)
      ? (raw.recommendedActions || raw.recommended_actions)
      : [],
  };
}

export function normalizeCompanyMatches(rawList) {
  if (!Array.isArray(rawList)) return [];
  return rawList.map(normalizeCompanyMatch).filter(Boolean);
}

export default normalizeCompanyMatches;
