// src/pages/student/StudentRequestsPage.tsx
// Student Requests Directory and Issue Submission Modal (e.g. Exam Exited Accidentally)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ExamRequest, RequestType, RequestStatus } from '../../types/request';
import { fetchStudentRequests, createStudentRequest } from '../../lib/requestService';
import { getStudentEnrolledClasses, fetchEnrollmentsFromDB } from '../../lib/classService';
import { getStoredExams, fetchExamsFromDB } from '../../lib/examService';
import { ExamItem } from '../../types/dashboard';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import {
  Inbox,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  ShieldCheck,
  Send,
  MessageSquare,
} from 'lucide-react';

export const StudentRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const studentId = user?.id || '';
  const studentName = user?.full_name || 'Student Candidate';
  const studentEmail = user?.email || '';

  const [requests, setRequests] = useState<ExamRequest[]>([]);
  const [availableExams, setAvailableExams] = useState<ExamItem[]>([]);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Form State
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedAttemptId, setSelectedAttemptId] = useState('');
  const [requestType, setRequestType] = useState<RequestType>('EXAM_EXITED');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const loadData = async () => {
    if (!studentId && !studentEmail) return;
    await fetchEnrollmentsFromDB(studentId);
    await fetchExamsFromDB();

    const myRequests = await fetchStudentRequests(studentId);
    setRequests(myRequests);

    const enrolled = getStudentEnrolledClasses(studentId, studentEmail);
    const secIds = enrolled.map((e) => e.section.id);
    const exams = getStoredExams().filter(
      (e) => !e.sectionId || secIds.includes(e.sectionId)
    );
    setAvailableExams(exams);
    if (exams.length > 0 && !selectedExamId) {
      setSelectedExamId(exams[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentId, studentEmail]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId || !message.trim()) {
      setSubmitError('Please select an exam and provide a brief explanation.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    const res = await createStudentRequest({
      studentId,
      studentName,
      studentEmail,
      examId: selectedExamId,
      attemptId: selectedAttemptId.trim() || undefined,
      requestType,
      message: message.trim(),
    });

    setIsSubmitting(false);
    if (res.success) {
      setSubmitSuccess('Request submitted to your teacher successfully!');
      setMessage('');
      setSelectedAttemptId('');
      await loadData();
      setTimeout(() => {
        setIsSubmitModalOpen(false);
        setSubmitSuccess(null);
      }, 2000);
    } else {
      setSubmitError(res.error || 'Failed to submit request.');
    }
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" /> Pending Review
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
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Inbox className="w-7 h-7 text-blue-600" />
            <span>My Exam Requests</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Submit issues (accidental exit, camera glitch, technical errors) directly to your course instructor.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setSubmitError(null);
            setSubmitSuccess(null);
            setIsSubmitModalOpen(true);
          }}
        >
          Submit New Request
        </Button>
      </div>

      {/* Requests History List */}
      {requests.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center shadow-card space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No requests submitted yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            If your exam is interrupted, exited accidentally, or encounters technical problems, submit a request here to notify your teacher.
          </p>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsSubmitModalOpen(true)}
          >
            Submit Request
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {req.requestType.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {req.className} ({req.sectionName})
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5">{req.examTitle}</h3>
                  </div>
                  <div>{getStatusBadge(req.status)}</div>
                </div>

                {/* Student message */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Your Message</span>
                  <p className="italic">"{req.message}"</p>
                </div>

                {/* Teacher response */}
                {req.teacherResponse && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 space-y-1 animate-in fade-in">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Instructor Response ({req.teacherName}):</span>
                    </div>
                    <p className="font-medium">{req.teacherResponse}</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {new Date(req.createdAt).toLocaleString()}
                  </span>
                  <span>
                    Teacher: <strong className="text-slate-700 font-sans">{req.teacherName}</strong>
                  </span>
                  {req.attemptId && (
                    <span className="text-indigo-600 font-semibold">
                      Attempt ID: {req.attemptId}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Request */}
      {isSubmitModalOpen && (
        <Modal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          title="Submit Exam Issue / Request"
        >
          <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs">
            <p className="text-slate-500">
              Submit your issue to your assigned teacher for review and re-entry authorization.
            </p>

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {submitSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Select Examination <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
              >
                {availableExams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title} ({exam.courseCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Issue Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value as RequestType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
              >
                <option value="EXAM_EXITED">Exam exited accidentally (EXAM_EXITED)</option>
                <option value="TECHNICAL_ISSUE">Technical issue during exam</option>
                <option value="CAMERA_ISSUE">Camera / Microphone connection error</option>
                <option value="REATTEMPT_REQUEST">Re-attempt authorization request</option>
                <option value="OTHER">Other examination issue</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Exam Attempt ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. att-1788002495532"
                value={selectedAttemptId}
                onChange={(e) => setSelectedAttemptId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Detailed Message to Teacher <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe what occurred (e.g. browser crashed, tab closed accidentally, network dropped)..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setIsSubmitModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSubmitting} leftIcon={<Send className="w-3.5 h-3.5" />}>
                Submit to Instructor
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
