/**
 * Normalizes skill and skill gap data from API responses to match UI expectations.
 */

export function normalizeSkill(raw) {
  if (!raw) return null;

  const currentLevel = raw.currentLevel ?? raw.current_level ?? 0;
  const requiredLevel = raw.requiredLevel ?? raw.required_level ?? 0;
  const gap = raw.gap ?? Math.max(0, requiredLevel - currentLevel);

  let status = raw.status;
  if (!status) {
    if (gap === 0) status = 'Strong';
    else if (gap <= 15) status = 'Developing';
    else status = 'Critical Gap';
  }

  let priority = raw.priority;
  if (!priority) {
    if (gap > 20) priority = 'High';
    else if (gap > 8) priority = 'Medium';
    else priority = 'Low';
  }

  return {
    id: raw.id || raw._id || (raw.name ? raw.name.toLowerCase().replace(/\s+/g, '-') : String(Math.random())),
    name: raw.name || 'Unnamed Competency',
    category: raw.category || 'General Technical',
    currentLevel,
    requiredLevel,
    gap,
    status,
    priority,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    trend: raw.trend || '+0% this month',
    description: raw.description || '',
    learningCurve: raw.learningCurve || raw.learning_curve || 'Moderate',
    marketDemand: raw.marketDemand || raw.market_demand || 'High Demand',
  };
}

export function normalizeSkills(rawList) {
  if (!Array.isArray(rawList)) return [];
  return rawList.map(normalizeSkill).filter(Boolean);
}

export default normalizeSkills;
