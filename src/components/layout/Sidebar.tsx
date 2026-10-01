import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  Briefcase,
  GitFork,
  BarChart3,
  Archive,
  MessageSquareQuote,
  Award,
  Building,
  Settings,
  ChevronLeft,
  ChevronRight,
  Compass,
  Trophy,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onMobileClose,
}) => {
  const { user } = useAuth();

  const navigation = [
    { name: 'Overview', href: '/app', icon: LayoutDashboard },
    { name: 'Skill Intelligence', href: '/app/skills', icon: Sparkles },
    { name: 'Courses', href: '/app/courses', icon: BookOpen },
    { name: 'Projects', href: '/app/projects', icon: Briefcase },
    { name: 'My Roadmap', href: '/app/roadmap', icon: GitFork },
    { name: 'Progress', href: '/app/progress', icon: BarChart3 },
    { name: 'Evidence Vault', href: '/app/evidence', icon: Archive },
    { name: 'Mentor Feedback', href: '/app/mentor', icon: MessageSquareQuote },
    { name: 'Readiness Score', href: '/app/readiness', icon: Award },
    { name: 'Company Match', href: '/app/company', icon: Building },
    { name: 'Settings', href: '/app/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0B0F19] border-r border-slate-800/80 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Header Branding */}
        <div className="flex items-center justify-between p-4 h-16 border-b border-slate-800/80">
          {!collapsed ? (
            <BrandLogo size="sm" linkTo="/app" />
          ) : (
            <div className="mx-auto">
              <BrandLogo size="sm" linkTo="/app" />
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/app'}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/90 to-indigo-700/60 text-white shadow-lg shadow-indigo-950/50 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  } ${collapsed ? 'justify-center' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Glowing active notch */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-sky-400 rounded-r-full shadow-sm shadow-sky-400" />
                    )}

                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-sky-300' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />

                    {!collapsed && <span className="truncate">{item.name}</span>}

                    {/* Collapsed Tooltip */}
                    {collapsed && (
                      <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md shadow-xl border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                        {item.name}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Sidebar Panel: "Your Next Milestone" */}
        {!collapsed ? (
          <div className="p-3 m-3 rounded-xl bg-gradient-to-br from-indigo-950/40 to-slate-900/80 border border-indigo-500/20 text-xs">
            <div className="flex items-center gap-2 mb-1.5 text-indigo-400 font-bold">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Your Next Milestone</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Complete 2 more skills (SQL & Tableau) to unlock your next career level benchmark.
            </p>
            <div className="mt-2.5 h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 w-2/3 rounded-full" />
            </div>
          </div>
        ) : (
          <div className="p-3 text-center border-t border-slate-800">
            <div
              className="w-8 h-8 mx-auto rounded-lg bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-amber-400 cursor-pointer"
              title="Milestone: Complete 2 skills to level up"
            >
              <Trophy className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* User Mini Profile in Sidebar */}
        <div className="p-3 border-t border-slate-800/80 flex items-center gap-3">
          <img
            src={user?.avatar}
            alt={user?.name}
            className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
          />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.targetCareer}</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
