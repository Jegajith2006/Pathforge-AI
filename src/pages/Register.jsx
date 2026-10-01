import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/common/Logo';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import {
  User,
  Mail,
  Lock,
  Briefcase,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: 'Jegajith',
    email: 'jegajithjothivel@gmail.com',
    password: 'PathForgeStrongPassword2026!',
    confirmPassword: 'PathForgeStrongPassword2026!',
    targetRole: 'Machine Learning Engineer',
    experienceLevel: 'Student / Transitioning to Tech',
    acceptTerms: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Password strength calculation
  const calculateStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'None' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return { score, label: labels[score] || 'Fair' };
  };

  const strength = calculateStrength(formData.password);

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName || !formData.email || !formData.password) {
      setError('Please fill out all required fields.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (!formData.acceptTerms) {
      setError('You must accept the terms of service to create an account.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 450);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex">
      {/* Left Column: Visual & Value Proposition */}
      <div className="hidden lg:flex lg:w-5/12 relative flex-col justify-between p-12 bg-gradient-to-br from-[var(--surface-secondary)] via-[var(--surface)] to-[var(--background)] border-r border-[var(--border)]">
        <div className="relative z-10">
          <Logo size="lg" to="/" />
        </div>

        <div className="relative z-10 my-auto py-10 max-w-md space-y-6">
          <Badge variant="cyan" dot size="sm">
            Launch Your Career Engine
          </Badge>

          <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-[var(--text-primary)] leading-tight">
            Build your competitive advantage in AI & Engineering.
          </h1>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            PathForge AI connects your raw skills directly to the engineering benchmarks used by top startups and tech enterprises.
          </p>

          <div className="space-y-4 pt-4">
            <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] flex items-start gap-3 shadow-sm">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)] font-display">Targeted Role Calibration</p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Select Machine Learning Engineer to generate tailor-made diagnostic roadmaps.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] flex items-start gap-3 shadow-sm">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)] font-display">Evidence Vault Protection</p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Your portfolio projects are verified with automated unit tests and code audits.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-4 border-t border-[var(--border)] text-xs text-[var(--text-muted)] font-mono">
          <span>PATHFORGE AI · ONBOARDING ENGINE</span>
        </div>
      </div>

      {/* Right Column: Registration Form */}
      <div className="w-full lg:w-7/12 flex flex-col justify-between p-6 sm:p-10 md:p-12 max-w-2xl mx-auto overflow-y-auto">
        <div className="lg:hidden flex items-center justify-between mb-6">
          <Logo size="md" to="/" />
          <Link to="/login" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            Sign In Instead
          </Link>
        </div>

        <div className="my-auto space-y-6">
          <div>
            <Badge variant="indigo" size="sm" className="mb-2">
              Career Onboarding
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[var(--text-primary)]">
              Create your PathForge account
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
              Configure your career targets and begin your personalized roadmap.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="e.g. Jegajith Jothivel"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                leftIcon={User}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                leftIcon={Mail}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Target Career Role Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--text-primary)]">
                  Target Career Role <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <select
                    value={formData.targetRole}
                    onChange={(e) => handleChange('targetRole', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-sm text-[var(--text-primary)] focus:border-indigo-500 focus:outline-hidden appearance-none cursor-pointer"
                  >
                    <option value="Machine Learning Engineer">Machine Learning Engineer</option>
                    <option value="Data Scientist">Data Scientist</option>
                    <option value="AI Solutions Architect">AI Solutions Architect</option>
                    <option value="Data Analyst">Data Analyst</option>
                    <option value="Cloud ML Engineer">Cloud ML Engineer</option>
                  </select>
                </div>
              </div>

              {/* Experience Level */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--text-primary)]">
                  Current Experience Level <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
                    <Layers className="w-4 h-4" />
                  </div>
                  <select
                    value={formData.experienceLevel}
                    onChange={(e) => handleChange('experienceLevel', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-sm text-[var(--text-primary)] focus:border-indigo-500 focus:outline-hidden appearance-none cursor-pointer"
                  >
                    <option value="Student / Final Year">Student / Final Year</option>
                    <option value="Career Switcher">Career Switcher</option>
                    <option value="Associate / Junior (0-2 years)">Associate / Junior (0-2 yrs)</option>
                    <option value="Mid-Level Engineer (2-5 years)">Mid-Level Engineer (2-5 yrs)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Password"
                type="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                leftIcon={Lock}
                showStrengthMeter
                strengthScore={strength.score}
                strengthLabel={strength.label}
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                leftIcon={Lock}
                required
              />
            </div>

            {/* Terms Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={(e) => handleChange('acceptTerms', e.target.checked)}
                  className="rounded bg-[var(--input-bg)] border-[var(--input-border)] text-indigo-600 focus:ring-indigo-500 mt-0.5 cursor-pointer"
                />
                <span>
                  I agree to the{' '}
                  <span className="text-indigo-600 dark:text-indigo-400 hover:underline">Terms of Service</span> and{' '}
                  <span className="text-indigo-600 dark:text-indigo-400 hover:underline">Privacy Policy</span>. I understand PathForge AI analyzes project evidence to synthesize readiness metrics.
                </span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              rightIcon={ArrowRight}
              className="mt-4 shadow-xl shadow-indigo-950/20"
            >
              Create Account & Launch Command Center
            </Button>
          </form>

          <div className="text-center text-xs text-[var(--text-secondary)] pt-2">
            Already have an active account?{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-semibold underline underline-offset-4">
              Sign In to Your Workspace
            </Link>
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span>Target Profile: Machine Learning Track</span>
          <Link to="/" className="hover:text-[var(--text-primary)] transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
