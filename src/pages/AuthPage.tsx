import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { BrandLogo } from '../components/common/BrandLogo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Target,
  Lock,
  Mail,
  User,
  Compass,
} from 'lucide-react';

export const AuthPage: React.FC<{ initialMode?: 'login' | 'register' }> = ({
  initialMode = 'login',
}) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [name, setName] = useState('Jegajith');
  const [email, setEmail] = useState('jegajithjothivel@gmail.com');
  const [password, setPassword] = useState('demo-password-123');
  const [confirmPassword, setConfirmPassword] = useState('demo-password-123');
  const [targetCareer, setTargetCareer] = useState('Data Analyst');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all required credentials.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        addToast('Welcome back, ' + (name || 'Jegajith') + '!', 'Accessing AI Career Command Center...', 'success');
      } else {
        await register(name, email, password, targetCareer);
        addToast('Account Initialized', 'Personalized skill intelligence baseline calibrated for ' + targetCareer, 'success');
      }
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#080B16] text-slate-100">
      {/* Left side: Premium Branding, Abstract Visual & Features */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between p-12 bg-gradient-to-br from-[#0F172A] via-[#111827] to-[#080B16] border-r border-slate-800/80 relative overflow-hidden">
        {/* Glow ambient background rings */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <BrandLogo size="md" showTagline={true} />
        </div>

        {/* Abstract Career Path Visual Card */}
        <div className="relative z-10 my-8 p-8 rounded-3xl bg-[#151C2E]/80 border border-slate-700/60 backdrop-blur-xl shadow-2xl max-w-lg">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Explainable ML Engine
            </span>
          </div>

          <h3 className="text-2xl font-extrabold text-white font-display leading-snug">
            “Turn continuous learning into verified career readiness.”
          </h3>

          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            PathForge AI tracks your actual competency trajectory through quantifiable code repos, assessment percentiles, and senior industry mentorship.
          </p>

          {/* Connected mini path mockup */}
          <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                ✓
              </span>
              <div>
                <span className="block font-bold text-white">Skills Benchmarked</span>
                <span className="text-[10px] text-slate-400">12 technical metrics</span>
              </div>
            </div>

            <div className="w-8 h-0.5 bg-indigo-500/40" />

            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-[10px]">
                ⚡
              </span>
              <div>
                <span className="block font-bold text-white">Active Roadmap</span>
                <span className="text-[10px] text-slate-400">Paced sprints</span>
              </div>
            </div>

            <div className="w-8 h-0.5 bg-indigo-500/40" />

            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-[10px]">
                69%
              </span>
              <div>
                <span className="block font-bold text-white">Career Ready</span>
                <span className="text-[10px] text-slate-400">Job matched</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 grid grid-cols-3 gap-4 text-xs text-slate-400 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Verified Evidence Vault</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Gap Prioritization</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Target Role Alignment</span>
          </div>
        </div>
      </div>

      {/* Right side: Login / Registration Form */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center p-6 sm:p-12 max-w-md mx-auto w-full">
        {/* Mobile Header Logo */}
        <div className="lg:hidden mb-8">
          <BrandLogo size="md" />
        </div>

        <div className="space-y-2 mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-display tracking-tight">
            {isLogin ? 'Welcome Back' : 'Create Your Account'}
          </h2>
          <p className="text-xs text-slate-400">
            {isLogin
              ? 'Enter your credentials to access your Career Command Center.'
              : 'Begin building an explainable, evidence-based career roadmap.'}
          </p>
        </div>

        {/* Mode Toggle Switch */}
        <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              isLogin ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              !isLogin ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-950/40 border border-rose-900/50 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Jegajith J."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111827] border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Career Goal
                </label>
                <div className="relative">
                  <Compass className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={targetCareer}
                    onChange={(e) => setTargetCareer(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111827] border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-hidden transition-colors appearance-none"
                  >
                    <option value="Data Analyst">Data Analyst</option>
                    <option value="Machine Learning Engineer">Machine Learning Engineer</option>
                    <option value="Analytics Engineer">Analytics Engineer</option>
                    <option value="Business Intelligence Architect">BI Architect</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111827] border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#111827] border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111827] border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden transition-colors"
                />
              </div>
            </div>
          )}

          {isLogin && (
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                />
                Remember this workstation
              </label>
              <button
                type="button"
                onClick={() => addToast('Password Reset', 'Password recovery instructions sent to your email.', 'info')}
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-950/60 disabled:opacity-50 mt-6"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : isLogin ? (
              <>
                <span>Access Command Center</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Create & Initialize Profile</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500">
          <Link to="/" className="text-slate-400 hover:text-white transition-colors">
            ← Back to Product Showcase
          </Link>
        </div>
      </div>
    </div>
  );
};
