import {
  LayoutDashboard,
  UserCheck,
  BrainCircuit,
  BookOpen,
  FolderGit2,
  GitFork,
  LineChart,
  ShieldCheck,
  MessageSquareQuote,
  Award,
  Building2,
  Bell,
  Settings,
  Compass,
} from 'lucide-react';

/**
 * Centralized Navigation Configuration for PathForge AI
 * Used across desktop Sidebar, mobile drawer, command switcher, and breadcrumbs.
 */
export const navigationConfig = [
  {
    title: 'MAIN',
    items: [
      {
        name: 'Overview',
        to: '/dashboard',
        icon: LayoutDashboard,
        exact: true,
        description: 'AI Career Command Center & telemetry',
      },
      {
        name: 'Career Profile',
        to: '/profile',
        icon: UserCheck,
        description: 'Personalized baseline, goals & experience tier',
      },
      {
        name: 'Skill Intelligence',
        to: '/skill-gap',
        icon: BrainCircuit,
        description: 'Diagnostic skill gap matrix & target benchmarks',
      },
    ],
  },
  {
    title: 'LEARNING',
    items: [
      {
        name: 'Courses',
        to: '/courses',
        icon: BookOpen,
        description: 'Curated curriculum targeting detected skill gaps',
      },
      {
        name: 'Projects',
        to: '/projects',
        icon: FolderGit2,
        description: 'Production capstone projects & technical proofs',
      },
      {
        name: 'Roadmap',
        to: '/roadmap',
        icon: GitFork,
        description: 'Milestone sprint timeline and mastery requirements',
      },
      {
        name: 'Progress',
        to: '/progress',
        icon: LineChart,
        description: 'Study hours, completion velocity & streak analytics',
      },
    ],
  },
  {
    title: 'EVIDENCE',
    items: [
      {
        name: 'Evidence Vault',
        to: '/evidence',
        icon: ShieldCheck,
        badgeKey: 'evidenceVerified',
        description: 'Tamper-evident cryptographic repository proofs',
      },
      {
        name: 'Mentor Feedback',
        to: '/mentor-feedback',
        icon: MessageSquareQuote,
        description: 'Staff engineer rubrics, PR feedback & action items',
      },
    ],
  },
  {
    title: 'CAREER',
    items: [
      {
        name: 'Readiness',
        to: '/readiness',
        icon: Award,
        badgeKey: 'readinessScore',
        badgeSuffix: '%',
        description: 'Multi-factor explainable job readiness index',
      },
      {
        name: 'Company Match',
        to: '/company-match',
        icon: Building2,
        description: 'Target employer skill benchmarks and readiness comparison',
      },
      {
        name: 'Career Selection',
        to: '/career-selection',
        icon: Compass,
        description: 'Explore and switch between industry career roles',
      },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      {
        name: 'Notifications',
        to: '/notifications',
        icon: Bell,
        badgeKey: 'unreadNotificationsCount',
        description: 'Alerts, feedback updates & recalibration events',
      },
      {
        name: 'Settings',
        to: '/settings',
        icon: Settings,
        description: 'Appearance, learning preferences & privacy controls',
      },
    ],
  },
];

/**
 * Flat list of all accessible application routes for search and command palette
 */
export const flatNavigationRoutes = navigationConfig.flatMap((group) =>
  group.items.map((item) => ({
    ...item,
    group: group.title,
  }))
);

export default navigationConfig;
