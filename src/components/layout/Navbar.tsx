import React, { useState } from 'react';
import {
  Bell,
  Search,
  Moon,
  Sun,
  Menu,
  Sparkles,
  CheckCircle,
  Clock,
  LogOut,
  User,
  Settings,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onOpenMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const notifications = [
    {
      id: 'notif_1',
      title: 'Mentor Feedback Received',
      text: 'Sarah Chen reviewed your Customer Segmentation report with 5★ rating.',
      time: '2 hours ago',
      unread: true,
    },
    {
      id: 'notif_2',
      title: 'Skill Gap Recalibrated',
      text: 'SQL Window Functions marked as high-priority sprint milestone.',
      time: 'Yesterday',
      unread: false,
    },
    {
      id: 'notif_3',
      title: 'Readiness Milestone Unlocked',
      text: 'Your Career Readiness increased from 64% to 69%.',
      time: '3 days ago',
      unread: false,
    },
  ];

  const handleLogout = () => {
    logout();
    addToast('Signed Out', 'You have been safely logged out.', 'info');
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    addToast('Searching Career Command Center', `Querying skill intelligence for "${searchQuery}"...`, 'info');
    setIsSearchOpen(false);
    navigate('/app/skills');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-[#0B0F19]/90 border-b border-slate-800/80 backdrop-blur-md">
      {/* Left: Mobile hamburger & Active role indicator */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400">Target Role:</span>
          <span className="text-white font-bold">{user?.targetCareer || 'Data Analyst'}</span>
        </div>
      </div>

      {/* Center/Right Actions: Command Search, Theme Toggle, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Search Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">Search skills, courses, roadmap...</span>
          <span className="hidden md:inline px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400">
            ⌘K
          </span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsProfileMenuOpen(false);
            }}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500" />
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#111827] border border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Career Notifications (3)
                </span>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-800/60 mt-2 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="py-2.5 px-2 hover:bg-slate-800/40 rounded-xl transition-colors">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-white">{n.title}</p>
                      <span className="text-[10px] text-slate-500">{n.time}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-snug">{n.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsProfileMenuOpen(!isProfileMenuOpen);
              setIsNotificationsOpen(false);
            }}
            className="flex items-center gap-2 p-1 pl-2 rounded-xl hover:bg-slate-800/60 transition-colors"
          >
            <span className="hidden sm:inline text-xs font-semibold text-white">
              {user?.name}
            </span>
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-7 h-7 rounded-full object-cover border border-indigo-500/40"
            />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#111827] border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="p-2 border-b border-slate-800">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {user?.currentLevelName}
                </span>
              </div>

              <div className="py-1 space-y-0.5 text-xs">
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    navigate('/app/settings');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Account Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded-xl transition-colors text-left font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Command/Search Palette Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-start justify-center pt-20 p-4">
          <div className="w-full max-w-xl bg-[#111827] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <form onSubmit={handleSearchSubmit} className="flex items-center p-4 border-b border-slate-800">
              <Search className="w-5 h-5 text-indigo-400 mr-3 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search skills (e.g. SQL, Python, Tableau), courses, or company benchmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-hidden"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
            <div className="p-4 space-y-2 text-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Suggested Searches:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['SQL Window Functions', 'Tableau Dashboards', 'Spotify Product Analyst', 'Evidence Vault Submission', 'Data Warehousing'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setSearchQuery(item);
                      setIsSearchOpen(false);
                      navigate('/app/skills');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
