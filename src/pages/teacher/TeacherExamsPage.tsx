import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Plus, Edit3, ShieldCheck, Clock, Users, Calendar } from 'lucide-react';

export const TeacherExamsPage: React.FC = () => {
  const exams = [
    {
      id: 'exam-act-001',
      title: 'Organic Chemistry — Unit Test',
      courseCode: 'CHEM-302',
      class: '12-A',
      date: 'Today, 22 Aug 2026',
      duration: '60 min',
      studentsCount: 42,
      status: 'Live Now',
      isLive: true,
    },
    {
      id: 'exam-act-002',
      title: 'Inorganic Chemistry — Mid Term',
      courseCode: 'CHEM-301',
      class: '12-B',
      date: '23 Aug 2026',
      duration: '90 min',
      studentsCount: 38,
      status: 'Scheduled',
      isLive: false,
    },
    {
      id: 'exam-act-003',
      title: 'Physical Chemistry — Quiz 3',
      courseCode: 'CHEM-201',
      class: '11-A',
      date: '25 Aug 2026',
      duration: '45 min',
      studentsCount: 45,
      status: 'Scheduled',
      isLive: false,
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            My Examinations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your scheduled chemistry tests, active sessions, and student proctoring records.
          </p>
        </div>

        <Link to="/teacher/create-exam">
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Create Exam
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {exams.map((exam) => (
          <div
            key={exam.id}
            className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition-all"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                  {exam.courseCode} • Class {exam.class}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    exam.isLive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {exam.status}
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900">
                {exam.title}
              </h2>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {exam.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {exam.duration}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {exam.studentsCount} Students
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
              <Link to={`/teacher/create-exam?id=${exam.id}`}>
                <Button variant="secondary" size="sm" leftIcon={<Edit3 className="w-3.5 h-3.5" />}>
                  Edit
                </Button>
              </Link>
              <Link to={`/teacher/evidence-review?exam=${exam.id}`}>
                <Button variant="primary" size="sm" leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}>
                  Evidence & Attempts
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
