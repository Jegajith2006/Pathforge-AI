import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { mockProjectsCatalog, mockCoursesCatalog } from '../../data/mockData';
import { ProjectsHeader } from './ProjectsHeader';
import { RecommendedProjectSection } from './RecommendedProjectSection';
import { ProjectFilters } from './ProjectFilters';
import { ProjectCard } from './ProjectCard';
import { ProjectDetailsModal } from './ProjectDetailsModal';
import { Briefcase, SearchX, CheckCircle, Sparkles, X, Plus } from 'lucide-react';

/**
 * ProjectsContent
 * Main Project Studio orchestrator with interactive filtering, details modal, start/push actions, and course links.
 */
export const ProjectsContent = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Local state for projects so start / push updates / new projects update interactively
  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem('pathforge_projects_state');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return mockProjectsCatalog;
  });

  // Courses lookup map for fast reciprocal lookup
  const coursesMap = useMemo(() => {
    const map = {};
    mockCoursesCatalog.forEach((c) => {
      map[c.id] = c;
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
  const [selectedProject, setSelectedProject] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New project mock form state
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState('Deployment');
  const [newProjectDifficulty, setNewProjectDifficulty] = useState('Intermediate');
  const [newProjectDuration, setNewProjectDuration] = useState('2–3 weeks');
  const [newProjectSkills, setNewProjectSkills] = useState('FastAPI, Docker, Python');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  // Check URL query param ?selected=projectId to auto-open modal
  useEffect(() => {
    const requestedId = searchParams.get('selected');
    if (requestedId) {
      const found = projects.find((p) => p.id === requestedId);
      if (found) {
        setSelectedProject(found);
      }
    }
  }, [searchParams, projects]);

  // Persist local projects state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pathforge_projects_state', JSON.stringify(projects));
    } catch {
      // ignore
    }
  }, [projects]);

  // Toast notification auto-dismiss
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Featured project (End-to-End ML Prediction API or flagged as featured)
  const featuredProject = useMemo(() => {
    return (
      projects.find((p) => p.featured || p.id === 'ml-prediction-api') || projects[0]
    );
  }, [projects]);

  // Telemetry counts
  const activeCount = useMemo(
    () => projects.filter((p) => p.status === 'In Progress').length,
    [projects]
  );
  const completedCount = useMemo(
    () => projects.filter((p) => p.status === 'Completed').length,
    [projects]
  );

  // Filtered and Sorted projects list
  const filteredProjects = useMemo(() => {
    let list = [...projects];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.relatedSkill && p.relatedSkill.toLowerCase().includes(q)) ||
          (p.skills && p.skills.some((s) => s.toLowerCase().includes(q))) ||
          (p.skillsDeveloped && p.skillsDeveloped.some((s) => s.toLowerCase().includes(q)))
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      list = list.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Difficulty filter
    if (selectedDifficulty !== 'All') {
      list = list.filter((p) => p.difficulty.toLowerCase() === selectedDifficulty.toLowerCase());
    }

    // Status filter
    if (selectedStatus !== 'All') {
      list = list.filter((p) => p.status.toLowerCase() === selectedStatus.toLowerCase());
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'impact') {
        return (b.readinessImpact || 0) - (a.readinessImpact || 0);
      }
      if (sortBy === 'difficulty') {
        const order = { beginner: 1, intermediate: 2, advanced: 3, capstone: 4 };
        return (
          (order[b.difficulty?.toLowerCase()] || 2) - (order[a.difficulty?.toLowerCase()] || 2)
        );
      }
      if (sortBy === 'duration') {
        const parseWeeks = (d = '') => {
          const m = d.match(/\d+/);
          return m ? parseInt(m[0], 10) : 2;
        };
        return parseWeeks(a.duration) - parseWeeks(b.duration);
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
  }, [projects, searchQuery, selectedCategory, selectedDifficulty, selectedStatus, sortBy]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedDifficulty('All');
    setSelectedStatus('All');
    setSortBy('recommended');
  };

  // Start / push project updates
  const handleStartProject = (project) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === project.id) {
          const newProgress =
            p.status === 'Completed'
              ? 100
              : p.progress === 0
              ? 15
              : Math.min(100, (p.progress || 0) + 20);
          const newStatus = newProgress >= 100 ? 'Completed' : 'In Progress';
          return {
            ...p,
            status: newStatus,
            progress: newProgress,
            lastUpdated: 'Just now',
            currentPhase: newProgress >= 100 ? 'Completed' : 'Verification & Testing',
            nextTask:
              newProgress >= 100
                ? 'Project verified and submitted to Evidence Vault.'
                : 'Run pytest suite and verify Docker container health endpoint.',
          };
        }
        return p;
      })
    );

    if (selectedProject?.id === project.id) {
      const newProgress =
        project.status === 'Completed'
          ? 100
          : project.progress === 0
          ? 15
          : Math.min(100, (project.progress || 0) + 20);
      const newStatus = newProgress >= 100 ? 'Completed' : 'In Progress';
      setSelectedProject({
        ...project,
        status: newStatus,
        progress: newProgress,
        lastUpdated: 'Just now',
        currentPhase: newProgress >= 100 ? 'Completed' : 'Verification & Testing',
        nextTask:
          newProgress >= 100
            ? 'Project verified and submitted to Evidence Vault.'
            : 'Run pytest suite and verify Docker container health endpoint.',
      });
    }

    setToastMessage({
      title: 'Project Sprint Updated',
      desc: `Sprint progress for "${project.title}" logged.`,
      type: 'success',
    });
  };

  // Add to Roadmap action
  const handleAddToRoadmap = (project) => {
    setToastMessage({
      title: 'Added to Roadmap',
      desc: `"${project.title}" was pinned as a priority portfolio milestone.`,
      type: 'success',
    });
  };

  // View related course navigation
  const handleViewRelatedCourse = (course) => {
    if (!course) return;
    navigate(`/courses?selected=${course.id}`);
  };

  // Create new project mock handler
  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;

    const newProj = {
      id: `custom-proj-${Date.now()}`,
      title: newProjectTitle.trim(),
      category: newProjectCategory,
      difficulty: newProjectDifficulty,
      duration: newProjectDuration,
      status: 'In Progress',
      progress: 5,
      skills: newProjectSkills.split(',').map((s) => s.trim()).filter(Boolean),
      skillsDeveloped: newProjectSkills.split(',').map((s) => s.trim()).filter(Boolean),
      relatedSkill: newProjectCategory,
      readinessImpact: 6,
      recommendedReason: 'Self-initiated practical project targeting applied competencies.',
      description:
        newProjectDesc.trim() ||
        'Custom practical project engineered to validate production skills.',
      problemStatement: 'Custom problem statement aligned with practical portfolio evidence.',
      projectObjective: 'Build and deploy a functional prototype with automated testing.',
      deliverables: [
        'Source code repository with git history',
        'Working prototype with documentation',
        'Automated test suite',
      ],
      techStack: newProjectSkills.split(',').map((s) => s.trim()).filter(Boolean),
      currentPhase: 'Sprint Initialization',
      nextTask: 'Set up repository structure and requirements.txt.',
      lastUpdated: 'Just now',
    };

    setProjects((prev) => [newProj, ...prev]);
    setCreateModalOpen(false);
    setNewProjectTitle('');
    setNewProjectDesc('');

    setToastMessage({
      title: 'Project Created',
      desc: `"${newProj.title}" is now active in your Project Studio.`,
      type: 'success',
    });
  };

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

      {/* Studio Header */}
      <ProjectsHeader
        recommendedCount={projects.length}
        completedCount={completedCount}
        activeCount={activeCount}
        evidenceCount={5}
        onAddNewProject={() => setCreateModalOpen(true)}
      />

      {/* Featured Project Section */}
      <RecommendedProjectSection
        featuredProject={featuredProject}
        onSelectProject={(p) => setSelectedProject(p)}
        onStartProject={handleStartProject}
        onAddToRoadmap={handleAddToRoadmap}
        relatedCourse={
          featuredProject?.relatedCourseId
            ? coursesMap[featuredProject.relatedCourseId]
            : null
        }
        onViewRelatedCourse={handleViewRelatedCourse}
      />

      {/* Filters Toolbar */}
      <ProjectFilters
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
        totalResults={filteredProjects.length}
        onResetFilters={handleResetFilters}
      />

      {/* Projects Cards Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelectProject={(p) => setSelectedProject(p)}
              onStartProject={handleStartProject}
              relatedCourseTitle={
                project.relatedCourseId ? coursesMap[project.relatedCourseId]?.title : null
              }
              onViewRelatedCourse={() =>
                handleViewRelatedCourse(coursesMap[project.relatedCourseId])
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
            No matching projects found
          </h3>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto">
            We couldn't find any projects matching "{searchQuery}". Try adjusting your filters or search keywords.
          </p>
          <button
            id="project-empty-reset-btn"
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          onClose={() => {
            setSelectedProject(null);
            if (searchParams.get('selected')) {
              setSearchParams({});
            }
          }}
          onStartProject={handleStartProject}
          onAddToRoadmap={handleAddToRoadmap}
          onViewRelatedCourse={handleViewRelatedCourse}
          relatedCourse={
            selectedProject.relatedCourseId
              ? coursesMap[selectedProject.relatedCourseId]
              : null
          }
        />
      )}

      {/* Add New Project Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Add New Practical Project
                </h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder="e.g. Distributed Model Training with Ray"
                  className="w-full py-2 px-3 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] font-medium placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Category
                  </label>
                  <select
                    value={newProjectCategory}
                    onChange={(e) => setNewProjectCategory(e.target.value)}
                    className="w-full py-2 px-2.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] font-medium"
                  >
                    <option value="Deployment">Deployment</option>
                    <option value="Machine Learning">Machine Learning</option>
                    <option value="Deep Learning">Deep Learning</option>
                    <option value="Data Science">Data Science</option>
                    <option value="NLP">NLP</option>
                    <option value="Computer Vision">Computer Vision</option>
                    <option value="Recommendation Systems">Recommendation Systems</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Difficulty
                  </label>
                  <select
                    value={newProjectDifficulty}
                    onChange={(e) => setNewProjectDifficulty(e.target.value)}
                    className="w-full py-2 px-2.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] font-medium"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Estimated Duration
                  </label>
                  <input
                    type="text"
                    value={newProjectDuration}
                    onChange={(e) => setNewProjectDuration(e.target.value)}
                    placeholder="e.g. 2–3 weeks"
                    className="w-full py-2 px-3 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Tech Stack (comma separated)
                  </label>
                  <input
                    type="text"
                    value={newProjectSkills}
                    onChange={(e) => setNewProjectSkills(e.target.value)}
                    placeholder="Python, PyTorch, Docker"
                    className="w-full py-2 px-3 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Description & Problem Statement
                </label>
                <textarea
                  rows={3}
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Outline the problem this project solves and expected deliverables..."
                  className="w-full py-2 px-3 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] font-medium placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30"
                >
                  Create & Launch Sprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsContent;
