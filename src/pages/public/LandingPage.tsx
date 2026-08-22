// src/pages/public/LandingPage.tsx
// Redesigned landing page with single unified authentication window (Sign In / Sign Up tabs)
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { FormulaTag } from '../../components/chemistry/FormulaTag';
import {
  ShieldCheck,
  Video,
  Eye,
  Lock,
  Mail,
  User,
  School,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Maximize,
  Clock,
  FlaskConical,
  AlertCircle,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

import { useRole } from '../../hooks/useRole';
import { UserRole } from '../../types/auth';

export const LandingPage: React.FC = () => {
  const { signIn, signUp, user, role, isLoading } = useAuth();
  const { getDashboardPath } = useRole();
  const navigate = useNavigate();

  // Authentication Box State
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  
  // Sign In State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Sign Up State
  const [signupFullName, setSignupFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupRole, setSignupRole] = useState<'student' | 'teacher'>('student');
  const [signupTeacherCode, setSignupTeacherCode] = useState('');
  const [signupError, setSignupError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Route based on authenticated role
  const routeByRole = (userRole?: UserRole | null) => {
    switch (userRole) {
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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    const result = await signIn(loginEmail, loginPassword);
    setIsLoggingIn(false);

    if (!result.success) {
      setLoginError(result.error || 'Failed to sign in. Please verify your credentials.');
    } else {
      navigate(getDashboardPath());
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match. Please re-enter.');
      return;
    }

    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters long.');
      return;
    }

    setIsSigningUp(true);
    const result = await signUp({
      email: signupEmail,
      password: signupPassword,
      fullName: signupFullName,
      role: signupRole,
      teacherCode: signupRole === 'teacher' ? signupTeacherCode : undefined,
    });
    setIsSigningUp(false);

    if (!result.success) {
      setSignupError(result.error || 'Failed to create account.');
    } else {
      routeByRole(signupRole);
    }
  };

  const coreFeatures = [
    {
      title: 'Chemistry Question Authoring',
      description: 'Author chemistry questions with rich equations, KaTeX notation, and built-in Chemistry Virtual Keyboard.',
      icon: FlaskConical,
      badge: 'Chemistry Engine',
    },
    {
      title: '360° Environmental Room Scan',
      description: 'Mandatory pre-exam 360° room scan video ensures examination room perimeter integrity and candidate accountability.',
      icon: Video,
      badge: 'Integrity Gate',
    },
    {
      title: 'Continuous Camera & Mic Proctoring',
      description: 'Live continuous monitoring for face presence, eyes open, head orientation, and microphone noise.',
      icon: Eye,
      badge: 'Proctoring',
    },
    {
      title: 'Full-Screen Strict Exam Mode',
      description: 'Enforces distraction-free full-screen examination. Automatically records tab switches and window unfocus events.',
      icon: Maximize,
      badge: 'Security',
    },
    {
      title: 'Scientific Calculator & Formulas',
      description: 'Built-in scientific calculator with standard physical constants and comprehensive chemistry reference formulas.',
      icon: Clock,
      badge: 'Exam Tools',
    },
    {
      title: 'Centralized Evidence Review Console',
      description: 'Single unified console for instructors to review 360° scans, webcam feeds, audio logs, and timestamped events.',
      icon: ShieldCheck,
      badge: 'Teacher Review',
    },
  ];

  return (
    <div className="bg-slate-50 text-slate-900">
      {/* ========================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================= */}
      <section className="pt-12 pb-16 md:pt-16 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Unified Chemistry Examination Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Exam Fight <span className="text-blue-600">Chemistry</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl">
                A clean, modern academic examination environment with chemical formula rendering, 360° environmental room scanning, and live proctoring integrity.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1">
                <FormulaTag formula="360° Room Scan" name="Perimeter Gate" variant="cyan" />
                <FormulaTag formula="Camera + Microphone" name="Hardware Monitored" variant="indigo" />
                <FormulaTag formula="Full-Screen Locked" name="Exam Mode" variant="emerald" />
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-3 pt-2">
                <a href="#auth-section">
                  <Button variant="primary" size="lg" className="shadow-sm">
                    Access Portal Below ↓
                  </Button>
                </a>
              </div>
            </div>

            {/* Right Live Exam Card Interface */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-white border border-slate-200 shadow-card p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold text-slate-800">Live Examination Portal</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    CHEM-302
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                    <span>Question 1 of 10</span>
                    <span className="text-blue-700 font-bold">⏱ 58:20 Remaining</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    Calculate standard Gibbs Free Energy change ΔG° for the synthesis of ammonia at 500 K:
                  </h4>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center font-mono text-xs text-blue-700 font-bold">
                    N₂(g) + 3H₂(g) ⇌ 2NH₃(g), &nbsp; ΔH° = -92.4 kJ/mol
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="p-3 rounded-xl border border-blue-500 bg-blue-50 text-xs text-blue-900 font-bold flex items-center justify-between">
                      <span>A) ΔG° = +6.70 kJ/mol (Non-spontaneous)</span>
                      <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Camera & Mic Active
                  </span>
                  <span className="font-mono text-slate-400">360° Scan Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. CORE PLATFORM FEATURES */}
      {/* ========================================================= */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-2 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Academic Platform Features
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Chemistry Examination & Proctoring Architecture
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              A comprehensive system designed specifically for chemistry examinations and integrity verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {coreFeatures.map((f, idx) => {
              const Icon = f.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card hover:shadow-dropdown transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      {f.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{f.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. SINGLE UNIFIED AUTHENTICATION WINDOW (SIGN IN / SIGN UP) */}
      {/* ========================================================= */}
      <section id="auth-section" className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-md mx-auto px-4">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-card p-6 sm:p-8 space-y-6">
            {/* Header / Brand */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-xs">
                <FlaskConical className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Exam Fight Chemistry
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Welcome to the unified examination portal
                </p>
              </div>
            </div>

            {/* If user is already authenticated */}
            {user ? (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center space-y-3">
                <div className="text-xs text-blue-800">
                  You are currently logged in as <strong>{user.full_name || user.email}</strong> ({role}).
                </div>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => routeByRole(role)}
                >
                  Continue to Your Dashboard →
                </Button>
              </div>
            ) : (
              <>
                {/* Clean Tabs: Sign In / Sign Up */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setAuthTab('signin')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                      authTab === 'signin'
                        ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthTab('signup')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                      authTab === 'signup'
                        ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                {/* ─── SIGN IN TAB ─── */}
                {authTab === 'signin' && (
                  <form onSubmit={handleSignIn} className="space-y-4">
                    {loginError && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Academic Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="email"
                          required
                          placeholder="name@university.edu"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
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
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="w-full mt-2"
                      isLoading={isLoggingIn || isLoading}
                    >
                      Continue to Portal
                    </Button>
                  </form>
                )}

                {/* ─── SIGN UP TAB ─── */}
                {authTab === 'signup' && (
                  <form onSubmit={handleSignUp} className="space-y-3.5">
                    {signupError && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{signupError}</span>
                      </div>
                    )}

                    {/* Role Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Account Type
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSignupRole('student')}
                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                            signupRole === 'student'
                              ? 'bg-blue-50 border-blue-500 text-blue-900 ring-1 ring-blue-500 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-blue-600" />
                            <span className="text-xs">Student</span>
                          </div>
                          {signupRole === 'student' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => setSignupRole('teacher')}
                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                            signupRole === 'teacher'
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <School className="w-4 h-4 text-indigo-600" />
                            <span className="text-xs">Faculty</span>
                          </div>
                          {signupRole === 'teacher' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                        </button>
                      </div>
                    </div>

                    {/* Teacher Verification Code (Mandatory when faculty selected) */}
                    {signupRole === 'teacher' && (
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
                          value={signupTeacherCode}
                          onChange={(e) => setSignupTeacherCode(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white border border-indigo-300 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="text-[10px] text-slate-600 leading-relaxed">
                          A valid authorization key from your institutional administrator is strictly required to register as a teacher.
                        </p>
                      </div>
                    )}

                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          placeholder="Dr. Evelyn Vance or Alex Chen"
                          value={signupFullName}
                          onChange={(e) => setSignupFullName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="email"
                          required
                          placeholder="name@university.edu"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Password & Confirm Password */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Min 6 chars"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Confirm
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Repeat"
                          value={signupConfirmPassword}
                          onChange={(e) => setSignupConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Admin Access Notice */}
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-1.5 text-[10px] text-slate-500">
                      <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Admin accounts are strictly provisioned by institution directors.</span>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="w-full mt-1"
                      isLoading={isSigningUp || isLoading}
                    >
                      Create {signupRole === 'teacher' ? 'Faculty' : 'Student'} Account
                    </Button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
