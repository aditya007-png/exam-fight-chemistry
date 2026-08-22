import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getExamsForStudent } from '../../lib/examService';
import { getStudentEnrolledSectionIds } from '../../lib/classService';
import { ExamItem } from '../../types/dashboard';
import { Button } from '../../components/common/Button';
import { FileText, Clock, Calendar, ShieldCheck, ArrowRight } from 'lucide-react';

export const StudentExamsPage: React.FC = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<ExamItem[]>([]);

  useEffect(() => {
    if (user?.id) {
      const secIds = getStudentEnrolledSectionIds(user.id);
      setExams(getExamsForStudent(secIds));
    } else {
      setExams([]);
    }
  }, [user?.id]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          My Assigned Examinations
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Access your enrolled chemistry exams and continuous proctored assessments.
        </p>
      </div>

      {exams.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center shadow-card space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No active exams scheduled</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Your instructors have not published any pending chemistry examinations for your cohort yet. Check back when an exam is scheduled.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {exam.courseCode}
                    </span>
                    {exam.className && (
                      <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {exam.className}
                      </span>
                    )}
                    {exam.sectionName && (
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {exam.sectionName}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      exam.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {exam.status === 'active' ? '🟢 Live Now' : 'Scheduled'}
                  </span>
                </div>

                <h2 className="text-base font-bold text-slate-900 leading-snug">
                  {exam.title}
                </h2>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(exam.scheduledStart).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{exam.durationMinutes} Minutes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>{exam.totalQuestions} Questions</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>360° Proctored</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
