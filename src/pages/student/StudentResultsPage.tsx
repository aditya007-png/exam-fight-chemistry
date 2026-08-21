// src/pages/student/StudentResultsPage.tsx
// Student Examination Results with real persistent attempt records
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAttemptsForStudent } from '../../lib/examService';
import { ExamAttempt } from '../../types/evidence';
import { Button } from '../../components/common/Button';
import { ShieldCheck, Calendar, ArrowRight, Clock, Award } from 'lucide-react';

export const StudentResultsPage: React.FC = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<ExamAttempt[]>([]);

  useEffect(() => {
    if (user?.email) {
      const studentAttempts = getAttemptsForStudent(user.email).filter(
        (a) => a.status === 'submitted'
      );
      setResults(studentAttempts);
    }
  }, [user?.email]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Examination Results & Grades
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View your submitted chemistry exam scores, grades, and proctoring integrity verification records.
        </p>
      </div>

      {results.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center shadow-card space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No examination results recorded yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Your completed and submitted chemistry examinations will appear here with performance and integrity scores.
          </p>
          <Link to="/student/exams" className="inline-block pt-1">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              View Assigned Exams
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((res) => {
            const percentage = Math.round(((res.score || 0) / (res.totalMarks || 100)) * 100);
            const grade =
              percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 50 ? 'C' : 'F';

            return (
              <div
                key={res.id}
                className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {res.courseCode}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(res.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {res.durationMinutes}m
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
                      Grade: <strong className="text-blue-700 font-bold font-mono">{grade}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-slate-900 font-mono block">
                      {res.score}/{res.totalMarks}
                    </span>
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        percentage >= 50 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {percentage >= 50 ? `Passed (${percentage}%)` : `Failed (${percentage}%)`}
                    </span>
                  </div>

                  <Link to={`/student/results/${res.id}`}>
                    <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Details
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
