import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../hooks/useRole';
import { Button } from '../../components/common/Button';
import { Lock, Mail, AlertCircle, Sparkles, FlaskConical } from 'lucide-react';
import { UserRole } from '../../types/auth';

export const LoginPage: React.FC = () => {
  const { signIn, demoLogin, user, role, isLoading } = useAuth();
  const { getDashboardPath } = useRole();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && role) {
      const from = (location.state as any)?.from?.pathname || getDashboardPath();
      navigate(from, { replace: true });
    }
  }, [user, role, navigate, location, getDashboardPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signIn(email, password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Failed to sign in. Please verify your credentials.');
    }
  };

  const handleQuickLogin = (selectedRole: UserRole) => {
    demoLogin(selectedRole);
    switch (selectedRole) {
      case 'admin':
        navigate('/admin/dashboard');
        break;
      case 'teacher':
        navigate('/teacher/dashboard');
        break;
      case 'student':
      default:
        navigate('/student/dashboard');
        break;
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-blue-600 text-white shadow-xs mb-1">
            <FlaskConical className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Academic Portal Sign In
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Enter your credentials to access your chemistry examination environment
          </p>
        </div>

        {/* Demo Fast Login Box */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-card">
          <div className="flex items-center justify-between text-xs text-blue-700 font-semibold">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              1-Click Role Testing Access
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Instant Auth</span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleQuickLogin('student')}
              className="px-2.5 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-slate-800 text-xs font-semibold transition-all flex flex-col items-center gap-0.5"
            >
              <span className="text-[11px] font-bold text-blue-700">Student</span>
              <span className="text-[10px] text-slate-500">Alex Chen</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('teacher')}
              className="px-2.5 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-slate-800 text-xs font-semibold transition-all flex flex-col items-center gap-0.5"
            >
              <span className="text-[11px] font-bold text-indigo-700">Teacher</span>
              <span className="text-[10px] text-slate-500">Dr. Vance</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="px-2.5 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-slate-800 text-xs font-semibold transition-all flex flex-col items-center gap-0.5"
            >
              <span className="text-[11px] font-bold text-amber-700">Admin</span>
              <span className="text-[10px] text-slate-500">Prof. Arthur</span>
            </button>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-card space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Academic Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="student@chem.edu or teacher@chem.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isSubmitting || isLoading}
            >
              Sign In to Platform
            </Button>
          </form>

          {/* Bottom link */}
          <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
            Don&apos;t have an account yet?{' '}
            <Link to="/signup" className="text-blue-600 font-semibold hover:text-blue-700">
              Create Student / Teacher Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
