import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getExamAttemptsList } from '../../lib/evidenceService';
import { ExamAttempt } from '../../types/evidence';
import { Button } from '../../components/common/Button';
import {
  Video,
  ArrowLeft,
  Search,
} from 'lucide-react';

export const ExamAttemptsListPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const activeExamId = examId || 'exam-act-001';

  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getExamAttemptsList(activeExamId).then((data) => {
      setAttempts(data);
    });
  }, [activeExamId]);

  const filteredAttempts = attempts.filter(
    (att) =>
      att.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.studentEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* 1. Header Banner */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Exam Attempts & Submissions
            </span>
            <span className="text-xs text-slate-500">Organic & Physical Chemistry</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Student Attempts & Room-Scan Evidence
          </h1>
          <p className="text-xs text-slate-500">Inspect candidate 360° room scans, video evidence, and proctoring telemetry</p>
        </div>

        <Link to="/teacher/dashboard">
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Dashboard
          </Button>
        </Link>
      </div>

      {/* 2. Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-card">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidate name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <span className="text-xs font-mono text-slate-500">
          Showing {filteredAttempts.length} Candidate Attempts
        </span>
      </div>

      {/* 3. Attempts Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-4">Candidate</th>
              <th className="py-3.5 px-4">Attempt ID</th>
              <th className="py-3.5 px-4">360° Room-Scan</th>
              <th className="py-3.5 px-4">Integrity Score</th>
              <th className="py-3.5 px-4">Exam Score</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Evidence Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredAttempts.map((att) => (
              <tr key={att.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-4 font-bold text-slate-900">
                  <div>{att.studentName}</div>
                  <div className="text-[11px] text-slate-400 font-mono font-normal">{att.studentEmail}</div>
                </td>
                <td className="py-4 px-4 font-mono text-slate-500">{att.id}</td>
                <td className="py-4 px-4">
                  {att.roomScanCompleted ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Video className="w-3 h-3 text-emerald-600" />
                      Recorded & Encrypted
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[10px]">Pending</span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded-full text-[11px] ${
                      (att.integrityScore || 100) >= 80
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                        : 'text-rose-700 bg-rose-50 border border-rose-200'
                    }`}
                  >
                    {att.integrityScore}%
                  </span>
                </td>
                <td className="py-4 px-4 font-mono font-bold text-blue-700">
                  {att.score}/{att.totalMarks}
                </td>
                <td className="py-4 px-4">
                  <span className="capitalize font-medium text-slate-700">{att.status}</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <Link to={`/teacher/exam/${activeExamId}/attempts/${att.id}/evidence`}>
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Video className="w-3.5 h-3.5" />}
                    >
                      Watch 360° Evidence
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
