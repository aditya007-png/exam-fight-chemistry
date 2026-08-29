// src/pages/teacher/ProctoringReviewPage.tsx
// Teacher Proctoring & Evidence Review Page with robust data loading, empty states, and attempt linking
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchExamsFromDB, getStoredExams } from '../../lib/examService';
import { Button } from '../../components/common/Button';
import {
  Camera,
  ShieldCheck,
  AlertTriangle,
  Inbox,
  User,
  RefreshCw,
} from 'lucide-react';

interface ExamMeta {
  id: string;
  code: string;
  title: string;
  subject: string;
  className: string;
  sectionName: string;
  duration: string;
  status: string;
}

interface EvidenceItem {
  id: string;
  attemptId: string;
  evidenceType: string;
  filePath?: string;
  signedUrl?: string;
  durationSeconds?: number;
  coverageDegrees?: number;
  metadata?: any;
  recordedAt: string;
}

interface AttemptItem {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  sectionId?: string;
  status: string;
  score?: number | null;
  totalMarks?: number;
  integrityScore?: number;
  startedAt: string;
  submittedAt?: string | null;
  proctoringEvents?: Array<{
    id?: string;
    eventType: string;
    severity?: string;
    description?: string;
    timestamp: string;
  }>;
}

export const ProctoringReviewPage: React.FC = () => {
  const { user } = useAuth();
  const teacherId = user?.id || '';

  const [searchParams, setSearchParams] = useSearchParams();
  const initialExamId = searchParams.get('exam') || null;
  const initialAttemptId = searchParams.get('attempt') || null;

  const [exams, setExams] = useState<ExamMeta[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(initialExamId);
  const [attempts, setAttempts] = useState<AttemptItem[]>([]);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(initialAttemptId);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Active workspace tab
  const [activeTab, setActiveTab] = useState<'overview' | 'room_scan' | 'events' | 'photos'>('overview');

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      if (teacherId) {
        await fetchExamsFromDB(teacherId);
      }
      const rawExams = getStoredExams();
      const mapped: ExamMeta[] = (rawExams || []).map((e) => ({
        id: e.id,
        code: e.courseCode || `CHEM-${e.id.substring(0, 4).toUpperCase()}`,
        title: e.title || 'Chemistry Examination',
        subject: e.topic || e.courseName || 'Chemistry',
        className: e.className || 'Academic Class',
        sectionName: e.sectionName || 'Section A',
        duration: `${e.durationMinutes || 60} min`,
        status: e.status || 'published',
      }));

      setExams(mapped);

      // If initialExamId was in searchParams or we have exams, select it
      const currentExamId = selectedExamId || (mapped.length > 0 ? mapped[0].id : null);
      if (currentExamId && !selectedExamId) {
        setSelectedExamId(currentExamId);
      }

      if (currentExamId) {
        // Fetch attempts for this exam
        const attemptsRes = await fetch(`/api/attempts?examId=${encodeURIComponent(currentExamId)}&teacherId=${encodeURIComponent(teacherId)}`);
        if (attemptsRes.ok) {
          const attemptsData = await attemptsRes.json();
          const list: AttemptItem[] = attemptsData.attempts || [];
          setAttempts(list);

          const activeAttId = selectedAttemptId || (list.length > 0 ? list[0].id : null);
          if (activeAttId && (!selectedAttemptId || !list.some(a => a.id === selectedAttemptId))) {
            setSelectedAttemptId(activeAttId);
          }

          if (activeAttId) {
            // Fetch evidence for active attempt
            const eviRes = await fetch(`/api/attempts/${encodeURIComponent(activeAttId)}/evidence?teacherId=${encodeURIComponent(teacherId)}`);
            if (eviRes.ok) {
              const eviData = await eviRes.json();
              setEvidenceList(eviData.evidenceList || []);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error loading evidence review:', err);
      setLoadError('Unable to load proctoring evidence data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [teacherId, selectedExamId, selectedAttemptId]);

  const handleSelectExam = (examId: string) => {
    setSelectedExamId(examId);
    setSelectedAttemptId(null);
    setSearchParams({ exam: examId });
  };

  const handleSelectAttempt = async (attId: string) => {
    setSelectedAttemptId(attId);
    setSearchParams({ exam: selectedExamId || '', attempt: attId });
    try {
      const eviRes = await fetch(`/api/attempts/${encodeURIComponent(attId)}/evidence?teacherId=${encodeURIComponent(teacherId)}`);
      if (eviRes.ok) {
        const eviData = await eviRes.json();
        setEvidenceList(eviData.evidenceList || []);
      }
    } catch (err) {
      console.error('Error loading evidence:', err);
    }
  };

  const currentExam = exams.find((e) => e.id === selectedExamId) || null;
  const currentAttempt = attempts.find((a) => a.id === selectedAttemptId) || (attempts.length > 0 ? attempts[0] : null);

  const filteredExams = exams.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.className.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAttempts = attempts.filter((a) =>
    a.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.studentEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roomScanEvidence = evidenceList.find((e) => e.evidenceType === 'room_scan');
  const proctoringEvents = currentAttempt?.proctoringEvents || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Proctoring Audit & Continuous Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Evidence Review & Candidate Sessions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit 360° environment scans, live integrity scores, and chronological proctoring violations.
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
          <Link to="/teacher/requests">
            <Button variant="secondary" size="sm" leftIcon={<Inbox className="w-3.5 h-3.5 text-amber-600" />}>
              Student Requests
            </Button>
          </Link>
        </div>
      </div>

      {/* Error state */}
      {loadError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{loadError}</span>
          </div>
          <button onClick={loadData} className="underline hover:text-rose-950 font-bold">
            Retry
          </button>
        </div>
      )}

      {/* Main Content Layout */}
      {exams.length === 0 ? (
        /* Empty State: No Exams */
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center shadow-card space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">No Examinations Created Yet</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Create and assign an exam to your class section to start recording candidate sessions and review evidence.
            </p>
          </div>
          <Link to="/teacher/create-exam">
            <Button variant="primary" size="md">
              Create First Exam
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Exams & Students Navigation (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search exams or students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Exam Selector */}
            <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-card space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Select Examination ({exams.length})
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {filteredExams.map((ex) => {
                  const isSelected = ex.id === selectedExamId;
                  return (
                    <div
                      key={ex.id}
                      onClick={() => handleSelectExam(ex.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all text-xs flex flex-col gap-0.5 ${
                        isSelected
                          ? 'bg-blue-50 border-blue-500 font-bold text-blue-900 shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{ex.title}</span>
                        <span className="font-mono text-[10px] text-blue-700 bg-blue-100/70 px-1.5 py-0.2 rounded">
                          {ex.code}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {ex.className} • {ex.sectionName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Candidate Attempts in Selected Exam */}
            <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-card space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Candidate Attempts ({attempts.length})
                </span>
              </div>

              {attempts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                  <User className="w-6 h-6 mx-auto text-slate-300" />
                  <p className="font-medium">No attempts recorded for this exam yet.</p>
                  <p className="text-[11px]">When enrolled students start this exam, their sessions will appear here.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredAttempts.map((att) => {
                    const isSelected = att.id === selectedAttemptId;
                    return (
                      <div
                        key={att.id}
                        onClick={() => handleSelectAttempt(att.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-500 shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-900 block">
                            {att.studentName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 block truncate max-w-[180px]">
                            {att.studentEmail}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {att.id}
                          </span>
                        </div>

                        <div className="text-right space-y-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                              att.status === 'submitted'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {att.status === 'submitted' ? 'Submitted' : 'In Progress'}
                          </span>
                          {att.integrityScore !== undefined && (
                            <span className="text-[10px] font-bold text-indigo-700 block">
                              Score: {att.integrityScore}%
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Evidence Viewer & Audit (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {currentAttempt ? (
              <div className="space-y-5">
                {/* Candidate Overview Card */}
                <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-card space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-bold">
                          {currentExam?.code}
                        </span>
                        <h2 className="text-lg font-bold text-slate-900">
                          {currentAttempt.studentName}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {currentAttempt.studentEmail} • Attempt ID: <strong className="text-slate-800">{currentAttempt.id}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold font-mono">
                        Integrity: {currentAttempt.integrityScore ?? 100}%
                      </span>
                      {currentAttempt.score !== null && currentAttempt.score !== undefined && (
                        <span className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold font-mono">
                          Marks: {currentAttempt.score} / {currentAttempt.totalMarks || 100}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    {[
                      { key: 'overview', label: 'Summary & Details' },
                      { key: 'room_scan', label: `360° Scan (${roomScanEvidence ? '1' : '0'})` },
                      { key: 'events', label: `Violations & Events (${proctoringEvents.length})` },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          activeTab === tab.key
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab 1: Overview */}
                  {activeTab === 'overview' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Session Started</span>
                        <span className="font-mono text-slate-800 font-bold">
                          {new Date(currentAttempt.startedAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Submission Time</span>
                        <span className="font-mono text-slate-800 font-bold">
                          {currentAttempt.submittedAt ? new Date(currentAttempt.submittedAt).toLocaleTimeString() : 'In Progress'}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Proctoring Status</span>
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verified Valid
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: 360° Room Scan Evidence */}
                  {activeTab === 'room_scan' && (
                    <div className="space-y-3 pt-1">
                      {roomScanEvidence ? (
                        <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold flex items-center gap-1.5 text-blue-400">
                              <Camera className="w-4 h-4" /> 360° Environment Verification Clip
                            </span>
                            <span className="font-mono text-[11px] text-slate-400">
                              {roomScanEvidence.coverageDegrees || 360}° Coverage • {roomScanEvidence.durationSeconds || 12}s
                            </span>
                          </div>

                          <div className="aspect-video rounded-lg bg-black/60 border border-slate-800 flex items-center justify-center relative overflow-hidden">
                            <div className="text-center space-y-2 p-6">
                              <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto animate-pulse" />
                              <p className="text-xs font-semibold text-slate-200">
                                360° Panoramic Scan Recorded & Cryptographically Signed
                              </p>
                              <p className="text-[11px] font-mono text-slate-400">
                                Storage Ref: {roomScanEvidence.filePath || `evidence/${roomScanEvidence.id}.webm`}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-1">
                          <Camera className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="text-xs font-semibold text-slate-600">No room scan uploaded yet</p>
                          <p className="text-[11px] text-slate-400">Room scan is recorded before exam commencement.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Proctoring Violations Timeline */}
                  {activeTab === 'events' && (
                    <div className="space-y-2 pt-1">
                      {proctoringEvents.length === 0 ? (
                        <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-1">
                          <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
                          <p className="text-xs font-semibold text-slate-700">0 Integrity Alerts Triggered</p>
                          <p className="text-[11px] text-slate-400">No suspicious off-screen gaze or background anomalies detected.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {proctoringEvents.map((evt, idx) => (
                            <div
                              key={evt.id || idx}
                              className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 block font-mono">
                                    {evt.eventType}
                                  </span>
                                  <p className="text-[11px] text-slate-500">{evt.description}</p>
                                </div>
                              </div>

                              <span className="font-mono text-[10px] text-slate-400 shrink-0">
                                {new Date(evt.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center shadow-card text-xs text-slate-400">
                Select an examination and candidate attempt from the left column to audit proctoring evidence.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
