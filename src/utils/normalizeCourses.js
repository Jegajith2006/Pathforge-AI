/**
 * Normalizes course curricula and recommended courses from API responses.
 */

export function normalizeCourse(raw) {
  if (!raw) return null;

  return {
    id: raw.id || raw._id || (raw.title ? raw.title.toLowerCase().replace(/\s+/g, '-') : String(Math.random())),
    title: raw.title || 'Untitled Course',
    provider: raw.provider || 'PathForge Learning',
    duration: raw.duration || '10 hrs',
    difficulty: raw.difficulty || 'Intermediate',
    matchScore: raw.matchScore ?? raw.match_score ?? 85,
    reason: raw.reason || raw.rationale || 'Recommended to strengthen career trajectory milestones.',
    category: raw.category || 'General',
    rating: raw.rating ?? 4.8,
    reviewsCount: raw.reviewsCount ?? raw.reviews_count ?? 120,
    skillsCovered: Array.isArray(raw.skillsCovered || raw.skills_covered)
      ? (raw.skillsCovered || raw.skills_covered)
      : [],
    syllabus: Array.isArray(raw.syllabus) ? raw.syllabus : [],
    progress: raw.progress ?? 0,
    completed: Boolean(raw.completed || raw.is_completed),
    url: raw.url || '#',
  };
}

export function normalizeCourses(rawList) {
  if (!Array.isArray(rawList)) return [];
  return rawList.map(normalizeCourse).filter(Boolean);
}

export default normalizeCourses;
