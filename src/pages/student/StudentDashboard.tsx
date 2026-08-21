import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DashboardCard } from '../../components/common/DashboardCard';
import { Button } from '../../components/common/Button';
import {
  FileText,
  Clock,
  Award,
  ShieldCheck,
  ArrowRight,
  Atom,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();

  const assignedExams = [
    {
      id: 'exam-act-001',
      title: 'Organic Chemistry — Unit Test',
      courseCode: 'CHEM-302',
      duration: '60 Minutes',
      status: 'Live Now',
      isLive: true,
    },
    {
      id: 'exam-act-002',
      title: 'Inorganic Chemistry — Mid Term',
      courseCode: 'CHEM-301',
      duration: '90 Minutes',
      status: 'Tomorrow, 10:00 AM',
      isLive: false,
    },
  ];

  const recentSubmissions = [
    {
      id: 'res-001',
      title: 'Spectroscopy & Molecular Identification',
      courseCode: 'CHEM-405',
      score: '92/100',
      grade: 'A+',
      status: 'Verified',
      date: '15 Feb 2026',
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* 1. Welcome Banner */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
            Student Portal
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Welcome back, {user?.full_name || 'Alex'} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            You have 1 active live examination ready for verification and entry.
          </p>
        </div>

        <Link to="/student/exams">
          <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
            View Assigned Exams
          </Button>
        </Link>
      </div>

      {/* 2. Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DashboardCard
          title="Assigned Exams"
          value="02"
          subtitle="1 live now, 1 scheduled"
          icon={FileText}
          accentColor="blue"
        />
        <DashboardCard
          title="Completed Exams"
          value="04"
          subtitle="All passed with verified status"
          icon={Award}
          accentColor="emerald"
        />
        <DashboardCard
          title="Integrity Record"
          value="96%"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignedExams.map((exam) => (
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
                      exam.isLive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {exam.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{exam.title}</h3>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Duration: {exam.duration}
                </span>
              </div>

              {exam.isLive ? (
                <Link to={`/student/exam/${exam.id}`}>
                  <Button variant="primary" size="sm" className="w-full text-xs font-bold">
                    Start Examination
                  </Button>
                </Link>
              ) : (
                <Button variant="secondary" size="sm" className="w-full text-xs" disabled>
                  Locked
                </Button>
              )}
            </div>
          ))}
        </div>
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
          {/* Periodic Table Card */}
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

      {/* 5. Completed Exams */}
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
          {recentSubmissions.map((sub) => (
            <div key={sub.id} className="py-3.5 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 block">{sub.title}</span>
                <span className="text-slate-400 font-mono">{sub.courseCode} • {sub.date}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono font-bold text-slate-900 text-sm">{sub.score}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                  {sub.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
