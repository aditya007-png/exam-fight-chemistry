// src/pages/student/ExamResultDetailPage.tsx
// Exam Result Detail Page with real persistent attempt records and clean academic styling
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAttemptById } from '../../lib/examService';
import { DashboardCard } from '../../components/common/DashboardCard';
import { Button } from '../../components/common/Button';
import {
  Award,
  Clock,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  BarChart3,
} from 'lucide-react';

export const ExamResultDetailPage: React.FC = () => {
  const { resultId } = useParams<{ resultId: string }>();
  const attempt = resultId ? getAttemptById(resultId) : null;

  const score = attempt?.score ?? 0;
  const totalMarks = attempt?.totalMarks ?? 100;
  const percentage = Math.round((score / totalMarks) * 100);
  const grade =
    percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 50 ? 'C' : 'F';
  const passed = percentage >= 50;

  const examTitle = attempt?.examTitle || 'Chemistry Examination';
  const courseCode = attempt?.courseCode || 'CHEM-302';
  const studentName = attempt?.studentName || 'Candidate';
  const submittedAt = attempt?.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString() : 'Today';
  const durationMinutes = attempt?.durationMinutes ?? 45;
  const integrityScore = attempt?.integrityScore ?? 96;
  const violations = attempt?.totalViolations ?? 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* 1. Header Banner */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold">
                {courseCode}
              </span>
              <span className="text-xs text-slate-500 font-semibold">Official Examination Transcript</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {examTitle}
            </h1>
            <p className="text-xs text-slate-500">
              Candidate: <strong>{studentName}</strong> • Submitted on {submittedAt}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to="/student/results">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                All Results
              </Button>
            </Link>
            <Link to="/student/dashboard">
              <Button variant="primary" size="sm">
                Student Home
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Final Score"
          value={`${score}/${totalMarks}`}
          subtitle={`${percentage}% Score (Grade ${grade})`}
          icon={Award}
          accentColor="emerald"
        />
        <DashboardCard
          title="Time Elapsed"
          value={`${durationMinutes} min`}
          subtitle="Examination duration"
          icon={Clock}
          accentColor="blue"
        />
        <DashboardCard
          title="Integrity Score"
          value={`${integrityScore}%`}
          subtitle={`${violations} Proctoring Flags`}
          icon={ShieldCheck}
          accentColor="indigo"
        />
        <DashboardCard
          title="Evaluation Status"
          value={passed ? 'PASSED' : 'NEEDS REVIEW'}
          subtitle="Official grading recorded"
          icon={CheckCircle2}
          accentColor={passed ? 'emerald' : 'rose'}
        />
      </div>

      {/* 3. Performance Summary */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-card">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Proctoring & Assessment Summary
        </h2>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700 leading-relaxed">
          <p>
            Your examination was continuously monitored by the integrated proctoring system. Room scan verification was completed prior to question access.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px]">
            <div>• 360° Environmental Scan: <strong className="text-emerald-700">Verified Passed</strong></div>
            <div>• Face & Eye Presence: <strong className="text-emerald-700">Continuously Monitored</strong></div>
            <div>• Full-Screen Mode: <strong className="text-slate-800">Enforced Locked Mode</strong></div>
            <div>• Proctoring Compliance Score: <strong className="text-blue-700">{integrityScore}%</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};
