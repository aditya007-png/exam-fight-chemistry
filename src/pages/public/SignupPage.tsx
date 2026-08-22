import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../hooks/useRole';
import { Button } from '../../components/common/Button';
import {
  GraduationCap,
  School,
  Lock,
  Mail,
  User,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  FlaskConical,
} from 'lucide-react';

export const SignupPage: React.FC = () => {
  const { signUp, user, role, isLoading } = useAuth();
  const { getDashboardPath } = useRole();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher'>('student');
  const [teacherCode, setTeacherCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    if (user && role) {
      navigate(getDashboardPath(), { replace: true });
    }
  }, [user, role, navigate, getDashboardPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    const result = await signUp({
      email,
      password,
      fullName,
      role: selectedRole,
      teacherCode: selectedRole === 'teacher' ? teacherCode : undefined,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Failed to create account.');
    } else {
      if (selectedRole === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-12 bg-slate-50">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-xs">
            <FlaskConical className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create Examination Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Establish your verified academic examination profile
          </p>
        </div>

        {/* Signup Card */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-card space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ROLE SELECTOR: STRICTLY STUDENT OR TEACHER */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Select Your Role <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Student Option */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('student')}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    selectedRole === 'student'
                      ? 'bg-blue-50 border-blue-500 text-blue-900 ring-1 ring-blue-500 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <GraduationCap className={`w-5 h-5 ${selectedRole === 'student' ? 'text-blue-600' : 'text-slate-400'}`} />
                    {selectedRole === 'student' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-slate-900">Student</span>
                    <span className="text-[10px] text-slate-500">Take exams & review grades</span>
                  </div>
                </button>

                {/* Teacher Option */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('teacher')}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    selectedRole === 'teacher'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <School className={`w-5 h-5 ${selectedRole === 'teacher' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {selectedRole === 'teacher' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-slate-900">Teacher / Faculty</span>
                    <span className="text-[10px] text-slate-500">Create tests & review scans</span>
                  </div>
                </button>
              </div>

              {/* ADMIN RESTRICTION SECURITY NOTICE */}
              <div className="mt-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2 text-[11px] text-slate-500">
                <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Security Policy:</strong> Administrator accounts cannot be created via public registration. Admins are provisioned directly by institution directors.
                </span>
              </div>
            </div>

            {/* Teacher Verification Code (Mandatory when teacher selected) */}
            {selectedRole === 'teacher' && (
              <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 space-y-1.5">
                <label className="block text-xs font-bold text-indigo-950 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                    Faculty Verification Code <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                    Mandatory (Issued by Admin)
                  </span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CHEM-FACULTY-2026-XP9R"
                  value={teacherCode}
                  onChange={(e) => setTeacherCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-indigo-300 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-600">
                  <span>Authorized Key: <strong className="font-mono text-indigo-900">CHEM-FACULTY-2026-XP9R</strong></span>
                  <button
                    type="button"
                    onClick={() => setTeacherCode('CHEM-FACULTY-2026-XP9R')}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    Insert Key
                  </button>
                </div>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="Dr. Evelyn Vance or Alex Chen"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Academic Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isSubmitting || isLoading}
            >
              Create {selectedRole === 'student' ? 'Student' : 'Faculty'} Account
            </Button>
          </form>

          {/* Bottom link */}
          <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700">
              Sign In here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
