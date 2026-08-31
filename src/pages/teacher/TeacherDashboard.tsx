// src/pages/teacher/TeacherDashboard.tsx
// Real Teacher Dashboard with dynamic calculation of exams, attempts, student requests, and proctoring alerts
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchExamsFromDB, fetchAttemptsFromDB } from '../../lib/examService';
import { fetchClassesFromDB, fetchEnrollmentsFromDB } from '../../lib/classService';
import { fetchTeacherRequests } from '../../lib/requestService';
import { ExamRequest } from '../../types/request';
import { ExamItem } from '../../types/dashboard';
import { ExamAttempt } from '../../types/evidence';
import { AcademicClass } from '../../types/academic';
import { DashboardCard } from '../../components/common/DashboardCard';
import { Button } from '../../components/common/Button';
import {
  Radio,
  CheckCircle2,
  Plus,
  ArrowRight,
  GraduationCap,
  Inbox,
  Clock,
  User,
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const teacherId = user?.id || '';
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [requests, setRequests] = useState<ExamRequest[]>([]);
  const [enrolledStudentsCount, setEnrolledStudentsCount] = useState<number>(0);

  const loadTeacherDashboard = async () => {
    if (teacherId) {
      try {
        const [dbClasses, dbEnrollments, dbExams, dbAttempts, reqs] = await Promise.all([
          fetchClassesFromDB(teacherId),
          fetchEnrollmentsFromDB({ teacherId }),
          fetchExamsFromDB({ teacherId }),
          fetchAttemptsFromDB(),
          fetchTeacherRequests(teacherId),
        ]);

        setClasses(dbClasses);
        setEnrolledStudentsCount(dbEnrollments.filter((e) => e.status === 'active').length);
        setExams(dbExams);
        setAttempts(dbAttempts);
        setRequests(reqs);
      } catch (err) {
        console.warn('TeacherDashboard load error:', err);
      }
    }
  };

  useEffect(() => {
    loadTeacherDashboard();
    const interval = setInterval(loadTeacherDashboard, 5000);
    return () => clearInterval(interval);
  }, [teacherId]);

  const activeExamsCount = exams.filter((e) => (e.status as string) === 'active' || (e.status as string) === 'published').length;
  const completedAttempts = attempts.filter((a) => a.status === 'submitted');
  const pendingRequests = requests.filter((r) => r.status === 'PENDING');

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* 1. Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome, {user?.full_name?.split(' ')[0] || 'Professor'}! 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of your academic classes, enrolled students, active examinations, and student requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/teacher/requests">
            <Button
              variant={pendingRequests.length > 0 ? 'primary' : 'secondary'}
              size="sm"
              leftIcon={<Inbox className="w-4 h-4" />}
              className={pendingRequests.length > 0 ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
            >
              Requests ({pendingRequests.length})
            </Button>
          </Link>
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
          title="Student Requests"
          value={pendingRequests.length.toString().padStart(2, '0')}
          subtitle={pendingRequests.length > 0 ? 'Awaiting your review' : 'All clear'}
          icon={Inbox}
          accentColor={pendingRequests.length > 0 ? 'amber' : 'indigo'}
        />
        <DashboardCard
          title="Completed Attempts"
          value={completedAttempts.length.toString().padStart(2, '0')}
          subtitle="Submitted tests"
          icon={CheckCircle2}
          accentColor="indigo"
        />
      </div>

      {/* 3. Pending Student Requests Banner (if any) */}
      {pendingRequests.length > 0 && (
        <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-5 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4 text-amber-600 animate-spin" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950">
                  {pendingRequests.length} Student Re-entry & Issue Request{pendingRequests.length > 1 ? 's' : ''} Pending
                </h3>
                <p className="text-[11px] text-amber-700">
                  Students experiencing accidental exit or technical problems have submitted requests for your review.
                </p>
              </div>
            </div>

            <Link to="/teacher/requests">
              <Button variant="primary" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Review Requests
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {pendingRequests.slice(0, 2).map((req) => (
              <div key={req.id} className="p-3.5 rounded-xl bg-white border border-amber-200/80 shadow-2xs flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-bold text-slate-900 truncate">{req.studentName}</span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-mono">
                      {req.requestType}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    Exam: <strong>{req.examTitle}</strong> • {req.className} ({req.sectionName})
                  </p>
                  <p className="text-[11px] text-slate-600 italic truncate">
                    "{req.message}"
                  </p>
                </div>

                <Link to="/teacher/requests" className="shrink-0">
                  <Button variant="secondary" size="sm" className="text-xs py-1 px-2.5">
                    Action
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Real Examinations List */}
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
                          (ex.status as string) === 'active' || (ex.status as string) === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {(ex.status as string) === 'active' || (ex.status as string) === 'published' ? '🟢 Published' : 'Scheduled'}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/teacher/evidence-review?exam=${ex.id}`}>
                          <Button variant="secondary" size="sm" className="text-xs py-1 px-2.5">
                            Evidence
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
