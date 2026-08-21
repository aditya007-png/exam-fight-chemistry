import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getAllStudentRequests,
  grantExamRestart,
  rejectExamRestart,
  StudentTeacherRequest,
} from '../../lib/evidenceService';
import { Button } from '../../components/common/Button';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RotateCcw,
  ShieldAlert,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export const TeacherRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<StudentTeacherRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'granted' | 'rejected'>('all');
  const [selectedNote, setSelectedNote] = useState<{ id: string; note: string } | null>(null);

  const loadRequests = async () => {
    const data = await getAllStudentRequests();
    setRequests(data);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleGrant = async (req: StudentTeacherRequest) => {
    await grantExamRestart(req.attemptId, selectedNote?.id === req.id ? selectedNote.note : 'Approved by instructor.');
    setSelectedNote(null);
    await loadRequests();
  };

  const handleReject = async (req: StudentTeacherRequest) => {
    await rejectExamRestart(req.attemptId, selectedNote?.id === req.id ? selectedNote.note : 'Declined following integrity review.');
    setSelectedNote(null);
    await loadRequests();
  };

  // Filtered requests
  const filteredRequests = requests.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesSearch =
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.examTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const grantedCount = requests.filter((r) => r.status === 'granted').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-1">
            <Inbox className="w-3.5 h-3.5" />
            <span>Student Communications & Appeals</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Student Requests Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Review exam restart requests, tab-switch appeals, and candidate inquiries in one place.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/teacher/evidence-review">
            <Button variant="secondary" size="sm" leftIcon={<ExternalLink className="w-4 h-4" />}>
              Open Evidence Review
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Overview Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-card space-y-1">
          <span className="text-slate-500 font-medium block">Total Inquiries</span>
          <span className="text-2xl font-black text-slate-900 font-mono block">{requests.length}</span>
        </div>
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-card space-y-1">
          <span className="text-amber-700 font-bold block flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Pending Actions
          </span>
          <span className="text-2xl font-black text-amber-900 font-mono block">{pendingCount}</span>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-card space-y-1">
          <span className="text-emerald-700 font-bold block flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Granted Restarts
          </span>
          <span className="text-2xl font-black text-emerald-900 font-mono block">{grantedCount}</span>
        </div>
        <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 shadow-card space-y-1">
          <span className="text-rose-700 font-bold block flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Declined Appeals
          </span>
          <span className="text-2xl font-black text-rose-900 font-mono block">{rejectedCount}</span>
        </div>
      </div>

      {/* 3. Search & Status Filter Bar */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-card flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student, exam, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs font-semibold">
          {[
            { id: 'all', label: `All (${requests.length})` },
            { id: 'pending', label: `Pending (${pendingCount})` },
            { id: 'granted', label: `Approved (${grantedCount})` },
            { id: 'rejected', label: `Declined (${rejectedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Requests List */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 space-y-2">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No student requests found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no student restart requests matching your current filter.
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isPending = req.status === 'pending';
            const isGranted = req.status === 'granted';

            return (
              <div
                key={req.id}
                className={`rounded-2xl bg-white border p-5 shadow-card transition-all space-y-4 ${
                  isPending
                    ? 'border-amber-300 ring-2 ring-amber-400/10'
                    : isGranted
                    ? 'border-emerald-200'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-sm shrink-0">
                      {req.studentName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-slate-900">
                          {req.studentName}
                        </h3>
                        <span className="text-[11px] font-mono text-slate-400">
                          ({req.className || 'Class 12-A'})
                        </span>
                        {/* Status Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isPending
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : isGranted
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {req.studentEmail} • Exam:{' '}
                        <strong className="text-slate-800">{req.examTitle}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400 font-mono shrink-0">
                    <span>Requested: {new Date(req.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Violation Reason & Student Explanation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100 space-y-1">
                    <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Violation Context
                    </span>
                    <p className="text-xs font-semibold text-rose-950">
                      {req.violationContext}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> Student Explanation
                    </span>
                    <p className="text-xs text-slate-700 italic">
                      "{req.studentNote || 'No additional note provided.'}"
                    </p>
                  </div>
                </div>

                {/* Teacher Note if Reviewed */}
                {req.teacherNote && (
                  <div className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 text-xs text-blue-950 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span><strong>Instructor Decision Note:</strong> {req.teacherNote}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-slate-100">
                  <Link
                    to={`/teacher/evidence-review?attempt=${req.attemptId}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Review Proctoring Recordings & Timeline
                  </Link>

                  {isPending ? (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        variant="danger"
                        size="sm"
                        className="text-xs font-bold px-3"
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
                        onClick={() => handleReject(req)}
                      >
                        Decline
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4"
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                        onClick={() => handleGrant(req)}
                      >
                        Approve & Grant Restart
                      </Button>
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      {isGranted ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Candidate Unlocked for New Attempt
                        </span>
                      ) : (
                        <span className="text-rose-700 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          Appeal Declined
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
