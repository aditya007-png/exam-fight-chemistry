import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { ShieldCheck, Calendar, ArrowRight, Clock } from 'lucide-react';

export const StudentResultsPage: React.FC = () => {
  const completedResults = [
    {
      id: 'res-001',
      examTitle: 'Spectroscopy & Molecular Identification',
      courseCode: 'CHEM-405',
      score: 92,
      totalMarks: 100,
      percentage: 92,
      grade: 'A+',
      passed: true,
      integrityScore: 98,
      submittedAt: '15 Feb 2026',
      duration: '48m',
    },
    {
      id: 'res-002',
      examTitle: 'Thermodynamics & Equilibrium Quiz',
      courseCode: 'CHEM-302',
      score: 84,
      totalMarks: 100,
      percentage: 84,
      grade: 'A',
      passed: true,
      integrityScore: 94,
      submittedAt: '10 Feb 2026',
      duration: '35m',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Examination Results
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View your graded chemistry exam submissions and integrity verification records.
        </p>
      </div>

      <div className="space-y-4">
        {completedResults.map((res) => (
          <div
            key={res.id}
            className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-all"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {res.courseCode}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {res.submittedAt}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {res.duration}
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900">
                {res.examTitle}
              </h2>

              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Integrity Verified ({res.integrityScore}%)
                </span>
                <span className="font-semibold text-slate-700">
                  Grade: <strong className="text-blue-700 font-bold font-mono">{res.grade}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
              <div className="text-right">
                <span className="text-2xl font-extrabold text-slate-900 font-mono block">
                  {res.score}/{res.totalMarks}
                </span>
                <span className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider">
                  Passed ({res.percentage}%)
                </span>
              </div>

              <Link to={`/student/results/${res.id}`}>
                <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Details
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
