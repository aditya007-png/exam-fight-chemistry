// src/pages/teacher/TeacherDashboard.tsx
// Real Teacher Dashboard with dynamic calculation of exams, attempts, and proctoring evidence alerts
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStoredExams, getAllStoredAttempts } from '../../lib/examService';
import { getStoredClasses, getStoredEnrollments } from '../../lib/classService';
import { ExamItem } from '../../types/dashboard';
import { ExamAttempt } from '../../types/evidence';
import { AcademicClass } from '../../types/academic';
import { DashboardCard } from '../../components/common/DashboardCard';
import { Button } from '../../components/common/Button';
import {
  Radio,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowRight,
  Eye,
  GraduationCap,
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const teacherId = user?.id || '';
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [enrolledStudentsCount, setEnrolledStudentsCount] = useState<number>(0);

  useEffect(() => {
    setExams(getStoredExams().filter((e) => !e.teacherId || e.teacherId === teacherId));
    setAttempts(getAllStoredAttempts());
    if (teacherId) {
      const clsList = getStoredClasses(teacherId);
      setClasses(clsList);
      const enrList = getStoredEnrollments({ teacherId });
      setEnrolledStudentsCount(enrList.length);
    }
  }, [teacherId]);

  const activeExamsCount = exams.filter((e) => e.status === 'active').length;
  const completedAttempts = attempts.filter((a) => a.status === 'submitted');
  const flaggedAttempts = attempts.filter((a) => a.totalViolations > 0 || a.riskLevel === 'HIGH');

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* 1. Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome, {user?.full_name?.split(' ')[0] || 'Professor'}! 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of your academic classes, enrolled students, active examinations, and proctoring evidence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/teacher/classes">
            <Button variant="secondary" size="sm" leftIcon={<GraduationCap className="w-4 h-4" />}>
              Manage Classes
            </Button>
          </Link>
          <Link to="/teacher/create-exam">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Create Exam
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Real Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="My Classes"
          value={classes.length.toString().padStart(2, '0')}
          subtitle={`${enrolledStudentsCount} students enrolled`}
          icon={GraduationCap}
          accentColor="blue"
        />
        <DashboardCard
          title="Active Exams"
          value={activeExamsCount.toString().padStart(2, '0')}
          subtitle="Currently published"
          icon={Radio}
          accentColor="emerald"
        />
        <DashboardCard
          title="Completed Attempts"
          value={completedAttempts.length.toString().padStart(2, '0')}
          subtitle="Submitted tests"
          icon={CheckCircle2}
          accentColor="indigo"
        />
        <DashboardCard
          title="Evidence Alerts"
          value={flaggedAttempts.length.toString().padStart(2, '0')}
          subtitle="Flagged proctoring events"
          icon={AlertTriangle}
          accentColor="amber"
        />
      </div>

      {/* 3. Real Examinations List */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Examinations
          </h2>
          <Link to="/teacher/exams" className="text-xs font-bold text-blue-600 hover:text-blue-700">
            View All Exams →
          </Link>
        </div>

        {exams.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <p className="text-xs text-slate-500">No examinations created yet.</p>
            <Link to="/teacher/create-exam" className="inline-block pt-1">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Create Your First Exam
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="pb-3">Exam Name</th>
                  <th className="pb-3">Course Code</th>
                  <th className="pb-3">Questions</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {exams.map((ex) => (
                  <tr key={ex.id} className="hover:bg-slate-50">
                    <td className="py-3.5 font-bold text-slate-900">{ex.title}</td>
                    <td className="py-3.5 text-blue-700 font-mono font-bold">{ex.courseCode}</td>
                    <td className="py-3.5 text-slate-600 font-mono">{ex.totalQuestions}</td>
                    <td className="py-3.5 text-slate-600 font-mono">{ex.durationMinutes} min</td>
                    <td className="py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ex.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {ex.status === 'active' ? '🟢 Active' : 'Scheduled'}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <Link to={`/teacher/evidence-review?exam=${ex.id}`}>
                        <Button variant="secondary" size="sm" className="text-xs py-1 px-2.5">
                          Evidence
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Evidence Requiring Review */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Evidence & Candidate Attempts
            </h2>
            <p className="text-xs text-slate-500">
              Recent proctoring events, room scan verifications, and compliance logs
            </p>
          </div>
          <Link
            to="/teacher/evidence-review"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            <span>Open Evidence Review</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {attempts.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-500">No student attempts recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {attempts.slice(0, 5).map((att) => (
              <div
                key={att.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{att.studentName}</span>
                    <span className="text-[11px] text-slate-500">• {att.examTitle}</span>
                  </div>
                  <p className="text-slate-600">
                    Integrity Score: <strong>{att.integrityScore}%</strong> • Total Violations:{' '}
                    <strong>{att.totalViolations}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      att.riskLevel === 'HIGH'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : att.riskLevel === 'MEDIUM'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {att.status === 'submitted' ? 'Submitted' : 'In Progress'}
                  </span>

                  <Link to={`/teacher/evidence-review?attempt=${att.id}`}>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-xs py-1 px-2.5"
                      leftIcon={<Eye className="w-3 h-3 text-blue-600" />}
                    >
                      Review
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
