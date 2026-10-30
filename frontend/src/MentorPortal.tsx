import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from './services/api';
import { useAuth } from './App';
import {
  Sparkles,
  LayoutDashboard,
  Users,
  CalendarDays,
  Activity,
  ClipboardCheck,
  FolderKanban,
  Target,
  MessageSquareText,
  BookOpen,
  UserRound,
  Settings,
  Search,
  Bell,
  LogOut,
  Calendar,
  Clock,
  Clock3,
  ArrowRight,
  ExternalLink,
  Plus,
  CheckCircle2,
  Check,
  Star,
  ChevronRight,
  AlertCircle,
  FileCheck2,
  TrendingUp,
  X,
  Send,
  Trash2,
  Edit,
  GraduationCap,
  ShieldCheck,
  Award,
  ArrowLeft,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  BarChart2,
  PieChart,
  BookOpenCheck,
  RefreshCw,
  FileText,
  Layers,
  Menu,
} from 'lucide-react';

interface MentorPortalProps {
  notify: (msg: string) => void;
}

// ==========================================
// SHARED STUDENT NAME & EMAIL BLOCK COMPONENT
// ==========================================
function StudentNameEmail({
  name,
  email,
  nameStyle,
  emailStyle,
  className,
}: {
  name: string;
  email?: string | null;
  nameStyle?: React.CSSProperties;
  emailStyle?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div className={`student-identity-block ${className || ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0, overflow: 'hidden' }}>
      <span
        className="student-primary-name"
        style={{
          display: 'block',
          fontWeight: 600,
          color: '#0F172A',
          fontSize: '0.88rem',
          lineHeight: 1.35,
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
          ...nameStyle,
        }}
      >
        {name}
      </span>
      {email ? (
        <span
          className="student-secondary-email"
          style={{
            display: 'block',
            fontSize: '0.78rem',
            color: '#64748B',
            lineHeight: 1.3,
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
            ...emailStyle,
          }}
        >
          {email}
        </span>
      ) : null}
    </div>
  );
}

export function MentorPortal({ notify }: MentorPortalProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Active page derived from route
  const currentPath = location.pathname;
  const activeTab = currentPath.replace(/^\/mentor\/?/, '') || 'dashboard';

  // State data loaded from real backend
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [mentorshipRequests, setMentorshipRequests] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [projectReviews, setProjectReviews] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [modalTab, setModalTab] = useState<'skills' | 'roadmap' | 'reviews' | 'guidance' | 'sessions'>('skills');

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReviewProject, setSelectedReviewProject] = useState<any>(null);
  const [showResourceModal, setShowResourceModal] = useState(false);

  // Load Dashboard & Global Mentor Data
  const loadPortalData = async () => {
    setLoading(true);
    try {
      const [dash, stList, reqList, sessList, revList, convList, resList, prof, notifList] = await Promise.all([
        api.getMentorDashboard().catch(() => null),
        api.getMentorStudents().catch(() => []),
        api.getMentorRequests().catch(() => []),
        api.getMentorSessions().catch(() => []),
        api.getMentorProjectReviews().catch(() => []),
        api.getMentorConversations().catch(() => []),
        api.getMentorResources().catch(() => []),
        api.getMentorProfile().catch(() => null),
        api.getMentorNotifications().catch(() => []),
      ]);

      if (dash) setDashboardData(dash);
      if (stList) setStudents(stList);
      if (reqList) setMentorshipRequests(reqList);
      if (sessList) setSessions(sessList);
      if (revList) setProjectReviews(revList);
      if (convList) setConversations(convList);
      if (resList) setResources(resList);
      if (prof) setProfile(prof);
      if (notifList) setNotifications(notifList);
    } catch (err) {
      console.error('[MentorPortal] Failed loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
    const interval = setInterval(async () => {
      try {
        const [convList, notifList] = await Promise.all([
          api.getMentorConversations().catch(() => null),
          api.getMentorNotifications().catch(() => null),
        ]);
        if (convList) setConversations(convList);
        if (notifList) setNotifications(notifList);
      } catch (e) {
        // quiet background refresh
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const contentScrollRef = useRef<HTMLDivElement>(null);

  // Disable browser automatic scroll restoration and reset content scroll on route tab change
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  const mentorName = profile?.name || user?.name || user?.full_name || 'Mentor';
  const mentorTitle = profile?.title || 'Principal Mentor';
  const mentorInitials = mentorName
    .split(' ')
    .filter((w: string) => !w.includes('.'))
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AC';

  const unreadMsgCount = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);
  const unreadNotifCount = notifications.filter((n) => !n.is_read).length;
  const pendingRequestsCount = mentorshipRequests.filter((r) => r.status === 'pending').length;

  // Navigation Items matching Reference Image
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/mentor/dashboard' },
    {
      id: 'students',
      label: 'My Students',
      icon: Users,
      path: '/mentor/students',
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
    },
    { id: 'sessions', label: 'Mentorship Sessions', icon: CalendarDays, path: '/mentor/sessions' },
    { id: 'progress', label: 'Student Progress', icon: Activity, path: '/mentor/progress' },
    { id: 'assessments', label: 'Skill Assessments', icon: ClipboardCheck, path: '/mentor/assessments' },
    { id: 'project-reviews', label: 'Project Reviews', icon: FolderKanban, path: '/mentor/project-reviews' },
    { id: 'career-guidance', label: 'Career Guidance', icon: Target, path: '/mentor/career-guidance' },
    { id: 'expertise', label: 'Manage Expertise', icon: Award, path: '/mentor/expertise' },
    { id: 'availability', label: 'Availability', icon: Clock, path: '/mentor/availability' },
    { id: 'messages', label: 'Messages', icon: MessageSquareText, path: '/mentor/messages', badge: unreadMsgCount > 0 ? unreadMsgCount : undefined },
    { id: 'resources', label: 'Resources', icon: BookOpen, path: '/mentor/resources' },
    { id: 'profile', label: 'Profile', icon: UserRound, path: '/mentor/profile' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/mentor/settings' },
  ];

  const handleOpenStudentDetail = async (studentId: string) => {
    try {
      const detail = await api.getMentorStudentDetail(studentId);
      setSelectedStudentDetail(detail);
      setModalTab('skills');
      setShowDetailModal(true);
    } catch (err: any) {
      notify(`Cannot view student: ${err.message}`);
    }
  };

  return (
    <div className="mentor-portal-shell">
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="mentor-sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ==============================================================
          DARK NAVY SIDEBAR (MATCHING REFERENCE IMAGE)
          ============================================================== */}
      <aside className={`mentor-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="mentor-sidebar-brand" onClick={() => { navigate('/mentor/dashboard'); setMobileMenuOpen(false); }}>
          <div className="mentor-brand-icon">
            <Sparkles size={20} className="sparkle-svg" />
          </div>
          <span className="mentor-brand-title">
            PathForge <b>AI</b>
          </span>
        </div>

        {/* Navigation List */}
        <nav className="mentor-sidebar-nav">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`mentor-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
              >
                <IconComponent size={18} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="nav-badge-bubble">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom User Profile Section */}
        <div
          className="mentor-sidebar-footer sidebar-profile"
          style={{
            background: '#172B4D',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          <div
            className="mentor-mini-profile sidebar-profile-info"
            onClick={() => { navigate('/mentor/profile'); setMobileMenuOpen(false); }}
            title="View Profile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              flex: '1 1 0%',
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <div
              className="mentor-avatar-circle avatar"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#315EAC',
                color: '#FFFFFF',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                flexShrink: 0,
              }}
            >
              {mentorInitials}
            </div>
            <div
              className="mentor-profile-info sidebar-profile-text"
              style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                flex: '1 1 0%',
                minWidth: 0,
              }}
            >
              <span
                className="mentor-profile-name user-name"
                style={{
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: '#F8FAFC',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'block',
                  width: '100%',
                }}
              >
                {mentorName}
              </span>
              <span
                className="mentor-profile-role user-role"
                style={{
                  fontSize: '0.74rem',
                  color: '#CBD5E1',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'block',
                  width: '100%',
                }}
              >
                Mentor
              </span>
            </div>
          </div>
          <button
            type="button"
            className="mentor-logout-btn sidebar-logout-button"
            onClick={() => {
              logout();
              notify('Signed out successfully.');
              navigate('/login');
            }}
            title="Sign Out"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: '0 0 32px',
              width: '32px',
              height: '32px',
              minWidth: '32px',
              maxWidth: '32px',
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: '#94A3B8',
              cursor: 'pointer',
              flexShrink: 0,
              padding: 0,
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ==============================================================
          MAIN CONTENT AREA
          ============================================================== */}
      <div className="mentor-main-container">
        {/* Top Header Bar */}
        <header className="mentor-top-header">
          <div className="mentor-header-left">
            <button
              type="button"
              className="mentor-mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              <Menu size={20} />
            </button>

            {/* Global Search */}
            <div className="mentor-search-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search students, skills, or sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="mentor-header-actions">
            <div className="notification-dropdown-wrapper">
              <button
                type="button"
                className="header-notification-btn"
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                title="Notifications"
              >
                <Bell size={18} />
                {unreadNotifCount > 0 && <span className="notification-dot">{unreadNotifCount}</span>}
              </button>

              {showNotifDropdown && (
                <div className="notification-popover-menu">
                  <div className="notification-popover-header">
                    <h4><Bell size={16} style={{ color: '#8BB7F9' }} /> Notifications</h4>
                    {unreadNotifCount > 0 && (
                      <button
                        type="button"
                        className="btn-mark-all"
                        onClick={async () => {
                          try {
                            await api.markAllMentorNotificationsRead();
                            setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
                            notify('All notifications marked as read');
                          } catch (e: any) {
                            notify(`Error: ${e.message}`);
                          }
                        }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="notification-popover-list">
                    {notifications.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.notification_id}
                          className={`notification-item ${!n.is_read ? 'unread' : ''}`}
                          onClick={async () => {
                            if (!n.is_read) {
                              try {
                                await api.markMentorNotificationRead(n.notification_id);
                                setNotifications(notifications.map((item) => item.notification_id === n.notification_id ? { ...item, is_read: true } : item));
                              } catch (e) {
                                console.error(e);
                              }
                            }
                            if (n.type === 'message') {
                              navigate('/mentor/messages');
                              setShowNotifDropdown(false);
                            } else if (n.type === 'session') {
                              navigate('/mentor/sessions');
                              setShowNotifDropdown(false);
                            } else if (n.type === 'request') {
                              navigate('/mentor/students');
                              setShowNotifDropdown(false);
                            }
                          }}
                        >
                          <div className="notification-item-icon">
                            {n.type === 'message' ? <MessageSquareText size={15} /> :
                             n.type === 'session' ? <CalendarDays size={15} /> :
                             n.type === 'request' ? <Users size={15} /> :
                             <Bell size={15} />}
                          </div>
                          <div className="notification-item-content">
                            <div className="notification-item-title">
                              <span>{n.title}</span>
                              {!n.is_read && <span className="notification-unread-dot" />}
                            </div>
                            <p className="notification-item-desc">{n.message}</p>
                            <span className="notification-item-time">{n.created_at}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div
              className="header-user-pill"
              onClick={() => navigate('/mentor/profile')}
              style={{ cursor: 'pointer' }}
            >
              <div className="header-avatar">{mentorInitials}</div>
              <div className="header-user-text">
                <span className="user-name">{mentorName}</span>
                <span className="user-role">Mentor</span>
              </div>
            </div>

            <button
              type="button"
              className="sign-out-outline-btn"
              onClick={() => {
                logout();
                notify('Signed out.');
                navigate('/login');
              }}
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Independently Scrollable Page Content Area */}
        <div className="mentor-content-scroll-area" ref={contentScrollRef}>
          <main className="mentor-content-body">
          {profile?.verification_status === 'Pending Review' ? (
            <div style={{ maxWidth: '680px', margin: '48px auto', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #DFE7F2', padding: '36px', boxShadow: '0 4px 20px rgba(16, 38, 83, 0.05)', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FFFBEB', border: '2px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#D97706' }}>
                <Clock3 size={32} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#172B4D', margin: '0 0 10px' }}>
                Application Under Review
              </h2>
              <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6, margin: '0 0 24px' }}>
                Thank you for applying to be a PathForge mentor, <strong>{mentorName}</strong>. Your professional credentials, organization claims, and verification documents are currently being audited by PathForge administrators.
              </p>

              <div style={{ background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', textAlign: 'left', marginBottom: '28px', fontSize: '13px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Status:</span>
                  <span style={{ color: '#D97706', fontWeight: 700 }}>Pending Review (Credentials Audit)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Mentor ID:</span>
                  <span style={{ color: '#172B4D', fontFamily: 'monospace' }}>{profile?.mentor_id || user?.user_id}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Title & Company:</span>
                  <span style={{ color: '#172B4D' }}>{profile?.title || 'Senior Engineer'} at {profile?.company || 'Industry Partner'}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Workspace Notice:</span>
                  <span style={{ color: '#475569' }}>Mentorship workspace features (including student requests, 1-on-1 sessions, and capstone evaluations) remain strictly locked until an administrator approves your verification credentials.</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={async () => {
                    notify('Refreshing verification status...');
                    try {
                      const p = await api.getMentorProfile();
                      if (p) setProfile(p);
                    } catch (e) {}
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: '1px solid #DFE7F2',
                    background: '#FFFFFF',
                    color: '#172B4D',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <RefreshCw size={14} /> Refresh Status
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#EF4444',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : profile?.verification_status === 'Rejected' ? (
            <div style={{ maxWidth: '680px', margin: '48px auto', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #FECACA', padding: '36px', boxShadow: '0 4px 20px rgba(220, 38, 38, 0.05)', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FEF2F2', border: '2px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#DC2626' }}>
                <AlertTriangle size={32} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#172B4D', margin: '0 0 10px' }}>
                Application Not Approved
              </h2>
              <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6, margin: '0 0 24px' }}>
                Your mentor application for <strong>{mentorName}</strong> was reviewed by administrators and could not be approved at this time.
              </p>

              <div style={{ background: '#FEF2F2', borderRadius: '12px', border: '1px solid #FECACA', padding: '20px', textAlign: 'left', marginBottom: '28px', fontSize: '13px' }}>
                <div style={{ fontWeight: 700, color: '#991B1B', marginBottom: '6px' }}>Administrator Explanation:</div>
                <div style={{ color: '#7F1D1D', lineHeight: 1.5 }}>
                  {profile?.rejection_reason || 'Submitted credentials could not be verified according to our academic and industry mentorship criteria.'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#DC2626',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
            <DashboardView
              data={dashboardData}
              mentorName={mentorName}
              notify={notify}
              navigate={navigate}
              onInspectStudent={handleOpenStudentDetail}
            />
          )}

          {activeTab === 'students' && (
            <StudentsView
              students={students}
              requests={mentorshipRequests}
              searchQuery={searchQuery}
              notify={notify}
              navigate={navigate}
              onInspectStudent={handleOpenStudentDetail}
              onViewProgress={(studentId: string) => navigate(`/mentor/progress?studentId=${studentId}`)}
              refreshData={loadPortalData}
            />
          )}

          {activeTab === 'sessions' && (
            <SessionsView
              sessions={sessions}
              students={students}
              notify={notify}
              refreshData={loadPortalData}
            />
          )}

          {activeTab === 'progress' && (
            <ProgressView
              students={students}
              notify={notify}
              refreshData={loadPortalData}
              onInspectStudent={handleOpenStudentDetail}
            />
          )}

          {activeTab === 'assessments' && (
            <AssessmentsView
              students={students}
              notify={notify}
              refreshData={loadPortalData}
            />
          )}

          {activeTab === 'project-reviews' && (
            <ProjectReviewsView
              reviews={projectReviews}
              students={students}
              notify={notify}
              refreshData={loadPortalData}
            />
          )}

          {activeTab === 'career-guidance' && (
            <CareerGuidanceView
              students={students}
              notify={notify}
            />
          )}

          {activeTab === 'messages' && (
            <MessagesView
              conversations={conversations}
              students={students}
              notify={notify}
              navigate={navigate}
              refreshData={loadPortalData}
            />
          )}

          {activeTab === 'resources' && (
            <ResourcesView
              resources={resources}
              notify={notify}
              refreshData={loadPortalData}
            />
          )}

          {activeTab === 'expertise' && (
            <ManageExpertiseView
              notify={notify}
              refreshData={loadPortalData}
            />
          )}

          {activeTab === 'availability' && (
            <AvailabilitySettingsView
              profile={profile}
              notify={notify}
              refreshData={loadPortalData}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              profile={profile}
              notify={notify}
              refreshData={loadPortalData}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              profile={profile}
              notify={notify}
              refreshData={loadPortalData}
            />
          )}
            </>
          )}

        </main>
        </div>
      </div>

      {/* ==============================================================
          STUDENT DETAIL DRAWER / MODAL
          ============================================================== */}
      {showDetailModal && selectedStudentDetail && (
        <div className="mentor-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="mentor-modal-card large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="student-modal-title">
                <div className="modal-avatar">
                  {selectedStudentDetail.name.split(' ').map((w: string) => w[0]).join('')}
                </div>
                <div>
                  <h2 style={{ margin: '0 0 3px', color: '#0F172A', fontWeight: 700, fontSize: '1.25rem' }}>
                    {selectedStudentDetail.name}
                  </h2>
                  {selectedStudentDetail.email && (
                    <div style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '4px', overflowWrap: 'anywhere' }}>
                      {selectedStudentDetail.email}
                    </div>
                  )}
                  <p style={{ margin: '0 0 6px', color: '#64748B', fontSize: '0.8rem' }}>
                    {selectedStudentDetail.degree} • {selectedStudentDetail.college}
                  </p>
                  <span className="badge-career">{selectedStudentDetail.target_career_name}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', marginRight: '16px' }}>
                <button
                  type="button"
                  className="primary-action-btn purple-gradient"
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                  onClick={() => {
                    setShowDetailModal(false);
                    navigate('/mentor/sessions');
                  }}
                >
                  <Calendar size={13} /> Schedule Session
                </button>
                <button
                  type="button"
                  className="btn-inspect"
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                  onClick={() => {
                    setShowDetailModal(false);
                    navigate('/mentor/messages');
                  }}
                >
                  <MessageSquareText size={13} /> Message
                </button>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setShowDetailModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Tab navigation */}
            <div className="modal-nav-tabs">
              <button
                type="button"
                className={`modal-nav-tab ${modalTab === 'skills' ? 'active' : ''}`}
                onClick={() => setModalTab('skills')}
              >
                Demonstrated Skills ({selectedStudentDetail.skills?.length || 0})
              </button>
              <button
                type="button"
                className={`modal-nav-tab ${modalTab === 'roadmap' ? 'active' : ''}`}
                onClick={() => setModalTab('roadmap')}
              >
                Roadmap Milestones ({selectedStudentDetail.roadmap_steps?.length || 0})
              </button>
              <button
                type="button"
                className={`modal-nav-tab ${modalTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setModalTab('reviews')}
              >
                Project Reviews ({selectedStudentDetail.reviews?.length || 0})
              </button>
              <button
                type="button"
                className={`modal-nav-tab ${modalTab === 'guidance' ? 'active' : ''}`}
                onClick={() => setModalTab('guidance')}
              >
                Guidance History ({selectedStudentDetail.guidance_notes?.length || 0})
              </button>
              <button
                type="button"
                className={`modal-nav-tab ${modalTab === 'sessions' ? 'active' : ''}`}
                onClick={() => setModalTab('sessions')}
              >
                Mentorship Sessions ({selectedStudentDetail.sessions?.length || 0})
              </button>
            </div>

            <div className="modal-scroll-content">
              {/* Tab 1: Skills Demonstrated vs Multi-Source Evidence */}
              {modalTab === 'skills' && (
                <div>
                  <h3 className="section-sub-title">Demonstrated Skill Competencies & Calibrated Evidence</h3>
                  <div className="skills-evidence-grid">
                    {selectedStudentDetail.skills?.map((sk: any) => (
                      <div key={sk.skill_id} className="skill-evidence-card">
                        <div className="skill-card-top">
                          <b>{sk.skill_name}</b>
                          <span className={`mastery-pill ${sk.mastery_level?.toLowerCase()}`}>
                            {sk.final_mastery}% • {sk.mastery_level}
                          </span>
                        </div>
                        <div className="mini-progress-bar">
                          <div
                            className="mini-bar-fill"
                            style={{ width: `${sk.final_mastery}%` }}
                          />
                        </div>
                        <div className="sources-chips">
                          <span title="Self-Declared">Self: {sk.self_declared_score}%</span>
                          <span title="Resume Extraction">Resume: {sk.resume_score}%</span>
                          <span title="Proctored Assessment">Assessment: {sk.assessment_score}%</span>
                          <span title="Project Artifact">Project: {sk.project_score}%</span>
                          <span title="Mentor Evaluation">Mentor: {sk.mentor_score}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Learning Roadmap Milestones */}
              {modalTab === 'roadmap' && (
                <div>
                  <h3 className="section-sub-title">Roadmap Milestones (DAG Topological Execution Order)</h3>
                  <div className="roadmap-milestones-list">
                    {selectedStudentDetail.roadmap_steps?.map((step: any) => (
                      <div key={step.id} className={`roadmap-step-row ${step.status}`}>
                        <span className="step-num">{step.step_number}</span>
                        <span className="step-name">{step.milestone_name}</span>
                        <span className={`step-status-tag ${step.status}`}>{step.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Feedback History */}
              {modalTab === 'reviews' && (
                <div>
                  <h3 className="section-sub-title">Project Reviews & Calibrated Feedback</h3>
                  {selectedStudentDetail.reviews?.length > 0 ? (
                    <div className="feedback-history-list">
                      {selectedStudentDetail.reviews.map((rev: any) => (
                        <div key={rev.feedback_id} className="feedback-item-box">
                          <div className="fb-header">
                            <b>{rev.project_name}</b>
                            <div className="fb-stars">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={14}
                                  fill={i < rev.rating ? '#F59E0B' : 'none'}
                                  color={i < rev.rating ? '#F59E0B' : '#94A3B8'}
                                />
                              ))}
                            </div>
                            <span className="fb-date">{rev.feedback_date}</span>
                          </div>
                          <p className="fb-comments">{rev.comments}</p>
                          <div className="fb-strengths">
                            <b>Strengths:</b> {rev.strengths}
                          </div>
                          <div className="fb-improvement">
                            <b>Next Steps:</b> {rev.improvement_areas}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#94A3B8', fontSize: '13px', padding: '1rem' }}>
                      No project reviews submitted for this student yet.
                    </p>
                  )}
                </div>
              )}

              {/* Tab 4: Guidance Notes & Action Plans */}
              {modalTab === 'guidance' && (
                <div>
                  <h3 className="section-sub-title">Mentor Guidance History & Action Plans</h3>
                  {selectedStudentDetail.guidance_notes?.length > 0 ? (
                    <div className="feedback-history-list">
                      {selectedStudentDetail.guidance_notes.map((g: any) => (
                        <div key={g.id} className="feedback-item-box">
                          <div className="fb-header">
                            <b>Guidance Entry</b>
                            <span className="fb-date">{g.created_at}</span>
                          </div>
                          <p className="fb-comments">{g.notes}</p>
                          {g.action_items && (
                            <div className="fb-improvement" style={{ marginTop: '8px' }}>
                              <b>Action Item:</b> {g.action_items}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#94A3B8', fontSize: '13px', padding: '1rem' }}>
                      No guidance notes recorded yet. Use the Career Guidance workspace to add notes.
                    </p>
                  )}
                </div>
              )}

              {/* Tab 5: Mentorship Sessions */}
              {modalTab === 'sessions' && (
                <div>
                  <h3 className="section-sub-title">1:1 Mentorship Sessions & Meeting History</h3>
                  {selectedStudentDetail.sessions?.length > 0 ? (
                    <div className="feedback-history-list">
                      {selectedStudentDetail.sessions.map((sess: any) => (
                        <div key={sess.session_id} className="feedback-item-box">
                          <div className="fb-header">
                            <b>{sess.topic}</b>
                            <span className={`status-pill ${sess.status}`}>{sess.status}</span>
                            <span className="fb-date">{sess.session_date} • {sess.start_time} - {sess.end_time}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>
                            Platform: {sess.platform} • <a href={sess.meeting_link} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary, #315DA8)' }}>{sess.meeting_link}</a>
                          </div>
                          {sess.notes && (
                            <div className="fb-improvement" style={{ marginTop: '8px' }}>
                              <b>Session Notes:</b> {sess.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#94A3B8', fontSize: '13px', padding: '1rem' }}>
                      No mentorship sessions scheduled with this mentee yet. Click &quot;Schedule Session&quot; above to create one.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   1. DASHBOARD VIEW (MATCHING REFERENCE IMAGE)
   ========================================================================= */
function DashboardView({
  data,
  mentorName,
  notify,
  navigate,
  onInspectStudent,
}: {
  data: any;
  mentorName: string;
  notify: (msg: string) => void;
  navigate: (path: string) => void;
  onInspectStudent: (id: string) => void;
}) {
  const metrics = data?.metrics || {
    assigned_students: 0,
    upcoming_sessions: 0,
    project_reviews_completed: 0,
    mentor_rating: 0,
    avg_progress: 0,
  };

  const sessions = data?.upcoming_sessions || [];
  const students = data?.student_progress_overview || [];
  const messages = data?.recent_messages || [];
  const careerDist = data?.career_distribution || [];
  const skillInsights = data?.skill_insights || [];
  const [highlightedMetric, setHighlightedMetric] = useState<'all' | 'assessments' | 'projects' | 'skills_improved'>('all');

  const parseSessionDate = (dStr?: string) => {
    if (!dStr) return { month: 'UPCOMING', day: '•' };
    try {
      const d = new Date(dStr);
      if (!isNaN(d.getTime())) {
        const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        const day = d.getDate();
        return { month, day: String(day) };
      }
    } catch {}
    return { month: 'MAR', day: '15' };
  };

  const colorsList = ['var(--color-primary, #315DA8)', '#3B82F6', 'var(--color-primary-hover, #4938E8)', '#10B981', '#F59E0B', '#EC4899'];
  let cumulativeOffset = 0;
  const donutSegments = careerDist.map((c: any, i: number) => {
    const pct = Math.max(0, Math.min(100, c.percentage || 0));
    const segmentLength = (pct / 100) * 377;
    const segment = {
      ...c,
      strokeDasharray: `${segmentLength.toFixed(1)} 377`,
      strokeDashoffset: -cumulativeOffset,
      color: colorsList[i % colorsList.length],
    };
    cumulativeOffset += segmentLength;
    return segment;
  });

  return (
    <div className="mentor-dashboard-page">
      {/* Welcome Banner */}
      <div className="mentor-welcome-banner">
        <h1 className="welcome-title">Welcome back, {mentorName}! 👋</h1>
        <p className="welcome-tagline">Guide. Support. Empower Students.</p>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="mentor-stats-grid">
        {/* Card 1: My Students */}
        <div className="mentor-stat-card">
          <div className="stat-card-icon-badge purple">
            <GraduationCap size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-number">{metrics.assigned_students}</span>
            <span className="stat-title">My Students</span>
            <span className="stat-subtitle">Actively Learning</span>
          </div>
        </div>

        {/* Card 2: Upcoming Sessions */}
        <div className="mentor-stat-card">
          <div className="stat-card-icon-badge green">
            <Calendar size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-number">{metrics.upcoming_sessions}</span>
            <span className="stat-title">Upcoming Sessions</span>
            <span className="stat-subtitle">This Week</span>
          </div>
        </div>

        {/* Card 3: Project Reviews */}
        <div className="mentor-stat-card">
          <div className="stat-card-icon-badge blue">
            <TrendingUp size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-number">{metrics.project_reviews_completed}</span>
            <span className="stat-title">Project Reviews</span>
            <span className="stat-subtitle">Completed</span>
          </div>
        </div>

        {/* Card 4: Mentor Rating */}
        <div className="mentor-stat-card">
          <div className="stat-card-icon-badge orange">
            <Star size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-number">{metrics.mentor_rating}</span>
            <span className="stat-title">Mentor Rating</span>
            <span className="stat-subtitle">(Students)</span>
          </div>
        </div>
      </div>

      {/* Middle Row: Upcoming Sessions & Student Progress Overview */}
      <div className="dashboard-middle-row">
        {/* Left Card: Upcoming Mentorship Sessions */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Upcoming Mentorship Sessions</h3>
            <button
              type="button"
              className="panel-view-all-link"
              onClick={() => navigate('/mentor/sessions')}
            >
              View All
            </button>
          </div>

          <div className="sessions-card-list">
            {sessions.length > 0 ? (
              sessions.slice(0, 3).map((sess: any, idx: number) => {
                const dateInfo = parseSessionDate(sess.session_date);
                return (
                  <div key={sess.session_id} className="session-card-item">
                    {/* Date Badge */}
                    <div className="session-date-box">
                      <span className="date-month">{dateInfo.month}</span>
                      <span className="date-day">{dateInfo.day}</span>
                    </div>

                    {/* Details */}
                    <div className="session-info">
                      <h4 className="session-topic">{sess.topic}</h4>
                      <div className="session-meta">
                        <span className="session-student" style={{ display: 'inline-flex', alignItems: 'flex-start', gap: '5px' }}>
                          <UserRound size={12} style={{ flexShrink: 0, marginTop: '2px', color: '#64748B' }} />
                          <span>
                            <strong style={{ fontWeight: 600, color: '#0F172A', display: 'block' }}>Student: {sess.student_name}</strong>
                            {sess.student_email && (
                              <span style={{ fontSize: '0.74rem', color: '#64748B', display: 'block', overflowWrap: 'anywhere' }}>
                                {sess.student_email}
                              </span>
                            )}
                          </span>
                        </span>
                        <span className="session-time">
                          <Clock size={12} /> {sess.start_time} - {sess.end_time}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="session-action">
                      {idx === 0 ? (
                        <a
                          href={sess.meeting_link || 'https://meet.google.com'}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-join"
                        >
                          Join
                        </a>
                      ) : (
                        <button
                          type="button"
                          className="btn-view"
                          onClick={() => navigate('/mentor/sessions')}
                        >
                          View
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-panel-state">
                <p>No upcoming sessions scheduled this week.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Student Progress Overview */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Student Progress Overview</h3>
            <button
              type="button"
              className="panel-view-all-link"
              onClick={() => navigate('/mentor/students')}
            >
              View All
            </button>
          </div>

          <div className="students-progress-list">
            {students.length > 0 ? (
              students.slice(0, 5).map((st: any, idx: number) => {
                const colors = ['#10B981', 'var(--color-primary-hover, #4938E8)', 'var(--color-primary, #315DA8)', '#F59E0B', 'var(--color-primary, #315DA8)'];
                const barColor = colors[idx % colors.length];
                const initials = st.name.split(' ').map((w: string) => w[0]).join('');

                return (
                  <div
                    key={st.student_id}
                    className="student-progress-row"
                    onClick={() => onInspectStudent(st.student_id)}
                  >
                    <div className="student-avatar-box">{initials}</div>
                    <div className="student-name-col">
                      <span className="student-name-text">{st.name}</span>
                      {st.email && <span className="student-email-text">{st.email}</span>}
                      <span className="student-role-text">{st.career_name}</span>
                    </div>
                    <div className="student-bar-col">
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{ width: `${st.progress_pct}%`, backgroundColor: barColor }}
                        />
                      </div>
                    </div>
                    <div className="student-pct-col">{st.progress_pct}%</div>
                  </div>
                );
              })
            ) : (
              <div className="empty-panel-state">
                <p>No assigned students currently.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section: Recent Messages */}
      <div className="dashboard-messages-row" style={{ marginBottom: '1.25rem' }}>
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Recent Messages</h3>
            <button
              type="button"
              className="panel-view-all-link"
              onClick={() => navigate('/mentor/messages')}
            >
              View All
            </button>
          </div>

          <div className="messages-preview-list">
            {messages.length > 0 ? (
              messages.slice(0, 4).map((msg: any, idx: number) => {
                const initials = msg.student_name ? msg.student_name.split(' ').map((w: string) => w[0]).join('') : 'ST';
                return (
                  <div
                    key={msg.message_id || idx}
                    className="message-preview-item"
                    onClick={() => navigate('/mentor/messages')}
                  >
                    <div className="msg-avatar">{initials}</div>
                    <div className="msg-content-box">
                      <div className="msg-top">
                        <span className="msg-author">{msg.student_name}</span>
                        <span className="msg-time">{msg.created_at ? msg.created_at.slice(11, 16) || 'Today' : 'Recently'}</span>
                      </div>
                      <p className="msg-snippet">{msg.content}</p>
                    </div>
                    {msg.is_read === false && <span className="msg-unread-dot">1</span>}
                  </div>
                );
              })
            ) : (
              <div className="empty-panel-state">
                <p>No recent messages.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Balanced 3-Section Horizontal Row: Students by Career Goal, Skill Development Insights, Your Impact */}
      <div className="mentor-dashboard-insights dashboard-insights-grid">
        {/* Section 1: Students by Career Goal (Donut Chart) */}
        <div className="dashboard-panel dashboard-card">
          <div className="panel-header dashboard-card-header">
            <h3>Students by Career Goal</h3>
            <button
              type="button"
              className="panel-view-all-link"
              onClick={() => navigate('/mentor/students')}
            >
              View All
            </button>
          </div>

          {careerDist.length > 0 ? (
            <div className="donut-chart-container">
              {/* SVG Donut */}
              <div className="donut-svg-box">
                <svg viewBox="0 0 160 160" className="donut-svg">
                  <circle cx="80" cy="80" r="60" stroke="#EEF2F6" strokeWidth="20" fill="none" />
                  {donutSegments.map((seg: any) => (
                    <circle
                      key={seg.career_name}
                      cx="80"
                      cy="80"
                      r="60"
                      stroke={seg.color}
                      strokeWidth="20"
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      fill="none"
                    />
                  ))}
                </svg>
                <div className="donut-center-label">
                  <span className="center-count">{metrics.assigned_students}</span>
                  <span className="center-text">Students</span>
                </div>
              </div>

              {/* Legend */}
              <div className="donut-legend-list">
                {careerDist.map((c: any, i: number) => {
                  return (
                    <div key={c.career_name} className="legend-row">
                      <span className="legend-color-dot" style={{ backgroundColor: colorsList[i % colorsList.length] }} />
                      <span className="legend-label">{c.career_name}</span>
                      <span className="legend-stat">
                        {c.count} ({c.percentage}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="empty-panel-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', textAlign: 'center', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #E2E8F0', marginTop: '0.5rem' }}>
              <p style={{ margin: 0, color: '#64748B', fontSize: '0.84rem' }}>No student career paths assigned yet.</p>
            </div>
          )}
        </div>

        {/* Panel 2: Skill Development Insights (Interactive SVG Graph) */}
        <div className="dashboard-panel dashboard-card">
          <div className="panel-header dashboard-card-header">
            <h3>Skill Development Insights</h3>
            <span className="filter-dropdown-pill" title="Current reporting cycle">This Month ▾</span>
          </div>

          {/* Interactive Legend with toggle filter */}
          <div className="chart-legend-top" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <button
              type="button"
              className={`legend-pill-btn ${highlightedMetric === 'assessments' ? 'active' : ''}`}
              onClick={() => setHighlightedMetric(highlightedMetric === 'assessments' ? 'all' : 'assessments')}
              style={{
                background: highlightedMetric === 'assessments' ? '#EDF3FF' : 'transparent',
                border: highlightedMetric === 'assessments' ? '1px solid #315DA8' : '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '2px 7px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: highlightedMetric === 'assessments' ? '#315DA8' : '#64748B',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Click to focus Assessments"
            >
              <i style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#315DA8', display: 'inline-block' }} />
              <span>Assessments Completed</span>
            </button>

            <button
              type="button"
              className={`legend-pill-btn ${highlightedMetric === 'projects' ? 'active' : ''}`}
              onClick={() => setHighlightedMetric(highlightedMetric === 'projects' ? 'all' : 'projects')}
              style={{
                background: highlightedMetric === 'projects' ? '#EFF6FF' : 'transparent',
                border: highlightedMetric === 'projects' ? '1px solid #3B82F6' : '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '2px 7px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: highlightedMetric === 'projects' ? '#3B82F6' : '#64748B',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Click to focus Projects"
            >
              <i style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#3B82F6', display: 'inline-block' }} />
              <span>Projects Completed</span>
            </button>

            <button
              type="button"
              className={`legend-pill-btn ${highlightedMetric === 'skills_improved' ? 'active' : ''}`}
              onClick={() => setHighlightedMetric(highlightedMetric === 'skills_improved' ? 'all' : 'skills_improved')}
              style={{
                background: highlightedMetric === 'skills_improved' ? '#ECFDF5' : 'transparent',
                border: highlightedMetric === 'skills_improved' ? '1px solid #10B981' : '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '2px 7px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: highlightedMetric === 'skills_improved' ? '#059669' : '#64748B',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Click to focus Skills Improved"
            >
              <i style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10B981', display: 'inline-block' }} />
              <span>Skills Improved</span>
            </button>
          </div>

          {/* SVG Weekly Chart Visualization */}
          {(() => {
            const weeksData = [1, 2, 3, 4].map((num) => {
              const label = `Week ${num}`;
              const found = skillInsights.find(
                (item: any) =>
                  item.week === label ||
                  item.week === `W${num}` ||
                  item.week === `${num}`
              );
              return {
                week: label,
                assessments: Number(found?.assessments) || 0,
                projects: Number(found?.projects) || 0,
                skills_improved: Number(found?.skills_improved) || 0,
              };
            });

            const totalActivity = weeksData.reduce(
              (sum, w) => sum + w.assessments + w.projects + w.skills_improved,
              0
            );

            if (totalActivity === 0) {
              return (
                <div style={{ width: '100%', minHeight: '145px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: '0.84rem', textAlign: 'center', background: '#F8FAFC', borderRadius: '10px', border: '1px dashed #E2E8F0', padding: '16px' }}>
                  <TrendingUp size={24} style={{ color: '#94A3B8', marginBottom: '8px' }} />
                  <span style={{ fontWeight: 600, color: '#334155' }}>No Skill Activity Recorded Yet</span>
                  <span style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '3px', maxWidth: '250px' }}>Student assessment submissions and project reviews will populate weekly activity here.</span>
                </div>
              );
            }

            const rawMax = Math.max(
              1,
              ...weeksData.map((w) =>
                Math.max(w.assessments, w.projects, w.skills_improved)
              )
            );
            const maxVal = rawMax <= 5 ? 5 : rawMax <= 10 ? 10 : rawMax <= 15 ? 15 : rawMax <= 20 ? 20 : Math.ceil(rawMax / 10) * 10;

            return (
              <div style={{ position: 'relative', width: '100%', height: '150px' }}>
                <svg viewBox="0 0 320 150" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  {/* Horizontal Gridlines & Y-Axis values */}
                  {[0, 1, 2, 3].map((step) => {
                    const val = Math.round((maxVal / 3) * step);
                    const y = 120 - (step / 3) * 100;
                    return (
                      <g key={step}>
                        <line x1="28" y1={y} x2="312" y2={y} stroke="#EEF2F6" strokeDasharray={step === 0 ? 'none' : '3,3'} strokeWidth="1" />
                        <text x="22" y={y + 3.5} textAnchor="end" fontSize="9" fill="#94A3B8" fontWeight="500">{val}</text>
                      </g>
                    );
                  })}

                  {/* Left Y-axis & Bottom X-axis baseline */}
                  <line x1="28" y1="18" x2="28" y2="120" stroke="#CBD5E1" strokeWidth="1" />
                  <line x1="28" y1="120" x2="312" y2="120" stroke="#CBD5E1" strokeWidth="1" />

                  {/* Bars for Each of the 4 Weeks */}
                  {weeksData.map((w, idx) => {
                    const colWidth = 284 / 4;
                    const centerX = 28 + (idx + 0.5) * colWidth;
                    const barWidth = 10;
                    const gap = 2;

                    const aVal = w.assessments;
                    const pVal = w.projects;
                    const sVal = w.skills_improved;

                    const aH = Math.max(aVal > 0 ? 4 : 0, (aVal / maxVal) * 100);
                    const pH = Math.max(pVal > 0 ? 4 : 0, (pVal / maxVal) * 100);
                    const sH = Math.max(sVal > 0 ? 4 : 0, (sVal / maxVal) * 100);

                    const aX = centerX - barWidth * 1.5 - gap;
                    const pX = centerX - barWidth * 0.5;
                    const sX = centerX + barWidth * 0.5 + gap;

                    const aOpacity = highlightedMetric === 'all' || highlightedMetric === 'assessments' ? 1 : 0.25;
                    const pOpacity = highlightedMetric === 'all' || highlightedMetric === 'projects' ? 1 : 0.25;
                    const sOpacity = highlightedMetric === 'all' || highlightedMetric === 'skills_improved' ? 1 : 0.25;

                    return (
                      <g key={w.week}>
                        {/* Bar 1: Assessments Completed (Blue #315DA8) */}
                        <rect
                          x={aX}
                          y={120 - aH}
                          width={barWidth}
                          height={aH}
                          fill="#315DA8"
                          rx="2"
                          opacity={aOpacity}
                          style={{ cursor: 'pointer', transition: 'opacity 0.2s, height 0.3s' }}
                        >
                          <title>{`${w.week}: ${aVal} Assessments Completed`}</title>
                        </rect>

                        {/* Bar 2: Projects Completed (Light Blue #3B82F6) */}
                        <rect
                          x={pX}
                          y={120 - pH}
                          width={barWidth}
                          height={pH}
                          fill="#3B82F6"
                          rx="2"
                          opacity={pOpacity}
                          style={{ cursor: 'pointer', transition: 'opacity 0.2s, height 0.3s' }}
                        >
                          <title>{`${w.week}: ${pVal} Projects Completed`}</title>
                        </rect>

                        {/* Bar 3: Skills Improved (Green #10B981) */}
                        <rect
                          x={sX}
                          y={120 - sH}
                          width={barWidth}
                          height={sH}
                          fill="#10B981"
                          rx="2"
                          opacity={sOpacity}
                          style={{ cursor: 'pointer', transition: 'opacity 0.2s, height 0.3s' }}
                        >
                          <title>{`${w.week}: ${sVal} Skills Improved`}</title>
                        </rect>

                        {/* Week Label */}
                        <text x={centerX} y="136" textAnchor="middle" fontSize="10" fill="#475569" fontWeight="600">
                          {w.week}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            );
          })()}
        </div>

        {/* Panel 3: Your Impact */}
        <div className="dashboard-panel dashboard-card">
          <div className="panel-header dashboard-card-header">
            <h3>Your Impact</h3>
            <button
              type="button"
              className="panel-view-all-link"
              onClick={() => navigate('/mentor/progress')}
            >
              View All
            </button>
          </div>

          <div className="impact-tiles-grid impact-metrics-grid">
            <div className="impact-tile">
              <div className="tile-icon purple"><GraduationCap size={20} /></div>
              <div className="tile-data">
                <span className="tile-value">{metrics.assigned_students ?? 0}</span>
                <span className="tile-label">Students Mentored</span>
              </div>
            </div>

            <div className="impact-tile">
              <div className="tile-icon green"><TrendingUp size={20} /></div>
              <div className="tile-data">
                <span className="tile-value">{metrics.avg_progress ?? 0}%</span>
                <span className="tile-label">Average Progress</span>
              </div>
            </div>

            <div className="impact-tile">
              <div className="tile-icon blue"><FolderKanban size={20} /></div>
              <div className="tile-data">
                <span className="tile-value">{metrics.project_reviews_completed ?? 0}</span>
                <span className="tile-label">Projects Reviewed</span>
              </div>
            </div>

            <div className="impact-tile">
              <div className="tile-icon orange"><Star size={20} /></div>
              <div className="tile-data">
                <span className="tile-value">{metrics.mentor_rating ?? 0}</span>
                <span className="tile-label">Student Rating</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   2. MY STUDENTS VIEW
   ========================================================================= */
function StudentsView({
  students,
  requests = [],
  searchQuery,
  notify,
  navigate,
  onInspectStudent,
  onViewProgress,
  refreshData,
}: {
  students: any[];
  requests?: any[];
  searchQuery: string;
  notify: (msg: string) => void;
  navigate: (path: string) => void;
  onInspectStudent: (id: string) => void;
  onViewProgress?: (id: string) => void;
  refreshData: () => void;
}) {
  const [activeSubTab, setActiveSubTab] = useState<'cohort' | 'requests'>('cohort');
  const [careerFilter, setCareerFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'readiness_desc' | 'readiness_asc' | 'name_asc' | 'courses_desc' | 'progress_desc'>('progress_desc');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [studentIdToAssign, setStudentIdToAssign] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  // Requests state
  const [requestFilter, setRequestFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('pending');
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedRequestForAction, setSelectedRequestForAction] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'accept' | 'reject'>('accept');
  const [actionNote, setActionNote] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Filter cohort students
  const filteredStudents = students.filter((st) => {
    const q = searchQuery.toLowerCase().trim();
    const stName = st.name || `${st.first_name || ''} ${st.last_name || ''}`.trim();
    const stEmail = st.email || '';
    const stCareer = st.target_career_name || '';
    const stCollege = st.college || '';
    const stDept = st.department || '';
    const stSkills = st.skills_text || (Array.isArray(st.skills_list) ? st.skills_list.join(' ') : '') || '';

    const matchesSearch =
      !q ||
      stName.toLowerCase().includes(q) ||
      stEmail.toLowerCase().includes(q) ||
      stCareer.toLowerCase().includes(q) ||
      stCollege.toLowerCase().includes(q) ||
      stDept.toLowerCase().includes(q) ||
      stSkills.toLowerCase().includes(q);

    const matchesCareer =
      careerFilter === 'All' ||
      stCareer.toLowerCase().includes(careerFilter.toLowerCase());

    return matchesSearch && matchesCareer;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const aProg = a.overall_progress ?? a.readiness_pct ?? 0;
    const bProg = b.overall_progress ?? b.readiness_pct ?? 0;
    if (sortBy === 'progress_desc') return bProg - aProg;
    if (sortBy === 'readiness_desc') return (b.readiness_pct || 0) - (a.readiness_pct || 0);
    if (sortBy === 'readiness_asc') return (a.readiness_pct || 0) - (b.readiness_pct || 0);
    const aName = a.name || `${a.first_name || ''} ${a.last_name || ''}`.trim();
    const bName = b.name || `${b.first_name || ''} ${b.last_name || ''}`.trim();
    if (sortBy === 'name_asc') return aName.localeCompare(bName);
    if (sortBy === 'courses_desc') return (b.courses_completed || 0) - (a.courses_completed || 0);
    return 0;
  });

  const availableCareerPills = Array.from(
    new Set(
      ['All', 'Machine Learning', 'Data Science', 'Cloud Data Engineer', 'Full Stack', 'Backend']
        .concat(students.map((s) => s.target_career_name).filter(Boolean))
    )
  ).slice(0, 7);

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const stName = r.student?.name || r.student_name || '';
    const stEmail = r.student?.email || r.student_email || '';
    const career = r.career_goal || r.student?.target_career_name || '';
    const msg = r.message || '';

    const matchesSearch =
      !q ||
      stName.toLowerCase().includes(q) ||
      stEmail.toLowerCase().includes(q) ||
      career.toLowerCase().includes(q) ||
      msg.toLowerCase().includes(q);

    let matchesFilter = true;
    if (requestFilter !== 'all') {
      matchesFilter = r.status === requestFilter;
    }
    return matchesSearch && matchesFilter;
  });

  const pendingRequestsCount = requests.filter((r) => r.status === 'pending').length;

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentIdToAssign.trim()) return;
    try {
      await api.assignStudent(studentIdToAssign.trim(), assignNotes);
      notify('Student successfully connected to your mentorship cohort!');
      setShowAssignModal(false);
      setStudentIdToAssign('');
      setAssignNotes('');
      refreshData();
    } catch (err: any) {
      notify(`Assignment failed: ${err.message}`);
    }
  };

  const openActionModal = (request: any, type: 'accept' | 'reject') => {
    setSelectedRequestForAction(request);
    setActionType(type);
    setActionNote(type === 'accept' ? 'Welcome to my mentorship cohort! Looking forward to reviewing your skills.' : '');
    setActionModalOpen(true);
  };

  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForAction) return;
    setProcessingAction(true);

    try {
      if (actionType === 'accept') {
        const res = await api.acceptMentorshipRequest(selectedRequestForAction.request_id, actionNote);
        notify(res?.message || 'Mentorship request accepted! Student added to your cohort.');
      } else {
        const res = await api.rejectMentorshipRequest(selectedRequestForAction.request_id, actionNote);
        notify(res?.message || 'Mentorship request declined.');
      }
      setActionModalOpen(false);
      setSelectedRequestForAction(null);
      refreshData();
    } catch (err: any) {
      notify(`Action failed: ${err.message || 'Unable to update request status.'}`);
    } finally {
      setProcessingAction(false);
    }
  };

  return (
    <div className="mentor-view-page">
      <div className="view-page-header">
        <div>
          <h2>My Assigned Students & Cohort Progress</h2>
          <p>Supervise learning velocity, monitor active roadmaps, and inspect skill-gap diagnostic evidence</p>
        </div>
        {activeSubTab === 'cohort' && (
          <button
            type="button"
            className="primary-action-btn purple-gradient"
            onClick={() => setShowAssignModal(true)}
          >
            <Plus size={16} /> Assign Student
          </button>
        )}
      </div>

      {/* Sub-tab Navigation: Cohort vs Requests */}
      <div className="mentor-main-tabs" style={{ marginBottom: '20px', width: 'fit-content' }}>
        <button
          type="button"
          className={`mentor-main-tab ${activeSubTab === 'cohort' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('cohort')}
        >
          <Users size={16} /> Active Cohort ({students.length})
        </button>
        <button
          type="button"
          className={`mentor-main-tab ${activeSubTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('requests')}
        >
          <Clock3 size={16} /> Incoming Requests
          {pendingRequestsCount > 0 && (
            <span className="mentor-tab-badge" style={{ background: '#F59E0B' }}>
              {pendingRequestsCount}
            </span>
          )}
        </button>
      </div>

      {/* SUB-TAB 1: ACTIVE COHORT */}
      {activeSubTab === 'cohort' && (
        <>
          {/* Filter and Sorting Controls */}
          <div className="filter-row-controls">
            <div className="filter-pills-row" style={{ margin: 0 }}>
              {availableCareerPills.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`filter-pill ${careerFilter === c ? 'active' : ''}`}
                  onClick={() => setCareerFilter(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="sort-select-pill"
              >
                <option value="progress_desc">Overall Progress (High to Low)</option>
                <option value="readiness_desc">Career Readiness (High to Low)</option>
                <option value="readiness_asc">Career Readiness (Low to High)</option>
                <option value="name_asc">Student Name (A-Z)</option>
                <option value="courses_desc">Completed Courses</option>
              </select>
            </div>
          </div>

          {/* Students Table */}
          <div className="students-table-card">
            <table className="mentor-data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Career Goal & Roadmap</th>
                  <th>Department / Year</th>
                  <th>Skills & Interest Areas</th>
                  <th>Mentorship Status</th>
                  <th>Overall Progress</th>
                  <th>Tasks & Assessments</th>
                  <th>Last Active</th>
                  <th>Upcoming Session</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedStudents.length > 0 ? (
                  sortedStudents.map((st) => {
                    const stName = st.name || `${st.first_name || ''} ${st.last_name || ''}`.trim() || 'Student';
                    const initials = stName.split(' ').filter(Boolean).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'ST';
                    return (
                    <tr key={st.student_id}>
                      <td>
                        <div className="table-student-cell" title={`${stName} (${st.email || 'No email'})`}>
                          <div className="cell-avatar">{initials}</div>
                          <StudentNameEmail name={stName} email={st.email} />
                        </div>
                      </td>
                      <td>
                        <div title={`${st.target_career_name || 'Machine Learning'} - ${st.roadmap_name || 'Personalized Learning Path'}`}>
                          <span className="badge-career-tag">{st.target_career_name || 'Machine Learning'}</span>
                          <small style={{ display: 'block', color: '#64748B', marginTop: '2px', fontSize: '0.74rem' }}>
                            {st.roadmap_name || 'Personalized Learning Path'}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div title={`${st.department || 'Computer Science'} ${st.graduation_year ? `(Class of ${st.graduation_year})` : ''}`}>
                          <span style={{ fontWeight: 600, color: '#334155' }}>{st.department || 'Computer Science'}</span>
                          <small style={{ display: 'block', color: '#64748B' }}>
                            {st.graduation_year ? `Class of ${st.graduation_year}` : (st.degree || 'Enrolled Student')}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div style={{ maxWidth: '200px' }} title={st.skills_text || (Array.isArray(st.skills_list) ? st.skills_list.join(', ') : 'Python, ML, Systems')}>
                          <span style={{ fontSize: '0.78rem', color: '#1E293B', fontWeight: 600, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {st.skills_text || (Array.isArray(st.skills_list) ? st.skills_list.join(', ') : 'Python, ML, Systems')}
                          </span>
                          <small style={{ color: '#059669', fontSize: '0.72rem', fontWeight: 600 }}>
                            {st.skills_completed || 0} Met • {st.skills_remaining || 0} Target Left
                          </small>
                        </div>
                      </td>
                      <td>
                        <span
                          className="badge-career-tag"
                          style={{
                            background: '#ECFDF5',
                            color: '#059669',
                            border: '1px solid #A7F3D0',
                            fontWeight: 600,
                            fontSize: '0.74rem',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          ● {st.connection_status === 'active' ? 'Active Mentee' : (st.connection_status || 'Active')}
                        </span>
                        <small style={{ display: 'block', color: '#64748B', fontSize: '0.72rem', marginTop: '3px', whiteSpace: 'nowrap' }}>
                          Connected: {st.connection_date || 'Recently'}
                        </small>
                      </td>
                      <td>
                        <div className="readiness-cell">
                          <b>{st.overall_progress ?? st.readiness_pct ?? 0}%</b>
                          <div className="mini-progress-bar">
                            <div
                              className="mini-bar-fill"
                              style={{
                                width: `${st.overall_progress ?? st.readiness_pct ?? 0}%`,
                                backgroundColor: (st.overall_progress ?? 0) >= 70 ? '#10B981' : ((st.overall_progress ?? 0) >= 40 ? 'var(--color-primary, #315DA8)' : '#F59E0B')
                              }}
                            />
                          </div>
                        </div>
                        <small style={{ display: 'block', color: '#64748B', fontSize: '0.72rem', marginTop: '2px', whiteSpace: 'nowrap' }}>
                          Readiness: {st.readiness_pct || 0}%
                        </small>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-primary, #15213B)', display: 'block', whiteSpace: 'nowrap' }}>
                          {st.courses_completed || 0} Courses • {st.projects_verified || st.projects_completed || 0} Projects
                        </span>
                        <small style={{ color: st.avg_assessment_score >= 70 ? '#10B981' : '#64748B', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                          {st.avg_assessment_score ? `${st.avg_assessment_score}% Avg Score` : `${st.assessments_completed || 0} Assessments`}
                        </small>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', color: '#334155', whiteSpace: 'nowrap' }}>
                          {st.last_active_date || st.last_active || 'Today'}
                        </span>
                      </td>
                      <td>
                        {st.upcoming_session ? (
                          <div title={`${st.upcoming_session.session_date}: ${st.upcoming_session.topic}`}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--color-primary, #315DA8)', fontWeight: 600, display: 'block', whiteSpace: 'nowrap' }}>
                              {st.upcoming_session.session_date}
                            </span>
                            <small style={{ color: '#64748B', fontSize: '0.72rem', display: 'block', maxWidth: '130px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {st.upcoming_session.topic}
                            </small>
                          </div>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '0.76rem', whiteSpace: 'nowrap' }}>None scheduled</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="student-table-actions">
                          <button
                            type="button"
                            className="btn-action-primary"
                            title="Open Detailed Student Progress & Insights"
                            onClick={() => {
                              if (onViewProgress) {
                                onViewProgress(st.student_id);
                              } else {
                                onInspectStudent(st.student_id);
                              }
                            }}
                          >
                            <Activity size={13} /> Progress
                          </button>
                          <button
                            type="button"
                            className="btn-action-outline"
                            title="Direct Message Mentee"
                            onClick={() => navigate(`/mentor/messages?studentId=${st.student_id}`)}
                          >
                            <MessageSquareText size={13} /> Message
                          </button>
                          <button
                            type="button"
                            className="btn-action-outline"
                            title="Schedule Mentorship Session"
                            onClick={() => navigate(`/mentor/sessions?studentId=${st.student_id}`)}
                          >
                            <CalendarDays size={13} /> Schedule
                          </button>
                          <button
                            type="button"
                            className="btn-action-outline"
                            title="Quick Profile Modal"
                            onClick={() => onInspectStudent(st.student_id)}
                          >
                            <UserRound size={13} /> Profile
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} style={{ padding: '3rem 1rem' }}>
                      <div className="empty-state-box">
                        <Users size={32} style={{ color: '#94A3B8' }} />
                        <b>{students.length === 0 ? 'No students currently assigned to your cohort' : 'No students found matching your criteria'}</b>
                        <p style={{ margin: '4px 0 12px', fontSize: '0.82rem', color: '#64748B' }}>
                          {students.length === 0
                            ? 'Accept incoming mentorship requests to begin guiding students and monitoring their real-time learning progress.'
                            : 'Try clearing your search query or selecting a different career domain filter.'}
                        </p>
                        {students.length === 0 && (
                          <button
                            type="button"
                            className="primary-action-btn purple-gradient"
                            onClick={() => setActiveSubTab('requests')}
                          >
                            View Incoming Requests ({pendingRequestsCount})
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* SUB-TAB 2: INCOMING REQUESTS */}
      {activeSubTab === 'requests' && (
        <>
          {/* Requests filter pills */}
          <div className="filter-row-controls" style={{ marginBottom: '16px' }}>
            <div className="filter-pills-row" style={{ margin: 0 }}>
              <button
                type="button"
                className={`filter-pill ${requestFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setRequestFilter('pending')}
              >
                Pending ({pendingRequestsCount})
              </button>
              <button
                type="button"
                className={`filter-pill ${requestFilter === 'all' ? 'active' : ''}`}
                onClick={() => setRequestFilter('all')}
              >
                All Requests ({requests.length})
              </button>
              <button
                type="button"
                className={`filter-pill ${requestFilter === 'accepted' ? 'active' : ''}`}
                onClick={() => setRequestFilter('accepted')}
              >
                Accepted ({requests.filter((r) => r.status === 'accepted').length})
              </button>
              <button
                type="button"
                className={`filter-pill ${requestFilter === 'rejected' ? 'active' : ''}`}
                onClick={() => setRequestFilter('rejected')}
              >
                Declined ({requests.filter((r) => r.status === 'rejected').length})
              </button>
            </div>
          </div>

          {/* Requests List */}
          {filteredRequests.length > 0 ? (
            <div className="requests-table-wrapper">
              <table className="mentor-data-table">
                <thead>
                  <tr>
                    <th>Student Details</th>
                    <th>Target Goal</th>
                    <th>Request Note / Message</th>
                    <th>Date Received</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req) => {
                    const stName = req.student?.name || req.student_name || req.student_id;
                    const stEmail = req.student?.email || req.student_email || '';
                    const stCareer = req.career_goal || req.student?.target_career_name || 'General Guidance';

                    return (
                      <tr key={req.request_id}>
                        <td>
                          <div className="table-student-cell" title={`${stName} (${stEmail || 'No email'})`}>
                            <div className="cell-avatar">
                              {stName.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                            </div>
                            <StudentNameEmail name={stName} email={stEmail} />
                          </div>
                        </td>
                        <td>
                          <span className="badge-career-tag">{stCareer}</span>
                        </td>
                        <td style={{ maxWidth: '300px' }}>
                          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary, #526078)', lineHeight: 1.4 }}>
                            {req.message || 'No additional note provided.'}
                          </p>
                          {req.response_note && (
                            <small style={{ display: 'block', marginTop: '4px', color: '#10B981' }}>
                              Note: {req.response_note}
                            </small>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>
                            {new Date(req.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td>
                          {req.status === 'pending' && (
                            <span className="status-pill-pending">
                              <Clock3 size={11} /> Pending
                            </span>
                          )}
                          {req.status === 'accepted' && (
                            <span className="status-pill-accepted">
                              <CheckCircle2 size={11} /> Accepted
                            </span>
                          )}
                          {req.status === 'rejected' && (
                            <span className="status-pill-rejected">
                              <X size={11} /> Declined
                            </span>
                          )}
                          {req.status === 'cancelled' && (
                            <span className="status-pill-cancelled">
                              Cancelled
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                            <button
                              type="button"
                              className="btn-inspect"
                              style={{ padding: '5px 9px', fontSize: '0.78rem' }}
                              onClick={() => onInspectStudent(req.student_id)}
                              title="Inspect Student Dossier"
                            >
                              Inspect
                            </button>

                            {req.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  className="btn-inspect"
                                  style={{
                                    padding: '5px 10px',
                                    fontSize: '0.78rem',
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    color: '#10B981',
                                    borderColor: 'rgba(16, 185, 129, 0.3)',
                                  }}
                                  onClick={() => openActionModal(req, 'accept')}
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  className="btn-inspect"
                                  style={{
                                    padding: '5px 10px',
                                    fontSize: '0.78rem',
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    color: '#EF4444',
                                    borderColor: 'rgba(239, 68, 68, 0.3)',
                                  }}
                                  onClick={() => openActionModal(req, 'reject')}
                                >
                                  Decline
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state-box" style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
              <Clock3 size={36} style={{ color: '#94A3B8', margin: '0 auto 12px' }} />
              <b>No mentorship requests found</b>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
                There are currently no requests matching your selected filter.
              </p>
            </div>
          )}
        </>
      )}

      {/* Modal 1: Assign Student Modal */}
      {showAssignModal && (
        <div className="mentor-modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="mentor-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Connect Student to Mentorship</h3>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setShowAssignModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAssign} className="auth-form" style={{ padding: '1.5rem' }}>
              <div className="form-group">
                <label>Student ID (e.g. U001, U002)</label>
                <input
                  type="text"
                  required
                  placeholder="Enter Student ID"
                  value={studentIdToAssign}
                  onChange={(e) => setStudentIdToAssign(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Mentorship Focus / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Focus areas, goals, or schedule notes..."
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                />
              </div>
              <button type="submit" className="primary-action-btn full purple-gradient">
                Confirm Assignment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Accept or Decline Request Modal */}
      {actionModalOpen && selectedRequestForAction && (
        <div className="mentor-modal-overlay" onClick={() => !processingAction && setActionModalOpen(false)}>
          <div className="mentor-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: actionType === 'accept' ? '#10B981' : '#EF4444' }}>
                {actionType === 'accept' ? 'Accept Mentorship Request' : 'Decline Mentorship Request'}
              </h3>
              <button
                type="button"
                disabled={processingAction}
                className="close-modal-btn"
                onClick={() => setActionModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmAction} style={{ padding: '1.5rem' }}>
              <div style={{ background: '#F8FAFC', border: '1px solid var(--border, #E1E7F0)', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px' }}>
                <b style={{ color: 'var(--text-main, #172033)', display: 'block', marginBottom: '2px' }}>
                  {selectedRequestForAction.student?.name || selectedRequestForAction.student_id}
                </b>
                <small style={{ color: 'var(--text-secondary, #526078)' }}>
                  Target Career: {selectedRequestForAction.career_goal || 'Career Track Guidance'}
                </small>
                {selectedRequestForAction.message && (
                  <p style={{ margin: '8px 0 0', fontSize: '0.84rem', color: 'var(--text-secondary, #526078)', fontStyle: 'italic' }}>
                    "{selectedRequestForAction.message}"
                  </p>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.84rem', color: 'var(--text-secondary, #526078)', display: 'block', marginBottom: '6px' }}>
                  {actionType === 'accept' ? 'Welcome Note & Next Steps (Optional)' : 'Decline Reason / Guidance Note (Optional)'}
                </label>
                <textarea
                  rows={3}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder={actionType === 'accept' ? 'e.g. Glad to connect! Check out our resources tab to begin.' : 'e.g. Currently mentoring at maximum capacity this month.'}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#FFF',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-inspect"
                  disabled={processingAction}
                  onClick={() => setActionModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingAction}
                  className="primary-action-btn"
                  style={{
                    background: actionType === 'accept'
                      ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                  }}
                >
                  {processingAction ? 'Updating...' : actionType === 'accept' ? 'Confirm Accept' : 'Confirm Decline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   3. MENTORSHIP SESSIONS VIEW
   ========================================================================= */
function SessionsView({
  sessions,
  students,
  notify,
  refreshData,
}: {
  sessions: any[];
  students: any[];
  notify: (msg: string) => void;
  refreshData: () => void;
}) {
  const [tab, setTab] = useState<'all' | 'today' | 'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [sessionSearch, setSessionSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Detail modal state
  const [selectedSessionForDetail, setSelectedSessionForDetail] = useState<any | null>(null);

  // Reschedule state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedSessionForReschedule, setSelectedSessionForReschedule] = useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleStartTime, setRescheduleStartTime] = useState('10:00 AM');
  const [rescheduleEndTime, setRescheduleEndTime] = useState('11:00 AM');
  const [rescheduleMeetingLink, setRescheduleMeetingLink] = useState('');
  const [rescheduleNotes, setRescheduleNotes] = useState('');

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedSessionForCancel, setSelectedSessionForCancel] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Complete session state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedSessionForComplete, setSelectedSessionForComplete] = useState<any | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionActionItems, setCompletionActionItems] = useState('');

  // Schedule Form State
  const [studentId, setStudentId] = useState('');
  const [topic, setTopic] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('11:00 AM');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/pathforge-ai');
  const [scheduleNotes, setScheduleNotes] = useState('');

  const todayStr = new Date().toISOString().slice(0, 10);

  const topicPresets = [
    'Roadmap Progress Review',
    'Portfolio Code & Architecture Audit',
    'Mock Technical Interview',
    'Career Strategy & Skill Gaps',
    'System Design & Deployment',
  ];

  const todayCount = sessions.filter((s) => s.session_date === todayStr && s.status !== 'cancelled').length;
  const upcomingCount = sessions.filter((s) => s.status === 'upcoming' || s.status === 'rescheduled').length;
  const completedCount = sessions.filter((s) => s.status === 'completed').length;
  const cancelledCount = sessions.filter((s) => s.status === 'cancelled').length;
  const allCount = sessions.length;

  const filteredSessions = sessions.filter((s) => {
    let matchesTab = true;
    if (tab === 'today') {
      matchesTab = s.session_date === todayStr && s.status !== 'cancelled';
    } else if (tab === 'upcoming') {
      matchesTab = s.status === 'upcoming' || s.status === 'rescheduled';
    } else if (tab === 'completed') {
      matchesTab = s.status === 'completed';
    } else if (tab === 'cancelled') {
      matchesTab = s.status === 'cancelled';
    }

    const matchesDate = !dateFilter || s.session_date === dateFilter;

    const matchesSearch =
      !sessionSearch.trim() ||
      (s.topic && s.topic.toLowerCase().includes(sessionSearch.toLowerCase())) ||
      (s.student_name && s.student_name.toLowerCase().includes(sessionSearch.toLowerCase())) ||
      (s.session_id && s.session_id.toLowerCase().includes(sessionSearch.toLowerCase()));

    return matchesTab && matchesDate && matchesSearch;
  });

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !topic || !date || !startTime || !endTime) {
      notify('Please fill out all required fields.');
      return;
    }
    try {
      await api.createMentorSession({
        student_id: studentId,
        topic,
        session_date: date,
        start_time: startTime,
        end_time: endTime,
        meeting_link: meetingLink,
        notes: scheduleNotes,
      });
      notify('Mentorship session scheduled successfully and student notified!');
      setShowScheduleModal(false);
      setStudentId('');
      setTopic('');
      setDate('');
      setScheduleNotes('');
      refreshData();
    } catch (err: any) {
      notify(`Error: ${err.message}`);
    }
  };

  const openRescheduleModal = (sess: any) => {
    setSelectedSessionForReschedule(sess);
    setRescheduleDate(sess.session_date);
    setRescheduleStartTime(sess.start_time || '10:00 AM');
    setRescheduleEndTime(sess.end_time || '11:00 AM');
    setRescheduleMeetingLink(sess.meeting_link || 'https://meet.google.com/pathforge-ai');
    setRescheduleNotes(sess.notes || '');
    setShowRescheduleModal(true);
  };

  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionForReschedule || !rescheduleDate) return;
    try {
      await api.rescheduleMentorSession(selectedSessionForReschedule.session_id, {
        session_date: rescheduleDate,
        start_time: rescheduleStartTime,
        end_time: rescheduleEndTime,
        meeting_link: rescheduleMeetingLink,
        notes: rescheduleNotes,
      });
      notify('Session rescheduled successfully and mentee notified!');
      setShowRescheduleModal(false);
      setSelectedSessionForReschedule(null);
      refreshData();
    } catch (err: any) {
      notify(`Rescheduling failed: ${err.message}`);
    }
  };

  const openCancelModal = (sess: any) => {
    setSelectedSessionForCancel(sess);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionForCancel) return;
    try {
      await api.updateSessionStatus(
        selectedSessionForCancel.session_id,
        'cancelled',
        selectedSessionForCancel.notes,
        cancelReason || 'Cancelled by mentor'
      );
      notify('Mentorship session cancelled and mentee notified.');
      setShowCancelModal(false);
      setSelectedSessionForCancel(null);
      refreshData();
    } catch (err: any) {
      notify(`Failed to cancel session: ${err.message}`);
    }
  };

  const openCompleteModal = (sess: any) => {
    setSelectedSessionForComplete(sess);
    setCompletionNotes(sess.notes || '');
    setCompletionActionItems('');
    setShowCompleteModal(true);
  };

  const handleConfirmComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionForComplete) return;
    const finalNotes = completionActionItems
      ? `${completionNotes.trim()} [Action Items: ${completionActionItems.trim()}]`
      : completionNotes.trim();
    try {
      await api.updateSessionStatus(selectedSessionForComplete.session_id, 'completed', finalNotes);
      notify('Session marked completed with notes saved.');
      setShowCompleteModal(false);
      setSelectedSessionForComplete(null);
      refreshData();
    } catch (err: any) {
      notify(`Failed to complete session: ${err.message}`);
    }
  };

  return (
    <div className="mentor-view-page">
      <div className="view-page-header">
        <div>
          <h2>Mentorship Sessions Dashboard</h2>
          <p>Schedule 1:1 sessions, coordinate meeting links, reschedule, and record actionable takeaways</p>
        </div>
        <button
          type="button"
          className="primary-action-btn purple-gradient"
          onClick={() => setShowScheduleModal(true)}
        >
          <Plus size={16} /> Schedule 1:1 Session
        </button>
      </div>

      <div className="filter-row-controls" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div className="filter-pills-row" style={{ margin: 0, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`filter-pill ${tab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setTab('upcoming')}
          >
            Upcoming ({upcomingCount})
          </button>
          <button
            type="button"
            className={`filter-pill ${tab === 'today' ? 'active' : ''}`}
            onClick={() => setTab('today')}
          >
            Today's Sessions ({todayCount})
          </button>
          <button
            type="button"
            className={`filter-pill ${tab === 'completed' ? 'active' : ''}`}
            onClick={() => setTab('completed')}
          >
            Completed ({completedCount})
          </button>
          <button
            type="button"
            className={`filter-pill ${tab === 'cancelled' ? 'active' : ''}`}
            onClick={() => setTab('cancelled')}
          >
            Cancelled ({cancelledCount})
          </button>
          <button
            type="button"
            className={`filter-pill ${tab === 'all' ? 'active' : ''}`}
            onClick={() => setTab('all')}
          >
            Session History ({allCount})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} style={{ color: '#94A3B8' }} />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              title="Filter by session date"
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.8rem',
                color: '#334155',
              }}
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#EF4444',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  padding: '2px 4px',
                }}
              >
                Clear
              </button>
            )}
          </div>

          <div style={{ position: 'relative', width: '220px' }}>
            <input
              type="text"
              placeholder="Search topic or mentee..."
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                fontSize: '0.82rem',
              }}
            />
          </div>
        </div>
      </div>

      <div className="sessions-grid-cards">
        {filteredSessions.length > 0 ? (
          filteredSessions.map((sess) => {
            const isToday = sess.session_date === todayStr;
            const duration = sess.duration_minutes || 60;
            const isActionable = sess.status === 'upcoming' || sess.status === 'rescheduled';

            return (
              <div
                key={sess.session_id}
                className="session-card-block"
                style={{
                  border: isToday && isActionable ? '2px solid var(--color-primary, #315DA8)' : undefined,
                  boxShadow: isToday && isActionable ? '0 4px 12px rgba(49, 89, 201, 0.15)' : undefined,
                }}
              >
                <div className="block-header">
                  <div>
                    <span className="session-topic-title">{sess.topic}</span>
                    {isToday && isActionable && (
                      <span
                        style={{
                          background: 'var(--color-primary, #315DA8)',
                          color: '#fff',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          marginLeft: '6px',
                          verticalAlign: 'middle',
                        }}
                      >
                        TODAY
                      </span>
                    )}
                  </div>
                  <span className={`status-pill ${sess.status}`}>{sess.status}</span>
                </div>

                <div className="block-student" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <UserRound size={14} style={{ flexShrink: 0, marginTop: '3px', color: '#64748B' }} />
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <span style={{ color: '#475569', fontSize: '0.8rem', display: 'block' }}>Student:</span>
                    <b style={{ color: '#0F172A', fontWeight: 600, fontSize: '0.88rem', display: 'block' }}>{sess.student_name}</b>
                    {sess.student_email && (
                      <span style={{ display: 'block', fontSize: '0.78rem', color: '#64748B', marginTop: '2px', overflowWrap: 'anywhere' }}>
                        {sess.student_email}
                      </span>
                    )}
                  </div>
                </div>

                <div className="block-timing">
                  <Calendar size={14} /> {sess.session_date} • {sess.start_time} - {sess.end_time}
                  <span style={{ color: 'var(--color-primary, #315DA8)', fontWeight: 600, marginLeft: '6px' }}>({duration} mins)</span>
                </div>

                <div className="block-link">
                  <ExternalLink size={14} />{' '}
                  <a href={sess.meeting_link} target="_blank" rel="noreferrer">
                    {sess.meeting_link}
                  </a>
                </div>

                {sess.notes && (
                  <div style={{ marginTop: '8px', padding: '6px 10px', background: '#F8FAFC', borderRadius: '6px', fontSize: '0.78rem', color: '#475569' }}>
                    <b>Notes / Takeaways:</b> {sess.notes}
                  </div>
                )}

                <div className="block-actions" style={{ marginTop: '12px' }}>
                  {isActionable && (
                    <a
                      href={sess.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-join-meeting"
                    >
                      Join Call
                    </a>
                  )}

                  <button
                    type="button"
                    className="btn-inspect"
                    style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                    onClick={() => setSelectedSessionForDetail(sess)}
                  >
                    View Details
                  </button>

                  {isActionable && (
                    <>
                      <button
                        type="button"
                        className="btn-inspect"
                        style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        onClick={() => openRescheduleModal(sess)}
                      >
                        Reschedule
                      </button>
                      <button
                        type="button"
                        className="btn-mark-done"
                        onClick={() => openCompleteModal(sess)}
                      >
                        Complete
                      </button>
                      <button
                        type="button"
                        className="btn-cancel-sess"
                        onClick={() => openCancelModal(sess)}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-panel-state full-width" style={{ padding: '3rem 1rem' }}>
            <CalendarDays size={36} style={{ color: '#94A3B8', marginBottom: '8px' }} />
            <b style={{ color: '#1E293B' }}>No sessions found in this category</b>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
              {tab === 'today'
                ? "No mentorship sessions scheduled for today."
                : tab === 'upcoming'
                ? "No upcoming mentorship sessions. Schedule one with an assigned student using the button above."
                : "No mentorship sessions matching your search or filters."}
            </p>
          </div>
        )}
      </div>

      {/* Session Details Modal */}
      {selectedSessionForDetail && (
        <div className="mentor-modal-overlay" onClick={() => setSelectedSessionForDetail(null)}>
          <div className="mentor-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>Mentorship Session Details</h3>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setSelectedSessionForDetail(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span className={`status-pill ${selectedSessionForDetail.status}`} style={{ fontSize: '0.82rem' }}>
                  {selectedSessionForDetail.status}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  ID: {selectedSessionForDetail.session_id}
                </span>
              </div>

              <h4 style={{ margin: '0 0 10px', fontSize: '1.1rem', color: 'var(--color-text-primary, #15213B)' }}>
                {selectedSessionForDetail.topic}
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px' }}>
                  <small style={{ color: '#64748B', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>Student</small>
                  <b style={{ color: '#0F172A', fontSize: '0.92rem', fontWeight: 600, display: 'block' }}>{selectedSessionForDetail.student_name}</b>
                  {selectedSessionForDetail.student_email && (
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '3px', overflowWrap: 'anywhere' }}>
                      {selectedSessionForDetail.student_email}
                    </div>
                  )}
                </div>
                <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px' }}>
                  <small style={{ color: '#64748B', display: 'block' }}>Duration</small>
                  <b>{selectedSessionForDetail.duration_minutes || 60} Minutes</b>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{selectedSessionForDetail.start_time} - {selectedSessionForDetail.end_time}</div>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.78rem', color: '#64748B', display: 'block', marginBottom: '4px' }}>Meeting Link</label>
                <a
                  href={selectedSessionForDetail.meeting_link}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--color-primary-hover, #4938E8)', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ExternalLink size={14} /> {selectedSessionForDetail.meeting_link}
                </a>
              </div>

              {selectedSessionForDetail.notes && (
                <div style={{ marginBottom: '16px', background: '#F1F5F9', padding: '12px', borderRadius: '8px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Session Notes / Instructions
                  </label>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#1E293B', whiteSpace: 'pre-wrap' }}>
                    {selectedSessionForDetail.notes}
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                {(selectedSessionForDetail.status === 'upcoming' || selectedSessionForDetail.status === 'rescheduled') && (
                  <a
                    href={selectedSessionForDetail.meeting_link}
                    target="_blank"
                    rel="noreferrer"
                    className="primary-action-btn purple-gradient"
                    style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}
                  >
                    Join Call
                  </a>
                )}
                <button
                  type="button"
                  className="btn-inspect"
                  style={{ flex: 1 }}
                  onClick={() => setSelectedSessionForDetail(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="mentor-modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="mentor-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Schedule 1:1 Mentorship Session</h3>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setShowScheduleModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateSession} className="auth-form" style={{ padding: '1.5rem' }}>
              <div className="form-group">
                <label>Select Assigned Student</label>
                <select value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
                  <option value="">-- Choose Student --</option>
                  {students.map((st) => (
                    <option key={st.student_id} value={st.student_id}>
                      {st.name}{st.email ? ` (${st.email})` : ''} — {st.target_career_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Session Topic</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Portfolio Code Review & MLOps Strategy"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                  {topicPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTopic(preset)}
                      style={{
                        background: '#EDF3FF',
                        border: '1px solid #E0E7FF',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '0.72rem',
                        color: 'var(--color-primary-hover, #4938E8)',
                        cursor: 'pointer',
                      }}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="text"
                    required
                    placeholder="10:00 AM"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="text"
                    required
                    placeholder="11:00 AM"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Meeting Platform / URL</label>
                  <input
                    type="url"
                    required
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Preparation Notes / Agenda (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Topics to prepare, repository links to review, etc."
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                />
              </div>

              <button type="submit" className="primary-action-btn full purple-gradient">
                Confirm & Schedule Session
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedSessionForReschedule && (
        <div className="mentor-modal-overlay" onClick={() => setShowRescheduleModal(false)}>
          <div className="mentor-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reschedule Mentorship Session</h3>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setShowRescheduleModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleConfirmReschedule} className="auth-form" style={{ padding: '1.5rem' }}>
              <div className="form-group">
                <label>Topic</label>
                <input type="text" disabled value={selectedSessionForReschedule.topic} style={{ background: '#F1F5F9' }} />
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>New Session Date</label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="text"
                    required
                    value={rescheduleStartTime}
                    onChange={(e) => setRescheduleStartTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="text"
                    required
                    value={rescheduleEndTime}
                    onChange={(e) => setRescheduleEndTime(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Meeting Link</label>
                  <input
                    type="url"
                    value={rescheduleMeetingLink}
                    onChange={(e) => setRescheduleMeetingLink(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Reschedule Reason / Notes (Shared with mentee)</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Moved 1 hour later due to client conflict."
                  value={rescheduleNotes}
                  onChange={(e) => setRescheduleNotes(e.target.value)}
                />
              </div>
              <button type="submit" className="primary-action-btn full purple-gradient">
                Save & Notify Mentee
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && selectedSessionForCancel && (
        <div className="mentor-modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="mentor-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Cancel Mentorship Session</h3>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setShowCancelModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleConfirmCancel} className="auth-form" style={{ padding: '1.5rem' }}>
              <p style={{ color: '#475569', fontSize: '0.88rem', margin: '0 0 12px' }}>
                Are you sure you want to cancel the session <b>&ldquo;{selectedSessionForCancel.topic}&rdquo;</b> with <b>{selectedSessionForCancel.student_name}</b>?
              </p>
              <div className="form-group">
                <label>Cancellation Reason (Shared with mentee)</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Unforeseen production incident conflict. Will follow up with alternative availability."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <button
                  type="button"
                  className="btn-inspect"
                  style={{ flex: 1 }}
                  onClick={() => setShowCancelModal(false)}
                >
                  Keep Session
                </button>
                <button
                  type="submit"
                  className="primary-action-btn"
                  style={{ flex: 1, background: '#DC2626', borderColor: '#DC2626' }}
                >
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Session Notes Modal */}
      {showCompleteModal && selectedSessionForComplete && (
        <div className="mentor-modal-overlay" onClick={() => setShowCompleteModal(false)}>
          <div className="mentor-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Mark Session Complete & Record Notes</h3>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setShowCompleteModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleConfirmComplete} className="auth-form" style={{ padding: '1.5rem' }}>
              <div className="form-group">
                <label>Completed Topic</label>
                <input type="text" disabled value={selectedSessionForComplete.topic} style={{ background: '#F1F5F9' }} />
              </div>
              <div className="form-group">
                <label>Session Takeaways & Strengths</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Record summary of topics discussed, student strengths demonstrated, etc."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Agreed Action Items / Next Steps (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Complete Docker tutorial, push PR for feature X, review chapter 4."
                  value={completionActionItems}
                  onChange={(e) => setCompletionActionItems(e.target.value)}
                />
              </div>
              <button type="submit" className="primary-action-btn full purple-gradient">
                Confirm Completion & Save Notes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   4. STUDENT PROGRESS & SKILL ASSESSMENTS VIEW
   ========================================================================= */
function ProgressView({
  students,
  notify,
  refreshData,
  onInspectStudent,
}: {
  students: any[];
  notify: (msg: string) => void;
  refreshData: () => void;
  onInspectStudent: (id: string) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryStudentId = new URLSearchParams(location.search).get('studentId');

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    queryStudentId || (students.length > 0 ? students[0].student_id : '')
  );
  const [activeSection, setActiveSection] = useState<
    'all' | 'insights' | 'skills' | 'roadmap' | 'assessments' | 'projects' | 'history' | 'feedback'
  >('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<any | null>(null);

  // Skill filter inside skills section
  const [skillFilter, setSkillFilter] = useState<'all' | 'known' | 'learning' | 'gaps'>('all');

  // Feedback form state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [fbStrengths, setFbStrengths] = useState('');
  const [fbImprovements, setFbImprovements] = useState('');
  const [fbNextAction, setFbNextAction] = useState('');
  const [fbComments, setFbComments] = useState('');
  const [fbRating, setFbRating] = useState(5);
  const [fbSubmitting, setFbSubmitting] = useState(false);

  const fetchProgress = async (studentId: string) => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMentorStudentProgress(studentId);
      setProgressData(data);
    } catch (err: any) {
      console.error('[ProgressView] Failed fetching progress:', err);
      setError(err.message || 'Unable to retrieve student progress record from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryStudentId && queryStudentId !== selectedStudentId) {
      setSelectedStudentId(queryStudentId);
    } else if (!selectedStudentId && students.length > 0) {
      setSelectedStudentId(students[0].student_id);
    }
  }, [queryStudentId, students]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchProgress(selectedStudentId);
    }
  }, [selectedStudentId]);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbStrengths.trim() || !fbImprovements.trim() || !fbNextAction.trim()) {
      notify('Please fill in strengths, improvement areas, and recommended next action.');
      return;
    }
    setFbSubmitting(true);
    try {
      await api.submitMentorStudentProgressFeedback(selectedStudentId, {
        strengths: fbStrengths.trim(),
        improvement_areas: fbImprovements.trim(),
        recommended_action: fbNextAction.trim(),
        comments: fbComments.trim(),
        rating: fbRating,
      });
      notify('Mentorship progress feedback and recommendations submitted successfully!');
      setShowFeedbackModal(false);
      setFbStrengths('');
      setFbImprovements('');
      setFbNextAction('');
      setFbComments('');
      setFbRating(5);
      fetchProgress(selectedStudentId);
      refreshData();
    } catch (err: any) {
      notify(`Submission failed: ${err.message || 'Unable to save feedback.'}`);
    } finally {
      setFbSubmitting(false);
    }
  };

  // If mentor has no assigned students
  if (students.length === 0) {
    return (
      <div className="mentor-view-page">
        <div className="view-page-header">
          <div>
            <h2>Student Progress & Mentor Insights</h2>
            <p>Supervise learning velocity, monitor roadmaps, and calibrate diagnostic skill evidence</p>
          </div>
        </div>
        <div className="empty-state-box" style={{ padding: '4rem 2rem', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
          <Users size={48} style={{ color: '#94A3B8', marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 8px', color: 'var(--color-text-primary, #15213B)' }}>No Assigned Students</h3>
          <p style={{ maxWidth: '480px', margin: '0 auto 1.5rem', color: '#64748B', fontSize: '0.9rem', lineHeight: 1.5 }}>
            You do not currently have any active students connected in your cohort. Accept incoming mentorship requests or assign students to monitor their real-time progress, assessments, and learning roadmaps.
          </p>
          <button
            type="button"
            className="primary-action-btn purple-gradient"
            onClick={() => navigate('/mentor/students')}
          >
            Go to My Students
          </button>
        </div>
      </div>
    );
  }

  const overview = progressData?.overview || {};
  const skillProgress = progressData?.skill_progress || {};
  const roadmap = progressData?.roadmap || {};
  const assessment = progressData?.assessment_performance || {};
  const projectProg = progressData?.project_progress || {};
  const mentorshipHist = progressData?.mentorship_history || {};
  const insights: any[] = progressData?.insights || [];
  const viz = progressData?.visualizations || {};

  // Filter skills
  const allSkillsList: any[] = skillProgress.all_skills || [];
  const displayedSkills = allSkillsList.filter((s: any) => {
    if (skillFilter === 'known') return s.is_completed || s.final_mastery >= 70;
    if (skillFilter === 'learning') return !s.is_completed && s.final_mastery > 0 && s.final_mastery < 70;
    if (skillFilter === 'gaps') return s.final_mastery === 0 || (s.gap && s.gap > 0);
    return true;
  });

  return (
    <div className="mentor-view-page">
      {/* Top Controls Header */}
      <div className="view-page-header" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="btn-inspect"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
            onClick={() => navigate('/mentor/students')}
            title="Return to My Students Cohort Table"
          >
            <ArrowLeft size={16} /> Back to My Students
          </button>
          <div>
            <h2 style={{ margin: 0 }}>Student Progress & Mentor Insights</h2>
            <small style={{ color: '#64748B' }}>
              Monitoring verified competency across PathForge AI learning roadmaps and assessments
            </small>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
          <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>Active Student:</span>
          <select
            value={selectedStudentId}
            onChange={(e) => {
              const newId = e.target.value;
              setSelectedStudentId(newId);
              navigate(`/mentor/progress?studentId=${newId}`);
            }}
            className="select-student-dropdown"
            style={{ minWidth: '220px' }}
          >
            {students.map((st) => (
              <option key={st.student_id} value={st.student_id}>
                {st.name}{st.email ? ` (${st.email})` : ''} — {st.target_career_name}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="primary-action-btn purple-gradient"
            style={{ padding: '7px 14px', fontSize: '0.82rem' }}
            onClick={() => setShowFeedbackModal(true)}
          >
            <Edit size={14} /> Add Progress Feedback
          </button>

          <button
            type="button"
            className="btn-inspect"
            style={{ padding: '7px 10px' }}
            onClick={() => fetchProgress(selectedStudentId)}
            title="Refresh Progress"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Navigation Jump Tabs */}
      <div className="mentor-main-tabs" style={{ marginBottom: '20px', flexWrap: 'wrap', gap: '6px' }}>
        {[
          { id: 'all', label: 'All Sections' },
          { id: 'insights', label: `Mentor Insights (${insights.length})` },
          { id: 'skills', label: 'Skill Gap Matrix' },
          { id: 'roadmap', label: 'Learning Roadmap' },
          { id: 'assessments', label: 'Assessment Results' },
          { id: 'projects', label: 'Project Progress' },
          { id: 'history', label: 'Mentorship History' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`mentor-main-tab ${activeSection === tab.id ? 'active' : ''}`}
            onClick={() => setActiveSection(tab.id as any)}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
          <RefreshCw size={36} className="spin-animation" style={{ color: 'var(--color-primary, #315DA8)', margin: '0 auto 12px' }} />
          <h4 style={{ margin: 0, color: 'var(--color-text-primary, #15213B)' }}>Loading Verified Student Progress...</h4>
          <p style={{ margin: '6px 0 0', color: '#64748B', fontSize: '0.85rem' }}>
            Retrieving calibrated mastery scores, roadmap milestones, and assessment diagnostics
          </p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', background: '#FFF1F2', borderRadius: '16px', border: '1px solid #FECDD3' }}>
          <AlertCircle size={40} style={{ color: '#E11D48', margin: '0 auto 12px' }} />
          <h4 style={{ margin: 0, color: '#9F1239' }}>Error Loading Progress Record</h4>
          <p style={{ margin: '6px 0 16px', color: '#BE123C', fontSize: '0.88rem' }}>{error}</p>
          <button
            type="button"
            className="primary-action-btn"
            style={{ background: '#E11D48' }}
            onClick={() => fetchProgress(selectedStudentId)}
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Main Progress Content */}
      {!loading && !error && progressData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* ==============================================================
              SECTION A: STUDENT OVERVIEW CARD
              ============================================================== */}
          {(activeSection === 'all' || activeSection === 'insights') && (
            <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 320px' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--color-primary, #315DA8) 0%, var(--color-primary-hover, #4938E8) 100%)',
                      color: '#FFFFFF',
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {overview.name ? overview.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2) : 'ST'}
                  </div>
                  <div>
                    <h2 style={{ margin: '0 0 4px', fontSize: '1.35rem', fontWeight: 700, color: '#0F172A' }}>{overview.name}</h2>
                    {overview.email && (
                      <div style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '4px', overflowWrap: 'anywhere' }}>
                        {overview.email}
                      </div>
                    )}
                    <p style={{ margin: '0 0 6px', color: '#64748B', fontSize: '0.82rem' }}>
                      {overview.degree} • {overview.department}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <span className="badge-career-tag">{overview.target_career_name}</span>
                      <span style={{ background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {overview.college}
                      </span>
                      {overview.graduation_year && (
                        <span style={{ background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                          Class of {overview.graduation_year}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Key Overview Metrics */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', flex: '1 1 340px', justifyContent: 'flex-end' }}>
                  <div style={{ background: '#F8FAFC', padding: '10px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', minWidth: '120px', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '1.35rem', fontWeight: 800, color: '#10B981' }}>
                      {overview.readiness_pct}%
                    </span>
                    <small style={{ color: '#64748B', fontSize: '0.72rem', fontWeight: 600 }}>Career Readiness</small>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '10px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', minWidth: '120px', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary, #315DA8)' }}>
                      {overview.mastery_pct}%
                    </span>
                    <small style={{ color: '#64748B', fontSize: '0.72rem', fontWeight: 600 }}>Calibrated Mastery</small>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '10px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', minWidth: '120px', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary, #15213B)', marginTop: '6px' }}>
                      {overview.last_active_date || 'Not available'}
                    </span>
                    <small style={{ color: '#64748B', fontSize: '0.72rem', fontWeight: 600 }}>Last Activity</small>
                  </div>
                </div>
              </div>

              {/* Career Goal & Learning Mode details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
                <div>
                  <small style={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>Target Career Track</small>
                  <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: '#1E293B', fontWeight: 600 }}>{overview.target_career_name}</p>
                  <small style={{ color: '#64748B', fontSize: '0.76rem', display: 'block', marginTop: '2px' }}>{overview.career_focus}</small>
                </div>
                <div>
                  <small style={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>Learning Preferences</small>
                  <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: '#1E293B' }}>
                    Mode: <b>{overview.learning_mode || 'Project-based'}</b>
                  </p>
                  <small style={{ color: '#64748B', fontSize: '0.76rem' }}>
                    {overview.weekly_learning_hours || 12} hrs/week • {overview.preferred_difficulty || 'Adaptive'}
                  </small>
                </div>
                <div>
                  <small style={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>Academic Baseline</small>
                  <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: '#1E293B' }}>
                    CGPA: <b>{overview.cgpa ? `${overview.cgpa} / 10.0` : 'Not available'}</b>
                  </p>
                  <small style={{ color: '#64748B', fontSize: '0.76rem' }}>{overview.degree} • {overview.department}</small>
                </div>
              </div>
            </div>
          )}

          {/* ==============================================================
              SECTION G: MENTOR INSIGHTS (Traceable Data Observations)
              ============================================================== */}
          {(activeSection === 'all' || activeSection === 'insights') && (
            <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lightbulb size={20} style={{ color: '#F59E0B' }} />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-primary, #15213B)' }}>
                    Algorithmic Mentor Insights & Recommendations
                  </h3>
                </div>
                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  Traceable to database records & threshold heuristics
                </span>
              </div>

              {insights.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
                  {insights.map((ins) => {
                    const isHigh = ins.severity === 'high';
                    const isWarn = ins.severity === 'warning';
                    const isSuccess = ins.severity === 'success';

                    const borderCol = isHigh ? '#FECDD3' : isWarn ? '#FDE68A' : isSuccess ? '#A7F3D0' : '#E0E7FF';
                    const bgCol = isHigh ? '#FFF1F2' : isWarn ? '#FFFBEB' : isSuccess ? '#ECFDF5' : '#EDF3FF';
                    const tagCol = isHigh ? '#E11D48' : isWarn ? '#D97706' : isSuccess ? '#059669' : 'var(--color-primary-hover, #4938E8)';

                    return (
                      <div
                        key={ins.id}
                        style={{
                          background: bgCol,
                          border: `1px solid ${borderCol}`,
                          borderRadius: '12px',
                          padding: '14px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span
                            style={{
                              background: '#FFFFFF',
                              color: tagCol,
                              border: `1px solid ${borderCol}`,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                            }}
                          >
                            {ins.severity} priority
                          </span>
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: tagCol }}>
                            {ins.metric}
                          </span>
                        </div>
                        <h4 style={{ margin: '4px 0 0', fontSize: '0.92rem', color: 'var(--color-text-primary, #15213B)' }}>{ins.title}</h4>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#334155', lineHeight: 1.45 }}>
                          <b>Observation:</b> {ins.observation}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#1E293B', lineHeight: 1.45, fontWeight: 500 }}>
                          <b>Recommendation:</b> {ins.recommendation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', background: '#F8FAFC', borderRadius: '12px' }}>
                  <CheckCircle size={28} style={{ color: '#10B981', margin: '0 auto 8px' }} />
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569' }}>
                    No critical bottlenecks detected. The student's learning roadmap and assessment scores meet expected velocity.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ==============================================================
              SECTION H: PROGRESS VISUALIZATIONS
              ============================================================== */}
          {(activeSection === 'all' || activeSection === 'insights') && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Card 1: Roadmap Completion */}
              <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <TrendingUp size={18} style={{ color: 'var(--color-primary, #315DA8)' }} />
                  <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-text-primary, #15213B)' }}>Roadmap Velocity</h4>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '76px',
                      height: '76px',
                      borderRadius: '50%',
                      background: `conic-gradient(var(--color-primary, #315DA8) ${viz.roadmap_chart?.completion_pct || 0}%, #F1F5F9 0)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        color: 'var(--color-text-primary, #15213B)',
                      }}
                    >
                      {viz.roadmap_chart?.completion_pct || 0}%
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div><b>{viz.roadmap_chart?.completed || 0}</b> Completed Milestones</div>
                    <div><b>{viz.roadmap_chart?.in_progress || 0}</b> In Progress</div>
                    <div><b>{viz.roadmap_chart?.pending || 0}</b> Pending Milestones</div>
                  </div>
                </div>
              </div>

              {/* Card 2: Skills Distribution */}
              <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <PieChart size={18} style={{ color: '#10B981' }} />
                  <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-text-primary, #15213B)' }}>Skills Competency Ratio</h4>
                </div>
                <div style={{ display: 'flex', height: '14px', borderRadius: '8px', overflow: 'hidden', background: '#F1F5F9', marginBottom: '12px' }}>
                  <div
                    style={{
                      width: `${((viz.skills_ratio_chart?.completed || 0) / (viz.skills_ratio_chart?.total || 1)) * 100}%`,
                      background: '#10B981',
                    }}
                    title="Mastered"
                  />
                  <div
                    style={{
                      width: `${((viz.skills_ratio_chart?.in_progress || 0) / (viz.skills_ratio_chart?.total || 1)) * 100}%`,
                      background: 'var(--color-primary, #315DA8)',
                    }}
                    title="In Progress"
                  />
                  <div
                    style={{
                      width: `${((viz.skills_ratio_chart?.remaining || 0) / (viz.skills_ratio_chart?.total || 1)) * 100}%`,
                      background: '#F59E0B',
                    }}
                    title="Gaps Remaining"
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: '#10B981', fontWeight: 600 }}>● {viz.skills_ratio_chart?.completed || 0} Met</span>
                  <span style={{ color: 'var(--color-primary, #315DA8)', fontWeight: 600 }}>● {viz.skills_ratio_chart?.in_progress || 0} Learning</span>
                  <span style={{ color: '#F59E0B', fontWeight: 600 }}>● {viz.skills_ratio_chart?.remaining || 0} Gaps</span>
                </div>
              </div>

              {/* Card 3: Project Verification */}
              <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <FolderKanban size={18} style={{ color: '#3B82F6' }} />
                  <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-text-primary, #15213B)' }}>Project Progress</h4>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                  <div>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10B981', display: 'block' }}>
                      {viz.project_status_chart?.completed || 0}
                    </span>
                    <small style={{ color: '#64748B', fontSize: '0.72rem' }}>Verified</small>
                  </div>
                  <div>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary, #315DA8)', display: 'block' }}>
                      {viz.project_status_chart?.in_progress || 0}
                    </span>
                    <small style={{ color: '#64748B', fontSize: '0.72rem' }}>In Progress</small>
                  </div>
                  <div>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#94A3B8', display: 'block' }}>
                      {viz.project_status_chart?.not_started || 0}
                    </span>
                    <small style={{ color: '#64748B', fontSize: '0.72rem' }}>Planned</small>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==============================================================
              SECTION B: SKILL PROGRESS & SKILL GAP ANALYSIS
              ============================================================== */}
          {(activeSection === 'all' || activeSection === 'skills') && (
            <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-primary, #15213B)' }}>
                    Skill Competency & Deterministic Gap Analysis
                  </h3>
                  <small style={{ color: '#64748B' }}>
                    Calibrated multi-source evidence mapped against {overview.target_career_name} industry standards
                  </small>
                </div>
                <div className="filter-pills-row" style={{ margin: 0 }}>
                  <button
                    type="button"
                    className={`filter-pill ${skillFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setSkillFilter('all')}
                  >
                    All Skills ({allSkillsList.length})
                  </button>
                  <button
                    type="button"
                    className={`filter-pill ${skillFilter === 'known' ? 'active' : ''}`}
                    onClick={() => setSkillFilter('known')}
                  >
                    Mastered ({skillProgress.skills_completed_count || 0})
                  </button>
                  <button
                    type="button"
                    className={`filter-pill ${skillFilter === 'learning' ? 'active' : ''}`}
                    onClick={() => setSkillFilter('learning')}
                  >
                    In Progress
                  </button>
                  <button
                    type="button"
                    className={`filter-pill ${skillFilter === 'gaps' ? 'active' : ''}`}
                    onClick={() => setSkillFilter('gaps')}
                  >
                    Skill Gaps ({skillProgress.skills_remaining_count || 0})
                  </button>
                </div>
              </div>

              {/* Detailed Skills Table */}
              <div className="students-table-card" style={{ boxShadow: 'none', border: '1px solid #F1F5F9' }}>
                <table className="mentor-data-table">
                  <thead>
                    <tr>
                      <th>Skill Name</th>
                      <th>Category</th>
                      <th>Mastery Level</th>
                      <th>Calibrated Score</th>
                      <th>Multi-Source Breakdown</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedSkills.length > 0 ? (
                      displayedSkills.map((sk: any) => (
                        <tr key={sk.skill_id}>
                          <td>
                            <b>{sk.skill_name}</b>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>{sk.category}</span>
                          </td>
                          <td>
                            <span className={`mastery-pill ${sk.mastery_level?.toLowerCase()}`}>
                              {sk.mastery_level}
                            </span>
                          </td>
                          <td>
                            <div className="readiness-cell" style={{ minWidth: '110px' }}>
                              <b>{sk.final_mastery}%</b>
                              <div className="mini-progress-bar">
                                <div
                                  className="mini-bar-fill"
                                  style={{
                                    width: `${sk.final_mastery}%`,
                                    backgroundColor: sk.final_mastery >= 75 ? '#10B981' : (sk.final_mastery >= 40 ? 'var(--color-primary, #315DA8)' : '#F59E0B')
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', fontSize: '0.7rem' }}>
                              <span style={{ background: '#F1F5F9', padding: '1px 5px', borderRadius: '4px' }}>Self: {sk.self_declared_score}%</span>
                              <span style={{ background: '#F1F5F9', padding: '1px 5px', borderRadius: '4px' }}>Resume: {sk.resume_score}%</span>
                              <span style={{ background: '#F1F5F9', padding: '1px 5px', borderRadius: '4px' }}>Quiz: {sk.assessment_score}%</span>
                              <span style={{ background: '#F1F5F9', padding: '1px 5px', borderRadius: '4px' }}>Project: {sk.project_score}%</span>
                              <span style={{ background: '#F1F5F9', padding: '1px 5px', borderRadius: '4px' }}>Mentor: {sk.mentor_score}%</span>
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                background: sk.is_completed || sk.final_mastery >= 70 ? '#ECFDF5' : (sk.final_mastery > 0 ? '#EDF3FF' : '#FEF3C7'),
                                color: sk.is_completed || sk.final_mastery >= 70 ? '#059669' : (sk.final_mastery > 0 ? 'var(--color-primary-hover, #4938E8)' : '#D97706'),
                              }}
                            >
                              {sk.is_completed || sk.final_mastery >= 70 ? 'Met' : (sk.final_mastery > 0 ? 'Learning' : 'Gap')}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                          No skills found matching selected filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Priority-Ranked Skill Gaps List */}
              {skillProgress.gap_analysis && skillProgress.gap_analysis.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem', color: 'var(--color-text-primary, #15213B)' }}>
                    Ranked Skill Gaps vs Career Target ({overview.target_career_name})
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                    {skillProgress.gap_analysis.map((gap: any) => (
                      <div
                        key={gap.skill_id}
                        style={{
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '10px',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <b style={{ fontSize: '0.86rem', color: 'var(--color-text-primary, #15213B)', display: 'block' }}>{gap.skill_name}</b>
                          <small style={{ color: '#64748B' }}>Target: {gap.required_level} ({gap.required_score}%)</small>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background: gap.gap === 0 ? '#ECFDF5' : (gap.gap >= 30 ? '#FFF1F2' : '#FEF3C7'),
                              color: gap.gap === 0 ? '#059669' : (gap.gap >= 30 ? '#E11D48' : '#D97706'),
                            }}
                          >
                            {gap.gap === 0 ? 'Met' : `Gap: ${gap.gap}%`}
                          </span>
                          <small style={{ display: 'block', color: '#64748B', marginTop: '2px' }}>
                            Mastery: {gap.current_mastery}%
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==============================================================
              SECTION C: LEARNING ROADMAP & MILESTONES
              ============================================================== */}
          {(activeSection === 'all' || activeSection === 'roadmap') && (
            <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-primary, #15213B)' }}>
                    Learning Roadmap: {roadmap.roadmap_title || 'Core Learning Path'}
                  </h3>
                  <small style={{ color: '#64748B' }}>
                    Topological milestone execution order • {roadmap.completed_steps || 0} of {roadmap.total_steps || 0} milestones completed ({roadmap.completion_pct || 0}%)
                  </small>
                </div>
              </div>

              {roadmap.steps && roadmap.steps.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {roadmap.steps.map((st: any) => {
                    const isDone = st.status === 'completed';
                    const isInProg = st.status === 'in_progress';
                    return (
                      <div
                        key={st.id || st.step_number}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          border: `1px solid ${isDone ? '#A7F3D0' : (isInProg ? '#C8D6EA' : '#E2E8F0')}`,
                          background: isDone ? '#F0FDF4' : (isInProg ? '#F5F3FF' : '#F8FAFC'),
                        }}
                      >
                        <span
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: isDone ? '#10B981' : (isInProg ? 'var(--color-primary, #315DA8)' : '#CBD5E1'),
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {isDone ? <Check size={16} /> : st.step_number}
                        </span>

                        <div style={{ flex: 1 }}>
                          <b style={{ fontSize: '0.88rem', color: 'var(--color-text-primary, #15213B)' }}>{st.milestone_name}</b>
                          <small style={{ display: 'block', color: '#64748B', fontSize: '0.74rem' }}>
                            Estimated: {st.estimated_weeks || 3} weeks {st.completed_at ? `• Completed on ${st.completed_at}` : ''}
                          </small>
                        </div>

                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: isDone ? '#DCFCE7' : (isInProg ? '#EDE9FE' : '#F1F5F9'),
                            color: isDone ? '#15803D' : (isInProg ? '#6D28D9' : '#64748B'),
                          }}
                        >
                          {st.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
                  No roadmap steps defined for this student yet.
                </div>
              )}

              {/* Recent Learning Activities */}
              {roadmap.recent_activities && roadmap.recent_activities.length > 0 && (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', color: 'var(--color-text-primary, #15213B)' }}>
                    Recently Completed Learning Activities
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {roadmap.recent_activities.map((act: any) => (
                      <div
                        key={act.activity_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: '#F8FAFC',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                        }}
                      >
                        <div>
                          <b style={{ color: '#1E293B' }}>{act.activity_name}</b>
                          <small style={{ display: 'block', color: '#64748B' }}>{act.activity_type} • {act.duration_minutes} min</small>
                        </div>
                        <span style={{ color: '#94A3B8', fontSize: '0.76rem' }}>{act.activity_date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==============================================================
              SECTION D: ASSESSMENT PERFORMANCE
              ============================================================== */}
          {(activeSection === 'all' || activeSection === 'assessments') && (
            <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-primary, #15213B)' }}>
                    Assessment Performance & Diagnostic Results
                  </h3>
                  <small style={{ color: '#64748B' }}>
                    Evaluated from proctored question answers and course module assessments
                  </small>
                </div>
              </div>

              {/* Stat metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <small style={{ color: '#64748B', fontSize: '0.72rem', textTransform: 'uppercase' }}>Questions Attempted</small>
                  <b style={{ display: 'block', fontSize: '1.25rem', color: 'var(--color-text-primary, #15213B)', marginTop: '2px' }}>
                    {assessment.total_questions_attempted || 0}
                  </b>
                </div>
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <small style={{ color: '#64748B', fontSize: '0.72rem', textTransform: 'uppercase' }}>Overall Accuracy</small>
                  <b style={{ display: 'block', fontSize: '1.25rem', color: '#10B981', marginTop: '2px' }}>
                    {assessment.accuracy_pct || 0}%
                  </b>
                </div>
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <small style={{ color: '#64748B', fontSize: '0.72rem', textTransform: 'uppercase' }}>Average Score</small>
                  <b style={{ display: 'block', fontSize: '1.25rem', color: 'var(--color-primary, #315DA8)', marginTop: '2px' }}>
                    {assessment.avg_assessment_score != null ? `${assessment.avg_assessment_score}%` : 'Not available'}
                  </b>
                </div>
              </div>

              {/* Course Assessments */}
              {assessment.course_assessments && assessment.course_assessments.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', color: 'var(--color-text-primary, #15213B)' }}>Course Final Assessments</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {assessment.course_assessments.map((ca: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                        }}
                      >
                        <div>
                          <b style={{ fontSize: '0.86rem', color: 'var(--color-text-primary, #15213B)' }}>{ca.course_name}</b>
                          <small style={{ display: 'block', color: '#64748B' }}>{ca.completed_at ? `Completed: ${ca.completed_at}` : 'In progress'}</small>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 800, color: ca.passed ? '#10B981' : '#EF4444' }}>
                            {ca.score}%
                          </span>
                          <span
                            style={{
                              marginLeft: '8px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              background: ca.passed ? '#ECFDF5' : '#FFF1F2',
                              color: ca.passed ? '#059669' : '#E11D48',
                            }}
                          >
                            {ca.passed ? 'PASSED' : 'RETRY NEEDED'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Areas Requiring Improvement */}
              {assessment.weak_skills && assessment.weak_skills.length > 0 && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
                  <b style={{ color: '#B45309', fontSize: '0.85rem' }}>Skills Requiring Remediation (&lt; 60%):</b>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {assessment.weak_skills.map((ws: any, idx: number) => (
                      <span key={idx} style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 600 }}>
                        {ws.skill_name} ({ws.score}%)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==============================================================
              SECTION E: PROJECT PROGRESS & MENTOR REVIEWS
              ============================================================== */}
          {(activeSection === 'all' || activeSection === 'projects') && (
            <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-primary, #15213B)' }}>
                    Student Projects & Code Reviews
                  </h3>
                  <small style={{ color: '#64748B' }}>
                    Applied implementation artifacts, GitHub repositories, and mentor rubric evaluations
                  </small>
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-primary, #315DA8)' }}>
                  {projectProg.completed_projects || 0} Verified • {projectProg.in_progress_projects || 0} In Progress
                </span>
              </div>

              {projectProg.projects && projectProg.projects.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {projectProg.projects.map((proj: any) => (
                    <div
                      key={proj.project_id}
                      style={{
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        padding: '16px',
                        background: '#F8FAFC',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <b style={{ fontSize: '0.98rem', color: 'var(--color-text-primary, #15213B)' }}>{proj.project_name}</b>
                          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                            <span style={{ background: '#EDF3FF', color: 'var(--color-primary-hover, #4938E8)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600 }}>
                              {proj.category}
                            </span>
                            <span style={{ background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600 }}>
                              {proj.difficulty}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {proj.github_url && (
                            <a
                              href={proj.github_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#FFFFFF',
                                border: '1px solid #CBD5E1',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                color: 'var(--color-text-primary, #15213B)',
                                textDecoration: 'none',
                                fontWeight: 600,
                              }}
                            >
                              <ExternalLink size={12} /> GitHub Repo
                            </a>
                          )}
                          <span
                            style={{
                              padding: '3px 10px',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              background: proj.status === 'completed' ? '#DCFCE7' : '#EDE9FE',
                              color: proj.status === 'completed' ? '#15803D' : '#6D28D9',
                            }}
                          >
                            {proj.status}
                          </span>
                        </div>
                      </div>

                      <p style={{ margin: '10px 0 6px', fontSize: '0.82rem', color: '#475569', lineHeight: 1.45 }}>
                        {proj.description}
                      </p>

                      {/* Mentor Review Attached */}
                      {proj.has_mentor_review && proj.mentor_review && (
                        <div style={{ marginTop: '12px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#F59E0B' }}>
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={13}
                                  fill={i < proj.mentor_review.rating ? '#F59E0B' : 'none'}
                                  color="#F59E0B"
                                />
                              ))}
                              <b style={{ color: 'var(--color-text-primary, #15213B)', fontSize: '0.8rem', marginLeft: '4px' }}>
                                {proj.mentor_review.rating} / 5
                              </b>
                            </div>
                            <small style={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                              Reviewed: {proj.mentor_review.feedback_date}
                            </small>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: '#334155' }}>
                            <b>Feedback:</b> {proj.mentor_review.comments || proj.mentor_review.strengths}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
                  No projects recorded for this student yet.
                </div>
              )}
            </div>
          )}

          {/* ==============================================================
              SECTION F: MENTORSHIP HISTORY & PRIVATE NOTES
              ============================================================== */}
          {(activeSection === 'all' || activeSection === 'history') && (
            <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-primary, #15213B)' }}>
                    Mentorship Sessions & Guidance History
                  </h3>
                  <small style={{ color: '#64748B' }}>
                    Confidential mentor-student 1:1 sessions, action items, and notes
                  </small>
                </div>
              </div>

              {/* Upcoming Session Spotlight */}
              {mentorshipHist.upcoming_session && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, #EDF3FF 0%, #E0E7FF 100%)',
                    border: '1px solid #C8D6EA',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-primary-hover, #4938E8)', textTransform: 'uppercase' }}>
                      Upcoming Session
                    </span>
                    <h4 style={{ margin: '2px 0', fontSize: '1.05rem', color: 'var(--color-text-primary, #15213B)' }}>
                      {mentorshipHist.upcoming_session.topic}
                    </h4>
                    <small style={{ color: '#4338CA' }}>
                      {mentorshipHist.upcoming_session.session_date} at {mentorshipHist.upcoming_session.start_time} • {mentorshipHist.upcoming_session.platform}
                    </small>
                  </div>
                  {mentorshipHist.upcoming_session.meeting_link && (
                    <a
                      href={mentorshipHist.upcoming_session.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="primary-action-btn purple-gradient"
                      style={{ padding: '6px 14px', fontSize: '0.8rem', textDecoration: 'none' }}
                    >
                      <ExternalLink size={13} /> Join Call
                    </a>
                  )}
                </div>
              )}

              {/* Past Sessions List */}
              {mentorshipHist.sessions && mentorshipHist.sessions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: '0.92rem', color: 'var(--color-text-primary, #15213B)' }}>Past Sessions</h4>
                  {mentorshipHist.sessions.map((s: any) => (
                    <div
                      key={s.session_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: '#F8FAFC',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      <div>
                        <b style={{ fontSize: '0.86rem', color: 'var(--color-text-primary, #15213B)' }}>{s.topic}</b>
                        <small style={{ display: 'block', color: '#64748B' }}>
                          {s.session_date} • {s.start_time} - {s.end_time}
                        </small>
                        {s.notes && (
                          <small style={{ display: 'block', color: '#334155', marginTop: '2px', fontStyle: 'italic' }}>
                            Notes: "{s.notes}"
                          </small>
                        )}
                      </div>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: s.status === 'completed' ? '#DCFCE7' : (s.status === 'cancelled' ? '#FFF1F2' : '#EDE9FE'),
                          color: s.status === 'completed' ? '#15803D' : (s.status === 'cancelled' ? '#E11D48' : '#6D28D9'),
                        }}
                      >
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.84rem', color: '#94A3B8', margin: '0 0 16px' }}>No session history recorded yet.</p>
              )}

              {/* Guidance Notes & Recommendations */}
              {mentorshipHist.guidance_notes && mentorshipHist.guidance_notes.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 8px', fontSize: '0.92rem', color: 'var(--color-text-primary, #15213B)' }}>Recorded Guidance Notes</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {mentorshipHist.guidance_notes.map((gn: any) => (
                      <div
                        key={gn.id}
                        style={{
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          padding: '12px 14px',
                        }}
                      >
                        <small style={{ color: '#64748B', display: 'block', marginBottom: '4px', fontSize: '0.72rem' }}>
                          Recorded on {gn.created_at}
                        </small>
                        <p style={{ margin: 0, fontSize: '0.84rem', color: '#1E293B', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
                          {gn.notes}
                        </p>
                        {gn.action_items && (
                          <div style={{ marginTop: '6px', background: '#FFFFFF', padding: '6px 10px', borderRadius: '4px', border: '1px solid #E2E8F0', fontSize: '0.78rem' }}>
                            <b style={{ color: 'var(--color-primary, #315DA8)' }}>Action Item:</b> {gn.action_items}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==============================================================
              SECTION I: MENTOR FEEDBACK & RECOMMENDATIONS FORM
              ============================================================== */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-primary, #15213B)' }}>
                  Provide Mentorship Progress Feedback & Action Plan
                </h3>
                <small style={{ color: '#64748B' }}>
                  Calibrate student competency, assign focus skills, and dispatch guidance notifications
                </small>
              </div>
            </div>

            <form onSubmit={handleSubmitFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                    Demonstrated Strengths *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Strong understanding of linear algebra and model evaluation metrics..."
                    value={fbStrengths}
                    onChange={(e) => setFbStrengths(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                    Areas for Improvement *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Needs deeper practice with Docker containerization and ML deployment pipelines..."
                    value={fbImprovements}
                    onChange={(e) => setFbImprovements(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                    Next Learning Task or Recommended Skill *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Complete Docker for Machine Learning lab and deploy model to FastAPI"
                    value={fbNextAction}
                    onChange={(e) => setFbNextAction(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                    Evaluation Rating (1 to 5 Stars)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => setFbRating(starVal)}
                        style={{
                          background: fbRating >= starVal ? '#FEF3C7' : '#F1F5F9',
                          border: `1px solid ${fbRating >= starVal ? '#F59E0B' : '#CBD5E1'}`,
                          borderRadius: '6px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 700,
                          color: fbRating >= starVal ? '#B45309' : '#64748B',
                        }}
                      >
                        <Star size={14} fill={fbRating >= starVal ? '#F59E0B' : 'none'} color="#F59E0B" />
                        {starVal}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                  Additional Guidance / Action Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional context or notes shared with the mentee..."
                  value={fbComments}
                  onChange={(e) => setFbComments(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="submit"
                  disabled={fbSubmitting}
                  className="primary-action-btn purple-gradient"
                  style={{ padding: '9px 20px', fontSize: '0.86rem' }}
                >
                  {fbSubmitting ? 'Saving Feedback...' : 'Submit Progress Feedback & Guidance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Standalone Feedback Modal when launched via top button */}
      {showFeedbackModal && (
        <div className="mentor-modal-overlay" onClick={() => !fbSubmitting && setShowFeedbackModal(false)}>
          <div className="mentor-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Submit Progress Guidance & Feedback</h3>
              <button
                type="button"
                disabled={fbSubmitting}
                className="close-modal-btn"
                onClick={() => setShowFeedbackModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmitFeedback} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label>Strengths Observed *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Student strengths..."
                  value={fbStrengths}
                  onChange={(e) => setFbStrengths(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Areas for Improvement *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Key areas requiring remediation..."
                  value={fbImprovements}
                  onChange={(e) => setFbImprovements(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Next Learning Task / Recommended Skill *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement containerized test suite"
                  value={fbNextAction}
                  onChange={(e) => setFbNextAction(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Rating (1-5)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFbRating(s)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: fbRating >= s ? '#FEF3C7' : '#F1F5F9',
                        border: `1px solid ${fbRating >= s ? '#F59E0B' : '#E2E8F0'}`,
                        cursor: 'pointer',
                        color: fbRating >= s ? '#B45309' : '#64748B',
                        fontWeight: 700,
                      }}
                    >
                      ★ {s}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-inspect"
                  onClick={() => setShowFeedbackModal(false)}
                  disabled={fbSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-action-btn purple-gradient"
                  disabled={fbSubmitting}
                >
                  {fbSubmitting ? 'Saving...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   5. SKILL ASSESSMENTS VIEW
   ========================================================================= */
/* =========================================================================
   5. SKILL ASSESSMENTS VIEW (PHASE 9: CREATION, SUBMISSIONS & EVALUATIONS)
   ========================================================================= */
function AssessmentsView({
  students,
  notify,
  refreshData,
}: {
  students: any[];
  notify: (msg: string) => void;
  refreshData: () => void;
}) {
  const [activeSubTab, setActiveSubTab] = useState<'assignments' | 'diagnostics'>('assignments');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.student_id || '');
  const [studentDetail, setStudentDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [masteryFilter, setMasteryFilter] = useState('All');

  // Phase 9: Assessments List State
  const [mentorAssessments, setMentorAssessments] = useState<any[]>([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [assessmentFilter, setAssessmentFilter] = useState<'all' | 'active' | 'needs_grading'>('all');
  const [skillsList, setSkillsList] = useState<any[]>([]);

  // Create Assessment Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [newSkillId, setNewSkillId] = useState('S001');
  const [newTargetStudentId, setNewTargetStudentId] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newMaxScore, setNewMaxScore] = useState(100);
  const [criteria, setCriteria] = useState<{ criterion: string; weight: number; description: string }[]>([
    { criterion: 'Technical Architecture & Correctness', weight: 40, description: 'Correct logic and modular code design' },
    { criterion: 'Implementation & Code Quality', weight: 30, description: 'Clean conventions, readability, and error handling' },
    { criterion: 'Testing & Validation', weight: 30, description: 'Comprehensive test coverage and verification' },
  ]);
  const [creatingAssessment, setCreatingAssessment] = useState(false);

  // Submissions Modal State
  const [selectedAssessmentForSubs, setSelectedAssessmentForSubs] = useState<any | null>(null);
  const [submissionsList, setSubmissionsList] = useState<any[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);

  // Evaluation Modal State
  const [selectedSubmissionForEval, setSelectedSubmissionForEval] = useState<any | null>(null);
  const [evalScore, setEvalScore] = useState<number>(85);
  const [evalFeedback, setEvalFeedback] = useState<string>('');
  const [evalRubricScores, setEvalRubricScores] = useState<Record<string, number>>({});
  const [evalRelease, setEvalRelease] = useState<boolean>(true);
  const [evaluating, setEvaluating] = useState<boolean>(false);

  // Load Skills and Mentor Assessments
  const loadAssessments = async () => {
    setAssessmentsLoading(true);
    try {
      const data = await api.getMentorAssessments();
      setMentorAssessments(data || []);
    } catch {
      setMentorAssessments([]);
    } finally {
      setAssessmentsLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
    api.getSkills().then((res) => {
      if (res && res.length > 0) {
        setSkillsList(res);
        setNewSkillId(res[0].skill_id);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].student_id);
    }
  }, [students]);

  useEffect(() => {
    if (selectedStudentId) {
      setLoading(true);
      api.getMentorStudentDetail(selectedStudentId)
        .then((data) => setStudentDetail(data))
        .catch(() => setStudentDetail(null))
        .finally(() => setLoading(false));
    }
  }, [selectedStudentId]);

  // Handle Criteria Builder
  const handleAddCriterion = () => {
    setCriteria([...criteria, { criterion: '', weight: 25, description: '' }]);
  };

  const handleRemoveCriterion = (idx: number) => {
    if (criteria.length <= 1) return;
    setCriteria(criteria.filter((_, i) => i !== idx));
  };

  const handleCriterionChange = (idx: number, field: string, value: any) => {
    const updated = [...criteria];
    updated[idx] = { ...updated[idx], [field]: value };
    setCriteria(updated);
  };

  // Create Assessment Handler
  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      notify('Title and description are required.');
      return;
    }

    setCreatingAssessment(true);
    try {
      await api.createMentorAssessment({
        skill_id: newSkillId,
        title: newTitle.trim(),
        description: newDescription.trim(),
        instructions: newInstructions.trim() || undefined,
        criteria: criteria.filter((c) => c.criterion.trim() !== ''),
        deadline: newDeadline || undefined,
        max_score: Number(newMaxScore) || 100,
        student_id: newTargetStudentId || undefined,
      });

      notify('Skill assessment published and assigned to student(s)!');
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewInstructions('');
      setNewDeadline('');
      loadAssessments();
      refreshData();
    } catch (err: any) {
      notify(`Failed to create assessment: ${err.message}`);
    } finally {
      setCreatingAssessment(false);
    }
  };

  // Open Submissions Modal
  const handleOpenSubmissions = async (assessment: any) => {
    setSelectedAssessmentForSubs(assessment);
    setSubsLoading(true);
    try {
      const subs = await api.getAssessmentSubmissions(assessment.assessment_id);
      setSubmissionsList(subs || []);
    } catch (err: any) {
      notify(`Error loading submissions: ${err.message}`);
      setSubmissionsList([]);
    } finally {
      setSubsLoading(false);
    }
  };

  // Open Evaluation Modal
  const handleOpenEvaluation = (sub: any) => {
    setSelectedSubmissionForEval(sub);
    setEvalScore(sub.score !== null && sub.score !== undefined ? sub.score : 85);
    setEvalFeedback(sub.feedback || '');
    setEvalRelease(sub.is_released !== false);

    // Initialize rubric criteria scores if available
    const initialRubric: Record<string, number> = {};
    if (selectedAssessmentForSubs?.criteria) {
      selectedAssessmentForSubs.criteria.forEach((c: any) => {
        initialRubric[c.criterion] = sub.rubric_scores?.[c.criterion] || Math.round((sub.score || 85) * (c.weight || 25) / 100);
      });
    }
    setEvalRubricScores(initialRubric);
  };

  // Submit Evaluation Handler
  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmissionForEval) return;

    if (!evalFeedback.trim()) {
      notify('Constructive feedback is required.');
      return;
    }

    setEvaluating(true);
    try {
      await api.evaluateAssessmentSubmission(selectedSubmissionForEval.submission_id, {
        score: Number(evalScore),
        feedback: evalFeedback.trim(),
        rubric_scores: evalRubricScores,
        release: evalRelease,
      });

      notify('Assessment evaluated! Student skill evidence calibrated.');
      setSelectedSubmissionForEval(null);

      // Refresh submissions
      if (selectedAssessmentForSubs) {
        const updatedSubs = await api.getAssessmentSubmissions(selectedAssessmentForSubs.assessment_id);
        setSubmissionsList(updatedSubs || []);
      }
      loadAssessments();
      refreshData();
    } catch (err: any) {
      notify(`Failed to evaluate: ${err.message}`);
    } finally {
      setEvaluating(false);
    }
  };

  // Diagnostics calculations
  const skills: any[] = studentDetail?.skills || [];
  const filteredSkills = skills.filter((sk: any) => {
    if (masteryFilter === 'All') return true;
    return sk.mastery_level?.toLowerCase() === masteryFilter.toLowerCase();
  });

  const totalAssessed = skills.length;
  const avgScore = totalAssessed > 0
    ? Math.round(skills.reduce((acc, s) => acc + (s.assessment_score || 0), 0) / totalAssessed)
    : 82;
  const competentCount = skills.filter((s) => (s.assessment_score || 0) >= 75).length;
  const deficitCount = skills.filter((s) => (s.assessment_score || 0) < 75).length;

  // Filtered Mentor Assessments
  const filteredMentorAssessments = mentorAssessments.filter((a) => {
    if (assessmentFilter === 'active') return a.status === 'active';
    if (assessmentFilter === 'needs_grading') return (a.submissions_count - a.evaluated_count) > 0;
    return true;
  });

  const totalAssessmentsCount = mentorAssessments.length;
  const totalSubmissionsCount = mentorAssessments.reduce((acc, a) => acc + (a.submissions_count || 0), 0);
  const totalEvaluatedCount = mentorAssessments.reduce((acc, a) => acc + (a.evaluated_count || 0), 0);
  const pendingGradingCount = totalSubmissionsCount - totalEvaluatedCount;

  return (
    <div className="mentor-view-page">
      <div className="view-page-header">
        <div>
          <h2>Skill Assessments, Project Audits & Evaluations</h2>
          <p>Create proctored skill assessments, review mentee deliverables, and calibrate evidence weights</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="primary-action-btn purple-gradient"
            onClick={() => setShowCreateModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', fontSize: '0.85rem' }}
          >
            <Plus size={16} />
            <span>Create Skill Assessment</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs: Assignments vs Diagnostics */}
      <div className="mentor-subnav-tabs" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', marginBottom: '20px' }}>
        <button
          type="button"
          className={`filter-pill ${activeSubTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('assignments')}
          style={{ padding: '8px 16px', fontWeight: 600, fontSize: '0.86rem' }}
        >
          <ClipboardCheck size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Assigned Skill Assessments ({mentorAssessments.length})
        </button>
        <button
          type="button"
          className={`filter-pill ${activeSubTab === 'diagnostics' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('diagnostics')}
          style={{ padding: '8px 16px', fontWeight: 600, fontSize: '0.86rem' }}
        >
          <Activity size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Competency & Diagnostic Matrix
        </button>
      </div>

      {/* =========================================================================
          SUB-TAB 1: MENTOR ASSESSMENTS & SUBMISSION EVALUATION
          ========================================================================= */}
      {activeSubTab === 'assignments' && (
        <>
          {/* KPI Cards */}
          <div className="assessment-kpi-grid">
            <div className="assessment-kpi-card">
              <div className="kpi-icon purple"><ClipboardCheck size={22} /></div>
              <div className="kpi-info">
                <span className="kpi-value">{totalAssessmentsCount}</span>
                <span className="kpi-label">Assessments Created</span>
              </div>
            </div>

            <div className="assessment-kpi-card">
              <div className="kpi-icon blue"><FileCheck2 size={22} /></div>
              <div className="kpi-info">
                <span className="kpi-value">{totalSubmissionsCount}</span>
                <span className="kpi-label">Submissions Received</span>
              </div>
            </div>

            <div className="assessment-kpi-card">
              <div className="kpi-icon green"><CheckCircle2 size={22} /></div>
              <div className="kpi-info">
                <span className="kpi-value">{totalEvaluatedCount}</span>
                <span className="kpi-label">Evaluated & Calibrated</span>
              </div>
            </div>

            <div className="assessment-kpi-card">
              <div className="kpi-icon orange"><AlertCircle size={22} /></div>
              <div className="kpi-info">
                <span className="kpi-value">{pendingGradingCount}</span>
                <span className="kpi-label">Pending Evaluation</span>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="filter-row-controls" style={{ marginBottom: '16px' }}>
            <div className="filter-pills-row" style={{ margin: 0 }}>
              {[
                { label: 'All Assessments', val: 'all' },
                { label: 'Active', val: 'active' },
                { label: 'Pending Grading', val: 'needs_grading' },
              ].map((pill) => (
                <button
                  key={pill.val}
                  type="button"
                  className={`filter-pill ${assessmentFilter === pill.val ? 'active' : ''}`}
                  onClick={() => setAssessmentFilter(pill.val as any)}
                >
                  {pill.label}
                </button>
              ))}
            </div>
            <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
              Showing <b>{filteredMentorAssessments.length}</b> assessments
            </span>
          </div>

          {/* Assessments Grid */}
          {assessmentsLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
              Loading mentor assessments...
            </div>
          ) : filteredMentorAssessments.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
              {filteredMentorAssessments.map((a) => {
                const pending = (a.submissions_count || 0) - (a.evaluated_count || 0);
                return (
                  <div key={a.assessment_id} className="card" style={{ padding: '20px', borderRadius: '14px', background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <span className="mastery-pill intermediate" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                        {a.skill_name || a.skill_id}
                      </span>
                      <span className={`status-pill ${a.status === 'active' ? 'completed' : 'upcoming'}`} style={{ fontSize: '0.75rem' }}>
                        {a.status}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                      {a.title}
                    </h3>
                    <p style={{ fontSize: '0.84rem', color: '#64748B', lineHeight: 1.5, marginBottom: '14px' }}>
                      {a.description}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.8rem', color: '#475569', marginBottom: '14px' }}>
                      <span style={{ background: '#F8FAFC', padding: '4px 8px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                        🎯 Target: <b>{a.student_name}</b>
                      </span>
                      {a.deadline && (
                        <span style={{ background: '#F8FAFC', padding: '4px 8px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                          📅 Due: <b>{a.deadline}</b>
                        </span>
                      )}
                      <span style={{ background: '#F8FAFC', padding: '4px 8px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                        ⭐ Max: <b>{a.max_score} pts</b>
                      </span>
                      <span style={{ background: '#F8FAFC', padding: '4px 8px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                        📋 {a.criteria?.length || 0} Criteria
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
                      <div style={{ fontSize: '0.82rem' }}>
                        <b>{a.submissions_count || 0}</b> Submissions
                        {pending > 0 ? (
                          <span style={{ marginLeft: '6px', color: '#F59E0B', fontWeight: 600 }}>({pending} need grading)</span>
                        ) : (
                          <span style={{ marginLeft: '6px', color: '#10B981', fontWeight: 600 }}>(All graded)</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-review-action"
                        onClick={() => handleOpenSubmissions(a)}
                        style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                      >
                        Submissions & Evaluation
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state-box" style={{ padding: '4rem 1rem', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <ClipboardCheck size={36} style={{ color: '#94A3B8', marginBottom: '8px' }} />
              <b style={{ color: '#1E293B', fontSize: '1rem' }}>No assessments created yet</b>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748B', maxWidth: '400px' }}>
                Create a custom assessment with rubric evaluation criteria to test your assigned students' mastery.
              </p>
              <button
                type="button"
                className="primary-action-btn purple-gradient"
                onClick={() => setShowCreateModal(true)}
                style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} />
                <span>Create First Assessment</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* =========================================================================
          SUB-TAB 2: COMPETENCY & DIAGNOSTIC MATRIX
          ========================================================================= */}
      {activeSubTab === 'diagnostics' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div className="filter-pills-row" style={{ margin: 0 }}>
              {['All', 'Expert', 'Advanced', 'Intermediate', 'Beginner'].map((level) => (
                <button
                  key={level}
                  type="button"
                  className={`filter-pill ${masteryFilter === level ? 'active' : ''}`}
                  onClick={() => setMasteryFilter(level)}
                >
                  {level}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>Mentee:</span>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="select-student-dropdown"
              >
                {students.map((st) => (
                  <option key={st.student_id} value={st.student_id}>
                    {st.name}{st.email ? ` (${st.email})` : ''} — {st.target_career_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="students-table-card">
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                Loading student competency diagnostics...
              </div>
            ) : (
              <table className="mentor-data-table">
                <thead>
                  <tr>
                    <th>Technical Competency</th>
                    <th>Proctored Score</th>
                    <th>Self vs Assessment</th>
                    <th>Calibrated Mastery</th>
                    <th>Evidence Weighting</th>
                    <th>Benchmark Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSkills.length > 0 ? (
                    filteredSkills.map((sk: any) => {
                      const isCompetent = (sk.assessment_score || 0) >= 75;
                      return (
                        <tr key={sk.skill_id}>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <b>{sk.skill_name}</b>
                              <small style={{ color: '#64748B' }}>ID: {sk.skill_id}</small>
                            </div>
                          </td>
                          <td>
                            <div className="readiness-cell">
                              <b>{sk.assessment_score || 0}%</b>
                              <div className="mini-progress-bar">
                                <div
                                  className="mini-bar-fill"
                                  style={{
                                    width: `${sk.assessment_score || 0}%`,
                                    backgroundColor: isCompetent ? '#10B981' : '#F59E0B',
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.82rem', color: '#475569' }}>
                              Self: {sk.self_declared_score || 0}% → Test: {sk.assessment_score || 0}%
                            </span>
                          </td>
                          <td>
                            <span className={`mastery-pill ${sk.mastery_level?.toLowerCase() || 'beginner'}`}>
                              {sk.final_mastery || 0}% • {sk.mastery_level || 'Beginner'}
                            </span>
                          </td>
                          <td>
                            <div className="sources-chips" style={{ margin: 0 }}>
                              <span title="Assessment Weight: 30%">Assess: {sk.assessment_score || 0}%</span>
                              <span title="Project Weight: 30%">Proj: {sk.project_score || 0}%</span>
                              <span title="Mentor Weight: 20%">Mentor: {sk.mentor_score || 0}%</span>
                            </div>
                          </td>
                          <td>
                            <span className={`status-pill ${isCompetent ? 'completed' : 'upcoming'}`}>
                              {isCompetent ? 'Verified Competent' : 'Focus Required'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ padding: '3rem 1rem' }}>
                        <div className="empty-state-box">
                          <ClipboardCheck size={32} style={{ color: '#94A3B8' }} />
                          <b>No skill assessment diagnostics found</b>
                          <p style={{ margin: 0, fontSize: '0.82rem' }}>
                            Select another student or adjust the mastery filter.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* =========================================================================
          MODAL 1: CREATE SKILL ASSESSMENT
          ========================================================================= */}
      {showCreateModal && (
        <div className="mentor-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="mentor-modal-card large" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>Create Skill Assessment & Rubric</h3>
              <button type="button" className="close-modal-btn" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateAssessment} className="auth-form" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label>Target Competency / Skill *</label>
                  <select
                    value={newSkillId}
                    onChange={(e) => setNewSkillId(e.target.value)}
                    required
                  >
                    {skillsList.map((sk) => (
                      <option key={sk.skill_id} value={sk.skill_id}>
                        {sk.skill_name} ({sk.category || 'Core Skill'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Target Mentee *</label>
                  <select
                    value={newTargetStudentId}
                    onChange={(e) => setNewTargetStudentId(e.target.value)}
                  >
                    <option value="">All Assigned Mentees</option>
                    {students.map((st) => (
                      <option key={st.student_id} value={st.student_id}>
                        {st.name}{st.email ? ` (${st.email})` : ''} — {st.target_career_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Assessment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. End-to-End Scikit-Learn Pipeline Implementation"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Overview & Goal Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the objective, problem statement, and expected student deliverable..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Submission Instructions / Guidelines (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Push code to GitHub with unit tests, README.md, and include link or written solution."
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label>Submission Deadline (Optional)</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Max Score (Points)</label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={newMaxScore}
                    onChange={(e) => setNewMaxScore(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Rubric Criteria Builder */}
              <div className="form-group" style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ margin: 0, fontWeight: 700 }}>Evaluation Rubric / Criteria</label>
                  <button
                    type="button"
                    onClick={handleAddCriterion}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary, #315DA8)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={14} /> Add Criterion
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {criteria.map((c, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <input
                        type="text"
                        placeholder="Criterion title (e.g. Code Modularity)"
                        value={c.criterion}
                        onChange={(e) => handleCriterionChange(idx, 'criterion', e.target.value)}
                        required
                        style={{ flex: 2, padding: '6px 10px', fontSize: '0.82rem' }}
                      />
                      <input
                        type="number"
                        placeholder="Weight %"
                        value={c.weight}
                        onChange={(e) => handleCriterionChange(idx, 'weight', Number(e.target.value))}
                        style={{ width: '80px', padding: '6px 8px', fontSize: '0.82rem' }}
                      />
                      <input
                        type="text"
                        placeholder="Evaluation standard description"
                        value={c.description}
                        onChange={(e) => handleCriterionChange(idx, 'description', e.target.value)}
                        style={{ flex: 3, padding: '6px 10px', fontSize: '0.82rem' }}
                      />
                      {criteria.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCriterion(idx)}
                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={creatingAssessment}
                className="primary-action-btn full purple-gradient"
                style={{ marginTop: '18px' }}
              >
                {creatingAssessment ? 'Publishing Assessment...' : 'Publish Assessment & Notify Mentees'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: SUBMISSIONS LIST MODAL
          ========================================================================= */}
      {selectedAssessmentForSubs && (
        <div className="mentor-modal-overlay" onClick={() => setSelectedAssessmentForSubs(null)}>
          <div className="mentor-modal-card large" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>
                  Submissions: {selectedAssessmentForSubs.title}
                </h3>
                <small style={{ color: '#64748B' }}>
                  Skill: {selectedAssessmentForSubs.skill_name} • Max Score: {selectedAssessmentForSubs.max_score} pts
                </small>
              </div>
              <button type="button" className="close-modal-btn" onClick={() => setSelectedAssessmentForSubs(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {subsLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                  Loading student submissions...
                </div>
              ) : submissionsList.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {submissionsList.map((sub) => {
                    const isEvaluated = sub.status === 'evaluated';
                    return (
                      <div key={sub.submission_id} style={{ padding: '16px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <b style={{ color: '#0F172A', fontSize: '0.95rem', fontWeight: 600, display: 'block' }}>{sub.student_name}</b>
                            {sub.student_email && (
                              <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '3px', overflowWrap: 'anywhere' }}>
                                {sub.student_email}
                              </div>
                            )}
                            <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                              Submitted on {sub.submitted_at}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={`status-pill ${isEvaluated ? 'completed' : 'upcoming'}`}>
                              {isEvaluated ? `Evaluated (${sub.score}/${selectedAssessmentForSubs.max_score})` : 'Pending Review'}
                            </span>
                            <button
                              type="button"
                              className="btn-review-action"
                              onClick={() => handleOpenEvaluation(sub)}
                              style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                            >
                              {isEvaluated ? 'Update Evaluation' : 'Evaluate Work'}
                            </button>
                          </div>
                        </div>

                        {sub.submission_text && (
                          <div style={{ fontSize: '0.85rem', color: '#334155', background: '#FFFFFF', padding: '10px', borderRadius: '6px', border: '1px solid #E2E8F0', marginBottom: '8px' }}>
                            <b>Student Notes:</b> {sub.submission_text}
                          </div>
                        )}

                        {sub.attachment_url && (
                          <div style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary, #315DA8)' }}>
                            <ExternalLink size={14} />
                            <a href={sub.attachment_url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary, #315DA8)', textDecoration: 'underline' }}>
                              View Project Deliverable / Repository ({sub.attachment_url})
                            </a>
                          </div>
                        )}

                        {isEvaluated && sub.feedback && (
                          <div style={{ marginTop: '10px', padding: '10px', background: '#ECFDF5', borderRadius: '6px', border: '1px solid #A7F3D0', fontSize: '0.82rem' }}>
                            <b style={{ color: '#065F46' }}>Mentor Feedback:</b>
                            <p style={{ margin: '4px 0 0', color: '#047857' }}>{sub.feedback}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748B' }}>
                  <FileCheck2 size={32} style={{ color: '#94A3B8', marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>No student submissions received for this assessment yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: EVALUATION & SCORING MODAL
          ========================================================================= */}
      {selectedSubmissionForEval && (
        <div className="mentor-modal-overlay" onClick={() => setSelectedSubmissionForEval(null)}>
          <div className="mentor-modal-card large" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>
                  Evaluate Submission: {selectedSubmissionForEval.student_name}
                </h3>
                <small style={{ color: '#64748B' }}>
                  Assessment: {selectedAssessmentForSubs?.title}
                </small>
              </div>
              <button type="button" className="close-modal-btn" onClick={() => setSelectedSubmissionForEval(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitEvaluation} className="auth-form" style={{ padding: '1.5rem' }}>
              <div className="form-group">
                <label>Overall Score (0 to {selectedAssessmentForSubs?.max_score || 100}) *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="number"
                    min={0}
                    max={selectedAssessmentForSubs?.max_score || 100}
                    required
                    value={evalScore}
                    onChange={(e) => setEvalScore(Number(e.target.value))}
                    style={{ width: '120px', fontSize: '1.1rem', fontWeight: 700 }}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                    / {selectedAssessmentForSubs?.max_score || 100} pts (
                    {Math.round((evalScore / (selectedAssessmentForSubs?.max_score || 100)) * 100)}% Mastery)
                  </span>
                </div>
              </div>

              {/* Rubric Breakdown inputs if criteria exist */}
              {selectedAssessmentForSubs?.criteria && selectedAssessmentForSubs.criteria.length > 0 && (
                <div className="form-group" style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px', display: 'block' }}>
                    Rubric Criteria Evaluation Breakdown
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedAssessmentForSubs.criteria.map((c: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1, paddingRight: '12px' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>{c.criterion}</span>
                          {c.description && <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{c.description}</div>}
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="Score"
                          value={evalRubricScores[c.criterion] ?? ''}
                          onChange={(e) => setEvalRubricScores({ ...evalRubricScores, [c.criterion]: Number(e.target.value) })}
                          style={{ width: '80px', padding: '4px 8px', fontSize: '0.82rem' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Constructive Mentor Feedback *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide specific feedback on architecture, code quality, edge cases, and strengths..."
                  value={evalFeedback}
                  onChange={(e) => setEvalFeedback(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="releaseToggle"
                  checked={evalRelease}
                  onChange={(e) => setEvalRelease(e.target.checked)}
                />
                <label htmlFor="releaseToggle" style={{ margin: 0, fontSize: '0.85rem', cursor: 'pointer' }}>
                  Release Score & Feedback to Student Immediately
                </label>
              </div>

              <button
                type="submit"
                disabled={evaluating}
                className="primary-action-btn full purple-gradient"
                style={{ marginTop: '12px' }}
              >
                {evaluating ? 'Calibrating Mastery...' : 'Save Evaluation & Calibrate Student Evidence'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   6. PROJECT REVIEWS VIEW (RUBRIC-BASED EVALUATION)
   ========================================================================= */
function ProjectReviewsView({
  reviews,
  students,
  notify,
  refreshData,
}: {
  reviews: any[];
  students: any[];
  notify: (msg: string) => void;
  refreshData: () => void;
}) {
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [skillsList, setSkillsList] = useState<any[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string>('S001');
  const [rating, setRating] = useState(5);
  const [strengths, setStrengths] = useState('');
  const [improvement, setImprovement] = useState('');
  const [comments, setComments] = useState('');

  useEffect(() => {
    api.getSkills()
      .then((data) => {
        if (data && data.length > 0) {
          setSkillsList(data);
          setSelectedSkillId(data[0].skill_id);
        }
      })
      .catch(() => []);
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;

    try {
      await api.submitProjectReview({
        student_id: selectedReview.student_id,
        project_id: selectedReview.project_id,
        skill_id: selectedSkillId,
        rating,
        strengths: strengths || 'Clean architectural design and solid implementation.',
        improvement_areas: improvement || 'Add end-to-end integration test coverage.',
        comments: comments || 'Project meets industry production standards.',
        recommended_action: 'Advance to deployment milestone.',
      });

      notify('Project review saved! Student skill evidence recalibrated.');
      setSelectedReview(null);
      refreshData();
    } catch (err: any) {
      notify(`Failed to save review: ${err.message}`);
    }
  };

  return (
    <div className="mentor-view-page">
      <div className="view-page-header">
        <div>
          <h2>Project Reviews & Code Audits</h2>
          <p>Evaluate student GitHub repositories and calibrate practical evidence weights</p>
        </div>
      </div>

      <div className="project-reviews-grid">
        {reviews.length > 0 ? (
          reviews.map((p) => (
            <div key={`${p.student_id}-${p.project_id}`} className="project-review-card">
              <div className="p-header">
                <div>
                  <span className="p-student-name" style={{ display: 'block', fontWeight: 600, color: '#0F172A' }}>{p.student_name}</span>
                  {(p.student_email || students.find((s) => s.student_id === p.student_id)?.email) && (
                    <span className="p-student-email" style={{ display: 'block', fontSize: '0.78rem', color: '#64748B', marginTop: '2px', overflowWrap: 'anywhere' }}>
                      {p.student_email || students.find((s) => s.student_id === p.student_id)?.email}
                    </span>
                  )}
                  <h3 className="p-title" style={{ marginTop: '4px' }}>{p.project_name}</h3>
                </div>
                <span className={`p-status-tag ${p.has_review ? 'reviewed' : 'pending'}`}>
                  {p.has_review ? 'Reviewed' : 'Review Needed'}
                </span>
              </div>

              <div className="p-meta">
                <span>Difficulty: <b>{p.difficulty}</b></span>
                <span>Completion: <b>{p.progress_percentage}%</b></span>
              </div>

              <div className="p-repo-link">
                <ExternalLink size={14} />
                <a href={p.github_url} target="_blank" rel="noreferrer">
                  Inspect GitHub Repository
                </a>
              </div>

              {p.has_review && p.review && (
                <div className="existing-review-box">
                  <div className="rev-stars">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < p.review.rating ? '#F59E0B' : 'none'}
                        color={i < p.review.rating ? '#F59E0B' : '#94A3B8'}
                      />
                    ))}
                    <span>{p.review.rating}/5</span>
                  </div>
                  <p>{p.review.comments}</p>
                </div>
              )}

              <button
                type="button"
                className="btn-review-action"
                onClick={() => {
                  setSelectedReview(p);
                  setRating(p.review?.rating || 5);
                  setStrengths(p.review?.strengths || '');
                  setImprovement(p.review?.improvement_areas || '');
                  setComments(p.review?.comments || '');
                }}
              >
                {p.has_review ? 'Update Rubric Evaluation' : 'Evaluate & Calibrate Evidence'}
              </button>
            </div>
          ))
        ) : (
          <div className="empty-panel-state full-width" style={{ padding: '3rem 1rem' }}>
            <FolderKanban size={36} style={{ color: '#94A3B8', marginBottom: '8px' }} />
            <b style={{ color: '#1E293B' }}>No student projects awaiting review</b>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
              Student project submissions will appear here once submitted in the learning roadmap.
            </p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedReview && (
        <div className="mentor-modal-overlay" onClick={() => setSelectedReview(null)}>
          <div className="mentor-modal-card large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                Rubric Review: {selectedReview.project_name} ({selectedReview.student_name})
              </h3>
              <button type="button" className="close-modal-btn" onClick={() => setSelectedReview(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmitReview} className="auth-form" style={{ padding: '1.5rem' }}>
              <div className="form-group">
                <label>Overall Rubric Score (1 to 5 Stars)</label>
                <div className="stars-input-row">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      type="button"
                      key={starVal}
                      className="star-btn"
                      onClick={() => setRating(starVal)}
                    >
                      <Star
                        size={28}
                        fill={starVal <= rating ? '#F59E0B' : 'none'}
                        color={starVal <= rating ? '#F59E0B' : '#94A3B8'}
                      />
                    </button>
                  ))}
                  <span className="rating-desc-text">
                    {rating === 5 ? '5/5 - Exceptional Production Quality' : `${rating}/5`}
                  </span>
                </div>
              </div>

              {/* Target Skill Selection */}
              <div className="form-group">
                <label>Target Competency to Calibrate</label>
                <select
                  value={selectedSkillId}
                  onChange={(e) => setSelectedSkillId(e.target.value)}
                  required
                >
                  {skillsList.length > 0 ? (
                    skillsList.map((sk) => (
                      <option key={sk.skill_id} value={sk.skill_id}>
                        {sk.skill_name} ({sk.category || 'Core Skill'})
                      </option>
                    ))
                  ) : (
                    <option value="S001">Python Programming (Core)</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Demonstrated Strengths</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Robust pipeline modularity, clear abstractions"
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Areas for Improvement / Next Actions</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Add integration tests, cross-validation, and MLflow logging"
                  value={improvement}
                  onChange={(e) => setImprovement(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Detailed Mentor Comments</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Constructive feedback to guide student's mastery development..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>

              <button type="submit" className="primary-action-btn full purple-gradient">
                Save Review & Recalibrate Skill Evidence
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   7. CAREER GUIDANCE VIEW (PHASE 10 COMPLETE WORKSPACE)
   ========================================================================= */
function CareerGuidanceView({ students, notify }: { students: any[]; notify: (msg: string) => void }) {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.student_id || 'U001');
  const [guidanceData, setGuidanceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [recommendedSkills, setRecommendedSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [recommendedCourses, setRecommendedCourses] = useState('');
  const [recommendedProjects, setRecommendedProjects] = useState('');
  const [prepActivities, setPrepActivities] = useState('');
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [actionInput, setActionInput] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedStudentId) {
      setLoading(true);
      api.getMentorCareerGuidance(selectedStudentId)
        .then((data) => {
          setGuidanceData(data);
          setLoading(false);
        })
        .catch(() => {
          setGuidanceData(null);
          setLoading(false);
        });
    }
  }, [selectedStudentId]);

  const handleAddSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (!trimmed) return;
    if (!recommendedSkills.includes(trimmed)) {
      setRecommendedSkills([...recommendedSkills, trimmed]);
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setRecommendedSkills(recommendedSkills.filter((s) => s !== skillToRemove));
  };

  const handleAddAction = () => {
    const trimmed = actionInput.trim();
    if (!trimmed) return;
    setActionItems([...actionItems, trimmed]);
    setActionInput('');
  };

  const handleRemoveAction = (idx: number) => {
    setActionItems(actionItems.filter((_, i) => i !== idx));
  };

  const handleSaveGuidance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      notify('Please provide career advice or guidance notes.');
      return;
    }
    setSaving(true);
    try {
      await api.saveMentorCareerGuidance(selectedStudentId, {
        notes: notes.trim(),
        recommended_skills: recommendedSkills,
        recommended_courses: recommendedCourses ? recommendedCourses.split(',').map((c) => c.trim()).filter(Boolean) : [],
        recommended_projects: recommendedProjects ? recommendedProjects.split(',').map((p) => p.trim()).filter(Boolean) : [],
        preparation_activities: prepActivities ? prepActivities.split(',').map((a) => a.trim()).filter(Boolean) : [],
        action_items: actionItems,
        private_notes: privateNotes.trim() || undefined,
        follow_up_date: followUpDate || undefined,
      } as any);

      notify('Career guidance and action items saved to student roadmap!');
      setNotes('');
      setRecommendedSkills([]);
      setRecommendedCourses('');
      setRecommendedProjects('');
      setPrepActivities('');
      setActionItems([]);
      setPrivateNotes('');
      setFollowUpDate('');

      const updated = await api.getMentorCareerGuidance(selectedStudentId);
      setGuidanceData(updated);
    } catch (err: any) {
      notify(`Failed to save guidance: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mentor-view-page">
      <div className="view-page-header">
        <div>
          <h2>Career Guidance Workspace</h2>
          <p>Deliver tailored industry mentorship, prescribe skill gap remedies, and assign follow-up action items</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>Assigned Mentee:</label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="select-student-dropdown"
          >
            {students.map((st) => (
              <option key={st.student_id} value={st.student_id}>
                {st.name}{st.email ? ` (${st.email})` : ''} — {st.target_career_name || 'Mentee'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--color-primary, #315DA8)' }} />
          <b>Loading student career guidance data...</b>
        </div>
      ) : guidanceData ? (
        <div className="guidance-two-col">
          {/* Left Column: Student Career Goals & Skill Gaps */}
          <div className="guidance-gaps-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary, #315DA8)', letterSpacing: '0.05em' }}>
                  Target Career Goal
                </span>
                <h3 style={{ margin: '4px 0 6px', fontSize: '1.25rem', color: 'var(--color-text-primary, #15213B)', fontWeight: 800 }}>
                  {guidanceData.target_career_name}
                </h3>
                <p className="career-desc" style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
                  {guidanceData.career_description || 'Personalized career pathway under active mentor evaluation.'}
                </p>
              </div>
            </div>

            {/* Core Competency Gaps */}
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#1E293B' }}>
                  Core Competency Gaps ({guidanceData.skill_gaps?.filter((g: any) => g.gap_size > 0).length || 0} Deficits)
                </h4>
                <small style={{ color: '#64748B', fontSize: '0.75rem' }}>Click (+ Recommend) to prescribe</small>
              </div>

              <div className="gaps-list" style={{ maxHeight: '340px', overflowY: 'auto' }}>
                {guidanceData.skill_gaps?.map((gap: any) => (
                  <div key={gap.skill_id} className="gap-row-item" style={{ alignItems: 'center' }}>
                    <div className="gap-name" style={{ flex: 1 }}>
                      <b>{gap.skill_name}</b>
                      <small>Required: {gap.required_level} • Target: {gap.target_score}%</small>
                    </div>
                    <div className="gap-bar" style={{ width: '90px' }}>
                      <div className="bar-track">
                        <div
                          className="bar-val"
                          style={{
                            width: `${gap.current_mastery}%`,
                            background: gap.gap_size > 0 ? '#F59E0B' : '#10B981',
                          }}
                        />
                      </div>
                      <small style={{ fontSize: '0.7rem', color: '#64748B', textAlign: 'center', display: 'block' }}>
                        {gap.current_mastery}%
                      </small>
                    </div>
                    <span className={`gap-tag ${gap.gap_size > 0 ? 'deficit' : 'met'}`}>
                      {gap.gap_size > 0 ? `-${gap.gap_size}%` : 'Met'}
                    </span>
                    {gap.gap_size > 0 && (
                      <button
                        type="button"
                        onClick={() => handleAddSkill(gap.skill_name)}
                        className="btn-tiny-recommend"
                        style={{
                          fontSize: '0.72rem',
                          background: '#EDF3FF',
                          color: 'var(--color-primary-hover, #4938E8)',
                          border: '1px solid #C8D6EA',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                        title="Add to recommended skills form"
                      >
                        + Recommend
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Roadmap Steps Overview */}
            {guidanceData.roadmap_steps && guidanceData.roadmap_steps.length > 0 && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#1E293B', marginBottom: '8px' }}>
                  Roadmap Progression Milestones
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                  {guidanceData.roadmap_steps.map((rs: any) => (
                    <div
                      key={rs.step_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: '#F8FAFC',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                      }}
                    >
                      <span>
                        <b>Step {rs.step_number}:</b> {rs.milestone_name} ({rs.skill_name})
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontWeight: 600,
                          background: rs.is_completed ? '#DCFCE7' : '#FEF3C7',
                          color: rs.is_completed ? '#166534' : '#92400E',
                        }}
                      >
                        {rs.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Guidance Input Form & History */}
          <div className="guidance-notes-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary, #15213B)', marginBottom: '1rem' }}>
              Prescribe Guidance & Action Items
            </h3>
            <form onSubmit={handleSaveGuidance} className="auth-form">
              {/* Career Advice Notes */}
              <div className="form-group">
                <label>Career Advice & Strategic Guidance *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Recommend learning strategies, prioritize key milestones, and address skill bottlenecks..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Recommended Skills */}
              <div className="form-group">
                <label>Recommended Skills to Learn</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                  <input
                    type="text"
                    placeholder="e.g. PyTorch, CUDA, Distributed Systems"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill(skillInput);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSkill(skillInput)}
                    className="btn-inspect"
                    style={{ padding: '0 14px', whiteSpace: 'nowrap' }}
                  >
                    Add
                  </button>
                </div>
                {recommendedSkills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {recommendedSkills.map((sk) => (
                      <span
                        key={sk}
                        style={{
                          background: '#EDF3FF',
                          color: 'var(--color-primary-hover, #4938E8)',
                          border: '1px solid #C8D6EA',
                          borderRadius: '16px',
                          padding: '3px 10px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {sk}
                        <X
                          size={12}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleRemoveSkill(sk)}
                        />
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Practical Projects & Courses */}
              <div className="form-row-2">
                <div className="form-group">
                  <label>Suggested Projects / Practical Exercises</label>
                  <input
                    type="text"
                    placeholder="e.g. Implement Transformer from scratch"
                    value={recommendedProjects}
                    onChange={(e) => setRecommendedProjects(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Recommended Preparation Activities</label>
                  <input
                    type="text"
                    placeholder="e.g. Read Attention Is All You Need paper"
                    value={prepActivities}
                    onChange={(e) => setPrepActivities(e.target.value)}
                  />
                </div>
              </div>

              {/* Action Items List */}
              <div className="form-group">
                <label>Follow-up Action Items</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                  <input
                    type="text"
                    placeholder="e.g. Complete DDP benchmark script by next Wednesday"
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAction();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddAction}
                    className="btn-inspect"
                    style={{ padding: '0 14px', whiteSpace: 'nowrap' }}
                  >
                    Add
                  </button>
                </div>
                {actionItems.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                    {actionItems.map((act, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 10px',
                          background: '#F1F5F9',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                        }}
                      >
                        <span>• {act}</span>
                        <Trash2
                          size={14}
                          style={{ color: '#EF4444', cursor: 'pointer' }}
                          onClick={() => handleRemoveAction(i)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Follow-up Date & Private Notes */}
              <div className="form-row-2">
                <div className="form-group">
                  <label>Target Follow-up Date</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#EF4444' }}>🔒</span> Private Mentor Notes
                    <small style={{ color: '#94A3B8', fontWeight: 400 }}>(Not visible to student)</small>
                  </label>
                  <input
                    type="text"
                    placeholder="Private observations for your own tracking..."
                    value={privateNotes}
                    onChange={(e) => setPrivateNotes(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="primary-action-btn full purple-gradient"
                style={{ marginTop: '0.5rem' }}
              >
                {saving ? 'Saving Guidance...' : 'Publish Career Guidance to Mentee'}
              </button>
            </form>

            {/* Saved Guidance History */}
            <div className="saved-notes-feed" style={{ marginTop: '1.5rem', maxHeight: '350px', overflowY: 'auto' }}>
              <h4 style={{ fontSize: '0.9rem', color: '#1E293B', marginBottom: '10px' }}>
                Previous Guidance History ({guidanceData.guidance_notes?.length || 0})
              </h4>
              {guidanceData.guidance_notes?.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: '#94A3B8', fontStyle: 'italic' }}>
                  No previous career guidance recorded for this mentee yet.
                </p>
              ) : (
                guidanceData.guidance_notes?.map((n: any) => (
                  <div key={n.id} className="saved-note-box" style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '8px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <small style={{ color: '#64748B', fontWeight: 600 }}>{n.created_at}</small>
                      {n.follow_up_date && (
                        <small style={{ color: 'var(--color-primary, #315DA8)', fontWeight: 600 }}>
                          Follow-up: {n.follow_up_date}
                        </small>
                      )}
                    </div>
                    <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#1E293B' }}>{n.notes}</p>

                    {n.recommended_skills && n.recommended_skills.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                        {n.recommended_skills.map((s: string) => (
                          <span
                            key={s}
                            style={{
                              background: '#EDF3FF',
                              color: 'var(--color-primary-hover, #4938E8)',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                            }}
                          >
                            Skill: {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {n.recommended_projects && n.recommended_projects.length > 0 && (
                      <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '4px' }}>
                        <b>Project:</b> {n.recommended_projects.join(', ')}
                      </div>
                    )}

                    {n.action_items && n.action_items.length > 0 && (
                      <div style={{ marginTop: '6px' }}>
                        {n.action_items.map((act: string, ai: number) => (
                          <div key={ai} className="action-item-badge" style={{ marginBottom: '3px' }}>
                            Action: {act}
                          </div>
                        ))}
                      </div>
                    )}

                    {n.private_notes && (
                      <div style={{ marginTop: '8px', padding: '6px 10px', background: '#FEF2F2', border: '1px dashed #FCA5A5', borderRadius: '6px', fontSize: '0.75rem', color: '#991B1B' }}>
                        🔒 <b>Private Note:</b> {n.private_notes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
          Select an assigned mentee above to open the career guidance workspace.
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   8. MESSAGES VIEW
   ========================================================================= */
function MessagesView({
  conversations,
  students,
  notify,
  navigate,
  refreshData,
}: {
  conversations: any[];
  students: any[];
  notify: (msg: string) => void;
  navigate?: (path: string) => void;
  refreshData: () => void;
}) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const queryStudentId = searchParams.get('studentId') || searchParams.get('student_id');

  // Build unified conversation list including assigned students without prior chats
  const conversationStudentIds = new Set(conversations.map((c) => c.student_id));
  const studentStubs = (students || [])
    .filter((st) => !conversationStudentIds.has(st.student_id))
    .map((st) => ({
      student_id: st.student_id,
      student_name: st.name || `${st.first_name || ''} ${st.last_name || ''}`.trim() || 'Student',
      career_name: st.target_career_name || 'Learning Path',
      latest_message: 'No messages yet — click to chat',
      latest_time: '',
      unread_count: 0,
    }));

  const allConversations = [...conversations, ...studentStubs];

  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    return queryStudentId || allConversations[0]?.student_id || students[0]?.student_id || '';
  });

  const [convSearch, setConvSearch] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync selectedStudentId when URL parameter changes or conversations load
  useEffect(() => {
    if (queryStudentId && queryStudentId !== selectedStudentId) {
      setSelectedStudentId(queryStudentId);
    } else if (!selectedStudentId && allConversations.length > 0) {
      setSelectedStudentId(allConversations[0].student_id);
    }
  }, [queryStudentId, allConversations.length]);

  const loadConversation = async (sid: string, silent = false) => {
    if (!sid) return;
    if (!silent) setLoadingThread(true);
    try {
      const msgs = await api.getMentorConversations(sid);
      setMessages(Array.isArray(msgs) ? msgs : []);
      if (!silent) {
        api.markMentorThreadRead(sid).catch(() => {});
      }
    } catch (err: any) {
      if (!silent) console.warn('Failed loading messages:', err);
    } finally {
      if (!silent) setLoadingThread(false);
    }
  };

  useEffect(() => {
    if (selectedStudentId) {
      loadConversation(selectedStudentId);
    }
  }, [selectedStudentId]);

  // Periodic polling for incoming mentee messages
  useEffect(() => {
    if (!selectedStudentId) return;
    const timer = setInterval(() => {
      loadConversation(selectedStudentId, true);
    }, 5000);
    return () => clearInterval(timer);
  }, [selectedStudentId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = messageText.trim();
    if (!content) {
      notify('Message content cannot be empty.');
      return;
    }
    if (!selectedStudentId) {
      notify('Please select a student conversation.');
      return;
    }

    setSending(true);
    try {
      // Optimistic temporary message
      const tempMsg = {
        message_id: `temp-${Date.now()}`,
        sender_role: 'mentor',
        content,
        created_at: 'Just now',
        is_read: false,
      };
      setMessages((prev) => [...prev, tempMsg]);
      setMessageText('');

      await api.sendMentorMessage({
        student_id: selectedStudentId,
        content: content,
      });

      await loadConversation(selectedStudentId, true);
      refreshData();
    } catch (err: any) {
      notify(`Failed to send message: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = allConversations.filter((c) =>
    (c.student_name || '').toLowerCase().includes(convSearch.toLowerCase()) ||
    (c.career_name || '').toLowerCase().includes(convSearch.toLowerCase())
  );

  const activeStudent =
    allConversations.find((c) => c.student_id === selectedStudentId) ||
    students.find((s) => s.student_id === selectedStudentId);

  const activeStudentName = activeStudent?.student_name || activeStudent?.name || 'Select a Mentee';
  const activeStudentCareer = activeStudent?.career_name || activeStudent?.target_career_name || '';

  return (
    <div className="mentor-view-page">
      <div className="view-page-header">
        <div>
          <h2>Mentee Messages & Direct Guidance</h2>
          <p>Real-time two-way communication channels with your active student cohort</p>
        </div>
      </div>

      {allConversations.length === 0 ? (
        <div className="empty-state-box" style={{ padding: '3.5rem 1rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
          <MessageSquareText size={42} style={{ color: '#94A3B8', margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-primary, #15213B)', marginBottom: '8px' }}>No Active Mentee Connections</h3>
          <p style={{ color: '#64748B', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 16px' }}>
            You do not have any connected students yet. Once you accept a student's mentorship request, direct messaging will be available here.
          </p>
          {navigate && (
            <button
              type="button"
              className="primary-action-btn purple-gradient"
              onClick={() => navigate('/mentor/students')}
            >
              <Users size={16} /> Review Incoming Mentorship Requests
            </button>
          )}
        </div>
      ) : (
        <div className="messaging-layout-card">
          {/* Left: Conversations List */}
          <div className="conversations-sidebar">
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #E2E8F0', background: '#FFFFFF' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search mentees..."
                  value={convSearch}
                  onChange={(e) => setConvSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px 8px 30px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.82rem',
                    background: '#F8FAFC',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {filteredConversations.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8', fontSize: '0.82rem' }}>
                No mentees match "{convSearch}"
              </div>
            ) : (
              filteredConversations.map((c) => {
                const initials = (c.student_name || 'ST')
                  .split(' ')
                  .filter(Boolean)
                  .map((w: string) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();
                const isSelected = selectedStudentId === c.student_id;
                return (
                  <div
                    key={c.student_id}
                    className={`conv-tab ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedStudentId(c.student_id);
                      loadConversation(c.student_id);
                    }}
                  >
                    <div className="conv-avatar">{initials}</div>
                    <div className="conv-text" style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="conv-name" style={{ display: 'block', fontWeight: 600, color: '#0F172A' }}>{c.student_name}</span>
                        {c.latest_time && (
                          <small style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                            {c.latest_time.split(' ')[1]?.slice(0, 5) || ''}
                          </small>
                        )}
                      </div>
                      {(c.student_email || students.find((s) => s.student_id === c.student_id)?.email) && (
                        <span className="conv-email" style={{ display: 'block', fontSize: '0.74rem', color: '#64748B', marginTop: '1px', overflowWrap: 'anywhere' }}>
                          {c.student_email || students.find((s) => s.student_id === c.student_id)?.email}
                        </span>
                      )}
                      <span className="conv-snippet" style={{ color: c.latest_message?.startsWith('No messages') ? '#94A3B8' : '#334155' }}>
                        {c.latest_message}
                      </span>
                    </div>
                    {c.unread_count > 0 && <span className="conv-badge">{c.unread_count}</span>}
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Active Chat Thread */}
          <div className="chat-thread-container">
            <div className="chat-thread-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <b style={{ fontSize: '0.96rem', color: '#0F172A', display: 'block', fontWeight: 600 }}>
                  {activeStudentName}
                </b>
                {(students.find((s) => s.student_id === selectedStudentId)?.email || allConversations.find((c) => c.student_id === selectedStudentId)?.student_email) && (
                  <span style={{ display: 'block', fontSize: '0.78rem', color: '#64748B', marginTop: '2px', overflowWrap: 'anywhere' }}>
                    {students.find((s) => s.student_id === selectedStudentId)?.email || allConversations.find((c) => c.student_id === selectedStudentId)?.student_email}
                  </span>
                )}
                {activeStudentCareer && (
                  <span style={{ display: 'block', fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                    Track: {activeStudentCareer}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {navigate && selectedStudentId && (
                  <button
                    type="button"
                    onClick={() => navigate(`/mentor/progress?studentId=${selectedStudentId}`)}
                    className="btn-inspect"
                    style={{ padding: '5px 10px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="Inspect Student Progress"
                  >
                    <Activity size={12} /> Progress
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => selectedStudentId && loadConversation(selectedStudentId)}
                  className="btn-inspect"
                  style={{ padding: '5px 10px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Refresh Thread"
                >
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>
            </div>

            <div className="chat-messages-area">
              {loadingThread ? (
                <div style={{ textAlign: 'center', color: '#94A3B8', margin: 'auto', padding: '2rem' }}>
                  <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 8px' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>Loading conversation...</p>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94A3B8', margin: 'auto', padding: '2rem' }}>
                  <MessageSquareText size={36} style={{ color: '#CBD5E1', margin: '0 auto 10px' }} />
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Start a conversation with {activeStudentName}</p>
                  <small style={{ fontSize: '0.78rem', color: '#64748B' }}>Send guidance, answer queries, or suggest capstone project improvements.</small>
                </div>
              ) : (
                messages.map((m) => {
                  const isMentor = m.sender_role === 'mentor';
                  return (
                    <div key={m.message_id} className={`chat-bubble-row ${isMentor ? 'sent' : 'received'}`}>
                      <div className={`chat-bubble ${isMentor ? 'mentor' : 'student'}`}>
                        <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: '1.45', whiteSpace: 'pre-wrap' }}>{m.content}</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '4px' }}>
                          <small style={{ fontSize: '0.68rem', opacity: 0.85 }}>{m.created_at}</small>
                          {isMentor && (
                            <span style={{ fontSize: '0.68rem', opacity: 0.85 }}>
                              {m.is_read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="chat-input-bar">
              <textarea
                rows={1}
                placeholder={selectedStudentId ? `Type message to ${activeStudentName}... (Enter to send, Shift+Enter for new line)` : 'Select a mentee to start chatting...'}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (messageText.trim() && !sending && selectedStudentId) {
                      handleSendMessage(e);
                    }
                  }
                }}
                disabled={sending || !selectedStudentId}
                maxLength={5000}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border, #E1E7F0)',
                  background: '#FFFFFF',
                  color: 'var(--text-main, #172033)',
                  fontSize: '0.88rem',
                  resize: 'none',
                  fontFamily: 'inherit',
                  lineHeight: '1.4',
                  minHeight: '42px',
                  maxHeight: '120px',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                className="chat-send-btn"
                disabled={sending || !selectedStudentId || !messageText.trim()}
                title="Send Message (Enter)"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   9. RESOURCES VIEW/* =========================================================================
   9. RESOURCES VIEW
   ========================================================================= */
function ResourcesView({
  resources,
  notify,
  refreshData,
}: {
  resources: any[];
  notify: (msg: string) => void;
  refreshData: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Machine Learning');
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMentorResource({ title, description, category, url, tags });
      notify('Learning resource added successfully!');
      setShowModal(false);
      setTitle('');
      setDescription('');
      setUrl('');
      refreshData();
    } catch (err: any) {
      notify(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteMentorResource(id);
      notify('Resource removed.');
      refreshData();
    } catch (err: any) {
      notify(`Failed to remove: ${err.message}`);
    }
  };

  return (
    <div className="mentor-view-page">
      <div className="view-page-header">
        <div>
          <h2>Shared Learning Resources</h2>
          <p>Curated research papers, tutorials, repository templates, and guides for mentees</p>
        </div>
        <button
          type="button"
          className="primary-action-btn purple-gradient"
          onClick={() => setShowModal(true)}
        >
          <Plus size={16} /> Share Resource
        </button>
      </div>

      <div className="resources-grid-cards">
        {resources.map((r) => (
          <div key={r.resource_id} className="resource-card">
            <div className="res-top">
              <span className="res-cat">{r.category}</span>
              <button
                type="button"
                className="res-del"
                onClick={() => handleDelete(r.resource_id)}
                title="Delete Resource"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <h4>{r.title}</h4>
            <p>{r.description}</p>
            <div className="res-bottom">
              <span className="res-tags">{r.tags}</span>
              <a href={r.url} target="_blank" rel="noreferrer" className="res-link">
                Open Resource <ExternalLink size={12} />
              </a>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="mentor-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="mentor-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Share Learning Material</h3>
              <button type="button" className="close-modal-btn" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="auth-form" style={{ padding: '1.5rem' }}>
              <div className="form-group">
                <label>Resource Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stanford CS229 Lecture Notes"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option>Machine Learning</option>
                  <option>MLOps</option>
                  <option>System Design</option>
                  <option>Data Engineering</option>
                  <option>Cybersecurity</option>
                </select>
              </div>
              <div className="form-group">
                <label>URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Key concepts covered..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <button type="submit" className="primary-action-btn full purple-gradient">
                Share with Mentees
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   10. PROFILE VIEW (PHASE 10 COMPLETE SPECIFICATION)
   ========================================================================= */
function ProfileView({
  profile,
  notify,
  refreshData,
}: {
  profile: any;
  notify: (msg: string) => void;
  refreshData: () => void;
}) {
  const [name, setName] = useState(profile?.name || '');
  const [headline, setHeadline] = useState(profile?.headline || '');
  const [title, setTitle] = useState(profile?.title || '');
  const [company, setCompany] = useState(profile?.company || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [experienceYears, setExperienceYears] = useState<number>(profile?.experience_years ?? 5);
  const [education, setEducation] = useState(profile?.education || '');
  const [certifications, setCertifications] = useState(profile?.certifications || '');
  const [languages, setLanguages] = useState(profile?.languages || 'English');
  const [careerSpecializations, setCareerSpecializations] = useState(profile?.career_specializations || '');
  const [skillsSummary, setSkillsSummary] = useState(profile?.skills || '');
  const [expertise, setExpertise] = useState(profile?.expertise || '');
  const [linkedin, setLinkedin] = useState(profile?.linkedin_url || '');
  const [github, setGithub] = useState(profile?.github_url || '');
  const [portfolio, setPortfolio] = useState(profile?.portfolio_url || '');
  const [profilePicture, setProfilePicture] = useState(profile?.profile_picture || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync state if profile prop changes
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setHeadline(profile.headline || '');
      setTitle(profile.title || '');
      setCompany(profile.company || '');
      setBio(profile.bio || '');
      setExperienceYears(profile.experience_years ?? 5);
      setEducation(profile.education || '');
      setCertifications(profile.certifications || '');
      setLanguages(profile.languages || 'English');
      setCareerSpecializations(profile.career_specializations || '');
      setSkillsSummary(profile.skills || '');
      setExpertise(profile.expertise || '');
      setLinkedin(profile.linkedin_url || '');
      setGithub(profile.github_url || '');
      setPortfolio(profile.portfolio_url || '');
      setProfilePicture(profile.profile_picture || '');
    }
  }, [profile]);

  const validateUrl = (url: string, fieldName: string): boolean => {
    if (!url || !url.trim()) return true;
    const v = url.trim();
    if (!v.startsWith('http://') && !v.startsWith('https://') && !v.startsWith('/uploads/')) {
      notify(`Invalid URL for ${fieldName}. Must begin with http://, https://, or /uploads/`);
      return false;
    }
    return true;
  };

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify('Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    setUploadingAvatar(true);
    try {
      const res = await api.uploadMentorAvatar(file);
      setProfilePicture(res.profile_picture);
      notify('Profile photo uploaded successfully!');
      refreshData();
    } catch (err: any) {
      notify(`Avatar upload failed: ${err.message}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      notify('Full name is required.');
      return;
    }
    if (!title.trim()) {
      notify('Professional title is required.');
      return;
    }
    if (!bio.trim() || bio.trim().length < 5) {
      notify('Biography must be at least 5 characters.');
      return;
    }
    if (experienceYears < 0 || experienceYears > 60) {
      notify('Years of experience must be between 0 and 60.');
      return;
    }

    if (!validateUrl(linkedin, 'LinkedIn URL')) return;
    if (!validateUrl(github, 'GitHub URL')) return;
    if (!validateUrl(portfolio, 'Portfolio URL')) return;
    if (!validateUrl(profilePicture, 'Profile Picture URL')) return;

    setSaving(true);
    try {
      await api.updateMentorProfile({
        name: name.trim(),
        title: title.trim(),
        headline: headline.trim(),
        company: company.trim(),
        bio: bio.trim(),
        experience_years: experienceYears,
        education: education.trim(),
        certifications: certifications.trim(),
        languages: languages.trim(),
        career_specializations: careerSpecializations.trim(),
        skills: skillsSummary.trim(),
        expertise: expertise.trim() || title.trim(),
        linkedin_url: linkedin.trim(),
        github_url: github.trim(),
        portfolio_url: portfolio.trim(),
        profile_picture: profilePicture.trim(),
      });
      notify('Mentor profile updated and saved to database successfully!');
      refreshData();
    } catch (err: any) {
      notify(`Update failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const initials = (name || 'Mentor')
    .split(' ')
    .filter(Boolean)
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'ME';

  return (
    <div className="mentor-view-page">
      <div className="view-page-header">
        <div>
          <h2>My Professional Profile</h2>
          <p>Manage your verified public identity, academic credentials, certifications, and industry specializations</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr', gap: '24px', maxWidth: '1100px' }}>
        {/* Left Column: Avatar & Summary Card */}
        <div className="mentor-profile-card" style={{ textAlign: 'center', height: 'fit-content' }}>
          <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 16px' }}>
            {profilePicture ? (
              <img
                src={profilePicture.startsWith('/') ? `http://127.0.0.1:8000${profilePicture}` : profilePicture}
                alt={name}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-primary, #315DA8)' }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-primary, #315DA8) 0%, var(--color-primary-hover, #4938E8) 100%)',
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: 800,
                }}
              >
                {initials}
              </div>
            )}
          </div>

          <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', color: 'var(--color-text-primary, #15213B)', fontWeight: 800 }}>{name}</h3>
          <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#64748B' }}>
            {headline || `${title} • ${company || 'PathForge'}`}
          </p>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', padding: '4px 12px', borderRadius: '16px', fontSize: '0.78rem', color: '#334155', fontWeight: 600, marginBottom: '16px' }}>
            <span>⭐ {profile?.rating || '4.8'}</span>
            <span>•</span>
            <span>{experienceYears} Years Exp</span>
          </div>

          {/* Upload Button */}
          <div style={{ marginTop: '10px' }}>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#EDF3FF',
                color: 'var(--color-primary-hover, #4938E8)',
                border: '1px solid #C8D6EA',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} className={uploadingAvatar ? 'animate-spin' : ''} />
              {uploadingAvatar ? 'Uploading...' : 'Upload Profile Photo'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarFileUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E2E8F0', textAlign: 'left', fontSize: '0.82rem', color: '#64748B' }}>
            <div style={{ marginBottom: '6px' }}>
              <b>Languages:</b> {languages || 'English'}
            </div>
            <div style={{ marginBottom: '6px' }}>
              <b>Specializations:</b> {careerSpecializations || expertise || 'General Mentorship'}
            </div>
            <div>
              <b>Status:</b> 🟢 {profile?.availability || 'Available'}
            </div>
          </div>
        </div>

        {/* Right Column: Full Profile Edit Form */}
        <div className="mentor-profile-card">
          <form onSubmit={handleUpdate} className="auth-form">
            <h4 style={{ margin: '0 0 14px', fontSize: '0.95rem', color: '#1E293B', fontWeight: 700 }}>
              Primary Professional Identity
            </h4>

            <div className="form-row-2">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Dr. Alex Chen"
                />
              </div>
              <div className="form-group">
                <label>Professional Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Principal AI Systems Architect"
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Professional Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Lead AI Architect @ Cyberdyne | Ex-Google"
                />
              </div>
              <div className="form-group">
                <label>Company / Organization</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Google DeepMind / Stanford AI"
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Years of Industry Experience *</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Languages Spoken</label>
                <input
                  type="text"
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  placeholder="e.g. English, Spanish, Mandarin"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Biography & Mentoring Focus *</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                required
                placeholder="Share your technical background, industry milestones, and how you guide students through roadmaps and technical interviews..."
              />
            </div>

            <h4 style={{ margin: '16px 0 12px', fontSize: '0.95rem', color: '#1E293B', fontWeight: 700, paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>
              Credentials, Qualifications & Expertise
            </h4>

            <div className="form-row-2">
              <div className="form-group">
                <label>Educational Qualifications</label>
                <input
                  type="text"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="e.g. Ph.D. in Computer Science, Stanford University (2018)"
                />
              </div>
              <div className="form-group">
                <label>Professional Certifications</label>
                <input
                  type="text"
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  placeholder="e.g. AWS Certified Machine Learning, GCP Professional ML Engineer"
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Career Specializations</label>
                <input
                  type="text"
                  value={careerSpecializations}
                  onChange={(e) => setCareerSpecializations(e.target.value)}
                  placeholder="e.g. Deep Learning, Autonomous Systems, MLOps"
                />
              </div>
              <div className="form-group">
                <label>Core Technical Skills Summary</label>
                <input
                  type="text"
                  value={skillsSummary}
                  onChange={(e) => setSkillsSummary(e.target.value)}
                  placeholder="e.g. PyTorch, TensorFlow, CUDA, Python, Docker"
                />
              </div>
            </div>

            <h4 style={{ margin: '16px 0 12px', fontSize: '0.95rem', color: '#1E293B', fontWeight: 700, paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>
              Professional Profile Links & Photo URL
            </h4>

            <div className="form-row-2">
              <div className="form-group">
                <label>LinkedIn URL</label>
                <input
                  type="url"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div className="form-group">
                <label>GitHub URL</label>
                <input
                  type="url"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/username"
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Portfolio / Personal Website</label>
                <input
                  type="url"
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  placeholder="https://yourportfolio.ai"
                />
              </div>
              <div className="form-group">
                <label>Profile Picture URL (or upload above)</label>
                <input
                  type="text"
                  value={profilePicture}
                  onChange={(e) => setProfilePicture(e.target.value)}
                  placeholder="https://... or /uploads/avatars/..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="primary-action-btn purple-gradient"
              style={{ marginTop: '1rem', width: '100%' }}
            >
              {saving ? 'Saving Profile...' : 'Save Complete Profile Information'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


/* =========================================================================
   PHASE 10: MANAGE EXPERTISE & SKILLS VIEW
   ========================================================================= */
function ManageExpertiseView({ notify, refreshData }: { notify: (msg: string) => void; refreshData: () => void }) {
  const [skills, setSkills] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [catalogSkills, setCatalogSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<any | null>(null);

  // Form states
  const [skillName, setSkillName] = useState('');
  const [category, setCategory] = useState('programming');
  const [proficiency, setProficiency] = useState('Advanced');
  const [years, setYears] = useState(3);
  const [isWilling, setIsWilling] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const [skillsList, catData] = await Promise.all([
        api.getMentorSkills(),
        api.getSkillCategories(),
      ]);
      setSkills(skillsList || []);
      setCategories(catData.categories || [
        'programming',
        'data science',
        'web development',
        'machine learning',
        'cloud computing',
        'career preparation',
        'system design',
        'devops',
      ]);
      setCatalogSkills(catData.catalog_skills || []);
    } catch (err: any) {
      notify(`Failed to load expertise skills: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const handleOpenAddModal = () => {
    setSkillName('');
    setCategory('programming');
    setProficiency('Advanced');
    setYears(3);
    setIsWilling(true);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (s: any) => {
    setEditingSkill(s);
    setCategory(s.category);
    setProficiency(s.proficiency_level);
    setYears(s.years_of_experience);
    setIsWilling(s.is_willing_to_mentor);
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) {
      notify('Skill name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      await api.addMentorSkill({
        skill_name: skillName.trim(),
        category,
        proficiency_level: proficiency,
        years_of_experience: years,
        is_willing_to_mentor: isWilling,
      });
      notify(`Skill '${skillName.trim()}' added to your expertise profile.`);
      setShowAddModal(false);
      await loadSkills();
      refreshData();
    } catch (err: any) {
      notify(`Failed to add skill: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSkill) return;
    setSaving(true);
    try {
      await api.updateMentorSkill(editingSkill.id, {
        category,
        proficiency_level: proficiency,
        years_of_experience: years,
        is_willing_to_mentor: isWilling,
      });
      notify(`Skill '${editingSkill.skill_name}' updated successfully.`);
      setEditingSkill(null);
      await loadSkills();
      refreshData();
    } catch (err: any) {
      notify(`Failed to update skill: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSkill = async (skillId: number, name: string) => {
    if (!window.confirm(`Are you sure you want to remove '${name}' from your mentor expertise?`)) {
      return;
    }
    try {
      await api.deleteMentorSkill(skillId);
      notify(`Skill '${name}' removed from expertise.`);
      await loadSkills();
      refreshData();
    } catch (err: any) {
      notify(`Delete failed: ${err.message}`);
    }
  };

  const filteredSkills = skills.filter((s) => {
    if (selectedCategory === 'all') return true;
    return (s.category || '').toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="mentor-view-page">
      <div className="view-page-header">
        <div>
          <h2>Manage Mentor Expertise & Skills</h2>
          <p>Curate the technical competencies, proficiency tiers, and focus areas you mentor students in</p>
        </div>
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="primary-action-btn purple-gradient"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} /> Add New Skill
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="mentor-tabs" style={{ marginBottom: '20px' }}>
        <span
          className={selectedCategory === 'all' ? 'selected' : ''}
          onClick={() => setSelectedCategory('all')}
        >
          All Categories ({skills.length})
        </span>
        {categories.map((cat) => {
          const count = skills.filter((s) => (s.category || '').toLowerCase() === cat.toLowerCase()).length;
          return (
            <span
              key={cat}
              className={selectedCategory === cat ? 'selected' : ''}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)} ({count})
            </span>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--color-primary, #315DA8)' }} />
          <b>Loading expertise profile...</b>
        </div>
      ) : filteredSkills.length === 0 ? (
        <div className="mentor-profile-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Award size={48} style={{ color: '#94A3B8', margin: '0 auto 12px' }} />
          <h3 style={{ margin: '0 0 6px', color: '#1E293B' }}>No skills in this category</h3>
          <p style={{ color: '#64748B', fontSize: '0.88rem', margin: '0 0 16px' }}>
            Add skills you are proficient in and willing to mentor students through.
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="primary-action-btn purple-gradient"
          >
            + Add First Skill
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredSkills.map((s) => (
            <div
              key={s.id}
              className="mentor-profile-card"
              style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--color-text-primary, #15213B)', fontWeight: 700 }}>
                    {s.skill_name}
                  </h4>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 600,
                      background: '#EDF3FF',
                      color: 'var(--color-primary-hover, #4938E8)',
                      textTransform: 'capitalize',
                    }}
                  >
                    {s.category}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', fontSize: '0.78rem' }}>
                  <span style={{ background: '#F1F5F9', color: '#334155', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                    Level: {s.proficiency_level}
                  </span>
                  <span style={{ background: '#F1F5F9', color: '#334155', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                    {s.years_of_experience} yrs exp
                  </span>
                  <span
                    style={{
                      background: s.is_willing_to_mentor ? '#DCFCE7' : '#F1F5F9',
                      color: s.is_willing_to_mentor ? '#166534' : '#64748B',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontWeight: 600,
                    }}
                  >
                    {s.is_willing_to_mentor ? '🟢 Mentoring Mentee' : '⚪ Reference Only'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '10px', borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(s)}
                  className="btn-inspect"
                  style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Edit size={12} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSkill(s.id, s.skill_name)}
                  style={{
                    background: '#FEE2E2',
                    color: '#DC2626',
                    border: '1px solid #FECACA',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    padding: '4px 10px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600,
                  }}
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: ADD SKILL MODAL */}
      {showAddModal && (
        <div className="mentor-modal-overlay" onClick={() => !saving && setShowAddModal(false)}>
          <div className="mentor-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-text-primary, #15213B)', fontWeight: 800 }}>
                Add Skill to Expertise
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSkill} style={{ padding: '20px 22px' }}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Skill Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PyTorch, Kubernetes, System Design"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  list="catalog-skills-list"
                />
                <datalist id="catalog-skills-list">
                  {catalogSkills.map((cs) => (
                    <option key={cs.skill_id} value={cs.skill_name} />
                  ))}
                </datalist>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row-2" style={{ marginBottom: '14px' }}>
                <div className="form-group">
                  <label>Proficiency Level</label>
                  <select
                    value={proficiency}
                    onChange={(e) => setProficiency(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert / Master</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Years of Experience</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isWilling}
                    onChange={(e) => setIsWilling(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ fontSize: '0.88rem', color: '#1E293B', fontWeight: 600 }}>
                    I am actively willing to mentor students in this skill
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-inspect"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="primary-action-btn purple-gradient"
                >
                  {saving ? 'Adding...' : 'Add Skill to Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT SKILL MODAL */}
      {editingSkill && (
        <div className="mentor-modal-overlay" onClick={() => !saving && setEditingSkill(null)}>
          <div className="mentor-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-text-primary, #15213B)', fontWeight: 800 }}>
                Edit Skill: {editingSkill.skill_name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingSkill(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateSkill} style={{ padding: '20px 22px' }}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row-2" style={{ marginBottom: '14px' }}>
                <div className="form-group">
                  <label>Proficiency Level</label>
                  <select
                    value={proficiency}
                    onChange={(e) => setProficiency(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert / Master</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Years of Experience</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isWilling}
                    onChange={(e) => setIsWilling(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ fontSize: '0.88rem', color: '#1E293B', fontWeight: 600 }}>
                    I am actively willing to mentor students in this skill
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingSkill(null)}
                  className="btn-inspect"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="primary-action-btn purple-gradient"
                >
                  {saving ? 'Updating...' : 'Save Skill Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


/* =========================================================================
   PHASE 10: AVAILABILITY SETTINGS VIEW
   ========================================================================= */
function AvailabilitySettingsView({
  profile,
  notify,
  refreshData,
}: {
  profile: any;
  notify: (msg: string) => void;
  refreshData: () => void;
}) {
  const [availableDays, setAvailableDays] = useState<string[]>([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [duration, setDuration] = useState(60);
  const [timezone, setTimezone] = useState('UTC');
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [dateInput, setDateInput] = useState('');
  const [notes, setNotes] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(profile?.max_capacity || 15);
  const [generalStatus, setGeneralStatus] = useState(profile?.availability || 'Available');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const timezones = [
    { label: 'UTC (Coordinated Universal Time)', value: 'UTC' },
    { label: 'America/New_York (EST / EDT)', value: 'America/New_York' },
    { label: 'America/Los_Angeles (PST / PDT)', value: 'America/Los_Angeles' },
    { label: 'Europe/London (GMT / BST)', value: 'Europe/London' },
    { label: 'Europe/Paris (CET / CEST)', value: 'Europe/Paris' },
    { label: 'Asia/Kolkata (IST)', value: 'Asia/Kolkata' },
    { label: 'Asia/Tokyo (JST)', value: 'Asia/Tokyo' },
    { label: 'Australia/Sydney (AEST / AEDT)', value: 'Australia/Sydney' },
  ];

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const data = await api.getMentorAvailability();
      if (data) {
        setAvailableDays(data.available_days || []);
        setStartTime(data.start_time || '09:00');
        setEndTime(data.end_time || '17:00');
        setDuration(data.session_duration || 60);
        setTimezone(data.timezone || 'UTC');
        setUnavailableDates(data.unavailable_dates || []);
        setNotes(data.notes || '');
      }
    } catch (err: any) {
      notify(`Could not load availability: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailability();
  }, []);

  const toggleDay = (day: string) => {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter((d) => d !== day));
    } else {
      setAvailableDays([...availableDays, day]);
    }
  };

  const handleAddUnavailableDate = () => {
    const trimmed = dateInput.trim();
    if (!trimmed) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      notify('Please select or enter date in YYYY-MM-DD format.');
      return;
    }
    if (!unavailableDates.includes(trimmed)) {
      setUnavailableDates([...unavailableDates, trimmed]);
    }
    setDateInput('');
  };

  const handleRemoveUnavailableDate = (d: string) => {
    setUnavailableDates(unavailableDates.filter((x) => x !== d));
  };

  const handleSaveAvailability = async () => {
    if (availableDays.length === 0) {
      notify('Please select at least one available day.');
      return;
    }
    if (startTime >= endTime) {
      notify('End time must be later than start time.');
      return;
    }

    setSaving(true);
    try {
      await api.updateMentorAvailability({
        available_days: availableDays,
        start_time: startTime,
        end_time: endTime,
        session_duration: duration,
        timezone,
        unavailable_dates: unavailableDates,
        notes,
      });

      // Also sync capacity and general status
      await api.updateMentorProfile({
        max_capacity: maxCapacity,
        availability: generalStatus,
      });

      notify('Availability settings and schedule saved successfully!');
      refreshData();
    } catch (err: any) {
      notify(`Failed to save availability: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mentor-view-page">
      <div className="view-page-header">
        <div>
          <h2>Mentorship Availability & Scheduling</h2>
          <p>Define weekly office hours, preferred session durations, timezone, and calendar exceptions</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1fr) 340px', gap: '24px', maxWidth: '1050px' }}>
        {/* Left Column: Availability Configuration */}
        <div className="mentor-profile-card">
          <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', color: 'var(--color-text-primary, #15213B)', fontWeight: 800 }}>
            Weekly Availability Schedule
          </h3>

          {/* Active Days Toggles */}
          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label>Available Days of the Week</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
              {daysOfWeek.map((day) => {
                const isActive = availableDays.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => toggleDay(day)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: isActive ? '1px solid var(--color-primary, #315DA8)' : '1px solid #CBD5E1',
                      background: isActive ? '#EDF3FF' : '#FFF',
                      color: isActive ? 'var(--color-primary-hover, #4938E8)' : '#64748B',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {isActive ? '✓ ' : ''}{day}
                  </button>
                );
              })}
            </div>
            <small style={{ color: '#64748B', display: 'block', marginTop: '6px' }}>
              Students can book 1:1 sessions exclusively on your selected days.
            </small>
          </div>

          {/* Time Window */}
          <div className="form-row-2" style={{ marginBottom: '18px' }}>
            <div className="form-group">
              <label>Daily Start Time (24h)</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Daily End Time (24h)</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Duration & Timezone */}
          <div className="form-row-2" style={{ marginBottom: '18px' }}>
            <div className="form-group">
              <label>Preferred Session Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
              >
                <option value={15}>15 Minutes (Rapid Standup)</option>
                <option value={30}>30 Minutes (Sprint Check-in)</option>
                <option value={45}>45 Minutes (Roadmap Deep Dive)</option>
                <option value={60}>60 Minutes (Standard 1:1 Session)</option>
                <option value={90}>90 Minutes (Technical Project Review)</option>
                <option value={120}>120 Minutes (Architecture Workshop)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Working Time Zone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
              >
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Unavailable Dates / Holidays */}
          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label>Specific Unavailable Dates (Vacation / Leave)</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
              />
              <button
                type="button"
                onClick={handleAddUnavailableDate}
                className="btn-inspect"
                style={{ padding: '0 16px', whiteSpace: 'nowrap' }}
              >
                + Add Date
              </button>
            </div>
            {unavailableDates.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {unavailableDates.map((d) => (
                  <span
                    key={d}
                    style={{
                      background: '#FEE2E2',
                      color: '#DC2626',
                      border: '1px solid #FECACA',
                      borderRadius: '16px',
                      padding: '3px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    🚫 {d}
                    <X
                      size={12}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleRemoveUnavailableDate(d)}
                    />
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div className="form-group">
            <label>Session Booking Instructions / Guidance for Students</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Please bring an updated GitHub repository link or specific roadmap bottleneck to discuss..."
            />
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={handleSaveAvailability}
            className="primary-action-btn purple-gradient"
            style={{ width: '100%', marginTop: '16px' }}
          >
            {saving ? 'Saving...' : 'Save Availability & Schedule Rules'}
          </button>
        </div>

        {/* Right Column: Capacity & Schedule Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Status & Capacity Card */}
          <div className="mentor-profile-card">
            <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', color: 'var(--color-text-primary, #15213B)', fontWeight: 700 }}>
              General Availability Status
            </h4>

            <div className="availability-options-row" style={{ marginBottom: '14px' }}>
              {['Available', 'Busy', 'Away'].map((st) => (
                <button
                  type="button"
                  key={st}
                  className={`avail-btn ${generalStatus === st ? 'active' : ''}`}
                  onClick={() => setGeneralStatus(st)}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="form-group" style={{ marginTop: '14px' }}>
              <label>Maximum Mentees ({maxCapacity})</label>
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(Number(e.target.value))}
                style={{ width: '100%', marginTop: '6px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B' }}>
                <span>5 Students</span>
                <span>15 Students</span>
                <span>30 Students</span>
              </div>
            </div>
          </div>

          {/* Preview Schedule Card */}
          <div className="mentor-profile-card">
            <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', color: 'var(--color-text-primary, #15213B)', fontWeight: 700 }}>
              Weekly Schedule Preview
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
              {daysOfWeek.map((day) => {
                const isActive = availableDays.includes(day);
                return (
                  <div
                    key={day}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      background: isActive ? '#F8FAFC' : '#FFF',
                      borderRadius: '6px',
                      color: isActive ? '#1E293B' : '#94A3B8',
                    }}
                  >
                    <span style={{ fontWeight: isActive ? 600 : 400 }}>{day}</span>
                    <span style={{ color: isActive ? 'var(--color-primary-hover, #4938E8)' : '#94A3B8', fontWeight: 600 }}>
                      {isActive ? `${startTime} - ${endTime}` : 'Closed'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


/* =========================================================================
   11. SETTINGS VIEW
   ========================================================================= */
function SettingsView({
  profile,
  notify,
  refreshData,
}: {
  profile: any;
  notify: (msg: string) => void;
  refreshData: () => void;
}) {
  const [availability, setAvailability] = useState(profile?.availability || 'Available');
  const [maxCapacity, setMaxCapacity] = useState(profile?.max_capacity || 15);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [sessionReminders, setSessionReminders] = useState(true);
  const [chatNotifications, setChatNotifications] = useState(true);

  const handleSave = async () => {
    try {
      await api.updateMentorProfile({
        availability,
        max_capacity: maxCapacity,
      });
      notify(`Settings saved successfully! Availability: '${availability}'.`);
      refreshData();
    } catch (err: any) {
      notify(`Failed to save settings: ${err.message}`);
    }
  };

  return (
    <div className="mentor-view-page">
      <div className="view-page-header">
        <div>
          <h2>Settings & Mentorship Preferences</h2>
          <p>Control your active mentorship availability, notification triggers, and account capacity</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', maxWidth: '1000px' }}>
        {/* Availability Card */}
        <div className="mentor-profile-card" style={{ maxWidth: 'none' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary, #15213B)', marginBottom: '1rem' }}>
            Mentorship Status & Capacity
          </h3>

          <div className="form-group">
            <label>Current Availability</label>
            <div className="availability-options-row">
              {['Available', 'Busy', 'Away'].map((st) => (
                <button
                  type="button"
                  key={st}
                  className={`avail-btn ${availability === st ? 'active' : ''}`}
                  onClick={() => setAvailability(st)}
                >
                  {st}
                </button>
              ))}
            </div>
            <small style={{ color: '#64748B', display: 'block', marginTop: '6px' }}>
              {availability === 'Available'
                ? '🟢 Active: Students can browse your profile and request 1:1 sessions.'
                : availability === 'Busy'
                ? '🟡 Busy: You are at near-capacity; new student requests will be queued.'
                : '⚪ Away: Temporarily hidden from new student mentor searches.'}
            </small>
          </div>

          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label>Maximum Concurrent Mentees ({maxCapacity})</label>
            <input
              type="range"
              min="5"
              max="30"
              step="5"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(Number(e.target.value))}
              style={{ width: '100%', marginTop: '6px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B' }}>
              <span>5 Students</span>
              <span>15 Students</span>
              <span>30 Students</span>
            </div>
          </div>

          <button
            type="button"
            className="primary-action-btn purple-gradient"
            style={{ marginTop: '1.5rem' }}
            onClick={handleSave}
          >
            Save Availability & Capacity
          </button>
        </div>

        {/* Notifications & Security Card */}
        <div className="mentor-profile-card" style={{ maxWidth: 'none' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary, #15213B)', marginBottom: '1rem' }}>
            Notification Triggers
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <div>
                <b style={{ fontSize: '0.85rem', color: '#1E293B' }}>New Mentorship Requests</b>
                <small style={{ display: 'block', color: '#64748B' }}>
                  Receive immediate alerts when a student requests 1:1 mentorship.
                </small>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={sessionReminders}
                onChange={(e) => setSessionReminders(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <div>
                <b style={{ fontSize: '0.85rem', color: '#1E293B' }}>Upcoming Session Reminders</b>
                <small style={{ display: 'block', color: '#64748B' }}>
                  Receive a Google Meet calendar reminder 1 hour prior to calls.
                </small>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={chatNotifications}
                onChange={(e) => setChatNotifications(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <div>
                <b style={{ fontSize: '0.85rem', color: '#1E293B' }}>Mentee Messages</b>
                <small style={{ display: 'block', color: '#64748B' }}>
                  Show badge notifications when mentees send questions or updates.
                </small>
              </div>
            </label>
          </div>

          <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #E2E8F0' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-primary, #15213B)', marginBottom: '6px' }}>Account Credentials</h4>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
              Authenticated as: <b>{profile?.email || 'alex.mentor@pathforge.ai'}</b> (Verified Mentor)
            </p>
          </div>
        </div>

        {/* Mentor Verification Status Card */}
        <div className="mentor-profile-card" style={{ maxWidth: 'none', gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={22} color="#315DA8" />
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary, #172B4D)', margin: 0 }}>
                  Mentor Verification & Credential Audit
                </h3>
                <small style={{ color: 'var(--color-text-secondary, #64748B)' }}>
                  Platform verification ensures trusted guidance for students and verified credentials across PathForge.
                </small>
              </div>
            </div>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 700,
                background:
                  profile?.verification_status === 'Approved'
                    ? '#ECFDF5'
                    : profile?.verification_status === 'Pending Review'
                    ? '#FFFBEB'
                    : '#FEF2F2',
                color:
                  profile?.verification_status === 'Approved'
                    ? '#059669'
                    : profile?.verification_status === 'Pending Review'
                    ? '#D97706'
                    : '#DC2626',
              }}
            >
              {profile?.verification_status === 'Approved' && <CheckCircle2 size={14} />}
              {profile?.verification_status === 'Pending Review' && <Clock3 size={14} />}
              {profile?.verification_status === 'Rejected' && <X size={14} />}
              Status: {profile?.verification_status || 'Approved'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #DFE7F2' }}>
            <div>
              <b style={{ fontSize: '0.8rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Verification Document</b>
              <div style={{ marginTop: '4px', fontSize: '0.9rem' }}>
                {profile?.verification_document ? (
                  <a
                    href={profile.verification_document}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#315DA8', fontWeight: 600, textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    View Submitted Document <ExternalLink size={13} />
                  </a>
                ) : (
                  <span style={{ color: '#64748B' }}>Self-declared profile (Standard network onboarding)</span>
                )}
              </div>
            </div>

            <div>
              <b style={{ fontSize: '0.8rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Professional Title & Org</b>
              <div style={{ marginTop: '4px', fontSize: '0.9rem', color: '#172B4D', fontWeight: 600 }}>
                {profile?.title || 'Principal Mentor'} • {profile?.company || 'PathForge'}
              </div>
            </div>

            <div>
              <b style={{ fontSize: '0.8rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Track Record</b>
              <div style={{ marginTop: '4px', fontSize: '0.9rem', color: '#172B4D', fontWeight: 600 }}>
                {profile?.experience_years || 5} years experience • {profile?.rating || 5.0} ★ rating
              </div>
            </div>
          </div>

          {profile?.verification_status === 'Rejected' && profile?.rejection_reason && (
            <div style={{ marginTop: '14px', padding: '12px 16px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', fontSize: '0.88rem' }}>
              <b>Rejection Feedback from Administration:</b> {profile.rejection_reason}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
