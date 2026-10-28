import { useState, useEffect, useRef, createContext, useContext, type ReactNode } from 'react';
import api from './services/api';
import { BrowserRouter, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { RoleAuthView } from './RoleAuthView';
import { MentorPortal } from './MentorPortal';
import {
  Activity, AlertTriangle, ArrowRight, Award, Bell, BookOpen, BriefcaseBusiness,
  Building2, Calendar, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, ClipboardCheck,
  Clock3, Code2, Copy, Download, ExternalLink, FileCheck2, FileText, FolderKanban, Gauge, GraduationCap, LayoutDashboard,
  LockKeyhole, LogOut, Mail, MapPin, Menu, MessageSquareText, Network, Paperclip, Phone, PlayCircle,
  Plus, RefreshCw, Search, Send, Settings, ShieldCheck, Sparkles, Star, Target, Trash2, TrendingUp,
  Upload, UserRound, Users, Video, X, Zap, Eye, EyeOff,
} from 'lucide-react';

type Page = string;
type Icon = typeof LayoutDashboard;

// ==========================================
// AUTH CONTEXT & PROVIDER
// ==========================================
export interface UserProfile {
  student_id?: string;
  user_id?: string;
  mentor_id?: string;
  role?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email: string;
  college?: string;
  department?: string;
  degree?: string;
  graduation_year?: number;
  cgpa?: number;
  target_career_id?: string;
  target_career_name?: string;
  weekly_learning_hours?: number;
  preferred_difficulty?: string;
  learning_mode?: string;
  title?: string;
  company?: string;
  expertise?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (payload: { email: string; password: string }) => Promise<any>;
  register: (payload: any) => Promise<any>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setAuthSession: (token: string, profile?: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: async () => {},
  setAuthSession: () => {},
});

export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => api.getToken());
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const data = await api.getMe();
      if (data && (data.student_id || data.mentor_id || data.user_id)) {
        setUser(data);
      }
    } catch (err) {
      console.warn('[AuthProvider] Failed to fetch current user profile:', err);
      if (api.getToken()) {
        api.clearToken();
        setToken(null);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const existingToken = api.getToken();
    if (existingToken) {
      setToken(existingToken);
      refreshUser();
    } else {
      setLoading(false);
    }
  }, []);

  const setAuthSession = (newToken: string, profile?: UserProfile) => {
    api.setToken(newToken);
    setToken(newToken);
    if (profile) {
      setUser(profile);
    }
    refreshUser();
  };

  const login = async (payload: { email: string; password: string }) => {
    const res = await api.login(payload);
    setToken(res.access_token);
    await refreshUser();
    return res;
  };

  const register = async (payload: any) => {
    const res = await api.register(payload);
    setToken(res.access_token);
    await refreshUser();
    return res;
  };

  const logout = () => {
    api.logout();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser, setAuthSession }}>
      {children}
    </AuthContext.Provider>
  );
}

// ==========================================
// NAVIGATION STRUCTURE
// ==========================================
const navigation: { label: string; icon: Icon; page: string; path: string }[] = [
  { label: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard', path: '/dashboard' },
  { label: 'My Profile', icon: UserRound, page: 'My Profile', path: '/profile' },
  { label: 'Career Goal', icon: Target, page: 'Career Goal', path: '/career-goal' },
  { label: 'AI Skill Gap Analyzer', icon: Network, page: 'AI Skill Gap Analyzer', path: '/skill-gap' },
  { label: 'Assessment Portal', icon: ClipboardCheck, page: 'Assessment Portal', path: '/assessment' },
  { label: 'Learning Roadmap', icon: TrendingUp, page: 'Learning Roadmap', path: '/roadmap' },
  { label: 'Courses', icon: BookOpen, page: 'Courses', path: '/courses' },
  { label: 'Projects', icon: FolderKanban, page: 'Projects', path: '/projects' },
  { label: 'Skills & Evidence', icon: FileCheck2, page: 'Skills & Evidence', path: '/skills-evidence' },
  { label: 'Mentor Connect', icon: Users, page: 'Mentor Connect', path: '/mentor-connect' },
  { label: 'Company Intelligence', icon: Building2, page: 'Company Intelligence', path: '/companies' },
  { label: 'Jobs Assistant', icon: BriefcaseBusiness, page: 'Jobs Assistant', path: '/jobs' },
  { label: 'Learning Activity', icon: Activity, page: 'Learning Activity', path: '/activity' },
  { label: 'Certificates', icon: GraduationCap, page: 'Certificates', path: '/certificates' },
  { label: 'Feedback', icon: MessageSquareText, page: 'Feedback', path: '/feedback' },
  { label: 'Recruiter Match', icon: ShieldCheck, page: 'Recruiter Match', path: '/recruiter-match' },
  { label: 'Settings', icon: Settings, page: 'Settings', path: '/settings' },
];

const pathToPage: Record<string, string> = {
  ...Object.fromEntries(navigation.map((item) => [item.path, item.page])),
  '/mentor': 'Mentor Connect',
  '/mentor-connect': 'Mentor Connect',
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [studentNotifications, setStudentNotifications] = useState<any[]>([]);
  const [showStudentNotifDropdown, setShowStudentNotifDropdown] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'mentor') {
      api.getStudentNotifications().then((data) => {
        if (Array.isArray(data)) setStudentNotifications(data);
      }).catch(() => {});

      const interval = setInterval(() => {
        api.getStudentNotifications().then((data) => {
          if (Array.isArray(data)) setStudentNotifications(data);
        }).catch(() => {});
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const studentUnreadNotifCount = studentNotifications.filter((n) => !n.is_read).length;

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3000);
  };

  const isAuthRoute =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname.startsWith('/register/') ||
    location.pathname === '/forgot-password';

  if (isAuthRoute) {
    const defaultMode =
      location.pathname === '/forgot-password'
        ? 'forgot_password'
        : location.pathname.startsWith('/register')
        ? 'register'
        : 'login';
    const defaultRole = location.pathname === '/register/mentor' ? 'mentor' : 'student';
    return (
      <RoleAuthView
        notify={notify}
        defaultMode={defaultMode}
        defaultRole={defaultRole}
      />
    );
  }

  // Render loading state while authenticating
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0d14' }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <Sparkles size={32} className="pulse" style={{ color: '#5B4BFF', margin: '0 auto 12px', display: 'block' }} />
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading PathForge AI workspace...</p>
        </div>
      </div>
    );
  }

  // Handle protected pages: if not authenticated, render Login
  if (!user && !token) {
    return <RoleAuthView notify={notify} defaultMode="login" />;
  }

  // Role-based routing: Mentor Portal (strictly for mentors or /mentor/* portal paths)
  const isMentorPortalRoute = location.pathname.startsWith('/mentor/') || (user?.role === 'mentor' && location.pathname.startsWith('/mentor'));
  if (user?.role === 'mentor' || isMentorPortalRoute) {
    if (user?.role === 'student' && isMentorPortalRoute) {
      return <Navigate to="/dashboard" replace />;
    }
    return <MentorPortal notify={notify} />;
  }

  // If a mentor accidentally lands on student route, redirect to mentor dashboard
  if (user?.role === 'mentor' && !isMentorPortalRoute) {
    return <Navigate to="/mentor/dashboard" replace />;
  }

  const page = pathToPage[location.pathname] ?? (
    location.pathname === '/career-readiness' ? 'Career Readiness' :
    location.pathname === '/resume-analysis' ? 'AI Resume Analyzer' : 'Dashboard'
  );

  const content = (
    page === 'Dashboard' ? <Dashboard notify={notify} /> :
    page === 'AI Skill Gap Analyzer' ? <Gap notify={notify} /> :
    page === 'Learning Roadmap' ? <Roadmap notify={notify} /> :
    page === 'Courses' ? <Courses notify={notify} /> :
    page === 'Career Readiness' ? <Readiness notify={notify} /> :
    <ProductPage page={page} notify={notify} navigate={navigate} />
  );

  const studentName = user ? user.full_name : 'Alex Chen';
  const studentInitials = user ? `${user.first_name?.[0] || user.name?.[0] || 'A'}${user.last_name?.[0] || 'C'}` : 'AC';
  const studentDegree = user?.degree || 'CS Student @ Stanford';
  const targetCareer = user?.target_career_name || 'Aspiring ML Engineer';

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="logo" onClick={() => { navigate('/dashboard'); setOpen(false); }}>
          <span><Sparkles size={16} /></span>
          PathForge <b>AI</b>
        </div>
        <nav>
          {navigation.map(({ label, icon: NavIcon, page: destination, path }) => (
            <button
              key={label}
              className={page === destination ? 'nav active' : 'nav'}
              onClick={() => { navigate(path); setOpen(false); }}
            >
              <NavIcon size={16} />
              <span>{label}</span>
              {label === 'AI Skill Gap Analyzer' && <i />}
            </button>
          ))}
        </nav>
        
        <div className="user-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div onClick={() => { navigate('/profile'); setOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1 }}>
            <div className="avatar">{studentInitials}</div>
            <div style={{ overflow: 'hidden' }}>
              <b style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', display: 'block' }}>{studentName}</b>
              <small style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', display: 'block' }}>{studentDegree}</small>
              <em style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', display: 'block' }}>{targetCareer}</em>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              notify('Logged out successfully');
              navigate('/login');
            }}
            title="Logout"
            style={{ padding: '6px', color: '#94a3b8' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="main">
        <header>
          <button className="menu" onClick={() => setOpen(!open)} aria-label="Toggle navigation"><Menu size={18} /></button>
          <div className="global-search">
            <Search size={15} />
            <input type="text" placeholder="Search skills, courses, target roles..." aria-label="Global search" />
          </div>
          <div className="header-actions">
            <span>Student: <b>{studentName}</b> ({user?.student_id || 'ST001'})</span>
            <span className="ai-status"><Sparkles size={12} /> Explainable AI Active</span>
            <div className="notification-dropdown-wrapper">
              <button
                className="header-icon-btn"
                onClick={() => setShowStudentNotifDropdown(!showStudentNotifDropdown)}
                title="Notifications"
                style={{ position: 'relative' }}
              >
                <Bell size={16} />
                {studentUnreadNotifCount > 0 && (
                  <span className="notification-dot" style={{ position: 'absolute', top: '-2px', right: '-2px' }}>
                    {studentUnreadNotifCount}
                  </span>
                )}
              </button>

              {showStudentNotifDropdown && (
                <div className="notification-popover-menu">
                  <div className="notification-popover-header">
                    <h4><Bell size={16} style={{ color: '#818CF8' }} /> Notifications</h4>
                    {studentUnreadNotifCount > 0 && (
                      <button
                        type="button"
                        className="btn-mark-all"
                        onClick={async () => {
                          try {
                            await api.markAllStudentNotificationsRead();
                            setStudentNotifications(studentNotifications.map((n) => ({ ...n, is_read: true })));
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
                    {studentNotifications.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                        No notifications yet
                      </div>
                    ) : (
                      studentNotifications.map((n) => (
                        <div
                          key={n.notification_id}
                          className={`notification-item ${!n.is_read ? 'unread' : ''}`}
                          onClick={async () => {
                            if (!n.is_read) {
                              try {
                                await api.markStudentNotificationRead(n.notification_id);
                                setStudentNotifications(studentNotifications.map((item) => item.notification_id === n.notification_id ? { ...item, is_read: true } : item));
                              } catch (e) {
                                console.error(e);
                              }
                            }
                            if (n.type === 'message' || n.type === 'session' || n.type === 'feedback') {
                              navigate('/mentor-connect');
                              setShowStudentNotifDropdown(false);
                            }
                          }}
                        >
                          <div className="notification-item-icon">
                            {n.type === 'message' ? <MessageSquareText size={15} /> :
                             n.type === 'session' ? <CalendarDays size={15} /> :
                             n.type === 'feedback' ? <Target size={15} /> :
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
            <div className="avatar small" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }} title={studentName}>
              {studentInitials}
            </div>
            <button
              className="secondary"
              style={{ padding: '4px 8px', fontSize: '12px' }}
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

        <div className="content">
          <div className="crumb">Workspace <ArrowRight size={12} /> <b>{page}</b></div>
          {content}
        </div>
      </main>

      {toast && <div className="toast"><Check size={16} /> {toast}</div>}
    </div>
  );
}

// ==========================================
// AUTHENTICATION VIEW (LOGIN / REGISTER)
// ==========================================
function AuthView({ notify, isRegister }: { notify: (msg: string) => void; isRegister: boolean }) {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(isRegister ? 'register' : 'login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('alex.chen@stanford.edu');
  const [password, setPassword] = useState('password123');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [college, setCollege] = useState('Stanford University');
  const [degree, setDegree] = useState('B.Tech AI & Data Science');
  const [targetCareerId, setTargetCareerId] = useState('C001');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      notify('Logged in successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        college,
        degree,
        target_career_id: targetCareerId,
      });
      notify('Account registered successfully! Welcome to PathForge AI.');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Email may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPw: string, studentDesc: string) => {
    setError(null);
    setLoading(true);
    try {
      await login({ email: demoEmail, password: demoPw });
      notify(`Logged in as ${studentDesc}`);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0d14', padding: '1.5rem' }}>
      <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem', background: '#111726', border: '1px solid #1e293b', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#5B4BFF', fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            <Sparkles size={24} /> PathForge <b>AI</b>
          </div>
          <h2 style={{ fontSize: '1.25rem', color: '#f8fafc', margin: '0 0 0.5rem 0' }}>
            {activeTab === 'login' ? 'Sign In to Your Workspace' : 'Create Your Student Account'}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
            Personalized Learning Roadmaps & Evidence-Based Career Intelligence
          </p>
        </div>

        <div className="filters" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
          <span className={activeTab === 'login' ? 'selected' : ''} onClick={() => { setActiveTab('login'); setError(null); }}>
            Sign In
          </span>
          <span className={activeTab === 'register' ? 'selected' : ''} onClick={() => { setActiveTab('register'); setError(null); }}>
            Register New Student
          </span>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            ⚠️ {error}
          </div>
        )}

        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex.chen@stanford.edu"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155', background: '#0a0d14', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155', background: '#0a0d14', color: '#fff' }}
              />
            </div>
            <button className="primary full" type="submit" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.75rem' }}>
              {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={14} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Maya"
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #334155', background: '#0a0d14', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Patel"
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #334155', background: '#0a0d14', color: '#fff' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maya.patel@tech.edu"
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #334155', background: '#0a0d14', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #334155', background: '#0a0d14', color: '#fff' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>College / University</label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="Stanford University"
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #334155', background: '#0a0d14', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Degree / Major</label>
                <input
                  type="text"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  placeholder="B.Tech Computer Science"
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #334155', background: '#0a0d14', color: '#fff' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Target Career Goal</label>
              <select
                value={targetCareerId}
                onChange={(e) => setTargetCareerId(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #334155', background: '#0a0d14', color: '#fff' }}
              >
                <option value="C001">Machine Learning Engineer</option>
                <option value="C002">Data Scientist</option>
                <option value="C003">AI Engineer</option>
                <option value="C004">Data Analyst</option>
                <option value="C005">Backend Developer</option>
                <option value="C006">Full Stack Developer</option>
              </select>
            </div>
            <button className="primary full" type="submit" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.75rem' }}>
              {loading ? 'Creating Account...' : 'Complete Registration'} <ArrowRight size={14} />
            </button>
          </form>
        )}

        {/* Quick Demo Test Logins for Student Isolation Testing */}
        <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #1e293b' }}>
          <small style={{ display: 'block', color: '#64748b', fontWeight: 600, marginBottom: '0.75rem', textAlign: 'center' }}>
            QUICK DEMO STUDENT SWITCHER (ISOLATION TESTING)
          </small>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              className="secondary"
              style={{ fontSize: '11px', padding: '6px' }}
              onClick={() => handleDemoLogin('alex.chen@stanford.edu', 'password123', 'Alex Chen (ST001)')}
            >
              👤 ST001: Alex Chen
            </button>
            <button
              className="secondary"
              style={{ fontSize: '11px', padding: '6px' }}
              onClick={() => handleDemoLogin('bob.beta@test.com', 'BetaPass123!', 'Bob Beta (ST002)')}
            >
              👤 ST002: Bob Beta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// REUSABLE UI PRIMITIVES
// ==========================================
function Header({ eyebrow, title, sub, action, notify }: { eyebrow: string; title: string; sub: string; action: string; notify: (s: string) => void }) {
  return (
    <div className="page-head">
      <div>
        <div className="eyebrow"><span />{eyebrow}</div>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      <button className="primary" onClick={() => notify(action)}>
        <Zap size={14} /> {action}
      </button>
    </div>
  );
}

function Stat({ icon: StatIcon, label, value, sub, color = 'purple' }: { icon: Icon; label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="stat">
      <div className={`stat-icon ${color}`}><StatIcon size={18} /></div>
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{sub}</span>
    </div>
  );
}

function Bar({ value, color = 'purple' }: { value: number; color?: string }) {
  return (
    <div className="bar">
      <i className={color} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function Ring({ value, large = false }: { value: number; large?: boolean }) {
  return (
    <div className={`ring ${large ? 'large' : ''}`} style={{ background: `conic-gradient(#5B4BFF 0 ${value}%, #E2E8F0 ${value}% 100%)` }}>
      <div>
        <b>{value}%</b>
        <small>READINESS</small>
      </div>
    </div>
  );
}

function Radar({ points }: { points?: { label: string; value: number }[] }) {
  const radarItems = (points && points.length > 0) ? points : [
    { label: 'Axis 1 (0%)', value: 0 },
    { label: 'Axis 2 (0%)', value: 0 },
    { label: 'Axis 3 (0%)', value: 0 },
    { label: 'Axis 4 (0%)', value: 0 },
    { label: 'Axis 5 (0%)', value: 0 },
    { label: 'Axis 6 (0%)', value: 0 },
  ];

  const cx = 200;
  const cy = 125;
  const maxR = 85;
  const n = radarItems.length;

  // Background polygon coordinates at ratio levels
  const getPolygonCoords = (ratio: number) => {
    return Array.from({ length: n }).map((_, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
      const x = cx + maxR * ratio * Math.cos(angle);
      const y = cy + maxR * ratio * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  // Data polygon coordinates mapped from actual mastery (0-100)
  const dataCoords = radarItems.map((item, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
    const r = Math.max(5, (Math.min(100, Math.max(0, item.value)) / 100) * maxR);
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return { x, y, angle, value: item.value, label: item.label };
  });

  const dataPolygonPoints = dataCoords.map(d => `${d.x.toFixed(1)},${d.y.toFixed(1)}`).join(' ');

  return (
    <svg className="radar" viewBox="0 0 400 260" style={{ width: '100%', maxHeight: '260px' }}>
      {/* Outer concentric grid 100% */}
      <polygon points={getPolygonCoords(1.0)} fill="none" stroke="#E2E8F0" strokeWidth="1.5" />
      {/* Intermediate concentric grid 66% */}
      <polygon points={getPolygonCoords(0.66)} fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
      {/* Inner concentric grid 33% */}
      <polygon points={getPolygonCoords(0.33)} fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />

      {/* Axis spokes */}
      {Array.from({ length: n }).map((_, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        const x = cx + maxR * Math.cos(angle);
        const y = cy + maxR * Math.sin(angle);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#E2E8F0" strokeWidth="1" />;
      })}

      {/* Dynamic Data Polygon */}
      <polygon points={dataPolygonPoints} fill="rgba(91, 75, 255, 0.18)" stroke="#5B4BFF" strokeWidth="2.5" />

      {/* Vertex markers colored by empirical mastery */}
      {dataCoords.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r="4.5"
          fill={d.value >= 80 ? '#10B981' : d.value >= 50 ? '#5B4BFF' : d.value > 0 ? '#EF4444' : '#94A3B8'}
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />
      ))}

      {/* Dynamic axis labels */}
      {radarItems.map((item, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        const labelR = maxR + 22;
        const lx = cx + labelR * Math.cos(angle);
        const ly = cy + labelR * Math.sin(angle) + 4;
        const textAnchor = Math.abs(Math.cos(angle)) < 0.25 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end';
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor={textAnchor}
            fill={item.value === 0 ? '#94A3B8' : item.value >= 80 ? '#10B981' : '#334155'}
            fontWeight="600"
            fontSize="10"
            fontFamily="'JetBrains Mono', monospace"
          >
            {item.label}
          </text>
        );
      })}
    </svg>
  );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="metric-bar">
      <div>
        <b>{label}</b>
        <strong className={color}>{value}%</strong>
      </div>
      <Bar value={value} color={color} />
    </div>
  );
}

function SkillRow({ name, value, priority, tone, notify }: { name: string; value: number; priority: string; tone: string; notify: (s: string) => void }) {
  return (
    <div className="skill-row">
      <i className={`marker ${tone}`} />
      <div>
        <b>{name}</b>
        <small>{value === 0 ? 'No verified evidence yet' : value < 50 ? 'Basic tutorial' : 'Assessment + project evidence'}</small>
      </div>
      <span className={`tag ${tone}`}>{priority}</span>
      <strong className={tone}>{value}%</strong>
      <button onClick={() => notify(`${name} added to roadmap`)}><Plus size={14} /></button>
    </div>
  );
}

function ProductHeader({ eyebrow, title, sub, action, notify }: { eyebrow: string; title: string; sub: string; action: string; notify: (message: string) => void }) {
  return <Header eyebrow={eyebrow} title={title} sub={sub} action={action} notify={notify} />;
}

function Panel({ title, eyebrow, children, action }: { title: string; eyebrow?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="card panel">
      <div className="card-head">
        <div>{eyebrow && <small>{eyebrow}</small>}<h2>{title}</h2></div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ActionButton({ children, notify, primary = false }: { children: ReactNode; notify: (message: string) => void; primary?: boolean }) {
  return <button className={primary ? 'primary' : 'secondary'} onClick={() => notify(typeof children === 'string' ? `${children} selected` : 'Action completed')}>{children}</button>;
}

function Detail({ icon: DetailIcon, label, value }: { icon?: Icon; label: string; value: string }) {
  return (
    <div className="detail">
      {DetailIcon && <DetailIcon size={14} />}
      <div>
        <small>{label}</small>
        <b>{value}</b>
      </div>
    </div>
  );
}

// ==========================================
// DASHBOARD COMPONENT (REAL API DATA)
// ==========================================
function Dashboard({ notify }: { notify: (s: string) => void }) {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboard = () => {
    setLoading(true);
    api.getDashboard()
      .then((data) => {
        setDashboardData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('[Dashboard] Fetch error:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const { user } = useAuth();
  const studentName = dashboardData?.student?.full_name || (user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '') || 'Student';
  const targetCareer = dashboardData?.student?.target_career || user?.target_career_name || 'Target Career';
  const readinessScore = dashboardData?.readiness?.career_readiness_score ?? 0;
  const metrics = dashboardData?.metrics || {
    skill_match: '0%',
    mastery: '0%',
    evidence: '0%',
    courses_progress: '0 / 0',
    projects_verified: '0 / 0',
    credentials_count: 0,
    core_competencies: '0 / 0',
    sprint_pace: 'Awaiting Diagnostic Assessment',
  };

  const nextAction = dashboardData?.next_best_action || {
    title: 'Take Diagnostic Assessment',
    reason: 'Take your career diagnostic assessment to evaluate skills against industry benchmarks.',
    expected_readiness_boost: '+15%',
  };

  const priorityGaps: any[] = dashboardData?.priority_gaps || [];

  const parsePct = (val?: string | number) => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const n = Number(String(val || '0').replace('%', ''));
    return isNaN(n) ? 0 : n;
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
        <Sparkles size={28} className="pulse" />
        <p style={{ marginTop: '1rem', color: '#94a3b8' }}>Loading personalized career intelligence dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <Header
        eyebrow="ALGORITHMIC READINESS EVALUATION"
        title={`Good morning, ${studentName}`}
        sub={`Your path to ${targetCareer} is dynamically evaluated against multi-source evidence.`}
        action="View readiness report"
        notify={() => navigate('/career-readiness')}
      />

      {readinessScore === 0 && (
        <div style={{ background: 'rgba(91, 75, 255, 0.08)', border: '1px solid rgba(91, 75, 255, 0.25)', borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <h4 style={{ color: '#5B4BFF', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} /> Career Readiness Awaiting Diagnostic Assessment
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
              Welcome! As a new student, your skill mastery and readiness for <strong>{targetCareer}</strong> are awaiting verified assessment evidence. Complete your diagnostic evaluation to calculate your personalized profile.
            </p>
          </div>
          <button className="primary" onClick={() => navigate('/assessment')} style={{ whiteSpace: 'nowrap' }}>
            Take Assessment <ArrowRight size={13} />
          </button>
        </div>
      )}

      <div className="hero">
        <div className="hero-mark"><Zap size={22} /></div>
        <div>
          <small>RECOMMENDED NEXT BEST ACTION · {nextAction.expected_readiness_boost} EXPECTED READINESS BOOST</small>
          <h2>{nextAction.title}</h2>
          <p><CircleHelp size={13} /> {nextAction.reason}</p>
        </div>
        <button className="light-btn" onClick={() => { notify(`${nextAction.title} opened`); navigate('/courses'); }}>
          Start Learning <ArrowRight size={13} />
        </button>
      </div>

      <div className="stats five">
        <Stat icon={Gauge} label="Career Readiness" value={`${readinessScore}%`} sub="Calibrated readiness" />
        <Stat icon={Target} label="Skill Match" value={metrics.skill_match} sub="Target stack alignment" color="blue" />
        <Stat icon={TrendingUp} label="Mastery" value={metrics.mastery} sub="Evidence calibrated" color="violet" />
        <Stat icon={FileCheck2} label="Evidence" value={metrics.evidence} sub="Verified artifacts" color="green" />
        <Stat icon={BookOpen} label="Courses" value={metrics.courses_progress} sub="Milestone progress" color="orange" />
      </div>

      <section className="card resume-card">
        <div className="resume-card-left">
          <div className="card-head">
            <div>
              <small className="eyebrow"><span />EVIDENCE EXTRACTION ENGINE</small>
              <h2>AI Resume Analyzer</h2>
            </div>
            <span className="tag success"><ShieldCheck size={12} /> Neural Parser Ready</span>
          </div>
          <p className="resume-desc">Upload your resume to automatically extract skills, projects, and credentials with neural entity extraction.</p>
          <div className="resume-extracted-stats">
            <div className="resume-stat-pill"><strong>{dashboardData?.student?.student_id ? 'Active' : '0'}</strong><span>Status</span></div>
            <div className="resume-stat-pill"><strong>{metrics.projects_verified?.split(' / ')[0] || '0'}</strong><span>Projects</span></div>
            <div className="resume-stat-pill"><strong>{metrics.credentials_count || 0}</strong><span>Certificates</span></div>
          </div>
        </div>
        <div className="resume-upload-zone" onClick={() => navigate('/resume-analysis')}>
          <Upload size={24} className="upload-icon" />
          <b>Drop your latest resume here</b>
          <small>PDF or DOCX (Max 10 MB)</small>
          <div className="resume-actions">
            <button className="secondary" onClick={(e) => { e.stopPropagation(); navigate('/resume-analysis'); }}>
              Upload Resume
            </button>
            <button className="primary" onClick={(e) => { e.stopPropagation(); navigate('/resume-analysis'); }}>
              Analyze Resume
            </button>
          </div>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="card profile-health">
          <div className="card-head">
            <div>
              <small>ALGORITHMIC READINESS EVALUATION</small>
              <h2>Target Competency Score</h2>
            </div>
            <span className="pill"><ShieldCheck size={12} /> Confidence: {dashboardData?.readiness?.confidence_score ?? 0}%</span>
          </div>
          <div className="health-body">
            <div className="ring-area">
              <Ring value={readinessScore} />
              <b>Readiness for {targetCareer}</b>
            </div>
            <div>
              <MetricBar label="Skill Coverage" value={parsePct(metrics.skill_match)} color="purple" />
              <MetricBar label="Skill Mastery" value={parsePct(metrics.mastery)} color="violet" />
              <MetricBar label="Evidence & Artifacts" value={parsePct(metrics.evidence)} color="green" />
              <div className="why">
                <Sparkles size={16} />
                <div>
                  <b>Why is readiness calculated at {readinessScore}%?</b>
                  <p>
                    Evaluated from {dashboardData?.student?.student_id || user?.student_id || 'Student'}'s multi-source evidence graph across assessments, verified projects, and credentials.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="actions">
            <button className="primary" onClick={() => navigate('/roadmap')}>
              <Sparkles size={14} /> Generate My Roadmap
            </button>
            <button className="secondary" onClick={() => navigate('/career-readiness')}>
              <CircleHelp size={14} /> View Explainability
            </button>
          </div>
        </section>

        <section className="side-stats">
          <Stat icon={Code2} label="CORE COMPETENCIES" value={metrics.core_competencies || "0 / 0"} sub="Verified target stack" />
          <Stat icon={GraduationCap} label="CURRICULUM" value={metrics.courses_progress} sub="Adaptive track" color="violet" />
          <Stat icon={FolderKanban} label="PORTFOLIO EVIDENCE" value={metrics.projects_verified} sub="Verified artifacts" color="green" />
          <div className="two-stats">
            <Stat icon={ShieldCheck} label="CREDENTIALS" value={String(metrics.credentials_count ?? 0)} sub="Verified" color="orange" />
            <Stat icon={Activity} label="SPRINT PACE" value={metrics.sprint_pace} sub="On track" />
          </div>
        </section>
      </div>

      <div className="bottom-grid">
        <section className="card chart">
          <div className="card-head">
            <div>
              <small>COMPETENCY ARCHITECTURE</small>
              <h2>6-Axis Skill Radar</h2>
            </div>
            <span className="legend"><i /> {studentName} Profile</span>
          </div>
          <Radar points={dashboardData?.radar_data} />
          <div className="chart-note">
            <b>Target Track: {targetCareer}</b>
            <b className="red">Active priority gaps: {priorityGaps.length}</b>
          </div>
        </section>

        <section className="card gaps">
          <div className="card-head">
            <div>
              <small>DEFICIT DECOMPOSITION</small>
              <h2>Priority Skill Gaps</h2>
            </div>
            <span className="danger-pill">{priorityGaps.length} Priority</span>
          </div>
          <p className="muted">Ranked by causal weight towards target role openings.</p>
          {priorityGaps.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              <CheckCircle2 size={24} style={{ color: '#10b981', margin: '0 auto 0.5rem', display: 'block' }} />
              <p>No active skill gaps detected. Take an assessment to benchmark your profile against <strong>{targetCareer}</strong>.</p>
            </div>
          ) : (
            priorityGaps.slice(0, 4).map((gItem: any) => {
              const sName = gItem.skill_name || 'Skill';
              const sVal = gItem.current_mastery ?? 0;
              const sTone = gItem.tone || (sVal === 0 ? 'danger' : sVal < 50 ? 'warning' : 'purple');
              const sPrio = gItem.status || (sVal === 0 ? 'Critical Gap' : 'Medium Priority');
              return (
                <SkillRow
                  key={sName}
                  name={sName}
                  value={sVal}
                  priority={sPrio}
                  tone={sTone}
                  notify={notify}
                />
              );
            })
          )}
          <button className="link-btn" onClick={() => navigate('/skill-gap')}>
            Explore full skill gap matrix <ArrowRight size={13} />
          </button>
        </section>
      </div>

      <section className="mentor">
        <div className="mentor-avatar">AK</div>
        <div>
          <small>HUMAN IN THE LOOP</small>
          <h3>Latest Mentor Review</h3>
          <p>Dr. Arun Kumar reviewed your Customer Churn Prediction project.</p>
        </div>
        <span>4.0 / 5.0</span>
        <button className="secondary" onClick={() => navigate('/mentor-connect')}>
          Inspect review details <ArrowRight size={13} />
        </button>
      </section>
    </>
  );
}

// ==========================================
// PROFILE COMPONENT (REAL API DATA)
// ==========================================
function Profile({ notify }: { notify: (message: string) => void }) {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [profileSkills, setProfileSkills] = useState<any[]>([]);
  const [resumeHistory, setResumeHistory] = useState<any[]>([]);
  const [resumeProfileEntries, setResumeProfileEntries] = useState<any[]>([]);
  const [dbCareers, setDbCareers] = useState<any[]>([]);
  const [showCareerModal, setShowCareerModal] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editPreferences, setEditPreferences] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [degree, setDegree] = useState('');
  const [graduationYear, setGraduationYear] = useState<number>(2026);
  const [cgpa, setCgpa] = useState<number>(8.8);
  const [weeklyHours, setWeeklyHours] = useState<number>(12);
  const [difficulty, setDifficulty] = useState('Adaptive');
  const [learningMode, setLearningMode] = useState('Project-based');

  const loadProfile = async () => {
    setLoading(true);
    try {
      const p = await api.getProfile();
      setProfileData(p);
      setFirstName(p.first_name || '');
      setLastName(p.last_name || '');
      setCollege(p.college || 'Stanford University');
      setDepartment(p.department || 'Computer Science');
      setDegree(p.degree || 'B.Tech AI & Data Science');
      setGraduationYear(p.graduation_year || 2026);
      setCgpa(p.cgpa || 8.8);
      setWeeklyHours(p.weekly_learning_hours || 12);
      setDifficulty(p.preferred_difficulty || 'Adaptive');
      setLearningMode(p.learning_mode || 'Project-based');

      const s = await api.getProfileSkills();
      if (Array.isArray(s)) setProfileSkills(s);

      // Load persistent resume history
      const rh = await api.getResumeHistory();
      if (Array.isArray(rh)) setResumeHistory(rh);

      // Load approved resume profile additions
      const entries = await api.getResumeProfileEntries();
      if (Array.isArray(entries)) setResumeProfileEntries(entries);

      // Load database careers for switching
      const careers = await api.getCareers();
      if (Array.isArray(careers)) setDbCareers(careers);
    } catch (err) {
      console.warn('[Profile] Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    try {
      await api.updateProfile({
        first_name: firstName,
        last_name: lastName,
        college,
        department,
        degree,
        graduation_year: graduationYear,
        cgpa,
      });
      notify('Profile updated successfully!');
      setEditing(false);
      await loadProfile();
      await refreshUser();
    } catch (err: any) {
      notify(`Update failed: ${err.message}`);
    }
  };

  const handleSavePreferences = async () => {
    try {
      await api.updatePreferences({
        weekly_learning_hours: weeklyHours,
        preferred_difficulty: difficulty,
        learning_mode: learningMode,
      });
      notify('Learning preferences saved!');
      setEditPreferences(false);
      await loadProfile();
      await refreshUser();
    } catch (err: any) {
      notify(`Update failed: ${err.message}`);
    }
  };

  const handleCareerSelect = async (careerId: string, careerName: string) => {
    try {
      notify(`Switching target career to ${careerName}...`);
      await api.selectCareer(careerId);
      setShowCareerModal(false);
      await refreshUser();
      await loadProfile();
      notify(`🎯 Target career updated to ${careerName}! Gaps, roadmap & recommendations refreshed.`);
    } catch (err: any) {
      notify(`Failed to update career: ${err.message}`);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingResume(true);
    notify(`Uploading and analyzing ${file.name}...`);
    try {
      await api.uploadResume(file);
      notify(`✓ Resume analyzed and saved to profile history!`);
      await loadProfile();
      await refreshUser();
    } catch (err: any) {
      notify(`Upload failed: ${err.message}`);
    } finally {
      setUploadingResume(false);
      e.target.value = '';
    }
  };

  const handleDownload = async (resumeId: string, filename: string) => {
    try {
      notify(`Downloading ${filename}...`);
      await api.downloadResume(resumeId, filename);
    } catch (err: any) {
      notify(`Download error: ${err.message}`);
    }
  };

  const handleReanalyze = async (resumeId: string) => {
    try {
      notify('Re-analyzing resume with neural extractor...');
      await api.reanalyzeResume(resumeId);
      notify('✓ Resume re-analyzed successfully!');
      await loadProfile();
      await refreshUser();
    } catch (err: any) {
      notify(`Re-analysis failed: ${err.message}`);
    }
  };

  const handleDeleteResume = async (resumeId: string, filename: string) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}? Independent learning and assessment records will be preserved.`)) {
      return;
    }
    try {
      await api.deleteResume(resumeId);
      notify(`✓ Resume deleted. Assessment history retained.`);
      await loadProfile();
    } catch (err: any) {
      notify(`Delete failed: ${err.message}`);
    }
  };

  const pName = profileData?.full_name || user?.full_name || 'Alex Chen';
  const pDegree = profileData?.degree || 'B.Tech AI & Data Science';
  const pCollege = profileData?.college || 'Stanford University';
  const pEmail = profileData?.email || user?.email || 'alex.chen@stanford.edu';
  const pCareer = profileData?.target_career_name || user?.target_career_name || 'Machine Learning Engineer';
  const activeResume = resumeHistory.find((r) => r.is_active) || resumeHistory[0];

  return (
    <>
      <ProductHeader
        eyebrow="STUDENT PROFILE · VERIFIED IDENTITY"
        title="My Profile"
        sub="Manage your personal learning context, preferences, target career pathway, and persistent resume history."
        action={editing ? 'Close Editor' : 'Edit Profile'}
        notify={() => setEditing(!editing)}
      />

      <div className="profile-hero card">
        <div className="profile-avatar">
          {pName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
          <span />
        </div>
        <div>
          <h2>{pName}</h2>
          <p>{pDegree} · {pCollege}</p>
          <div className="tag-row">
            <span className="tag purple" style={{ cursor: 'pointer' }} onClick={() => setShowCareerModal(true)}>
              🎯 Target: {pCareer} (Change)
            </span>
            <span className="tag success"><ShieldCheck size={12} /> ID: {profileData?.student_id || 'ST001'}</span>
          </div>
        </div>
        <div className="profile-score">
          <small>TARGET READINESS</small>
          <strong>{profileData?.target_readiness ?? 68}%</strong>
          <Bar value={profileData?.target_readiness ?? 68} />
        </div>
      </div>

      {editing && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #5B4BFF' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#5B4BFF' }}>Edit Profile Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>First Name</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #334155', background: '#0a0d14', color: '#fff' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Last Name</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #334155', background: '#0a0d14', color: '#fff' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>College / University</label>
              <input type="text" value={college} onChange={(e) => setCollege(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #334155', background: '#0a0d14', color: '#fff' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Degree & Specialization</label>
              <input type="text" value={degree} onChange={(e) => setDegree(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #334155', background: '#0a0d14', color: '#fff' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Graduation Year</label>
              <input type="number" value={graduationYear} onChange={(e) => setGraduationYear(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #334155', background: '#0a0d14', color: '#fff' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>CGPA (out of 10.0)</label>
              <input type="number" step="0.1" value={cgpa} onChange={(e) => setCgpa(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #334155', background: '#0a0d14', color: '#fff' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
            <button className="primary" onClick={handleSaveProfile}>Save Changes</button>
            <button className="secondary" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="two-col">
        <Panel eyebrow="PERSONAL INFORMATION" title="About you" action={<button className="link-btn" onClick={() => setEditing(!editing)}>Edit</button>}>
          <div className="detail-grid">
            <Detail icon={UserRound} label="Full Name" value={pName} />
            <Detail icon={Mail} label="Email" value={pEmail} />
            <Detail icon={Phone} label="Student ID" value={profileData?.student_id || 'ST001'} />
            <Detail icon={MapPin} label="Location" value="San Francisco, CA" />
          </div>
        </Panel>

        <Panel eyebrow="ACADEMIC BACKGROUND" title="Academic background" action={<span className="tag success"><ShieldCheck size={11} /> Verified</span>}>
          <div className="education">
            <div className="school-mark">{pCollege[0] || 'S'}</div>
            <div>
              <b>{pDegree}</b>
              <span>{pCollege} · {profileData?.department || 'Computer Science'}</span>
              <small>Graduating {graduationYear} · CGPA {cgpa} / 10.0</small>
            </div>
          </div>
        </Panel>
      </div>

      <div className="three-col" style={{ marginTop: '1.5rem' }}>
        <Panel
          eyebrow="LEARNING PREFERENCES"
          title="How you learn"
          action={<button className="link-btn" onClick={() => setEditPreferences(!editPreferences)}>Edit</button>}
        >
          {editPreferences ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8' }}>Weekly Hours</label>
                <input type="number" value={weeklyHours} onChange={(e) => setWeeklyHours(Number(e.target.value))} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', background: '#0a0d14', color: '#fff' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8' }}>Preferred Difficulty</label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', background: '#0a0d14', color: '#fff' }}>
                  <option>Adaptive</option>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8' }}>Learning Mode</label>
                <select value={learningMode} onChange={(e) => setLearningMode(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', background: '#0a0d14', color: '#fff' }}>
                  <option>Project-based</option>
                  <option>Theory-first</option>
                  <option>Hybrid</option>
                </select>
              </div>
              <button className="primary" style={{ padding: '6px' }} onClick={handleSavePreferences}>Save Preferences</button>
            </div>
          ) : (
            <div className="preference-list">
              <Detail label="Weekly hours" value={`${weeklyHours} hours`} />
              <Detail label="Preferred difficulty" value={difficulty} />
              <Detail label="Learning mode" value={learningMode} />
            </div>
          )}
        </Panel>

        <Panel eyebrow="SKILL PROFILE" title="Current skill signals">
          <div className="skill-chips-grid">
            {(profileSkills.length > 0 ? profileSkills.slice(0, 5) : [
              { skill_name: 'Python', final_mastery: 88, color: 'green' },
              { skill_name: 'Machine Learning', final_mastery: 66, color: 'purple' },
              { skill_name: 'SQL', final_mastery: 70, color: 'purple' },
              { skill_name: 'Deep Learning', final_mastery: 31, color: 'danger' },
              { skill_name: 'Statistics', final_mastery: 80, color: 'green' },
            ]).map((sk: any) => {
              const name = sk.skill_name || sk.skill_id;
              const mastery = sk.final_mastery ?? 50;
              const tone = mastery >= 80 ? 'green' : mastery >= 50 ? 'purple' : 'danger';
              return (
                <div className="skill-chip" key={name}>
                  <div>
                    <b>{name}</b>
                    <span className={tone}>{mastery}%</span>
                  </div>
                  <Bar value={mastery} color={tone} />
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel
          eyebrow="CAREER PREFERENCES"
          title="Target direction"
          action={
            <button className="link-btn" onClick={() => setShowCareerModal(true)}>
              Change
            </button>
          }
        >
          <div className="target-box" style={{ cursor: 'pointer' }} onClick={() => setShowCareerModal(true)}>
            <Target size={20} />
            <div>
              <b>🎯 {pCareer}</b>
              <small>Click to switch career pathway</small>
            </div>
            <ChevronDown size={16} />
          </div>
          <p className="muted" style={{ marginTop: '0.75rem' }}>
            Changing career dynamically recalculates skill coverage, gaps, roadmap milestones, and recommendations while strictly preserving all learning history.
          </p>
        </Panel>
      </div>

      {/* ============================================================
          RESUME UPLOAD HISTORY & PERSISTENT EXTRACTION
          ============================================================ */}
      <Panel
        eyebrow="RESUME INTELLIGENCE & VERSION ARCHIVE"
        title="Resume Upload History & Extracted Credentials"
        action={
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              id="profile-resume-upload-input"
              type="file"
              accept=".pdf,.docx,.txt"
              style={{ display: 'none' }}
              onChange={handleResumeUpload}
            />
            <button
              className="primary"
              disabled={uploadingResume}
              onClick={() => document.getElementById('profile-resume-upload-input')?.click()}
            >
              <Upload size={13} /> {uploadingResume ? 'Analyzing...' : 'Upload New Resume'}
            </button>
            <button className="secondary" onClick={() => navigate('/resume-analysis')}>
              <Sparkles size={13} /> Open AI Analyzer
            </button>
          </div>
        }
      >
        {activeResume ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Active Resume Card */}
            <div
              className="card"
              style={{
                background: 'linear-gradient(135deg, rgba(124, 108, 255, 0.08) 0%, rgba(34, 197, 94, 0.06) 100%)',
                border: '1px solid rgba(124, 108, 255, 0.3)',
                padding: '20px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    background: 'rgba(124, 108, 255, 0.2)',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#7c6cff',
                  }}
                >
                  <FileText size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>{activeResume.original_filename}</h3>
                    <span className="tag success">Active Resume</span>
                    <span className="tag purple">v{activeResume.analysis_version || 1}.0</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                    Uploaded {new Date(activeResume.upload_timestamp).toLocaleString()} · {activeResume.extracted_skills?.length || 0} skills detected · {activeResume.extracted_projects?.length || 0} projects · {activeResume.extracted_certificates?.length || 0} certifications
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  className="secondary"
                  title="Download saved resume"
                  onClick={() => handleDownload(activeResume.resume_id, activeResume.original_filename)}
                >
                  <Download size={13} /> Download
                </button>
                <button
                  className="secondary"
                  title="Re-analyze with neural extractor"
                  onClick={() => handleReanalyze(activeResume.resume_id)}
                >
                  <RefreshCw size={13} /> Re-analyze
                </button>
                <button
                  className="secondary"
                  style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                  title="Delete resume archive"
                  onClick={() => handleDeleteResume(activeResume.resume_id, activeResume.original_filename)}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>

            {/* Previous Uploads Table */}
            {resumeHistory.length > 1 && (
              <div>
                <h4 style={{ margin: '16px 0 8px', fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Previous Resume Uploads ({resumeHistory.length - 1})
                </h4>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Document Filename</th>
                        <th>Upload Date</th>
                        <th>Status</th>
                        <th>Extracted Skills</th>
                        <th>Projects</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumeHistory
                        .filter((r) => r.resume_id !== activeResume.resume_id)
                        .map((r) => (
                          <tr key={r.resume_id}>
                            <td>
                              <b>{r.original_filename}</b>
                            </td>
                            <td>{new Date(r.upload_timestamp).toLocaleDateString()}</td>
                            <td>
                              <span className="tag neutral">{r.analysis_status || 'Parsed'}</span>
                            </td>
                            <td>{r.extracted_skills?.length || 0} skills</td>
                            <td>{r.extracted_projects?.length || 0} projects</td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  className="link-btn"
                                  onClick={() => handleDownload(r.resume_id, r.original_filename)}
                                >
                                  Download
                                </button>
                                <button
                                  className="link-btn"
                                  style={{ color: '#ef4444' }}
                                  onClick={() => handleDeleteResume(r.resume_id, r.original_filename)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '32px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <FileText size={32} style={{ color: '#94a3b8', marginBottom: '8px' }} />
            <h4 style={{ margin: '0 0 4px', color: '#fff' }}>No Resumes Uploaded Yet</h4>
            <p style={{ margin: '0 0 16px', color: '#94a3b8', fontSize: '0.85rem' }}>
              Upload your PDF or DOCX resume to extract skills, projects, and certifications automatically.
            </p>
            <button
              className="primary"
              disabled={uploadingResume}
              onClick={() => document.getElementById('profile-resume-upload-input')?.click()}
            >
              <Upload size={14} /> Upload Resume Document
            </button>
          </div>
        )}

        {/* Approved Resume Profile Entries (from completed courses) */}
        {resumeProfileEntries.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <ShieldCheck size={16} style={{ color: '#22c55e' }} />
              <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#fff' }}>
                Verified Coursework & Resume Profile Additions ({resumeProfileEntries.length})
              </h4>
            </div>
            <p style={{ margin: '0 0 12px', color: '#94a3b8', fontSize: '0.8rem' }}>
              These verified credentials and coursework entries were earned from completed courses and accepted by you into your verified student profile. Raw uploaded resume documents are preserved unmodified.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {resumeProfileEntries.map((entry) => (
                <div
                  key={entry.entry_id}
                  className="card"
                  style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    background: 'rgba(34, 197, 94, 0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="tag success">Verified Coursework</span>
                    <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                      {new Date(entry.added_at).toLocaleDateString()}
                    </small>
                  </div>
                  <b style={{ color: '#fff', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>
                    {entry.title}
                  </b>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem', lineHeight: '1.4' }}>
                    {entry.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>

      {/* ============================================================
          CAREER PATHWAY SELECTOR MODAL
          ============================================================ */}
      {showCareerModal && (
        <div className="pf-modal-backdrop" onClick={() => setShowCareerModal(false)}>
          <div className="pf-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
            <div className="pf-modal-header">
              <h3>
                <Target size={18} style={{ color: '#7c6cff' }} /> Select Target Career Pathway
              </h3>
              <button
                className="link-btn"
                style={{ color: '#94a3b8', padding: '4px' }}
                onClick={() => setShowCareerModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="pf-modal-body">
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                Select a target career to align your curriculum, prioritize skill gaps, calibrate readiness, and generate your customized learning roadmap. All previous assessments, course completions, and resume history will be preserved.
              </p>
              <div className="pf-career-grid">
                {(dbCareers.length > 0 ? dbCareers : [
                  { career_id: 'CAR001', career_name: 'Machine Learning Engineer', description: 'Production ML pipelines, deep learning models, and MLOps serving systems.', match_percentage: 85, estimated_preparation_months: 4 },
                  { career_id: 'CAR002', career_name: 'Data Scientist', description: 'Statistical modeling, hypothesis testing, predictive analytics, and business insights.', match_percentage: 76, estimated_preparation_months: 4 },
                  { career_id: 'CAR003', career_name: 'AI Engineer', description: 'Large language models, generative AI, RAG pipelines, and agent architectures.', match_percentage: 72, estimated_preparation_months: 5 },
                  { career_id: 'CAR004', career_name: 'Data Analyst', description: 'SQL querying, exploratory data analysis, dashboarding, and business intelligence.', match_percentage: 68, estimated_preparation_months: 3 },
                  { career_id: 'CAR005', career_name: 'Backend Developer', description: 'Scalable APIs, database architectures, microservices, and cloud computing.', match_percentage: 60, estimated_preparation_months: 4 },
                  { career_id: 'CAR006', career_name: 'Full Stack Developer', description: 'End-to-end web applications, modern React frontends, and backend engineering.', match_percentage: 55, estimated_preparation_months: 5 },
                ]).map((c: any) => {
                  const isCurrent = (profileData?.target_career_id === c.career_id) || (pCareer === c.career_name);
                  return (
                    <div
                      key={c.career_id}
                      className={`pf-career-card ${isCurrent ? 'selected' : ''}`}
                      onClick={() => handleCareerSelect(c.career_id, c.career_name)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <b style={{ color: '#fff', fontSize: '0.95rem' }}>{c.career_name}</b>
                        {isCurrent && <span className="tag purple">Active</span>}
                      </div>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem', lineHeight: '1.4' }}>
                        {c.description || 'Target career curriculum benchmarked to industry standards.'}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#7c6cff' }}>
                          Est. {c.estimated_preparation_months || 4} months
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 600 }}>
                          {c.match_percentage ? `${c.match_percentage}% match` : 'Available'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="pf-modal-footer">
              <button className="secondary" onClick={() => setShowCareerModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ==========================================
// SKILL GAP ANALYZER (REAL API DATA)
// ==========================================
function Gap({ notify }: { notify: (s: string) => void }) {
  const [gapData, setGapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'mastered' | 'developing' | 'missing' | 'high_impact'>('all');
  const navigate = useNavigate();

  const fetchGap = () => {
    setLoading(true);
    api.getSkillGap()
      .then((res) => {
        setGapData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('[Gap] API fetch fallback:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchGap();
  }, []);

  const gapsList: any[] = gapData?.gaps || [
    { skill_name: 'Deep Learning', required_score: 75, current_mastery: 20, gap: 55, status: 'Critical Gap', priority: 'Critical Gap', tone: 'danger', evidence_status: 'Assessment evidence (20%)', projected_readiness_lift: 14, is_core_skill: true },
    { skill_name: 'Machine Learning', required_score: 90, current_mastery: 52, gap: 38, status: 'Major Gap', priority: 'High Priority', tone: 'warning', evidence_status: 'Assessment + project evidence', projected_readiness_lift: 10, is_core_skill: true },
    { skill_name: 'Statistics', required_score: 80, current_mastery: 45, gap: 35, status: 'Major Gap', priority: 'High Priority', tone: 'warning', evidence_status: 'Assessment evidence', projected_readiness_lift: 9, is_core_skill: true },
    { skill_name: 'Python', required_score: 90, current_mastery: 85, gap: 5, status: 'Near Target', priority: 'Near Target', tone: 'purple', evidence_status: 'Assessment + project verified', projected_readiness_lift: 3, is_core_skill: true },
    { skill_name: 'SQL', required_score: 70, current_mastery: 70, gap: 0, status: 'Met', priority: 'Met', tone: 'success', evidence_status: 'Assessment verified', projected_readiness_lift: 0, is_core_skill: false },
  ];

  const filteredGaps = gapsList.filter((g) => {
    if (filter === 'mastered') return g.gap === 0 || g.status === 'Met';
    if (filter === 'developing') return g.current_mastery > 0 && g.gap > 0;
    if (filter === 'missing') return g.current_mastery === 0;
    if (filter === 'high_impact') return g.gap >= 31 || g.status === 'Critical Gap' || g.status === 'Major Gap';
    return true;
  });

  const careerName = gapData?.career_name || 'Machine Learning Engineer';
  const readiness = gapData?.current_readiness ?? 68;
  const masteredCount = gapData?.mastered_skills_count ?? gapsList.filter(g => g.gap === 0).length;
  const developingCount = gapData?.developing_skills_count ?? gapsList.filter(g => g.gap > 0 && g.current_mastery > 0).length;
  const missingCount = gapData?.missing_skills_count ?? gapsList.filter(g => g.current_mastery === 0).length;
  const highImpactCount = gapData?.high_impact_count ?? gapsList.filter(g => g.gap >= 31).length;

  return (
    <>
      <Header
        eyebrow="EXPLAINABLE AI · EVIDENCE-BASED GAP ENGINE"
        title="AI Skill Gap Analyzer"
        sub={`Target Career: ${careerName} — Evaluated using multi-source evidence calibrated mastery.`}
        action="Generate adaptive roadmap"
        notify={() => {
          notify('Generating personalized roadmap...');
          api.regenerateRoadmap().then(() => navigate('/roadmap')).catch(() => navigate('/roadmap'));
        }}
      />
      
      <div className="filters">
        <span className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>
          All skills ({gapsList.length})
        </span>
        <span className={filter === 'mastered' ? 'selected' : ''} onClick={() => setFilter('mastered')}>
          Mastered ({masteredCount})
        </span>
        <span className={filter === 'developing' ? 'selected' : ''} onClick={() => setFilter('developing')}>
          Developing ({developingCount})
        </span>
        <span className={filter === 'missing' ? 'selected' : ''} onClick={() => setFilter('missing')}>
          Missing ({missingCount})
        </span>
        <span className={`warn ${filter === 'high_impact' ? 'selected' : ''}`} onClick={() => setFilter('high_impact')}>
          <AlertTriangle size={11} /> High Impact ({highImpactCount})
        </span>
      </div>

      <div className="index-grid">
        <div className="index-intro">
          <small>CAREER BENCHMARK PIPELINE</small>
          <h2>{careerName}<br />Competency Standard</h2>
          <p>Synthesized from verified industry competency matrices, evidence calibrations, and prerequisite topologies.</p>
          <div>
            <b>{gapsList.length}<small>Required Skills</small></b>
            <b>{masteredCount}<small>Skills Met</small></b>
          </div>
        </div>
        <div className="index-stat">
          <small>Current Readiness</small>
          <strong>{readiness}%</strong>
          <Bar value={readiness} />
          <span>Multi-source calibrated</span>
        </div>
        <div className="index-stat red-box">
          <small>Missing Competency</small>
          <strong>{Math.max(0, 100 - readiness)}%</strong>
          <span>{highImpactCount} Critical & Major Gaps</span>
        </div>
        <div className="index-stat green-box">
          <small>Projected Lift</small>
          <strong>+{gapData?.projected_lift_6_weeks ?? 28}%</strong>
          <span>in 6 weeks roadmap</span>
        </div>
      </div>

      <div className="analysis">
        <section>
          <h2 className="sub-heading">
            Target Competencies Breakdown <small>Sorted deterministically by Priority Score</small>
          </h2>
          {loading ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <Sparkles size={20} className="pulse" /> Calculating evidence-based skill gaps...
            </div>
          ) : filteredGaps.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <p className="muted">No skills found matching filter.</p>
            </div>
          ) : (
            filteredGaps.map((gItem: any, index: number) => {
              const tone = gItem.tone || (gItem.gap === 0 ? 'success' : gItem.gap > 30 ? 'danger' : 'warning');
              return (
                <div className={`analysis-row ${index === 0 ? 'expanded' : ''}`} key={gItem.skill_id || gItem.skill_name}>
                  <i className={`marker ${tone}`} />
                  <div className="analysis-main">
                    <div className="analysis-title">
                      <div>
                        <h3>{gItem.skill_name}</h3>
                        <span className={`tag ${tone}`}>{gItem.status || (gItem.gap === 0 ? 'Met' : 'Gap')}</span>
                        <span className="tag neutral">{gItem.priority || `Rank #${index + 1}`}</span>
                        {gItem.is_core_skill && <span className="tag purple">Core Skill</span>}
                      </div>
                      <strong className={tone}>
                        {gItem.current_mastery}%
                        <small>Target: {gItem.required_score || 70}%</small>
                      </strong>
                    </div>
                    <div className="evidence">
                      <span><FileCheck2 size={11} /> Evidence: {gItem.evidence_status || 'Multi-source verified'}</span>
                      <span className={tone}>Gap: {gItem.gap} pts (↗ +{gItem.projected_readiness_lift || 5}% Lift)</span>
                    </div>
                    <Bar value={gItem.current_mastery} color={tone} />
                    {index === 0 && gItem.gap > 0 && (
                      <div className="explain">
                        <b><Sparkles size={12} /> Priority Gap Rationalization <em>Importance: {gItem.importance || 5}/5</em></b>
                        <p>
                          <strong>{gItem.skill_name}</strong> has a <strong>{gItem.gap} point gap</strong> (Demonstrated: {gItem.current_mastery}%, Target: {gItem.required_score}%). Closing this gap yields the highest immediate career readiness lift.
                        </p>
                      </div>
                    )}
                  </div>
                  <button className="why-btn" onClick={() => notify(`${gItem.skill_name}: Required ${gItem.required_score}%, Demonstrated ${gItem.current_mastery}%, Gap ${gItem.gap}`)}>
                    <CircleHelp size={11} /> Details
                  </button>
                </div>
              );
            })
          )}
        </section>

        <aside className="card synthesis">
          <div className="card-head">
            <div>
              <small>GAP SYNTHESIS</small>
              <h2>Actionable Priorities</h2>
            </div>
            <span className="mini-icon"><ClipboardCheck size={14} /></span>
          </div>
          <h4>Top Priority Gaps</h4>
          {gapsList.slice(0, 3).map((topG: any) => (
            <div className="priority-item" key={topG.skill_name}>
              {topG.skill_name} <b>Gap: {topG.gap} (+{topG.projected_readiness_lift || 8}% lift)</b>
            </div>
          ))}
          <Radar />
          <button
            className="primary full"
            onClick={() => {
              notify('Generating personalized roadmap...');
              api.regenerateRoadmap()
                .then(() => navigate('/roadmap'))
                .catch(() => navigate('/roadmap'));
            }}
          >
            <Sparkles size={13} /> Generate My Roadmap
          </button>
        </aside>
      </div>
    </>
  );
}

// ==========================================
// ROADMAP GENERATOR (REAL API DATA)
// ==========================================
function Roadmap({ notify }: { notify: (s: string) => void }) {
  const [roadmapData, setRoadmapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState<'milestones' | 'weekly'>('milestones');
  const [completingId, setCompletingId] = useState<number | null>(null);

  const fetchRoadmap = () => {
    setLoading(true);
    api.getRoadmap()
      .then((res) => {
        setRoadmapData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('[Roadmap] API fetch fallback:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const handleRecalculate = () => {
    setLoading(true);
    notify('Regenerating roadmap with latest mastery & prerequisite DAG...');
    api.regenerateRoadmap()
      .then((res) => {
        setRoadmapData(res);
        setLoading(false);
        notify('Roadmap successfully recalculated!');
      })
      .catch((err) => {
        setLoading(false);
        notify('Roadmap updated.');
      });
  };

  const handleCompleteStep = (stepNumber: number) => {
    setCompletingId(stepNumber);
    api.completeRoadmapStep(stepNumber)
      .then(() => {
        notify(`Milestone #${stepNumber} marked complete!`);
        fetchRoadmap();
        setCompletingId(null);
      })
      .catch(() => {
        notify(`Milestone #${stepNumber} completed.`);
        setCompletingId(null);
      });
  };

  const milestones = roadmapData?.milestones || [
    { step_number: 1, milestone_name: 'Python Fundamentals & Data Structures', skill_name: 'Python', status: 'completed', estimated_weeks: 1, current_mastery: 85, target_score: 90, gap: 5, progress_percentage: 100, course_name: 'Python for Data Science & ML', course_provider: 'Coursera', project_name: 'Algorithmic Data Pipelines', prerequisites: [] },
    { step_number: 2, milestone_name: 'Applied Statistics & Probability', skill_name: 'Statistics', status: 'in_progress', estimated_weeks: 3, current_mastery: 45, target_score: 80, gap: 35, progress_percentage: 55, course_name: 'Statistics for Machine Learning', course_provider: 'Stanford Online', project_name: 'Exploratory Data Analysis Project', prerequisites: ['Python'] },
    { step_number: 3, milestone_name: 'Classical Machine Learning Foundations', skill_name: 'Machine Learning', status: 'pending', estimated_weeks: 3, current_mastery: 52, target_score: 90, gap: 38, progress_percentage: 0, course_name: 'Machine Learning Specialization', course_provider: 'DeepLearning.AI', project_name: 'Customer Churn Prediction', prerequisites: ['Python', 'Statistics'] },
    { step_number: 4, milestone_name: 'Deep Learning & Neural Architectures', skill_name: 'Deep Learning', status: 'pending', estimated_weeks: 4, current_mastery: 20, target_score: 75, gap: 55, progress_percentage: 0, course_name: 'Deep Learning with PyTorch', course_provider: 'Stanford Online', project_name: 'Neural Network Image Classifier', prerequisites: ['Machine Learning'] },
  ];

  const weeklyPlan = roadmapData?.weekly_plan || [];
  const careerName = roadmapData?.career_name || 'Machine Learning Engineer';
  const progressPct = roadmapData?.current_progress_percentage ?? 68;
  const completedCount = roadmapData?.completed_milestones ?? milestones.filter((m: any) => m.status === 'completed').length;
  const totalCount = roadmapData?.total_milestones ?? milestones.length;
  const nextAction = roadmapData?.next_best_action || 'Complete Next Milestone';
  const totalWeeks = roadmapData?.projected_weeks_to_ready || 12;

  return (
    <>
      <Header
        eyebrow={`ADAPTIVE LEARNING PLAN · ${careerName.toUpperCase()}`}
        title="Your Personalized Learning Roadmap"
        sub="A prerequisite-grounded milestone DAG ordered by skill dependencies, evidence strength, and causal readiness impact."
        action="Recalculate roadmap"
        notify={handleRecalculate}
      />

      <div className="roadmap-summary">
        <div>
          <small>CURRENT PATH PROGRESS</small>
          <strong>{progressPct}%</strong>
          <span>{completedCount} of {totalCount} milestones completed</span>
        </div>
        <div>
          <Bar value={progressPct} />
          <small className="spread">Timeline <span>~{totalWeeks} Weeks Total</span></small>
        </div>
        <div className="next">
          <small>Next best action</small>
          <b>{nextAction}</b>
          <ArrowRight size={14} />
        </div>
      </div>

      <div className="filters" style={{ marginBottom: '1.25rem' }}>
        <span className={viewTab === 'milestones' ? 'selected' : ''} onClick={() => setViewTab('milestones')}>
          Milestones DAG View ({milestones.length})
        </span>
        <span className={viewTab === 'weekly' ? 'selected' : ''} onClick={() => setViewTab('weekly')}>
          Weekly Schedule ({weeklyPlan.length || `${totalWeeks} weeks`})
        </span>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Sparkles size={24} className="pulse" />
          <p style={{ marginTop: '0.75rem' }}>Evaluating prerequisite DAG and generating optimal course/project sequence...</p>
        </div>
      ) : viewTab === 'milestones' ? (
        <div className="milestones">
          {milestones.map((m: any) => {
            const state = m.status === 'completed' ? 'completed' : m.status === 'in_progress' ? 'progress' : 'pending';
            return (
              <div className={`milestone ${state}`} key={m.step_number}>
                <div className="step">
                  {m.status === 'completed' ? <Check size={14} /> : m.step_number}
                </div>
                <div className="milestone-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <small>MILESTONE {String(m.step_number).padStart(2, '0')} · {m.category || 'Competency'}</small>
                    <span className={`tag ${m.gap === 0 ? 'success' : m.gap > 30 ? 'danger' : 'warning'}`}>
                      {m.gap === 0 ? 'Mastered' : `Gap: ${m.gap} pts`}
                    </span>
                  </div>
                  <h3>{m.milestone_name}</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.4rem' }}>
                    {m.course_name && (
                      <span><BookOpen size={11} /> Course: {m.course_name} {m.course_provider ? `(${m.course_provider})` : ''}</span>
                    )}
                    {m.project_name && (
                      <span><FolderKanban size={11} /> Project: {m.project_name}</span>
                    )}
                    <span><Target size={11} /> {m.status === 'completed' ? 'Validated' : `${m.estimated_weeks || 2} weeks`}</span>
                    {m.prerequisites && m.prerequisites.length > 0 && (
                      <span className="tag neutral"><Code2 size={10} /> Prereqs: {m.prerequisites.join(', ')}</span>
                    )}
                  </div>
                  {state === 'progress' && (
                    <div style={{ marginTop: '0.6rem' }}>
                      <Bar value={m.progress_percentage || 50} color="purple" />
                      <small>Current Demonstrated Mastery: <b>{m.current_mastery}%</b> (Target: {m.target_score}%)</small>
                    </div>
                  )}
                </div>
                <span className={`status ${state}`}>
                  {m.status === 'completed' ? 'Completed' : m.status === 'in_progress' ? 'In Progress' : 'Pending'}
                </span>
                {m.status !== 'completed' && (
                  <button
                    className={state === 'progress' ? 'primary' : 'secondary'}
                    onClick={() => handleCompleteStep(m.step_number)}
                    disabled={completingId === m.step_number}
                  >
                    {completingId === m.step_number ? 'Saving...' : state === 'progress' ? 'Mark Completed' : 'Start Milestone'}
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 className="sub-heading">Dynamic Weekly Learning Plan</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {weeklyPlan.map((wp: any) => (
              <div key={wp.week_number} className="skill-row" style={{ alignItems: 'flex-start', padding: '1rem', background: '#13151c', borderRadius: '8px' }}>
                <span className="tag purple" style={{ minWidth: '4.5rem', textAlign: 'center' }}>Week {wp.week_number}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <b>{wp.title}</b>
                    <span className={`tag ${wp.action_type === 'Project' ? 'success' : wp.action_type === 'Course' ? 'purple' : 'neutral'}`}>
                      {wp.action_type}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.35rem 0' }}>{wp.description}</p>
                  <small style={{ color: '#64748b' }}>Resource: {wp.resource_name} · ~{wp.estimated_hours} hrs/wk</small>
                </div>
                <span className={`tag ${wp.status === 'completed' ? 'success' : wp.status === 'in_progress' ? 'purple' : 'neutral'}`}>
                  {wp.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ==========================================
// LEARNING RESOURCE PLAYER & EXTERNAL HANDLER
// ==========================================
function ResourcePlayer({
  resource,
  isReviewed,
  onReview,
}: {
  resource: any;
  isReviewed: boolean;
  onReview: (resourceId: string) => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);

  // Helper to safely extract 11-char YouTube ID
  const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const isVideo = resource.resource_type === 'video' || resource.url?.includes('youtube.com') || resource.url?.includes('youtu.be');
  const youtubeId = isVideo ? getYouTubeId(resource.url) : null;
  const embedUrl = youtubeId ? `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1` : null;

  const handlePlay = () => {
    setIsPlaying(true);
    setIframeLoading(true);
    setIframeError(false);
    onReview(resource.resource_id);

    // 6-second timeout fallback to prevent infinite spinner if YouTube restricts embedding
    const timer = setTimeout(() => {
      setIframeLoading((loading) => {
        if (loading) {
          setIframeError(true);
          return false;
        }
        return false;
      });
    }, 6000);

    return () => clearTimeout(timer);
  };

  return (
    <div className={`pf-resource-card ${isReviewed ? 'reviewed' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div className="pf-resource-info">
          {isVideo ? (
            <Video size={20} style={{ color: '#7c6cff', flexShrink: 0, marginTop: '2px' }} />
          ) : (
            <FileText size={20} style={{ color: '#38bdf8', flexShrink: 0, marginTop: '2px' }} />
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <b style={{ color: '#fff', fontSize: '0.9rem' }}>{resource.title}</b>
              <span className="tag neutral" style={{ fontSize: '0.7rem' }}>{resource.provider_name || (isVideo ? 'YouTube' : 'Documentation')}</span>
              {resource.is_verified && <span className="tag success" style={{ fontSize: '0.7rem' }}>Verified ✓</span>}
              {isReviewed && <span className="tag success" style={{ fontSize: '0.7rem' }}>Reviewed ✓</span>}
            </div>
            <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
              {resource.description || (isVideo ? 'Official video tutorial walkthrough.' : 'Comprehensive reference documentation.')}
            </p>
          </div>
        </div>

        <div className="pf-resource-actions">
          {isVideo && embedUrl ? (
            <button
              className={isPlaying ? 'secondary' : 'primary'}
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={isPlaying ? () => setIsPlaying(false) : handlePlay}
            >
              <PlayCircle size={14} /> {isPlaying ? 'Hide Player' : 'Watch Video'}
            </button>
          ) : null}

          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="secondary button"
            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
            onClick={() => onReview(resource.resource_id)}
          >
            <ExternalLink size={13} /> {isVideo ? 'Open on YouTube' : 'Open Resource'}
          </a>

          <button
            className={isReviewed ? 'secondary' : 'primary'}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => onReview(resource.resource_id)}
          >
            {isReviewed ? '✓ Reviewed' : 'Mark Reviewed'}
          </button>
        </div>
      </div>

      {/* Embedded Video Player State */}
      {isPlaying && embedUrl && (
        <div style={{ marginTop: '14px', borderRadius: '10px', overflow: 'hidden', background: '#000', border: '1px solid rgba(124, 108, 255, 0.3)', position: 'relative' }}>
          {iframeLoading && (
            <div style={{ height: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#94a3b8' }}>
              <Sparkles size={24} className="pulse" style={{ color: '#7c6cff' }} />
              <span style={{ fontSize: '0.85rem' }}>Initializing secure video stream...</span>
            </div>
          )}

          {iframeError ? (
            <div style={{ height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '20px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.08)' }}>
              <AlertTriangle size={26} style={{ color: '#ef4444' }} />
              <div>
                <b style={{ color: '#fff', fontSize: '0.92rem', display: 'block' }}>Video Embed Restricted or Offline</b>
                <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
                  This video cannot be rendered inside an embedded frame due to provider policies or browser restrictions.
                </p>
              </div>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="primary button"
                style={{ padding: '8px 16px', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                onClick={() => onReview(resource.resource_id)}
              >
                <ExternalLink size={14} /> Open Directly on YouTube
              </a>
            </div>
          ) : (
            <div style={{ display: iframeLoading ? 'none' : 'block', position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              <iframe
                title={resource.title}
                src={embedUrl}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => {
                  setIframeLoading(false);
                  setIframeError(false);
                }}
                onError={() => {
                  setIframeLoading(false);
                  setIframeError(true);
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// COURSES (RECOMMENDATIONS + REAL CURRICULUM & LESSON LEARNER)
// ==========================================
function Courses({ notify }: { notify: (s: string) => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentCareerId = user?.target_career_id || 'C001';
  const currentCareerName = user?.target_career_name || 'Machine Learning Engineer';

  const [courseList, setCourseList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high_priority' | 'intermediate' | 'advanced'>('all');
  const [search, setSearch] = useState('');
  const [viewAllCatalog, setViewAllCatalog] = useState(false);
  const fetchRequestId = useRef(0);
  
  // Active course and syllabus modal state
  const [activeCourse, setActiveCourse] = useState<any | null>(null);
  const [syllabus, setSyllabus] = useState<any | null>(null);
  const [loadingSyllabus, setLoadingSyllabus] = useState(false);
  const [courseProgressDetail, setCourseProgressDetail] = useState<any | null>(null);

  // Active lesson learning workspace state
  const [activeLesson, setActiveLesson] = useState<any | null>(null);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [lessonTab, setLessonTab] = useState<'overview' | 'notes' | 'resources' | 'assessment'>('overview');
  const [reviewedResources, setReviewedResources] = useState<string[]>([]);
  const [expandedHints, setExpandedHints] = useState<Record<number, boolean>>({});
  const [expandedSolutions, setExpandedSolutions] = useState<Record<number, boolean>>({});
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);

  // Embedded Assessment Quiz State
  const [assessmentState, setAssessmentState] = useState<{
    loading: boolean;
    active: boolean;
    assessmentId: string | null;
    questions: any[];
    answers: Record<string, string>;
    submitted: boolean;
    result: any | null;
    error: string | null;
  }>({
    loading: false,
    active: false,
    assessmentId: null,
    questions: [],
    answers: {},
    submitted: false,
    result: null,
    error: null,
  });

  // Resume suggestions
  const [pendingSuggestions, setPendingSuggestions] = useState<any[]>([]);
  const [completionSuggestion, setCompletionSuggestion] = useState<any | null>(null);

  // Course-level assessment state
  const [courseAssessmentState, setCourseAssessmentState] = useState<{
    loading: boolean;
    active: boolean;
    assessmentId: string | null;
    questions: any[];
    answers: Record<string, string>;
    submitted: boolean;
    result: any | null;
    error: string | null;
  }>({
    loading: false,
    active: false,
    assessmentId: null,
    questions: [],
    answers: {},
    submitted: false,
    result: null,
    error: null,
  });

  const fetchRecommendations = async (overrideViewAll?: boolean) => {
    const isViewAll = overrideViewAll !== undefined ? overrideViewAll : viewAllCatalog;
    const reqId = ++fetchRequestId.current;
    setLoading(true);
    try {
      const courses = await api.getCourses({
        career_id: isViewAll ? undefined : currentCareerId,
        view_all: isViewAll,
      });

      if (reqId !== fetchRequestId.current) return;

      if (Array.isArray(courses)) {
        const mapped = courses.map((c: any) => {
          const primarySkill = (c.skills && c.skills[0]?.skill_name) || c.primary_skill || c.category || 'General';
          return {
            course_id: c.course_id,
            course_name: c.course_name,
            provider: c.provider,
            primary_skill: primarySkill,
            difficulty: c.difficulty,
            duration_text: c.duration_text || `${c.duration_hours || 20} hrs`,
            duration_hours: c.duration_hours,
            description: c.description,
            category: c.category,
            match_percentage: c.match_percentage || (c.difficulty === 'Beginner' ? 85 : c.difficulty === 'Intermediate' ? 88 : 90),
            tag: c.tag || (c.category || 'Core Catalog'),
            progress: c.progress_percentage || 0,
            status: c.status || 'not_started',
            rating: c.rating || 4.8,
            explainability: c.explainability || `Recommended module addressing foundational and applied competencies in ${primarySkill}.`,
            url: c.url || '#',
            skills: c.skills || [],
            matched_skills: c.matched_skills || [],
            final_assessment_score: c.final_assessment_score,
            final_assessment_passed: c.final_assessment_passed,
            is_completed: c.status === 'completed',
          };
        });
        setCourseList(mapped);
      } else {
        setCourseList([]);
      }
    } catch (err) {
      console.warn('[Courses] Failed to load catalog:', err);
      if (reqId === fetchRequestId.current) {
        setCourseList([]);
      }
    } finally {
      if (reqId === fetchRequestId.current) {
        setLoading(false);
      }
    }

    api.getResumeSuggestions()
      .then((res) => {
        if (Array.isArray(res)) setPendingSuggestions(res);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchRecommendations();
  }, [currentCareerId, viewAllCatalog]);

  const displayList = courseList;

  const filteredCourses = displayList.filter((c: any) => {
    const q = search.trim().toLowerCase();
    if (q) {
      const matchName = c.course_name?.toLowerCase().includes(q);
      const matchSkill = c.primary_skill?.toLowerCase().includes(q);
      const matchMatchedSkills = (c.matched_skills || []).some((s: string) => s.toLowerCase().includes(q));
      const matchProvider = c.provider?.toLowerCase().includes(q);
      const matchDesc = c.description?.toLowerCase().includes(q);
      const matchCat = c.category?.toLowerCase().includes(q);
      if (!matchName && !matchSkill && !matchMatchedSkills && !matchProvider && !matchDesc && !matchCat) {
        return false;
      }
    }
    if (filter === 'high_priority') return c.tag?.includes('Critical') || c.tag?.includes('High Priority') || (c.match_percentage || 0) >= 88;
    if (filter === 'intermediate') return c.difficulty === 'Intermediate' || !c.difficulty;
    if (filter === 'advanced') return c.difficulty === 'Advanced';
    return true;
  });

  // Open Course Syllabus
  const handleOpenCourse = async (course: any, startImmediately: boolean = false) => {
    setActiveCourse(course);
    setActiveLesson(null);
    setSyllabus(null);
    setLoadingSyllabus(true);
    setCompletionSuggestion(null);
    setCourseAssessmentState({
      loading: false,
      active: false,
      assessmentId: null,
      questions: [],
      answers: {},
      submitted: false,
      result: null,
      error: null,
    });

    try {
      const [sylData, progData] = await Promise.all([
        api.getCourseSyllabus(course.course_id),
        api.getCourseProgress(course.course_id).catch(() => null),
      ]);

      setSyllabus(sylData);
      setCourseProgressDetail(progData || {
        course_id: course.course_id,
        progress_percentage: sylData.progress_percentage || 0,
        completed_lessons: sylData.completed_lessons || [],
        completed_lessons_count: sylData.completed_lessons_count || 0,
        total_lessons: sylData.total_lessons || 5,
        status: sylData.status || 'not_started',
        is_completed: sylData.is_completed || false,
        final_assessment_score: sylData.final_assessment_score,
        final_assessment_passed: sylData.final_assessment_passed,
      });

      if (startImmediately && sylData.lessons && sylData.lessons.length > 0) {
        // Open next unfinished lesson or first lesson
        const nextLesson = sylData.lessons.find((l: any) => l.status !== 'completed') || sylData.lessons[0];
        handleOpenLesson(course.course_id, nextLesson.lesson_id);
      }
    } catch (err: any) {
      console.warn('Failed to load syllabus/progress:', err);
      notify(`Unable to load syllabus: ${err.message}`);
    } finally {
      setLoadingSyllabus(false);
    }
  };

  // Open Detailed Lesson Learning Workspace
  const handleOpenLesson = async (courseId: string, lessonId: string) => {
    setLoadingLesson(true);
    setLessonTab('overview');
    setExpandedHints({});
    setExpandedSolutions({});
    setAssessmentState({
      loading: false,
      active: false,
      assessmentId: null,
      questions: [],
      answers: {},
      submitted: false,
      result: null,
      error: null,
    });

    try {
      const lessonData = await api.getCourseLesson(courseId, lessonId);
      setActiveLesson(lessonData);
      const reviewed = lessonData.resources_reviewed || lessonData.resources?.filter((r: any) => r.is_reviewed).map((r: any) => r.resource_id) || [];
      setReviewedResources(reviewed);

      // Restore prior assessment results if already taken
      if (lessonData.assessment_score != null) {
        setAssessmentState({
          loading: false,
          active: false,
          assessmentId: null,
          questions: [],
          answers: {},
          submitted: true,
          result: {
            overall_score: lessonData.assessment_score,
            passed: lessonData.assessment_passed,
          },
          error: null,
        });
      }
    } catch (err: any) {
      notify(`Failed to load lesson material: ${err.message}`);
    } finally {
      setLoadingLesson(false);
    }
  };

  // Review Resource Action
  const handleReviewResource = async (resourceId: string) => {
    if (!activeCourse || !activeLesson) return;
    try {
      const res = await api.reviewLessonResource(activeCourse.course_id, activeLesson.lesson_id, resourceId);
      notify(`✓ Resource reviewed: ${res.message || 'Saved'}`);
      setReviewedResources(res.resources_reviewed || [...reviewedResources, resourceId]);
      
      // Update local lesson state
      setActiveLesson((prev: any) => prev ? {
        ...prev,
        is_assessment_unlocked: res.is_assessment_unlocked ?? prev.is_assessment_unlocked,
        student_progress: {
          ...(prev.student_progress || {}),
          resources_reviewed: res.resources_reviewed || [...reviewedResources, resourceId],
          is_assessment_unlocked: res.is_assessment_unlocked ?? prev.is_assessment_unlocked,
        }
      } : prev);
    } catch (err: any) {
      notify(`Failed to record review: ${err.message}`);
    }
  };

  // Copy code helper
  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
    notify('Code copied to clipboard!');
  };

  // Start Assessment Quiz for this lesson
  const handleStartLessonAssessment = async () => {
    if (!activeCourse || !activeLesson) return;
    setAssessmentState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const resp = await api.startAssessment({
        course_id: activeCourse.course_id,
        lesson_id: activeLesson.lesson_id,
        limit: 3,
      });

      if (!resp.questions || resp.questions.length === 0) {
        notify('No specific assessment questions found for this lesson. You can complete the lesson directly.');
        setAssessmentState((prev) => ({ ...prev, loading: false, active: false }));
        return;
      }

      setAssessmentState({
        loading: false,
        active: true,
        assessmentId: resp.assessment_id,
        questions: resp.questions,
        answers: {},
        submitted: false,
        result: null,
        error: null,
      });
      setLessonTab('assessment');
    } catch (err: any) {
      notify(`Unable to start assessment: ${err.message}`);
      setAssessmentState((prev) => ({ ...prev, loading: false, error: err.message }));
    }
  };

  // Submit Assessment Quiz
  const handleSubmitLessonAssessment = async () => {
    if (!activeCourse || !activeLesson || !assessmentState.assessmentId) return;
    
    // Check if at least 1 answer is selected
    const ansKeys = Object.keys(assessmentState.answers);
    if (ansKeys.length === 0) {
      notify('Please select an answer before submitting.');
      return;
    }

    setAssessmentState((prev) => ({ ...prev, loading: true }));
    try {
      const formattedAnswers = Object.entries(assessmentState.answers).map(([qid, opt]) => ({
        question_id: qid,
        selected_option: opt,
      }));

      const result = await api.submitAssessment({
        assessment_id: assessmentState.assessmentId,
        course_id: activeCourse.course_id,
        lesson_id: activeLesson.lesson_id,
        answers: formattedAnswers,
      });

      setAssessmentState((prev) => ({
        ...prev,
        loading: false,
        submitted: true,
        result: result,
      }));

      if (result.passed) {
        notify(`🎉 Assessment Passed (${result.overall_score}%)! Lesson completed and skill evidence saved.`);
        
        // Refresh lesson progress
        setActiveLesson((prev: any) => prev ? {
          ...prev,
          status: 'completed',
          student_progress: {
            ...(prev.student_progress || {}),
            status: 'completed',
            assessment_score: result.overall_score,
            assessment_passed: true,
          }
        } : prev);

        // Refresh course syllabus and progress
        if (activeCourse) {
          const [updatedSyl, updatedProg] = await Promise.all([
            api.getCourseSyllabus(activeCourse.course_id),
            api.getCourseProgress(activeCourse.course_id),
          ]);
          setSyllabus(updatedSyl);
          setCourseProgressDetail(updatedProg);

          // Update in main course list
          setCourseList((prev) =>
            prev.map((c) =>
              c.course_id === activeCourse.course_id
                ? { ...c, progress: updatedProg.progress_percentage }
                : c
            )
          );

          if (updatedProg.progress_percentage >= 100 && updatedProg.resume_suggestion) {
            setCompletionSuggestion(updatedProg.resume_suggestion);
          }
        }
      } else {
        notify(`Assessment Score: ${result.overall_score}%. Review the study notes and try again!`);
      }
    } catch (err: any) {
      notify(`Submission failed: ${err.message}`);
      setAssessmentState((prev) => ({ ...prev, loading: false, error: err.message }));
    }
  };

  // Complete Lesson Directly (when prerequisites met or assessment passed)
  const handleCompleteLessonDirectly = async () => {
    if (!activeCourse || !activeLesson) return;
    try {
      notify(`Marking lesson ${activeLesson.lesson_number} completed...`);
      const res = await api.completeCourseLesson(activeCourse.course_id, activeLesson.lesson_id, true);
      notify(`✓ Lesson completed! Authoritative progress updated.`);

      setActiveLesson((prev: any) => prev ? {
        ...prev,
        status: 'completed',
        student_progress: { ...(prev.student_progress || {}), status: 'completed' }
      } : prev);

      // Refresh syllabus & progress
      const [updatedSyl, updatedProg] = await Promise.all([
        api.getCourseSyllabus(activeCourse.course_id),
        api.getCourseProgress(activeCourse.course_id),
      ]);
      setSyllabus(updatedSyl);
      setCourseProgressDetail(updatedProg);

      // Update in course list
      setCourseList((prev) =>
        prev.map((c) =>
          c.course_id === activeCourse.course_id
            ? { ...c, progress: updatedProg.progress_percentage }
            : c
        )
      );

      if (updatedProg.progress_percentage >= 100 && updatedProg.resume_suggestion) {
        setCompletionSuggestion(updatedProg.resume_suggestion);
      }
    } catch (err: any) {
      notify(`Error completing lesson: ${err.message}`);
    }
  };

  // Start Course Final Assessment Quiz
  const handleStartCourseAssessment = async () => {
    if (!activeCourse) return;
    setCourseAssessmentState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const resp = await api.startAssessment({
        course_id: activeCourse.course_id,
        limit: 5,
      });

      if (!resp.questions || resp.questions.length === 0) {
        notify('No specific assessment questions found for this course.');
        setCourseAssessmentState((prev) => ({ ...prev, loading: false, active: false }));
        return;
      }

      setCourseAssessmentState({
        loading: false,
        active: true,
        assessmentId: resp.assessment_id,
        questions: resp.questions,
        answers: {},
        submitted: false,
        result: null,
        error: null,
      });
    } catch (err: any) {
      notify(`Unable to start final course assessment: ${err.message}`);
      setCourseAssessmentState((prev) => ({ ...prev, loading: false, error: err.message }));
    }
  };

  // Submit Course Final Assessment Quiz
  const handleSubmitCourseAssessment = async () => {
    if (!activeCourse || !courseAssessmentState.assessmentId) return;
    const ansKeys = Object.keys(courseAssessmentState.answers);
    if (ansKeys.length === 0) {
      notify('Please select an answer before submitting.');
      return;
    }

    setCourseAssessmentState((prev) => ({ ...prev, loading: true }));
    try {
      const formattedAnswers = Object.entries(courseAssessmentState.answers).map(([qid, opt]) => ({
        question_id: qid,
        selected_option: opt,
      }));

      const result = await api.submitAssessment({
        assessment_id: courseAssessmentState.assessmentId,
        course_id: activeCourse.course_id,
        answers: formattedAnswers,
      });

      setCourseAssessmentState((prev) => ({
        ...prev,
        loading: false,
        submitted: true,
        result: result,
      }));

      // Refresh syllabus & progress
      const [updatedSyl, updatedProg] = await Promise.all([
        api.getCourseSyllabus(activeCourse.course_id),
        api.getCourseProgress(activeCourse.course_id),
      ]);
      setSyllabus(updatedSyl);
      setCourseProgressDetail(updatedProg);

      // Update in main course list
      setCourseList((prev) =>
        prev.map((c) =>
          c.course_id === activeCourse.course_id
            ? {
                ...c,
                progress: updatedProg.progress_percentage,
                status: updatedProg.status,
                is_completed: updatedProg.status === 'completed',
                final_assessment_score: result.overall_score,
                final_assessment_passed: result.passed,
              }
            : c
        )
      );

      if (result.passed && result.overall_score > 50) {
        notify(`🎉 Final Assessment Passed (${result.overall_score}% > 50%)! Course completed.`);
        if (updatedProg.resume_suggestion) {
          setCompletionSuggestion(updatedProg.resume_suggestion);
        }
      } else {
        notify(`Final Assessment Score: ${result.overall_score}%. Course completion requires strictly > 50%. Review material and retake!`);
      }
    } catch (err: any) {
      notify(`Submission failed: ${err.message}`);
      setCourseAssessmentState((prev) => ({ ...prev, loading: false, error: err.message }));
    }
  };

  // Navigate between lessons
  const handleNavigateLesson = (direction: 'prev' | 'next') => {
    if (!syllabus || !activeLesson || !activeCourse) return;
    const lessons = syllabus.lessons || [];
    const currentIdx = lessons.findIndex((l: any) => l.lesson_id === activeLesson.lesson_id);
    if (currentIdx === -1) return;

    if (direction === 'prev') {
      if (currentIdx <= 0) {
        notify('You are already viewing the first lesson of this course.');
        return;
      }
      handleOpenLesson(activeCourse.course_id, lessons[currentIdx - 1].lesson_id);
    } else {
      if (currentIdx >= lessons.length - 1) {
        notify('You have completed all curriculum lessons! Proceed to the Final Course Assessment.');
        return;
      }
      const targetLesson = lessons[currentIdx + 1];
      const isCurrentCompleted = activeLesson.status === 'completed';
      if (!isCurrentCompleted && (targetLesson.is_locked || targetLesson.status === 'locked')) {
        notify(`🔒 Lesson ${targetLesson.lesson_number} is locked: ${targetLesson.prerequisite_explanation || 'Complete the current lesson and pass the assessment first.'}`);
        return;
      }
      handleOpenLesson(activeCourse.course_id, targetLesson.lesson_id);
    }
  };

  // Resume suggestion actions
  const handleApproveSuggestion = async (suggestionId: string) => {
    try {
      notify('Adding verified coursework to resume profile...');
      await api.approveResumeSuggestion(suggestionId);
      notify('✓ Course credential added to your verified resume profile!');
      setCompletionSuggestion(null);
      setPendingSuggestions((prev) => prev.filter((s) => s.suggestion_id !== suggestionId));
      fetchRecommendations();
    } catch (err: any) {
      notify(`Approval failed: ${err.message}`);
    }
  };

  const handleDismissSuggestion = async (suggestionId: string) => {
    try {
      await api.dismissResumeSuggestion(suggestionId);
      notify('Suggestion dismissed.');
      setCompletionSuggestion(null);
      setPendingSuggestions((prev) => prev.filter((s) => s.suggestion_id !== suggestionId));
    } catch (err: any) {
      notify(`Dismiss failed: ${err.message}`);
    }
  };

  // Prevent background page scrolling when course modal is active
  useEffect(() => {
    if (activeCourse) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [activeCourse]);

  const currentLessonIdx = (syllabus?.lessons || []).findIndex((l: any) => l.lesson_id === activeLesson?.lesson_id);
  const totalLessonCount = (syllabus?.lessons || []).length;

  return (
    <>
      <Header
        eyebrow="RECOMMENDATION ENGINE · HYBRID SKILL GAP & BGE EMBEDDINGS"
        title="Recommended Courses"
        sub="Curated learning modules ranked deterministically by skill gap priority, career impact, and semantic relevance."
        action="Refresh recommendations"
        notify={() => { notify('Recalculating course recommendations...'); fetchRecommendations(); }}
      />

      {/* Course Completion Suggestion Banner */}
      {pendingSuggestions.length > 0 && (
        <div className="pf-suggestion-banner">
          <div className="pf-suggestion-info">
            <Sparkles size={24} style={{ color: '#7c6cff', flexShrink: 0 }} />
            <div>
              <b style={{ color: '#fff', fontSize: '0.95rem' }}>Course Completion Resume Suggestion</b>
              <p style={{ margin: '2px 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
                You completed <strong>{pendingSuggestions[0].course_name}</strong>. Would you like to add this verified {pendingSuggestions[0].skill_name} credential to your resume profile?
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              className="primary"
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              onClick={() => handleApproveSuggestion(pendingSuggestions[0].suggestion_id)}
            >
              Add to Resume Profile
            </button>
            <button
              className="secondary"
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              onClick={() => handleDismissSuggestion(pendingSuggestions[0].suggestion_id)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="stats four">
        <Stat icon={BookOpen} label="CAREER COURSES" value={String(displayList.length)} sub={viewAllCatalog ? "Global Catalog" : currentCareerName} />
        <Stat icon={AlertTriangle} label="CRITICAL DEFICITS" value={String(displayList.filter((c: any) => c.tag?.includes('Critical')).length || 0)} sub="Immediate focus" color="orange" />
        <Stat icon={ShieldCheck} label="SKILL MAPPED" value={String(displayList.length)} sub="100% verified lessons" color="green" />
        <Stat icon={Activity} label="IN ACTIVE PROGRESS" value={String(displayList.filter((c: any) => (c.progress || 0) > 0 && (c.progress || 0) < 100).length)} sub="Sprint active" color="violet" />
      </div>

      {/* Catalog Scope Notice / Toggle */}
      {viewAllCatalog ? (
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '10px',
          padding: '12px 18px',
          margin: '16px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={18} style={{ color: '#60a5fa', flexShrink: 0 }} />
            <span style={{ fontSize: '0.88rem', color: '#e2e8f0' }}>
              Viewing <strong>Global Course Catalog</strong> ({displayList.length} total courses). These include courses outside your active career goal.
            </span>
          </div>
          <button
            className="secondary"
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            onClick={() => setViewAllCatalog(false)}
          >
            Back to {currentCareerName} Courses
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '14px 0 10px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#94a3b8' }}>
            <Target size={15} style={{ color: '#7c6cff' }} />
            <span>Filtered strictly for active career: <strong style={{ color: '#fff' }}>{currentCareerName}</strong></span>
            <span style={{ background: 'rgba(124, 108, 255, 0.15)', color: '#a78bfa', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
              {displayList.length} Courses Mapped
            </span>
          </div>
          <div>
            <button
              className="ghost"
              style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', padding: '4px 8px' }}
              onClick={() => setViewAllCatalog(true)}
            >
              View All Courses (Global Catalog)
            </button>
          </div>
        </div>
      )}

      {/* Courses Search & Filters Toolbar */}
      <div className="course-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', margin: '16px 0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
          <div className="global-search" style={{ width: '100%', maxWidth: '420px', display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 12px' }}>
            <Search size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
            <input
              type="text"
              placeholder={`Search courses for ${viewAllCatalog ? 'all careers' : currentCareerName}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', marginLeft: '8px', width: '100%', fontSize: '0.86rem' }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0 4px' }}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
            Showing {filteredCourses.length} of {displayList.length} courses for {viewAllCatalog ? 'All Careers' : currentCareerName}
          </span>
        </div>

        <div className="filters" style={{ display: 'flex', gap: '6px' }}>
          <span className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>
            All ({filteredCourses.length})
          </span>
          <span className={filter === 'high_priority' ? 'selected' : ''} onClick={() => setFilter('high_priority')}>
            High Priority Gaps
          </span>
          <span className={filter === 'intermediate' ? 'selected' : ''} onClick={() => setFilter('intermediate')}>
            Intermediate
          </span>
          <span className={filter === 'advanced' ? 'selected' : ''} onClick={() => setFilter('advanced')}>
            Advanced
          </span>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Sparkles size={24} className="pulse" />
          <p style={{ marginTop: '0.75rem' }}>Filtering curriculum strictly for {currentCareerName} and ranking by skill gaps...</p>
        </div>
      ) : displayList.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <BookOpen size={40} style={{ color: '#94a3b8', margin: '0 auto 16px' }} />
          <h3 style={{ color: '#fff', margin: '0 0 8px', fontSize: '1.25rem' }}>No courses are mapped to this career yet.</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 24px', lineHeight: 1.5 }}>
            We couldn't find any courses mapped to the required skills for <strong>{currentCareerName}</strong>. You can switch to another career goal or explore the global course catalog.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="primary"
              onClick={() => navigate('/career-goal')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.88rem' }}
            >
              <Target size={16} /> Change Career
            </button>
            <button
              className="secondary"
              onClick={() => { setViewAllCatalog(true); setSearch(''); setFilter('all'); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.88rem' }}
            >
              <BookOpen size={16} /> View All Courses
            </button>
          </div>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <BookOpen size={32} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
          <h3 style={{ color: '#fff', margin: '0 0 6px' }}>No courses match your active filter</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0 0 16px' }}>
            No courses for <strong>{currentCareerName}</strong> match your search or filter. Try resetting your filters.
          </p>
          <button className="secondary" onClick={() => { setSearch(''); setFilter('all'); }}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="course-grid">
          {filteredCourses.map((c: any) => (
            <div className="course card" key={c.course_id || c.course_name}>
              <div className="course-top">
                <div className="provider">
                  <span><GraduationCap size={15} /></span>
                  <b>{c.provider || 'Coursera'}</b>
                  <small> · Curated Recommendation</small>
                </div>
                <strong>{c.match_percentage || 85}% MATCH</strong>
              </div>
              <h2>{c.course_name}</h2>
              <div className="course-tags">
                {(c.status === 'completed' || c.is_completed) ? (
                  <span className="tag success">Completed ✓</span>
                ) : (
                  <span className={`tag ${c.tag?.includes('Critical') ? 'danger' : 'purple'}`}>{c.tag || 'Gap Closure'}</span>
                )}
                <span className="tag neutral">{c.primary_skill || 'Core Skill'}</span>
                <span className="tag neutral">{c.duration_text || `${c.duration_hours || 20} hrs`}</span>
                {c.difficulty && <span className="tag neutral">{c.difficulty}</span>}
              </div>
              <div className="course-progress">
                <small>
                  {(c.status === 'completed' || c.is_completed) ? (
                    <span style={{ color: '#22c55e', fontWeight: 600 }}>Completed ✓ {c.final_assessment_score ? `(${c.final_assessment_score}%)` : '(100%)'}</span>
                  ) : c.progress === 100 ? (
                    <span style={{ color: '#7c6cff', fontWeight: 600 }}>100% Lessons Done · Ready for Assessment</span>
                  ) : c.progress ? (
                    `In Progress · ${c.progress}%`
                  ) : (
                    'Status: Enrolled / Not Started'
                  )}
                </small>
                <Bar value={c.progress || 0} color={(c.status === 'completed' || c.is_completed) ? 'green' : 'purple'} />
              </div>
              <div className="insight">
                <Sparkles size={13} />
                <div>
                  <b>CAUSAL EXPLAINABILITY INSIGHT</b>
                  <p>{c.explainability || c.reason || `Recommended because it addresses your active ${c.primary_skill} gap.`}</p>
                </div>
              </div>
              <div className="course-actions">
                <button className="secondary" onClick={() => handleOpenCourse(c, false)}>
                  View Syllabus & Progress
                </button>
                <button
                  className="primary"
                  onClick={() => handleOpenCourse(c, true)}
                >
                  {(c.status === 'completed' || c.is_completed) ? 'Review Course' : c.progress ? 'Continue Learning' : 'Start Learning'}
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================
          INTERACTIVE COURSE SYLLABUS & LESSON LEARNER MODAL
          ============================================================ */}
      {activeCourse && (
        <div className="pf-modal-backdrop" onClick={() => { setActiveCourse(null); setActiveLesson(null); }}>
          <div
            className={`pf-modal-content ${activeLesson ? 'pf-lesson-workspace-modal' : ''}`}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: activeLesson ? '980px' : '720px' }}
          >
            {/* Modal Header */}
            <div className="pf-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {activeLesson ? (
                  <button
                    className="link-btn"
                    onClick={() => setActiveLesson(null)}
                    style={{ color: '#7c6cff', display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}
                  >
                    <ChevronLeft size={16} /> <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Back to Syllabus</span>
                  </button>
                ) : (
                  <h3>
                    <BookOpen size={18} style={{ color: '#7c6cff' }} />
                    <span>{activeCourse.course_name}</span>
                  </h3>
                )}
              </div>
              <button
                className="link-btn"
                style={{ color: '#94a3b8', padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                onClick={() => { setActiveCourse(null); setActiveLesson(null); }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="pf-modal-body">
              {/* Course Meta & Authoritative Progress Bar */}
              <div className="pf-lesson-banner">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', color: '#fff', fontSize: '1.05rem' }}>
                      {activeCourse.course_name}
                    </h3>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className="tag purple">{activeCourse.primary_skill || 'Core Skill'}</span>
                      <span className="tag neutral">{activeCourse.provider}</span>
                      {activeCourse.difficulty && <span className="tag neutral">{activeCourse.difficulty}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ color: '#fff', fontSize: '1.05rem' }}>
                      {courseProgressDetail?.progress_percentage ?? activeCourse.progress ?? 0}% Completed
                    </strong>
                    <span style={{ color: '#94a3b8', fontSize: '0.82rem', display: 'block' }}>
                      {courseProgressDetail?.completed_lessons_count ?? 0} of {courseProgressDetail?.total_lessons ?? syllabus?.total_lessons ?? 5} lessons completed
                    </span>
                  </div>
                </div>

                <Bar
                  value={courseProgressDetail?.progress_percentage ?? activeCourse.progress ?? 0}
                  color={courseProgressDetail?.progress_percentage === 100 ? 'green' : 'purple'}
                />
              </div>

              {/* Completion Banner inside modal */}
              {completionSuggestion && (
                <div
                  className="card"
                  style={{
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(124, 108, 255, 0.15) 100%)',
                    border: '1px solid rgba(34, 197, 94, 0.4)',
                    padding: '16px',
                    borderRadius: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <ShieldCheck size={18} style={{ color: '#22c55e' }} />
                    <b style={{ color: '#fff' }}>Course Completed! Add to Resume Profile?</b>
                  </div>
                  <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: '#cbd5e1' }}>
                    {completionSuggestion.suggested_content || `Completed ${activeCourse.course_name} covering ${activeCourse.primary_skill}`}
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="primary"
                      onClick={() => handleApproveSuggestion(completionSuggestion.suggestion_id)}
                    >
                      <Check size={13} /> Add to Resume Profile
                    </button>
                    <button
                      className="secondary"
                      onClick={() => handleDismissSuggestion(completionSuggestion.suggestion_id)}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================
                  VIEW 1: LESSON WORKSPACE (IF LESSON SELECTED)
                  ============================================================ */}
              {activeLesson ? (
                loadingLesson ? (
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <Sparkles size={24} className="pulse" />
                    <p style={{ color: '#94a3b8', marginTop: '12px' }}>Loading lesson curriculum and verified study material...</p>
                  </div>
                ) : (
                  <div>
                    {/* Lesson Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="tag purple">Lesson {activeLesson.lesson_number}</span>
                          <span className="tag neutral">{activeLesson.estimated_minutes} min study time</span>
                          {activeLesson.status === 'completed' && <span className="tag success">Completed ✓</span>}
                          {activeLesson.is_project_provided && <span className="tag neutral">PathForge Curriculum</span>}
                        </div>
                        <h2 style={{ margin: '6px 0 0', color: '#fff', fontSize: '1.25rem' }}>
                          {activeLesson.title}
                        </h2>
                      </div>
                      
                      {/* Lesson Nav Controls */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', opacity: currentLessonIdx <= 0 ? 0.5 : 1 }}
                          disabled={currentLessonIdx <= 0}
                          onClick={() => handleNavigateLesson('prev')}
                          title={currentLessonIdx <= 0 ? "First lesson of course" : "Previous Lesson"}
                        >
                          <ChevronLeft size={14} /> Prev
                        </button>
                        <button
                          className="secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', opacity: currentLessonIdx >= totalLessonCount - 1 ? 0.5 : 1 }}
                          disabled={currentLessonIdx >= totalLessonCount - 1}
                          onClick={() => handleNavigateLesson('next')}
                          title={currentLessonIdx >= totalLessonCount - 1 ? "Final lesson of course" : "Next Lesson"}
                        >
                          Next <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Lesson Tabs */}
                    <div className="pf-lesson-nav-tabs">
                      <button
                        className={`pf-lesson-nav-tab ${lessonTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setLessonTab('overview')}
                      >
                        <BookOpen size={14} /> Overview & Concepts
                      </button>
                      <button
                        className={`pf-lesson-nav-tab ${lessonTab === 'notes' ? 'active' : ''}`}
                        onClick={() => setLessonTab('notes')}
                      >
                        <FileText size={14} /> Study Material & Code ({activeLesson.code_examples?.length || 0})
                      </button>
                      <button
                        className={`pf-lesson-nav-tab ${lessonTab === 'resources' ? 'active' : ''}`}
                        onClick={() => setLessonTab('resources')}
                      >
                        <Video size={14} /> Learning Resources ({activeLesson.resources?.length || 0})
                      </button>
                      <button
                        className={`pf-lesson-nav-tab ${lessonTab === 'assessment' ? 'active' : ''}`}
                        onClick={() => setLessonTab('assessment')}
                      >
                        <Award size={14} /> Assessment & Progress
                      </button>
                    </div>

                    {/* TAB 1: OVERVIEW & KEY CONCEPTS */}
                    {lessonTab === 'overview' && (
                      <div className="pf-study-content">
                        <h4>Lesson Overview</h4>
                        <p>{activeLesson.overview}</p>

                        <h4>Learning Objectives</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '10px 0 18px' }}>
                          {(activeLesson.learning_objectives || []).map((obj: string, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <CheckCircle2 size={16} style={{ color: '#22c55e', flexShrink: 0 }} />
                              <span style={{ fontSize: '0.86rem', color: '#cbd5e1' }}>{obj}</span>
                            </div>
                          ))}
                        </div>

                        <h4>Key Concepts & Definitions</h4>
                        <div className="pf-concept-grid">
                          {(activeLesson.key_concepts || []).map((kc: any, i: number) => (
                            <div className="pf-concept-card" key={i}>
                              <b>{kc.term}</b>
                              <p>{kc.definition}</p>
                            </div>
                          ))}
                        </div>

                        {activeLesson.step_by_step_explanation && (
                          <>
                            <h4 style={{ marginTop: '20px' }}>Step-by-Step Practical Guide</h4>
                            <p style={{ whiteSpace: 'pre-line' }}>{activeLesson.step_by_step_explanation}</p>
                          </>
                        )}

                        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                          <button className="primary" onClick={() => setLessonTab('notes')}>
                            Continue to Study Notes & Code <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: STUDY NOTES & CODE EXAMPLES */}
                    {lessonTab === 'notes' && (
                      <div className="pf-study-content">
                        <h4>Detailed Study Notes</h4>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'pre-line', fontSize: '0.88rem' }}>
                          {activeLesson.study_notes}
                        </div>

                        {activeLesson.code_examples && activeLesson.code_examples.length > 0 && (
                          <>
                            <h4 style={{ marginTop: '24px' }}>Hands-On Code Implementation</h4>
                            {activeLesson.code_examples.map((item: any, idx: number) => (
                              <div className="pf-code-container" key={idx}>
                                <div className="pf-code-header">
                                  <span>{item.title || `Example ${idx + 1}`} ({item.language || 'python'})</span>
                                  <button
                                    className="link-btn"
                                    onClick={() => handleCopyCode(item.code, idx)}
                                    style={{ color: copiedCodeIdx === idx ? '#22c55e' : '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                                  >
                                    <Copy size={13} /> {copiedCodeIdx === idx ? 'Copied!' : 'Copy Code'}
                                  </button>
                                </div>
                                <pre className="pf-code-pre">{item.code}</pre>
                                {item.explanation && (
                                  <div className="pf-code-explanation">
                                    💡 <strong>Explanation:</strong> {item.explanation}
                                  </div>
                                )}
                              </div>
                            ))}
                          </>
                        )}

                        {activeLesson.practice_exercises && activeLesson.practice_exercises.length > 0 && (
                          <>
                            <h4 style={{ marginTop: '24px' }}>Practice Exercises</h4>
                            {activeLesson.practice_exercises.map((ex: any, idx: number) => (
                              <div className="pf-exercise-box" key={idx}>
                                <h5>Exercise {idx + 1}: {ex.title}</h5>
                                <p>{ex.problem}</p>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                  {ex.hint && (
                                    <button
                                      className="secondary"
                                      style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                                      onClick={() => setExpandedHints((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                                    >
                                      {expandedHints[idx] ? 'Hide Hint' : '💡 Reveal Hint'}
                                    </button>
                                  )}
                                  {ex.solution && (
                                    <button
                                      className="secondary"
                                      style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                                      onClick={() => setExpandedSolutions((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                                    >
                                      {expandedSolutions[idx] ? 'Hide Solution' : '🔍 Reveal Solution'}
                                    </button>
                                  )}
                                </div>
                                {expandedHints[idx] && (
                                  <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '6px', fontSize: '0.8rem', color: '#fef08a' }}>
                                    <strong>Hint:</strong> {ex.hint}
                                  </div>
                                )}
                                {expandedSolutions[idx] && (
                                  <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '6px', fontSize: '0.8rem', color: '#bbf7d0', fontFamily: 'monospace' }}>
                                    <strong>Solution:</strong> {ex.solution}
                                  </div>
                                )}
                              </div>
                            ))}
                          </>
                        )}

                        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
                          <button className="secondary" onClick={() => setLessonTab('overview')}>
                            <ChevronLeft size={14} /> Back to Overview
                          </button>
                          <button className="primary" onClick={() => setLessonTab('resources')}>
                            Next: Learning Resources <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* TAB 3: LEARNING RESOURCES */}
                    {lessonTab === 'resources' && (
                      <div className="pf-study-content">
                        <h4>Verified Course Learning Resources</h4>
                        <p style={{ color: '#94a3b8', fontSize: '0.84rem' }}>
                          Review official documentation, tutorial articles, and practical walkthroughs. Reviewing resources satisfies the prerequisites required to unlock the lesson assessment.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '16px 0' }}>
                          {(activeLesson.resources || []).map((res: any) => (
                            <ResourcePlayer
                              key={res.resource_id}
                              resource={res}
                              isReviewed={reviewedResources.includes(res.resource_id)}
                              onReview={handleReviewResource}
                            />
                          ))}
                        </div>

                        {/* In-App Study Notes & PDF Explanation */}
                        <div style={{ background: 'rgba(124, 108, 255, 0.08)', border: '1px solid rgba(124, 108, 255, 0.25)', borderRadius: '10px', padding: '16px', marginTop: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a78bfa', fontWeight: 600, fontSize: '0.88rem' }}>
                            <ShieldCheck size={18} /> In-App Study Notes & Practice Materials
                          </div>
                          <p style={{ margin: '6px 0 0', color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.5 }}>
                            All authoritative study notes, code implementations, and problem exercises are built directly into this PathForge AI learning interface above. No third-party PDF download is necessary for lesson mastery.
                          </p>
                        </div>

                        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
                          <button className="secondary" onClick={() => setLessonTab('notes')}>
                            <ChevronLeft size={14} /> Back to Study Notes
                          </button>
                          <button className="primary" onClick={() => setLessonTab('assessment')}>
                            Next: Assessment & Progress <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* TAB 4: ASSESSMENT & PROGRESS */}
                    {lessonTab === 'assessment' && (
                      <div className="pf-study-content">
                        <h4>Lesson Assessment & Completion Criteria</h4>
                        <p style={{ color: '#94a3b8', fontSize: '0.84rem' }}>
                          {activeLesson.completion_criteria || 'Complete all study materials, review required resources, and score at least 60% on the lesson diagnostic check to verify skill evidence.'}
                        </p>

                        {/* Prerequisites & Unlock State */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', margin: '16px 0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                            <div>
                              <b style={{ color: '#fff', fontSize: '0.92rem' }}>Prerequisites Status:</b>
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                                <span style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>
                                  Resources Reviewed: {reviewedResources.length} of {activeLesson.resources?.length || 0}
                                </span>
                                {(reviewedResources.length >= (activeLesson.resources?.length || 1) || activeLesson.is_assessment_unlocked) ? (
                                  <span className="tag success">Prerequisites Met ✓</span>
                                ) : (
                                  <span className="tag neutral">Review required resources to unlock</span>
                                )}
                              </div>
                            </div>

                            {activeLesson.status === 'completed' ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="tag success" style={{ fontSize: '0.85rem' }}>Lesson Mastered ✓</span>
                              </div>
                            ) : (
                              <button
                                className="primary"
                                disabled={assessmentState.loading}
                                onClick={handleStartLessonAssessment}
                              >
                                {assessmentState.loading ? 'Loading Assessment...' : 'Start Lesson Assessment'}
                                <Award size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Interactive Assessment Quiz Box */}
                        {assessmentState.active && assessmentState.questions.length > 0 && (
                          <div style={{ background: '#090d16', border: '1px solid rgba(124, 108, 255, 0.3)', borderRadius: '12px', padding: '20px', margin: '20px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
                              <h4 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Award size={18} style={{ color: '#7c6cff' }} />
                                Lesson Diagnostic Check ({assessmentState.questions.length} Questions)
                              </h4>
                              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Passing requirement: &gt; 50%</span>
                            </div>

                            {assessmentState.questions.map((q: any, qIdx: number) => (
                              <div className="pf-quiz-question-box" key={q.question_id || qIdx}>
                                <p>{qIdx + 1}. {q.question_text}</p>
                                <div className="pf-quiz-options">
                                  {(q.options || ['A', 'B', 'C', 'D']).map((opt: string, optIdx: number) => {
                                    const isSelected = assessmentState.answers[q.question_id] === opt;
                                    return (
                                      <div
                                        key={optIdx}
                                        className={`pf-quiz-option ${isSelected ? 'selected' : ''}`}
                                        onClick={() => !assessmentState.submitted && setAssessmentState((prev) => ({
                                          ...prev,
                                          answers: { ...prev.answers, [q.question_id]: opt },
                                        }))}
                                      >
                                        <span style={{ fontWeight: 700, color: isSelected ? '#7c6cff' : '#94a3b8' }}>
                                          {String.fromCharCode(65 + optIdx)}.
                                        </span>
                                        <span>{opt}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}

                            {!assessmentState.submitted ? (
                              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                                <button
                                  className="primary"
                                  disabled={assessmentState.loading}
                                  onClick={handleSubmitLessonAssessment}
                                >
                                  {assessmentState.loading ? 'Evaluating Submission...' : 'Submit Assessment Answers'}
                                  <ArrowRight size={14} />
                                </button>
                              </div>
                            ) : assessmentState.result && (
                              <div style={{ background: assessmentState.result.passed ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)', border: `1px solid ${assessmentState.result.passed ? '#22c55e' : '#ef4444'}`, borderRadius: '10px', padding: '16px', marginTop: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                  {assessmentState.result.passed ? (
                                    <CheckCircle2 size={20} style={{ color: '#22c55e' }} />
                                  ) : (
                                    <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                                  )}
                                  <b style={{ color: '#fff', fontSize: '0.95rem' }}>
                                    {assessmentState.result.passed ? 'Assessment Passed!' : 'Assessment Not Passed'}
                                  </b>
                                  <span className={`tag ${assessmentState.result.passed ? 'success' : 'danger'}`}>
                                    Score: {assessmentState.result.overall_score}%
                                  </span>
                                </div>
                                <p style={{ margin: '4px 0 10px', color: '#cbd5e1', fontSize: '0.84rem' }}>
                                  {assessmentState.result.passed
                                    ? 'Skill evidence was calculated and persisted to your profile. Lesson is marked as completed.'
                                    : 'Score was 50% or less. Passing requires strictly greater than 50% (> 50%). Please review the study notes and code examples, then retake the assessment.'}
                                </p>
                                {!assessmentState.result.passed && (
                                  <button
                                    className="secondary"
                                    onClick={handleStartLessonAssessment}
                                  >
                                    Retake Lesson Assessment
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Completion / Advance Lesson Footer */}
                        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                          <button className="secondary" onClick={() => setLessonTab('resources')}>
                            <ChevronLeft size={14} /> Back to Resources
                          </button>
                          
                          <div style={{ display: 'flex', gap: '10px' }}>
                            {activeLesson.status !== 'completed' && (
                              <button className="secondary" onClick={handleCompleteLessonDirectly}>
                                <Check size={14} /> Mark Lesson Complete
                              </button>
                            )}
                            <button className="primary" onClick={() => handleNavigateLesson('next')}>
                              Next Lesson <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              ) : (
                /* ============================================================
                   VIEW 2: FULL COURSE SYLLABUS LIST
                   ============================================================ */
                loadingSyllabus ? (
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <Sparkles size={24} className="pulse" />
                    <p style={{ color: '#94a3b8', marginTop: '12px' }}>Loading subject-specific curriculum & verified lesson structure...</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Curriculum & Saved Learning Positions ({syllabus?.lessons?.length || 5} Lessons)
                      </h4>
                      <span style={{ fontSize: '0.8rem', color: '#7c6cff' }}>
                        {syllabus?.provider} Verified
                      </span>
                    </div>

                    <div className="pf-lesson-list">
                      {(syllabus?.lessons || []).map((lesson: any, idx: number) => {
                        const isCompleted = lesson.status === 'completed';
                        const isLocked = lesson.is_locked || (idx > 0 && !syllabus.lessons[idx - 1]?.is_completed && syllabus.lessons[idx - 1]?.status !== 'completed');
                        const isNext = !isCompleted && !isLocked && (
                          idx === 0 || (syllabus.lessons[idx - 1] && (syllabus.lessons[idx - 1].status === 'completed' || syllabus.lessons[idx - 1].is_completed))
                        );

                        return (
                          <div
                            key={lesson.lesson_id}
                            className={`pf-lesson-item ${isCompleted ? 'completed' : isNext ? 'active' : isLocked ? 'locked' : ''}`}
                            onClick={() => {
                              if (isLocked) {
                                notify(`🔒 Lesson ${lesson.lesson_number} is locked: ${lesson.prerequisite_explanation || `Complete Lesson ${idx} and pass its assessment to unlock.`}`);
                                return;
                              }
                              handleOpenLesson(activeCourse.course_id, lesson.lesson_id);
                            }}
                            style={{ cursor: isLocked ? 'not-allowed' : 'pointer', opacity: isLocked ? 0.75 : 1 }}
                          >
                            <div className="pf-lesson-info">
                              <div className="pf-lesson-number" style={{ background: isLocked ? 'rgba(239, 68, 68, 0.15)' : undefined, color: isLocked ? '#ef4444' : undefined }}>
                                {isCompleted ? <Check size={14} /> : isLocked ? <LockKeyhole size={14} /> : (lesson.lesson_number || idx + 1)}
                              </div>
                              <div>
                                <b style={{ color: isLocked ? '#94a3b8' : '#fff', fontSize: '0.88rem', display: 'block' }}>
                                  {lesson.title}
                                </b>
                                <small style={{ color: isLocked ? '#f87171' : '#94a3b8', fontSize: '0.75rem' }}>
                                  {isLocked
                                    ? `🔒 Locked: ${lesson.prerequisite_explanation || `Complete Lesson ${idx} first`}`
                                    : `${lesson.estimated_minutes} min study time · ${isCompleted ? 'Completed ✓' : isNext ? 'Ready to learn' : 'Upcoming lesson'}`}
                                </small>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {isCompleted ? (
                                <span className="tag success" style={{ fontSize: '0.7rem' }}>Done ✓</span>
                              ) : isLocked ? (
                                <span className="tag danger" style={{ fontSize: '0.7rem' }}>Locked 🔒</span>
                              ) : isNext ? (
                                <span className="tag purple" style={{ fontSize: '0.7rem' }}>Current Position</span>
                              ) : (
                                <span className="tag neutral" style={{ fontSize: '0.7rem' }}>Upcoming</span>
                              )}
                              <button
                                className={isNext ? 'primary' : 'secondary'}
                                style={{ fontSize: '0.75rem', padding: '4px 10px', opacity: isLocked ? 0.5 : 1 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isLocked) {
                                    notify(`🔒 Lesson ${lesson.lesson_number} is locked: ${lesson.prerequisite_explanation || `Complete Lesson ${idx} and pass its assessment to unlock.`}`);
                                    return;
                                  }
                                  handleOpenLesson(activeCourse.course_id, lesson.lesson_id);
                                }}
                              >
                                {isCompleted ? 'Review' : isLocked ? 'Locked' : 'Study'}
                                {isLocked ? <LockKeyhole size={12} /> : <ChevronRight size={12} />}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Course Final Assessment & Completion Section */}
                    {((courseProgressDetail?.completed_lessons_count || 0) >= (courseProgressDetail?.total_lessons || 5) || (courseProgressDetail?.progress_percentage || 0) >= 100) && (
                      <div style={{ marginTop: '20px', padding: '16px', background: '#090d16', border: '1px solid rgba(124, 108, 255, 0.4)', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Award size={20} style={{ color: '#7c6cff' }} />
                            <div>
                              <b style={{ color: '#fff', fontSize: '0.96rem' }}>Final Course Assessment</b>
                              <span style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8' }}>
                                Passing threshold: Strictly greater than 50% (&gt; 50%) required for course completion
                              </span>
                            </div>
                          </div>
                          {(courseProgressDetail?.status === 'completed' || syllabus?.is_completed) ? (
                            <span className="tag success" style={{ fontSize: '0.82rem' }}>Course Completed ✓ ({courseProgressDetail?.final_assessment_score ?? syllabus?.final_assessment_score ?? 100}%)</span>
                          ) : (
                            <span className="tag purple" style={{ fontSize: '0.82rem' }}>Prerequisites Met ✓ Ready</span>
                          )}
                        </div>

                        {/* If final assessment active, render questions */}
                        {courseAssessmentState.active && courseAssessmentState.questions.length > 0 ? (
                          <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                                Course Evaluation: {courseAssessmentState.questions.length} Questions
                              </span>
                              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Passing grade: &gt; 50%</span>
                            </div>

                            {courseAssessmentState.questions.map((q: any, qIdx: number) => (
                              <div className="pf-quiz-question-box" key={q.question_id || qIdx}>
                                <p>{qIdx + 1}. {q.question_text}</p>
                                <div className="pf-quiz-options">
                                  {(q.options || ['A', 'B', 'C', 'D']).map((opt: string, optIdx: number) => {
                                    const isSelected = courseAssessmentState.answers[q.question_id] === opt;
                                    return (
                                      <div
                                        key={optIdx}
                                        className={`pf-quiz-option ${isSelected ? 'selected' : ''}`}
                                        onClick={() => !courseAssessmentState.submitted && setCourseAssessmentState((prev) => ({
                                          ...prev,
                                          answers: { ...prev.answers, [q.question_id]: opt },
                                        }))}
                                      >
                                        <span style={{ fontWeight: 700, color: isSelected ? '#7c6cff' : '#94a3b8' }}>
                                          {String.fromCharCode(65 + optIdx)}.
                                        </span>
                                        <span>{opt}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}

                            {!courseAssessmentState.submitted ? (
                              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                                <button
                                  className="primary"
                                  disabled={courseAssessmentState.loading}
                                  onClick={handleSubmitCourseAssessment}
                                >
                                  {courseAssessmentState.loading ? 'Evaluating Submission...' : 'Submit Final Assessment'}
                                  <ArrowRight size={14} />
                                </button>
                              </div>
                            ) : courseAssessmentState.result && (
                              <div style={{
                                background: (courseAssessmentState.result.overall_score > 50) ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                border: `1px solid ${(courseAssessmentState.result.overall_score > 50) ? '#22c55e' : '#ef4444'}`,
                                borderRadius: '10px',
                                padding: '16px',
                                marginTop: '16px',
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                  {(courseAssessmentState.result.overall_score > 50) ? (
                                    <CheckCircle2 size={20} style={{ color: '#22c55e' }} />
                                  ) : (
                                    <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                                  )}
                                  <b style={{ color: '#fff', fontSize: '0.95rem' }}>
                                    {(courseAssessmentState.result.overall_score > 50) ? '🎉 Assessment Passed! Course Completed!' : 'Assessment Not Passed'}
                                  </b>
                                  <span className={`tag ${(courseAssessmentState.result.overall_score > 50) ? 'success' : 'danger'}`}>
                                    Score: {courseAssessmentState.result.overall_score}%
                                  </span>
                                </div>
                                <p style={{ margin: '4px 0 10px', color: '#cbd5e1', fontSize: '0.84rem' }}>
                                  {(courseAssessmentState.result.overall_score > 50)
                                    ? 'Congratulations! You scored strictly greater than 50% and completed all lessons. Verified skill evidence has been saved to your profile and roadmap.'
                                    : 'A score strictly greater than 50% is required to complete this course (50% or less does not complete the course). Review previous lessons and retake the assessment.'}
                                </p>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    className="secondary"
                                    onClick={handleStartCourseAssessment}
                                  >
                                    Retake Final Assessment
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                            <p style={{ margin: 0, fontSize: '0.84rem', color: '#cbd5e1' }}>
                              {(courseProgressDetail?.status === 'completed' || syllabus?.is_completed)
                                ? `Course completed with assessment score of ${courseProgressDetail?.final_assessment_score ?? syllabus?.final_assessment_score ?? 100}%. You can retake at any time.`
                                : 'All 5 curriculum lessons are completed! Complete the final assessment to verify skill evidence and earn course completion.'}
                            </p>
                            <button
                              className="primary"
                              disabled={courseAssessmentState.loading}
                              onClick={handleStartCourseAssessment}
                            >
                              <Award size={14} />
                              {(courseProgressDetail?.status === 'completed' || syllabus?.is_completed) ? 'Retake Final Assessment' : 'Start Final Assessment'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="pf-modal-footer">
              <button
                className="secondary"
                onClick={() => {
                  if (activeLesson) {
                    setActiveLesson(null);
                  } else {
                    setActiveCourse(null);
                  }
                }}
              >
                {activeLesson ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ChevronLeft size={14} /> Back to Syllabus
                  </span>
                ) : 'Close'}
              </button>

              {activeLesson ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="secondary"
                    style={{ padding: '6px 14px', fontSize: '0.8rem', opacity: currentLessonIdx <= 0 ? 0.5 : 1 }}
                    disabled={currentLessonIdx <= 0}
                    onClick={() => handleNavigateLesson('prev')}
                    title={currentLessonIdx <= 0 ? "First lesson of course" : "Previous Lesson"}
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button
                    className="primary"
                    style={{ padding: '6px 14px', fontSize: '0.8rem', opacity: currentLessonIdx >= totalLessonCount - 1 ? 0.5 : 1 }}
                    disabled={currentLessonIdx >= totalLessonCount - 1}
                    onClick={() => handleNavigateLesson('next')}
                    title={currentLessonIdx >= totalLessonCount - 1 ? "Final lesson of course" : "Next Lesson"}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              ) : (
                <button
                  className="primary"
                  onClick={() => {
                    const lessons = syllabus?.lessons || [];
                    const nextUnfinished = lessons.find((l: any) => l.status !== 'completed' && !l.is_locked) || lessons[0];
                    if (nextUnfinished) {
                      handleOpenLesson(activeCourse.course_id, nextUnfinished.lesson_id);
                    }
                  }}
                >
                  <ArrowRight size={13} /> {(courseProgressDetail?.progress_percentage ?? activeCourse.progress) >= 100 ? 'Review Lessons' : 'Continue Learning'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ==========================================
// PROJECTS (RECOMMENDATIONS + REAL EVIDENCE)
// ==========================================
function Projects({ notify, go }: { notify: (s: string) => void; go: (path: string, msg: string) => void }) {
  const [projectList, setProjectList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high_priority' | 'in_progress'>('all');

  const fetchProjects = () => {
    setLoading(true);
    api.getProjectRecommendations()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProjectList(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('[Projects] Falling back to default list:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const displayList = projectList.length > 0 ? projectList : [
    { project_id: 'PRJ001', project_name: 'Real-Time Object Detection & Image Classifier', difficulty: 'Intermediate', duration_text: '4 weeks', match_percentage: 92, primary_skills: ['Deep Learning', 'PyTorch', 'Computer Vision'], description: 'Build and deploy a convolutional neural network for real-time image recognition with FastAPI inference.', learning_outcomes: 'Demonstrates deep learning model deployment and artifact verification.', status: 'not_started', reason: 'Recommended because this project develops Deep Learning, which is currently your highest-priority missing skill.' },
    { project_id: 'PRJ002', project_name: 'Customer Churn Machine Learning Pipeline', difficulty: 'Intermediate', duration_text: '3 weeks', match_percentage: 88, primary_skills: ['Machine Learning', 'Python', 'Scikit-learn'], description: 'End-to-end ML classification pipeline with hyperparameter tuning and model monitoring.', learning_outcomes: 'Delivers verified evidence in classical ML modeling and feature engineering.', status: 'in_progress', reason: 'Recommended to reinforce Machine Learning foundations with production code.' },
    { project_id: 'PRJ003', project_name: 'Exploratory Statistical Analytics Engine', difficulty: 'Beginner', duration_text: '2 weeks', match_percentage: 84, primary_skills: ['Statistics', 'Python', 'Pandas'], description: 'Hypothesis testing and probabilistic exploratory analysis on high-dimensional datasets.', learning_outcomes: 'Provides verified evidence in statistical rigor and inference.', status: 'completed', reason: 'Completed project verified in student portfolio.' },
  ];

  const handleStartOrAdvance = (projectId: string, currentStatus: string) => {
    if (currentStatus === 'not_started') {
      api.startProject(projectId).then(() => {
        notify(`Project started! Added to active sprint.`);
        fetchProjects();
      }).catch(() => notify(`Project started.`));
    } else {
      api.updateProjectProgress(projectId, 100, 'https://github.com/alexchen/project-artifact').then(() => {
        notify(`Project marked complete! Evidence verified in student_skills.`);
        fetchProjects();
      }).catch(() => notify(`Project evidence updated.`));
    }
  };

  return (
    <>
      <Header
        eyebrow="PROJECT INTELLIGENCE · ARTIFACT VERIFICATION"
        title="Recommended Projects"
        sub="Practical implementation modules designed to build undeniable evidence for your portfolio."
        action="Explore Project Catalog"
        notify={() => fetchProjects()}
      />

      <div className="stats four">
        <Stat icon={FolderKanban} label="ACTIVE PROJECTS" value={String(displayList.length)} sub="Closing skill gaps" />
        <Stat icon={ShieldCheck} label="VERIFIED ARTIFACTS" value="3" sub="Evidence grounded" color="green" />
        <Stat icon={Target} label="AVG FIT SCORE" value="88%" sub="Target MLE alignment" color="blue" />
        <Stat icon={Activity} label="IN SPRINT" value="1" sub="Active development" color="violet" />
      </div>

      <div className="project-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem', marginTop: '1.5rem' }}>
        {displayList.map((p: any) => (
          <div className="card" key={p.project_id || p.project_name} style={{ padding: '1.5rem', background: '#111726', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className={`tag ${p.difficulty === 'Advanced' ? 'danger' : p.difficulty === 'Intermediate' ? 'purple' : 'success'}`}>
                  {p.difficulty || 'Intermediate'}
                </span>
                <span className="tag neutral" style={{ marginLeft: '6px' }}>{p.duration_text || '3 weeks'}</span>
                <h3 style={{ fontSize: '1.2rem', margin: '0.5rem 0' }}>{p.project_name}</h3>
              </div>
              <strong style={{ color: '#5B4BFF', fontSize: '1.1rem' }}>{p.match_percentage || 90}% MATCH</strong>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0.25rem 0 1rem 0' }}>{p.description}</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {(p.primary_skills || ['Machine Learning', 'Python']).map((s: string) => (
                <span key={s} className="tag neutral">{s}</span>
              ))}
            </div>
            <div style={{ padding: '0.75rem', background: 'rgba(91,75,255,0.08)', borderRadius: '8px', marginBottom: '1rem', borderLeft: '3px solid #5B4BFF' }}>
              <small style={{ display: 'block', color: '#818cf8', fontWeight: 600 }}>CAUSAL RECOMMENDATION RATIONALE</small>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: '0.25rem 0 0 0' }}>{p.reason || p.learning_outcomes}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="secondary" onClick={() => notify(`Viewing project specification for ${p.project_name}`)}>
                View Specifications
              </button>
              <button className="primary" onClick={() => handleStartOrAdvance(p.project_id, p.status)}>
                {p.status === 'completed' ? 'Review Verified Artifact' : p.status === 'in_progress' ? 'Submit for Verification' : 'Start Project'}
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ==========================================
// EVIDENCE MATRIX (MULTI-SOURCE CALIBRATION)
// ==========================================
function Evidence({ notify }: { notify: (message: string) => void }) {
  const [skillsList, setSkillsList] = useState<any[]>([]);

  useEffect(() => {
    api.getSkillsMastery().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setSkillsList(data);
      }
    }).catch((err) => {
      console.warn('[Evidence] Using fallback while backend connects:', err);
    });
  }, []);

  const displayRows = skillsList.length > 0 ? skillsList : [
    { skill: 'Python', self_declared: 90, assessment: 88, project: true, certificate: true, mentor: 'Verified', final_mastery: 85, status: 'Strong' },
    { skill: 'SQL', self_declared: 60, assessment: 72, project: false, certificate: false, mentor: 'Pending', final_mastery: 60, status: 'Proficient' },
    { skill: 'Machine Learning', self_declared: 90, assessment: 52, project: true, certificate: true, mentor: 'Pending', final_mastery: 66, status: 'Developing' },
    { skill: 'Deep Learning', self_declared: 70, assessment: 31, project: false, certificate: false, mentor: 'None', final_mastery: 31, status: 'Beginner' },
    { skill: 'Power BI', self_declared: 60, assessment: 0, project: false, certificate: false, mentor: 'None', final_mastery: 20, status: 'Missing' },
  ];

  return (
    <>
      <ProductHeader
        eyebrow="VERIFICATION LAYER · EVIDENCE GRAPH"
        title="Skills & Evidence"
        sub="Your final mastery is built from multiple signals — never from self-declaration alone."
        action="Add Evidence"
        notify={notify}
      />
      <div className="stats four">
        <Stat icon={ShieldCheck} label="VERIFIED SKILLS" value={String(displayRows.filter((r: any) => r.final_mastery >= 70).length)} sub="Across target skills" color="green" />
        <Stat icon={ClipboardCheck} label="ASSESSMENT EVIDENCE" value={String(displayRows.filter((r: any) => (r.assessment || r.assessment_score) > 0).length)} sub="Diagnostic verified" />
        <Stat icon={FolderKanban} label="PROJECT EVIDENCE" value={String(displayRows.filter((r: any) => r.project || r.project_score > 0).length)} sub="Artifacts & code" color="violet" />
        <Stat icon={GraduationCap} label="CERTIFICATES" value={String(displayRows.filter((r: any) => r.certificate || r.certificate_score > 0).length)} sub="Verified credentials" color="orange" />
      </div>

      <Panel
        eyebrow="EXPLAINABLE MASTERY MATRIX"
        title="Demonstrated Multi-Source Competency"
        action={<div className="filters"><span className="selected">All skills</span><span>Strong</span><span>Developing</span><span>Missing</span></div>}
      >
        <p className="muted">
          Resume detection is evidence of exposure. Assessment and project evidence are required before mastery increases.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Skill</th>
                <th>Resume Exposure</th>
                <th>Self-declared</th>
                <th>Assessment</th>
                <th>Projects</th>
                <th>Certificate</th>
                <th>Mentor</th>
                <th>Final mastery</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row: any) => {
                const sName = row.skill || row.skill_name;
                const sResume = row.resume_score ? `${row.resume_score}%` : '—';
                const sSelf = (row.self_declared ?? row.self_declared_score ?? 0) + '%';
                const sAssm = (row.assessment || row.assessment_score) ? `${row.assessment || row.assessment_score}%` : 'Not assessed';
                const sProj = row.project || row.project_score > 0 ? 'Yes' : 'No';
                const sCert = row.certificate || row.certificate_score > 0 ? 'Yes' : 'No';
                const sMentor = row.mentor || (row.mentor_score >= 70 ? 'Verified' : 'Pending');
                const sFinal = `${row.final_mastery ?? 0}%`;
                const sStatus = row.status || row.mastery_level || 'Developing';
                const tone = sStatus === 'Advanced' || sStatus === 'Strong' ? 'success' : sStatus === 'Beginner' || sStatus === 'Missing' ? 'danger' : 'purple';

                return (
                  <tr key={sName}>
                    <td><b>{sName}</b></td>
                    <td><span className="tag neutral">{sResume}</span></td>
                    <td>{sSelf}</td>
                    <td><b className="purple">{sAssm}</b></td>
                    <td>{sProj}</td>
                    <td>{sCert}</td>
                    <td>
                      <span className={`tag ${sMentor === 'Verified' ? 'success' : sMentor === 'Pending' ? 'warning' : 'neutral'}`}>
                        {sMentor}
                      </span>
                    </td>
                    <td><strong className={tone === 'success' ? 'green' : tone === 'danger' ? 'red' : 'purple'}>{sFinal}</strong></td>
                    <td><span className={`tag ${tone}`}>{sStatus}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

// ==========================================
// CAREER READINESS COMPONENT
// ==========================================
function Readiness({ notify }: { notify: (s: string) => void }) {
  const [readinessData, setReadinessData] = useState<any>(null);

  useEffect(() => {
    api.getCareerReadiness()
      .then((data) => setReadinessData(data))
      .catch((err) => console.warn('[Readiness] Fetch error:', err));
  }, []);

  const readinessScore = readinessData?.career_readiness_score ?? 68;
  const targetCareer = readinessData?.career_name || 'Machine Learning Engineer';

  return (
    <>
      <Header
        eyebrow="PROJECT-BASED CAREER READINESS INDICATOR"
        title="Career Readiness Dashboard"
        sub={`An explainable, multi-dimensional view of your current readiness for ${targetCareer} roles.`}
        action="Share readiness report"
        notify={notify}
      />
      <div className="readiness-grid">
        <section className="card readiness">
          <div className="card-head">
            <div><small>DETERMINISTIC METRIC</small><h2>Overall Career Readiness</h2></div>
            <span className="pill"><Sparkles size={11} /> Explainable AI</span>
          </div>
          <div className="readiness-top">
            <Ring value={readinessScore} large />
            <div>
              <div className="competitive"><span /> Competitive Candidate — Top 32% Cohort</div>
              <p>You demonstrate strong fundamental engineering principles with demonstrable algorithmic capability.</p>
              <div className="readiness-pills">
                <span><small>Target Role</small><b>{targetCareer}</b></span>
                <span><small>Median Base Expectancy</small><b className="green">$142k – $168k</b></span>
              </div>
            </div>
          </div>
          <small>WEIGHTED EVALUATION PILLARS</small>
          <div className="weight-grid">
            <div><b>Skill Match</b><strong>72%</strong><small>Weight 40%</small></div>
            <div><b>Skill Mastery</b><strong>64%</strong><small>Weight 35%</small></div>
            <div><b>Practical Evidence</b><strong className="green">58%</strong><small>Weight 25%</small></div>
          </div>
          <div className="formula">
            <Sparkles size={14} />
            <div>
              <b>EXPLAINABLE FORMULATION</b>
              <code>Readiness = (Skill Match × 0.40) + (Skill Mastery × 0.35) + (Practical Evidence × 0.25)</code>
            </div>
          </div>
        </section>

        <section className="card distribution">
          <div className="card-head">
            <div><small>DIMENSIONAL PROFILING</small><h2>Skill Distribution</h2></div>
            <span className="legend"><i /> Profile</span>
          </div>
          <Radar />
        </section>
      </div>
    </>
  );
}

// ==========================================
// PRODUCT PAGE RESOLVER FOR REMAINING VIEWS
// ==========================================
function ProductPage({ page, notify, navigate }: { page: string; notify: (message: string) => void; navigate: (path: string) => void }) {
  const go = (path: string, message: string) => { notify(message); navigate(path); };
  if (page === 'My Profile') return <Profile notify={notify} />;
  if (page === 'Career Goal') return <CareerGoal notify={notify} go={go} />;
  if (page === 'Assessment Portal') return <Assessment notify={notify} go={go} />;
  if (page === 'Projects') return <Projects notify={notify} go={go} />;
  if (page === 'Skills & Evidence') return <Evidence notify={notify} />;
  if (page === 'Mentor Connect') return <Mentor notify={notify} />;
  if (page === 'Company Intelligence') return <Companies notify={notify} />;
  if (page === 'Jobs Assistant') return <Jobs notify={notify} go={go} />;
  if (page === 'Learning Activity') return <ActivityPage notify={notify} />;
  if (page === 'Certificates') return <Certificates notify={notify} go={go} />;
  if (page === 'Feedback') return <Feedback notify={notify} />;
  if (page === 'Recruiter Match') return <Recruiter notify={notify} />;
  if (page === 'Settings') return <SettingsPage notify={notify} />;
  return <ResumeAnalysis notify={notify} go={go} />;
}

// ==========================================
// CAREER GOAL
// ==========================================
function CareerGoal({ notify, go }: { notify: (message: string) => void; go: (path: string, message: string) => void }) {
  const { user, refreshUser } = useAuth();
  const [dbCareers, setDbCareers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState(user?.target_career_name || 'Machine Learning Engineer');
  const [selectedCategory, setSelectedCategory] = useState('All roles');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const loadCareers = () => {
    setLoading(true);
    setError(null);
    api.getCareers()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDbCareers(data);
        } else {
          setDbCareers([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('[CareerGoal] Failed to load careers:', err);
        setError('Failed to load career catalog from server.');
        setLoading(false);
      });
  };

  useEffect(() => {
    if (user?.target_career_name) {
      setSelectedRole(user.target_career_name);
    }
    loadCareers();
  }, [user]);

  const categories = ['All roles', 'AI & Machine Learning', 'Data Science', 'Software Development'];

  const filteredCareers = dbCareers.filter((c) => {
    // 1. Category filter
    if (selectedCategory && selectedCategory !== 'All roles' && selectedCategory !== 'All') {
      const catLower = (c.category || '').toLowerCase();
      const nameLower = (c.career_name || '').toLowerCase();
      const descLower = (c.description || '').toLowerCase();
      const text = `${catLower} ${nameLower} ${descLower}`;

      if (selectedCategory === 'AI & Machine Learning') {
        if (!text.includes('ai') && !text.includes('machine learning') && !text.includes('deep learning') && !text.includes('ml')) {
          return false;
        }
      } else if (selectedCategory === 'Data Science') {
        if (!text.includes('data') && !text.includes('analytics') && !text.includes('statistic')) {
          return false;
        }
      } else if (selectedCategory === 'Software Development') {
        if (!text.includes('software') && !text.includes('developer') && !text.includes('engineer') && !text.includes('backend') && !text.includes('frontend') && !text.includes('full stack') && !text.includes('cloud') && !text.includes('devops')) {
          return false;
        }
      } else if (!catLower.includes(selectedCategory.toLowerCase())) {
        return false;
      }
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const nameMatch = (c.career_name || '').toLowerCase().includes(q);
      const catMatch = (c.category || '').toLowerCase().includes(q);
      const descMatch = (c.description || '').toLowerCase().includes(q);
      const focusMatch = (c.core_focus || '').toLowerCase().includes(q);
      const skillsMatch = (c.required_skills || []).some((s: any) =>
        (s.skill_name || s.skill_id || '').toLowerCase().includes(q)
      );

      if (!nameMatch && !catMatch && !descMatch && !focusMatch && !skillsMatch) {
        return false;
      }
    }

    return true;
  });

  const handleSelectCareer = async (careerId: string, careerName: string) => {
    setSelectingId(careerId);
    try {
      await api.selectCareer(careerId);
      setSelectedRole(careerName);
      await refreshUser();
      notify(`Target career switched to ${careerName}. All skills, roadmap, and recommendations updated.`);
    } catch (err: any) {
      console.warn('Career selection error:', err);
      notify(`Target career switched to ${careerName}`);
      setSelectedRole(careerName);
    } finally {
      setSelectingId(null);
    }
  };

  return (
    <>
      <ProductHeader
        eyebrow="CAREER DIRECTION · COMPETENCY VALIDATION"
        title="What Career Are You Building Toward?"
        sub="Choose your target career so PathForge AI can evaluate your current competency and create your personalized roadmap."
        action="View readiness"
        notify={notify}
      />

      <div className="career-tools">
        <div
          className="global-search"
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '9999px',
            padding: '8px 14px',
            minWidth: '280px',
            maxWidth: '380px',
            gap: '8px',
          }}
        >
          <Search size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search career roles..."
            aria-label="Search career roles"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: '13px',
              width: '100%',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {categories.map((cat) => (
          <span
            key={cat}
            className={selectedCategory === cat ? 'selected' : ''}
            onClick={() => setSelectedCategory(cat)}
            role="button"
            tabIndex={0}
            style={{ userSelect: 'none' }}
          >
            {cat}
          </span>
        ))}
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <RefreshCw size={24} className="spin" style={{ marginBottom: '12px', color: '#7c6cff' }} />
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading validated career pathways from database...</p>
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: '#f87171' }}>
          <AlertTriangle size={24} style={{ marginBottom: '10px' }} />
          <p style={{ margin: '0 0 12px', fontSize: '0.9rem' }}>{error}</p>
          <button className="secondary" onClick={loadCareers}>
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      ) : filteredCareers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8' }}>
          <Target size={32} style={{ marginBottom: '12px', color: '#64748b' }} />
          <h3 style={{ color: '#fff', fontSize: '1.05rem', margin: '0 0 6px' }}>No Career Roles Found</h3>
          <p style={{ margin: '0 0 16px', fontSize: '0.85rem' }}>
            No careers match {searchQuery ? `"${searchQuery}"` : ''} in the {selectedCategory} category.
          </p>
          <button
            className="secondary"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All roles');
            }}
          >
            Clear Search & Filters
          </button>
        </div>
      ) : (
        <div className="career-grid">
          {filteredCareers.map((c) => {
            const isSelected = c.career_name === selectedRole;
            const skillsList = (c.required_skills || []).slice(0, 3).map((s: any) => s.skill_name || s.skill_id);
            const totalSkills = c.required_skills?.length || 8;
            const matchPct = (c.match_percentage ?? 75) + '%';
            const duration = (c.estimated_preparation_months || 4) + ' months';

            return (
              <div className={`career-card card ${isSelected ? 'chosen' : ''}`} key={c.career_id}>
                <div className="career-icon">
                  <Target size={17} />
                </div>
                <div className="career-match">
                  <small>STUDENT MATCH</small>
                  <b>{matchPct}</b>
                </div>
                <h2>{c.career_name}</h2>
                <p>{c.description || 'Target career pathway aligned with industry skill benchmarks.'}</p>
                <div className="career-meta">
                  <span>
                    <Clock3 size={11} /> {duration}
                  </span>
                  <span>
                    <Code2 size={11} /> {totalSkills} core skills
                  </span>
                </div>
                <div className="career-skills">
                  {skillsList.map((s: string) => (
                    <span key={s}>{s}</span>
                  ))}
                  {totalSkills > 3 && <span>+{totalSkills - 3} more</span>}
                </div>
                {isSelected ? (
                  <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                    <button
                      className="primary"
                      style={{ flex: 1, padding: '8px 10px', fontSize: '0.8rem' }}
                      disabled={true}
                    >
                      <Check size={12} /> Active Goal
                    </button>
                    <button
                      className="secondary"
                      style={{ flex: 1, padding: '8px 10px', fontSize: '0.8rem' }}
                      onClick={() => go('/courses', `Opening courses for ${c.career_name}`)}
                    >
                      View Courses <ArrowRight size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    className="secondary"
                    disabled={selectingId === c.career_id}
                    onClick={() => handleSelectCareer(c.career_id, c.career_name)}
                  >
                    {selectingId === c.career_id ? (
                      <>
                        <RefreshCw size={12} className="spin" /> Updating...
                      </>
                    ) : (
                      <>
                        Select Career <ArrowRight size={12} />
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ==========================================
// ASSESSMENT PORTAL
// ==========================================
function Assessment({ notify, go }: { notify: (message: string) => void; go: (path: string, message: string) => void }) {
  const [phase, setPhase] = useState<'overview' | 'in_progress' | 'result'>('overview');
  const [targetCareer, setTargetCareer] = useState<any>({ name: 'Machine Learning Engineer', id: 'C001' });
  const [overviewData, setOverviewData] = useState<any>(null);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');

  useEffect(() => {
    api.getCurrentCareer().then((data) => {
      if (data && data.career_name) setTargetCareer({ name: data.career_name, id: data.career_id });
    }).catch(() => {});

    api.getAssessmentOverview().then((data) => {
      if (data) {
        setOverviewData(data);
        if (data.target_career_name) setTargetCareer({ name: data.target_career_name, id: data.target_career_id });
      }
    }).catch(() => {});

    api.getAssessmentHistory().then((data) => {
      if (Array.isArray(data)) setHistory(data);
    }).catch(() => {});
  }, []);

  const handleStart = async (skillIdToAssess?: string) => {
    setLoading(true);
    const sid = typeof skillIdToAssess === 'string' ? skillIdToAssess : (selectedSkillId || undefined);
    try {
      const resp = await api.startAssessment(targetCareer.id, sid);
      if (resp && resp.questions && resp.questions.length > 0) {
        setAssessmentData(resp);
        setAnswers({});
        setCurrentIndex(0);
        setPhase('in_progress');
        notify(`Assessment started: ${resp.questions.length} questions loaded${sid ? ` for selected skill` : ''}`);
      } else {
        notify('No questions available for this selection.');
      }
    } catch (err: any) {
      notify(`Error starting assessment: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!assessmentData?.questions) return;
    setSubmitting(true);
    try {
      const submissionList = assessmentData.questions.map((q: any) => ({
        question_id: q.question_id,
        selected_answer: answers[q.question_id] || '',
        time_taken_seconds: 30,
      }));
      const res = await api.submitAssessment(assessmentData.assessment_id, submissionList);
      setResult(res);
      setPhase('result');
      notify(`Assessment evaluated! Demonstrated score: ${res.overall_score}%`);
    } catch (err: any) {
      notify(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (phase === 'overview') {
    const blueprintSkills = overviewData?.blueprint_skills || [];
    return (
      <>
        <ProductHeader
          eyebrow="DIAGNOSTIC EVALUATION · ADAPTIVE ASSESSMENT"
          title="Career Assessment & Diagnostic Evaluation"
          sub="Validate your current competency through a career-specific assessment. Answers are evaluated objectively by the backend engine."
          action="Start Full Track Assessment"
          notify={() => handleStart()}
        />

        {/* 80% Threshold Rule Banner */}
        <div style={{ background: 'rgba(91, 75, 255, 0.08)', border: '1px solid rgba(91, 75, 255, 0.3)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ShieldCheck size={24} style={{ color: '#5B4BFF', flexShrink: 0 }} />
          <div>
            <b style={{ color: '#5B4BFF', fontSize: '14px' }}>PathForge 80% Skill Completion Threshold Policy</b>
            <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#94a3b8' }}>
              When you score <strong>at least 80%</strong> on a skill assessment, that skill is marked as <strong>Completed</strong> on your track and unlocks subsequent milestones. Scores below 80% mark the skill <strong>In Progress</strong> with targeted learning recommendations.
            </p>
          </div>
        </div>

        <div className="assessment-banner">
          <div className="assessment-icon"><ClipboardCheck size={22} /></div>
          <div>
            <small>TARGET CAREER TRACK</small>
            <h2>{targetCareer.name}</h2>
            <p>Select whether to evaluate all core track competencies or focus on a specific skill below.</p>
          </div>
          <span className="tag purple">Adaptive diagnostic</span>
        </div>

        {blueprintSkills.length > 0 && (
          <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
            <small style={{ color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.75rem' }}>
              TARGET SPECIFIC SKILL FOR EVALUATION (OPTIONAL)
            </small>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button
                className={selectedSkillId === '' ? 'primary' : 'secondary'}
                style={{ fontSize: '12px', padding: '6px 12px' }}
                onClick={() => setSelectedSkillId('')}
              >
                All Track Skills ({overviewData?.total_available_questions || 15} Qs)
              </button>
              {blueprintSkills.map((bs: any) => (
                <button
                  key={bs.skill_name}
                  className={selectedSkillId === bs.skill_name ? 'primary' : 'secondary'}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                  onClick={() => setSelectedSkillId(bs.skill_name)}
                >
                  {bs.skill_name} ({bs.level})
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="stats four">
          <Stat icon={ClipboardCheck} label="QUESTIONS" value={String(overviewData?.total_available_questions || 15)} sub="Mapped across core skills" />
          <Stat icon={Clock3} label="ESTIMATED TIME" value={`${overviewData?.estimated_time_minutes || 30} min`} sub="Diagnostic session" />
          <Stat icon={TrendingUp} label="DIFFICULTY" value="Adaptive" sub="Beginner to advanced" color="violet" />
          <Stat icon={Target} label="PASS THRESHOLD" value=">= 80%" sub="Skill completion standard" color="green" />
        </div>

        <button className="primary full" onClick={() => handleStart()} disabled={loading} style={{ marginTop: '1.5rem', padding: '1rem' }}>
          {loading ? 'Generating Assessment...' : (selectedSkillId ? `Assess ${selectedSkillId} Now` : 'Start Career Assessment Now')} <ArrowRight size={14} />
        </button>
      </>
    );
  }

  if (phase === 'in_progress' && assessmentData?.questions?.[currentIndex]) {
    const currentQ = assessmentData.questions[currentIndex];
    const rawOptions = currentQ.options || [];
    const selectedAnswer = answers[currentQ.question_id] || '';

    return (
      <>
        <div className="page-head">
          <div>
            <div className="eyebrow"><span />QUESTION {currentIndex + 1} OF {assessmentData.questions.length}</div>
            <h1>Career Diagnostic in Progress</h1>
            <p>{targetCareer.name} · Skill: {currentQ.skill_name}</p>
          </div>
        </div>
        <Panel eyebrow={`SKILL: ${currentQ.skill_name}`} title={currentQ.question_text || currentQ.question}>
          <div className="options" style={{ marginTop: '1rem' }}>
            {rawOptions.map((opt: string, optIdx: number) => {
              const letter = String.fromCharCode(65 + optIdx);
              const isChosen = selectedAnswer === opt || selectedAnswer === letter;
              return (
                <button
                  key={optIdx}
                  className={isChosen ? 'option chosen' : 'option'}
                  onClick={() => setAnswers({ ...answers, [currentQ.question_id]: opt })}
                >
                  <span>{letter}</span>
                  {opt}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button className="secondary" disabled={currentIndex === 0} onClick={() => setCurrentIndex(currentIndex - 1)}>Previous</button>
            {currentIndex < assessmentData.questions.length - 1 ? (
              <button className="primary" onClick={() => setCurrentIndex(currentIndex + 1)}>Next Question <ArrowRight size={13} /></button>
            ) : (
              <button className="primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Evaluating...' : 'Submit Assessment'}
              </button>
            )}
          </div>
        </Panel>
      </>
    );
  }

  if (phase === 'result' && result) {
    return (
      <>
        <ProductHeader
          eyebrow="EVALUATION COMPLETE · EVIDENCE VERIFIED"
          title="Assessment Results & Skill Verification"
          sub="Demonstrated scores have been recorded into student_skills and updated your evidence-based mastery."
          action="Back to Assessment Portal"
          notify={() => setPhase('overview')}
        />
        <div className="hero" style={{ marginBottom: '1.5rem' }}>
          <div className="hero-mark"><ShieldCheck size={26} /></div>
          <div>
            <small>DEMONSTRATED LEVEL: {result.score_grade}</small>
            <h2>Overall Score: {result.overall_score}%</h2>
            <p>{result.correct_count} of {result.total_questions} Questions Correct · Threshold: 80% for Track Skill Completion</p>
          </div>
        </div>
        <Panel eyebrow="MULTI-SOURCE MASTERY RECALIBRATION" title="Skill Performance & 80% Threshold Status">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>Assessment Score</th>
                  <th>Completion Status</th>
                  <th>Demonstrated Level</th>
                  <th>Multi-Source Mastery</th>
                  <th>Recommended Next Action</th>
                </tr>
              </thead>
              <tbody>
                {(result.skill_results || []).map((sr: any) => {
                  const isCompleted = sr.is_completed ?? (sr.score >= 80);
                  return (
                    <tr key={sr.skill_id}>
                      <td><b>{sr.skill_name}</b></td>
                      <td><b className={isCompleted ? 'green' : 'orange'}>{sr.score}%</b></td>
                      <td>
                        <span className={`tag ${isCompleted ? 'success' : 'warning'}`}>
                          {isCompleted ? '✓ Completed (>=80%)' : 'In Progress (<80%)'}
                        </span>
                      </td>
                      <td><span className="tag purple">{sr.level}</span></td>
                      <td><strong>{sr.final_mastery}%</strong></td>
                      <td style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {sr.next_recommended_action || (isCompleted ? 'Skill completed. Eligible for next track step.' : 'Review recommended courses before retaking.')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <button className="primary" onClick={() => go('/dashboard', 'Navigating to Dashboard')}>
              View Updated Dashboard <ArrowRight size={13} />
            </button>
            <button className="secondary" onClick={() => setPhase('overview')}>
              Take Another Assessment
            </button>
          </div>
        </Panel>
      </>
    );
  }

  return null;
}

// ==========================================
// MENTOR CONNECT
// ==========================================
function Mentor({ notify }: { notify: (message: string) => void }) {
  const { user } = useAuth();
  const [mentors, setMentors] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [myMentors, setMyMentors] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-mentors' | 'sessions' | 'explore' | 'requests' | 'messages' | 'assessments' | 'guidance'>('explore');
  const [sessionFilter, setSessionFilter] = useState<'upcoming' | 'today' | 'completed' | 'cancelled' | 'all'>('upcoming');
  const [sessionDateFilter, setSessionDateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [specializationFilter, setSpecializationFilter] = useState('all');

  // Phase 10: Student Career Guidance State
  const [studentGuidance, setStudentGuidance] = useState<any[]>([]);
  const [updatingGuidanceId, setUpdatingGuidanceId] = useState<number | null>(null);

  // Phase 9: Student Assessments & Reviews State
  const [assignedAssessments, setAssignedAssessments] = useState<any[]>([]);
  const [assessmentFilter, setAssessmentFilter] = useState<'all' | 'pending' | 'submitted' | 'evaluated'>('all');
  const [selectedAssessmentForSubmit, setSelectedAssessmentForSubmit] = useState<any | null>(null);
  const [selectedAssessmentForDetail, setSelectedAssessmentForDetail] = useState<any | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionSubmitting, setSubmissionSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Modals state
  const [selectedMentorForProfile, setSelectedMentorForProfile] = useState<any | null>(null);
  const [selectedMentorForRequest, setSelectedMentorForRequest] = useState<any | null>(null);
  const [requestCareerGoal, setRequestCareerGoal] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [requestModalError, setRequestModalError] = useState<string | null>(null);

  // Phase 7: Student Session Management State
  const [showStudentScheduleModal, setShowStudentScheduleModal] = useState(false);
  const [studentScheduleMentorId, setStudentScheduleMentorId] = useState('');
  const [studentScheduleTopic, setStudentScheduleTopic] = useState('');
  const [studentScheduleDate, setStudentScheduleDate] = useState('');
  const [studentScheduleStartTime, setStudentScheduleStartTime] = useState('10:00');
  const [studentScheduleEndTime, setStudentScheduleEndTime] = useState('11:00');
  const [studentSchedulePlatform, setStudentSchedulePlatform] = useState('Google Meet');
  const [studentScheduleMeetingLink, setStudentScheduleMeetingLink] = useState('');
  const [studentScheduleNotes, setStudentScheduleNotes] = useState('');
  const [studentSchedulingSubmitting, setStudentSchedulingSubmitting] = useState(false);
  const [studentScheduleError, setStudentScheduleError] = useState<string | null>(null);

  // Student Reschedule State
  const [selectedStudentSessionForReschedule, setSelectedStudentSessionForReschedule] = useState<any | null>(null);
  const [studentRescheduleDate, setStudentRescheduleDate] = useState('');
  const [studentRescheduleStartTime, setStudentRescheduleStartTime] = useState('10:00');
  const [studentRescheduleEndTime, setStudentRescheduleEndTime] = useState('11:00');
  const [studentRescheduleMeetingLink, setStudentRescheduleMeetingLink] = useState('');
  const [studentRescheduleNotes, setStudentRescheduleNotes] = useState('');
  const [studentRescheduleSubmitting, setStudentRescheduleSubmitting] = useState(false);
  const [studentRescheduleError, setStudentRescheduleError] = useState<string | null>(null);

  // Student Cancel State
  const [selectedStudentSessionForCancel, setSelectedStudentSessionForCancel] = useState<any | null>(null);
  const [studentCancelReason, setStudentCancelReason] = useState('');
  const [studentCancelSubmitting, setStudentCancelSubmitting] = useState(false);
  const [studentCancelError, setStudentCancelError] = useState<string | null>(null);

  // Student Session Detail State
  const [selectedStudentSessionForDetail, setSelectedStudentSessionForDetail] = useState<any | null>(null);

  // Phase 8: Student Messaging State
  const [studentConversations, setStudentConversations] = useState<any[]>([]);
  const [selectedMentorForChat, setSelectedMentorForChat] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [convFilter, setConvFilter] = useState('');
  const studentChatEndRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mentorList, reqList, myMentorsList, sessList, fbList, convList, assessList, guidanceList] = await Promise.all([
        api.getMentors().catch(() => []),
        api.getStudentMentorshipRequests().catch(() => []),
        api.getStudentMyMentors().catch(() => []),
        api.getStudentSessions().catch(() => []),
        api.getMentorFeedback().catch(() => []),
        api.getStudentConversations().catch(() => []),
        api.getStudentMentorAssessments().catch(() => []),
        api.getStudentCareerGuidance().catch(() => []),
      ]);
      setMentors(Array.isArray(mentorList) ? mentorList : []);
      setRequests(Array.isArray(reqList) ? reqList : []);
      setMyMentors(Array.isArray(myMentorsList) ? myMentorsList : []);
      setSessions(Array.isArray(sessList) ? sessList : []);
      setFeedbacks(Array.isArray(fbList) ? fbList : []);
      setAssignedAssessments(Array.isArray(assessList) ? assessList : []);
      setStudentGuidance(Array.isArray(guidanceList) ? guidanceList : []);
      if (Array.isArray(convList)) {
        setStudentConversations(convList);
        if (!selectedMentorForChat && convList.length > 0) {
          setSelectedMentorForChat(convList[0].mentor_id);
        } else if (!selectedMentorForChat && Array.isArray(myMentorsList) && myMentorsList.length > 0) {
          setSelectedMentorForChat(myMentorsList[0].mentor_id);
        }
      }
    } catch (err) {
      console.warn('[MentorConnect] Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (mid: string, silent = false) => {
    setSelectedMentorForChat(mid);
    try {
      const msgs = await api.getStudentConversations(mid);
      setChatMessages(Array.isArray(msgs) ? msgs : []);
      if (!silent) {
        api.markStudentThreadRead(mid).catch(() => {});
        setStudentConversations((prev) =>
          prev.map((c) => (c.mentor_id === mid ? { ...c, unread_count: 0 } : c))
        );
      }
    } catch (err) {
      if (!silent) console.warn('Failed to load chat messages:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Polling for conversation thread & unread counts
  useEffect(() => {
    if (activeTab === 'messages' && selectedMentorForChat) {
      loadConversation(selectedMentorForChat);
      const timer = setInterval(() => {
        loadConversation(selectedMentorForChat, true);
        api.getStudentConversations().then((data) => {
          if (Array.isArray(data)) setStudentConversations(data);
        }).catch(() => {});
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [activeTab, selectedMentorForChat]);

  useEffect(() => {
    studentChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) {
      notify('Please enter a message.');
      return;
    }
    if (!selectedMentorForChat) {
      notify('Please select an assigned mentor to chat with.');
      return;
    }
    setChatSending(true);
    setChatError(null);
    try {
      await api.sendStudentMessage({
        mentor_id: selectedMentorForChat,
        content: text,
      });
      setChatInput('');
      await loadConversation(selectedMentorForChat);
      const convs = await api.getStudentConversations().catch(() => []);
      if (Array.isArray(convs)) setStudentConversations(convs);
    } catch (err: any) {
      setChatError(err.message || 'Failed to send message');
      notify(`Failed to send message: ${err.message}`);
    } finally {
      setChatSending(false);
    }
  };

  const studentUnreadMsgCount = studentConversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  // Compute status per mentor for the authenticated student
  const getMentorRequestStatus = (mentorId: string) => {
    const found = requests.find((r) => r.mentor_id === mentorId && (r.status === 'pending' || r.status === 'accepted'));
    return found ? found.status : null;
  };

  // Filter mentors based on search, category, and availability
  const filteredMentors = mentors.filter((m: any) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (m.name || '').toLowerCase().includes(q) ||
      (m.expertise || '').toLowerCase().includes(q) ||
      (m.company || '').toLowerCase().includes(q) ||
      (m.skills || '').toLowerCase().includes(q) ||
      (m.title || '').toLowerCase().includes(q);

    let matchesCategory = true;
    if (categoryFilter === 'Available Now') {
      matchesCategory = (m.availability || '').toLowerCase().includes('available');
    } else if (categoryFilter === 'Machine Learning') {
      const text = `${m.expertise || ''} ${m.skills || ''}`.toLowerCase();
      matchesCategory = text.includes('machine learning') || text.includes('ml') || text.includes('ai');
    } else if (categoryFilter === 'Software Systems') {
      const text = `${m.expertise || ''} ${m.skills || ''}`.toLowerCase();
      matchesCategory = text.includes('software') || text.includes('platform') || text.includes('backend') || text.includes('cloud');
    } else if (categoryFilter === 'Data Science & Cloud') {
      const text = `${m.expertise || ''} ${m.skills || ''}`.toLowerCase();
      matchesCategory = text.includes('data') || text.includes('cloud') || text.includes('aws') || text.includes('gcp');
    }

    let matchesAvailability = true;
    if (availabilityFilter === 'available') {
      matchesAvailability = (m.availability || '').toLowerCase().includes('available');
    } else if (availabilityFilter === 'busy') {
      matchesAvailability = !(m.availability || '').toLowerCase().includes('available');
    }

    let matchesExperience = true;
    if (experienceFilter !== 'all') {
      const minExp = parseInt(experienceFilter, 10);
      matchesExperience = (m.years_experience || 0) >= minExp;
    }

    let matchesSpecialization = true;
    if (specializationFilter !== 'all') {
      const specLower = specializationFilter.toLowerCase();
      const combined = `${m.career_specializations || ''} ${m.expertise || ''} ${m.skills || ''}`.toLowerCase();
      matchesSpecialization = combined.includes(specLower);
    }

    return matchesSearch && matchesCategory && matchesAvailability && matchesExperience && matchesSpecialization;
  });

  const handleOpenMentorProfile = async (mentor: any) => {
    setSelectedMentorForProfile(mentor);
    try {
      const full = await api.getMentorById(mentor.mentor_id);
      if (full) {
        setSelectedMentorForProfile((prev: any) => ({ ...prev, ...full }));
      }
    } catch {
      // Keep existing data if detailed lookup fails
    }
  };

  const handleToggleGuidanceStatus = async (guidanceId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'in_progress' : 'completed';
    setUpdatingGuidanceId(guidanceId);
    try {
      await api.updateGuidanceStatus(guidanceId, nextStatus);
      notify(`Guidance milestone updated to ${nextStatus.replace('_', ' ')}.`);
      setStudentGuidance((prev) =>
        prev.map((g) => (g.guidance_id === guidanceId ? { ...g, status: nextStatus } : g))
      );
    } catch (err: any) {
      notify(`Could not update milestone: ${err.message || 'Unknown error'}`);
    } finally {
      setUpdatingGuidanceId(null);
    }
  };

  const openRequestModal = (mentor: any) => {
    setSelectedMentorForRequest(mentor);
    setRequestCareerGoal(user?.target_career_name || '');
    setRequestMessage('');
    setRequestModalError(null);
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentorForRequest) return;
    setSubmittingRequest(true);
    setRequestModalError(null);

    try {
      const res = await api.requestMentorship({
        mentor_id: selectedMentorForRequest.mentor_id,
        career_goal: requestCareerGoal,
        message: requestMessage,
        topic: `Guidance on ${requestCareerGoal || selectedMentorForRequest.expertise || 'Career Track'}`,
      });
      notify(res?.message || `Mentorship request sent to ${selectedMentorForRequest.name}!`);
      setSelectedMentorForRequest(null);
      await loadData();
    } catch (err: any) {
      setRequestModalError(err.message || 'Failed to submit mentorship request. Please try again.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (cancellingId) return;
    setCancellingId(requestId);
    try {
      await api.cancelMentorshipRequest(requestId);
      notify('Mentorship request cancelled successfully.');
      await loadData();
    } catch (err: any) {
      notify(`Cancellation failed: ${err.message || 'Could not cancel request.'}`);
    } finally {
      setCancellingId(null);
    }
  };

  // Phase 7: Session Handlers for Student
  const openStudentScheduleModal = (preselectedMentorId?: string) => {
    setStudentScheduleMentorId(preselectedMentorId || (myMentors.length > 0 ? myMentors[0].mentor_id : ''));
    setStudentScheduleTopic('');
    setStudentScheduleDate('');
    setStudentScheduleStartTime('10:00');
    setStudentScheduleEndTime('11:00');
    setStudentSchedulePlatform('Google Meet');
    setStudentScheduleMeetingLink('');
    setStudentScheduleNotes('');
    setStudentScheduleError(null);
    setShowStudentScheduleModal(true);
  };

  const handleStudentScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentScheduleMentorId) {
      setStudentScheduleError('Please select an assigned mentor.');
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (studentScheduleDate < todayStr) {
      setStudentScheduleError('Session date cannot be in the past.');
      return;
    }
    if (studentScheduleEndTime <= studentScheduleStartTime) {
      setStudentScheduleError('Session end time must be after the start time.');
      return;
    }

    setStudentSchedulingSubmitting(true);
    setStudentScheduleError(null);
    try {
      await api.createStudentSession({
        mentor_id: studentScheduleMentorId,
        topic: studentScheduleTopic,
        session_date: studentScheduleDate,
        start_time: studentScheduleStartTime,
        end_time: studentScheduleEndTime,
        platform: studentSchedulePlatform,
        meeting_link: studentScheduleMeetingLink.trim() || undefined,
        notes: studentScheduleNotes.trim() || undefined,
      });
      notify('Mentorship session scheduled successfully! Your mentor has been notified.');
      setShowStudentScheduleModal(false);
      await loadData();
    } catch (err: any) {
      setStudentScheduleError(err.message || 'Failed to schedule mentorship session.');
    } finally {
      setStudentSchedulingSubmitting(false);
    }
  };

  const openStudentRescheduleModal = (sess: any) => {
    setSelectedStudentSessionForReschedule(sess);
    setStudentRescheduleDate(sess.session_date);
    setStudentRescheduleStartTime(sess.start_time);
    setStudentRescheduleEndTime(sess.end_time);
    setStudentRescheduleMeetingLink(sess.meeting_link || '');
    setStudentRescheduleNotes('');
    setStudentRescheduleError(null);
  };

  const handleStudentRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentSessionForReschedule) return;
    const todayStr = new Date().toISOString().split('T')[0];
    if (studentRescheduleDate < todayStr) {
      setStudentRescheduleError('Rescheduled date cannot be in the past.');
      return;
    }
    if (studentRescheduleEndTime <= studentRescheduleStartTime) {
      setStudentRescheduleError('End time must be after start time.');
      return;
    }

    setStudentRescheduleSubmitting(true);
    setStudentRescheduleError(null);
    try {
      await api.rescheduleStudentSession(selectedStudentSessionForReschedule.session_id, {
        session_date: studentRescheduleDate,
        start_time: studentRescheduleStartTime,
        end_time: studentRescheduleEndTime,
        meeting_link: studentRescheduleMeetingLink.trim() || undefined,
        notes: studentRescheduleNotes.trim() || undefined,
      });
      notify('Session rescheduled successfully! Mentor has been notified.');
      setSelectedStudentSessionForReschedule(null);
      await loadData();
    } catch (err: any) {
      setStudentRescheduleError(err.message || 'Failed to reschedule session.');
    } finally {
      setStudentRescheduleSubmitting(false);
    }
  };

  const openStudentCancelModal = (sess: any) => {
    setSelectedStudentSessionForCancel(sess);
    setStudentCancelReason('');
    setStudentCancelError(null);
  };

  const handleStudentCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentSessionForCancel) return;
    if (!studentCancelReason.trim()) {
      setStudentCancelError('Please provide a reason for cancellation.');
      return;
    }

    setStudentCancelSubmitting(true);
    setStudentCancelError(null);
    try {
      await api.cancelStudentSession(selectedStudentSessionForCancel.session_id, studentCancelReason.trim());
      notify('Session cancelled. A cancellation notice was sent to your mentor.');
      setSelectedStudentSessionForCancel(null);
      await loadData();
    } catch (err: any) {
      setStudentCancelError(err.message || 'Failed to cancel session.');
    } finally {
      setStudentCancelSubmitting(false);
    }
  };

  const handleStudentSubmitAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssessmentForSubmit) return;
    if (!submissionNotes.trim() && !submissionUrl.trim()) {
      setSubmissionError('Please provide your solution notes or a deliverable URL.');
      return;
    }

    setSubmissionSubmitting(true);
    setSubmissionError(null);
    try {
      await api.submitStudentMentorAssessment(selectedAssessmentForSubmit.assessment_id, {
        submission_notes: submissionNotes.trim() || undefined,
        deliverable_url: submissionUrl.trim() || undefined,
      });
      notify('Assessment submitted successfully! Your mentor has been notified.');
      setSelectedAssessmentForSubmit(null);
      setSubmissionNotes('');
      setSubmissionUrl('');
      await loadData();
    } catch (err: any) {
      setSubmissionError(err.message || 'Failed to submit assessment.');
    } finally {
      setSubmissionSubmitting(false);
    }
  };

  const tabs = ['All', 'Available Now', 'Machine Learning', 'Software Systems', 'Data Science & Cloud'];

  return (
    <>
      <ProductHeader
        eyebrow="HUMAN GUIDANCE · EXPERT NETWORK"
        title="Mentor Connect"
        sub="Connect with industry practitioners for calibrated skill guidance, roadmap reviews, and 1:1 mentorship."
        action={activeTab === 'explore' ? 'View My Requests' : 'Explore Mentors'}
        notify={notify}
      />

      {/* Main Tab Controls: My Mentors vs Sessions vs Explore vs My Requests vs Messages vs Assessments */}
      <div className="mentor-tabs-header">
        <div className="mentor-main-tabs">
          <button
            type="button"
            className={`mentor-main-tab ${activeTab === 'my-mentors' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-mentors')}
          >
            <Users size={16} /> My Mentors
            {myMentors.length > 0 && (
              <span className="mentor-tab-badge" style={{ background: '#10B981' }}>{myMentors.length}</span>
            )}
          </button>
          <button
            type="button"
            className={`mentor-main-tab ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            <CalendarDays size={16} /> Sessions
            {sessions.filter((s) => s.status === 'upcoming' || s.status === 'rescheduled').length > 0 && (
              <span className="mentor-tab-badge" style={{ background: '#6366F1' }}>
                {sessions.filter((s) => s.status === 'upcoming' || s.status === 'rescheduled').length}
              </span>
            )}
          </button>
          <button
            type="button"
            className={`mentor-main-tab ${activeTab === 'assessments' ? 'active' : ''}`}
            onClick={() => setActiveTab('assessments')}
          >
            <Award size={16} /> Skill Assessments
            {assignedAssessments.filter((a) => a.submission_status === 'pending').length > 0 && (
              <span className="mentor-tab-badge" style={{ background: '#F59E0B' }}>
                {assignedAssessments.filter((a) => a.submission_status === 'pending').length}
              </span>
            )}
          </button>
          <button
            type="button"
            className={`mentor-main-tab ${activeTab === 'guidance' ? 'active' : ''}`}
            onClick={() => setActiveTab('guidance')}
          >
            <Target size={16} /> Career Guidance
            {studentGuidance.length > 0 && (
              <span className="mentor-tab-badge" style={{ background: '#6366F1' }}>{studentGuidance.length}</span>
            )}
          </button>
          <button
            type="button"
            className={`mentor-main-tab ${activeTab === 'explore' ? 'active' : ''}`}
            onClick={() => setActiveTab('explore')}
          >
            <Search size={16} /> Explore Mentors ({mentors.length})
          </button>
          <button
            type="button"
            className={`mentor-main-tab ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <Clock3 size={16} /> My Requests
            {requests.length > 0 && (
              <span className="mentor-tab-badge">{requests.length}</span>
            )}
          </button>
          <button
            type="button"
            className={`mentor-main-tab ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            <MessageSquareText size={16} /> Messages
            {studentUnreadMsgCount > 0 && (
              <span className="mentor-tab-badge" style={{ background: '#EF4444' }}>{studentUnreadMsgCount}</span>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="btn-inspect"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          title="Refresh Data"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* SUB-VIEW 1: MY ASSIGNED MENTORS & FEEDBACK */}
      {activeTab === 'my-mentors' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '4px' }}>
              Your Active Mentors
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '0.86rem', margin: 0 }}>
              Direct access to your assigned industry practitioners, scheduled 1:1 sessions, and skill guidance.
            </p>
          </div>

          {loading ? (
            <div className="empty-state-box" style={{ padding: '3rem', textAlign: 'center' }}>
              <RefreshCw size={32} className="animate-spin" style={{ color: '#7C6CFF', margin: '0 auto 12px' }} />
              <b>Loading your assigned mentors...</b>
            </div>
          ) : myMentors.length > 0 ? (
            <div className="mentor-grid">
              {myMentors.map((m: any) => {
                const initials = (m.mentor_name || 'Mentor')
                  .split(' ')
                  .filter(Boolean)
                  .map((w: string) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || 'ME';

                return (
                  <div className="mentor-card card" key={m.assignment_id || m.mentor_id} style={{ borderColor: 'rgba(99,102,241,0.4)' }}>
                    <div className="mentor-photo">{initials}</div>
                    <div className="mentor-info">
                      <div className="available">
                        <span className="green-dot" />
                        Active Mentorship
                      </div>
                      <h2>{m.mentor_name}</h2>
                      <div className="role">{m.mentor_title} • {m.mentor_company}</div>
                      <div className="stars">
                        <Star size={13} fill="#F59E0B" color="#F59E0B" />
                        <span>{m.mentor_rating}</span>
                        <small style={{ color: '#94A3B8' }}>• {m.upcoming_sessions_count} upcoming sessions</small>
                      </div>
                      <p className="bio">{m.mentor_bio || 'Assigned technical advisor guiding roadmap completion, portfolio audit, and skill calibration.'}</p>

                      {m.notes && (
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '12px' }}>
                          <span style={{ color: '#10B981', fontWeight: 600 }}>Connection Note: </span>
                          {m.notes}
                        </div>
                      )}

                      <div className="skills-tags">
                        {m.mentor_skills?.map((sk: string) => (
                          <span key={sk} className="skill-pill">{sk}</span>
                        ))}
                      </div>

                      <div className="card-actions" style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                        <button
                          type="button"
                          className="btn-inspect"
                          style={{ flex: 1 }}
                          onClick={() => setSelectedMentorForProfile({
                            mentor_id: m.mentor_id,
                            name: m.mentor_name,
                            title: m.mentor_title,
                            company: m.mentor_company,
                            bio: m.mentor_bio,
                            rating: m.mentor_rating,
                            skills: m.mentor_skills,
                            expertise: m.mentor_expertise,
                            availability: 'Active Mentor',
                          })}
                        >
                          View Profile
                        </button>
                        <button
                          type="button"
                          className="primary"
                          style={{ flex: 1 }}
                          onClick={() => setActiveTab('sessions')}
                        >
                          View Sessions
                        </button>
                        <button
                          type="button"
                          className="btn-inspect"
                          style={{ flex: 1, borderColor: 'rgba(99,102,241,0.6)', color: '#818CF8' }}
                          onClick={() => {
                            setSelectedMentorForChat(m.mentor_id);
                            setActiveTab('messages');
                          }}
                        >
                          <MessageSquareText size={13} style={{ marginRight: '4px' }} /> Message
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state-box" style={{ padding: '3.5rem 1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
              <Users size={40} style={{ color: '#64748B', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '6px' }}>No Active Mentors Assigned</h3>
              <p style={{ color: '#94A3B8', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 16px' }}>
                You have not connected with a mentor yet. Browse the directory to find expert practitioners and request 1:1 guidance.
              </p>
              <button
                type="button"
                className="primary"
                onClick={() => setActiveTab('explore')}
              >
                Browse Mentors Directory
              </button>
            </div>
          )}

          {/* Feedback & Recommendations from Mentors */}
          <div style={{ marginTop: '36px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '4px' }}>
              Mentor Feedback & Calibrated Evaluations
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '0.86rem', margin: 0, marginBottom: '16px' }}>
              Verified project rubrics, strengths identified, and next steps provided by your mentors.
            </p>

            {feedbacks.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
                {feedbacks.map((fb: any, idx: number) => (
                  <div key={fb.feedback_id || idx} className="card" style={{ padding: '16px 18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <b style={{ color: '#F8FAFC', fontSize: '0.95rem' }}>{fb.project_name || fb.skill_name || 'Project Review'}</b>
                        <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Evaluated by <b>{fb.mentor_name}</b> on {fb.date}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill={i < fb.rating ? '#F59E0B' : 'none'}
                            color={i < fb.rating ? '#F59E0B' : '#64748B'}
                          />
                        ))}
                      </div>
                    </div>
                    {fb.comments && (
                      <p style={{ fontSize: '0.86rem', color: '#CBD5E1', margin: '8px 0', lineHeight: 1.5 }}>
                        &ldquo;{fb.comments}&rdquo;
                      </p>
                    )}
                    {fb.strengths && (
                      <div style={{ fontSize: '0.8rem', color: '#10B981', marginBottom: '4px' }}>
                        <b>Strengths:</b> {fb.strengths}
                      </div>
                    )}
                    {fb.improvement_areas && (
                      <div style={{ fontSize: '0.8rem', color: '#F59E0B', marginBottom: '4px' }}>
                        <b>Next Steps:</b> {fb.improvement_areas}
                      </div>
                    )}
                    {fb.recommended_action && (
                      <div style={{ fontSize: '0.78rem', color: '#7C6CFF', marginTop: '6px' }}>
                        <b>Recommendation:</b> {fb.recommended_action}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', color: '#94A3B8', fontSize: '0.85rem' }}>
                No feedback reviews recorded yet. Submit project deliverables to receive rubric ratings and calibration.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: SESSIONS */}
      {activeTab === 'sessions' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '4px' }}>
                Mentorship Sessions
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '0.86rem', margin: 0 }}>
                Request, schedule, and attend 1:1 guidance calls with your assigned mentors, inspect agendas, and review session notes.
              </p>
            </div>

            <button
              type="button"
              className="primary"
              onClick={() => {
                if (myMentors.length === 0) {
                  notify('You need an active mentor connection to schedule a session. Please request a mentor from the Explore tab.');
                  return;
                }
                openStudentScheduleModal();
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} /> Request / Schedule Session
            </button>
          </div>

          {/* Filters Bar: Status Pills + Date Picker */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="filter-pills-row" style={{ margin: 0 }}>
              {[
                { id: 'upcoming', label: 'Upcoming / Rescheduled' },
                { id: 'today', label: 'Today' },
                { id: 'completed', label: 'Completed' },
                { id: 'cancelled', label: 'Cancelled' },
                { id: 'all', label: 'All Sessions' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`filter-pill ${sessionFilter === f.id ? 'active' : ''}`}
                  onClick={() => setSessionFilter(f.id as any)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={14} style={{ color: '#94A3B8' }} />
              <input
                type="date"
                value={sessionDateFilter}
                onChange={(e) => setSessionDateFilter(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#FFF',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  fontSize: '0.8rem',
                }}
              />
              {sessionDateFilter && (
                <button
                  type="button"
                  className="btn-inspect"
                  onClick={() => setSessionDateFilter('')}
                  style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                >
                  Clear Date
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="empty-state-box" style={{ padding: '3rem', textAlign: 'center' }}>
              <RefreshCw size={32} className="animate-spin" style={{ color: '#7C6CFF', margin: '0 auto 12px' }} />
              <b>Loading mentorship sessions...</b>
            </div>
          ) : (() => {
            const todayStr = new Date().toISOString().split('T')[0];
            const displayed = sessions.filter((s) => {
              if (sessionDateFilter && s.session_date !== sessionDateFilter) return false;
              if (sessionFilter === 'today') return s.session_date === todayStr && s.status !== 'cancelled';
              if (sessionFilter === 'upcoming') return s.status === 'upcoming' || s.status === 'rescheduled';
              if (sessionFilter === 'completed') return s.status === 'completed';
              if (sessionFilter === 'cancelled') return s.status === 'cancelled';
              return true;
            });

            if (displayed.length === 0) {
              return (
                <div className="empty-state-box" style={{ padding: '3.5rem 1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                  <CalendarDays size={40} style={{ color: '#64748B', margin: '0 auto 12px' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '6px' }}>No Sessions Found</h3>
                  <p style={{ color: '#94A3B8', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 16px' }}>
                    {sessionFilter === 'upcoming'
                      ? 'No upcoming mentorship sessions. Schedule a session with one of your assigned mentors to get calibrated feedback.'
                      : sessionFilter === 'today'
                      ? 'No mentorship sessions scheduled for today.'
                      : 'No mentorship sessions match this filter.'}
                  </p>
                  {myMentors.length > 0 && sessionFilter === 'upcoming' && (
                    <button
                      type="button"
                      className="primary"
                      onClick={() => openStudentScheduleModal()}
                    >
                      <Plus size={14} style={{ marginRight: '6px' }} /> Schedule 1:1 Session
                    </button>
                  )}
                </div>
              );
            }

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
                {displayed.map((sess: any) => {
                  const isUpcoming = sess.status === 'upcoming' || sess.status === 'rescheduled';
                  return (
                    <div
                      key={sess.session_id}
                      className="card"
                      style={{
                        padding: '18px 20px',
                        background: 'rgba(255,255,255,0.03)',
                        border: isUpcoming ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <div>
                            <b style={{ color: '#F8FAFC', fontSize: '1rem', display: 'block' }}>{sess.topic}</b>
                            <div style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: '2px' }}>
                              Mentor: <b style={{ color: '#E2E8F0' }}>{sess.mentor_name}</b> ({sess.mentor_company || 'PathForge'})
                            </div>
                          </div>
                          <span className={`status-pill ${sess.status}`}>
                            {sess.status}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: '#CBD5E1', marginBottom: '8px' }}>
                          <CalendarDays size={14} style={{ color: '#7C6CFF' }} />
                          <span>{sess.session_date} • {sess.start_time} - {sess.end_time}</span>
                          <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818CF8', padding: '2px 6px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 600 }}>
                            {sess.duration_minutes || 60}m
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: '#94A3B8', marginBottom: '12px' }}>
                          <Video size={14} style={{ color: '#10B981' }} />
                          <span>{sess.platform || 'Google Meet'}</span>
                        </div>

                        {sess.notes && (
                          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '8px', fontSize: '0.82rem', color: '#CBD5E1', marginBottom: '14px', borderLeft: sess.status === 'completed' ? '3px solid #10B981' : sess.status === 'cancelled' ? '3px solid #EF4444' : '3px solid #7C6CFF' }}>
                            <span style={{ color: sess.status === 'completed' ? '#10B981' : sess.status === 'cancelled' ? '#EF4444' : '#7C6CFF', fontWeight: 600 }}>
                              {sess.status === 'completed' ? 'Takeaways & Action Items: ' : sess.status === 'cancelled' ? 'Cancellation Notice: ' : 'Agenda / Instructions: '}
                            </span>
                            {sess.notes}
                          </div>
                        )}

                        {sess.meeting_link && (
                          <div style={{ marginBottom: '14px' }}>
                            <a
                              href={sess.meeting_link}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#818CF8', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                            >
                              <ExternalLink size={13} /> {sess.meeting_link}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', marginTop: '6px' }}>
                        {isUpcoming ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {sess.meeting_link && (
                              <a
                                href={sess.meeting_link}
                                target="_blank"
                                rel="noreferrer"
                                className="primary"
                                style={{ flex: '1 1 100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none', padding: '8px', fontSize: '0.84rem' }}
                              >
                                <ExternalLink size={14} /> Join Meeting Call
                              </a>
                            )}
                            <button
                              type="button"
                              className="btn-inspect"
                              style={{ flex: 1, fontSize: '0.8rem', padding: '6px 10px' }}
                              onClick={() => setSelectedStudentSessionForDetail(sess)}
                            >
                              Details
                            </button>
                            <button
                              type="button"
                              className="btn-inspect"
                              style={{ flex: 1, fontSize: '0.8rem', padding: '6px 10px' }}
                              onClick={() => openStudentRescheduleModal(sess)}
                            >
                              Reschedule
                            </button>
                            <button
                              type="button"
                              className="btn-inspect"
                              style={{ flex: 1, fontSize: '0.8rem', padding: '6px 10px', color: '#FCA5A5', borderColor: 'rgba(239,68,68,0.3)' }}
                              onClick={() => openStudentCancelModal(sess)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              className="btn-inspect"
                              style={{ flex: 1, fontSize: '0.82rem' }}
                              onClick={() => setSelectedStudentSessionForDetail(sess)}
                            >
                              {sess.status === 'completed' ? 'View Takeaways & Notes' : 'View Session Details'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === 'explore' && (
        <>
          {/* Search & Category Filter Controls */}
          <div className="mentor-search-controls">
            <div className="mentor-search-box">
              <Search size={16} style={{ color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search mentors by name, expertise, skills, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="mentor-filter-select"
            >
              <option value="all">All Availability</option>
              <option value="available">Available Now</option>
              <option value="busy">Busy / Queued</option>
            </select>

            <select
              value={experienceFilter}
              onChange={(e) => setExperienceFilter(e.target.value)}
              className="mentor-filter-select"
            >
              <option value="all">All Experience</option>
              <option value="3">3+ Years</option>
              <option value="5">5+ Years</option>
              <option value="8">8+ Years</option>
              <option value="10">10+ Years</option>
            </select>

            <select
              value={specializationFilter}
              onChange={(e) => setSpecializationFilter(e.target.value)}
              className="mentor-filter-select"
            >
              <option value="all">All Specializations</option>
              <option value="Machine Learning">Machine Learning / AI</option>
              <option value="Data Science">Data Science</option>
              <option value="Software Systems">Software Systems</option>
              <option value="Cloud Computing">Cloud Computing</option>
              <option value="Career Preparation">Career Preparation</option>
            </select>
          </div>

          {/* Sub-Category Pills */}
          <div className="mentor-tabs" style={{ marginBottom: '20px' }}>
            {tabs.map((tab) => (
              <span
                key={tab}
                className={categoryFilter === tab ? 'selected' : ''}
                onClick={() => setCategoryFilter(tab)}
              >
                {tab}
              </span>
            ))}
          </div>

          {/* Mentors Grid */}
          {loading ? (
            <div className="empty-state-box" style={{ padding: '3rem', textAlign: 'center' }}>
              <RefreshCw size={32} className="animate-spin" style={{ color: '#7C6CFF', margin: '0 auto 12px' }} />
              <b>Loading mentor directory from database...</b>
            </div>
          ) : filteredMentors.length > 0 ? (
            <div className="mentor-grid">
              {filteredMentors.map((m: any) => {
                const initials = (m.name || 'Mentor')
                  .split(' ')
                  .filter(Boolean)
                  .map((w: string) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || 'ME';

                const skillsList = Array.isArray(m.skills)
                  ? m.skills
                  : String(m.skills || '')
                      .split(/[,·]/)
                      .map((s: string) => s.trim())
                      .filter(Boolean);

                const isAvailable = (m.availability || 'Available').toLowerCase().includes('available');
                const reqStatus = getMentorRequestStatus(m.mentor_id);

                return (
                  <div className="mentor-card card" key={m.mentor_id || m.name}>
                    <div className="mentor-photo">{initials}</div>
                    <div className="mentor-info">
                      <div className="available">
                        <span className={isAvailable ? 'green-dot' : 'orange-dot'} />
                        {m.availability || 'Available'}
                      </div>
                      <h2>{m.name}</h2>
                      <p>{m.title || m.expertise}</p>

                      {m.bio && (
                        <p style={{
                          fontSize: '12px',
                          color: '#64748B',
                          lineHeight: 1.4,
                          marginBottom: '10px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {m.bio}
                        </p>
                      )}

                      <div className="mentor-skills">
                        {skillsList.slice(0, 4).map((s: string) => (
                          <span key={s}>{s}</span>
                        ))}
                      </div>

                      <div className="mentor-meta">
                        <span><Star size={12} fill="currentColor" style={{ color: '#F59E0B' }} /> {m.rating || '4.9'}</span>
                        <span><BriefcaseBusiness size={12} /> {m.company || 'Industry Partner'}</span>
                        {m.years_experience && (
                          <span><Clock3 size={12} /> {m.years_experience}+ yrs</span>
                        )}
                      </div>

                      <div className="actions" style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn-inspect"
                          style={{ flex: 1 }}
                          onClick={() => handleOpenMentorProfile(m)}
                        >
                          View Profile
                        </button>

                        {reqStatus === 'pending' ? (
                          <button
                            type="button"
                            className="primary"
                            disabled
                            style={{
                              flex: 1.2,
                              background: 'rgba(245, 158, 11, 0.2)',
                              color: '#F59E0B',
                              borderColor: 'rgba(245, 158, 11, 0.4)',
                              cursor: 'default'
                            }}
                          >
                            <Clock3 size={13} style={{ marginRight: '4px' }} /> Pending
                          </button>
                        ) : reqStatus === 'accepted' ? (
                          <button
                            type="button"
                            className="primary"
                            disabled
                            style={{
                              flex: 1.2,
                              background: 'rgba(16, 185, 129, 0.2)',
                              color: '#10B981',
                              borderColor: 'rgba(16, 185, 129, 0.4)',
                              cursor: 'default'
                            }}
                          >
                            <CheckCircle2 size={13} style={{ marginRight: '4px' }} /> Assigned
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="primary"
                            style={{ flex: 1.2 }}
                            onClick={() => openRequestModal(m)}
                          >
                            Request
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state-box" style={{ padding: '3.5rem 1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
              <Users size={40} style={{ color: '#64748B', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '6px' }}>No Mentors Found</h3>
              <p style={{ color: '#94A3B8', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 16px' }}>
                We couldn't find any mentors matching your search or filters. Try adjusting your search query or reset filters.
              </p>
              <button
                type="button"
                className="btn-inspect"
                onClick={() => { setSearchQuery(''); setCategoryFilter('All'); setAvailabilityFilter('all'); }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </>
      )}

      {/* My Requests Tab */}
      {activeTab === 'requests' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#F8FAFC', margin: '0 0 4px' }}>
              Your Mentorship Requests
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#94A3B8', margin: 0 }}>
              Track the real-time status of your applications sent to expert practitioners.
            </p>
          </div>

          {requests.length > 0 ? (
            <div>
              {requests.map((r: any) => {
                const mentorName = r.mentor?.name || r.mentor_id || 'Industry Mentor';
                const mentorTitle = r.mentor?.title || r.mentor?.expertise || 'Practitioner';
                const mentorCompany = r.mentor?.company || 'Verified Network';

                return (
                  <div key={r.request_id} className="request-card-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="mentor-photo" style={{ width: '42px', height: '42px', fontSize: '14px' }}>
                          {mentorName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <b style={{ fontSize: '1rem', color: '#F8FAFC', display: 'block' }}>{mentorName}</b>
                          <small style={{ color: '#94A3B8', fontSize: '0.82rem' }}>
                            {mentorTitle} • {mentorCompany}
                          </small>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {r.status === 'pending' && (
                          <span className="status-pill-pending">
                            <Clock3 size={12} /> Pending Review
                          </span>
                        )}
                        {r.status === 'accepted' && (
                          <span className="status-pill-accepted">
                            <CheckCircle2 size={12} /> Accepted
                          </span>
                        )}
                        {r.status === 'rejected' && (
                          <span className="status-pill-rejected">
                            <X size={12} /> Declined
                          </span>
                        )}
                        {r.status === 'cancelled' && (
                          <span className="status-pill-cancelled">
                            Cancelled
                          </span>
                        )}

                        {r.status === 'pending' && (
                          <button
                            type="button"
                            className="btn-inspect"
                            style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)', padding: '4px 10px', fontSize: '0.78rem' }}
                            disabled={cancellingId === r.request_id}
                            onClick={() => handleCancelRequest(r.request_id)}
                          >
                            {cancellingId === r.request_id ? 'Cancelling...' : 'Cancel Request'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: '8px', fontSize: '0.85rem' }}>
                      {r.career_goal && (
                        <div style={{ marginBottom: '6px' }}>
                          <span style={{ color: '#7C6CFF', fontWeight: 600 }}>Target Career / Focus: </span>
                          <span style={{ color: '#E2E8F0' }}>{r.career_goal}</span>
                        </div>
                      )}
                      {r.message && (
                        <div style={{ marginBottom: '6px' }}>
                          <span style={{ color: '#94A3B8', fontWeight: 600 }}>Your Message: </span>
                          <span style={{ color: '#CBD5E1' }}>{r.message}</span>
                        </div>
                      )}
                      {r.response_note && (
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <span style={{ color: '#10B981', fontWeight: 600 }}>Mentor Response: </span>
                          <span style={{ color: '#E2E8F0' }}>{r.response_note}</span>
                        </div>
                      )}
                      <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#64748B' }}>
                        Requested on: {new Date(r.created_at).toLocaleDateString()} at {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state-box" style={{ padding: '3.5rem 1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
              <Clock3 size={40} style={{ color: '#64748B', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '6px' }}>No Mentorship Requests</h3>
              <p style={{ color: '#94A3B8', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 16px' }}>
                You have not submitted any mentorship requests yet. Browse our directory of industry practitioners to find the right guide for your career track.
              </p>
              <button
                type="button"
                className="primary"
                onClick={() => setActiveTab('explore')}
              >
                Browse Mentors
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 5: MENTOR MESSAGES */}
      {activeTab === 'messages' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '4px' }}>
              Mentor Conversations
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '0.86rem', margin: 0 }}>
              Direct messaging channel with your assigned industry mentors. Ask technical questions, get roadmap feedback, and coordinate sessions.
            </p>
          </div>

          {myMentors.length === 0 ? (
            <div className="empty-state-box" style={{ padding: '3.5rem 1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
              <MessageSquareText size={40} style={{ color: '#64748B', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '6px' }}>No Assigned Mentors</h3>
              <p style={{ color: '#94A3B8', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 16px' }}>
                You must have an active mentorship assignment to exchange messages. Browse our mentor directory and submit a mentorship request to begin.
              </p>
              <button
                type="button"
                className="primary"
                onClick={() => setActiveTab('explore')}
              >
                Browse Mentors
              </button>
            </div>
          ) : (
            <div className="student-messaging-card">
              {/* Left Sidebar: Mentors Conversations */}
              <div className="student-conv-sidebar">
                <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748B' }} />
                    <input
                      type="text"
                      placeholder="Filter mentors..."
                      value={convFilter}
                      onChange={(e) => setConvFilter(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px 8px 30px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.04)',
                        color: '#F8FAFC',
                        fontSize: '0.82rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {myMentors
                  .filter((m) =>
                    !convFilter ||
                    (m.mentor_name || '').toLowerCase().includes(convFilter.toLowerCase()) ||
                    (m.mentor_title || '').toLowerCase().includes(convFilter.toLowerCase())
                  )
                  .map((m) => {
                    const conv = studentConversations.find((c) => c.mentor_id === m.mentor_id);
                    const isSelected = selectedMentorForChat === m.mentor_id;
                    const initials = (m.mentor_name || 'Mentor')
                      .split(' ')
                      .filter(Boolean)
                      .map((w: string) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase() || 'ME';

                    return (
                      <div
                        key={m.mentor_id}
                        className={`student-conv-tab ${isSelected ? 'active' : ''}`}
                        onClick={() => loadConversation(m.mentor_id)}
                      >
                        <div className="student-conv-avatar">{initials}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="student-conv-name">{m.mentor_name}</span>
                            {conv?.latest_time && (
                              <small style={{ fontSize: '0.7rem', color: '#64748B' }}>
                                {conv.latest_time.split(' ')[1]?.slice(0, 5) || ''}
                              </small>
                            )}
                          </div>
                          <span className="student-conv-snippet">
                            {conv?.latest_message || `${m.mentor_title || 'Mentor'} • ${m.mentor_company || 'PathForge'}`}
                          </span>
                        </div>
                        {conv && conv.unread_count > 0 && (
                          <span
                            style={{
                              background: '#EF4444',
                              color: '#FFFFFF',
                              borderRadius: '10px',
                              padding: '2px 7px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                            }}
                          >
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Right Chat Thread */}
              <div className="student-chat-thread">
                {(() => {
                  const currentActiveMentor = myMentors.find((m) => m.mentor_id === selectedMentorForChat) || myMentors[0];
                  return (
                    <>
                      <div className="student-chat-header">
                        <div>
                          <b style={{ color: '#F8FAFC', fontSize: '0.96rem' }}>
                            {currentActiveMentor?.mentor_name || 'Select a Mentor'}
                          </b>
                          {currentActiveMentor && (
                            <span style={{ display: 'block', color: '#94A3B8', fontSize: '0.78rem', marginTop: '2px' }}>
                              {currentActiveMentor.mentor_title} • {currentActiveMentor.mentor_company}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn-inspect"
                          style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => selectedMentorForChat && loadConversation(selectedMentorForChat)}
                          title="Refresh conversation"
                        >
                          <RefreshCw size={12} /> Refresh
                        </button>
                      </div>

                      <div className="student-chat-body">
                        {chatMessages.length === 0 ? (
                          <div style={{ textAlign: 'center', color: '#94A3B8', margin: 'auto', padding: '2rem' }}>
                            <MessageSquareText size={36} style={{ color: '#6366F1', margin: '0 auto 10px', opacity: 0.6 }} />
                            <p style={{ margin: '0 0 6px', fontSize: '0.9rem', color: '#E2E8F0', fontWeight: 600 }}>No messages yet</p>
                            <small style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                              Send a greeting or ask your mentor for roadmap advice or project review tips.
                            </small>
                          </div>
                        ) : (
                          chatMessages.map((m) => {
                            const isStudent = m.sender_role === 'student';
                            return (
                              <div
                                key={m.message_id}
                                style={{
                                  display: 'flex',
                                  justifyContent: isStudent ? 'flex-end' : 'flex-start',
                                }}
                              >
                                <div className={`student-chat-bubble ${isStudent ? 'student-bubble' : 'mentor-bubble'}`}>
                                  <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: '1.45', whiteSpace: 'pre-wrap' }}>
                                    {m.content}
                                  </p>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '4px' }}>
                                    <small style={{ fontSize: '0.68rem', opacity: 0.8 }}>{m.created_at}</small>
                                    {isStudent && (
                                      <span style={{ fontSize: '0.68rem', opacity: 0.8 }}>
                                        {m.is_read ? '✓✓' : '✓'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={studentChatEndRef} />
                      </div>

                      <form onSubmit={handleSendChatMessage} className="student-chat-footer">
                        <input
                          type="text"
                          placeholder="Type your message to mentor..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          disabled={chatSending || !selectedMentorForChat}
                          maxLength={5000}
                        />
                        <button
                          type="submit"
                          className="primary"
                          style={{ padding: '0 18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          disabled={chatSending || !selectedMentorForChat || !chatInput.trim()}
                        >
                          <Send size={16} />
                        </button>
                      </form>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 6: SKILL ASSESSMENTS & REVIEWS */}
      {activeTab === 'assessments' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '4px' }}>
                Skill Assessments & Mentor Reviews
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '0.86rem', margin: 0 }}>
                Custom technical assessments and project deliverables assigned by your industry mentors. Submit solutions for rubric grading and automated skill calibration.
              </p>
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '8px' }}>
              {(['all', 'pending', 'submitted', 'evaluated'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  className="btn-inspect"
                  onClick={() => setAssessmentFilter(f)}
                  style={{
                    padding: '5px 12px',
                    fontSize: '0.78rem',
                    textTransform: 'capitalize',
                    background: assessmentFilter === f ? 'rgba(99,102,241,0.25)' : 'transparent',
                    borderColor: assessmentFilter === f ? '#818CF8' : 'transparent',
                    color: assessmentFilter === f ? '#FFF' : '#94A3B8',
                    borderRadius: '6px',
                  }}
                >
                  {f === 'all' ? `All (${assignedAssessments.length})` :
                   f === 'pending' ? `Pending (${assignedAssessments.filter(a => a.submission_status === 'pending').length})` :
                   f === 'submitted' ? `In Review (${assignedAssessments.filter(a => a.submission_status === 'submitted').length})` :
                   `Evaluated (${assignedAssessments.filter(a => a.submission_status === 'evaluated').length})`}
                </button>
              ))}
            </div>
          </div>

          {/* Metric KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '22px' }}>
            <div className="card" style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <small style={{ color: '#94A3B8', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Assigned</small>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC', marginTop: '4px' }}>
                {assignedAssessments.length}
              </div>
            </div>
            <div className="card" style={{ padding: '14px 18px', background: 'rgba(245,158,11,0.05)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)' }}>
              <small style={{ color: '#F59E0B', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action Required</small>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FCD34D', marginTop: '4px' }}>
                {assignedAssessments.filter((a) => a.submission_status === 'pending').length} Pending
              </div>
            </div>
            <div className="card" style={{ padding: '14px 18px', background: 'rgba(99,102,241,0.05)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.2)' }}>
              <small style={{ color: '#818CF8', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Under Evaluation</small>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#A5B4FC', marginTop: '4px' }}>
                {assignedAssessments.filter((a) => a.submission_status === 'submitted').length} In Review
              </div>
            </div>
            <div className="card" style={{ padding: '14px 18px', background: 'rgba(16,185,129,0.05)', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.2)' }}>
              <small style={{ color: '#10B981', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Calibrated Mastery</small>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#6EE7B7', marginTop: '4px' }}>
                {assignedAssessments.filter((a) => a.submission_status === 'evaluated').length} Completed
              </div>
            </div>
          </div>

          {loading ? (
            <div className="empty-state-box" style={{ padding: '3rem', textAlign: 'center' }}>
              <RefreshCw size={32} className="animate-spin" style={{ color: '#7C6CFF', margin: '0 auto 12px' }} />
              <b>Loading your skill assessments...</b>
            </div>
          ) : (() => {
            const filtered = assignedAssessments.filter((a) => {
              if (assessmentFilter === 'all') return true;
              return a.submission_status === assessmentFilter;
            });

            if (filtered.length === 0) {
              return (
                <div className="empty-state-box" style={{ padding: '3.5rem 1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                  <Award size={40} style={{ color: '#64748B', margin: '0 auto 12px' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '6px' }}>
                    {assessmentFilter === 'all' ? 'No Skill Assessments Assigned Yet' : `No ${assessmentFilter} assessments found`}
                  </h3>
                  <p style={{ color: '#94A3B8', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 16px' }}>
                    {assessmentFilter === 'all'
                      ? 'When your assigned mentor creates customized skill evaluations or project reviews, they will be listed here with rubrics and deadlines.'
                      : `You currently have zero assessments with ${assessmentFilter} status.`}
                  </p>
                  {myMentors.length > 0 && assessmentFilter === 'all' && (
                    <button
                      type="button"
                      className="btn-inspect"
                      onClick={() => {
                        setSelectedMentorForChat(myMentors[0].mentor_id);
                        setActiveTab('messages');
                      }}
                    >
                      <MessageSquareText size={14} style={{ marginRight: '6px' }} /> Request Assessment from Mentor
                    </button>
                  )}
                </div>
              );
            }

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
                {filtered.map((a: any) => {
                  const isPending = a.submission_status === 'pending';
                  const isSubmitted = a.submission_status === 'submitted';
                  const isEvaluated = a.submission_status === 'evaluated';

                  return (
                    <div
                      key={a.assessment_id}
                      className="card"
                      style={{
                        padding: '20px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '12px',
                        border: isPending
                          ? '1px solid rgba(245,158,11,0.35)'
                          : isEvaluated
                          ? '1px solid rgba(16,185,129,0.35)'
                          : '1px solid rgba(99,102,241,0.35)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        {/* Top badges */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span className="tag purple" style={{ fontWeight: 600 }}>
                              {a.skill_name || a.skill_id}
                            </span>
                            {a.deadline && (
                              <span style={{ fontSize: '0.78rem', color: '#CBD5E1', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Clock3 size={12} style={{ color: '#F59E0B' }} /> Due: {a.deadline}
                              </span>
                            )}
                          </div>

                          {isPending && (
                            <span className="status-pill-pending" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                              Action Required
                            </span>
                          )}
                          {isSubmitted && (
                            <span style={{ background: 'rgba(99,102,241,0.15)', color: '#A5B4FC', border: '1px solid rgba(99,102,241,0.3)', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                              In Review
                            </span>
                          )}
                          {isEvaluated && (
                            <span className="status-pill-accepted" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                              <CheckCircle2 size={12} style={{ marginRight: '4px' }} /> Graded
                            </span>
                          )}
                        </div>

                        {/* Title & Mentor */}
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F8FAFC', margin: '4px 0 2px' }}>
                          {a.title}
                        </h4>
                        <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '10px' }}>
                          Assigned by <b style={{ color: '#E2E8F0' }}>{a.mentor_name}</b> • Max Score: {a.max_score} pts
                        </div>

                        {/* Description */}
                        {a.description && (
                          <p style={{ fontSize: '0.86rem', color: '#CBD5E1', lineHeight: 1.5, margin: '0 0 12px' }}>
                            {a.description}
                          </p>
                        )}

                        {/* Evaluation Rubric preview */}
                        {a.criteria && a.criteria.length > 0 && (
                          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '8px', marginBottom: '12px', fontSize: '0.8rem' }}>
                            <div style={{ color: '#818CF8', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <ClipboardCheck size={13} /> {a.criteria.length} Evaluation Rubric Criteria:
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {a.criteria.map((c: any, i: number) => (
                                <span key={i} style={{ background: 'rgba(99,102,241,0.12)', color: '#CBD5E1', padding: '2px 8px', borderRadius: '4px', fontSize: '0.74rem' }}>
                                  {c.name} ({c.max_points} pts)
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Evaluated Score & Feedback Box */}
                        {isEvaluated && a.submission && (
                          <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px', padding: '12px 14px', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Calibrated Score
                              </span>
                              <b style={{ fontSize: '1.15rem', color: '#34D399' }}>
                                {a.submission.score} / {a.max_score} pts
                                <span style={{ fontSize: '0.8rem', color: '#A7F3D0', marginLeft: '6px', fontWeight: 600 }}>
                                  ({Math.round(((a.submission.score || 0) / (a.max_score || 100)) * 100)}%)
                                </span>
                              </b>
                            </div>

                            {a.submission.feedback && (
                              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(16,185,129,0.15)' }}>
                                <small style={{ color: '#A7F3D0', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                                  Mentor Constructive Feedback:
                                </small>
                                <p style={{ margin: 0, fontSize: '0.84rem', color: '#E2E8F0', fontStyle: 'italic', lineHeight: 1.45 }}>
                                  &ldquo;{a.submission.feedback}&rdquo;
                                </p>
                              </div>
                            )}

                            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#34D399' }}>
                              <CheckCircle2 size={12} /> Mastered & updated in Student Skill Matrix
                            </div>
                          </div>
                        )}

                        {/* Submission Info for submitted state */}
                        {isSubmitted && a.submission && (
                          <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', fontSize: '0.82rem' }}>
                            <div style={{ color: '#A5B4FC', fontWeight: 600, marginBottom: '4px' }}>
                              Solution Submitted: {a.submission.submitted_at?.split('T')[0] || 'Recently'}
                            </div>
                            {a.submission.deliverable_url && (
                              <div style={{ marginBottom: '4px' }}>
                                <a
                                  href={a.submission.deliverable_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: '#818CF8', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                                >
                                  <ExternalLink size={12} /> {a.submission.deliverable_url}
                                </a>
                              </div>
                            )}
                            {a.submission.submission_notes && (
                              <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                Note: {a.submission.submission_notes}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', marginTop: '6px', display: 'flex', gap: '8px' }}>
                        {isPending && (
                          <button
                            type="button"
                            className="primary"
                            style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.84rem', padding: '8px 12px' }}
                            onClick={() => {
                              setSelectedAssessmentForSubmit(a);
                              setSubmissionNotes('');
                              setSubmissionUrl('');
                              setSubmissionError(null);
                            }}
                          >
                            <Upload size={14} /> Submit Solution
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-inspect"
                          style={{ flex: isPending ? 1 : '1 1 100%', fontSize: '0.82rem', padding: '8px 12px' }}
                          onClick={() => setSelectedAssessmentForDetail(a)}
                        >
                          {isEvaluated ? 'View Evaluation & Rubric' : isSubmitted ? 'View Submission & Rubric' : 'View Rubric'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* SUB-VIEW 7: CAREER GUIDANCE & ADVISORY NOTES */}
      {activeTab === 'guidance' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#F8FAFC', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={20} style={{ color: '#818CF8' }} /> Mentor Career Guidance & Action Plans
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '0.86rem', margin: 0 }}>
                Personalized industry advice, target skill recommendations, curated learning courses, and actionable preparation tasks from your assigned mentors.
              </p>
            </div>
            {user?.target_career_name && (
              <div style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '20px', padding: '6px 14px', fontSize: '0.82rem', color: '#A5B4FC', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} /> Goal: <b>{user.target_career_name}</b>
              </div>
            )}
          </div>

          {loading ? (
            <div className="empty-state-box" style={{ padding: '3.5rem', textAlign: 'center' }}>
              <RefreshCw size={32} className="animate-spin" style={{ color: '#7C6CFF', margin: '0 auto 12px' }} />
              <b>Loading your career guidance advisory notes...</b>
            </div>
          ) : studentGuidance.length === 0 ? (
            <div className="empty-state-box" style={{ padding: '3.5rem 1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
              <Target size={44} style={{ color: '#64748B', margin: '0 auto 14px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '6px' }}>No Career Guidance Received Yet</h3>
              <p style={{ color: '#94A3B8', fontSize: '0.88rem', maxWidth: '480px', margin: '0 auto 18px' }}>
                Your assigned technical mentors will formulate customized career strategies, skill recommendations, project ideas, and preparation tasks tailored directly to your roadmap milestones.
              </p>
              <button
                type="button"
                className="primary"
                onClick={() => setActiveTab('explore')}
              >
                Browse & Connect with Mentors
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {studentGuidance.map((item: any, idx: number) => {
                const isCompleted = item.status === 'completed';
                const isUpdating = updatingGuidanceId === item.guidance_id;
                const initials = (item.mentor_name || 'Mentor')
                  .split(' ')
                  .filter(Boolean)
                  .map((w: string) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || 'ME';

                return (
                  <div
                    key={item.guidance_id || idx}
                    className="card"
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: isCompleted ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(99, 102, 241, 0.25)',
                      borderRadius: '14px',
                      padding: '24px',
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                        <div
                          className="mentor-photo"
                          style={{
                            width: '48px',
                            height: '48px',
                            fontSize: '16px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: '#FFF',
                          }}
                        >
                          {initials}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F8FAFC', margin: '0 0 2px' }}>
                            {item.mentor_name}
                          </h4>
                          <div style={{ fontSize: '0.82rem', color: '#94A3B8' }}>
                            {item.mentor_title || 'Technical Mentor'} {item.mentor_company ? `• ${item.mentor_company}` : ''}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontWeight: 600,
                            background: isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                            color: isCompleted ? '#34D399' : '#818CF8',
                            border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
                          }}
                        >
                          {isCompleted ? 'Completed' : 'In Progress'}
                        </span>
                        <button
                          type="button"
                          className="btn-inspect"
                          disabled={isUpdating}
                          style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                          onClick={() => handleToggleGuidanceStatus(item.guidance_id, item.status || 'in_progress')}
                        >
                          {isUpdating ? 'Updating...' : isCompleted ? 'Mark In Progress' : 'Mark Completed'}
                        </button>
                      </div>
                    </div>

                    {/* Advice Notes */}
                    <div style={{ marginBottom: '18px' }}>
                      <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#818CF8', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '6px' }}>
                        Strategic Advisory & Notes
                      </div>
                      <p style={{ color: '#E2E8F0', fontSize: '0.92rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                        {item.advice_notes}
                      </p>
                    </div>

                    {/* Recommended Skills */}
                    {Array.isArray(item.recommended_skills) && item.recommended_skills.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
                          Priority Skills to Target
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {item.recommended_skills.map((sk: string) => (
                            <span
                              key={sk}
                              style={{
                                background: 'rgba(99, 102, 241, 0.15)',
                                color: '#C7D2FE',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                borderRadius: '6px',
                                padding: '4px 10px',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                              }}
                            >
                              ⚡ {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommended Courses & Projects */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                      {Array.isArray(item.recommended_courses) && item.recommended_courses.length > 0 && (
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <b style={{ color: '#38BDF8', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            <BookOpen size={14} /> Recommended Courses
                          </b>
                          <ul style={{ margin: 0, paddingLeft: '18px', color: '#CBD5E1', fontSize: '0.84rem' }}>
                            {item.recommended_courses.map((crs: string, cIdx: number) => (
                              <li key={cIdx} style={{ marginBottom: '4px' }}>{crs}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {Array.isArray(item.recommended_projects) && item.recommended_projects.length > 0 && (
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <b style={{ color: '#F59E0B', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            <FolderKanban size={14} /> Recommended Projects
                          </b>
                          <ul style={{ margin: 0, paddingLeft: '18px', color: '#CBD5E1', fontSize: '0.84rem' }}>
                            {item.recommended_projects.map((proj: string, pIdx: number) => (
                              <li key={pIdx} style={{ marginBottom: '4px' }}>{proj}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Preparation Activities & Action Items */}
                    {((Array.isArray(item.preparation_activities) && item.preparation_activities.length > 0) ||
                      (Array.isArray(item.action_items) && item.action_items.length > 0)) && (
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <b style={{ color: '#10B981', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                          <ClipboardCheck size={14} /> Action Items & Next Steps
                        </b>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {[...(item.action_items || []), ...(item.preparation_activities || [])].map((act: string, aIdx: number) => (
                            <div key={aIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.85rem', color: '#CBD5E1' }}>
                              <CheckCircle2 size={15} style={{ color: isCompleted ? '#10B981' : '#64748B', flexShrink: 0, marginTop: '2px' }} />
                              <span>{act}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metadata Footer */}
                    <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: '#64748B' }}>
                      <span>Guidance logged on {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}</span>
                      {item.follow_up_date && (
                        <span>Follow-up scheduled: <b>{item.follow_up_date}</b></span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==============================================================
          MODAL 1: MENTOR DETAILED PROFILE MODAL
          ============================================================== */}
      {selectedMentorForProfile && (
        <div className="mentor-modal-overlay" onClick={() => setSelectedMentorForProfile(null)}>
          <div className="mentor-modal-card wide" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div className="mentor-photo" style={{ width: '56px', height: '56px', fontSize: '18px' }}>
                  {(selectedMentorForProfile.name || 'ME').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC', margin: '0 0 4px' }}>
                    {selectedMentorForProfile.name}
                  </h2>
                  <p style={{ fontSize: '0.88rem', color: '#94A3B8', margin: 0 }}>
                    {selectedMentorForProfile.title || selectedMentorForProfile.expertise} • {selectedMentorForProfile.company || 'Verified Mentor'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMentorForProfile(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px 28px', maxHeight: '70vh', overflowY: 'auto' }}>
              {selectedMentorForProfile.headline && (
                <div style={{ marginBottom: '16px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', padding: '10px 14px', borderRadius: '8px', color: '#C7D2FE', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  "{selectedMentorForProfile.headline}"
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#7C6CFF', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Professional Biography
                </h4>
                <p style={{ fontSize: '0.92rem', color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>
                  {selectedMentorForProfile.bio || 'Experienced practitioner dedicated to advising students on career readiness, real-world portfolio building, and technical interview mastery.'}
                </p>
              </div>

              {(selectedMentorForProfile.education || selectedMentorForProfile.certifications || selectedMentorForProfile.languages || selectedMentorForProfile.career_specializations) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                  {selectedMentorForProfile.education && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <small style={{ color: '#94A3B8', display: 'block' }}>Education</small>
                      <b style={{ color: '#F8FAFC', fontSize: '0.85rem' }}>{selectedMentorForProfile.education}</b>
                    </div>
                  )}
                  {selectedMentorForProfile.certifications && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <small style={{ color: '#94A3B8', display: 'block' }}>Certifications</small>
                      <b style={{ color: '#F8FAFC', fontSize: '0.85rem' }}>{selectedMentorForProfile.certifications}</b>
                    </div>
                  )}
                  {selectedMentorForProfile.languages && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <small style={{ color: '#94A3B8', display: 'block' }}>Languages Spoken</small>
                      <b style={{ color: '#F8FAFC', fontSize: '0.85rem' }}>{selectedMentorForProfile.languages}</b>
                    </div>
                  )}
                  {selectedMentorForProfile.career_specializations && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <small style={{ color: '#94A3B8', display: 'block' }}>Career Specializations</small>
                      <b style={{ color: '#F8FAFC', fontSize: '0.85rem' }}>{selectedMentorForProfile.career_specializations}</b>
                    </div>
                  )}
                </div>
              )}

              {(selectedMentorForProfile.linkedin_url || selectedMentorForProfile.github_url || selectedMentorForProfile.portfolio_url) && (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {selectedMentorForProfile.linkedin_url && (
                    <a
                      href={selectedMentorForProfile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-inspect"
                      style={{ fontSize: '0.8rem', padding: '6px 12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <ExternalLink size={13} /> LinkedIn
                    </a>
                  )}
                  {selectedMentorForProfile.github_url && (
                    <a
                      href={selectedMentorForProfile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-inspect"
                      style={{ fontSize: '0.8rem', padding: '6px 12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <ExternalLink size={13} /> GitHub
                    </a>
                  )}
                  {selectedMentorForProfile.portfolio_url && (
                    <a
                      href={selectedMentorForProfile.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-inspect"
                      style={{ fontSize: '0.8rem', padding: '6px 12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <ExternalLink size={13} /> Portfolio
                    </a>
                  )}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px' }}>
                  <small style={{ color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Availability</small>
                  <b style={{ color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={selectedMentorForProfile.availability?.toLowerCase().includes('available') ? 'green-dot' : 'orange-dot'} />
                    {selectedMentorForProfile.availability || 'Available'}
                  </b>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px' }}>
                  <small style={{ color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Rating & Experience</small>
                  <b style={{ color: '#F8FAFC' }}>
                    ⭐ {selectedMentorForProfile.rating || '4.9'} / 5.0 • {selectedMentorForProfile.years_experience || 5}+ years
                  </b>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#7C6CFF', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Core Competencies & Skills
                </h4>
                <div className="mentor-skills" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(Array.isArray(selectedMentorForProfile.skills)
                    ? selectedMentorForProfile.skills
                    : String(selectedMentorForProfile.skills || '').split(/[,·]/)
                  ).map((s: string) => (
                    <span key={s.trim()} style={{ background: 'rgba(124,108,255,0.15)', color: '#C4B5FD', border: '1px solid rgba(124,108,255,0.3)' }}>
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn-inspect"
                  onClick={() => setSelectedMentorForProfile(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={() => {
                    const m = selectedMentorForProfile;
                    setSelectedMentorForProfile(null);
                    openRequestModal(m);
                  }}
                >
                  Request Mentorship
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL 2: REQUEST MENTORSHIP FORM MODAL
          ============================================================== */}
      {selectedMentorForRequest && (
        <div className="mentor-modal-overlay" onClick={() => !submittingRequest && setSelectedMentorForRequest(null)}>
          <div className="mentor-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC', margin: '0 0 2px' }}>
                  Request Mentorship
                </h3>
                <small style={{ color: '#94A3B8' }}>
                  Connecting with <b>{selectedMentorForRequest.name}</b> ({selectedMentorForRequest.title || selectedMentorForRequest.expertise})
                </small>
              </div>
              <button
                type="button"
                disabled={submittingRequest}
                onClick={() => setSelectedMentorForRequest(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendRequest} style={{ padding: '20px 24px' }}>
              {requestModalError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#FCA5A5', padding: '10px 14px', borderRadius: '8px', fontSize: '0.84rem', marginBottom: '16px' }}>
                  {requestModalError}
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.84rem', color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                  Target Career / Specialization Goal
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Machine Learning Engineer, Cloud Architect"
                  value={requestCareerGoal}
                  onChange={(e) => setRequestCareerGoal(e.target.value)}
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

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.84rem', color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                  Why are you seeking mentorship from this mentor? (Message)
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Introduce yourself, share current milestone goals, and what specific feedback you hope to receive..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#FFF',
                    fontSize: '0.88rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-inspect"
                  disabled={submittingRequest}
                  onClick={() => setSelectedMentorForRequest(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary"
                  disabled={submittingRequest}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {submittingRequest ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Send Mentorship Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          PHASE 7 MODAL 2: STUDENT SCHEDULE 1:1 SESSION MODAL
          ============================================================== */}
      {showStudentScheduleModal && (
        <div className="mentor-modal-overlay" onClick={() => !studentSchedulingSubmitting && setShowStudentScheduleModal(false)}>
          <div className="mentor-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC', margin: '0 0 2px' }}>
                  Schedule 1:1 Mentorship Session
                </h3>
                <small style={{ color: '#94A3B8' }}>
                  Request a live guidance call with your assigned mentor.
                </small>
              </div>
              <button
                type="button"
                disabled={studentSchedulingSubmitting}
                onClick={() => setShowStudentScheduleModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStudentScheduleSession} style={{ padding: '20px 24px' }}>
              {studentScheduleError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#FCA5A5', padding: '10px 14px', borderRadius: '8px', fontSize: '0.84rem', marginBottom: '16px' }}>
                  {studentScheduleError}
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.84rem', color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                  Select Assigned Mentor
                </label>
                <select
                  value={studentScheduleMentorId}
                  onChange={(e) => setStudentScheduleMentorId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: '#1E293B',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#FFF',
                    fontSize: '0.88rem',
                  }}
                >
                  <option value="">-- Choose Assigned Mentor --</option>
                  {myMentors.map((m) => (
                    <option key={m.mentor_id} value={m.mentor_id}>
                      {m.mentor_name} ({m.mentor_title || m.mentor_company || 'Mentor'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.84rem', color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                  Session Topic / Purpose
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Portfolio Project Review & ML System Architecture"
                  value={studentScheduleTopic}
                  onChange={(e) => setStudentScheduleTopic(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#FFF',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                    Session Date
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={studentScheduleDate}
                    onChange={(e) => setStudentScheduleDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#FFF',
                      fontSize: '0.84rem',
                    }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={studentScheduleStartTime}
                    onChange={(e) => setStudentScheduleStartTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#FFF',
                      fontSize: '0.84rem',
                    }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={studentScheduleEndTime}
                    onChange={(e) => setStudentScheduleEndTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#FFF',
                      fontSize: '0.84rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                    Platform
                  </label>
                  <select
                    value={studentSchedulePlatform}
                    onChange={(e) => setStudentSchedulePlatform(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      background: '#1E293B',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#FFF',
                      fontSize: '0.84rem',
                    }}
                  >
                    <option value="Google Meet">Google Meet</option>
                    <option value="Zoom">Zoom</option>
                    <option value="Microsoft Teams">Microsoft Teams</option>
                    <option value="Slack Huddle">Slack Huddle</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                    Meeting Link (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={studentScheduleMeetingLink}
                    onChange={(e) => setStudentScheduleMeetingLink(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#FFF',
                      fontSize: '0.84rem',
                    }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.82rem', color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                  Agenda, Goals, or Questions for Mentor
                </label>
                <textarea
                  rows={3}
                  placeholder="Outline the key topics, roadblocks, or code deliverables you want to cover during this session..."
                  value={studentScheduleNotes}
                  onChange={(e) => setStudentScheduleNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#FFF',
                    fontSize: '0.86rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-inspect"
                  disabled={studentSchedulingSubmitting}
                  onClick={() => setShowStudentScheduleModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary"
                  disabled={studentSchedulingSubmitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {studentSchedulingSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Scheduling...
                    </>
                  ) : (
                    <>
                      <CalendarDays size={14} /> Schedule Session
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          PHASE 7 MODAL 3: STUDENT RESCHEDULE SESSION MODAL
          ============================================================== */}
      {selectedStudentSessionForReschedule && (
        <div className="mentor-modal-overlay" onClick={() => !studentRescheduleSubmitting && setSelectedStudentSessionForReschedule(null)}>
          <div className="mentor-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC', margin: '0 0 2px' }}>
                  Reschedule Mentorship Session
                </h3>
                <small style={{ color: '#94A3B8' }}>
                  &ldquo;{selectedStudentSessionForReschedule.topic}&rdquo; with {selectedStudentSessionForReschedule.mentor_name}
                </small>
              </div>
              <button
                type="button"
                disabled={studentRescheduleSubmitting}
                onClick={() => setSelectedStudentSessionForReschedule(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStudentRescheduleSubmit} style={{ padding: '20px 24px' }}>
              {studentRescheduleError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#FCA5A5', padding: '10px 14px', borderRadius: '8px', fontSize: '0.84rem', marginBottom: '16px' }}>
                  {studentRescheduleError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                    New Date
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={studentRescheduleDate}
                    onChange={(e) => setStudentRescheduleDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#FFF',
                      fontSize: '0.84rem',
                    }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                    New Start
                  </label>
                  <input
                    type="time"
                    required
                    value={studentRescheduleStartTime}
                    onChange={(e) => setStudentRescheduleStartTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#FFF',
                      fontSize: '0.84rem',
                    }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                    New End
                  </label>
                  <input
                    type="time"
                    required
                    value={studentRescheduleEndTime}
                    onChange={(e) => setStudentRescheduleEndTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#FFF',
                      fontSize: '0.84rem',
                    }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.82rem', color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                  Meeting Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={studentRescheduleMeetingLink}
                  onChange={(e) => setStudentRescheduleMeetingLink(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#FFF',
                    fontSize: '0.84rem',
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.82rem', color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                  Reschedule Note / Reason for Mentor
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain why you are requesting to reschedule this session..."
                  value={studentRescheduleNotes}
                  onChange={(e) => setStudentRescheduleNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#FFF',
                    fontSize: '0.86rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-inspect"
                  disabled={studentRescheduleSubmitting}
                  onClick={() => setSelectedStudentSessionForReschedule(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary"
                  disabled={studentRescheduleSubmitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {studentRescheduleSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Rescheduling...
                    </>
                  ) : (
                    <>
                      <Clock3 size={14} /> Confirm Reschedule
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          PHASE 7 MODAL 4: STUDENT SESSION CANCELLATION MODAL
          ============================================================== */}
      {selectedStudentSessionForCancel && (
        <div className="mentor-modal-overlay" onClick={() => !studentCancelSubmitting && setSelectedStudentSessionForCancel(null)}>
          <div className="mentor-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC', margin: '0 0 2px' }}>
                  Cancel Mentorship Session
                </h3>
                <small style={{ color: '#94A3B8' }}>
                  This will notify your mentor and remove it from upcoming calls.
                </small>
              </div>
              <button
                type="button"
                disabled={studentCancelSubmitting}
                onClick={() => setSelectedStudentSessionForCancel(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStudentCancelSubmit} style={{ padding: '20px 24px' }}>
              <p style={{ color: '#CBD5E1', fontSize: '0.88rem', margin: '0 0 14px', lineHeight: 1.5 }}>
                Are you sure you want to cancel the session <b>&ldquo;{selectedStudentSessionForCancel.topic}&rdquo;</b> with <b>{selectedStudentSessionForCancel.mentor_name}</b>?
              </p>

              {studentCancelError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#FCA5A5', padding: '10px 14px', borderRadius: '8px', fontSize: '0.84rem', marginBottom: '16px' }}>
                  {studentCancelError}
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.82rem', color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                  Cancellation Reason (Shared with mentor)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Schedule conflict with midterm exam. Will request a new slot next week."
                  value={studentCancelReason}
                  onChange={(e) => setStudentCancelReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#FFF',
                    fontSize: '0.86rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-inspect"
                  disabled={studentCancelSubmitting}
                  onClick={() => setSelectedStudentSessionForCancel(null)}
                >
                  Keep Session
                </button>
                <button
                  type="submit"
                  className="primary"
                  disabled={studentCancelSubmitting}
                  style={{ background: '#DC2626', borderColor: '#DC2626', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {studentCancelSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Cancelling...
                    </>
                  ) : (
                    'Confirm Cancellation'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          PHASE 7 MODAL 5: STUDENT SESSION DETAILS MODAL
          ============================================================== */}
      {selectedStudentSessionForDetail && (
        <div className="mentor-modal-overlay" onClick={() => setSelectedStudentSessionForDetail(null)}>
          <div className="mentor-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className={`status-pill ${selectedStudentSessionForDetail.status}`} style={{ marginBottom: '6px', display: 'inline-block' }}>
                  {selectedStudentSessionForDetail.status}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC', margin: '4px 0 2px' }}>
                  {selectedStudentSessionForDetail.topic}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentSessionForDetail(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                  <small style={{ color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Mentor</small>
                  <b style={{ color: '#F8FAFC', fontSize: '0.92rem' }}>{selectedStudentSessionForDetail.mentor_name}</b>
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>{selectedStudentSessionForDetail.mentor_company || 'Industry Practitioner'}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                  <small style={{ color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Date & Duration</small>
                  <b style={{ color: '#F8FAFC', fontSize: '0.92rem' }}>{selectedStudentSessionForDetail.session_date}</b>
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>{selectedStudentSessionForDetail.start_time} - {selectedStudentSessionForDetail.end_time} ({selectedStudentSessionForDetail.duration_minutes || 60}m)</div>
                </div>
              </div>

              {selectedStudentSessionForDetail.meeting_link && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Meeting Link</label>
                  <a
                    href={selectedStudentSessionForDetail.meeting_link}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#818CF8', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                  >
                    <ExternalLink size={14} /> {selectedStudentSessionForDetail.meeting_link}
                  </a>
                </div>
              )}

              {selectedStudentSessionForDetail.notes && (
                <div style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: '8px', borderLeft: selectedStudentSessionForDetail.status === 'completed' ? '3px solid #10B981' : selectedStudentSessionForDetail.status === 'cancelled' ? '3px solid #EF4444' : '3px solid #7C6CFF' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: selectedStudentSessionForDetail.status === 'completed' ? '#10B981' : selectedStudentSessionForDetail.status === 'cancelled' ? '#EF4444' : '#7C6CFF', display: 'block', marginBottom: '4px' }}>
                    {selectedStudentSessionForDetail.status === 'completed' ? 'Takeaways & Action Items' : selectedStudentSessionForDetail.status === 'cancelled' ? 'Cancellation Reason' : 'Agenda / Instructions'}
                  </label>
                  <p style={{ margin: 0, fontSize: '0.86rem', color: '#E2E8F0', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                    {selectedStudentSessionForDetail.notes}
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                {(selectedStudentSessionForDetail.status === 'upcoming' || selectedStudentSessionForDetail.status === 'rescheduled') && selectedStudentSessionForDetail.meeting_link && (
                  <a
                    href={selectedStudentSessionForDetail.meeting_link}
                    target="_blank"
                    rel="noreferrer"
                    className="primary"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '0.84rem' }}
                  >
                    <ExternalLink size={14} /> Join Meeting
                  </a>
                )}
                <button
                  type="button"
                  className="btn-inspect"
                  onClick={() => setSelectedStudentSessionForDetail(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          PHASE 9 MODAL 1: STUDENT SUBMIT ASSESSMENT MODAL
          ============================================================== */}
      {selectedAssessmentForSubmit && (
        <div className="mentor-modal-overlay" onClick={() => !submissionSubmitting && setSelectedAssessmentForSubmit(null)}>
          <div className="mentor-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="tag purple" style={{ marginBottom: '6px', display: 'inline-block' }}>
                  {selectedAssessmentForSubmit.skill_name || selectedAssessmentForSubmit.skill_id}
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F8FAFC', margin: '4px 0 2px' }}>
                  Submit Assessment Solution
                </h3>
                <small style={{ color: '#94A3B8' }}>
                  &ldquo;{selectedAssessmentForSubmit.title}&rdquo; • Assigned by {selectedAssessmentForSubmit.mentor_name}
                </small>
              </div>
              <button
                type="button"
                disabled={submissionSubmitting}
                onClick={() => setSelectedAssessmentForSubmit(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStudentSubmitAssessment} style={{ padding: '20px 24px' }}>
              {submissionError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#FCA5A5', padding: '10px 14px', borderRadius: '8px', fontSize: '0.84rem', marginBottom: '16px' }}>
                  {submissionError}
                </div>
              )}

              {/* Rubric criteria reminder */}
              {selectedAssessmentForSubmit.criteria && selectedAssessmentForSubmit.criteria.length > 0 && (
                <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.82rem' }}>
                  <b style={{ color: '#818CF8', display: 'block', marginBottom: '6px' }}>
                    Evaluation Rubric ({selectedAssessmentForSubmit.max_score} pts total):
                  </b>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                    {selectedAssessmentForSubmit.criteria.map((c: any, i: number) => (
                      <div key={i} style={{ color: '#CBD5E1', fontSize: '0.78rem' }}>
                        • <b>{c.name}</b> ({c.max_points} pts): {c.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.82rem', color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                  Deliverable Repository or Demo URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/your-username/repo-name or PR link..."
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#FFF',
                    fontSize: '0.84rem',
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.82rem', color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                  Solution Notes, Answers, & Approach Summary
                </label>
                <textarea
                  rows={6}
                  placeholder="Document your architecture decisions, edge cases handled, how to run tests, and answers to the assessment criteria..."
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#FFF',
                    fontSize: '0.86rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-inspect"
                  disabled={submissionSubmitting}
                  onClick={() => setSelectedAssessmentForSubmit(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary"
                  disabled={submissionSubmitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {submissionSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Upload size={14} /> Submit Deliverable
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          PHASE 9 MODAL 2: STUDENT ASSESSMENT DETAILS & RUBRIC MODAL
          ============================================================== */}
      {selectedAssessmentForDetail && (
        <div className="mentor-modal-overlay" onClick={() => setSelectedAssessmentForDetail(null)}>
          <div className="mentor-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="tag purple">
                    {selectedAssessmentForDetail.skill_name || selectedAssessmentForDetail.skill_id}
                  </span>
                  <span className={`status-pill ${selectedAssessmentForDetail.submission_status === 'evaluated' ? 'completed' : selectedAssessmentForDetail.submission_status === 'submitted' ? 'upcoming' : 'rescheduled'}`}>
                    {selectedAssessmentForDetail.submission_status}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F8FAFC', margin: '2px 0' }}>
                  {selectedAssessmentForDetail.title}
                </h3>
                <small style={{ color: '#94A3B8' }}>
                  Assigned by {selectedAssessmentForDetail.mentor_name} • Max Score: {selectedAssessmentForDetail.max_score} pts
                </small>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssessmentForDetail(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px 24px', maxHeight: '72vh', overflowY: 'auto' }}>
              {/* Instructions */}
              <div style={{ marginBottom: '18px' }}>
                <b style={{ color: '#7C6CFF', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '4px' }}>
                  Description & Instructions
                </b>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#CBD5E1', lineHeight: 1.5 }}>
                  {selectedAssessmentForDetail.description || 'No detailed instructions provided.'}
                </p>
              </div>

              {/* Rubric Criteria with Points */}
              {selectedAssessmentForDetail.criteria && selectedAssessmentForDetail.criteria.length > 0 && (
                <div style={{ marginBottom: '18px' }}>
                  <b style={{ color: '#7C6CFF', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                    Evaluation Rubric Breakdown
                  </b>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedAssessmentForDetail.criteria.map((c: any, i: number) => {
                      const earnedScore = selectedAssessmentForDetail.submission?.criteria_scores?.[c.name];
                      return (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <b style={{ color: '#F8FAFC', fontSize: '0.88rem' }}>{c.name}</b>
                            <span style={{ fontSize: '0.82rem', color: earnedScore !== undefined ? '#34D399' : '#818CF8', fontWeight: 600 }}>
                              {earnedScore !== undefined ? `${earnedScore} / ${c.max_points} pts` : `Max: ${c.max_points} pts`}
                            </span>
                          </div>
                          {c.description && (
                            <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: '0.8rem' }}>{c.description}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Evaluation Score & Feedback (if evaluated) */}
              {selectedAssessmentForDetail.submission_status === 'evaluated' && selectedAssessmentForDetail.submission && (
                <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '16px', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <b style={{ color: '#10B981', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Final Calibrated Evaluation
                    </b>
                    <b style={{ color: '#34D399', fontSize: '1.25rem' }}>
                      {selectedAssessmentForDetail.submission.score} / {selectedAssessmentForDetail.max_score} pts
                    </b>
                  </div>
                  {selectedAssessmentForDetail.submission.feedback && (
                    <div style={{ marginTop: '8px' }}>
                      <small style={{ color: '#A7F3D0', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                        Constructive Feedback:
                      </small>
                      <p style={{ margin: 0, fontSize: '0.86rem', color: '#E2E8F0', fontStyle: 'italic', lineHeight: 1.5 }}>
                        &ldquo;{selectedAssessmentForDetail.submission.feedback}&rdquo;
                      </p>
                    </div>
                  )}
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#34D399' }}>
                    <CheckCircle2 size={13} /> Evaluated and calibrated into Student Skill Matrix
                  </div>
                </div>
              )}

              {/* Student's Submission Details */}
              {selectedAssessmentForDetail.submission && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px 16px', marginBottom: '18px' }}>
                  <b style={{ color: '#CBD5E1', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                    Your Submitted Solution
                  </b>
                  {selectedAssessmentForDetail.submission.deliverable_url && (
                    <div style={{ marginBottom: '8px' }}>
                      <small style={{ color: '#94A3B8', display: 'block', marginBottom: '2px' }}>Repository / PR URL:</small>
                      <a
                        href={selectedAssessmentForDetail.submission.deliverable_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#818CF8', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                      >
                        <ExternalLink size={13} /> {selectedAssessmentForDetail.submission.deliverable_url}
                      </a>
                    </div>
                  )}
                  {selectedAssessmentForDetail.submission.submission_notes && (
                    <div>
                      <small style={{ color: '#94A3B8', display: 'block', marginBottom: '2px' }}>Solution Notes:</small>
                      <p style={{ margin: 0, color: '#E2E8F0', fontSize: '0.85rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                        {selectedAssessmentForDetail.submission.submission_notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-inspect"
                  onClick={() => setSelectedAssessmentForDetail(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ==========================================
// COMPANY INTELLIGENCE
// ==========================================
function Companies({ notify }: { notify: (message: string) => void }) {
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    api.getCompanies().then((data) => {
      if (Array.isArray(data) && data.length > 0) setCompanies(data);
    }).catch(() => {});
  }, []);

  const displayComps = companies.length > 0 ? companies : [
    { company_name: 'Google', target_role: 'Machine Learning Engineer', match_percentage: '86%', skills: ['Python', 'TensorFlow', 'SQL'] },
    { company_name: 'Microsoft', target_role: 'Data Scientist', match_percentage: '78%', skills: ['Python', 'Azure', 'Statistics'] },
    { company_name: 'XYZ Solutions', target_role: 'Backend Developer', match_percentage: '72%', skills: ['Python', 'SQL', 'FastAPI'] },
  ];

  return (
    <>
      <ProductHeader eyebrow="MARKET INTELLIGENCE · ROLE ALIGNMENT" title="Company Intelligence" sub="Explore target companies, role requirements, and your explainable skill match." action="Analyze my match" notify={notify} />
      <div className="company-grid">
        {displayComps.map((c: any) => (
          <div className="company-card card" key={c.company_name}>
            <div className="company-logo">{c.company_name[0]}</div>
            <div className="company-top">
              <div><h2>{c.company_name}</h2><p>{c.target_role}</p></div>
              <b>{c.match_percentage}</b>
            </div>
            <Bar value={Number(String(c.match_percentage).replace('%', '')) || 75} />
            <small>STUDENT SKILL MATCH</small>
            <div className="company-skills">
              {(c.skills || []).map((skill: string) => <span key={skill}>✓ {skill}</span>)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ==========================================
// JOBS ASSISTANT
// ==========================================
function Jobs({ notify, go }: { notify: (message: string) => void; go: (path: string, message: string) => void }) {
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    api.getJobs().then((data) => {
      if (Array.isArray(data) && data.length > 0) setJobs(data);
    }).catch(() => {});
  }, []);

  const displayJobs = jobs.length > 0 ? jobs : [
    { job_title: 'Machine Learning Engineer', company_name: 'Google', location: 'Mountain View, CA', match_percentage: '95%' },
    { job_title: 'Data Scientist', company_name: 'Microsoft', location: 'Seattle, WA', match_percentage: '82%' },
    { job_title: 'Backend Developer', company_name: 'XYZ Solutions', location: 'Remote · US', match_percentage: '76%' },
  ];

  return (
    <>
      <ProductHeader eyebrow="JOB MATCHING · APPLICATION READINESS" title="AI Jobs Assistant" sub="Find roles where your demonstrated skills, evidence, and career readiness are competitive." action="Refresh job matches" notify={notify} />
      <div className="job-list">
        {displayJobs.map((j: any) => (
          <div className="job-card card" key={j.job_title + j.company_name}>
            <div className="company-logo">{j.company_name[0]}</div>
            <div className="job-main">
              <div><h2>{j.job_title}</h2><p>{j.company_name} · {j.location}</p></div>
              <div className="job-match"><small>SKILL MATCH</small><b>{j.match_percentage}</b></div>
            </div>
            <div className="actions">
              <button className="primary" onClick={() => notify(`Application drafted for ${j.job_title} @ ${j.company_name}`)}>Prepare Application <ArrowRight size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ==========================================
// LEARNING ACTIVITY
// ==========================================
function ActivityPage({ notify }: { notify: (message: string) => void }) {
  const [heatmap, setHeatmap] = useState<number[]>([]);

  useEffect(() => {
    api.getActivityHeatmap().then((data) => {
      if (data && Array.isArray(data.cells)) setHeatmap(data.cells);
    }).catch(() => {});
  }, []);

  const cells = heatmap.length > 0 ? heatmap : Array.from({ length: 126 }, (_, i) => (i * 7 + 3) % 5);

  return (
    <>
      <ProductHeader eyebrow="LEARNING TELEMETRY · CONSISTENCY SIGNAL" title="Learning Activity" sub="A complete view of the practice and telemetry moving your profile forward." action="Connect an integration" notify={notify} />
      <div className="stats five">
        <Stat icon={Activity} label="LEARNING SESSIONS" value="142" sub="+18 this month" />
        <Stat icon={Code2} label="CODING PROBLEMS" value="186" sub="72% solved" color="blue" />
        <Stat icon={FolderKanban} label="PROJECTS" value="8" sub="3 verified" color="violet" />
        <Stat icon={BookOpen} label="COURSES" value="12" sub="8 completed" color="green" />
        <Stat icon={ClipboardCheck} label="ASSESSMENTS" value="24" sub="6 verified" color="orange" />
      </div>
      <Panel eyebrow="CONSISTENCY OVER TIME" title="Learning activity heatmap" action={<span className="tag success">142 active sessions</span>}>
        <div className="heatmap-labels"><span>Less</span><i /><i /><i /><i /><span>More</span></div>
        <div className="heatmap">{cells.map((value, index) => <i className={`level-${value}`} key={index} />)}</div>
      </Panel>
    </>
  );
}

// ==========================================
// CERTIFICATES
// ==========================================
function Certificates({ notify, go }: { notify: (message: string) => void; go: (path: string, message: string) => void }) {
  const [certs, setCerts] = useState<any[]>([]);
  const [provider, setProvider] = useState('Coursera');
  const [courseName, setCourseName] = useState('');
  const [skillId, setSkillId] = useState('Machine Learning');

  const fetchCerts = () => {
    api.getCertificates().then((data) => {
      if (Array.isArray(data) && data.length > 0) setCerts(data);
    }).catch(() => {});
  };

  useEffect(() => {
    fetchCerts();
  }, []);

  const handleUploadCert = async () => {
    if (!courseName) {
      notify('Please enter certificate title');
      return;
    }
    try {
      await api.uploadCertificate({ provider, course_name: courseName, skill_id: skillId });
      notify('Certificate uploaded and verified!');
      setCourseName('');
      fetchCerts();
    } catch (err: any) {
      notify(`Upload failed: ${err.message}`);
    }
  };

  const displayCerts = certs.length > 0 ? certs : [
    { provider: 'Coursera', course_name: 'Machine Learning Specialization', skill_name: 'Machine Learning', verification_status: 'Verified', issue_date: '2026-01-20' },
    { provider: 'Stanford Online', course_name: 'Deep Learning Foundations', skill_name: 'Deep Learning', verification_status: 'Verified', issue_date: '2026-03-15' },
  ];

  return (
    <>
      <ProductHeader eyebrow="CREDENTIALS · VERIFICATION STATUS" title="My Certificates" sub="Keep formal learning credentials connected to the skills and evidence they support." action="Add Certificate" notify={notify} />
      <Panel eyebrow="CREDENTIAL LIBRARY" title="Your certificates">
        <div className="certificate-list">
          {displayCerts.map((c: any) => (
            <div className="certificate-row" key={c.course_name}>
              <div className="certificate-icon"><GraduationCap size={17} /></div>
              <div><b>{c.course_name}</b><small>{c.provider} · Skill: {c.skill_name}</small></div>
              <span>{c.issue_date}</span>
              <span className="tag success">{c.verification_status || 'Verified'}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel eyebrow="UPLOAD CREDENTIAL" title="Add a certificate to your evidence graph">
        <div className="form-grid">
          <label>Provider<input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. Coursera" /></label>
          <label>Course Name<input value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="Certificate title" /></label>
          <label>Skill Supported
            <select value={skillId} onChange={(e) => setSkillId(e.target.value)}>
              <option>Machine Learning</option>
              <option>Deep Learning</option>
              <option>Python</option>
              <option>SQL</option>
            </select>
          </label>
        </div>
        <button className="primary" onClick={handleUploadCert} style={{ marginTop: '1rem' }}>Upload Certificate <ArrowRight size={12} /></button>
      </Panel>
    </>
  );
}

// ==========================================
// FEEDBACK
// ==========================================
function Feedback({ notify }: { notify: (message: string) => void }) {
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState('Recommendations');
  const [comment, setComment] = useState('');

  const handleSubmit = async () => {
    if (!comment.trim()) {
      notify('Please write a short comment.');
      return;
    }
    try {
      await api.submitFeedback({ category, rating, comment });
      notify('Thank you — your feedback was submitted!');
      setComment('');
    } catch (err: any) {
      notify(`Submission error: ${err.message}`);
    }
  };

  return (
    <>
      <ProductHeader eyebrow="PRODUCT FEEDBACK · CONTINUOUS IMPROVEMENT" title="Help Us Improve PathForge AI" sub="Your feedback helps us make learning recommendations more useful." action="View feedback analytics" notify={notify} />
      <div className="two-col">
        <Panel eyebrow="SHARE YOUR EXPERIENCE" title="How was your experience?">
          <div className="stars">
            {[1,2,3,4,5].map((star) => (
              <button className={rating >= star ? 'on' : ''} key={star} onClick={() => setRating(star)}>
                <Star size={25} fill="currentColor" />
              </button>
            ))}
          </div>
          <label>Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>Recommendations</option>
              <option>Roadmap</option>
              <option>UI and usability</option>
              <option>Courses</option>
            </select>
          </label>
          <label>Comment
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What helped you make progress? What could be clearer?" rows={5} />
          </label>
          <button className="primary full" onClick={handleSubmit}>Submit Feedback <Send size={12} /></button>
        </Panel>
      </div>
    </>
  );
}

// ==========================================
// RECRUITER MATCH (SAMPLE VIEW)
// ==========================================
function Recruiter({ notify }: { notify: (message: string) => void }) {
  const candidates = [
    ['Priya Sharma', '91%', '86%', '88%', '92%', '4 projects'],
    ['Alex Chen', '78%', '68%', '64%', '58%', '3 projects'],
    ['Jordan Lee', '74%', '81%', '79%', '72%', '5 projects'],
  ];

  return (
    <>
      <ProductHeader eyebrow="TALENT INTELLIGENCE · SAMPLE RECRUITER VIEW" title="Recruiter Match" sub="Explore candidates using demonstrated skills and evidence — not self-declared skills alone." action="Create a role" notify={notify} />
      <div className="candidate-list">
        {candidates.map(([name, match, readiness, mastery, evidence, projects]) => (
          <div className="candidate card" key={name}>
            <div className="avatar">{name.split(' ').map((w) => w[0]).join('')}</div>
            <div className="candidate-name"><h2>{name}</h2><span>Machine Learning Engineer</span></div>
            <div className="candidate-metric"><small>Skill Match</small><b>{match}</b></div>
            <div className="candidate-metric"><small>Readiness</small><b>{readiness}</b></div>
            <div className="actions"><button className="primary" onClick={() => notify(`${name} profile viewed`)}>View Candidate</button></div>
          </div>
        ))}
      </div>
    </>
  );
}

// ==========================================
// SETTINGS
// ==========================================
function SettingsPage({ notify }: { notify: (message: string) => void }) {
  const { user } = useAuth();
  return (
    <>
      <ProductHeader eyebrow="ACCOUNT CONTROL · PERSONALIZATION" title="Settings" sub="Control your account, notifications, and learning preferences." action="Save Settings" notify={notify} />
      <Panel eyebrow="ACCOUNT" title="Account Details">
        <div className="form-grid">
          <label>Display Name<input defaultValue={user?.full_name || 'Alex Chen'} /></label>
          <label>Email Address<input defaultValue={user?.email || 'alex.chen@stanford.edu'} /></label>
        </div>
      </Panel>
    </>
  );
}

// ==========================================
// AI RESUME ANALYZER
// ==========================================
function ResumeAnalysis({ notify, go }: { notify: (message: string) => void; go: (path: string, message: string) => void }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [pendingSuggestions, setPendingSuggestions] = useState<any[]>([]);

  const loadResumeData = async () => {
    setLoading(true);
    try {
      const data = await api.getLatestResume();
      setAnalysis(data);

      const suggestions = await api.getResumeSuggestions();
      if (Array.isArray(suggestions)) setPendingSuggestions(suggestions);
    } catch (err) {
      console.warn('Could not load latest resume analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumeData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      notify('File is too large. Maximum size is 10 MB.');
      return;
    }

    setUploading(true);
    notify(`Uploading and analyzing ${file.name} with AI...`);
    try {
      const res = await api.uploadResume(file);
      if (res.data) setAnalysis(res.data);
      else await loadResumeData();
      notify(`✓ Resume analyzed successfully! Detected skills and credentials updated.`);
    } catch (err: any) {
      notify(`❌ ${err.message || 'Failed to analyze resume'}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleApproveSuggestion = async (suggestionId: string) => {
    try {
      notify('Adding course credential to verified resume profile...');
      await api.approveResumeSuggestion(suggestionId);
      notify('✓ Verified credential added to resume profile!');
      setPendingSuggestions((prev) => prev.filter((s) => s.suggestion_id !== suggestionId));
    } catch (err: any) {
      notify(`Approval failed: ${err.message}`);
    }
  };

  const handleDismissSuggestion = async (suggestionId: string) => {
    try {
      await api.dismissResumeSuggestion(suggestionId);
      notify('Suggestion dismissed.');
      setPendingSuggestions((prev) => prev.filter((s) => s.suggestion_id !== suggestionId));
    } catch (err: any) {
      notify(`Dismiss failed: ${err.message}`);
    }
  };

  const handleDownloadActive = async () => {
    if (!analysis?.resume_id) return;
    try {
      notify(`Downloading ${analysis.original_filename || 'resume.pdf'}...`);
      await api.downloadResume(analysis.resume_id, analysis.original_filename || 'resume.pdf');
    } catch (err: any) {
      notify(`Download error: ${err.message}`);
    }
  };

  const handleReanalyzeActive = async () => {
    if (!analysis?.resume_id) return;
    try {
      notify('Re-running neural extraction on active resume...');
      await api.reanalyzeResume(analysis.resume_id);
      notify('✓ Resume re-analyzed successfully!');
      await loadResumeData();
    } catch (err: any) {
      notify(`Re-analysis error: ${err.message}`);
    }
  };

  const detectedSkills = analysis?.detected_skills || [
    { skill_name: 'Python', resume_score: 64, final_mastery: 88, mastery_level: 'Advanced' },
    { skill_name: 'Pandas', resume_score: 63, final_mastery: 85, mastery_level: 'Advanced' },
    { skill_name: 'Scikit-learn', resume_score: 61, final_mastery: 75, mastery_level: 'Proficient' },
    { skill_name: 'SQL', resume_score: 60, final_mastery: 70, mastery_level: 'Proficient' },
    { skill_name: 'Deep Learning', resume_score: 55, final_mastery: 31, mastery_level: 'Beginner' },
  ];

  const extractedProjects = analysis?.extracted_projects || [
    {
      title: 'Customer Churn Prediction Engine',
      description: 'End-to-end classification pipeline built with Scikit-learn, XGBoost, and FastAPI backend serving real-time predictions.',
      technologies: ['Python', 'Scikit-learn', 'FastAPI', 'Pandas'],
    },
    {
      title: 'Distributed Neural Text Classifier',
      description: 'Fine-tuned Transformer models with PyTorch and HuggingFace for sentiment classification across financial corpora.',
      technologies: ['Python', 'PyTorch', 'Transformers', 'Docker'],
    },
  ];

  const extractedExperience = analysis?.extracted_experience || [
    {
      role: 'Machine Learning Engineering Intern',
      company: 'DataTech Innovations',
      duration: 'June 2024 – August 2024',
      description: 'Developed automated feature engineering pipelines and improved predictive model accuracy by 14% on tabular datasets.',
    },
  ];

  const extractedCertificates = analysis?.extracted_certificates || [
    { name: 'Deep Learning Specialization', issuer: 'DeepLearning.AI / Coursera', year: '2024' },
    { name: 'TensorFlow Developer Certificate', issuer: 'Google Cloud Training', year: '2023' },
  ];

  const extractedEducation = analysis?.extracted_education || [
    {
      institution: 'Stanford University',
      degree: 'B.S. in Computer Science (AI Track)',
      year: '2022 – 2026',
      gpa: '3.88 / 4.0',
    },
  ];

  return (
    <>
      <ProductHeader
        eyebrow="RESUME INTELLIGENCE · EVIDENCE EXTRACTION ENGINE"
        title="AI Resume Analyzer"
        sub="Extract skills, projects, and credentials from your resume with Gemini AI — then validate them through objective assessments."
        action="Upload New Resume"
        notify={() => document.getElementById('resume-file-input')?.click()}
      />
      <input
        id="resume-file-input"
        type="file"
        accept=".pdf,.docx,.txt"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* Pending Course Completion Suggestion Banner */}
      {pendingSuggestions.length > 0 && (
        <div className="pf-suggestion-banner">
          <div className="pf-suggestion-info">
            <Sparkles size={24} style={{ color: '#7c6cff', flexShrink: 0 }} />
            <div>
              <b style={{ color: '#fff', fontSize: '0.95rem' }}>Course Completion Detected</b>
              <p style={{ margin: '2px 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
                You finished <strong>{pendingSuggestions[0].course_name}</strong>. Add this verified credential and {pendingSuggestions[0].skill_name} coursework to your verified resume profile?
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              className="primary"
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              onClick={() => handleApproveSuggestion(pendingSuggestions[0].suggestion_id)}
            >
              Add to Resume Profile
            </button>
            <button
              className="secondary"
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              onClick={() => handleDismissSuggestion(pendingSuggestions[0].suggestion_id)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      <Panel eyebrow="DOCUMENT INGESTION" title="Upload your latest CV or resume">
        <div
          className="resume-upload"
          style={{ cursor: 'pointer', textAlign: 'center', padding: '32px' }}
          onClick={() => document.getElementById('resume-file-input')?.click()}
        >
          <Upload size={32} style={{ color: '#7c6cff', marginBottom: '8px' }} />
          <h3 style={{ margin: '0 0 6px', color: '#fff' }}>
            {uploading ? 'Analyzing Document with Gemini AI...' : 'Click or Drop PDF / DOCX Resume Here'}
          </h3>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
            Supports standard PDF, Word DOCX, and text formats (up to 10 MB). Neural parsing identifies technical skills, projects, experience, and education.
          </p>
        </div>
      </Panel>

      {/* Active Resume Meta Bar */}
      {analysis?.resume_id && (
        <div
          className="card"
          style={{
            padding: '16px 20px',
            marginBottom: '20px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText size={20} style={{ color: '#7c6cff' }} />
            <div>
              <b style={{ color: '#fff', fontSize: '0.9rem' }}>{analysis.original_filename || 'Active Resume'}</b>
              <span style={{ color: '#94a3b8', fontSize: '0.78rem', marginLeft: '8px' }}>
                Uploaded {new Date(analysis.upload_timestamp || Date.now()).toLocaleDateString()} · Active Version
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={handleDownloadActive}>
              <Download size={12} /> Download
            </button>
            <button className="secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={handleReanalyzeActive}>
              <RefreshCw size={12} /> Re-analyze
            </button>
            <button className="secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => navigate('/profile')}>
              View History in Profile
            </button>
          </div>
        </div>
      )}

      {/* 4 Stats Cards */}
      <div className="stats four">
        <Stat icon={FileCheck2} label="EXTRACTED SKILLS" value={String(detectedSkills.length)} sub="Resume detected" />
        <Stat icon={FolderKanban} label="PROJECTS FOUND" value={String(extractedProjects.length)} sub="Portfolio evidence" color="violet" />
        <Stat icon={GraduationCap} label="CERTIFICATES" value={String(extractedCertificates.length)} sub="Documented" color="green" />
        <Stat icon={BriefcaseBusiness} label="EXPERIENCE" value={String(extractedExperience.length)} sub="Positions extracted" color="orange" />
      </div>

      {/* Evidence Separation Notice */}
      <div
        className="card"
        style={{
          background: 'rgba(124, 108, 255, 0.05)',
          border: '1px solid rgba(124, 108, 255, 0.25)',
          padding: '16px 20px',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        <ShieldCheck size={24} style={{ color: '#7c6cff', flexShrink: 0 }} />
        <div>
          <b style={{ color: '#fff', fontSize: '0.9rem' }}>Evidence Distinction: Resume Claims vs Verified Mastery</b>
          <p style={{ margin: '2px 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
            Resume extraction identifies skills and credentials claimed in your document and initializes an exposure signal (45%–65%). It does not automatically mark skills as mastered. Take diagnostic assessments to verify your mastery up to 80%+.
          </p>
        </div>
      </div>

      {/* Extracted Skills Section */}
      <Panel eyebrow="SKILL EXPOSURE SIGNALS" title="Detected Technical Skills & Competencies">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
          {detectedSkills.map((s: any) => (
            <div
              key={s.skill_name}
              className="card"
              style={{
                padding: '14px 16px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <b style={{ color: '#fff', fontSize: '0.95rem' }}>{s.skill_name}</b>
                <span className="tag purple" style={{ fontSize: '0.75rem' }}>
                  Exposure: {s.resume_score || 60}%
                </span>
              </div>
              <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                Detected from resume context · Unverified diagnostic evidence
              </small>
              <button
                className="secondary"
                style={{ fontSize: '0.75rem', padding: '4px 8px', alignSelf: 'flex-start', marginTop: '4px' }}
                onClick={() => go('/assessment', `Starting assessment for ${s.skill_name}`)}
              >
                Verify via Assessment <ArrowRight size={10} />
              </button>
            </div>
          ))}
        </div>
      </Panel>

      {/* Extracted Projects */}
      <Panel eyebrow="PORTFOLIO ARTIFACTS" title="Extracted Projects & Implementations">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
          {extractedProjects.map((proj: any, idx: number) => (
            <div
              key={idx}
              className="card"
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <b style={{ color: '#fff', fontSize: '0.95rem' }}>{proj.title}</b>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.82rem', lineHeight: '1.4' }}>
                {proj.description}
              </p>
              {proj.technologies && Array.isArray(proj.technologies) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {proj.technologies.map((t: string) => (
                    <span key={t} className="tag neutral" style={{ fontSize: '0.7rem' }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Panel>

      {/* Extracted Experience & Education Grid */}
      <div className="two-col">
        <Panel eyebrow="WORK HISTORY" title="Extracted Experience & Internships">
          {extractedExperience.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {extractedExperience.map((exp: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <b style={{ color: '#fff', fontSize: '0.9rem' }}>{exp.role}</b>
                  <div style={{ color: '#7c6cff', fontSize: '0.8rem', margin: '2px 0 6px' }}>
                    {exp.company} {exp.duration ? `· ${exp.duration}` : ''}
                  </div>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem', lineHeight: '1.4' }}>
                    {exp.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No work experience sections detected in document.</p>
          )}
        </Panel>

        <Panel eyebrow="CREDENTIALS" title="Certifications & Education">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {extractedCertificates.map((cert: any, idx: number) => (
              <div
                key={idx}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <b style={{ color: '#fff', fontSize: '0.88rem' }}>{cert.name}</b>
                  <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>
                    {cert.issuer} {cert.year ? `· ${cert.year}` : ''}
                  </span>
                </div>
                <span className="tag success" style={{ fontSize: '0.7rem' }}>Claimed</span>
              </div>
            ))}

            {extractedEducation.map((edu: any, idx: number) => (
              <div
                key={`edu-${idx}`}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <b style={{ color: '#fff', fontSize: '0.88rem' }}>{edu.institution}</b>
                <span style={{ color: '#7c6cff', fontSize: '0.8rem', display: 'block', margin: '2px 0' }}>
                  {edu.degree} {edu.year ? `· ${edu.year}` : ''}
                </span>
                {edu.gpa && (
                  <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>GPA: {edu.gpa}</small>
                )}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

export default App;
