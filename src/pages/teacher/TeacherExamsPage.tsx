import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStoredExams, deleteExam, fetchExamsFromDB } from '../../lib/examService';
import { ExamItem } from '../../types/dashboard';
import { Button } from '../../components/common/Button';
import { Plus, ShieldCheck, Clock, Users, Calendar, Trash2, FileText } from 'lucide-react';

export const TeacherExamsPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const teacherId = user?.id || '';
  const [exams, setExams] = useState<ExamItem[]>([]);

  const loadExams = async () => {
    let list = getStoredExams();
    if (teacherId) {
      list = list.filter((e) => !e.teacherId || e.teacherId === teacherId);
    }
    setExams(list);

    if (teacherId) {
      const dbExams = await fetchExamsFromDB({ teacherId });
      if (dbExams.length > 0) {
        setExams(dbExams);
      }
    }
  };

  useEffect(() => {
    loadExams();
  }, [teacherId, location.key]);

  const handleDelete = async (examId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete examination "${title}"?`)) {
      await deleteExam(examId);
      loadExams();
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            My Examinations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your chemistry tests, active proctored sessions, and candidate attempts.
          </p>
        </div>

        <Link to="/teacher/create-exam">
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Create Exam
          </Button>
        </Link>
      </div>

      {exams.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center shadow-card space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No examinations created yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Get started by authoring your first chemistry exam with chemical equations, KaTeX formulas, and proctoring settings.
          </p>
          <Link to="/teacher/create-exam" className="inline-block pt-1">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Create New Exam
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                    {exam.courseCode}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      exam.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {exam.status === 'active' ? '🟢 Active & Published' : 'Scheduled'}
                  </span>
                </div>

                <h2 className="text-base font-bold text-slate-900">{exam.title}</h2>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(exam.scheduledStart).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {exam.durationMinutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" /> {exam.totalQuestions} Questions
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-blue-700">
                    Total Marks: {exam.totalMarks}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                <Link to={`/teacher/evidence-review?exam=${exam.id}`}>
                  <Button variant="primary" size="sm" leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}>
                    Evidence & Attempts
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(exam.id, exam.title)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Delete Exam"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
