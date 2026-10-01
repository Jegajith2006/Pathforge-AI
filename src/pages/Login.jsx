import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/common/Logo';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Compass,
} from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('jegajithjothivel@gmail.com');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both your email and password.');
      return;
    }

    setIsLoading(true);
    // Mock authentication transition
    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 450);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 450);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex">
      {/* Left Side: Brand Visual & Motivational Statements (Hidden on small mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-gradient-to-br from-[var(--surface-secondary)] via-[var(--surface)] to-[var(--background)] border-r border-[var(--border)] overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Top Header Logo */}
        <div className="relative z-10">
          <Logo size="lg" to="/" />
        </div>

        {/* Center: Abstract Career Path Visual & Statement */}
        <div className="relative z-10 my-auto py-12 max-w-lg">
          <Badge variant="cyan" dot size="sm" className="mb-4">
            AI Career Command Center
          </Badge>

          <h1 className="text-3xl sm:text-4xl font-extrabold font-display leading-tight text-[var(--text-primary)] mb-4">
            From where you are to where you belong.
          </h1>

          <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed mb-8">
            Every skill verified. Every project audited. PathForge AI orchestrates your complete trajectory to Machine Learning Engineer.
          </p>

          {/* Abstract Career Path Visual */}
          <div className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] backdrop-blur-md space-y-4 mb-8">
            <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)] border-b border-[var(--border)] pb-3">
              <span>ACTIVE PROFILE</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-bold">68% READINESS</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                <span>Core Machine Learning Track</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">Phase 2 / 4</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--surface-tertiary)] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 w-[68%]" />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              <span>Next sprint: Model Evaluation & Cross-Validation</span>
            </div>
          </div>

          {/* Benefits Checklist */}
          <div className="space-y-2.5">
            {[
              'Explainable AI skill gap diagnosis mapped to tier-1 employers',
              'Cryptographically verified Evidence Vault for reproducible code',
              'Rubric-based senior mentor reviews & mock technical rounds',
            ].map((benefit) => (
              <div key={benefit} className="flex items-start gap-2.5 text-xs text-[var(--text-secondary)]">
                <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Quote / Tagline */}
        <div className="relative z-10 pt-6 border-t border-[var(--border)] text-xs text-[var(--text-muted)] font-mono">
          <span>PATHFORGE AI · YOUR SKILLS · YOUR PATH · YOUR FUTURE</span>
        </div>
      </div>

      {/* Right Side: Split-Screen Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 md:p-16 max-w-xl mx-auto">
        {/* Mobile Logo for smaller screens */}
        <div className="lg:hidden flex items-center justify-between mb-8">
          <Logo size="md" to="/" />
          <Link to="/" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            Back to Home
          </Link>
        </div>

        <div className="my-auto space-y-6">
          <div>
            <Badge variant="indigo" size="sm" className="mb-2">
              Platform Authentication
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[var(--text-primary)]">
              Welcome back
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
              Enter your credentials to access your personalized learning command center.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={Mail}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={Lock}
              required
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-[var(--input-bg)] border-[var(--input-border)] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Remember this device</span>
              </label>

              <button
                type="button"
                onClick={() => alert('Password reset link sent to demo email address.')}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-semibold cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              rightIcon={ArrowRight}
              className="mt-2 shadow-xl shadow-indigo-950/20"
            >
              Sign In to Command Center
            </Button>
          </form>

          {/* Social Login Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[var(--background)] text-[var(--text-muted)] font-mono">
                OR CONTINUE WITH
              </span>
            </div>
          </div>

          {/* Continue with Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] hover:bg-[var(--surface-secondary)] text-sm font-semibold text-[var(--text-primary)] transition-colors shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Quick Demo Autofill Notice */}
          <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[11px] text-[var(--text-secondary)] flex items-center justify-between">
            <span>Demo Profile: Jegajith (ML Engineer)</span>
            <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">Auto-configured</span>
          </div>

          {/* Register Link */}
          <div className="text-center text-xs text-[var(--text-secondary)] pt-2">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-semibold underline underline-offset-4">
              Start Your Career Journey
            </Link>
          </div>
        </div>

        {/* Bottom Security Footer */}
        <div className="pt-6 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Encrypted AI Workspace</span>
          </div>
          <Link to="/" className="hover:text-[var(--text-primary)] transition-colors">
            Terms & Privacy
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
