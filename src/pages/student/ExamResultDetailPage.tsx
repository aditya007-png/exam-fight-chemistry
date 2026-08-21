import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardCard } from '../../components/common/DashboardCard';
import { Button } from '../../components/common/Button';
import { MOCK_SAVED_SUBMISSIONS, MOCK_EXAM_QUESTIONS } from '../../lib/mockExamData';
import {
  Award,
  Clock,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  Atom,
  BarChart3,
} from 'lucide-react';

export const ExamResultDetailPage: React.FC = () => {
  const { resultId } = useParams<{ resultId: string }>();

  // Fetch or fallback to saved submission
  const result =
    (resultId && MOCK_SAVED_SUBMISSIONS[resultId]) ||
    MOCK_SAVED_SUBMISSIONS['res-001'] || {
      id: 'res-default',
      examId: 'exam-act-001',
      examTitle: 'Thermodynamics & Gibbs Free Energy Assessment',
      courseCode: 'CHEM-302',
      studentId: 'demo-student-001',
      studentName: 'Alex Chen',
      score: 16,
      totalMarks: 20,
      percentage: 80,
      grade: 'A',
      passed: true,
      submittedAt: new Date().toISOString(),
      totalTimeSpentSeconds: 3420,
      questionsCorrect: 4,
      questionsIncorrect: 1,
      questionsUnattempted: 0,
      integrityScore: 96,
      proctoringFlagsCount: 0,
      domainBreakdown: [
        { domain: 'Physical Chemistry', score: 8, total: 8, percentage: 100 },
        { domain: 'Organic Chemistry', score: 4, total: 8, percentage: 50 },
        { domain: 'Inorganic Chemistry', score: 4, total: 4, percentage: 100 },
      ],
      questionResults: [],
    };

  const sampleQuestions = MOCK_EXAM_QUESTIONS['exam-act-001'];

  const formatMinutes = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s}s`;
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6">
      {/* 1. Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-surface-200 via-surface-100 to-emerald-950/20 border border-slate-700/80 p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-chem-300 bg-chem-500/10 px-2 py-0.5 rounded border border-chem-500/20">
                {result.courseCode}
              </span>
              <span className="text-xs text-slate-400">Official Examination Transcript</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {result.examTitle}
            </h1>
            <p className="text-xs text-slate-400">Candidate: {result.studentName} • Submitted on {new Date(result.submittedAt).toLocaleDateString()}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/student/certificate/${result.id}`}>
              <Button variant="glow" size="sm" leftIcon={<Award className="w-4 h-4 text-amber-300" />}>
                View Certificate of Mastery
              </Button>
            </Link>

            <Link to="/student/dashboard">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Final Score"
          value={`${result.score}/${result.totalMarks}`}
          subtitle={`${result.percentage}% Score (${result.grade})`}
          icon={Award}
          accentColor="emerald"
        />
        <DashboardCard
          title="Time Elapsed"
          value={formatMinutes(result.totalTimeSpentSeconds)}
          subtitle="Total examination duration"
          icon={Clock}
          accentColor="cyan"
        />
        <DashboardCard
          title="Integrity Score"
          value={`${result.integrityScore}%`}
          subtitle={`${result.proctoringFlagsCount} Proctoring Flags`}
          icon={ShieldCheck}
          accentColor="indigo"
        />
        <DashboardCard
          title="Evaluation Status"
          value={result.passed ? 'PASSED' : 'NEEDS REVIEW'}
          subtitle="Official grading confirmed"
          icon={CheckCircle2}
          accentColor={result.passed ? 'emerald' : 'rose'}
        />
      </div>

      {/* 3. Chemistry Domain Breakdown */}
      <div className="rounded-2xl bg-surface-100 border border-slate-700/80 p-6 space-y-4 shadow-xl">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-chem-400" />
          Chemistry Topic Mastery Breakdown
        </h2>

        <div className="space-y-4">
          {result.domainBreakdown.map((d, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">{d.domain}</span>
                <span className="font-mono text-chem-300">
                  {d.score}/{d.total} pts ({d.percentage.toFixed(0)}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-chem-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${d.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Question-by-Question Review */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Atom className="w-5 h-5 text-indigo-400" />
          Comprehensive Question & Rubric Review
        </h2>

        <div className="space-y-4">
          {sampleQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="rounded-2xl bg-surface-100 border border-slate-700/80 p-6 space-y-4 shadow-md"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-white bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                    Question #{idx + 1}
                  </span>
                  <span className="text-xs text-chem-300 bg-chem-500/10 px-2 py-0.5 rounded border border-chem-500/20">
                    {q.domain} • {q.topic}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  +{q.marks} / {q.marks} Marks
                </span>
              </div>

              <h3 className="text-sm font-semibold text-white leading-relaxed">
                {q.questionText}
              </h3>

              {q.chemicalEquation && (
                <div className="p-3 rounded-lg bg-surface-200 border border-slate-800 text-center font-mono text-xs text-chem-300 font-bold">
                  {q.chemicalEquation}
                </div>
              )}

              {/* Options Breakdown if MCQ */}
              {q.options && (
                <div className="space-y-1.5">
                  {q.options.map((opt) => (
                    <div
                      key={opt.id}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                        opt.isCorrect
                          ? 'bg-emerald-950/30 border-emerald-500/60 text-emerald-200 font-semibold'
                          : 'bg-surface-200/50 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">{opt.label})</span>
                        <span>{opt.text}</span>
                      </div>
                      {opt.isCorrect && (
                        <span className="text-emerald-400 font-bold text-[10px] uppercase">
                          Correct Answer Key
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Chemical Rationale */}
              <div className="p-4 rounded-xl bg-surface-200/70 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                <span className="text-chem-400 font-bold text-[11px] uppercase tracking-wider block">
                  Detailed Chemistry Rationale:
                </span>
                <p className="leading-relaxed">{q.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
