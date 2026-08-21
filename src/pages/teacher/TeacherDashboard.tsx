import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DashboardCard } from '../../components/common/DashboardCard';
import { Button } from '../../components/common/Button';
import {
  FileText,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowRight,
  Eye,
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();

  const exams = [
    {
      id: 'exam-act-001',
      name: 'Organic Chemistry — Unit Test',
      class: '12-A',
      studentsCount: 42,
      duration: '60 min',
      status: 'live',
      date: 'Today',
    },
    {
      id: 'exam-act-002',
      name: 'Inorganic Chemistry — Mid Term',
      class: '12-B',
      studentsCount: 38,
      duration: '90 min',
      status: 'scheduled',
      date: 'Tomorrow',
    },
    {
      id: 'exam-act-003',
      name: 'Physical Chemistry — Quiz 3',
      class: '11-A',
      studentsCount: 45,
      duration: '45 min',
      status: 'scheduled',
      date: '25 Aug',
    },
  ];

  const evidenceAlerts = [
    {
      id: 'att-arjun',
      studentName: 'Arjun Mehta',
      examName: 'Physical Chemistry — Quiz 3',
      issue: 'Camera disconnected for 18 seconds',
      status: 'Review Required',
      risk: 'high',
      time: '08:58 AM',
    },
    {
      id: 'att-rahul',
      studentName: 'Rahul Sharma',
      examName: 'Organic Chemistry — Unit Test',
      issue: 'Tab switch detected (3 seconds)',
      status: 'Review',
      risk: 'medium',
      time: '10:44 AM',
    },
    {
      id: 'att-priya',
      studentName: 'Priya Patel',
      examName: 'Inorganic Chemistry — Mid Term',
      issue: '360° Room Scan verified clean',
      status: 'Verified',
      risk: 'low',
      time: '09:15 AM',
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* 1. Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Good Morning, {user?.full_name?.split(' ')[0] || 'Aditya'}! 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of your active examinations, candidate attempts, and proctoring evidence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/teacher/create-exam">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Create Exam
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. 4 Simplified Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Exams"
          value="06"
          subtitle="All terms"
          icon={FileText}
          accentColor="blue"
        />
        <DashboardCard
          title="Active Exams"
          value="02"
          subtitle="In progress"
          icon={Radio}
          accentColor="emerald"
        />
        <DashboardCard
          title="Completed Exams"
          value="32"
          subtitle="Graded & recorded"
          icon={CheckCircle2}
          accentColor="indigo"
        />
        <DashboardCard
          title="Evidence Requiring Review"
          value="03"
          subtitle="Flagged attempts"
          icon={AlertTriangle}
          accentColor="amber"
        />
      </div>

      {/* 3. Examinations List */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Examinations
          </h2>
          <Link to="/teacher/exams" className="text-xs font-bold text-blue-600 hover:text-blue-700">
            View All Exams →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="pb-3">Exam Name</th>
                <th className="pb-3">Class</th>
                <th className="pb-3">Students</th>
                <th className="pb-3">Duration</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {exams.map((ex) => (
                <tr key={ex.id} className="hover:bg-slate-50">
                  <td className="py-3.5 font-bold text-slate-900">{ex.name}</td>
                  <td className="py-3.5 text-slate-600">{ex.class}</td>
                  <td className="py-3.5 text-slate-600 font-mono">{ex.studentsCount}</td>
                  <td className="py-3.5 text-slate-600 font-mono">{ex.duration}</td>
                  <td className="py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ex.status === 'live'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {ex.status === 'live' ? '🟢 Live' : 'Scheduled'}
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
      </div>

      {/* 4. Evidence Requiring Review */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Evidence Requiring Review
            </h2>
            <p className="text-xs text-slate-500">
              Recent proctoring events and candidate environmental flags
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

        <div className="divide-y divide-slate-100">
          {evidenceAlerts.map((alt) => (
            <div
              key={alt.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{alt.studentName}</span>
                  <span className="text-[11px] text-slate-500">• {alt.examName}</span>
                </div>
                <p className="text-slate-600">{alt.issue}</p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    alt.risk === 'high'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : alt.risk === 'medium'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {alt.status}
                </span>

                <Link to={`/teacher/evidence-review?attempt=${alt.id}`}>
                  <Button variant="secondary" size="sm" className="text-xs py-1 px-2.5" leftIcon={<Eye className="w-3 h-3 text-blue-600" />}>
                    Review
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Student Requests & Restart Inquiries Card */}
      <div className="rounded-2xl bg-white border border-amber-200 shadow-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pending Student Restart Requests
              </h2>
              <p className="text-xs text-slate-500">
                Candidates requesting approval to retake locked or tab-switched examinations
              </p>
            </div>
          </div>
          <Link
            to="/teacher/requests"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            <span>Open Requests Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
            <div>
              <strong className="text-slate-900 block">Arjun Mehta (Class 12-A)</strong>
              <span className="text-[11px] text-amber-900">Tab Switch Appeal • Organic Chemistry</span>
            </div>
            <Link to="/teacher/requests">
              <Button variant="primary" size="sm" className="text-[11px] bg-amber-600 hover:bg-amber-700 text-white font-bold py-1">
                Review & Grant
              </Button>
            </Link>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
            <div>
              <strong className="text-slate-900 block">Sneha Reddy (Class 12-B)</strong>
              <span className="text-[11px] text-amber-900">Face Timeout Appeal • Inorganic Chem</span>
            </div>
            <Link to="/teacher/requests">
              <Button variant="primary" size="sm" className="text-[11px] bg-amber-600 hover:bg-amber-700 text-white font-bold py-1">
                Review & Grant
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
