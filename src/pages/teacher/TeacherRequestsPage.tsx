// src/pages/teacher/TeacherRequestsPage.tsx
// Complete Teacher Requests Review and Action Management with Live Updates
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ExamRequest, RequestStatus } from '../../types/request';
import { fetchTeacherRequests, updateTeacherRequestAction } from '../../lib/requestService';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  FileText,
  Search,
  Bell,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const TeacherRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const teacherId = user?.id || '';

  const [requests, setRequests] = useState<ExamRequest[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRequest, setActiveRequest] = useState<ExamRequest | null>(null);
  const [teacherResponseInput, setTeacherResponseInput] = useState('');
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);
  const [liveNotification, setLiveNotification] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previousCountRef = useRef<number>(0);

  const loadRequests = async () => {
    if (!teacherId) return;
    const data = await fetchTeacherRequests(teacherId);
    setRequests(data);

    // Live alert on incoming request
    const pendingCount = data.filter((r) => r.status === 'PENDING').length;
    if (previousCountRef.current > 0 && pendingCount > previousCountRef.current) {
      const newest = data.find((r) => r.status === 'PENDING');
      if (newest) {
        setLiveNotification(`🔔 New Request from ${newest.studentName}: "${newest.requestType}" in ${newest.examTitle}`);
        setTimeout(() => setLiveNotification(null), 6000);
      }
    }
    previousCountRef.current = pendingCount;
  };

  useEffect(() => {
    loadRequests();
  }, [teacherId]);

  // Real-time Background Polling Every 3 Seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadRequests();
    }, 3000);
    return () => clearInterval(interval);
  }, [teacherId]);

  const handleOpenDetail = (req: ExamRequest) => {
    setActiveRequest(req);
    setTeacherResponseInput(req.teacherResponse || '');
  };

  const handleTakeAction = async (status: RequestStatus) => {
    if (!activeRequest) return;
    setIsSubmitting(true);

    const res = await updateTeacherRequestAction(
      activeRequest.id,
      teacherId,
      status,
      teacherResponseInput.trim() || undefined
    );

    setIsSubmitting(false);
    if (res.success) {
      setActionSuccessToast(`Request updated to ${status}.`);
      setActiveRequest(null);
      await loadRequests();
      setTimeout(() => setActionSuccessToast(null), 3500);
    } else {
      alert(res.error || 'Failed to update request.');
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesFilter = selectedFilter === 'ALL' || r.status === selectedFilter;
    const matchesSearch =
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.examTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requestType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    ALL: requests.length,
    PENDING: requests.filter((r) => r.status === 'PENDING').length,
    APPROVED: requests.filter((r) => r.status === 'APPROVED').length,
    REJECTED: requests.filter((r) => r.status === 'REJECTED').length,
    RESOLVED: requests.filter((r) => r.status === 'RESOLVED').length,
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" /> Pending
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold inline-flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-600" /> Rejected
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-blue-600" /> Resolved
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Live Notification Banner */}
      {liveNotification && (
        <div className="p-4 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-between shadow-lg animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 animate-bounce" />
            <span>{liveNotification}</span>
          </div>
          <button
            onClick={() => setLiveNotification(null)}
            className="text-white/80 hover:text-white text-xs underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Toast */}
      {actionSuccessToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccessToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Inbox className="w-7 h-7 text-blue-600" />
            <span>Student Exam Requests</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review exam issues, accidental exits, technical requests, and grant re-entry permissions.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'RESOLVED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedFilter === tab
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()} ({counts[tab]})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student or exam..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center shadow-card space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No requests found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {selectedFilter === 'ALL'
              ? 'No student requests have been submitted for your examinations yet.'
              : `No requests with status "${selectedFilter.toLowerCase()}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              onClick={() => handleOpenDetail(req)}
              className="rounded-2xl bg-white border border-slate-200 p-5 shadow-card hover:border-blue-300 hover:shadow-card-hover transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(req.status)}
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {req.requestType.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {req.className} ({req.sectionName})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{req.studentName}</h3>
                  <span className="text-slate-400">•</span>
                  <span className="text-xs text-slate-600 font-medium truncate">{req.examTitle}</span>
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic line-clamp-2">
                  "{req.message}"
                </p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(req.createdAt).toLocaleString()}
                  </span>
                  {req.attemptId && (
                    <span className="flex items-center gap-1 text-indigo-600 font-semibold">
                      <FileText className="w-3 h-3" /> Attempt: {req.attemptId}
                    </span>
                  )}
                  {req.teacherResponse && (
                    <span className="text-emerald-700 font-sans font-semibold">
                      ✓ Responded
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                  onClick={() => handleOpenDetail(req)}
                >
                  Review Request
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Review & Take Action */}
      {activeRequest && (
        <Modal
          isOpen={!!activeRequest}
          onClose={() => setActiveRequest(null)}
          title={`Review Request: ${activeRequest.requestType.replace('_', ' ')}`}
        >
          <div className="space-y-4 text-xs">
            {/* Student & Exam Details Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{activeRequest.studentName}</h4>
                  <p className="text-[11px] text-slate-500 font-mono">{activeRequest.studentEmail}</p>
                </div>
                {getStatusBadge(activeRequest.status)}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Class & Section</span>
                  <span className="font-bold text-slate-900">{activeRequest.className} — {activeRequest.sectionName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Exam Title</span>
                  <span className="font-bold text-slate-900">{activeRequest.examTitle}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Request Type</span>
                  <span className="font-mono font-bold text-blue-700">{activeRequest.requestType}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Date Submitted</span>
                  <span className="font-mono text-slate-700">{new Date(activeRequest.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {activeRequest.attemptId && (
                <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase block">Linked Attempt</span>
                    <span className="font-mono text-xs text-indigo-950 font-bold">{activeRequest.attemptId}</span>
                  </div>
                  <Link to={`/teacher/evidence-review?exam=${activeRequest.examId}`}>
                    <Button variant="secondary" size="sm" className="text-[11px] py-1 px-2">
                      View Attempt & Evidence →
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Student Message */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-800">Student Explanation & Message:</label>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs leading-relaxed">
                {activeRequest.message}
              </div>
            </div>

            {/* Teacher Response Input */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-800">
                Teacher Response / Instructions to Student (Optional):
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Approved. You may log in and continue your exam attempt. Please ensure a stable connection."
                value={teacherResponseInput}
                onChange={(e) => setTeacherResponseInput(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setActiveRequest(null)}>
                Close
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  disabled={isSubmitting}
                  leftIcon={<XCircle className="w-3.5 h-3.5" />}
                  onClick={() => handleTakeAction('REJECTED')}
                >
                  Reject
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isSubmitting}
                  leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                  onClick={() => handleTakeAction('RESOLVED')}
                >
                  Mark Resolved
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  onClick={() => handleTakeAction('APPROVED')}
                >
                  Approve Request
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
