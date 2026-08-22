// src/pages/student/StudentDashboard.tsx
// Real Student Dashboard with dynamic real exam data and attempts calculation
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getExamsForStudent, getAttemptsForStudent } from '../../lib/examService';
import { getStudentEnrolledSectionIds, getStudentEnrolledClasses } from '../../lib/classService';
import { ExamItem } from '../../types/dashboard';
import { ExamAttempt } from '../../types/evidence';
import { DashboardCard } from '../../components/common/DashboardCard';
import { Button } from '../../components/common/Button';
import {
  FileText,
  Clock,
  Award,
  ShieldCheck,
  ArrowRight,
  Atom,
  GraduationCap,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [enrolledClassesCount, setEnrolledClassesCount] = useState<number>(0);

  useEffect(() => {
    if (user?.id || user?.email) {
      const secIds = getStudentEnrolledSectionIds(user?.id || '', user?.email || '');
      const studentExams = getExamsForStudent(secIds);
      setExams(studentExams);
      const enr = getStudentEnrolledClasses(user?.id || '', user?.email || '');
      setEnrolledClassesCount(enr.length);
    } else {
      setExams([]);
    }

    if (user?.email) {
      setAttempts(getAttemptsForStudent(user.email));
    }
  }, [user?.id, user?.email]);

  const completedAttempts = attempts.filter((a) => a.status === 'submitted');
  const avgIntegrity =
    completedAttempts.length > 0
      ? Math.round(
          completedAttempts.reduce((sum, a) => sum + (a.integrityScore || 100), 0) /
            completedAttempts.length
        )
      : 100;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* 1. Welcome Banner */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
            Student Portal
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Welcome back, {user?.full_name || 'Student'} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {enrolledClassesCount > 0
              ? `You are enrolled in ${enrolledClassesCount} class cohort(s) with ${exams.length} assigned examination(s).`
              : 'Join a class using your teacher’s enrollment key to access assigned exams.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/student/classes">
            <Button variant="secondary" size="md" leftIcon={<GraduationCap className="w-4 h-4" />}>
              My Classes
            </Button>
          </Link>
          <Link to="/student/exams">
            <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Assigned Exams
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Real Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DashboardCard
          title="Assigned Exams"
          value={exams.length.toString().padStart(2, '0')}
          subtitle={`${exams.filter((e) => e.status === 'active').length} live now`}
          icon={FileText}
          accentColor="blue"
        />
        <DashboardCard
          title="Completed Exams"
          value={completedAttempts.length.toString().padStart(2, '0')}
          subtitle="Graded & recorded attempts"
          icon={Award}
          accentColor="emerald"
        />
        <DashboardCard
          title="Integrity Record"
          value={`${avgIntegrity}%`}
          subtitle="Average compliance score"
          icon={ShieldCheck}
          accentColor="indigo"
        />
      </div>

      {/* 3. Assigned & Upcoming Exams */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Assigned Examinations
          </h2>
          <Link to="/student/exams" className="text-xs font-bold text-blue-600 hover:text-blue-700">
            View All →
          </Link>
        </div>

        {exams.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <p className="text-xs text-slate-500">No examinations assigned at this moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {exam.courseCode}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        exam.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {exam.status === 'active' ? '🟢 Live Now' : 'Scheduled'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{exam.title}</h3>
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" /> Duration: {exam.durationMinutes} min
                  </span>
                </div>

                <Link to={`/student/exam/${exam.id}`}>
                  <Button variant="primary" size="sm" className="w-full text-xs font-bold">
                    Start Examination
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Quick Tools Section (Periodic Table) */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Quick Tools & References
          </h2>
          <span className="text-xs text-slate-400">Available for study & preparation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Link
            to="/student/periodic-table"
            className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-200 hover:border-blue-300 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Atom className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors">
                ⚛ Periodic Table
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Explore elements and their basic properties, atomic masses, and electron configurations.
              </p>
            </div>

            <div className="pt-4 flex items-center text-xs font-bold text-blue-600 group-hover:text-blue-700">
              <span>Open Periodic Table →</span>
            </div>
          </Link>
        </div>
      </div>

      {/* 5. Completed Exams & Results */}
      {completedAttempts.length > 0 && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Completed Examinations
            </h2>
            <Link to="/student/results" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              View All Results →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {completedAttempts.map((sub) => (
              <div key={sub.id} className="py-3.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{sub.examTitle}</span>
                  <span className="text-slate-400 font-mono">
                    {sub.courseCode} • {new Date(sub.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {sub.score || 0}/{sub.totalMarks || 100}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                    Verified ({sub.integrityScore}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
