import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { FileText, Clock, Calendar, ShieldCheck, ArrowRight } from 'lucide-react';

export const StudentExamsPage: React.FC = () => {
  const exams = [
    {
      id: 'exam-act-001',
      title: 'Organic Chemistry — Unit Test',
      courseCode: 'CHEM-302',
      date: 'Today, 22 Aug 2026',
      duration: '60 Minutes',
      status: 'Live Now',
      questionsCount: 5,
      isAvailable: true,
    },
    {
      id: 'exam-act-002',
      title: 'Inorganic Chemistry — Mid Term',
      courseCode: 'CHEM-301',
      date: 'Tomorrow, 23 Aug 2026',
      duration: '90 Minutes',
      status: 'Scheduled',
      questionsCount: 25,
      isAvailable: false,
    },
    {
      id: 'exam-act-003',
      title: 'Physical Chemistry — Quiz 3',
      courseCode: 'CHEM-201',
      date: '25 Aug 2026',
      duration: '45 Minutes',
      status: 'Scheduled',
      questionsCount: 15,
      isAvailable: false,
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          My Examinations
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Access your assigned chemistry exams and continuous proctored assessments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exams.map((exam) => (
          <div
            key={exam.id}
            className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                  {exam.courseCode}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    exam.isAvailable
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {exam.status}
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900 leading-snug">
                {exam.title}
              </h2>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{exam.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{exam.duration}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>{exam.questionsCount} Questions</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>360° Proctored</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              {exam.isAvailable ? (
                <Link to={`/student/exam/${exam.id}`} className="block">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full font-bold text-xs"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Start Examination
                  </Button>
                </Link>
              ) : (
                <Button variant="secondary" size="md" className="w-full text-xs" disabled>
                  Locked (Opens on Date)
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
