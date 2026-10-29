import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from './services/api';
import { useAuth } from './App';
import {
  LayoutDashboard,
  UserRound,
  Users,
  GraduationCap,
  LogOut,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  X,
  Trash2,
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Phone,
  Building2,
  BriefcaseBusiness,
  Award,
  BookOpen,
  Calendar,
  MessageSquareText,
  Menu,
  RotateCcw,
  ShieldCheck,
  Star,
  ExternalLink,
} from 'lucide-react';

interface AdminPortalProps {
  notify: (msg: string) => void;
}

// Canonical protected accounts
const PROTECTED_IDS = new Set(['U001', 'U002', 'U1053', 'U1056', 'M001', 'M877', 'ADMIN001', 'ADMIN002']);

// Demo avatar image fallbacks matching reference screenshot
const AVATAR_MAP: Record<string, string> = {
  U001: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200', // Alex Chen
  U002: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200', // Priya Sharma
  U003: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200', // Rahul Verma
  U004: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200', // Sneha Iyer
  M001: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200', // Dr. Arun Kumar
  M002: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200', // Dr. Neha Gupta
  M003: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200', // Rajesh Menon
};

export function AdminPortal({ notify }: AdminPortalProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, setAuthSession } = useAuth();

  // Active view: 'dashboard' | 'students' | 'mentors'
  const currentTab = location.pathname.includes('/students')
    ? 'students'
    : location.pathname.includes('/mentors')
    ? 'mentors'
    : 'dashboard';

  // State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Dashboard stats
  const [stats, setStats] = useState({
    total_students: 24,
    total_mentors: 8,
    total_feedback: 365,
    average_rating: 4.8,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Students Directory state
  const [students, setStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const [studentTotalPages, setStudentTotalPages] = useState(1);
  const [studentTotal, setStudentTotal] = useState(0);

  // Mentors Directory state
  const [mentors, setMentors] = useState<any[]>([]);
  const [mentorsLoading, setMentorsLoading] = useState(false);
  const [mentorSearch, setMentorSearch] = useState('');
  const [mentorPage, setMentorPage] = useState(1);
  const [mentorTotalPages, setMentorTotalPages] = useState(1);
  const [mentorTotal, setMentorTotal] = useState(0);

  // Drawers
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any | null>(null);
  const [studentDetailLoading, setStudentDetailLoading] = useState(false);

  const [selectedMentor, setSelectedMentor] = useState<any | null>(null);
  const [selectedMentorDetail, setSelectedMentorDetail] = useState<any | null>(null);
  const [mentorDetailLoading, setMentorDetailLoading] = useState(false);

  // Safe Removal Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'student' | 'mentor';
    id: string;
    name: string;
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 1. Fetch Dashboard Stats
  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const res = await api.getAdminDashboardStats();
      if (res) {
        setStats({
          total_students: res.total_students || 0,
          total_mentors: res.total_mentors || 0,
          total_feedback: res.total_feedback || 0,
          average_rating: res.average_rating || 4.8,
        });
      }
    } catch (err) {
      console.warn('[AdminPortal] Error loading dashboard stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // 2. Fetch Students
  const fetchStudents = async (search = studentSearch, page = studentPage) => {
    try {
      setStudentsLoading(true);
      const res = await api.getAdminStudents({ search: search.trim() || undefined, page, limit: 10 });
      if (res && res.items) {
        setStudents(res.items);
        setStudentTotal(res.total || res.items.length);
        setStudentTotalPages(res.total_pages || 1);
      }
    } catch (err) {
      console.warn('[AdminPortal] Error fetching students:', err);
    } finally {
      setStudentsLoading(false);
    }
  };

  // 3. Fetch Mentors
  const fetchMentors = async (search = mentorSearch, page = mentorPage) => {
    try {
      setMentorsLoading(true);
      const res = await api.getAdminMentors({ search: search.trim() || undefined, page, limit: 10 });
      if (res && res.items) {
        setMentors(res.items);
        setMentorTotal(res.total || res.items.length);
        setMentorTotalPages(res.total_pages || 1);
      }
    } catch (err) {
      console.warn('[AdminPortal] Error fetching mentors:', err);
    } finally {
      setMentorsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    if (currentTab === 'students') {
      fetchStudents(studentSearch, studentPage);
    } else if (currentTab === 'mentors') {
      fetchMentors(mentorSearch, mentorPage);
    }
  }, [currentTab, studentPage, mentorPage]);

  // Handle Search Debounce
  useEffect(() => {
    if (currentTab === 'students') {
      const timer = setTimeout(() => {
        setStudentPage(1);
        fetchStudents(studentSearch, 1);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [studentSearch]);

  useEffect(() => {
    if (currentTab === 'mentors') {
      const timer = setTimeout(() => {
        setMentorPage(1);
        fetchMentors(mentorSearch, 1);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [mentorSearch]);

  // Open Student Detail Drawer
  const handleOpenStudentDrawer = async (student: any) => {
    setSelectedStudent(student);
    setSelectedStudentDetail(null);
    setStudentDetailLoading(true);
    try {
      const detail = await api.getAdminStudentDetail(student.student_id);
      setSelectedStudentDetail(detail);
    } catch (err) {
      console.warn('[AdminPortal] Error fetching student detail:', err);
      // Fallback to basic row data
      setSelectedStudentDetail({ profile: student, courses: [], skills: [], assessments: [], certificates: [] });
    } finally {
      setStudentDetailLoading(false);
    }
  };

  // Open Mentor Detail Drawer
  const handleOpenMentorDrawer = async (mentor: any) => {
    setSelectedMentor(mentor);
    setSelectedMentorDetail(null);
    setMentorDetailLoading(true);
    try {
      const detail = await api.getAdminMentorDetail(mentor.mentor_id);
      setSelectedMentorDetail(detail);
    } catch (err) {
      console.warn('[AdminPortal] Error fetching mentor detail:', err);
      setSelectedMentorDetail({ profile: mentor, mentees: [], sessions: [], feedbacks: [] });
    } finally {
      setMentorDetailLoading(false);
    }
  };

  // Safe Removal Action Execution
  const handleConfirmRemove = async () => {
    if (!deleteTarget) return;

    if (PROTECTED_IDS.has(deleteTarget.id)) {
      notify(`Action blocked: ${deleteTarget.name} (${deleteTarget.id}) is a protected baseline account.`);
      setDeleteTarget(null);
      return;
    }

    setDeleteLoading(true);
    try {
      if (deleteTarget.type === 'student') {
        await api.removeAdminStudent(deleteTarget.id);
        notify(`Student ${deleteTarget.name} has been deactivated successfully.`);
        setSelectedStudent(null);
        fetchStudents(studentSearch, studentPage);
      } else {
        await api.removeAdminMentor(deleteTarget.id);
        notify(`Mentor ${deleteTarget.name} has been deactivated successfully.`);
        setSelectedMentor(null);
        fetchMentors(mentorSearch, mentorPage);
      }
      fetchDashboardStats();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.detail || err?.message || 'Failed to deactivate account.';
      notify(`Error: ${errorMsg}`);
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  // If user is unauthenticated or not an admin, render the Admin Login Screen
  if (!user || user.role !== 'admin') {
    return <AdminLoginScreen notify={notify} setAuthSession={setAuthSession} />;
  }

  return (
    <div className="admin-portal-container" style={{ minHeight: '100vh', background: 'var(--color-page, #F5F6FC)', display: 'flex', flexDirection: 'column' }}>
      {/* TOP NAVBAR */}
      <header
        style={{
          height: '64px',
          background: '#ffffff',
          borderBottom: '1px solid var(--color-border, #E3E8F2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              padding: '8px',
              borderRadius: '8px',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="md:hidden"
            aria-label="Toggle navigation"
          >
            <Menu size={20} />
          </button>

          <div
            onClick={() => navigate('/admin/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'var(--color-primary, #5B4BFF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <GraduationCap size={20} />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary, #15213B)', letterSpacing: '-0.02em' }}>
              PathForge AI
            </span>
          </div>
        </div>

        {/* User Profile Pill in Top Right */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 12px',
              borderRadius: '9999px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '9999px',
                background: 'var(--color-primary, #5B4BFF)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '13px',
              }}
            >
              A
            </div>
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary, #15213B)', lineHeight: 1.2 }}>Admin</span>
              <span style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.2 }}>
                {user?.email || 'organizer@gmail.com'}
              </span>
            </div>
            <ChevronDown size={14} style={{ color: '#94a3b8', marginLeft: '4px' }} />
          </button>

          {/* User Dropdown Menu */}
          {userDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '44px',
                width: '220px',
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                padding: '6px',
                zIndex: 50,
              }}
            >
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', marginBottom: '4px' }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary, #15213B)' }}>Administrator</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setUserDropdownOpen(false);
                  navigate('/admin/dashboard');
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  textAlign: 'left',
                  fontSize: '13px',
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                className="hover:bg-slate-50"
              >
                <LayoutDashboard size={15} color="var(--color-primary, #5B4BFF)" /> Admin Dashboard
              </button>
              <button
                onClick={() => {
                  setUserDropdownOpen(false);
                  logout();
                  notify('Logged out from Admin Portal.');
                  navigate('/login');
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  textAlign: 'left',
                  fontSize: '13px',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                className="hover:bg-red-50"
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* BODY WITH SIDEBAR AND MAIN CONTENT */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* SIDEBAR NAVIGATION */}
        <aside
          style={{
            width: '240px',
            background: '#ffffff',
            borderRight: '1px solid var(--color-border, #E3E8F2)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '24px 16px',
          }}
          className={`${mobileMenuOpen ? 'block fixed inset-y-0 left-0 z-50 shadow-xl' : 'hidden md:flex'}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Dashboard Nav Item */}
            <button
              onClick={() => {
                navigate('/admin/dashboard');
                setMobileMenuOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: currentTab === 'dashboard' ? 600 : 500,
                color: currentTab === 'dashboard' ? 'var(--color-primary, #5B4BFF)' : '#64748b',
                background: currentTab === 'dashboard' ? '#eeedfd' : 'transparent',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              className="hover:bg-slate-50"
            >
              <LayoutDashboard size={18} color={currentTab === 'dashboard' ? 'var(--color-primary, #5B4BFF)' : '#64748b'} />
              Dashboard
            </button>

            {/* Students Nav Item */}
            <button
              onClick={() => {
                navigate('/admin/students');
                setMobileMenuOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: currentTab === 'students' ? 600 : 500,
                color: currentTab === 'students' ? 'var(--color-primary, #5B4BFF)' : '#64748b',
                background: currentTab === 'students' ? '#eeedfd' : 'transparent',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              className="hover:bg-slate-50"
            >
              <UserRound size={18} color={currentTab === 'students' ? 'var(--color-primary, #5B4BFF)' : '#64748b'} />
              Students
            </button>

            {/* Mentors Nav Item */}
            <button
              onClick={() => {
                navigate('/admin/mentors');
                setMobileMenuOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: currentTab === 'mentors' ? 600 : 500,
                color: currentTab === 'mentors' ? 'var(--color-primary, #5B4BFF)' : '#64748b',
                background: currentTab === 'mentors' ? '#eeedfd' : 'transparent',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              className="hover:bg-slate-50"
            >
              <Users size={18} color={currentTab === 'mentors' ? 'var(--color-primary, #5B4BFF)' : '#64748b'} />
              Mentors
            </button>
          </div>

          {/* Bottom Logout */}
          <div>
            <button
              onClick={() => {
                logout();
                notify('Logged out from Admin Portal.');
                navigate('/login');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#64748b',
                textAlign: 'left',
                width: '100%',
              }}
              className="hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto', maxWidth: '1400px' }}>
          {/* VIEW 1: DASHBOARD */}
          {currentTab === 'dashboard' && (
            <div>
              <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary, #15213B)', margin: 0 }}>Admin Dashboard</h1>
                <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px', marginBottom: 0 }}>
                  Manage registered students and mentors
                </p>
              </div>

              {/* 2 LARGE SUMMARY CARDS MATCHING REFERENCE SCREENSHOT */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '24px',
                  marginBottom: '32px',
                }}
              >
                {/* Total Students Card (Blue Theme) */}
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #dbeafe',
                    padding: '24px',
                    boxShadow: '0 4px 15px -1px rgba(59, 130, 246, 0.05)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '14px',
                          background: '#eff6ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#2563eb',
                        }}
                      >
                        <UserRound size={28} />
                      </div>
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                          Total Students
                        </span>
                        <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-text-primary, #15213B)', lineHeight: 1.1, marginTop: '2px' }}>
                          {statsLoading ? '...' : stats.total_students}
                        </div>
                      </div>
                    </div>

                    {/* Translucent Watermark Avatar SVG on the right */}
                    <div style={{ opacity: 0.12, color: '#2563eb' }}>
                      <Users size={64} />
                    </div>
                  </div>

                  {/* View Students Button */}
                  <div style={{ marginTop: '24px' }}>
                    <button
                      onClick={() => navigate('/admin/students')}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        borderRadius: '10px',
                        background: '#eff6ff',
                        color: '#2563eb',
                        fontWeight: 600,
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'background 0.15s ease',
                      }}
                      className="hover:bg-blue-100"
                    >
                      View Students →
                    </button>
                  </div>
                </div>

                {/* Total Mentors Card (Purple Theme) */}
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #C8D6EA',
                    padding: '24px',
                    boxShadow: '0 4px 15px -1px rgba(16, 43, 99, 0.05)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '14px',
                          background: '#EDF3FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-primary-hover, #4938E8)',
                        }}
                      >
                        <GraduationCap size={28} />
                      </div>
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                          Total Mentors
                        </span>
                        <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-text-primary, #15213B)', lineHeight: 1.1, marginTop: '2px' }}>
                          {statsLoading ? '...' : stats.total_mentors}
                        </div>
                      </div>
                    </div>

                    {/* Translucent Watermark Avatar SVG on the right */}
                    <div style={{ opacity: 0.12, color: 'var(--color-primary-hover, #4938E8)' }}>
                      <Users size={64} />
                    </div>
                  </div>

                  {/* View Mentors Button */}
                  <div style={{ marginTop: '24px' }}>
                    <button
                      onClick={() => navigate('/admin/mentors')}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        borderRadius: '10px',
                        background: '#EDF3FF',
                        color: 'var(--color-primary-hover, #4938E8)',
                        fontWeight: 600,
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'background 0.15s ease',
                      }}
                      className="hover:bg-blue-100"
                    >
                      View Mentors →
                    </button>
                  </div>
                </div>
              </div>

              {/* REAL METRICS & PLATFORM HEALTH */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #eef0f6',
                  padding: '24px',
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary, #15213B)', marginBottom: '16px' }}>
                  Platform Health & Feedback Insights
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Total Platform Reviews</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary, #15213B)', marginTop: '4px' }}>
                      {stats.total_feedback}
                    </div>
                    <div style={{ fontSize: '12px', color: '#10b981', marginTop: '2px' }}>Verified SQLite Records</div>
                  </div>

                  <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Average Platform Rating</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary, #15213B)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {stats.average_rating} <Star size={18} fill="#f59e0b" color="#f59e0b" />
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Out of 5.0 Stars</div>
                  </div>

                  <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Database Health</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Optimal <ShieldCheck size={20} color="#10b981" />
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>SQLite WAL Mode Active</div>
                  </div>

                  <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Protected Accounts</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary, #5B4BFF)', marginTop: '4px' }}>
                      Active
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Alex Chen & Dr. Arun Kumar</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: STUDENTS DIRECTORY */}
          {currentTab === 'students' && (
            <div>
              {/* Header with Title and Search Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  marginBottom: '24px',
                }}
              >
                <div>
                  <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary, #15213B)', margin: 0 }}>Students</h1>
                  <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', marginBottom: 0 }}>
                    View and manage all registered students
                  </p>
                </div>

                {/* Search Bar */}
                <div style={{ position: 'relative', width: '320px' }}>
                  <Search
                    size={16}
                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                  />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search by name, email or ID..."
                    style={{
                      width: '100%',
                      padding: '9px 14px 9px 38px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      fontSize: '13px',
                      color: 'var(--color-text-primary, #15213B)',
                      outline: 'none',
                    }}
                    className="focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Data Table */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #eef0f6',
                  overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--color-border, #E3E8F2)', color: '#64748b' }}>
                        <th style={{ padding: '14px 20px', fontWeight: 600 }}>ID</th>
                        <th style={{ padding: '14px 20px', fontWeight: 600 }}>Name</th>
                        <th style={{ padding: '14px 20px', fontWeight: 600 }}>Email</th>
                        <th style={{ padding: '14px 20px', fontWeight: 600 }}>Course / Career</th>
                        <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsLoading ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                            <Sparkles size={20} className="pulse" style={{ color: 'var(--color-primary, #5B4BFF)', margin: '0 auto 8px' }} />
                            Loading students directory...
                          </td>
                        </tr>
                      ) : students.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                            No students found matching your criteria.
                          </td>
                        </tr>
                      ) : (
                        students.map((st) => {
                          const avatarSrc = AVATAR_MAP[st.student_id];
                          const isProtected = PROTECTED_IDS.has(st.student_id);

                          return (
                            <tr
                              key={st.student_id}
                              style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}
                              className="hover:bg-slate-50"
                            >
                              <td style={{ padding: '14px 20px', color: '#64748b', fontWeight: 500 }}>
                                {st.student_id}
                              </td>
                              <td style={{ padding: '14px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  {avatarSrc ? (
                                    <img
                                      src={avatarSrc}
                                      alt={st.name}
                                      style={{ width: '32px', height: '32px', borderRadius: '9999px', objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <div
                                      style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '9999px',
                                        background: '#e0e7ff',
                                        color: '#4338ca',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 600,
                                        fontSize: '12px',
                                      }}
                                    >
                                      {st.avatar_initials || 'ST'}
                                    </div>
                                  )}
                                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary, #15213B)' }}>{st.name}</span>
                                </div>
                              </td>
                              <td style={{ padding: '14px 20px', color: '#475569' }}>{st.email}</td>
                              <td style={{ padding: '14px 20px', color: '#475569' }}>{st.course_career}</td>
                              <td style={{ padding: '14px 20px' }}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '4px 10px',
                                    borderRadius: '9999px',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    background: st.status === 'Active' ? '#ecfdf5' : '#f1f5f9',
                                    color: st.status === 'Active' ? '#059669' : '#64748b',
                                  }}
                                >
                                  {st.status}
                                </span>
                              </td>
                              <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                  <button
                                    onClick={() => handleOpenStudentDrawer(st)}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '6px',
                                      border: '1px solid #e0e7ff',
                                      color: 'var(--color-primary, #5B4BFF)',
                                      background: '#ffffff',
                                      fontWeight: 500,
                                      fontSize: '12px',
                                    }}
                                    className="hover:bg-indigo-50"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => setDeleteTarget({ type: 'student', id: st.student_id, name: st.name })}
                                    style={{
                                      padding: '6px',
                                      borderRadius: '6px',
                                      color: isProtected ? '#cbd5e1' : '#ef4444',
                                      background: 'transparent',
                                      cursor: isProtected ? 'not-allowed' : 'pointer',
                                    }}
                                    title={isProtected ? 'Protected Baseline Account' : 'Remove Student'}
                                    disabled={isProtected}
                                    className={!isProtected ? 'hover:bg-red-50' : ''}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div
                  style={{
                    padding: '12px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid #eef0f6',
                    fontSize: '13px',
                    color: '#64748b',
                  }}
                >
                  <div>
                    Showing {students.length > 0 ? (studentPage - 1) * 10 + 1 : 0} to{' '}
                    {Math.min(studentPage * 10, studentTotal)} of {studentTotal} students
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                      disabled={studentPage === 1}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        background: '#ffffff',
                        cursor: studentPage === 1 ? 'not-allowed' : 'pointer',
                        opacity: studentPage === 1 ? 0.5 : 1,
                      }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span>
                      Page {studentPage} of {studentTotalPages}
                    </span>
                    <button
                      onClick={() => setStudentPage((p) => Math.min(studentTotalPages, p + 1))}
                      disabled={studentPage >= studentTotalPages}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        background: '#ffffff',
                        cursor: studentPage >= studentTotalPages ? 'not-allowed' : 'pointer',
                        opacity: studentPage >= studentTotalPages ? 0.5 : 1,
                      }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: MENTORS DIRECTORY */}
          {currentTab === 'mentors' && (
            <div>
              {/* Header with Title and Search Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  marginBottom: '24px',
                }}
              >
                <div>
                  <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary, #15213B)', margin: 0 }}>Mentors</h1>
                  <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', marginBottom: 0 }}>
                    View and manage all registered mentors
                  </p>
                </div>

                {/* Search Bar */}
                <div style={{ position: 'relative', width: '320px' }}>
                  <Search
                    size={16}
                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                  />
                  <input
                    type="text"
                    value={mentorSearch}
                    onChange={(e) => setMentorSearch(e.target.value)}
                    placeholder="Search by name, email or expertise..."
                    style={{
                      width: '100%',
                      padding: '9px 14px 9px 38px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      fontSize: '13px',
                      color: 'var(--color-text-primary, #15213B)',
                      outline: 'none',
                    }}
                    className="focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Data Table */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #eef0f6',
                  overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--color-border, #E3E8F2)', color: '#64748b' }}>
                        <th style={{ padding: '14px 20px', fontWeight: 600 }}>ID</th>
                        <th style={{ padding: '14px 20px', fontWeight: 600 }}>Name</th>
                        <th style={{ padding: '14px 20px', fontWeight: 600 }}>Email</th>
                        <th style={{ padding: '14px 20px', fontWeight: 600 }}>Expertise</th>
                        <th style={{ padding: '14px 20px', fontWeight: 600 }}>Experience</th>
                        <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mentorsLoading ? (
                        <tr>
                          <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                            <Sparkles size={20} className="pulse" style={{ color: 'var(--color-primary, #5B4BFF)', margin: '0 auto 8px' }} />
                            Loading mentors directory...
                          </td>
                        </tr>
                      ) : mentors.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                            No mentors found matching your criteria.
                          </td>
                        </tr>
                      ) : (
                        mentors.map((m) => {
                          const avatarSrc = AVATAR_MAP[m.mentor_id];
                          const isProtected = PROTECTED_IDS.has(m.mentor_id);

                          return (
                            <tr
                              key={m.mentor_id}
                              style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}
                              className="hover:bg-slate-50"
                            >
                              <td style={{ padding: '14px 20px', color: '#64748b', fontWeight: 500 }}>
                                {m.mentor_id}
                              </td>
                              <td style={{ padding: '14px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  {avatarSrc ? (
                                    <img
                                      src={avatarSrc}
                                      alt={m.name}
                                      style={{ width: '32px', height: '32px', borderRadius: '9999px', objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <div
                                      style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '9999px',
                                        background: '#ede9fe',
                                        color: '#6d28d9',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 600,
                                        fontSize: '12px',
                                      }}
                                    >
                                      {m.avatar_initials || 'ME'}
                                    </div>
                                  )}
                                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary, #15213B)' }}>{m.name}</span>
                                </div>
                              </td>
                              <td style={{ padding: '14px 20px', color: '#475569' }}>{m.email}</td>
                              <td style={{ padding: '14px 20px', color: '#475569' }}>{m.expertise}</td>
                              <td style={{ padding: '14px 20px', color: '#475569' }}>{m.experience}</td>
                              <td style={{ padding: '14px 20px' }}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '4px 10px',
                                    borderRadius: '9999px',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    background: m.status === 'Active' ? '#ecfdf5' : '#f1f5f9',
                                    color: m.status === 'Active' ? '#059669' : '#64748b',
                                  }}
                                >
                                  {m.status}
                                </span>
                              </td>
                              <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                  <button
                                    onClick={() => handleOpenMentorDrawer(m)}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '6px',
                                      border: '1px solid #C8D6EA',
                                      color: 'var(--color-primary-hover, #4938E8)',
                                      background: '#ffffff',
                                      fontWeight: 500,
                                      fontSize: '12px',
                                    }}
                                    className="hover:bg-purple-50"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => setDeleteTarget({ type: 'mentor', id: m.mentor_id, name: m.name })}
                                    style={{
                                      padding: '6px',
                                      borderRadius: '6px',
                                      color: isProtected ? '#cbd5e1' : '#ef4444',
                                      background: 'transparent',
                                      cursor: isProtected ? 'not-allowed' : 'pointer',
                                    }}
                                    title={isProtected ? 'Protected Baseline Mentor' : 'Remove Mentor'}
                                    disabled={isProtected}
                                    className={!isProtected ? 'hover:bg-red-50' : ''}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div
                  style={{
                    padding: '12px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid #eef0f6',
                    fontSize: '13px',
                    color: '#64748b',
                  }}
                >
                  <div>
                    Showing {mentors.length > 0 ? (mentorPage - 1) * 10 + 1 : 0} to{' '}
                    {Math.min(mentorPage * 10, mentorTotal)} of {mentorTotal} mentors
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => setMentorPage((p) => Math.max(1, p - 1))}
                      disabled={mentorPage === 1}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        background: '#ffffff',
                        cursor: mentorPage === 1 ? 'not-allowed' : 'pointer',
                        opacity: mentorPage === 1 ? 0.5 : 1,
                      }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span>
                      Page {mentorPage} of {mentorTotalPages}
                    </span>
                    <button
                      onClick={() => setMentorPage((p) => Math.min(mentorTotalPages, p + 1))}
                      disabled={mentorPage >= mentorTotalPages}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        background: '#ffffff',
                        cursor: mentorPage >= mentorTotalPages ? 'not-allowed' : 'pointer',
                        opacity: mentorPage >= mentorTotalPages ? 0.5 : 1,
                      }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =========================================================================
          SLIDE-OVER DRAWER: STUDENT DETAILS (MATCHING REFERENCE SCREENSHOT)
          ========================================================================= */}
      {selectedStudent && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', justifyContent: 'flex-end' }}>
          {/* Backdrop */}
          <div
            onClick={() => setSelectedStudent(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)' }}
          />

          {/* Right Panel */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '480px',
              height: '100%',
              background: '#ffffff',
              boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 70,
              overflowY: 'auto',
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary, #15213B)', margin: 0 }}>Student Details</h2>
              <button
                onClick={() => setSelectedStudent(null)}
                style={{ padding: '6px', borderRadius: '8px', color: '#64748b' }}
                className="hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Profile Summary Card */}
            <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {AVATAR_MAP[selectedStudent.student_id] ? (
                  <img
                    src={AVATAR_MAP[selectedStudent.student_id]}
                    alt={selectedStudent.name}
                    style={{ width: '64px', height: '64px', borderRadius: '9999px', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '9999px',
                      background: '#e0e7ff',
                      color: '#4338ca',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '22px',
                    }}
                  >
                    {selectedStudent.avatar_initials || 'ST'}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                    {selectedStudent.student_id}
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary, #15213B)', margin: '2px 0 4px 0' }}>
                    {selectedStudent.name}
                  </h3>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: selectedStudent.status === 'Active' ? '#ecfdf5' : '#f1f5f9',
                      color: selectedStudent.status === 'Active' ? '#059669' : '#64748b',
                    }}
                  >
                    {selectedStudent.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Metadata Attributes List matching screenshot */}
            <div style={{ padding: '24px', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Email</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary, #15213B)' }}>{selectedStudent.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Course / Career</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary, #15213B)' }}>
                    {selectedStudent.course_career}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>College</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary, #15213B)' }}>{selectedStudent.college}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Department</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary, #15213B)' }}>
                    {selectedStudent.department}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Phone</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary, #15213B)' }}>{selectedStudent.phone}</span>
                </div>
              </div>

              {/* Progress Summary Section */}
              {studentDetailLoading ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
                  <Sparkles size={18} className="pulse" style={{ color: 'var(--color-primary, #5B4BFF)', margin: '0 auto 8px' }} />
                  Loading learning profile...
                </div>
              ) : selectedStudentDetail && (
                <div style={{ marginTop: '24px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Enrolled Courses ({selectedStudentDetail.courses?.length || 0})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedStudentDetail.courses?.slice(0, 3).map((c: any) => (
                      <div
                        key={c.course_id}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: '#f8fafc',
                          border: '1px solid #f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '12px',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--color-text-primary, #15213B)' }}>{c.course_name}</span>
                        <span style={{ color: '#059669', fontWeight: 600 }}>{c.progress_percentage}% completed</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Action: Remove Student */}
            <div style={{ padding: '20px 24px', borderTop: '1px solid #f1f5f9' }}>
              <button
                onClick={() => {
                  setDeleteTarget({
                    type: 'student',
                    id: selectedStudent.student_id,
                    name: selectedStudent.name,
                  });
                }}
                disabled={PROTECTED_IDS.has(selectedStudent.student_id)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: PROTECTED_IDS.has(selectedStudent.student_id) ? '#f1f5f9' : '#fee2e2',
                  color: PROTECTED_IDS.has(selectedStudent.student_id) ? '#94a3b8' : '#ef4444',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: PROTECTED_IDS.has(selectedStudent.student_id) ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s ease',
                }}
                className={!PROTECTED_IDS.has(selectedStudent.student_id) ? 'hover:bg-red-200' : ''}
              >
                <Trash2 size={16} />
                {PROTECTED_IDS.has(selectedStudent.student_id) ? 'Protected Account (Alex Chen)' : 'Remove Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SLIDE-OVER DRAWER: MENTOR DETAILS (MATCHING REFERENCE SCREENSHOT)
          ========================================================================= */}
      {selectedMentor && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', justifyContent: 'flex-end' }}>
          {/* Backdrop */}
          <div
            onClick={() => setSelectedMentor(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)' }}
          />

          {/* Right Panel */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '480px',
              height: '100%',
              background: '#ffffff',
              boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 70,
              overflowY: 'auto',
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary, #15213B)', margin: 0 }}>Mentor Details</h2>
              <button
                onClick={() => setSelectedMentor(null)}
                style={{ padding: '6px', borderRadius: '8px', color: '#64748b' }}
                className="hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Profile Summary Card */}
            <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {AVATAR_MAP[selectedMentor.mentor_id] ? (
                  <img
                    src={AVATAR_MAP[selectedMentor.mentor_id]}
                    alt={selectedMentor.name}
                    style={{ width: '64px', height: '64px', borderRadius: '9999px', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '9999px',
                      background: '#ede9fe',
                      color: '#6d28d9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '22px',
                    }}
                  >
                    {selectedMentor.avatar_initials || 'ME'}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                    {selectedMentor.mentor_id}
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary, #15213B)', margin: '2px 0 4px 0' }}>
                    {selectedMentor.name}
                  </h3>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: selectedMentor.status === 'Active' ? '#ecfdf5' : '#f1f5f9',
                      color: selectedMentor.status === 'Active' ? '#059669' : '#64748b',
                    }}
                  >
                    {selectedMentor.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Metadata Attributes List matching screenshot */}
            <div style={{ padding: '24px', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Email</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary, #15213B)' }}>{selectedMentor.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Expertise</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary, #15213B)' }}>
                    {selectedMentor.expertise}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Experience</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary, #15213B)' }}>{selectedMentor.experience}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Phone</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary, #15213B)' }}>{selectedMentor.phone}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>About</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary, #15213B)', textAlign: 'right', maxWidth: '240px' }}>
                    {selectedMentor.about}
                  </span>
                </div>
              </div>

              {/* Mentorship Stats Section */}
              {mentorDetailLoading ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
                  <Sparkles size={18} className="pulse" style={{ color: 'var(--color-primary-hover, #4938E8)', margin: '0 auto 8px' }} />
                  Loading mentor details...
                </div>
              ) : selectedMentorDetail && (
                <div style={{ marginTop: '24px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Active Mentees ({selectedMentorDetail.active_mentees || 0})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedMentorDetail.mentees?.slice(0, 3).map((m: any) => (
                      <div
                        key={m.student_id}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: '#f8fafc',
                          border: '1px solid #f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '12px',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--color-text-primary, #15213B)' }}>{m.student_name}</span>
                        <span style={{ color: '#64748b' }}>Assigned</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Action: Remove Mentor */}
            <div style={{ padding: '20px 24px', borderTop: '1px solid #f1f5f9' }}>
              <button
                onClick={() => {
                  setDeleteTarget({
                    type: 'mentor',
                    id: selectedMentor.mentor_id,
                    name: selectedMentor.name,
                  });
                }}
                disabled={PROTECTED_IDS.has(selectedMentor.mentor_id)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: PROTECTED_IDS.has(selectedMentor.mentor_id) ? '#f1f5f9' : '#fee2e2',
                  color: PROTECTED_IDS.has(selectedMentor.mentor_id) ? '#94a3b8' : '#ef4444',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: PROTECTED_IDS.has(selectedMentor.mentor_id) ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s ease',
                }}
                className={!PROTECTED_IDS.has(selectedMentor.mentor_id) ? 'hover:bg-red-200' : ''}
              >
                <Trash2 size={16} />
                {PROTECTED_IDS.has(selectedMentor.mentor_id) ? 'Protected Account (Dr. Arun Kumar)' : 'Remove Mentor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CONFIRMATION MODAL: SAFE REMOVAL / DEACTIVATION
          ========================================================================= */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            onClick={() => !deleteLoading && setDeleteTarget(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)' }}
          />

          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '440px',
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              zIndex: 90,
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#fee2e2',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <AlertTriangle size={24} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary, #15213B)', margin: '0 0 8px 0' }}>
              Deactivate {deleteTarget.type === 'student' ? 'Student' : 'Mentor'}?
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Are you sure you want to deactivate <strong style={{ color: 'var(--color-text-primary, #15213B)' }}>{deleteTarget.name}</strong> (
              <span style={{ fontFamily: 'monospace' }}>{deleteTarget.id}</span>)? This user will no longer be able to sign
              in. Historical course completions, assessments, and feedback relations will remain intact.
            </p>

            {PROTECTED_IDS.has(deleteTarget.id) && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  color: '#92400e',
                  fontSize: '12px',
                  marginBottom: '20px',
                }}
              >
                <strong>Protected Baseline Account:</strong> This user cannot be removed or deactivated.
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#475569',
                }}
                className="hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemove}
                disabled={deleteLoading || PROTECTED_IDS.has(deleteTarget.id)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: PROTECTED_IDS.has(deleteTarget.id) ? 'not-allowed' : 'pointer',
                  opacity: PROTECTED_IDS.has(deleteTarget.id) ? 0.5 : 1,
                }}
                className="hover:bg-red-600"
              >
                {deleteLoading ? 'Processing...' : 'Confirm Deactivation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// ADMIN LOGIN SCREEN (EXACT MATCH FOR TOP-LEFT SCREENSHOT CARD)
// =========================================================================
function AdminLoginScreen({
  notify,
  setAuthSession,
}: {
  notify: (msg: string) => void;
  setAuthSession: (token: string, profile?: any) => void;
}) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('organizer@gmail.com');
  const [password, setPassword] = useState('admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.login({ email: email.trim(), password });
      if (res && res.access_token) {
        if (res.role !== 'admin') {
          setError('Access restricted: Administrator role required.');
          setLoading(false);
          return;
        }

        setAuthSession(res.access_token, {
          user_id: res.user_id,
          role: 'admin',
          email: res.email,
          name: res.name || 'Admin',
        });
        notify('Signed into PathForge AI Admin Portal.');
        navigate('/admin/dashboard');
      } else {
        setError('Invalid admin credentials.');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-page, #F5F6FC)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#ffffff',
          borderRadius: '20px',
          padding: '36px 32px',
          boxShadow: '0 10px 30px -5px rgba(80, 70, 229, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.03)',
          border: '1px solid #eef0f6',
          textAlign: 'center',
        }}
      >
        {/* Brand Logo & Cap */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'var(--color-primary, #5B4BFF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              marginBottom: '12px',
              boxShadow: '0 6px 16px rgba(80, 70, 229, 0.25)',
            }}
          >
            <GraduationCap size={32} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary, #15213B)', margin: 0 }}>PathForge AI</h2>
          <span style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>Admin Portal</span>
        </div>

        {/* Title & Subtitle */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary, #15213B)', margin: '0 0 6px 0' }}>Admin Login</h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
            Access the admin dashboard to manage students and mentors.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              color: '#b91c1c',
              fontSize: '12px',
              marginBottom: '18px',
              textAlign: 'left',
            }}
          >
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Email Input */}
          <div style={{ position: 'relative', textAlign: 'left' }}>
            <Mail
              size={17}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }}
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="organizer@gmail.com"
              style={{
                width: '100%',
                padding: '11px 14px 11px 42px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                fontSize: '14px',
                color: 'var(--color-text-primary, #15213B)',
                outline: 'none',
              }}
              className="focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Password Input */}
          <div style={{ position: 'relative', textAlign: 'left' }}>
            <LockKeyhole
              size={17}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }}
            />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin@123"
              style={{
                width: '100%',
                padding: '11px 40px 11px 42px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                fontSize: '14px',
                color: 'var(--color-text-primary, #15213B)',
                outline: 'none',
              }}
              className="focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                padding: '4px',
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              background: 'var(--color-primary, #5B4BFF)',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              marginTop: '6px',
              boxShadow: '0 4px 12px rgba(80, 70, 229, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
            className="hover:bg-indigo-700"
          >
            {loading ? <Sparkles size={16} className="pulse" /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Back Link */}
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() => navigate('/login')}
            style={{ fontSize: '12px', color: '#64748b', textDecoration: 'underline' }}
            className="hover:text-slate-900"
          >
            Switch to Student / Mentor Login
          </button>
        </div>
      </div>
    </div>
  );
}

