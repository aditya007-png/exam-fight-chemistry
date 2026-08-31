// src/pages/student/StudentExamsPage.tsx
// Student Assigned Exams Directory with Request Status & Re-entry Locking
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchExamsFromDB } from '../../lib/examService';
import { fetchEnrollmentsFromDB } from '../../lib/classService';
import { fetchStudentRequests } from '../../lib/requestService';
import { ExamRequest } from '../../types/request';
import { ExamItem } from '../../types/dashboard';
import { Button } from '../../components/common/Button';
import { FileText, Clock, Calendar, ShieldCheck, ArrowRight, Lock, CheckCircle2, Inbox } from 'lucide-react';

export const StudentExamsPage: React.FC = () => {
  const { user } = useAuth();
  const studentId = user?.id || '';
  const studentEmail = user?.email || '';

  const [exams, setExams] = useState<ExamItem[]>([]);
  const [requests, setRequests] = useState<ExamRequest[]>([]);

  const loadStudentExams = async () => {
    if (studentId || studentEmail) {
      await fetchEnrollmentsFromDB(studentId);
      const studentExams = await fetchExamsFromDB({ studentId, studentEmail });
      setExams(studentExams);

      const reqs = await fetchStudentRequests(studentId);
      setRequests(reqs);
    } else {
      setExams([]);
      setRequests([]);
    }
  };

  useEffect(() => {
    loadStudentExams();
  }, [studentId, studentEmail]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            My Assigned Examinations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Access your enrolled chemistry exams, request re-entry, and continuous proctored assessments.
          </p>
        </div>

        <Link to="/student/requests">
          <Button variant="secondary" size="sm" leftIcon={<Inbox className="w-3.5 h-3.5 text-blue-600" />}>
            My Requests ({requests.length})
          </Button>
        </Link>
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
          {exams.map((exam) => {
            const pendingReq = requests.find((r) => r.examId === exam.id && r.status === 'PENDING');
            const approvedReq = requests.find((r) => r.examId === exam.id && r.status === 'APPROVED');
            const rejectedReq = requests.find((r) => r.examId === exam.id && r.status === 'REJECTED');

            return (
              <div
                key={exam.id}
                className={`rounded-2xl bg-white border p-6 shadow-card flex flex-col justify-between space-y-4 transition-all ${
                  pendingReq
                    ? 'border-amber-300 bg-amber-50/20'
                    : approvedReq
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
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

                    {/* Status Badge */}
                    {pendingReq ? (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600 animate-spin" /> REQUEST PENDING
                      </span>
                    ) : approvedReq ? (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> APPROVED — RESUME READY
                      </span>
                    ) : rejectedReq ? (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-rose-600" /> REQUEST REJECTED
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        🟢 Live Now
                      </span>
                    )}
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

                  {pendingReq && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Your re-entry request is under review by your teacher. Examination access is locked.</span>
                    </div>
                  )}

                  {approvedReq && approvedReq.teacherResponse && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs space-y-0.5">
                      <span className="font-bold text-emerald-900 block">Teacher Approved:</span>
                      <p className="italic">"{approvedReq.teacherResponse}"</p>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  {pendingReq ? (
                    <Button
                      variant="secondary"
                      size="md"
                      disabled={true}
                      className="w-full font-bold text-xs cursor-not-allowed opacity-70 bg-amber-100 text-amber-900 border-amber-300"
                      leftIcon={<Lock className="w-4 h-4" />}
                    >
                      Requested (Locked)
                    </Button>
                  ) : rejectedReq ? (
                    <Button
                      variant="secondary"
                      size="md"
                      disabled={true}
                      className="w-full font-bold text-xs cursor-not-allowed opacity-70 bg-rose-100 text-rose-900 border-rose-300"
                      leftIcon={<Lock className="w-4 h-4" />}
                    >
                      Request Rejected
                    </Button>
                  ) : approvedReq ? (
                    <Link to={`/student/exam/${exam.id}`} className="block">
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        Resume / Continue Exam
                      </Button>
                    </Link>
                  ) : (
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
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
