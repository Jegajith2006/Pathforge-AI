import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Search,
  LayoutDashboard,
  BrainCircuit,
  BookOpen,
  FolderGit2,
  GitFork,
  LineChart,
  ShieldCheck,
  MessageSquareQuote,
  Award,
  Building2,
  User,
  Settings,
  Compass,
  ArrowRight,
  Sparkles,
  Bell,
  Code,
} from 'lucide-react';
import {
  mockSkills,
  mockRecommendedCourses,
  mockRecommendedProjects,
} from '../../data/mockData';
import { companyMatchData } from '../../data/companyMatchData';

/**
 * CommandSearch component
 * Global Command Palette & Unified Search (⌘K / Ctrl+K)
 * Queries across routes, courses, projects, skills, and target companies.
 */
export const CommandSearch = () => {
  const { commandPaletteOpen, setCommandPaletteOpen } = useApp();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // 1. Navigation Routes
  const navigationCommands = useMemo(() => [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, category: 'Navigation', desc: 'AI Career Command Center & telemetry' },
    { name: 'Career Profile', path: '/profile', icon: User, category: 'Navigation', desc: 'Personalized baseline, goals & experience tier' },
    { name: 'Skill Intelligence', path: '/skill-gap', icon: BrainCircuit, category: 'Navigation', desc: 'Diagnostic skill gap matrix & target benchmarks' },
    { name: 'Course Catalog', path: '/courses', icon: BookOpen, category: 'Navigation', desc: 'Curated curriculum targeting detected skill gaps' },
    { name: 'Project Capstones', path: '/projects', icon: FolderGit2, category: 'Navigation', desc: 'Production capstone projects & technical proofs' },
    { name: 'Learning Roadmap', path: '/roadmap', icon: GitFork, category: 'Navigation', desc: 'Milestone sprint timeline and mastery requirements' },
    { name: 'Progress & Velocity', path: '/progress', icon: LineChart, category: 'Navigation', desc: 'Study hours, completion velocity & streak analytics' },
    { name: 'Evidence Vault', path: '/evidence', icon: ShieldCheck, category: 'Navigation', desc: 'Cryptographically hashed proof-of-work' },
    { name: 'Mentor Feedback', path: '/mentor-feedback', icon: MessageSquareQuote, category: 'Navigation', desc: 'Staff engineer rubrics & code reviews' },
    { name: 'Readiness Index', path: '/readiness', icon: Award, category: 'Navigation', desc: 'Multi-factor employer readiness index' },
    { name: 'Company Match', path: '/company-match', icon: Building2, category: 'Navigation', desc: 'Live company requirements & candidate match' },
    { name: 'Career Selection', path: '/career-selection', icon: Compass, category: 'Navigation', desc: 'Switch target profession & role tracks' },
    { name: 'Notification Center', path: '/notifications', icon: Bell, category: 'Navigation', desc: 'Review system alerts & recalibration logs' },
    { name: 'Settings', path: '/settings', icon: Settings, category: 'Navigation', desc: 'Account preferences & security configurations' },
  ], []);

  // 2. Courses
  const courseCommands = useMemo(() => (
    mockRecommendedCourses.map((c) => ({
      name: c.title,
      path: '/courses',
      icon: BookOpen,
      category: 'Course',
      desc: `${c.provider} · ${c.duration} · ${c.difficulty} · ${c.matchScore}% Match`,
    }))
  ), []);

  // 3. Projects
  const projectCommands = useMemo(() => (
    mockRecommendedProjects.map((p) => ({
      name: p.title,
      path: '/projects',
      icon: FolderGit2,
      category: 'Project',
      desc: `${p.difficulty} · ${p.deliverables}`,
    }))
  ), []);

  // 4. Skills
  const skillCommands = useMemo(() => (
    mockSkills.map((s) => ({
      name: `${s.name} (${s.currentLevel}%)`,
      path: '/skill-gap',
      icon: Code,
      category: 'Skill',
      desc: `Category: ${s.category} · Status: ${s.status} (Target: ${s.requiredLevel}%)`,
    }))
  ), []);

  // 5. Companies
  const companyCommands = useMemo(() => (
    companyMatchData.map((co) => ({
      name: `${co.company} - ${co.role}`,
      path: '/company-match',
      icon: Building2,
      category: 'Company',
      desc: `${co.matchScore}% Candidate Match · ${co.salaryRange}`,
    }))
  ), []);

  // All unified items
  const allItems = useMemo(() => [
    ...navigationCommands,
    ...courseCommands,
    ...projectCommands,
    ...skillCommands,
    ...companyCommands,
  ], [navigationCommands, courseCommands, projectCommands, skillCommands, companyCommands]);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      return navigationCommands; // Default to key navigation shortcuts when empty
    }
    const q = query.toLowerCase();
    return allItems.filter(
      (cmd) =>
        cmd.name.toLowerCase().includes(q) ||
        cmd.desc?.toLowerCase().includes(q) ||
        cmd.category?.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [allItems, navigationCommands, query]);

  // Auto focus input when opened
  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  // Handle keyboard navigation inside command palette
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        handleSelect(filteredCommands[selectedIndex].path);
      }
    }
  };

  const handleSelect = (path) => {
    setCommandPaletteOpen(false);
    navigate(path);
  };

  if (!commandPaletteOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette and Global Search"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 px-4 animate-fade-in"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-[var(--modal-bg)] border border-[var(--modal-border)] rounded-2xl shadow-2xl overflow-hidden text-[var(--text-primary)] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)] bg-[var(--surface-secondary)]">
          <Search className="w-5 h-5 text-indigo-500 dark:text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search courses, projects, skills, companies, or commands..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden font-sans"
          />
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-[var(--surface-tertiary)] text-[var(--text-muted)] border border-[var(--border)]">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="p-2 max-h-96 overflow-y-auto custom-scrollbar divide-y divide-[var(--border)]">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-muted)] space-y-1">
              <p>No matching courses, projects, skills, or commands found for &ldquo;{query}&rdquo;.</p>
              <p className="text-[11px] text-[var(--text-secondary)]">Try searching for &quot;Python&quot;, &quot;Stripe&quot;, &quot;Fraud&quot;, &quot;Roadmap&quot;, or &quot;Readiness&quot;.</p>
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = cmd.icon;
              return (
                <button
                  key={`${cmd.category}-${cmd.name}-${idx}`}
                  type="button"
                  onClick={() => handleSelect(cmd.path)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`
                    w-full
                    flex
                    items-center
                    justify-between
                    px-3.5
                    py-2.5
                    rounded-xl
                    text-left
                    transition-colors
                    cursor-pointer
                    ${
                      isSelected
                        ? 'bg-[var(--sidebar-item-active)] text-[var(--text-primary)] border border-indigo-500/40 font-medium'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] border border-transparent'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg border ${
                        isSelected
                          ? 'bg-[var(--accent-surface)] border-indigo-400/40 text-indigo-600 dark:text-cyan-400'
                          : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-muted)]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold font-display text-[var(--text-primary)] truncate">
                        {cmd.name}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] truncate">
                        {cmd.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-muted)]">
                      {cmd.category}
                    </span>
                    <ArrowRight
                      className={`w-3.5 h-3.5 ${
                        isSelected ? 'text-indigo-600 dark:text-cyan-400 translate-x-0.5' : 'text-[var(--text-muted)]'
                      } transition-transform`}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2.5 bg-[var(--surface-secondary)] border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 rounded bg-[var(--surface-tertiary)] border border-[var(--border)] text-[var(--text-secondary)]">
                ↑
              </kbd>{' '}
              <kbd className="px-1 py-0.5 rounded bg-[var(--surface-tertiary)] border border-[var(--border)] text-[var(--text-secondary)]">
                ↓
              </kbd>{' '}
              to navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded bg-[var(--surface-tertiary)] border border-[var(--border)] text-[var(--text-secondary)]">
                ↵
              </kbd>{' '}
              to select
            </span>
          </div>
          <span className="flex items-center gap-1 text-indigo-600 dark:text-cyan-400 font-medium">
            <Sparkles className="w-3 h-3" />
            <span>Unified Search</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandSearch;
