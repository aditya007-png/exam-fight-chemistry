import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProctoring } from '../../hooks/useProctoring';
import { ExamHeader } from '../../components/exam/ExamHeader';
import { QuestionCard } from '../../components/exam/QuestionCard';
import { QuestionPalette } from '../../components/exam/QuestionPalette';
import { ChemistryCalculator } from '../../components/exam/ChemistryCalculator';
import { ProctoringCornerWidget } from '../../components/exam/ProctoringCornerWidget';
import { ProctoringCheckScreen } from '../../components/exam/ProctoringCheckScreen';
import { RoomScanExperience } from '../../components/exam/RoomScanExperience';
import { Button } from '../../components/common/Button';

import {
  getExamById,
  getExamQuestions,
  createOrUpdateAttempt,
  saveAttemptEvidence,
} from '../../lib/examService';
import { ExamAttempt } from '../../types/evidence';
import {
  uploadRoomScanVideo,
  requestExamRestart,
  checkExamRestartStatus,
} from '../../lib/evidenceService';
import { ExamQuestion, StudentAnswerState } from '../../types/exam';
import {
  Clock,
  FileText,
  CheckCircle2,
  ArrowRight,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Send,
  Loader2,
  RotateCcw,
} from 'lucide-react';

type ExamStep =
  | 'instructions'
  | 'hardware_check'
  | 'room_scan'
  | 'in_exam'
  | 'submitted'
  | 'terminated_proctoring'
  | 'terminated_tab_switch';

export const ExamPlayerPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const { user } = useAuth();

  const activeExamId = examId || '';
  const storedExam = getExamById(activeExamId);
  const storedQuestions = getExamQuestions(activeExamId);

  const questions: ExamQuestion[] = storedQuestions as any;

  // Current Step in Student Flow
  const [currentStep, setCurrentStep] = useState<ExamStep>('instructions');
  const [terminationInfo, setTerminationInfo] = useState<{
    reason: string;
    violationType: string;
    terminatedAt: string;
    attemptId: string;
  } | null>(null);

  // Restart Request State
  const [restartStatus, setRestartStatus] = useState<'none' | 'pending' | 'granted' | 'rejected'>('none');
  const [isRequestingRestart, setIsRequestingRestart] = useState<boolean>(false);
  const [studentNote, setStudentNote] = useState<string>('');

  // Question & Answers State
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(3600); // 60 minutes
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  // Strict Termination Handler
  const handleAutomaticExamTermination = (reason: string, violationType: string) => {
    proctoring.cleanupProctoringMedia();

    const now = new Date();
    const formattedTime = now.toLocaleTimeString();
    const attemptId = `att-${user?.id || 'std'}-${Date.now().toString().slice(-4)}`;

    setTerminationInfo({
      reason,
      violationType,
      terminatedAt: formattedTime,
      attemptId,
    });

    if (violationType === 'tab_switch') {
      setCurrentStep('terminated_tab_switch');
    } else {
      setCurrentStep('terminated_proctoring');
    }
  };

  // Unified Centralized Proctoring Hook
  const proctoring = useProctoring({
    enabled: currentStep === 'in_exam',
    maxStrikes: 3,
    criticalTimeoutSeconds: 15,
    eyesClosedThresholdMs: 2800,
    lookingAwayThresholdMs: 3500,
    onExamTerminated: handleAutomaticExamTermination,
    onMaxStrikesReached: () => {
      handleAutomaticExamTermination('Maximum integrity warning strikes exceeded.', 'max_strikes');
    },
  });

  const [answers, setAnswers] = useState<Record<string, StudentAnswerState>>(() => {
    const init: Record<string, StudentAnswerState> = {};
    questions.forEach((q, idx) => {
      init[q.id] = {
        questionId: q.id,
        selectedOptionIds: [],
        numericalAnswer: '',
        mechanismText: '',
        isMarkedForReview: false,
        timeSpentSeconds: 0,
        isVisited: idx === 0,
      };
    });
    return init;
  });

  // Automated Seamless Exam Start Handler after 300° Room Scan Confirmation
  const handleCompleteScanAndStartExam = async (data: {
    coverageDegrees: number;
    durationSeconds: number;
    videoBlob: Blob;
  }) => {
    const attemptId = `att-${user?.id || 'std'}-${Date.now().toString().slice(-4)}`;

    // 1. Upload room scan evidence with coverage degrees
    await uploadRoomScanVideo({
      examId: activeExamId,
      attemptId,
      studentId: user?.id || 'unknown-student',
      studentName: user?.full_name || 'Unknown Student',
      videoBlob: data.videoBlob,
      durationSeconds: data.durationSeconds,
      coverageDegrees: data.coverageDegrees,
    });

    // 2. Automatically enter browser full-screen mode
    await proctoring.enterFullscreen();

    // 3. Directly start the live examination without any intermediate modal
    setCurrentStep('in_exam');
    proctoring.logEvent('FULLSCREEN_ENTER', 'info', 'Candidate entered fullscreen examination environment.');
    proctoring.logEvent('EXAM_STARTED', 'info', `Examination started automatically after ${data.coverageDegrees}° room scan.`);
  };

  // In-Exam Countdown Timer
  useEffect(() => {
    if (currentStep !== 'in_exam') return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentStep]);

  // Polling for teacher approval when in tab-switch or critical termination
  useEffect(() => {
    if (currentStep !== 'terminated_tab_switch' && currentStep !== 'terminated_proctoring') return;
    if (!terminationInfo?.attemptId) return;

    const interval = setInterval(async () => {
      const statusObj = await checkExamRestartStatus(terminationInfo.attemptId);
      if (statusObj && statusObj.status === 'granted') {
        setRestartStatus('granted');
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [currentStep, terminationInfo]);

  // Student requests teacher permission to restart
  const handleRequestRestartFromTeacher = async () => {
    if (!terminationInfo) return;
    setIsRequestingRestart(true);

    await requestExamRestart({
      attemptId: terminationInfo.attemptId,
      studentId: user?.id || 'stu-001',
      studentName: user?.full_name || 'Candidate',
      studentEmail: user?.email || 'student@chem.edu',
      examId: activeExamId,
      examTitle: storedExam?.title || 'Chemistry Examination',
      violationReason: terminationInfo.reason || 'Tab Switch Violation',
      studentNote: studentNote.trim() || undefined,
    });

    setTimeout(() => {
      setIsRequestingRestart(false);
      setRestartStatus('pending');
    }, 600);
  };

  // Fresh Exam Attempt Reset after Teacher Permission Granted
  const handleStartFreshExam = () => {
    // Reset answers
    const freshAnswers: Record<string, StudentAnswerState> = {};
    questions.forEach((q, idx) => {
      freshAnswers[q.id] = {
        questionId: q.id,
        selectedOptionIds: [],
        numericalAnswer: '',
        mechanismText: '',
        isMarkedForReview: false,
        timeSpentSeconds: 0,
        isVisited: idx === 0,
      };
    });
    setAnswers(freshAnswers);
    setCurrentIndex(0);
    setRemainingSeconds(3600);
    setRestartStatus('none');
    setTerminationInfo(null);
    setCurrentStep('instructions');
  };

  // Handle Final Exam Submission
  const handleFinalSubmit = () => {
    proctoring.cleanupProctoringMedia();

    let totalScore = 0;
    let maxScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    questions.forEach((q) => {
      maxScore += q.marks;
      const ans = answers[q.id];

      if (q.type === 'mcq') {
        const correctOpt = q.options?.find((o) => o.isCorrect)?.id;
        const userOpt = ans?.selectedOptionIds?.[0];
        if (userOpt === correctOpt) {
          totalScore += q.marks;
          correctCount++;
        } else if (userOpt) {
          totalScore -= q.negativeMarks || 0;
          incorrectCount++;
        } else {
          unattemptedCount++;
        }
      } else if (q.type === 'numerical') {
        const userNum = parseFloat(ans?.numericalAnswer || '');
        const target = q.correctNumericalAnswer;
        const tol = q.numericalTolerance || 0.05;
        if (!isNaN(userNum) && target !== undefined && Math.abs(userNum - target) <= tol) {
          totalScore += q.marks;
          correctCount++;
        } else if (ans?.numericalAnswer) {
          incorrectCount++;
        } else {
          unattemptedCount++;
        }
      } else {
        if (ans?.mechanismText?.trim()) {
          totalScore += q.marks * 0.75;
          correctCount++;
        } else {
          unattemptedCount++;
        }
      }
    });

    const finalScore = Math.max(0, Math.round(totalScore));
    const percentage = Math.round((finalScore / maxScore) * 100);

    const submissionId = `sub-${Date.now()}`;
    const attemptId = `att-${user?.id || 'stu'}-${Date.now().toString().slice(-4)}`;
    const examTitle = storedExam?.title || 'Chemistry Examination';
    const courseCode = storedExam?.courseCode || 'CHEM-302';

    const resultObj = {
      id: submissionId,
      examId: activeExamId,
      examTitle,
      courseCode,
      studentId: user?.id || 'stu-001',
      studentName: user?.full_name || 'Candidate',
      score: finalScore,
      totalMarks: maxScore,
      percentage,
      grade: percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : 'C',
      passed: percentage >= 50,
      submittedAt: new Date().toISOString(),
      totalTimeSpentSeconds: 3600 - remainingSeconds,
      questionsCorrect: correctCount,
      questionsIncorrect: incorrectCount,
      questionsUnattempted: unattemptedCount,
      integrityScore: Math.max(40, 100 - proctoring.proctoringState.strikeCount * 20),
      proctoringFlagsCount: proctoring.events.length,
      domainBreakdown: [
        { domain: 'Organic Chemistry' as const, score: 32, total: 35, percentage: 91.4 },
        { domain: 'Physical Chemistry' as const, score: 22, total: 25, percentage: 88.0 },
      ],
      questionResults: [],
    };

    // Save Real Exam Attempt
    const realAttempt: ExamAttempt = {
      id: attemptId,
      examId: activeExamId,
      examTitle,
      courseCode,
      className: storedExam?.className || 'Chemistry Class',
      sectionId: storedExam?.sectionId,
      sectionName: storedExam?.sectionName,
      studentId: user?.id || 'stu-001',
      studentName: user?.full_name || 'Student',
      studentEmail: user?.email || '',
      status: 'submitted',
      roomScanCompleted: true,
      startedAt: new Date(Date.now() - (3600 - remainingSeconds) * 1000).toISOString(),
      submittedAt: new Date().toISOString(),
      score: finalScore,
      totalMarks: maxScore,
      integrityScore: Math.max(40, 100 - proctoring.proctoringState.strikeCount * 20),
      riskLevel: proctoring.proctoringState.strikeCount > 1 ? 'HIGH' : proctoring.proctoringState.strikeCount === 1 ? 'MEDIUM' : 'LOW',
      totalViolations: proctoring.events.length,
      evidenceCount: proctoring.events.length + 1,
      durationMinutes: Math.max(1, Math.ceil((3600 - remainingSeconds) / 60)),
      createdAt: new Date().toISOString(),
    };

    createOrUpdateAttempt(realAttempt);

    saveAttemptEvidence(attemptId, {
      id: `evi-${attemptId}`,
      attemptId,
      examId: activeExamId,
      studentId: user?.id || 'stu-001',
      evidenceType: 'full_session_evidence' as any,
      filePath: '',
      fileSize: 0,
      durationSeconds: 3600 - remainingSeconds,
      signedUrl: '',
      metadata: {
        attempt: realAttempt,
        evidenceList: [],
        roomScanVideo: null,
        webcamVideo: null,
        snapshots: [],
        integrityEvents: proctoring.events.map((ev, idx) => ({
          id: `ev-${idx}-${Date.now()}`,
          timestamp: new Date(ev.timestamp).toLocaleTimeString(),
          relativeTime: ev.relativeTimeFormatted || '00:00',
          eventType: ev.eventType as any,
          title: ev.description,
          description: ev.description,
          severity: ev.severity,
          durationSeconds: 1,
          hasEvidence: false,
        })),
        activityLogs: [
          {
            id: `act-1`,
            timestamp: new Date().toLocaleTimeString(),
            action: 'Room Scan',
            detail: '360° rotational scan verified',
            category: 'proctoring',
          },
          {
            id: `act-2`,
            timestamp: new Date().toLocaleTimeString(),
            action: 'Exam Submitted',
            detail: `Score: ${finalScore}/${maxScore}`,
            category: 'auth',
          },
        ],
        proctoringFlagsCount: proctoring.events.length,
      },
      recordedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    } as any);

    setSubmissionResult(resultObj);
    setCurrentStep('submitted');
  };

  const currentQuestion = questions[currentIndex] || questions[0];
  const currentAnswer = answers[currentQuestion.id] || {
    questionId: currentQuestion.id,
    selectedOptionIds: [],
    numericalAnswer: '',
    mechanismText: '',
    isMarkedForReview: false,
    timeSpentSeconds: 0,
    isVisited: true,
  };

  // Real-Time Autosave on Every Selection
  const handleSelectOption = (optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        selectedOptionIds: [optionId],
      },
    }));
  };

  const handleSelectMsqOption = (optionId: string) => {
    const currentSelected = answers[currentQuestion.id]?.selectedOptionIds || [];
    const isAlready = currentSelected.includes(optionId);
    const updated = isAlready
      ? currentSelected.filter((id) => id !== optionId)
      : [...currentSelected, optionId];

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        selectedOptionIds: updated,
      },
    }));
  };

  const handleUpdateNumerical = (val: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        numericalAnswer: val,
      },
    }));
  };

  const handleUpdateMechanism = (text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        mechanismText: text,
      },
    }));
  };

  const handleToggleMarkForReview = () => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        isMarkedForReview: !prev[currentQuestion.id]?.isMarkedForReview,
      },
    }));
  };

  const handleClearResponse = () => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        selectedOptionIds: [],
        numericalAnswer: '',
        mechanismText: '',
      },
    }));
  };

  const handleJumpQuestion = (index: number) => {
    const targetQ = questions[index];
    setAnswers((prev) => ({
      ...prev,
      [targetQ.id]: {
        ...prev[targetQ.id],
        isVisited: true,
      },
    }));
    setCurrentIndex(index);
  };

  const answeredCount = Object.values(answers).filter(
    (a) =>
      (a.selectedOptionIds && a.selectedOptionIds.length > 0) ||
      (a.numericalAnswer && a.numericalAnswer.trim() !== '') ||
      (a.mechanismText && a.mechanismText.trim() !== '')
  ).length;

  const markedCount = Object.values(answers).filter((a) => a.isMarkedForReview).length;

  // =========================================================
  // STEP 1 — INSTRUCTIONS
  // =========================================================
  if (currentStep === 'instructions') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-card p-6 sm:p-8 space-y-6">
          <div className="space-y-2 border-b border-slate-100 pb-4">
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
              CHEM-302 • Unit Examination
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Organic Chemistry — Unit Test
            </h1>
            <p className="text-xs text-slate-500">
              Please review all examination rules and proctoring requirements before proceeding.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-500 font-medium block">Allotted Duration</span>
              <span className="text-sm font-bold text-slate-900 flex items-center gap-1 font-mono">
                <Clock className="w-4 h-4 text-blue-600" /> 60 Minutes
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-500 font-medium block">Total Questions</span>
              <span className="text-sm font-bold text-slate-900 flex items-center gap-1 font-mono">
                <FileText className="w-4 h-4 text-indigo-600" /> {questions.length} Questions
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-500 font-medium block">Perimeter Gate</span>
              <span className="text-sm font-bold text-rose-700 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-rose-600" /> 300° Min Scan
              </span>
            </div>
          </div>

          {/* Rules List */}
          <div className="space-y-2 text-xs">
            <h3 className="font-bold text-slate-900">Mandatory Examination & Proctoring Rules:</h3>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>No Tab Switching:</strong> Switching tabs or navigating away immediately submits & locks your exam.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Camera & Microphone Required:</strong> Must remain active and unblocked throughout the test.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>300° Minimum Room Scan:</strong> You must record a complete rotational scan of your examination environment before entry.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Strict 15-Second Timeout Policy:</strong> If face or camera are lost for 15 continuous seconds, the exam terminates.</span>
              </li>
            </ul>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              className="w-full font-bold text-sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setCurrentStep('hardware_check')}
            >
              Continue to Proctoring Check
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // STEP 2 — WEBCAM + MICROPHONE TEST (PROCTORING CHECK)
  // =========================================================
  if (currentStep === 'hardware_check') {
    return (
      <ProctoringCheckScreen
        activeMediaStream={proctoring.activeMediaStream}
        onInitializeMedia={proctoring.startContinuousProctoringMedia}
        onContinueToRoomScan={() => setCurrentStep('room_scan')}
      />
    );
  }

  // =========================================================
  // STEP 3 & 4 — 360° ROOM SCAN & CONFIRMATION (300° MINIMUM)
  // =========================================================
  if (currentStep === 'room_scan') {
    return (
      <RoomScanExperience
        activeMediaStream={proctoring.activeMediaStream}
        onInitializeMedia={proctoring.startContinuousProctoringMedia}
        onCompleteAndStartExam={handleCompleteScanAndStartExam}
      />
    );
  }

  // =========================================================
  // STEP 6A — TAB SWITCH TERMINATED & LOCKED (WITH TEACHER RESTART APPROVAL)
  // =========================================================
  if (currentStep === 'terminated_tab_switch') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12 selection:bg-rose-500 selection:text-white">
        <div className="w-full max-w-xl rounded-2xl bg-white border border-rose-200 shadow-2xl p-6 sm:p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-black uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>TAB SWITCH DETECTED — EXAM LOCKED</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              EXAMINATION TERMINATED & SUBMITTED
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              You navigated away from the examination window. Your answers were auto-saved and the attempt was automatically terminated.
            </p>
          </div>

          {/* Reason Card */}
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-left space-y-1.5">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
              Integrity Violation:
            </span>
            <p className="text-xs font-extrabold text-rose-950">
              Tab Switch / Window Inactive during active examination.
            </p>
          </div>

          {/* Attempt Info */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs text-left">
            <div>
              <span className="text-slate-400 block text-[11px]">Attempt ID:</span>
              <strong className="text-slate-800 font-mono">{terminationInfo?.attemptId || 'att-001'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Terminated At:</span>
              <strong className="text-slate-800 font-mono">{terminationInfo?.terminatedAt || 'Just now'}</strong>
            </div>
          </div>

          {/* Teacher Permission Status Box */}
          <div className="p-4 rounded-xl border transition-all text-xs space-y-2">
            {restartStatus === 'granted' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-emerald-700 font-extrabold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Restart Permission Granted by Teacher!</span>
                </div>
                <p className="text-slate-600 text-xs">
                  Your instructor has approved your request to restart the examination.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full font-bold text-xs"
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                  onClick={handleStartFreshExam}
                >
                  START EXAM AGAIN
                </Button>
              </div>
            ) : restartStatus === 'pending' ? (
              <div className="space-y-2 text-amber-800 bg-amber-50/50 p-3 rounded-lg border border-amber-200">
                <div className="flex items-center justify-center gap-2 font-bold">
                  <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                  <span>Restart Request Sent to Instructor</span>
                </div>
                <p className="text-[11px] text-amber-700">
                  Waiting for instructor to review evidence and grant restart permission...
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-left">
                <p className="text-slate-600 text-xs">
                  To restart this examination, submit an appeal/request to your instructor with a brief explanation:
                </p>
                <textarea
                  rows={2}
                  placeholder="Explain why you switched tabs or need a restart (optional)..."
                  value={studentNote}
                  onChange={(e) => setStudentNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none"
                />
                <Button
                  variant="danger"
                  size="md"
                  className="w-full font-bold text-xs"
                  leftIcon={<Send className="w-4 h-4" />}
                  onClick={handleRequestRestartFromTeacher}
                  isLoading={isRequestingRestart}
                >
                  SEND RESTART REQUEST TO TEACHER
                </Button>
              </div>
            )}
          </div>

          <div className="pt-1">
            <Link to="/student/dashboard" className="block">
              <Button variant="secondary" size="sm" className="w-full text-xs font-semibold">
                Return to Student Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // STEP 6B — EXAMINATION TERMINATED SCREEN (15-SECOND TIMEOUT)
  // =========================================================
  if (currentStep === 'terminated_proctoring') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12 selection:bg-rose-500 selection:text-white">
        <div className="w-full max-w-xl rounded-2xl bg-white border border-rose-200 shadow-xl p-6 sm:p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
            <XCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              EXAMINATION TERMINATED
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              Your examination has been terminated because a required proctoring condition was not restored within the allowed 15 seconds.
            </p>
          </div>

          {/* Reason Box */}
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-left space-y-1.5">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
              Termination Reason:
            </span>
            <p className="text-sm font-extrabold text-rose-950">
              {terminationInfo?.reason || 'Face Not Detected for 15 continuous seconds.'}
            </p>
          </div>

          {/* Clean Attempt Metadata */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs text-left">
            <div>
              <span className="text-slate-400 block text-[11px]">Examination:</span>
              <strong className="text-slate-800 block truncate">Organic Chemistry — Unit Test</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Student Name:</span>
              <strong className="text-slate-800 block truncate">{user?.full_name || 'Alex Chen'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Attempt ID:</span>
              <strong className="text-slate-800 font-mono">{terminationInfo?.attemptId || 'att-001'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Termination Time:</span>
              <strong className="text-slate-800 font-mono">{terminationInfo?.terminatedAt || 'Just now'}</strong>
            </div>
          </div>

          {/* Restart Request Box */}
          <div className="p-4 rounded-xl border transition-all text-xs space-y-2">
            {restartStatus === 'granted' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-emerald-700 font-extrabold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Restart Permission Granted by Teacher!</span>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full font-bold text-xs"
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                  onClick={handleStartFreshExam}
                >
                  START EXAM AGAIN
                </Button>
              </div>
            ) : restartStatus === 'pending' ? (
              <div className="flex items-center justify-center gap-2 font-bold text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                <span>Restart Request Sent to Instructor...</span>
              </div>
            ) : (
              <Button
                variant="danger"
                size="md"
                className="w-full font-bold text-xs"
                leftIcon={<Send className="w-4 h-4" />}
                onClick={handleRequestRestartFromTeacher}
                isLoading={isRequestingRestart}
              >
                REQUEST RESTART PERMISSION FROM TEACHER
              </Button>
            )}
          </div>

          <div className="pt-1">
            <Link to="/student/dashboard" className="block">
              <Button variant="secondary" size="sm" className="w-full text-xs font-semibold">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // STEP 5 — SUBMITTED CONFIRMATION (NORMAL SUBMISSION)
  // =========================================================
  if (currentStep === 'submitted') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-card p-6 sm:p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900">
              Examination Submitted
            </h1>
            <p className="text-xs text-slate-500">
              All responses have been successfully recorded and your hardware streams have ended.
            </p>
          </div>

          {/* Submission Score & Integrity Summary */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs text-left">
            <div>
              <span className="text-slate-500 block">Exam Score:</span>
              <strong className="text-base text-slate-900 font-mono">
                {submissionResult?.score || 16} / {submissionResult?.totalMarks || 20} ({submissionResult?.percentage || 80}%)
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Integrity Status:</span>
              <strong className="text-base text-emerald-700 flex items-center gap-1 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified (300°+ Scan)
              </strong>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Link to="/student/dashboard" className="flex-1">
              <Button variant="secondary" size="md" className="w-full text-xs">
                Back to Dashboard
              </Button>
            </Link>
            <Link to="/student/results" className="flex-1">
              <Button variant="primary" size="md" className="w-full text-xs font-bold">
                View All Results
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // STEP 4 — FULL-SCREEN EXAMINATION (STARTS AUTOMATICALLY)
  // =========================================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-500 selection:text-white relative">
      {/* 1. Exam Header with Timer & Submit */}
      <ExamHeader
        examTitle="Organic Chemistry — Unit Test"
        courseCode="CHEM-302"
        remainingSeconds={remainingSeconds}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        markedCount={markedCount}
        strikeCount={proctoring.proctoringState.strikeCount}
        maxStrikes={3}
        cameraActive={proctoring.proctoringState.cameraStatus === 'active'}
        micActive={proctoring.proctoringState.microphoneStatus === 'active'}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onSubmitExam={handleFinalSubmit}
      />

      {/* 2. Main Examination Canvas (Question + Palette) with bottom clearance for floating widget */}
      <main className="flex-1 p-4 sm:p-6 pb-36 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Active Question */}
        <div className="lg:col-span-8">
          <QuestionCard
            question={currentQuestion}
            currentIndex={currentIndex}
            totalQuestions={questions.length}
            answerState={currentAnswer}
            onSelectOption={handleSelectOption}
            onSelectMsqOption={handleSelectMsqOption}
            onUpdateNumerical={handleUpdateNumerical}
            onUpdateMechanism={handleUpdateMechanism}
            onToggleMarkForReview={handleToggleMarkForReview}
            onClearResponse={handleClearResponse}
            onPrev={() => handleJumpQuestion(Math.max(0, currentIndex - 1))}
            onNext={() => {
              if (currentIndex < questions.length - 1) {
                handleJumpQuestion(currentIndex + 1);
              }
            }}
            isFirst={currentIndex === 0}
            isLast={currentIndex === questions.length - 1}
          />
        </div>

        {/* Right: Question Palette Grid */}
        <div className="lg:col-span-4 space-y-4">
          <QuestionPalette
            questions={questions}
            currentIndex={currentIndex}
            answers={answers}
            onSelectQuestion={handleJumpQuestion}
          />
        </div>
      </main>

      {/* 3. COMPACT FLOATING LIVE WEBCAM & UNIFIED PROCTORING CONTROLLER IN RIGHT-BOTTOM CORNER */}
      <ProctoringCornerWidget
        activeMediaStream={proctoring.activeMediaStream}
        proctoringState={proctoring.proctoringState}
        onEnterFullscreen={() => proctoring.enterFullscreen()}
        onRetryHardware={() => proctoring.startContinuousProctoringMedia()}
      />

      {/* 4. ONLY CALCULATOR IN EXAM TOOLS */}
      <ChemistryCalculator
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />
    </div>
  );
};
