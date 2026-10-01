import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { mockCoursesCatalog, mockProjectsCatalog } from '../../data/mockData';
import { CoursesHeader } from './CoursesHeader';
import { CourseProgressCard } from './CourseProgressCard';
import { RecommendedCourseSection } from './RecommendedCourseSection';
import { CourseCategoryTabs } from './CourseCategoryTabs';
import { CourseFilters } from './CourseFilters';
import { CourseCard } from './CourseCard';
import { CourseDetailsModal } from './CourseDetailsModal';
import { BookOpen, SearchX, CheckCircle, Sparkles, X } from 'lucide-react';

/**
 * CoursesContent
 * Main intelligent learning hub orchestrator with connected state, local updates, and project links.
 */
export const CoursesContent = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, activeCareer } = useApp();

  // Local courses state so start/continue & progress can update interactively
  const [courses, setCourses] = useState(() => {
    try {
      const saved = localStorage.getItem('pathforge_courses_state');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return mockCoursesCatalog;
  });

  // Projects catalog lookup map for quick related project resolution
  const projectsMap = useMemo(() => {
    const map = {};
    mockProjectsCatalog.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, []);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState('recommended');

  // Modal & Toast states
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  // Preference modal inputs
  const [targetPace, setTargetPace] = useState('15');
  const [preferredFormat, setPreferredFormat] = useState('Hands-on labs & projects');

  // Check URL query param ?selected=courseId to automatically open modal
  useEffect(() => {
    const requestedId = searchParams.get('selected');
    if (requestedId) {
      const found = courses.find((c) => c.id === requestedId);
      if (found) {
        setSelectedCourse(found);
      }
    }
  }, [searchParams, courses]);

  // Persist local courses state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pathforge_courses_state', JSON.stringify(courses));
    } catch {
      // ignore
    }
  }, [courses]);

  // Toast notification auto-dismiss
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Featured course: priority recommendation (Model Evaluation or flagged as featured)
  const featuredCourse = useMemo(() => {
    return courses.find((c) => c.featured || c.id === 'model-evaluation') || courses[0];
  }, [courses]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = { All: courses.length };
    courses.forEach((c) => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return counts;
  }, [courses]);

  // Filtered and Sorted courses list
  const filteredCourses = useMemo(() => {
    let list = [...courses];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.provider.toLowerCase().includes(q) ||
          (c.skills && c.skills.some((s) => s.toLowerCase().includes(q)))
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      list = list.filter((c) => c.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Difficulty filter
    if (selectedDifficulty !== 'All') {
      list = list.filter((c) => c.difficulty.toLowerCase() === selectedDifficulty.toLowerCase());
    }

    // Status filter
    if (selectedStatus !== 'All') {
      list = list.filter((c) => c.status.toLowerCase() === selectedStatus.toLowerCase());
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'impact') {
        return (b.skillImpact || b.readinessImpact || 0) - (a.skillImpact || a.readinessImpact || 0);
      }
      if (sortBy === 'duration') {
        // Parse numerical duration for rough comparison
        const parseDur = (d) => {
          const num = parseInt(d, 10) || 0;
          if (d.includes('min')) return num;
          return num * 60;
        };
        return parseDur(a.duration) - parseDur(b.duration);
      }
      if (sortBy === 'progress') {
        return (b.progress || 0) - (a.progress || 0);
      }
      if (sortBy === 'recent') {
        return b.id.localeCompare(a.id);
      }
      // 'recommended' default: prioritize featured, then readiness impact, then progress
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return (b.readinessImpact || 0) - (a.readinessImpact || 0);
    });

    return list;
  }, [courses, searchQuery, selectedCategory, selectedDifficulty, selectedStatus, sortBy]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedDifficulty('All');
    setSelectedStatus('All');
    setSortBy('recommended');
  };

  // Start / Continue course action
  const handleStartCourse = (course) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id === course.id) {
          const newProgress = c.progress === 0 ? 10 : Math.min(100, (c.progress || 0) + 15);
          const newStatus = newProgress >= 100 ? 'Completed' : 'In Progress';
          return {
            ...c,
            progress: newProgress,
            status: newStatus,
          };
        }
        return c;
      })
    );

    // Update selected course if modal is open
    if (selectedCourse?.id === course.id) {
      const newProgress =
        course.progress === 0 ? 10 : Math.min(100, (course.progress || 0) + 15);
      const newStatus = newProgress >= 100 ? 'Completed' : 'In Progress';
      setSelectedCourse({
        ...course,
        progress: newProgress,
        status: newStatus,
      });
    }

    setToastMessage({
      title: 'Course Session Launched',
      desc: `Resumed session for "${course.title}". Progress recorded.`,
      type: 'success',
    });
  };

  // Add to Roadmap action
  const handleAddToRoadmap = (course) => {
    setToastMessage({
      title: 'Added to Roadmap',
      desc: `"${course.title}" was pinned to your active learning milestone.`,
      type: 'success',
    });
  };

  // View related project navigation
  const handleViewRelatedProject = (project) => {
    if (!project) return;
    navigate(`/projects?selected=${project.id}`);
  };

  // Learning momentum calculations
  const inProgressCount = useMemo(
    () => courses.filter((c) => c.status === 'In Progress').length,
    [courses]
  );
  const completedCount = useMemo(
    () => courses.filter((c) => c.status === 'Completed').length,
    [courses]
  );

  return (
    <div className="space-y-6">
      {/* Toast Feedback Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-[var(--surface)] border border-indigo-500/40 text-[var(--text-primary)] rounded-xl p-4 shadow-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-semibold text-sm">{toastMessage.title}</p>
            <p className="text-[var(--text-secondary)] mt-0.5">{toastMessage.desc}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <CoursesHeader
        targetRole={activeCareer || user?.targetCareer || 'Machine Learning Engineer'}
        recommendedCount={courses.length}
        onOpenPreferences={() => setPreferencesOpen(true)}
      />

      {/* Momentum & Learning Progress Summary */}
      <CourseProgressCard
        targetRole={activeCareer || user?.targetCareer || 'Machine Learning Engineer'}
        streakDays={14}
        totalHours={142.5}
        inProgressCount={inProgressCount}
        completedCount={completedCount}
        recommendedCount={courses.length}
      />

      {/* Featured AI Recommendation Section */}
      <RecommendedCourseSection
        featuredCourse={featuredCourse}
        onSelectCourse={(c) => setSelectedCourse(c)}
        onStartCourse={handleStartCourse}
        onViewRelatedProject={handleViewRelatedProject}
        relatedProject={featuredCourse?.relatedProjectId ? projectsMap[featuredCourse.relatedProjectId] : null}
      />

      {/* Quick Category Tabs */}
      <div className="pt-2">
        <CourseCategoryTabs
          activeCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
          categoryCounts={categoryCounts}
        />
      </div>

      {/* Advanced Filter and Sorting Bar */}
      <CourseFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedDifficulty={selectedDifficulty}
        setSelectedDifficulty={setSelectedDifficulty}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        sortBy={sortBy}
        setSortBy={setSortBy}
        totalResults={filteredCourses.length}
        onResetFilters={handleResetFilters}
      />

      {/* Course Cards Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onSelectCourse={(c) => setSelectedCourse(c)}
              onStartCourse={handleStartCourse}
              relatedProjectTitle={
                course.relatedProjectId ? projectsMap[course.relatedProjectId]?.title : null
              }
              onViewRelatedProject={() =>
                handleViewRelatedProject(projectsMap[course.relatedProjectId])
              }
            />
          ))}
        </div>
      ) : (
        /* Empty Filter State */
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center">
            <SearchX className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            No matching courses found
          </h3>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto">
            We couldn't find any courses matching "{searchQuery}". Try broadening your search or resetting active filters.
          </p>
          <button
            id="course-empty-reset-btn"
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Course Details Modal */}
      {selectedCourse && (
        <CourseDetailsModal
          course={selectedCourse}
          onClose={() => {
            setSelectedCourse(null);
            if (searchParams.get('selected')) {
              setSearchParams({});
            }
          }}
          onStartCourse={handleStartCourse}
          onAddToRoadmap={handleAddToRoadmap}
          onViewRelatedProject={handleViewRelatedProject}
          relatedProject={
            selectedCourse.relatedProjectId
              ? projectsMap[selectedCourse.relatedProjectId]
              : null
          }
        />
      )}

      {/* Learning Preferences Modal */}
      {preferencesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Learning Preferences
                </h3>
              </div>
              <button
                onClick={() => setPreferencesOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Weekly Study Commitment (Hours/Week)
                </label>
                <select
                  value={targetPace}
                  onChange={(e) => setTargetPace(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] font-medium"
                >
                  <option value="10">Light (5–10 hrs/week)</option>
                  <option value="15">Steady (10–15 hrs/week)</option>
                  <option value="20">Intense (15–20 hrs/week)</option>
                  <option value="25">Full-Time Sprint (25+ hrs/week)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Preferred Learning Modality
                </label>
                <select
                  value={preferredFormat}
                  onChange={(e) => setPreferredFormat(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] font-medium"
                >
                  <option value="Hands-on labs & projects">Hands-on labs & projects</option>
                  <option value="Video lectures with code along">Video lectures with code along</option>
                  <option value="Theoretical mathematical rigor">Theoretical mathematical rigor</option>
                  <option value="Interview-focused drill questions">Interview-focused drill questions</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[var(--text-secondary)] text-[11px] leading-relaxed">
                Algorithmically calibrating course weights based on {activeCareer || 'Machine Learning Engineer'} requirements and active skill gaps.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                onClick={() => setPreferencesOpen(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setPreferencesOpen(false);
                  setToastMessage({
                    title: 'Preferences Updated',
                    desc: 'Recommendation rankings refreshed for your target pace.',
                    type: 'success',
                  });
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesContent;
