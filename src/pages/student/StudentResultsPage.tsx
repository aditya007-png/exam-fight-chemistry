// src/pages/student/StudentResultsPage.tsx
// Student Examination Results with real persistent result records
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchStudentResults } from '../../lib/resultService';
import { ExamResult } from '../../types/result';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ShieldCheck, Calendar, ArrowRight, Award, Eye } from 'lucide-react';

export const StudentResultsPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const studentId = user?.id || '';

  const [results, setResults] = useState<ExamResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);

  const loadResults = async () => {
    if (studentId) {
      const list = await fetchStudentResults(studentId);
      setResults(list);
    }
  };

  useEffect(() => {
    loadResults();
  }, [studentId, location.key]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Examination Results & Transcripts
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View your submitted chemistry exam scores, question-wise evaluation, and official transcripts.
        </p>
      </div>

      {results.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center shadow-card space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No examination results recorded yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            When you complete and submit an examination, your evaluated marks, percentage, and answer key breakdown will appear here.
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
            const percentage = res.percentage;
            const grade =
              percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 50 ? 'C' : 'F';
            const passed = percentage >= 50;

            return (
              <div
                key={res.id}
                className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {res.className} • {res.sectionName}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(res.submittedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900">
                    {res.examTitle}
                  </h2>

                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Status: {res.status}
                    </span>
                    <span className="font-semibold text-slate-700">
                      Grade: <strong className="text-blue-700 font-bold font-mono">{grade}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-slate-900 font-mono block">
                      {res.obtainedMarks} / {res.totalMarks}
                    </span>
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        passed ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {percentage}% ({passed ? 'PASSED' : 'NEEDS IMPROVEMENT'})
                    </span>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Eye className="w-4 h-4" />}
                    onClick={() => setSelectedResult(res)}
                  >
                    View Breakdown
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Student Question Breakdown Modal */}
      {selectedResult && (
        <Modal
          isOpen={!!selectedResult}
          onClose={() => setSelectedResult(null)}
          title={`Exam Results: ${selectedResult.examTitle}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Score</span>
                <strong className="text-slate-900 text-sm font-mono">{selectedResult.obtainedMarks} / {selectedResult.totalMarks}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Percentage</span>
                <strong className="text-blue-700 text-sm font-mono">{selectedResult.percentage}%</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Submitted</span>
                <span className="text-slate-800 font-mono">{new Date(selectedResult.submittedAt).toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {selectedResult.questionResults.map((q, idx) => (
                <div
                  key={q.questionId || idx}
                  className={`p-3 rounded-xl border space-y-1.5 ${
                    q.isCorrect ? 'bg-emerald-50/40 border-emerald-200' : 'bg-rose-50/40 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      Q{q.questionNumber || idx + 1}. {q.questionText}
                    </span>
                    <span className="font-mono font-bold text-[11px] text-slate-700">
                      {q.obtainedMarks}/{q.marks}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Your Answer:</span>
                      <span className={q.isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                        {q.studentAnswer}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Correct Answer:</span>
                      <span className="text-emerald-800 font-bold">{q.correctAnswer}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelectedResult(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
