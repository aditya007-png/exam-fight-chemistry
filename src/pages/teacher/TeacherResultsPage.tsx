import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchTeacherResults } from '../../lib/resultService';
import { fetchExamsFromDB, getStoredExams } from '../../lib/examService';
import { fetchClassesFromDB, getStoredClasses, getStoredSections } from '../../lib/classService';
import { ExamResult } from '../../types/result';
import { ExamItem } from '../../types/dashboard';
import { AcademicClass, AcademicSection } from '../../types/academic';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import {
  Award,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export const TeacherResultsPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const teacherId = user?.id || '';

  const [searchParams, setSearchParams] = useSearchParams();
  const initialExamId = searchParams.get('exam') || 'all';

  const [results, setResults] = useState<ExamResult[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);

  // Filter States
  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Result for Question Breakdown Modal
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (teacherId) {
      const [, , resList] = await Promise.all([
        fetchExamsFromDB({ teacherId }),
        fetchClassesFromDB(teacherId),
        fetchTeacherResults({
          teacherId,
          examId: selectedExamId,
          classId: selectedClassId,
          sectionId: selectedSectionId,
        }),
      ]);
      setExams(getStoredExams().filter((e) => !e.teacherId || e.teacherId === teacherId));
      setClasses(getStoredClasses(teacherId));
      setResults(resList);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [teacherId, selectedExamId, selectedClassId, selectedSectionId, location.key]);

  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId);
    setSearchParams(examId !== 'all' ? { exam: examId } : {});
  };

  // Filtered Sections based on selected class
  const availableSections: AcademicSection[] = selectedClassId !== 'all' ? getStoredSections(selectedClassId) : [];

  const filteredResults = results.filter((r) => {
    const matchesSearch =
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.examTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Calculate Cohort Stats
  const totalSubmissions = filteredResults.length;
  const avgPercentage =
    totalSubmissions > 0
      ? Math.round(filteredResults.reduce((sum, r) => sum + r.percentage, 0) / totalSubmissions)
      : 0;
  const highestScore =
    totalSubmissions > 0
      ? Math.max(...filteredResults.map((r) => r.obtainedMarks))
      : 0;
  const passingCount = filteredResults.filter((r) => r.percentage >= 50).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-1">
            <Award className="w-3.5 h-3.5" />
            <span>Grading Ledger & Official Transcripts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Student Marks & Results
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time evaluated scores, question-wise candidate answers, and cohort grade performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={loadData}
          >
            Refresh
          </Button>
          <Link to="/teacher/evidence-review">
            <Button variant="secondary" size="sm" leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-blue-600" />}>
              Evidence Review
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Stat Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-card space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Evaluated Candidates</span>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">
            {totalSubmissions.toString().padStart(2, '0')}
          </p>
          <span className="text-[11px] text-slate-400">Total submitted tests</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-card space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cohort Average</span>
          <p className="text-2xl font-extrabold text-blue-700 font-mono">
            {avgPercentage}%
          </p>
          <span className="text-[11px] text-slate-400">Mean evaluation score</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-card space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Highest Score</span>
          <p className="text-2xl font-extrabold text-emerald-700 font-mono">
            {highestScore} pts
          </p>
          <span className="text-[11px] text-slate-400">Top performance</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-card space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Passing Rate</span>
          <p className="text-2xl font-extrabold text-indigo-700 font-mono">
            {totalSubmissions > 0 ? Math.round((passingCount / totalSubmissions) * 100) : 0}%
          </p>
          <span className="text-[11px] text-slate-400">{passingCount} of {totalSubmissions} passed</span>
        </div>
      </div>

      {/* 3. Filter Bar (Exam, Class, Section) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-card grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Search */}
        <div className="sm:col-span-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Exam Filter */}
        <div className="sm:col-span-3">
          <select
            value={selectedExamId}
            onChange={(e) => handleExamChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Examinations ({exams.length})</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title} ({ex.courseCode})
              </option>
            ))}
          </select>
        </div>

        {/* Class Filter */}
        <div className="sm:col-span-3">
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setSelectedSectionId('all');
            }}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Classes ({classes.length})</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.classCode})
              </option>
            ))}
          </select>
        </div>

        {/* Section Filter */}
        <div className="sm:col-span-2">
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            disabled={selectedClassId === 'all'}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="all">All Sections</option>
            {availableSections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Results Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Graded Submissions ({filteredResults.length})
          </h2>
        </div>

        {filteredResults.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <Award className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No student results found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              When students complete and submit examinations assigned to your classes, their evaluated scores will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="pb-3">Student Name</th>
                  <th className="pb-3">Exam & Class</th>
                  <th className="pb-3">Section</th>
                  <th className="pb-3 text-center">Marks</th>
                  <th className="pb-3 text-center">Percentage</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredResults.map((res) => {
                  const passed = res.percentage >= 50;
                  return (
                    <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block">{res.studentName}</span>
                          <span className="text-[10px] font-mono text-slate-500">{res.studentEmail}</span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-900 block truncate max-w-[200px]">
                            {res.examTitle}
                          </span>
                          <span className="text-[10px] text-slate-500">{res.className}</span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                          {res.sectionName}
                        </span>
                      </td>
                      <td className="py-3.5 text-center font-mono font-extrabold text-sm text-slate-900">
                        {res.obtainedMarks} / {res.totalMarks}
                      </td>
                      <td className="py-3.5 text-center font-mono font-bold">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs ${
                            passed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {res.percentage}%
                        </span>
                      </td>
                      <td className="py-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {res.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-xs py-1 px-2.5"
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => setSelectedResult(res)}
                          >
                            View Attempt
                          </Button>
                          <Link to={`/teacher/evidence-review?exam=${res.examId}&attempt=${res.attemptId}`}>
                            <Button variant="secondary" size="sm" className="text-xs py-1 px-2.5" leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}>
                              Evidence
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Question-wise Attempt Review Modal */}
      {selectedResult && (
        <Modal
          isOpen={!!selectedResult}
          onClose={() => setSelectedResult(null)}
          title={`Candidate Evaluation: ${selectedResult.studentName}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            {/* Header Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Exam</span>
                <strong className="text-slate-900 truncate block">{selectedResult.examTitle}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Class / Cohort</span>
                <span className="text-slate-800 font-semibold truncate block">
                  {selectedResult.className} ({selectedResult.sectionName})
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Score</span>
                <span className="text-slate-900 font-bold font-mono text-sm block">
                  {selectedResult.obtainedMarks} / {selectedResult.totalMarks} ({selectedResult.percentage}%)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Submission Time</span>
                <span className="text-slate-800 font-mono block">
                  {new Date(selectedResult.submittedAt).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Question Breakdown List */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">
                Question-Wise Breakdown ({selectedResult.questionResults.length} Questions)
              </h3>

              {selectedResult.questionResults.length === 0 ? (
                <div className="p-6 text-center text-slate-400 border border-dashed rounded-xl">
                  No question-wise breakdown available for this attempt.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {selectedResult.questionResults.map((q, idx) => (
                    <div
                      key={q.questionId || idx}
                      className={`p-3.5 rounded-xl border space-y-2 ${
                        q.isCorrect
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-rose-50/40 border-rose-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                              q.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            Q{q.questionNumber || idx + 1}
                          </span>
                          <span className="font-bold text-slate-900">{q.questionText}</span>
                        </div>

                        <span
                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md ${
                            q.isCorrect
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {q.obtainedMarks} / {q.marks} Marks
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                        <div className="p-2 rounded-lg bg-white border border-slate-200">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Student Response
                          </span>
                          <span
                            className={`font-bold flex items-center gap-1 mt-0.5 ${
                              q.isCorrect ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {q.isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            {q.studentAnswer}
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-white border border-slate-200">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Correct Answer Key
                          </span>
                          <span className="font-bold text-emerald-800 flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            {q.correctAnswer}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="font-mono text-[10px] text-slate-400">
                Attempt ID: {selectedResult.attemptId}
              </span>
              <div className="flex gap-2">
                <Link to={`/teacher/evidence-review?exam=${selectedResult.examId}&attempt=${selectedResult.attemptId}`}>
                  <Button variant="primary" size="sm" leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}>
                    Open Evidence Review
                  </Button>
                </Link>
                <Button variant="secondary" size="sm" onClick={() => setSelectedResult(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
