import React, { useState, useEffect } from 'react';
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
  Award,
} from 'lucide-react';

interface MentorPortalProps {
  notify: (msg: string) => void;
}

export function MentorPortal({ notify }: MentorPortalProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Active page derived from route
  const currentPath = location.pathname;
  const activeTab = currentPath.replace('/mentor/', '') || 'dashboard';

  // State data loaded from real backend
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [projectReviews, setProjectReviews] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReviewProject, setSelectedReviewProject] = useState<any>(null);
  const [showResourceModal, setShowResourceModal] = useState(false);

  // Load Dashboard & Global Mentor Data
  const loadPortalData = async () => {
    setLoading(true);
    try {
      const [dash, stList, sessList, revList, convList, resList, prof] = await Promise.all([
        api.getMentorDashboard().catch(() => null),
        api.getMentorStudents().catch(() => []),
        api.getMentorSessions().catch(() => []),
        api.getMentorProjectReviews().catch(() => []),
        api.getMentorConversations().catch(() => []),
        api.getMentorResources().catch(() => []),
        api.getMentorProfile().catch(() => null),
      ]);

      if (dash) setDashboardData(dash);
      if (stList) setStudents(stList);
      if (sessList) setSessions(sessList);
      if (revList) setProjectReviews(revList);
      if (convList) setConversations(convList);
      if (resList) setResources(resList);
      if (prof) setProfile(prof);
    } catch (err) {
      console.error('[MentorPortal] Failed loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, []);

  const mentorName = profile?.name || user?.name || user?.full_name || 'Dr. Alex Chen';
  const mentorTitle = profile?.title || 'Principal Mentor';
  const mentorInitials = mentorName
    .split(' ')
    .filter((w: string) => !w.includes('.'))
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AC';

  const unreadMsgCount = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  // Navigation Items matching Reference Image
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/mentor/dashboard' },
    { id: 'students', label: 'My Students', icon: Users, path: '/mentor/students' },
    { id: 'sessions', label: 'Mentorship Sessions', icon: CalendarDays, path: '/mentor/sessions' },
    { id: 'progress', label: 'Student Progress', icon: Activity, path: '/mentor/progress' },
    { id: 'assessments', label: 'Skill Assessments', icon: ClipboardCheck, path: '/mentor/assessments' },
    { id: 'project-reviews', label: 'Project Reviews', icon: FolderKanban, path: '/mentor/project-reviews' },
    { id: 'career-guidance', label: 'Career Guidance', icon: Target, path: '/mentor/career-guidance' },
    { id: 'messages', label: 'Messages', icon: MessageSquareText, path: '/mentor/messages', badge: unreadMsgCount > 0 ? unreadMsgCount : undefined },
    { id: 'resources', label: 'Resources', icon: BookOpen, path: '/mentor/resources' },
    { id: 'profile', label: 'Profile', icon: UserRound, path: '/mentor/profile' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/mentor/settings' },
  ];

  const handleOpenStudentDetail = async (studentId: string) => {
    try {
      const detail = await api.getMentorStudentDetail(studentId);
      setSelectedStudentDetail(detail);
      setShowDetailModal(true);
    } catch (err: any) {
      notify(`Cannot view student: ${err.message}`);
    }
  };

  return (
    <div className="mentor-portal-shell">
      {/* ==============================================================
          DARK NAVY SIDEBAR (MATCHING REFERENCE IMAGE)
          ============================================================== */}
      <aside className="mentor-sidebar">
        {/* Brand Header */}
        <div className="mentor-sidebar-brand" onClick={() => navigate('/mentor/dashboard')}>
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
                onClick={() => navigate(item.path)}
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
        <div className="mentor-sidebar-footer">
          <div
            className="mentor-mini-profile"
            onClick={() => navigate('/mentor/profile')}
            title="View Profile"
          >
            <div className="mentor-avatar-circle">{mentorInitials}</div>
            <div className="mentor-profile-info">
              <span className="mentor-profile-name">{mentorName}</span>
              <span className="mentor-profile-role">Mentor</span>
            </div>
          </div>
          <button
            type="button"
            className="mentor-logout-btn"
            onClick={() => {
              logout();
              notify('Signed out successfully.');
              navigate('/login');
            }}
            title="Sign Out"
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

          {/* Right Header Actions */}
          <div className="mentor-header-actions">
            <button
              type="button"
              className="header-notification-btn"
              onClick={() => notify('3 upcoming sessions scheduled this week')}
              title="Notifications"
            >
              <Bell size={18} />
              <span className="notification-dot">3</span>
            </button>

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

        {/* Content Body */}
        <main className="mentor-content-body">
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
              searchQuery={searchQuery}
              notify={notify}
              onInspectStudent={handleOpenStudentDetail}
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
              onInspectStudent={handleOpenStudentDetail}
            />
          )}

          {activeTab === 'assessments' && (
            <AssessmentsView students={students} />
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
        </main>
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
                  <h2>{selectedStudentDetail.name}</h2>
                  <p>
                    {selectedStudentDetail.degree} • {selectedStudentDetail.college}
                  </p>
                  <span className="badge-career">{selectedStudentDetail.target_career_name}</span>
                </div>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setShowDetailModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-scroll-content">
              {/* Skills Demonstrated vs Multi-Source Evidence */}
              <h3 className="section-sub-title">Demonstrated Skill Competencies</h3>
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

              {/* Learning Roadmap Milestones */}
              <h3 className="section-sub-title" style={{ marginTop: '1.5rem' }}>
                Roadmap Milestones (DAG Order)
              </h3>
              <div className="roadmap-milestones-list">
                {selectedStudentDetail.roadmap_steps?.map((step: any) => (
                  <div key={step.id} className={`roadmap-step-row ${step.status}`}>
                    <span className="step-num">{step.step_number}</span>
                    <span className="step-name">{step.milestone_name}</span>
                    <span className={`step-status-tag ${step.status}`}>{step.status}</span>
                  </div>
                ))}
              </div>

              {/* Feedback History */}
              <h3 className="section-sub-title" style={{ marginTop: '1.5rem' }}>
                Your Previous Reviews & Feedback
              </h3>
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
                <p style={{ color: '#94A3B8', fontSize: '13px' }}>
                  No reviews submitted for this student yet.
                </p>
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
    assigned_students: 12,
    upcoming_sessions: 8,
    project_reviews_completed: 24,
    mentor_rating: 4.8,
  };

  const sessions = data?.upcoming_sessions || [];
  const students = data?.student_progress_overview || [];
  const messages = data?.recent_messages || [];
  const careerDist = data?.career_distribution || [
    { career_name: 'Data Scientist', count: 4, percentage: 33 },
    { career_name: 'Full Stack Developer', count: 3, percentage: 25 },
    { career_name: 'ML Engineer', count: 2, percentage: 17 },
    { career_name: 'Backend Developer', count: 2, percentage: 17 },
    { career_name: 'Generative AI', count: 1, percentage: 8 },
  ];

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
                const dayNum = 15 + idx;
                return (
                  <div key={sess.session_id} className="session-card-item">
                    {/* Date Badge */}
                    <div className="session-date-box">
                      <span className="date-month">MAR</span>
                      <span className="date-day">{dayNum}</span>
                    </div>

                    {/* Details */}
                    <div className="session-info">
                      <h4 className="session-topic">{sess.topic}</h4>
                      <div className="session-meta">
                        <span className="session-student">
                          <UserRound size={12} /> Student: {sess.student_name}
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
                const colors = ['#10B981', '#8B5CF6', '#5B4BFF', '#F59E0B', '#6366F1'];
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

      {/* Bottom Grid: 4 Panels */}
      <div className="dashboard-bottom-grid">
        {/* Panel 1: Recent Messages */}
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
                const initials = msg.student_name.split(' ').map((w: string) => w[0]).join('');
                const times = ['2 hours ago', '5 hours ago', '1 day ago', '2 days ago'];
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
                        <span className="msg-time">{times[idx] || 'Recently'}</span>
                      </div>
                      <p className="msg-snippet">{msg.content}</p>
                    </div>
                    {idx === 0 && <span className="msg-unread-dot">2</span>}
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

        {/* Panel 2: Students by Career Goal (Donut Chart) */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Students by Career Goal</h3>
            <button
              type="button"
              className="panel-view-all-link"
              onClick={() => navigate('/mentor/students')}
            >
              View All
            </button>
          </div>

          <div className="donut-chart-container">
            {/* SVG Donut */}
            <div className="donut-svg-box">
              <svg viewBox="0 0 160 160" className="donut-svg">
                <circle cx="80" cy="80" r="60" stroke="#EEF2F6" strokeWidth="20" fill="none" />
                {/* Segments */}
                <circle cx="80" cy="80" r="60" stroke="#5B4BFF" strokeWidth="20" strokeDasharray="125 377" strokeDashoffset="0" fill="none" />
                <circle cx="80" cy="80" r="60" stroke="#3B82F6" strokeWidth="20" strokeDasharray="95 377" strokeDashoffset="-125" fill="none" />
                <circle cx="80" cy="80" r="60" stroke="#8B5CF6" strokeWidth="20" strokeDasharray="65 377" strokeDashoffset="-220" fill="none" />
                <circle cx="80" cy="80" r="60" stroke="#10B981" strokeWidth="20" strokeDasharray="60 377" strokeDashoffset="-285" fill="none" />
                <circle cx="80" cy="80" r="60" stroke="#F59E0B" strokeWidth="20" strokeDasharray="32 377" strokeDashoffset="-345" fill="none" />
              </svg>
              <div className="donut-center-label">
                <span className="center-count">{metrics.assigned_students}</span>
                <span className="center-text">Students</span>
              </div>
            </div>

            {/* Legend */}
            <div className="donut-legend-list">
              {careerDist.map((c: any, i: number) => {
                const colors = ['#5B4BFF', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'];
                return (
                  <div key={c.career_name} className="legend-row">
                    <span className="legend-color-dot" style={{ backgroundColor: colors[i % colors.length] }} />
                    <span className="legend-label">{c.career_name}</span>
                    <span className="legend-stat">
                      {c.count} ({c.percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Panel 3: Skill Development Insights (Bar Chart) */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Skill Development Insights</h3>
            <span className="filter-dropdown-pill">This Month ▾</span>
          </div>

          <div className="chart-legend-top">
            <span><i style={{ background: '#5B4BFF' }} /> Assessment Completed</span>
            <span><i style={{ background: '#3B82F6' }} /> Project Completed</span>
            <span><i style={{ background: '#10B981' }} /> Skills Improved</span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="bar-chart-visual">
            {[
              { week: 'Week 1', a: 12, b: 8, c: 14 },
              { week: 'Week 2', a: 15, b: 11, c: 16 },
              { week: 'Week 3', a: 9, b: 14, c: 18 },
              { week: 'Week 4', a: 18, b: 16, c: 22 },
            ].map((col) => (
              <div key={col.week} className="bar-group">
                <div className="bars-stack">
                  <div className="bar a" style={{ height: `${col.a * 3.5}px` }} title={`Assessments: ${col.a}`} />
                  <div className="bar b" style={{ height: `${col.b * 3.5}px` }} title={`Projects: ${col.b}`} />
                  <div className="bar c" style={{ height: `${col.c * 3.5}px` }} title={`Skills: ${col.c}`} />
                </div>
                <span className="week-label">{col.week}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 4: Your Impact */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Your Impact</h3>
            <button
              type="button"
              className="panel-view-all-link"
              onClick={() => navigate('/mentor/progress')}
            >
              View All
            </button>
          </div>

          <div className="impact-tiles-grid">
            <div className="impact-tile">
              <div className="tile-icon purple"><GraduationCap size={20} /></div>
              <div className="tile-data">
                <span className="tile-value">{metrics.assigned_students}</span>
                <span className="tile-label">Students Mentored</span>
              </div>
            </div>

            <div className="impact-tile">
              <div className="tile-icon green"><TrendingUp size={20} /></div>
              <div className="tile-data">
                <span className="tile-value">{metrics.avg_progress || 85}%</span>
                <span className="tile-label">Average Progress</span>
              </div>
            </div>

            <div className="impact-tile">
              <div className="tile-icon blue"><FolderKanban size={20} /></div>
              <div className="tile-data">
                <span className="tile-value">{metrics.project_reviews_completed}</span>
                <span className="tile-label">Projects Reviewed</span>
              </div>
            </div>

            <div className="impact-tile">
              <div className="tile-icon orange"><Star size={20} /></div>
              <div className="tile-data">
                <span className="tile-value">{metrics.mentor_rating}</span>
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
  searchQuery,
  notify,
  onInspectStudent,
  refreshData,
}: {
  students: any[];
  searchQuery: string;
  notify: (msg: string) => void;
  onInspectStudent: (id: string) => void;
  refreshData: () => void;
}) {
  const [careerFilter, setCareerFilter] = useState('All');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [studentIdToAssign, setStudentIdToAssign] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  const filtered = students.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCareer =
      careerFilter === 'All' ||
      st.target_career_name.toLowerCase().includes(careerFilter.toLowerCase());
    return matchesSearch && matchesCareer;
  });

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentIdToAssign.trim()) return;
    try {
      await api.assignStudent(studentIdToAssign.trim(), assignNotes);
      notify('Student successfully connected!');
      setShowAssignModal(false);
      setStudentIdToAssign('');
      refreshData();
    } catch (err: any) {
      notify(`Assignment failed: ${err.message}`);
    }
  };

  return (
    <div className="mentor-view-page">
      <div className="view-page-header">
        <div>
          <h2>My Assigned Students</h2>
          <p>Supervise competency development, roadmaps, and career readiness</p>
        </div>
        <button
          type="button"
          className="primary-action-btn purple-gradient"
          onClick={() => setShowAssignModal(true)}
        >
          <Plus size={16} /> Assign Student
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="filter-pills-row">
        {['All', 'Machine Learning', 'Data Science', 'Full Stack', 'Backend'].map((c) => (
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

      {/* Students Table / Grid */}
      <div className="students-table-card">
        <table className="mentor-data-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Target Career</th>
              <th>College / Degree</th>
              <th>Readiness Score</th>
              <th>Completed Courses</th>
              <th>Projects Verified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((st) => (
                <tr key={st.student_id}>
                  <td>
                    <div className="table-student-cell">
                      <div className="cell-avatar">
                        {st.name.split(' ').map((w: string) => w[0]).join('')}
                      </div>
                      <div>
                        <b>{st.name}</b>
                        <small>{st.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge-career-tag">{st.target_career_name}</span>
                  </td>
                  <td>
                    <span>{st.degree}</span>
                    <small>{st.college}</small>
                  </td>
                  <td>
                    <div className="readiness-cell">
                      <b>{st.readiness_pct}%</b>
                      <div className="mini-progress-bar">
                        <div
                          className="mini-bar-fill"
                          style={{ width: `${st.readiness_pct}%`, backgroundColor: '#10B981' }}
                        />
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>{st.courses_completed}</td>
                  <td style={{ textAlign: 'center' }}>{st.projects_verified}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-inspect"
                      onClick={() => onInspectStudent(st.student_id)}
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                  No students found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Assign Student Modal */}
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
  const [tab, setTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Form State
  const [studentId, setStudentId] = useState('');
  const [topic, setTopic] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('11:00 AM');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/pathforge-ai');

  const filteredSessions = sessions.filter((s) =>
    tab === 'upcoming' ? s.status === 'upcoming' : s.status !== 'upcoming'
  );

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !topic || !date) {
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
      });
      notify('Mentorship session scheduled successfully!');
      setShowScheduleModal(false);
      refreshData();
    } catch (err: any) {
      notify(`Error: ${err.message}`);
    }
  };

  const handleUpdateStatus = async (sessionId: string, newStatus: string) => {
    try {
      await api.updateSessionStatus(sessionId, newStatus);
      notify(`Session status updated to '${newStatus}'.`);
      refreshData();
    } catch (err: any) {
      notify(`Failed to update status: ${err.message}`);
    }
  };

  return (
    <div className="mentor-view-page">
      <div className="view-page-header">
        <div>
          <h2>Mentorship Sessions</h2>
          <p>Coordinate 1:1 guidance calls, code reviews, and mock interviews</p>
        </div>
        <button
          type="button"
          className="primary-action-btn purple-gradient"
          onClick={() => setShowScheduleModal(true)}
        >
          <Plus size={16} /> Schedule Session
        </button>
      </div>

      <div className="filter-pills-row">
        <button
          type="button"
          className={`filter-pill ${tab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setTab('upcoming')}
        >
          Upcoming Sessions ({sessions.filter((s) => s.status === 'upcoming').length})
        </button>
        <button
          type="button"
          className={`filter-pill ${tab === 'completed' ? 'active' : ''}`}
          onClick={() => setTab('completed')}
        >
          Completed Sessions ({sessions.filter((s) => s.status !== 'upcoming').length})
        </button>
      </div>

      <div className="sessions-grid-cards">
        {filteredSessions.length > 0 ? (
          filteredSessions.map((sess) => (
            <div key={sess.session_id} className="session-card-block">
              <div className="block-header">
                <span className="session-topic-title">{sess.topic}</span>
                <span className={`status-pill ${sess.status}`}>{sess.status}</span>
              </div>
              <div className="block-student">
                <UserRound size={14} /> Student: <b>{sess.student_name}</b> ({sess.student_id})
              </div>
              <div className="block-timing">
                <Calendar size={14} /> {sess.session_date} • {sess.start_time} - {sess.end_time}
              </div>
              <div className="block-link">
                <ExternalLink size={14} /> <a href={sess.meeting_link} target="_blank" rel="noreferrer">{sess.meeting_link}</a>
              </div>
              {sess.status === 'upcoming' && (
                <div className="block-actions">
                  <a href={sess.meeting_link} target="_blank" rel="noreferrer" className="btn-join-meeting">
                    Join Call
                  </a>
                  <button
                    type="button"
                    className="btn-mark-done"
                    onClick={() => handleUpdateStatus(sess.session_id, 'completed')}
                  >
                    Mark Complete
                  </button>
                  <button
                    type="button"
                    className="btn-cancel-sess"
                    onClick={() => handleUpdateStatus(sess.session_id, 'cancelled')}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="empty-panel-state full-width">
            <p>No sessions in this category.</p>
          </div>
        )}
      </div>

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
                      {st.name} ({st.target_career_name})
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
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input
                    type="text"
                    required
                    placeholder="10:00 AM - 11:00 AM"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Meeting Platform / URL</label>
                <input
                  type="url"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                />
              </div>
              <button type="submit" className="primary-action-btn full purple-gradient">
                Confirm & Schedule
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
  onInspectStudent,
}: {
  students: any[];
  onInspectStudent: (id: string) => void;
}) {
  return (
    <div className="mentor-view-page">
      <div className="view-page-header">
        <div>
          <h2>Student Progress & Competency Matrix</h2>
          <p>Transparent multi-source evidence calibrated across assessments, projects, and certifications</p>
        </div>
      </div>

      <div className="students-progress-grid">
        {students.map((st) => (
          <div key={st.student_id} className="progress-summary-card">
            <div className="card-top">
              <div className="avatar">{st.name.split(' ').map((w: string) => w[0]).join('')}</div>
              <div>
                <h4>{st.name}</h4>
                <small>{st.target_career_name}</small>
              </div>
            </div>

            <div className="readiness-radial-box">
              <span className="readiness-big-pct">{st.readiness_pct}%</span>
              <span className="readiness-sub-text">Overall Career Readiness</span>
            </div>

            <div className="evidence-metrics-row">
              <div>
                <span className="metric-val">{st.mastery_pct}%</span>
                <span className="metric-lbl">Demonstrated Mastery</span>
              </div>
              <div>
                <span className="metric-val">{st.projects_verified}</span>
                <span className="metric-lbl">Verified Projects</span>
              </div>
              <div>
                <span className="metric-val">{st.courses_completed}</span>
                <span className="metric-lbl">Courses Done</span>
              </div>
            </div>

            <button
              type="button"
              className="btn-inspect-full"
              onClick={() => onInspectStudent(st.student_id)}
            >
              Inspect Diagnostic Evidence
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   5. SKILL ASSESSMENTS VIEW
   ========================================================================= */
function AssessmentsView({ students }: { students: any[] }) {
  return (
    <div className="mentor-view-page">
      <div className="view-page-header">
        <div>
          <h2>Skill Assessments Monitoring</h2>
          <p>Diagnostic evaluations and proctored question accuracy across technical competencies</p>
        </div>
      </div>

      <div className="assessments-list-panel">
        <table className="mentor-data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Career Target</th>
              <th>Evaluations Completed</th>
              <th>Pass Threshold</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((st) => (
              <tr key={st.student_id}>
                <td><b>{st.name}</b></td>
                <td>{st.target_career_name}</td>
                <td>{st.assessments_completed || 4} modules</td>
                <td>80% Industry Benchmark</td>
                <td>
                  <span className="status-pill active">Verified Competent</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
  const [rating, setRating] = useState(5);
  const [strengths, setStrengths] = useState('');
  const [improvement, setImprovement] = useState('');
  const [comments, setComments] = useState('');

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;

    try {
      await api.submitProjectReview({
        student_id: selectedReview.student_id,
        project_id: selectedReview.project_id,
        skill_id: 'SK001',
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
                  <span className="p-student-name">{p.student_name}</span>
                  <h3 className="p-title">{p.project_name}</h3>
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
          <div className="empty-panel-state full-width">
            <p>No student projects awaiting review.</p>
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
   7. CAREER GUIDANCE VIEW
   ========================================================================= */
function CareerGuidanceView({ students, notify }: { students: any[]; notify: (msg: string) => void }) {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.student_id || 'U001');
  const [guidanceData, setGuidanceData] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [actionItem, setActionItem] = useState('');

  useEffect(() => {
    if (selectedStudentId) {
      api.getMentorCareerGuidance(selectedStudentId)
        .then(setGuidanceData)
        .catch(() => setGuidanceData(null));
    }
  }, [selectedStudentId]);

  const handleSaveGuidance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes) return;
    try {
      await api.saveMentorCareerGuidance(selectedStudentId, {
        notes,
        action_items: actionItem ? [actionItem] : [],
      });
      notify('Career guidance notes saved to student roadmap!');
      setNotes('');
      setActionItem('');
      const updated = await api.getMentorCareerGuidance(selectedStudentId);
      setGuidanceData(updated);
    } catch (err: any) {
      notify(`Error: ${err.message}`);
    }
  };

  return (
    <div className="mentor-view-page">
      <div className="view-page-header">
        <div>
          <h2>Career Guidance Workspace</h2>
          <p>Analyze target role requirements, resolve skill deficits, and record action plans</p>
        </div>
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="select-student-dropdown"
        >
          {students.map((st) => (
            <option key={st.student_id} value={st.student_id}>
              {st.name} ({st.target_career_name})
            </option>
          ))}
        </select>
      </div>

      {guidanceData && (
        <div className="guidance-two-col">
          {/* Left: Skill Gaps */}
          <div className="guidance-gaps-card">
            <h3>Target Role: {guidanceData.target_career_name}</h3>
            <p className="career-desc">{guidanceData.career_description}</p>

            <h4 style={{ marginTop: '1.25rem' }}>Core Competency Gaps</h4>
            <div className="gaps-list">
              {guidanceData.skill_gaps?.map((gap: any) => (
                <div key={gap.skill_id} className="gap-row-item">
                  <div className="gap-name">
                    <b>{gap.skill_name}</b>
                    <small>Required: {gap.required_level}</small>
                  </div>
                  <div className="gap-bar">
                    <div className="bar-track">
                      <div className="bar-val" style={{ width: `${gap.current_mastery}%` }} />
                    </div>
                  </div>
                  <span className={`gap-tag ${gap.gap_size > 0 ? 'deficit' : 'met'}`}>
                    {gap.gap_size > 0 ? `Deficit: -${gap.gap_size}%` : 'Competency Met'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Notes & Recommendations */}
          <div className="guidance-notes-card">
            <h3>Mentor Guidance & Action Items</h3>
            <form onSubmit={handleSaveGuidance} className="auth-form">
              <div className="form-group">
                <label>Personalized Guidance Notes</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Recommend study strategies, prioritize key milestones, and address skill bottlenecks..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Immediate Action Item</label>
                <input
                  type="text"
                  placeholder="e.g. Implement Transformer self-attention mechanism by next Friday"
                  value={actionItem}
                  onChange={(e) => setActionItem(e.target.value)}
                />
              </div>
              <button type="submit" className="primary-action-btn full purple-gradient">
                Save Guidance to Roadmap
              </button>
            </form>

            <div className="saved-notes-feed">
              <h4>Saved Guidance History</h4>
              {guidanceData.guidance_notes?.map((n: any) => (
                <div key={n.id} className="saved-note-box">
                  <small>{n.created_at}</small>
                  <p>{n.notes}</p>
                  {n.action_items && (
                    <div className="action-item-badge">Action: {n.action_items}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
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
  refreshData,
}: {
  conversations: any[];
  students: any[];
  notify: (msg: string) => void;
  refreshData: () => void;
}) {
  const [selectedStudentId, setSelectedStudentId] = useState(
    conversations[0]?.student_id || students[0]?.student_id || ''
  );
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<any[]>([]);

  const loadConversation = async (sid: string) => {
    setSelectedStudentId(sid);
    try {
      const msgs = await api.getMentorConversations(sid);
      setMessages(msgs);
    } catch (err) {
      console.warn('Failed loading messages:', err);
    }
  };

  useEffect(() => {
    if (selectedStudentId) {
      loadConversation(selectedStudentId);
    }
  }, [selectedStudentId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedStudentId) return;

    try {
      await api.sendMentorMessage({
        student_id: selectedStudentId,
        content: messageText.trim(),
      });
      setMessageText('');
      loadConversation(selectedStudentId);
      refreshData();
    } catch (err: any) {
      notify(`Failed to send message: ${err.message}`);
    }
  };

  return (
    <div className="mentor-view-page">
      <div className="view-page-header">
        <div>
          <h2>Student Messages</h2>
          <p>Direct communication and advice channels with your mentees</p>
        </div>
      </div>

      <div className="messaging-layout-card">
        {/* Left: Conversations List */}
        <div className="conversations-sidebar">
          {conversations.map((c) => (
            <div
              key={c.student_id}
              className={`conv-tab ${selectedStudentId === c.student_id ? 'active' : ''}`}
              onClick={() => loadConversation(c.student_id)}
            >
              <div className="conv-avatar">
                {c.student_name.split(' ').map((w: string) => w[0]).join('')}
              </div>
              <div className="conv-text">
                <span className="conv-name">{c.student_name}</span>
                <span className="conv-snippet">{c.latest_message}</span>
              </div>
              {c.unread_count > 0 && <span className="conv-badge">{c.unread_count}</span>}
            </div>
          ))}
        </div>

        {/* Right: Active Chat Thread */}
        <div className="chat-thread-container">
          <div className="chat-thread-header">
            <b>
              {conversations.find((c) => c.student_id === selectedStudentId)?.student_name ||
                'Select a Student'}
            </b>
          </div>

          <div className="chat-messages-area">
            {messages.map((m) => {
              const isMentor = m.sender_role === 'mentor';
              return (
                <div key={m.message_id} className={`chat-bubble-row ${isMentor ? 'sent' : 'received'}`}>
                  <div className={`chat-bubble ${isMentor ? 'mentor' : 'student'}`}>
                    <p>{m.content}</p>
                    <small>{m.created_at}</small>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-bar">
            <input
              type="text"
              placeholder="Type your message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
            <button type="submit" className="chat-send-btn">
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
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
   10. PROFILE VIEW
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
  const [title, setTitle] = useState(profile?.title || '');
  const [company, setCompany] = useState(profile?.company || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [linkedin, setLinkedin] = useState(profile?.linkedin_url || '');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateMentorProfile({
        name,
        title,
        company,
        bio,
        linkedin_url: linkedin,
      });
      notify('Mentor profile saved successfully!');
      refreshData();
    } catch (err: any) {
      notify(`Update failed: ${err.message}`);
    }
  };

  return (
    <div className="mentor-view-page">
      <div className="view-page-header">
        <div>
          <h2>Mentor Profile</h2>
          <p>Manage your public professional credentials, biography, and industry affiliation</p>
        </div>
      </div>

      <div className="mentor-profile-card">
        <form onSubmit={handleUpdate} className="auth-form">
          <div className="form-row-2">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Professional Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Company / Organization</label>
              <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="form-group">
              <label>LinkedIn URL</label>
              <input type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Biography & Mentoring Focus</label>
            <textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>

          <button type="submit" className="primary-action-btn purple-gradient">
            Update Profile Information
          </button>
        </form>
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

  const handleSave = async () => {
    try {
      await api.updateMentorProfile({ availability });
      notify(`Availability updated to '${availability}'`);
      refreshData();
    } catch (err: any) {
      notify(`Failed: ${err.message}`);
    }
  };

  return (
    <div className="mentor-view-page">
      <div className="view-page-header">
        <div>
          <h2>Settings & Availability</h2>
          <p>Control your mentorship availability and preferences</p>
        </div>
      </div>

      <div className="mentor-profile-card">
        <div className="form-group">
          <label>Mentorship Availability Status</label>
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
        </div>

        <button
          type="button"
          className="primary-action-btn purple-gradient"
          style={{ marginTop: '1.5rem' }}
          onClick={handleSave}
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}
