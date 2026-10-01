/**
 * Normalizes adaptive learning roadmap phases and milestones from API responses.
 */

export function normalizeRoadmapMilestone(raw) {
  if (!raw) return null;

  return {
    id: raw.id || raw._id || 1,
    number: raw.number || String(raw.id || '01').padStart(2, '0'),
    title: raw.title || 'Untitled Sprint Milestone',
    status: raw.status || 'Upcoming',
    progress: raw.progress ?? 0,
    duration: raw.duration || '4 Weeks',
    activeStep: raw.activeStep || raw.active_step || '',
    keyCompetencies: Array.isArray(raw.keyCompetencies || raw.key_competencies)
      ? (raw.keyCompetencies || raw.key_competencies)
      : [],
    verifiedArtifacts: raw.verifiedArtifacts || raw.verified_artifacts || 'Pending Milestone Audits',
    courses: Array.isArray(raw.courses) ? raw.courses : [],
    projects: Array.isArray(raw.projects) ? raw.projects : [],
    evidenceRequirements: Array.isArray(raw.evidenceRequirements || raw.evidence_requirements)
      ? (raw.evidenceRequirements || raw.evidence_requirements)
      : [],
  };
}

export function normalizeRoadmap(rawList) {
  if (!Array.isArray(rawList)) return [];
  return rawList.map(normalizeRoadmapMilestone).filter(Boolean);
}

export default normalizeRoadmap;
