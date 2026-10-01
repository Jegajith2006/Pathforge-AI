/**
 * Normalizes capstone project records from API responses.
 */

export function normalizeProject(raw) {
  if (!raw) return null;

  return {
    id: raw.id || raw._id || (raw.title ? raw.title.toLowerCase().replace(/\s+/g, '-') : String(Math.random())),
    title: raw.title || 'Untitled Project',
    type: raw.type || 'Portfolio Capstone',
    difficulty: raw.difficulty || 'Intermediate',
    deliverables: raw.deliverables || 'GitHub repository, unit test suite, deployment container',
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    impact: raw.impact || 'Verified proof of production engineering capability',
    description: raw.description || '',
    duration: raw.duration || '2-3 weeks',
    status: raw.status || 'Available',
    repoUrl: raw.repoUrl || raw.repo_url || '',
    liveDemoUrl: raw.liveDemoUrl || raw.live_demo_url || '',
    completionDate: raw.completionDate || raw.completion_date || null,
  };
}

export function normalizeProjects(rawList) {
  if (!Array.isArray(rawList)) return [];
  return rawList.map(normalizeProject).filter(Boolean);
}

export default normalizeProjects;
