import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from './services/api';
import { useAuth } from './App';
import {
  Sparkles,
  GraduationCap,
  UserCheck,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Briefcase,
  Building,
  Calendar,
  Layers,
  Link as LinkIcon,
  FileText,
  ArrowRight,
  CheckCircle2,
  Check,
  AlertCircle,
  KeyRound,
  RotateCcw,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';

interface RoleAuthViewProps {
  notify: (msg: string) => void;
  defaultMode?: 'login' | 'register' | 'forgot_password';
  defaultRole?: 'student' | 'mentor' | 'admin';
}

const EXPERTISE_OPTIONS = [
  'Full-Stack Development',
  'Backend Development',
  'Frontend Development',
  'Data Science',
  'Machine Learning',
  'Generative AI',
  'Cloud Computing',
  'Database Management',
  'Cybersecurity',
  'DevOps & MLOps',
  'Mobile Development',
  'Software Architecture',
];

const EXPERIENCE_RANGES = [
  { label: '1 - 3 years', value: 2 },
  { label: '3 - 5 years', value: 4 },
  { label: '5 - 8 years', value: 6 },
  { label: '8 - 12 years', value: 10 },
  { label: '12+ years', value: 15 },
];

export function RoleAuthView({ notify, defaultMode = 'login', defaultRole = 'student' }: RoleAuthViewProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, refreshUser, setAuthSession } = useAuth();

  // Primary mode: 'login' | 'register' | 'verify_email' | 'forgot_password'
  const [mode, setMode] = useState<'login' | 'register' | 'verify_email' | 'forgot_password'>(defaultMode);
  const [selectedRole, setSelectedRole] = useState<'student' | 'mentor' | 'admin'>((defaultRole as any) || 'student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync mode and selected role with URL path
  useEffect(() => {
    const path = location.pathname;
    if (path === '/login') {
      setMode('login');
      setError(null);
    } else if (path === '/login/admin') {
      setMode('login');
      setSelectedRole('admin');
      setError(null);
    } else if (path === '/forgot-password') {
      setMode('forgot_password');
      setError(null);
    } else if (path === '/register/mentor') {
      setMode('register');
      setSelectedRole('mentor');
      setError(null);
    } else if (path === '/register' || path === '/register/student') {
      setMode('register');
      setSelectedRole('student');
      setError(null);
    }
  }, [location.pathname]);

  // Sign In States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Student Register States
  const [stFirstName, setStFirstName] = useState('');
  const [stLastName, setStLastName] = useState('');
  const [stEmail, setStEmail] = useState('');
  const [stPassword, setStPassword] = useState('');
  const [stConfirmPassword, setStConfirmPassword] = useState('');
  const [showStPassword, setShowStPassword] = useState(false);
  const [showStConfirmPassword, setShowStConfirmPassword] = useState(false);
  const [stCollege, setStCollege] = useState('Stanford University');
  const [stDegree, setStDegree] = useState('B.Tech AI & Data Science');
  const [stTargetCareer, setStTargetCareer] = useState('C001');
  const [stTermsAgreed, setStTermsAgreed] = useState(true);

  // Mentor Register States
  const [mentorName, setMentorName] = useState('');
  const [mentorEmail, setMentorEmail] = useState('');
  const [mentorPassword, setMentorPassword] = useState('');
  const [mentorConfirmPassword, setMentorConfirmPassword] = useState('');
  const [showMentorPassword, setShowMentorPassword] = useState(false);
  const [showMentorConfirmPassword, setShowMentorConfirmPassword] = useState(false);
  const [mentorTitle, setMentorTitle] = useState('');
  const [mentorCompany, setMentorCompany] = useState('');
  const [mentorExperience, setMentorExperience] = useState<number>(6);
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([
    'Machine Learning',
    'Generative AI',
  ]);
  const [mentorLinkedIn, setMentorLinkedIn] = useState('');
  const [mentorBio, setMentorBio] = useState('');
  const [mentorTermsAgreed, setMentorTermsAgreed] = useState(true);

  // OTP Verification States
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [verificationEmail, setVerificationEmail] = useState<string>('');
  const [verificationPurpose, setVerificationPurpose] = useState<'registration' | 'recovery'>('registration');
  const [otpInput, setOtpInput] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // Forgot Password States
  const [recoveryStep, setRecoveryStep] = useState<1 | 2 | 3>(1);
  const [recoveryEmail, setRecoveryEmail] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Resend countdown timer effect
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const toggleExpertise = (area: string) => {
    setSelectedExpertise((prev) =>
      prev.includes(area) ? prev.filter((item) => item !== area) : [...prev, area]
    );
  };

  // -------------------------------------------------------------------------
  // 1. Handle Sign In
  // -------------------------------------------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      if (selectedRole === 'admin') {
        const authData = await api.adminLogin({
          email: loginEmail.trim(),
          password: loginPassword,
        });
        if (authData?.access_token) {
          setAuthSession(authData.access_token, {
            user_id: authData.user_id || 'ADMIN001',
            name: authData.name || 'Administrator',
            email: authData.email || loginEmail.trim(),
            role: 'admin',
          });
          notify('Signed in as Administrator!');
          navigate('/admin/dashboard');
          return;
        }
      }

      const authData = await login({ email: loginEmail.trim(), password: loginPassword });
      notify('Signed in successfully!');
      if (authData?.role === 'admin' || selectedRole === 'admin') {
        navigate('/admin/dashboard');
      } else if (authData?.role === 'mentor' || selectedRole === 'mentor') {
        navigate('/mentor/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Login
  const handleQuickLogin = async (role: 'student' | 'mentor' | 'admin') => {
    setError(null);
    setLoading(true);
    try {
      if (role === 'admin') {
        const authData = await api.adminLogin({ email: 'organizer@gmail.com', password: 'admin@123' });
        if (authData?.access_token) {
          setAuthSession(authData.access_token, {
            user_id: authData.user_id || 'ADMIN001',
            name: authData.name || 'Administrator',
            email: 'organizer@gmail.com',
            role: 'admin',
          });
          notify('Logged in as Administrator');
          navigate('/admin/dashboard');
        }
      } else if (role === 'mentor') {
        const authData = await login({ email: 'arun.kumar@pathforge.ai', password: 'password123' });
        notify('Logged in as Mentor Arun Kumar');
        navigate('/mentor/dashboard');
      } else {
        const authData = await login({ email: 'alex.chen@stanford.edu', password: 'password123' });
        notify('Logged in as Student Alex Chen');
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // 2. Handle Student Registration (Initiates Email OTP)
  // -------------------------------------------------------------------------
  const handleStudentRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (stPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (stPassword !== stConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!stTermsAgreed) {
      setError('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.registerStudent({
        first_name: stFirstName.trim(),
        last_name: stLastName.trim(),
        email: stEmail.trim(),
        password: stPassword,
        confirm_password: stConfirmPassword,
        college: stCollege.trim(),
        degree: stDegree.trim(),
        target_career_id: stTargetCareer,
        terms_agreed: stTermsAgreed,
      });

      notify('Account created successfully! Welcome to PathForge AI.');
      if (res.access_token) {
        setAuthSession(res.access_token, {
          user_id: res.user_id || res.student_id || '',
          student_id: res.student_id,
          name: res.name || `${stFirstName.trim()} ${stLastName.trim()}`,
          email: res.email || stEmail.trim(),
          role: 'student',
        });
        navigate('/dashboard');
      } else {
        setSuccessMsg('Account created successfully! Please sign in with your credentials.');
        navigate('/login');
      }
    } catch (err: any) {
      setError(err.message || 'Registration request failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // 3. Handle Mentor Registration (Initiates Email OTP)
  // -------------------------------------------------------------------------
  const handleMentorRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!mentorName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!mentorEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mentorEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (mentorPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (mentorPassword !== mentorConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!mentorTitle.trim()) {
      setError('Professional title is required.');
      return;
    }
    if (selectedExpertise.length === 0) {
      setError('Please select at least one area of expertise.');
      return;
    }
    if (!mentorTermsAgreed) {
      setError('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.registerMentor({
        name: mentorName.trim(),
        email: mentorEmail.trim(),
        password: mentorPassword,
        confirm_password: mentorConfirmPassword,
        title: mentorTitle.trim(),
        experience_years: mentorExperience,
        expertise_areas: selectedExpertise,
        company: mentorCompany.trim() || undefined,
        linkedin_url: mentorLinkedIn.trim() || undefined,
        bio: mentorBio.trim() || undefined,
        terms_agreed: mentorTermsAgreed,
      });

      notify('Mentor account created successfully! Welcome to PathForge AI.');
      if (res.access_token) {
        setAuthSession(res.access_token, {
          user_id: res.user_id || res.mentor_id || '',
          mentor_id: res.mentor_id,
          name: res.name || mentorName.trim(),
          email: res.email || mentorEmail.trim(),
          role: 'mentor',
        });
        navigate('/mentor/dashboard');
      } else {
        setSuccessMsg('Mentor account created successfully! Please sign in with your credentials.');
        navigate('/login');
      }
    } catch (err: any) {
      setError(err.message || 'Registration request failed. Email may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // 4. Handle Email OTP Verification
  // -------------------------------------------------------------------------
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeId && !verificationEmail) {
      setError('Invalid verification session. Please restart registration.');
      return;
    }
    if (!otpInput.trim() || otpInput.trim().length < 4) {
      setError('Please enter the verification code sent to your email.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const authData = await api.verifyEmail({
        challenge_id: challengeId || '',
        email: verificationEmail || undefined,
        otp: otpInput.trim(),
      });

      notify('Email verified successfully! Welcome to PathForge AI.');
      setAuthSession(authData.access_token, {
        user_id: authData.user_id || authData.student_id || '',
        student_id: authData.student_id,
        mentor_id: (authData as any).mentor_id,
        name: authData.name,
        email: authData.email,
        role: authData.role,
      });

      if (authData.role === 'mentor') {
        navigate('/mentor/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect verification code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !challengeId) return;
    setError(null);
    try {
      const res = await api.resendVerification({ challenge_id: challengeId });
      setResendCooldown(60);
      notify(res.message || 'A fresh verification code has been sent.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code.');
    }
  };

  // -------------------------------------------------------------------------
  // 5. Handle Forgot Password Flow
  // -------------------------------------------------------------------------
  const handleForgotPasswordSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await api.forgotPassword({ email: recoveryEmail.trim() });
      if (res.challenge_id) {
        setChallengeId(res.challenge_id);
      }
      setResendCooldown(60);
      setRecoveryStep(2);
      notify(res.message || 'Verification code sent.');
    } catch (err: any) {
      setError(err.message || 'Password reset request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRecoveryOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeId || !otpInput.trim()) {
      setError('Please enter the recovery verification code.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await api.verifyResetOtp({
        challenge_id: challengeId,
        otp: otpInput.trim(),
      });
      setResetToken(res.reset_token);
      setRecoveryStep(3);
      notify('Code verified. You can now set your new password.');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired recovery code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await api.resetPassword({
        challenge_id: challengeId!,
        reset_token: resetToken,
        new_password: newPassword,
        confirm_password: confirmNewPassword,
      });

      notify(res.message || 'Password reset successfully!');
      setSuccessMsg('Your password has been reset successfully. Please sign in with your new password.');
      setLoginEmail(recoveryEmail);
      setLoginPassword('');
      setMode('login');
      setRecoveryStep(1);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="role-auth-wrapper">
      {/* Top Header Navigation */}
      <header className="role-auth-header">
        <div className="role-auth-brand" onClick={() => navigate('/')}>
          <div className="brand-icon-box">
            <Sparkles size={22} className="brand-sparkle" />
          </div>
          <div className="brand-text">
            <span className="brand-name">
              PathForge <b>AI</b>
            </span>
            <span className="brand-tagline">
              Personalized Learning Roadmaps & Evidence-Based Career Intelligence
            </span>
          </div>
        </div>

        <div className="role-auth-top-action">
          {mode === 'login' ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  navigate(selectedRole === 'mentor' ? '/register/mentor' : '/register/student');
                }}
              >
                Register
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  navigate('/login');
                }}
              >
                Sign In
              </button>
            </span>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="role-auth-container">
        {/* ================================================================
            PRIMARY TOP TABS: SIGN IN vs REGISTER (Required by Phase 2)
            ================================================================ */}
        {mode !== 'verify_email' && (
          <div className="pf-auth-tabs-wrapper">
            <div className="pf-auth-tabs">
              <button
                type="button"
                className={`pf-auth-tab ${mode === 'login' || mode === 'forgot_password' ? 'active' : ''}`}
                onClick={() => {
                  navigate('/login');
                }}
              >
                <Lock size={16} />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                className={`pf-auth-tab ${mode === 'register' ? 'active' : ''}`}
                onClick={() => {
                  navigate(selectedRole === 'mentor' ? '/register/mentor' : '/register/student');
                }}
              >
                <User size={16} />
                <span>Register</span>
              </button>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="auth-alert error" style={{ maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
            <AlertCircle size={18} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span>{error}</span>

            </div>
          </div>
        )}

        {/* Global Success Banner */}
        {successMsg && (
          <div className="auth-alert success" style={{ maxWidth: '480px', margin: '0 auto 1.5rem auto', background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', padding: '12px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ================================================================
            VIEW 1: SIGN IN
            ================================================================ */}
        {mode === 'login' && (
          <div className="login-card-container">
            <div className="login-card">
              <div className="login-header">
                <h2>Welcome Back</h2>
                <p>
                  {selectedRole === 'admin'
                    ? 'Administrator Access — Platform Governance & Management'
                    : selectedRole === 'mentor'
                    ? 'Mentor Workspace — Mentorship & Student Guidance'
                    : 'Sign in to your PathForge AI workspace'}
                </p>
              </div>

              {/* Role-Aware Segmented Control for Sign-In (Phase 9) */}
              <div className="role-segmented-control" role="tablist" aria-label="Sign-in role selection">
                <button
                  type="button"
                  className={`role-segment-btn ${selectedRole === 'student' ? 'active' : ''}`}
                  onClick={() => { setSelectedRole('student'); setError(null); }}
                  role="tab"
                  aria-selected={selectedRole === 'student'}
                >
                  <GraduationCap size={15} />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  className={`role-segment-btn ${selectedRole === 'mentor' ? 'active' : ''}`}
                  onClick={() => { setSelectedRole('mentor'); setError(null); }}
                  role="tab"
                  aria-selected={selectedRole === 'mentor'}
                >
                  <UserCheck size={15} />
                  <span>Mentor</span>
                </button>
                <button
                  type="button"
                  className={`role-segment-btn ${selectedRole === 'admin' ? 'active' : ''}`}
                  onClick={() => { setSelectedRole('admin'); setError(null); }}
                  role="tab"
                  aria-selected={selectedRole === 'admin'}
                >
                  <ShieldCheck size={15} />
                  <span>Admin</span>
                </button>
              </div>

              <form onSubmit={handleLogin} className="auth-form">
                <div className="form-group">
                  <label>{selectedRole === 'admin' ? 'Admin Email Address' : 'Email Address'}</label>
                  <div className="input-with-icon">
                    <Mail size={18} className="field-icon" />
                    <input
                      type="email"
                      required
                      placeholder={
                        selectedRole === 'admin'
                          ? 'organizer@gmail.com'
                          : selectedRole === 'mentor'
                          ? 'arun.kumar@pathforge.ai'
                          : 'alex.chen@stanford.edu'
                      }
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ margin: 0 }}>Password</label>
                    <button
                      type="button"
                      className="pf-forgot-pass-btn"
                      onClick={() => {
                        setRecoveryEmail(loginEmail);
                        setRecoveryStep(1);
                        navigate('/forgot-password');
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="input-with-icon">
                    <Lock size={18} className="field-icon" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="eye-toggle"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      tabIndex={-1}
                    >
                      {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="primary-action-btn full purple-gradient" disabled={loading}>
                  {loading
                    ? 'Authenticating...'
                    : selectedRole === 'admin'
                    ? 'Sign In to Admin Portal'
                    : 'Sign In'} <ArrowRight size={16} />
                </button>

                {selectedRole === 'admin' && (
                  <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <button
                      type="button"
                      className="link-btn"
                      style={{ fontSize: '0.84rem', color: 'var(--color-primary, #5B4BFF)', textDecoration: 'underline' }}
                      onClick={() => navigate('/admin/dashboard')}
                    >
                      Open Dedicated Admin Portal View →
                    </button>
                  </div>
                )}
              </form>

              {/* Demo 1-Click Access for Evaluators */}
              <div className="demo-login-box">
                <div className="demo-divider">
                  <span>OR SIGN IN WITH DEMO ACCOUNT</span>
                </div>
                <div className="demo-buttons-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    className={`demo-btn student ${selectedRole === 'student' ? 'active' : ''}`}
                    onClick={() => { setSelectedRole('student'); handleQuickLogin('student'); }}
                    disabled={loading}
                    title="Sign in as Student Alex Chen"
                  >
                    <GraduationCap size={15} />
                    <span>Demo Student</span>
                  </button>
                  <button
                    type="button"
                    className={`demo-btn mentor ${selectedRole === 'mentor' ? 'active' : ''}`}
                    onClick={() => { setSelectedRole('mentor'); handleQuickLogin('mentor'); }}
                    disabled={loading}
                    title="Sign in as Mentor Arun Kumar"
                  >
                    <UserCheck size={15} />
                    <span>Demo Mentor</span>
                  </button>
                  <button
                    type="button"
                    className={`demo-btn admin ${selectedRole === 'admin' ? 'active' : ''}`}
                    onClick={() => { setSelectedRole('admin'); handleQuickLogin('admin'); }}
                    disabled={loading}
                    title="Sign in as Administrator"
                    style={{ background: 'var(--color-primary-soft, #F0EEFF)', border: '1px solid #C8D6EA', color: 'var(--color-primary, #5B4BFF)' }}
                  >
                    <ShieldCheck size={15} />
                    <span>Demo Admin</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            VIEW 2: REGISTRATION (STUDENT vs MENTOR SUB-OPTIONS)
            ================================================================ */}
        {mode === 'register' && (
          <div className="registration-flow">
            {/* Heading & Role Selection Cards */}
            <div className="registration-hero">
              <h1 className="hero-title">Join PathForge AI</h1>
              <p className="hero-subtitle">Create your account and choose your path</p>

              {/* Two Distinct Registration Options */}
              <div className="role-selection-grid">
                {/* Register as Student */}
                <div
                  className={`role-card ${selectedRole === 'student' ? 'active' : ''}`}
                  onClick={() => {
                    navigate('/register/student');
                  }}
                >
                  <div className="role-card-icon student">
                    <GraduationCap size={24} />
                  </div>
                  <div className="role-card-content">
                    <span className="role-title">Register as Student</span>
                    <span className="role-sub">Learn • Grow • Build Career</span>
                  </div>
                  {selectedRole === 'student' && (
                    <div className="role-badge-check">
                      <Check size={14} />
                    </div>
                  )}
                </div>

                {/* Register as Mentor */}
                <div
                  className={`role-card ${selectedRole === 'mentor' ? 'active' : ''}`}
                  onClick={() => {
                    navigate('/register/mentor');
                  }}
                >
                  <div className="role-card-icon mentor">
                    <User size={24} />
                  </div>
                  <div className="role-card-content">
                    <span className="role-title">Register as Mentor</span>
                    <span className="role-sub">Guide • Support • Make an Impact</span>
                  </div>
                  {selectedRole === 'mentor' && (
                    <div className="role-badge-check">
                      <Check size={14} />
                    </div>
                  )}
                </div>
              </div>

              {/* Security Notice for Administrative Roles (Phase 9) */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 18px',
                  maxWidth: '560px',
                  margin: '16px auto 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}
              >
                <ShieldCheck size={20} style={{ color: 'var(--color-primary, #5B4BFF)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.84rem', color: '#475569', textAlign: 'left', lineHeight: 1.5 }}>
                  <strong>Administrator Access:</strong> Admin accounts are protected and cannot be registered publicly. To access the admin workspace,{' '}
                  <button
                    type="button"
                    className="link-btn"
                    style={{ fontWeight: 600, color: 'var(--color-primary, #5B4BFF)', textDecoration: 'underline', display: 'inline', padding: 0 }}
                    onClick={() => {
                      setMode('login');
                      setSelectedRole('admin');
                    }}
                  >
                    sign in as Admin
                  </button>
                  .
                </span>
              </div>
            </div>

            {/* MENTOR REGISTRATION FORM */}
            {selectedRole === 'mentor' ? (
              <div className="mentor-registration-layout">
                {/* Left Column: Benefits & Illustration */}
                <div className="mentor-benefits-panel">
                  <div className="benefits-intro">
                    <h2>Be a Mentor. Make a Difference.</h2>
                    <p>
                      Empower ambitious students with your technical expertise, project feedback, and career guidance.
                    </p>
                  </div>

                  <ul className="benefits-checklist">
                    <li>
                      <span className="check-icon-circle"><Check size={14} /></span>
                      <span>1-on-1 Mentorship Sessions & Roadmaps</span>
                    </li>
                    <li>
                      <span className="check-icon-circle"><Check size={14} /></span>
                      <span>Review Capstone Code & Provide Feedback</span>
                    </li>
                    <li>
                      <span className="check-icon-circle"><Check size={14} /></span>
                      <span>Email OTP Secured Mentor Identity</span>
                    </li>
                  </ul>
                </div>

                {/* Right Column: Mentor Registration Card */}
                <div className="mentor-form-card">
                  <div className="form-card-badge-header">
                    <div className="header-badge-icon">
                      <User size={20} />
                    </div>
                    <div>
                      <h2>Mentor Registration</h2>
                      <p>Create your verified mentor profile.</p>
                    </div>
                  </div>

                  <form onSubmit={handleMentorRegisterSubmit} className="mentor-registration-form">
                    <div className="form-row-2">
                      <div className="form-group">
                        <label>Full Name <span className="req">*</span></label>
                        <div className="input-with-icon">
                          <User size={18} className="field-icon" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. Dr. Arun Kumar"
                            value={mentorName}
                            onChange={(e) => setMentorName(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Email Address <span className="req">*</span></label>
                        <div className="input-with-icon">
                          <Mail size={18} className="field-icon" />
                          <input
                            type="email"
                            required
                            placeholder="arun.kumar@domain.com"
                            value={mentorEmail}
                            onChange={(e) => setMentorEmail(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="form-group">
                        <label>Password <span className="req">*</span></label>
                        <div className="input-with-icon">
                          <Lock size={18} className="field-icon" />
                          <input
                            type={showMentorPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            value={mentorPassword}
                            onChange={(e) => setMentorPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            className="eye-toggle"
                            onClick={() => setShowMentorPassword(!showMentorPassword)}
                            tabIndex={-1}
                          >
                            {showMentorPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Confirm Password <span className="req">*</span></label>
                        <div className="input-with-icon">
                          <Lock size={18} className="field-icon" />
                          <input
                            type={showMentorConfirmPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            value={mentorConfirmPassword}
                            onChange={(e) => setMentorConfirmPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            className="eye-toggle"
                            onClick={() => setShowMentorConfirmPassword(!showMentorConfirmPassword)}
                            tabIndex={-1}
                          >
                            {showMentorConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="form-group">
                        <label>Professional Title <span className="req">*</span></label>
                        <div className="input-with-icon">
                          <Briefcase size={18} className="field-icon" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. Lead Machine Learning Architect"
                            value={mentorTitle}
                            onChange={(e) => setMentorTitle(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Company / Organization</label>
                        <div className="input-with-icon">
                          <Building size={18} className="field-icon" />
                          <input
                            type="text"
                            placeholder="e.g. Google Cloud / Independent"
                            value={mentorCompany}
                            onChange={(e) => setMentorCompany(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Years of Experience: <b>{mentorExperience} years</b></label>
                      <input
                        type="range"
                        min={1}
                        max={20}
                        value={mentorExperience}
                        onChange={(e) => setMentorExperience(parseInt(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--color-primary, #5B4BFF)' }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Areas of Expertise <span className="req">*</span></label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                        {EXPERTISE_OPTIONS.map((area) => {
                          const active = selectedExpertise.includes(area);
                          return (
                            <button
                              key={area}
                              type="button"
                              onClick={() => toggleExpertise(area)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '9999px',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                border: active ? '1px solid var(--color-primary, #5B4BFF)' : '1px solid #E2E8F0',
                                background: active ? 'var(--color-primary-soft, #F0EEFF)' : '#FFFFFF',
                                color: active ? 'var(--color-sidebar, #101B30)' : '#475569',
                                cursor: 'pointer',
                              }}
                            >
                              {area} {active && '✓'}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pf-checkbox-group">
                      <input
                        type="checkbox"
                        id="mentor-terms"
                        checked={mentorTermsAgreed}
                        onChange={(e) => setMentorTermsAgreed(e.target.checked)}
                      />
                      <label htmlFor="mentor-terms">
                        I agree to the Terms of Service and Privacy Policy for PathForge Mentors.
                      </label>
                    </div>

                    <button type="submit" className="primary-action-btn full purple-gradient" disabled={loading}>
                      {loading ? 'Sending Verification Code...' : 'Register as Mentor'} <ArrowRight size={16} />
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              /* STUDENT REGISTRATION FORM */
              <div className="student-registration-layout">
                <div className="student-form-card">
                  <div className="form-card-badge-header">
                    <div className="header-badge-icon student">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <h2>Student Registration</h2>
                      <p>Create your student account to discover your personalized learning roadmap.</p>
                    </div>
                  </div>

                  <form onSubmit={handleStudentRegisterSubmit} className="student-registration-form">
                    <div className="form-row-2">
                      <div className="form-group">
                        <label>First Name <span className="req">*</span></label>
                        <div className="input-with-icon">
                          <User size={18} className="field-icon" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. Maya"
                            value={stFirstName}
                            onChange={(e) => setStFirstName(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Last Name <span className="req">*</span></label>
                        <div className="input-with-icon">
                          <User size={18} className="field-icon" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. Patel"
                            value={stLastName}
                            onChange={(e) => setStLastName(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Email Address <span className="req">*</span></label>
                      <div className="input-with-icon">
                        <Mail size={18} className="field-icon" />
                        <input
                          type="email"
                          required
                          placeholder="maya.patel@tech.edu"
                          value={stEmail}
                          onChange={(e) => setStEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="form-group">
                        <label>Password <span className="req">*</span></label>
                        <div className="input-with-icon">
                          <Lock size={18} className="field-icon" />
                          <input
                            type={showStPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            value={stPassword}
                            onChange={(e) => setStPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            className="eye-toggle"
                            onClick={() => setShowStPassword(!showStPassword)}
                            tabIndex={-1}
                          >
                            {showStPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Confirm Password <span className="req">*</span></label>
                        <div className="input-with-icon">
                          <Lock size={18} className="field-icon" />
                          <input
                            type={showStConfirmPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            value={stConfirmPassword}
                            onChange={(e) => setStConfirmPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            className="eye-toggle"
                            onClick={() => setShowStConfirmPassword(!showStConfirmPassword)}
                            tabIndex={-1}
                          >
                            {showStConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="form-group">
                        <label>College / University</label>
                        <input
                          type="text"
                          value={stCollege}
                          onChange={(e) => setStCollege(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label>Degree / Major</label>
                        <input
                          type="text"
                          value={stDegree}
                          onChange={(e) => setStDegree(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Target Career Goal</label>
                      <select
                        value={stTargetCareer}
                        onChange={(e) => setStTargetCareer(e.target.value)}
                      >
                        <option value="C001">Machine Learning Engineer</option>
                        <option value="C002">AI Engineer</option>
                        <option value="C003">Data Scientist</option>
                        <option value="C004">Full Stack Developer</option>
                        <option value="C005">Backend Developer</option>
                        <option value="C006">Cloud Architect</option>
                      </select>
                    </div>

                    <div className="pf-checkbox-group">
                      <input
                        type="checkbox"
                        id="student-terms"
                        checked={stTermsAgreed}
                        onChange={(e) => setStTermsAgreed(e.target.checked)}
                      />
                      <label htmlFor="student-terms">
                        I agree to the Terms of Service and Privacy Policy for PathForge AI.
                      </label>
                    </div>

                    <button type="submit" className="primary-action-btn full purple-gradient" disabled={loading}>
                      {loading ? 'Sending Verification Code...' : 'Register as Student'} <ArrowRight size={16} />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================
            VIEW 3: EMAIL OTP VERIFICATION
            ================================================================ */}
        {mode === 'verify_email' && (
          <div className="pf-otp-card">
            <div className="pf-otp-icon-bubble">
              <Mail size={32} />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-primary, #15213B)', marginBottom: '8px' }}>
              Verify Your Email Address
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '24px' }}>
              We've sent a 6-digit verification code to <b>{verificationEmail}</b>. Enter the code below to complete your registration.
            </p>

            <form onSubmit={handleVerifyEmail}>
              <div style={{ marginBottom: '20px' }}>
                <input
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  autoFocus
                  placeholder="000000"
                  className="pf-otp-input"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <button
                type="submit"
                className="primary-action-btn full purple-gradient"
                disabled={loading || otpInput.length < 4}
                style={{ width: '100%', marginBottom: '16px' }}
              >
                {loading ? 'Verifying...' : 'Verify & Activate Account'} <ArrowRight size={16} />
              </button>
            </form>

            <div style={{ marginTop: '16px', fontSize: '0.9rem', color: '#64748B' }}>
              Didn't receive the email?{' '}
              {resendCooldown > 0 ? (
                <span className="pf-timer-badge">
                  <RotateCcw size={14} /> Resend in {resendCooldown}s
                </span>
              ) : (
                <button type="button" className="pf-resend-active-btn" onClick={handleResendOtp}>
                  Resend Code
                </button>
              )}
            </div>

            <div style={{ marginTop: '24px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
              <button
                type="button"
                className="link-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  navigate(selectedRole === 'mentor' ? '/register/mentor' : '/register/student');
                }}
              >
                <ArrowLeft size={14} /> Change Email or Back to Register
              </button>
            </div>
          </div>
        )}

        {/* ================================================================
            VIEW 4: FORGOT PASSWORD FLOW (3 STEPS)
            ================================================================ */}
        {mode === 'forgot_password' && (
          <div className="pf-otp-card">
            <div className="pf-otp-icon-bubble">
              <KeyRound size={32} />
            </div>

            {/* Step 1: Enter Email */}
            {recoveryStep === 1 && (
              <>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-primary, #15213B)', marginBottom: '8px' }}>
                  Reset Your Password
                </h2>
                <p style={{ color: '#64748B', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '24px' }}>
                  Enter your registered email address and we'll send you a verification code to recover your account.
                </p>

                <form onSubmit={handleForgotPasswordSubmitEmail}>
                  <div className="form-group" style={{ textAlign: 'left', marginBottom: '20px' }}>
                    <label>Registered Email</label>
                    <div className="input-with-icon">
                      <Mail size={18} className="field-icon" />
                      <input
                        type="email"
                        required
                        placeholder="your.email@domain.com"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="primary-action-btn full purple-gradient"
                    disabled={loading}
                    style={{ width: '100%', marginBottom: '16px' }}
                  >
                    {loading ? 'Sending Code...' : 'Send Verification Code'} <ArrowRight size={16} />
                  </button>
                </form>
              </>
            )}

            {/* Step 2: Enter Recovery Code */}
            {recoveryStep === 2 && (
              <>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-primary, #15213B)', marginBottom: '8px' }}>
                  Enter Recovery Code
                </h2>
                <p style={{ color: '#64748B', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '24px' }}>
                  We've sent a 6-digit recovery code to <b>{recoveryEmail}</b>. Enter it below to proceed.
                </p>

                <form onSubmit={handleVerifyRecoveryOtp}>
                  <div style={{ marginBottom: '20px' }}>
                    <input
                      type="text"
                      maxLength={6}
                      inputMode="numeric"
                      autoFocus
                      placeholder="000000"
                      className="pf-otp-input"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>

                  <button
                    type="submit"
                    className="primary-action-btn full purple-gradient"
                    disabled={loading || otpInput.length < 4}
                    style={{ width: '100%', marginBottom: '16px' }}
                  >
                    {loading ? 'Verifying...' : 'Verify Code'} <ArrowRight size={16} />
                  </button>
                </form>

                <div style={{ marginTop: '16px', fontSize: '0.9rem', color: '#64748B' }}>
                  Didn't receive code?{' '}
                  {resendCooldown > 0 ? (
                    <span className="pf-timer-badge">
                      <RotateCcw size={14} /> Resend in {resendCooldown}s
                    </span>
                  ) : (
                    <button type="button" className="pf-resend-active-btn" onClick={handleResendOtp}>
                      Resend Code
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Step 3: Set New Password */}
            {recoveryStep === 3 && (
              <>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-primary, #15213B)', marginBottom: '8px' }}>
                  Create New Password
                </h2>
                <p style={{ color: '#64748B', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '24px' }}>
                  Please choose a strong password with at least 6 characters.
                </p>

                <form onSubmit={handleResetPasswordSubmit} style={{ textAlign: 'left' }}>
                  <div className="form-group">
                    <label>New Password</label>
                    <div className="input-with-icon">
                      <Lock size={18} className="field-icon" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="eye-toggle"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label>Confirm New Password</label>
                    <div className="input-with-icon">
                      <Lock size={18} className="field-icon" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="primary-action-btn full purple-gradient"
                    disabled={loading}
                    style={{ width: '100%', marginBottom: '16px' }}
                  >
                    {loading ? 'Updating Password...' : 'Reset Password'} <ArrowRight size={16} />
                  </button>
                </form>
              </>
            )}

            <div style={{ marginTop: '24px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
              <button
                type="button"
                className="link-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  navigate('/login');
                }}
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
