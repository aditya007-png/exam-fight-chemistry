import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  getExamAttemptsList,
  getStudentAttemptEvidence,
  grantExamRestart,
} from '../../lib/evidenceService';
import {
  ExamAttempt,
  StudentAttemptEvidenceSummary,
  EvidenceSnapshot,
} from '../../types/evidence';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { BroadcastModal } from '../../components/teacher/BroadcastModal';
import { TimeExtensionModal } from '../../components/teacher/TimeExtensionModal';
import { UploadMcqModal } from '../../components/teacher/UploadMcqModal';
import {
  Video,
  Camera,
  Play,
  Pause,
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  Mic,
  Activity,
  Eye,
  RotateCcw,
  Send,
  Clock,
  XCircle,
  Inbox,
  ArrowLeft,
  FlaskConical,
  ChevronRight,
  Volume2,
  VolumeX,
  Lock,
} from 'lucide-react';

interface ExamSubjectTest {
  id: string;
  code: string;
  title: string;
  subject: string;
  testType: string;
  className: string;
  enrolled: number;
  submitted: number;
  flaggedCount: number;
  duration: string;
  date: string;
  isLive: boolean;
  liveCount: number;
}

const EXAM_SUBJECT_TESTS: ExamSubjectTest[] = [
  {
    id: 'exam-act-001',
    code: 'CHEM-302',
    title: 'Organic Chemistry — Unit Test',
    subject: 'Organic Chemistry',
    testType: 'Unit Examination',
    className: '12-A',
    enrolled: 42,
    submitted: 40,
    flaggedCount: 2,
    duration: '60 min',
    date: 'Today',
    isLive: true,
    liveCount: 2,
  },
  {
    id: 'exam-act-002',
    code: 'CHEM-301',
    title: 'Inorganic Chemistry — Mid Term',
    subject: 'Inorganic Chemistry',
    testType: 'Mid-Term Examination',
    className: '12-B',
    enrolled: 38,
    submitted: 37,
    flaggedCount: 1,
    duration: '90 min',
    date: 'Yesterday',
    isLive: true,
    liveCount: 1,
  },
  {
    id: 'exam-act-003',
    code: 'CHEM-201',
    title: 'Physical Chemistry — Quiz 3',
    subject: 'Physical Chemistry',
    testType: 'Chapter Quiz',
    className: '11-A',
    enrolled: 45,
    submitted: 45,
    flaggedCount: 0,
    duration: '45 min',
    date: '20 Aug',
    isLive: false,
    liveCount: 0,
  },
  {
    id: 'exam-act-004',
    code: 'CHEM-401',
    title: 'Biochemistry — Reaction Mechanisms',
    subject: 'Biochemistry',
    testType: 'Practical Assessment',
    className: '12-A',
    enrolled: 35,
    submitted: 35,
    flaggedCount: 1,
    duration: '60 min',
    date: '18 Aug',
    isLive: false,
    liveCount: 0,
  },
  {
    id: 'exam-act-005',
    code: 'CHEM-305',
    title: 'Analytical Chemistry — Spectrometry Lab',
    subject: 'Analytical Chemistry',
    testType: 'Lab Practical',
    className: '12-B',
    enrolled: 30,
    submitted: 30,
    flaggedCount: 0,
    duration: '75 min',
    date: '15 Aug',
    isLive: false,
    liveCount: 0,
  },
];

export const ProctoringReviewPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialExamId = searchParams.get('exam') || null;
  const initialAttemptId = searchParams.get('attempt') || 'att-rahul';

  // Selected Exam (null = show all tests list; string = show that test's students & evidence)
  const [selectedExamId, setSelectedExamId] = useState<string | null>(initialExamId);

  // Filters for tests & students
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [studentStatusFilter, setStudentStatusFilter] = useState<'all' | 'live' | 'completed' | 'flagged'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Attempts & Selection State
  const [attemptsList, setAttemptsList] = useState<ExamAttempt[]>([]);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string>(initialAttemptId);
  const [evidenceSummary, setEvidenceSummary] = useState<StudentAttemptEvidenceSummary | null>(null);

  // Live Audio Monitor State
  const [isLiveAudioListening, setIsLiveAudioListening] = useState<boolean>(false);
  const [liveDirectWarningModal, setLiveDirectWarningModal] = useState<{
    isOpen: boolean;
    studentName: string;
    warningText: string;
  }>({
    isOpen: false,
    studentName: '',
    warningText: 'Please keep your eyes focused on the examination screen.',
  });

  // Modals
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isUploadMcqModalOpen, setIsUploadMcqModalOpen] = useState(false);
  const [timeExtensionStudent, setTimeExtensionStudent] = useState<any | null>(null);
  const [terminateCandidateModal, setTerminateCandidateModal] = useState<{
    isOpen: boolean;
    studentName: string;
    attemptId: string;
    reason: string;
  }>({
    isOpen: false,
    studentName: '',
    attemptId: '',
    reason: 'Critical integrity violation: Continuous unapproved behavior.',
  });

  // Recorded Workspace Tab
  const [activeRecordedTab, setActiveRecordedTab] = useState<
    'overview' | 'room_scan' | 'camera' | 'audio' | 'detection' | 'screenshots' | 'events'
  >('overview');

  // Video Players State
  const roomScanVideoRef = useRef<HTMLVideoElement | null>(null);
  const [roomScanPlaying, setRoomScanPlaying] = useState(false);
  const [roomScanTime, setRoomScanTime] = useState(0);
  const [roomScanDuration, setRoomScanDuration] = useState(0);

  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const [webcamPlaying, setWebcamPlaying] = useState(false);
  const [webcamTime, setWebcamTime] = useState(0);
  const [webcamDuration, setWebcamDuration] = useState(0);

  // Audio Player State
  const [audioPlaying, setAudioPlaying] = useState(false);

  // Modals
  const [selectedSnapshotModal, setSelectedSnapshotModal] = useState<EvidenceSnapshot | null>(null);
  const [auditDecision, setAuditDecision] = useState<'pending' | 'approved' | 'flagged'>('pending');

  const currentExamMeta =
    EXAM_SUBJECT_TESTS.find((e) => e.id === selectedExamId) || EXAM_SUBJECT_TESTS[0];

  // Load attempts when an exam is selected
  useEffect(() => {
    if (selectedExamId) {
      getExamAttemptsList(selectedExamId).then((data) => {
        setAttemptsList(data);
        if (data.length > 0 && !data.some((a) => a.id === selectedAttemptId)) {
          setSelectedAttemptId(data[0].id);
        }
      });
    }
  }, [selectedExamId, selectedAttemptId]);

  // Load evidence summary for selected student attempt
  useEffect(() => {
    if (selectedExamId && selectedAttemptId) {
      getStudentAttemptEvidence(selectedAttemptId).then((data) => {
        setEvidenceSummary(data);
        setRoomScanPlaying(false);
        setWebcamPlaying(false);
        setAudioPlaying(false);
        setIsLiveAudioListening(false);
      });
    }
  }, [selectedExamId, selectedAttemptId]);

  const handleSelectExam = (examId: string) => {
    setSelectedExamId(examId);
    setSearchParams({ exam: examId });
  };

  const handleBackToExamsList = () => {
    setSelectedExamId(null);
    setSearchParams({});
  };

  const filteredTests = EXAM_SUBJECT_TESTS.filter((exam) => {
    const matchesSubject = subjectFilter === 'all' || exam.subject.toLowerCase().includes(subjectFilter.toLowerCase());
    const matchesSearch =
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.className.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const filteredStudents = attemptsList.filter((att) => {
    const matchesSearch =
      att.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.studentEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const isLive = att.status === 'in_progress';
    const isCompleted = att.status === 'submitted';
    const isFlagged = att.riskLevel === 'HIGH' || att.status === 'terminated_tab_switch' || att.status === 'flagged';

    const matchesStatus =
      studentStatusFilter === 'all' ||
      (studentStatusFilter === 'live' && isLive) ||
      (studentStatusFilter === 'completed' && isCompleted) ||
      (studentStatusFilter === 'flagged' && isFlagged);

    return matchesSearch && matchesStatus;
  });

  const activeAttempt: ExamAttempt =
    evidenceSummary?.attempt ||
    filteredStudents.find((a: ExamAttempt) => a.id === selectedAttemptId) ||
    filteredStudents[0] || {
      id: 'none',
      examId: selectedExamId,
      examTitle: currentExamMeta.title,
      courseCode: currentExamMeta.code,
      className: currentExamMeta.className,
      studentId: 'none',
      studentName: 'No Candidate Selected',
      studentEmail: 'none@chem.edu',
      status: 'submitted',
      roomScanCompleted: false,
      startedAt: new Date().toISOString(),
      submittedAt: null,
      score: 0,
      totalMarks: 100,
      integrityScore: 100,
      riskLevel: 'LOW',
      totalViolations: 0,
      evidenceCount: 0,
      durationMinutes: 60,
      createdAt: new Date().toISOString(),
    };

  const isStudentLiveNow = activeAttempt.status === 'in_progress';

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Video controller helpers
  const toggleRoomScanPlay = () => {
    if (!roomScanVideoRef.current) return;
    if (roomScanPlaying) {
      roomScanVideoRef.current.pause();
      setRoomScanPlaying(false);
    } else {
      roomScanVideoRef.current.play().catch(() => {});
      setRoomScanPlaying(true);
    }
  };

  const handleRoomScanTimeUpdate = () => {
    if (roomScanVideoRef.current) {
      setRoomScanTime(roomScanVideoRef.current.currentTime);
      setRoomScanDuration(roomScanVideoRef.current.duration || 42);
    }
  };

  const handleRoomScanSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!roomScanVideoRef.current) return;
    const t = parseFloat(e.target.value);
    roomScanVideoRef.current.currentTime = t;
    setRoomScanTime(t);
  };

  const toggleWebcamPlay = () => {
    if (!webcamVideoRef.current) return;
    if (webcamPlaying) {
      webcamVideoRef.current.pause();
      setWebcamPlaying(false);
    } else {
      webcamVideoRef.current.play().catch(() => {});
      setWebcamPlaying(true);
    }
  };

  const handleWebcamTimeUpdate = () => {
    if (webcamVideoRef.current) {
      setWebcamTime(webcamVideoRef.current.currentTime);
      setWebcamDuration(webcamVideoRef.current.duration || 3360);
    }
  };

  const handleWebcamSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!webcamVideoRef.current) return;
    const t = parseFloat(e.target.value);
    webcamVideoRef.current.currentTime = t;
    setWebcamTime(t);
  };

  const handleRemoteTerminateSubmit = () => {
    alert(`Candidate ${terminateCandidateModal.studentName}'s examination was terminated remotely for: ${terminateCandidateModal.reason}`);
    setTerminateCandidateModal({ isOpen: false, studentName: '', attemptId: '', reason: '' });
  };

  const handleSendDirectWarning = () => {
    alert(`Warning successfully pushed to ${liveDirectWarningModal.studentName}'s exam screen: "${liveDirectWarningModal.warningText}"`);
    setLiveDirectWarningModal({ isOpen: false, studentName: '', warningText: '' });
  };

  // =========================================================================
  // SCREEN 1: ALL EXAMINATIONS & TESTS DIRECTORY (WHEN NO TEST IS SELECTED)
  // =========================================================================
  if (!selectedExamId) {
    return (
      <>
      <div className="space-y-6 max-w-7xl mx-auto py-2">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-1">
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Chemistry Subject Examinations & Tests</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Examinations & Proctoring Evidence
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Select a test below to view all enrolled students, live status, live camera feeds, and recorded evidence.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/teacher/requests">
              <Button variant="secondary" size="sm" leftIcon={<Inbox className="w-4 h-4 text-amber-600" />}>
                Student Requests
              </Button>
            </Link>
          </div>
        </div>

        {/* Search & Subject Filter Bar */}
        <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-card flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by exam title, subject, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs font-semibold">
            {[
              { id: 'all', label: 'All Subjects' },
              { id: 'organic', label: 'Organic Chemistry' },
              { id: 'inorganic', label: 'Inorganic Chemistry' },
              { id: 'physical', label: 'Physical Chemistry' },
              { id: 'biochemistry', label: 'Biochemistry' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSubjectFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  subjectFilter === tab.id
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Examinations & Tests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTests.map((exam) => (
            <div
              key={exam.id}
              onClick={() => handleSelectExam(exam.id)}
              className="rounded-2xl bg-white border border-slate-200 p-5 shadow-card hover:shadow-xl transition-all flex flex-col justify-between space-y-4 group hover:border-blue-500 cursor-pointer"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200 font-mono">
                    {exam.code} • Class {exam.className}
                  </span>
                  {exam.isLive ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                      Live Now ({exam.liveCount})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      Completed
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {exam.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Subject: <strong className="text-slate-700">{exam.subject}</strong> • Type: <strong className="text-slate-700">{exam.testType}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 block">Enrolled</span>
                    <strong className="text-slate-800 font-mono">{exam.enrolled}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 block">Submitted</span>
                    <strong className="text-slate-800 font-mono">{exam.submitted}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 block">Live Active</span>
                    <strong className={exam.liveCount > 0 ? 'text-rose-600 font-mono font-bold' : 'text-slate-400 font-mono'}>
                      {exam.liveCount}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full font-bold text-xs flex items-center justify-between shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectExam(exam.id);
                  }}
                >
                  <span>Open Students & Live Feeds</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload MCQ PDF Modal */}
      <UploadMcqModal
        isOpen={isUploadMcqModalOpen}
        onClose={() => setIsUploadMcqModalOpen(false)}
      />
    </>
  );
}

  // =========================================================================
  // SCREEN 2: SELECTED TEST (STUDENT LIST + LIVE CAMERA & AUDIO FEEDS)
  // =========================================================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* 1. Top Bar: Back Button & Exam Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={handleBackToExamsList}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Examinations & Tests</span>
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {currentExamMeta.title}
            </h1>
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
              {currentExamMeta.code} • Class {currentExamMeta.className}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Subject: <strong>{currentExamMeta.subject}</strong> • {attemptsList.length} Students Enrolled • Click on any student to view Live Camera/Audio or Recorded Evidence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            leftIcon={<Send className="w-3.5 h-3.5" />}
            onClick={() => setIsBroadcastModalOpen(true)}
          >
            Broadcast Announcement
          </Button>

          <Link to="/teacher/requests">
            <Button variant="secondary" size="sm" leftIcon={<Inbox className="w-4 h-4 text-amber-600" />}>
              Requests
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Candidate Directory Selector for this Test */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs font-semibold">
            {[
              { id: 'all', label: `All Students (${attemptsList.length})` },
              { id: 'live', label: `🟢 Live Now (${attemptsList.filter((a) => a.status === 'in_progress').length})` },
              { id: 'completed', label: `Completed (${attemptsList.filter((a) => a.status === 'submitted').length})` },
              { id: 'flagged', label: `Flagged / Locked (${attemptsList.filter((a) => a.riskLevel === 'HIGH' || a.status === 'terminated_tab_switch').length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStudentStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  studentStatusFilter === tab.id
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Student Cards Selector List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
          {filteredStudents.map((st) => {
            const isSelected = selectedAttemptId === st.id;
            const isLive = st.status === 'in_progress';
            const isTabSwitch = st.status === 'terminated_tab_switch';

            return (
              <div
                key={st.id}
                onClick={() => setSelectedAttemptId(st.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {st.studentName.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <strong className="text-xs font-bold text-slate-900 block truncate">
                        {st.studentName}
                      </strong>
                      <span className="text-[10px] text-slate-400 font-mono block truncate">
                        {st.studentEmail}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                  {isLive ? (
                    <span className="text-rose-600 font-bold flex items-center gap-1 font-mono text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                      LIVE NOW (Active)
                    </span>
                  ) : isTabSwitch ? (
                    <span className="text-rose-700 font-bold text-[10px] flex items-center gap-1">
                      <Lock className="w-3 h-3 text-rose-600" />
                      Locked (Tab Switch)
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-medium text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Submitted ({st.score}%)
                    </span>
                  )}

                  <span className="font-mono text-[10px] text-slate-400">
                    {st.integrityScore}% Score
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SELECTED CANDIDATE WORKSPACE */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card space-y-6">
        {/* Candidate Information Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
              {activeAttempt.studentName.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl font-extrabold text-slate-900">
                  {activeAttempt.studentName}
                </h2>
                {isStudentLiveNow ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                    LIVE EXAM IN PROGRESS
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Exam Completed & Submitted
                  </span>
                )}
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Score: {activeAttempt.score}%
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {currentExamMeta.title} • Class {activeAttempt.className || currentExamMeta.className} • Attempt ID:{' '}
                <code className="text-slate-700 font-bold">{activeAttempt.id}</code>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(activeAttempt.status === 'terminated_tab_switch' ||
              activeAttempt.status === 'terminated_proctoring' ||
              activeAttempt.restartPermission?.status === 'pending') && (
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                leftIcon={<RotateCcw className="w-4 h-4" />}
                onClick={async () => {
                  await grantExamRestart(activeAttempt.id);
                  alert(`Restart permission granted for ${activeAttempt.studentName}. The candidate can now start a fresh examination.`);
                }}
              >
                Grant Restart Permission
              </Button>
            )}

            {!isStudentLiveNow && (
              <>
                <Button
                  variant={auditDecision === 'approved' ? 'primary' : 'secondary'}
                  size="sm"
                  leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  onClick={() => {
                    setAuditDecision('approved');
                    alert(`Attempt ${activeAttempt.id} verified as compliant.`);
                  }}
                >
                  Approve
                </Button>
                <Button
                  variant={auditDecision === 'flagged' ? 'danger' : 'secondary'}
                  size="sm"
                  leftIcon={<AlertTriangle className="w-4 h-4 text-rose-600" />}
                  onClick={() => {
                    setAuditDecision('flagged');
                    alert(`Attempt ${activeAttempt.id} flagged for committee review.`);
                  }}
                >
                  Flag
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* CASE A: STUDENT IS GIVING EXAM LIVE (LIVE CAMERA & AUDIO FEED)     */}
        {/* ================================================================= */}
        {isStudentLiveNow ? (
          <div className="space-y-6">
            {/* Live Camera & Audio Command Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Live Video Stream & Live Audio */}
              <div className="lg:col-span-2 space-y-4">
                <div className="relative aspect-video rounded-2xl bg-slate-950 overflow-hidden border-2 border-rose-500 shadow-xl flex items-center justify-center">
                  <video
                    autoPlay
                    loop
                    muted={!isLiveAudioListening}
                    playsInline
                    src="https://assets.mixkit.co/videos/preview/mixkit-young-man-studying-with-his-laptop-and-notepad-42881-large.mp4"
                    className="w-full h-full object-cover"
                  />

                  {/* Top Live Video HUD Overlay */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <div className="px-3 py-1 rounded-lg bg-rose-600/90 backdrop-blur text-white text-xs font-mono font-bold flex items-center gap-2 shadow-md">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      <span>LIVE STUDENT CAMERA STREAM</span>
                    </div>

                    <div className="px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur text-slate-300 text-[11px] font-mono flex items-center gap-3 border border-slate-700">
                      <span>1080p • 30 FPS</span>
                      <span className="text-emerald-400">Latency: 38ms</span>
                    </div>
                  </div>

                  {/* Bottom Video Telemetry Bar */}
                  <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-950/85 backdrop-blur border border-slate-800 flex items-center justify-between text-xs text-white">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <Camera className="w-3.5 h-3.5" /> Camera Active
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <Mic className="w-3.5 h-3.5" /> Mic Streaming
                      </span>
                    </div>

                    {/* Listen to Live Audio Toggle */}
                    <button
                      type="button"
                      onClick={() => setIsLiveAudioListening(!isLiveAudioListening)}
                      className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                        isLiveAudioListening
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {isLiveAudioListening ? (
                        <>
                          <Volume2 className="w-4 h-4 animate-bounce" />
                          <span>Listening to Live Audio (Active)</span>
                        </>
                      ) : (
                        <>
                          <VolumeX className="w-4 h-4 text-slate-400" />
                          <span>Click to Listen Live Audio</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Live Microphone Sound Monitor */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <Mic className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="text-slate-900 block font-bold">
                        Live Audio Frequency & Noise Monitor
                      </strong>
                      <span className="text-slate-500 text-[11px]">
                        Continuous 48kHz audio monitoring • Ambient noise: <strong>24 dB (Normal Quiet)</strong>
                      </span>
                    </div>
                  </div>

                  {/* Sound Wave Animation */}
                  <div className="flex items-center gap-1 h-6">
                    {[12, 24, 18, 28, 16, 22, 30, 14, 20, 26, 18, 12].map((h, i) => (
                      <div
                        key={i}
                        className="w-1 bg-blue-600 rounded-full transition-all animate-pulse"
                        style={{ height: `${h}px`, animationDelay: `${i * 80}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right 1 Col: Live AI Telemetry & Live Teacher Controls */}
              <div className="space-y-4">
                {/* Live Exam Progress Card */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Live Exam Progression
                    </h3>
                    <span className="text-xs font-mono font-bold text-blue-700">
                      34:21 Left
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Current Question:</span>
                      <strong className="text-slate-900 font-mono">Q14 / 25</strong>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: '56%' }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-0.5">
                      <span>Answered: 14 Questions</span>
                      <span>56% Completed</span>
                    </div>
                  </div>
                </div>

                {/* Live Computer Vision Telemetry */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                  <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-blue-600" />
                    Live Computer Vision Diagnostics
                  </h3>

                  <div className="space-y-2 text-slate-700">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80">
                      <span>Face Position:</span>
                      <strong className="text-emerald-700 font-bold flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Centered & Focused
                      </strong>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80">
                      <span>Gaze Direction:</span>
                      <strong className="text-emerald-700 font-bold flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Looking Forward (Screen)
                      </strong>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80">
                      <span>Surrounding Environment:</span>
                      <strong className="text-emerald-700 font-bold flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Single Person Verified
                      </strong>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80">
                      <span>Acoustic Profile:</span>
                      <strong className="text-emerald-700 font-bold flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> No Voice Detected (Clean)
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Live Teacher Action Controls */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                  <span className="text-xs font-bold text-slate-900 block">
                    Teacher Live Controls:
                  </span>

                  <div className="space-y-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs font-bold justify-start"
                      leftIcon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
                      onClick={() => {
                        setLiveDirectWarningModal({
                          isOpen: true,
                          studentName: activeAttempt.studentName,
                          warningText: 'Please keep your face clearly centered in the camera frame.',
                        });
                      }}
                    >
                      Send Direct Warning to Student
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs font-bold justify-start"
                      leftIcon={<Clock className="w-4 h-4 text-blue-600" />}
                      onClick={() => {
                        setTimeExtensionStudent({
                          studentId: activeAttempt.studentId,
                          studentName: activeAttempt.studentName,
                        });
                      }}
                    >
                      Grant Exam Time Extension
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      className="w-full text-xs font-bold justify-start"
                      leftIcon={<XCircle className="w-4 h-4" />}
                      onClick={() => {
                        setTerminateCandidateModal({
                          isOpen: true,
                          studentName: activeAttempt.studentName,
                          attemptId: activeAttempt.id,
                          reason: 'Critical integrity violation: Unauthorized activity detected on live stream.',
                        });
                      }}
                    >
                      Terminate Candidate Exam Live
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================================================================= */
          /* CASE B: STUDENT HAS COMPLETED (RECORDED EVIDENCE WORKSPACE)       */
          /* ================================================================= */
          <div className="space-y-6">
            {/* The 7 Recorded Evidence Tabs */}
            <div className="flex rounded-xl bg-slate-100/80 p-1 border border-slate-200 overflow-x-auto text-xs font-semibold gap-1">
              {[
                { id: 'overview', label: 'Overview', icon: Activity },
                { id: 'room_scan', label: 'Room Scan (300°+)', icon: Video },
                { id: 'camera', label: 'Camera Recording', icon: Camera },
                { id: 'audio', label: 'Audio Stream', icon: Mic },
                { id: 'detection', label: 'AI Detection', icon: Eye },
                { id: 'screenshots', label: `Screenshots (${evidenceSummary?.snapshots.length || 0})`, icon: Camera },
                { id: 'events', label: `Events (${evidenceSummary?.integrityEvents.length || 0})`, icon: ShieldAlert },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeRecordedTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveRecordedTab(tab.id as any)}
                    className={`py-2 px-3.5 rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? 'bg-white text-blue-700 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeRecordedTab === 'overview' && (
              <div className="space-y-6 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-slate-500 text-xs font-medium">Student Name</span>
                    <span className="text-sm font-bold text-slate-900 block">{activeAttempt.studentName}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{activeAttempt.studentEmail}</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-slate-500 text-xs font-medium">Test & Subject</span>
                    <span className="text-sm font-bold text-slate-900 block truncate">{currentExamMeta.title}</span>
                    <span className="text-[11px] text-blue-700 font-bold font-mono">{currentExamMeta.code}</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-slate-500 text-xs font-medium">Duration</span>
                    <span className="text-sm font-bold text-slate-900 block font-mono">{activeAttempt.durationMinutes} Minutes</span>
                    <span className="text-[11px] text-slate-500 font-mono">Completed</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-slate-500 text-xs font-medium">Score & Integrity</span>
                    <span className="text-sm font-bold text-slate-900 block font-mono">{activeAttempt.score}%</span>
                    <span className="text-[11px] text-emerald-600 font-bold">{activeAttempt.integrityScore}/100 Rating</span>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Integrity Status Summary
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                      <span className="text-slate-400 block text-[11px]">360° Room Scan</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 300° Passed
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                      <span className="text-slate-400 block text-[11px]">Camera Stream</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 98.4% Continuous
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                      <span className="text-slate-400 block text-[11px]">Audio Stream</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Active
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                      <span className="text-slate-400 block text-[11px]">Total Events</span>
                      <span className="text-slate-800 font-bold font-mono">
                        {evidenceSummary?.integrityEvents.length || 0} Events Logged
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ROOM SCAN */}
            {activeRecordedTab === 'room_scan' && (
              <div className="space-y-4 pt-2">
                <div className="relative aspect-video rounded-2xl bg-slate-950 overflow-hidden border border-slate-200 shadow-md flex items-center justify-center">
                  <video
                    ref={roomScanVideoRef}
                    onTimeUpdate={handleRoomScanTimeUpdate}
                    src={evidenceSummary?.roomScanVideo?.filePath || 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-student-taking-notes-on-a-notebook-42880-large.mp4'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur text-white text-xs font-mono flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>360° ROOM SCAN RECORDING (300° VERIFIED)</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={toggleRoomScanPlay}>
                      {roomScanPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </Button>
                    <span className="font-mono text-slate-700">
                      {formatSeconds(roomScanTime)} / {formatSeconds(roomScanDuration || 42)}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={roomScanDuration || 42}
                    value={roomScanTime}
                    onChange={handleRoomScanSeek}
                    className="flex-1 accent-blue-600"
                  />

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      318° Coverage Verified
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CAMERA STREAM */}
            {activeRecordedTab === 'camera' && (
              <div className="space-y-4 pt-2">
                <div className="relative aspect-video rounded-2xl bg-slate-950 overflow-hidden border border-slate-200 shadow-md flex items-center justify-center">
                  <video
                    ref={webcamVideoRef}
                    onTimeUpdate={handleWebcamTimeUpdate}
                    src={evidenceSummary?.webcamVideo?.filePath || 'https://assets.mixkit.co/videos/preview/mixkit-young-man-studying-with-his-laptop-and-notepad-42881-large.mp4'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur text-white text-xs font-mono flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>RECORDED WEBCAM PROCTORING STREAM</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={toggleWebcamPlay}>
                      {webcamPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </Button>
                    <span className="font-mono text-slate-700">
                      {formatSeconds(webcamTime)} / {formatSeconds(webcamDuration || 3360)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={webcamDuration || 3360}
                    value={webcamTime}
                    onChange={handleWebcamSeek}
                    className="flex-1 accent-blue-600"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: AUDIO STREAM */}
            {activeRecordedTab === 'audio' && (
              <div className="space-y-4 pt-2">
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                  <Mic className="w-12 h-12 text-indigo-600 mx-auto" />
                  <h3 className="text-base font-bold text-slate-900">Audio Stream Audit</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Continuous microphone audio stream was active and captured at 48kHz. Ambient noise remained within compliant parameters.
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={audioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      onClick={() => setAudioPlaying(!audioPlaying)}
                    >
                      {audioPlaying ? 'Pause Audio Playback' : 'Listen to Proctoring Audio'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: AI DETECTION */}
            {activeRecordedTab === 'detection' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-blue-600" />
                    Face & Eye Tracking Telemetry
                  </h4>
                  <div className="space-y-1 text-slate-600">
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span>Face Detected Ratio:</span>
                      <strong className="text-emerald-700 font-mono">99.2%</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span>Gaze Forward Ratio:</span>
                      <strong className="text-emerald-700 font-mono">96.8%</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span>Eye Openness Stability:</span>
                      <strong className="text-emerald-700 font-mono">98.5%</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Glasses / Glare Detected:</span>
                      <strong className="text-slate-700">None (Transparent)</strong>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Multi-Face & Environmental Security
                  </h4>
                  <div className="space-y-1 text-slate-600">
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span>Multiple Faces Detected:</span>
                      <strong className="text-emerald-700 font-mono">0 Incidents</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span>Suspicious Audio Bursts:</span>
                      <strong className="text-emerald-700 font-mono">0 Detected</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Tab Switches / Inactive:</span>
                      <strong className="text-emerald-700 font-mono">0 Incidents</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: SCREENSHOTS */}
            {activeRecordedTab === 'screenshots' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {evidenceSummary?.snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    onClick={() => setSelectedSnapshotModal(snap)}
                    className="rounded-xl overflow-hidden bg-slate-50 border border-slate-200 cursor-pointer hover:shadow-md transition-all space-y-1.5 p-2"
                  >
                    <div className="aspect-video rounded-lg overflow-hidden bg-slate-900">
                      <img src={snap.img} alt="Snapshot" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-slate-800 truncate">{snap.triggerEvent}</span>
                      <span className="text-slate-400 font-mono">{snap.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 7: EVENTS TIMELINE */}
            {activeRecordedTab === 'events' && (
              <div className="divide-y divide-slate-100 pt-2 text-xs">
                {evidenceSummary?.integrityEvents.map((ev) => (
                  <div key={ev.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900">{ev.title}</strong>
                        <span className="text-[11px] text-slate-400 font-mono">{ev.timestamp}</span>
                      </div>
                      <p className="text-slate-600">{ev.description}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ev.severity === 'critical'
                          ? 'bg-rose-50 text-rose-700'
                          : ev.severity === 'warning'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {ev.severity.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Snapshot Modal */}
      {selectedSnapshotModal && (
        <Modal
          isOpen={!!selectedSnapshotModal}
          onClose={() => setSelectedSnapshotModal(null)}
          title={`Evidence Snapshot: ${selectedSnapshotModal.triggerEvent}`}
          subtitle={`Student: ${selectedSnapshotModal.studentName} • Timestamp: ${selectedSnapshotModal.timestamp}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-200 shadow-md">
              <img
                src={selectedSnapshotModal.img}
                alt="Full Snapshot"
                className="w-full h-auto object-contain"
              />
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Trigger: <strong>{selectedSnapshotModal.triggerEvent}</strong></span>
              <Button variant="secondary" size="sm" onClick={() => setSelectedSnapshotModal(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Live Broadcast Modal */}
      <BroadcastModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        onSendBroadcast={(msg, sev) => {
          alert(`[BROADCAST ${sev.toUpperCase()}]: "${msg}" dispatched to all active exam players!`);
        }}
      />

      {/* Live Direct Warning Modal */}
      {liveDirectWarningModal.isOpen && (
        <Modal
          isOpen={liveDirectWarningModal.isOpen}
          onClose={() => setLiveDirectWarningModal({ isOpen: false, studentName: '', warningText: '' })}
          title={`Send Proctoring Warning to ${liveDirectWarningModal.studentName}`}
          subtitle="This message will immediately flash onto the student's examination screen"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs text-slate-800">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Warning Message:
              </label>
              <textarea
                rows={3}
                value={liveDirectWarningModal.warningText}
                onChange={(e) => setLiveDirectWarningModal((prev) => ({ ...prev, warningText: e.target.value }))}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setLiveDirectWarningModal({ isOpen: false, studentName: '', warningText: '' })}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
                onClick={handleSendDirectWarning}
              >
                Send Warning Now
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Live Time Extension Modal */}
      <TimeExtensionModal
        isOpen={!!timeExtensionStudent}
        onClose={() => setTimeExtensionStudent(null)}
        candidate={timeExtensionStudent}
        onGrantTime={(_stuId, mins) => {
          alert(`+${mins} Minutes granted to candidate.`);
          setTimeExtensionStudent(null);
        }}
      />

      {/* Live Remote Terminate Modal */}
      {terminateCandidateModal.isOpen && (
        <Modal
          isOpen={terminateCandidateModal.isOpen}
          onClose={() => setTerminateCandidateModal({ isOpen: false, studentName: '', attemptId: '', reason: '' })}
          title="Remote Live Exam Termination"
          subtitle={`Immediately terminate and lock ${terminateCandidateModal.studentName}'s exam attempt`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs text-slate-800">
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block">
                Warning: Immediate Termination
              </span>
              <p>
                The candidate's examination will be immediately terminated, responses auto-saved, and their session locked under <code>terminated_proctoring</code>.
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Select or Enter Termination Reason:
              </label>
              <select
                value={terminateCandidateModal.reason}
                onChange={(e) => setTerminateCandidateModal((prev) => ({ ...prev, reason: e.target.value }))}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none"
              >
                <option value="Unauthorized external assistance detected.">Unauthorized external assistance detected</option>
                <option value="Repeated tab switching or navigating away.">Repeated tab switching or navigating away</option>
                <option value="Multiple faces detected in examination environment.">Multiple faces detected in environment</option>
                <option value="Camera or microphone stream deliberately obstructed.">Camera/Mic stream obstructed</option>
                <option value="Instructor direct intervention.">Instructor direct intervention</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setTerminateCandidateModal({ isOpen: false, studentName: '', attemptId: '', reason: '' })}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="font-bold"
                onClick={handleRemoteTerminateSubmit}
              >
                Confirm Termination
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Upload MCQ PDF Modal */}
      <UploadMcqModal
        isOpen={isUploadMcqModalOpen}
        onClose={() => setIsUploadMcqModalOpen(false)}
      />
    </div>
  );
};
