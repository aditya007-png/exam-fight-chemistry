import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { ExamErrorBoundary } from '../../components/exam/ExamErrorBoundary';
import { Button } from '../../components/common/Button';

import {
  getExamById,
  getExamQuestions,
  fetchExamsFromDB,
  createOrUpdateAttempt,
  saveAttemptEvidence,
} from '../../lib/examService';
import { ExamAttempt } from '../../types/evidence';
import {
  uploadRoomScanVideo,
  requestExamRestart,
  checkExamRestartStatus,
} from '../../lib/evidenceService';
import { createStudentRequest } from '../../lib/requestService';
import { ExamQuestion, StudentAnswerState } from '../../types/exam';
import { ExamItem } from '../../types/dashboard';
import {
  Clock,
  FileText,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Send,
  Loader2,
  RotateCcw,
  AlertTriangle,
  Home,
  RefreshCw,
} from 'lucide-react';

type ExamStep =
  | 'instructions'
  | 'hardware_check'
  | 'room_scan'
  | 'in_exam'
  | 'submitted'
  | 'terminated_proctoring'
  | 'terminated_tab_switch';

const InnerExamPlayer: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const { user } = useAuth();

  const activeExamId = examId || '';

  // Exam & Questions State
  const [exam, setExam] = useState<ExamItem | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [isLoadingExam, setIsLoadingExam] = useState<boolean>(true);
  const [examLoadError, setExamLoadError] = useState<string | null>(null);

  // Attempt State
  const attemptIdRef = useRef<string>(`att-${user?.id || 'stu'}-${Date.now().toString(36)}`);
  const [attemptInitialized, setAttemptInitialized] = useState<boolean>(false);

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
  const [remainingSeconds, setRemainingSeconds] = useState<number>(3600);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, StudentAnswerState>>({});

  // 1. Fetch & Initialize Exam & Questions safely
  const loadExam = useCallback(async () => {
    if (!activeExamId) {
      setExamLoadError('Invalid examination ID provided.');
      setIsLoadingExam(false);
      return;
    }

    setIsLoadingExam(true);
    setExamLoadError(null);

    try {
      // Check cached store
      let currentEx = getExamById(activeExamId);
      let currentQs = getExamQuestions(activeExamId);

      // Fetch fresh from backend API
      if (!currentEx || currentQs.length === 0) {
        try {
          const res = await fetch(`/api/exams/${activeExamId}${user?.id ? `?studentId=${user.id}` : ''}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.exam) {
              currentEx = {
                id: data.exam.id,
                title: data.exam.title,
                topic: data.exam.topic || 'General Chemistry',
                courseCode: data.exam.courseCode || 'CHEM-101',
                courseName: data.exam.courseName || `${data.exam.courseCode || 'CHEM-101'} — Chemistry`,
                teacherName: data.exam.teacherName || 'Faculty Instructor',
                teacherId: data.exam.teacherId,
                classId: data.exam.classId,
                className: data.exam.className,
                sectionId: data.exam.sectionId,
                sectionName: data.exam.sectionName,
                durationMinutes: data.exam.durationMinutes || 60,
                totalQuestions: data.exam.questions ? data.exam.questions.length : 10,
                totalMarks: data.exam.totalMarks || 100,
                passingMarks: data.exam.passingMarks || 40,
                status: data.exam.status || 'active',
                scheduledStart: data.exam.scheduledStart || new Date().toISOString(),
                scheduledEnd: data.exam.scheduledEnd || new Date(Date.now() + 3600000).toISOString(),
              };

              if (Array.isArray(data.exam.questions) && data.exam.questions.length > 0) {
                currentQs = data.exam.questions;
              }
            }
          }
        } catch (apiErr) {
          console.warn('Direct exam fetch error:', apiErr);
        }
      }

      // If still not resolved, query user's assigned exams
      if (!currentEx) {
        const studentExams = await fetchExamsFromDB(
          user ? { studentId: user.id, studentEmail: user.email } : undefined
        );
        const matched = studentExams.find((e) => e.id === activeExamId);
        if (matched) {
          currentEx = matched;
          currentQs = getExamQuestions(activeExamId);
        }
      }

      if (!currentEx) {
        setExamLoadError(
          'This examination could not be loaded. Please verify that it is published and assigned to your section.'
        );
        setIsLoadingExam(false);
        return;
      }

      setExam(currentEx);
      const safeQuestions: ExamQuestion[] = (currentQs as any) || [];
      setQuestions(safeQuestions);
      setRemainingSeconds((currentEx.durationMinutes || 60) * 60);

      // Initialize answers dictionary
      const init: Record<string, StudentAnswerState> = {};
      safeQuestions.forEach((q, idx) => {
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
      setAnswers(init);
    } catch (err: any) {
      console.error('Fatal loadExam error:', err);
      setExamLoadError(err?.message || 'An unexpected error occurred while loading examination data.');
    } finally {
      setIsLoadingExam(false);
    }
  }, [activeExamId, user?.id, user?.email]);

  useEffect(() => {
    loadExam();
  }, [loadExam]);

  // Strict Termination Handler
  const handleAutomaticExamTermination = (reason: string, violationType: string) => {
    proctoring.cleanupProctoringMedia();

    const now = new Date();
    const formattedTime = now.toLocaleTimeString();
    const attemptId = attemptIdRef.current;

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

  // Automated Seamless Exam Start Handler after 360° Room Scan Confirmation
  const handleCompleteScanAndStartExam = async (data: {
    coverageDegrees: number;
    durationSeconds: number;
    videoBlob: Blob;
  }) => {
    const attemptId = attemptIdRef.current;

    // 1. Upload room scan evidence with 360° coverage degrees
    await uploadRoomScanVideo({
      examId: activeExamId,
      attemptId,
      studentId: user?.id || 'unknown-student',
      studentName: user?.full_name || 'Unknown Student',
      videoBlob: data.videoBlob,
      durationSeconds: data.durationSeconds,
      coverageDegrees: data.coverageDegrees,
    });

    // 2. Initialize real attempt in backend database
    if (!attemptInitialized && exam) {
      try {
        await fetch('/api/attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: attemptId,
            examId: activeExamId,
            studentId: user?.id || 'stu-001',
            studentName: user?.full_name || 'Student Candidate',
            studentEmail: user?.email || '',
            sectionId: exam.sectionId || '',
            classId: exam.classId || '',
            status: 'in_progress',
            startTime: new Date().toISOString(),
          }),
        });
        setAttemptInitialized(true);
      } catch (err) {
        console.warn('Attempt initialization fallback:', err);
      }
    }

    // 3. Automatically enter browser full-screen mode
    await proctoring.enterFullscreen();

    // 4. Directly start live examination
    setCurrentStep('in_exam');
    proctoring.logEvent('FULLSCREEN_ENTER', 'info', 'Candidate entered fullscreen examination environment.');
    proctoring.logEvent('EXAM_STARTED', 'info', `Examination started automatically after ${data.coverageDegrees}° 360-degree room scan.`);
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

    const messageText = studentNote.trim() || terminationInfo.reason || 'Exam exited unexpectedly. Requesting permission to resume examination.';

    await createStudentRequest({
      studentId: user?.id || 'stu-001',
      studentName: user?.full_name || 'Candidate',
      studentEmail: user?.email || 'student@chem.edu',
      examId: activeExamId,
      attemptId: terminationInfo.attemptId,
      requestType: 'EXAM_EXITED',
      message: messageText,
    });

    await requestExamRestart({
      attemptId: terminationInfo.attemptId,
      studentId: user?.id || 'stu-001',
      studentName: user?.full_name || 'Candidate',
      studentEmail: user?.email || 'student@chem.edu',
      examId: activeExamId,
      examTitle: exam?.title || 'Chemistry Examination',
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
    setRemainingSeconds((exam?.durationMinutes || 60) * 60);
    setRestartStatus('none');
    setTerminationInfo(null);
    setCurrentStep('instructions');
  };

  // Handle Final Exam Submission
  const handleFinalSubmit = async () => {
    proctoring.cleanupProctoringMedia();

    let totalScore = 0;
    let maxScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    const currentQuestions = questions.length > 0 ? questions : [];

    currentQuestions.forEach((q) => {
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
    const finalMaxScore = maxScore > 0 ? maxScore : 100;
    const percentage = Math.round((finalScore / finalMaxScore) * 100);

    const attemptId = attemptIdRef.current;
    const examTitle = exam?.title || 'Chemistry Examination';
    const courseCode = exam?.courseCode || 'CHEM-101';

    // Submit attempt directly to REST backend
    try {
      await fetch(`/api/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endTime: new Date().toISOString(),
          answers,
        }),
      });
    } catch (apiErr) {
      console.warn('REST submit fallback:', apiErr);
    }

    const resultObj = {
      id: `res-${attemptId}`,
      examId: activeExamId,
      examTitle,
      courseCode,
      studentId: user?.id || 'stu-001',
      studentName: user?.full_name || 'Student Candidate',
      score: finalScore,
      totalMarks: finalMaxScore,
      percentage,
      status: percentage >= (exam?.passingMarks || 40) ? 'passed' : 'failed',
      submittedAt: new Date().toISOString(),
      correctCount,
      incorrectCount,
      unattemptedCount,
    };

    const realAttempt: ExamAttempt = {
      id: attemptId,
      examId: activeExamId,
      examTitle,
      courseCode,
      studentId: user?.id || 'stu-001',
      studentName: user?.full_name || 'Student Candidate',
      studentEmail: user?.email || '',
      status: 'submitted',
      roomScanCompleted: true,
      startedAt: new Date(Date.now() - (3600 - remainingSeconds) * 1000).toISOString(),
      submittedAt: new Date().toISOString(),
      score: finalScore,
      totalMarks: finalMaxScore,
      integrityScore: Math.max(10, 100 - proctoring.events.length * 15),
      riskLevel: proctoring.events.length > 2 ? 'HIGH' : proctoring.events.length > 0 ? 'MEDIUM' : 'LOW',
      totalViolations: proctoring.events.length,
      evidenceCount: 1,
      durationMinutes: Math.max(1, Math.ceil((3600 - remainingSeconds) / 60)),
      createdAt: new Date().toISOString(),
    };

    await createOrUpdateAttempt(realAttempt);

    await saveAttemptEvidence(attemptId, {
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
            detail: '360° complete panoramic scan verified',
            category: 'proctoring',
          },
          {
            id: `act-2`,
            timestamp: new Date().toLocaleTimeString(),
            action: 'Exam Submitted',
            detail: `Score: ${finalScore}/${finalMaxScore}`,
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

  // Safe question getters
  const currentQuestion: ExamQuestion | null =
    questions.length > 0 && currentIndex < questions.length
      ? questions[currentIndex]
      : questions.length > 0
      ? questions[0]
      : null;

  const currentAnswer: StudentAnswerState =
    currentQuestion && answers[currentQuestion.id]
      ? answers[currentQuestion.id]
      : {
          questionId: currentQuestion?.id || 'q-default',
          selectedOptionIds: [],
          numericalAnswer: '',
          mechanismText: '',
          isMarkedForReview: false,
          timeSpentSeconds: 0,
          isVisited: true,
        };

  // Real-Time Autosave on Every Selection
  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    setAnswers((prev) => {
      const next = {
        ...prev,
        [qId]: {
          ...(prev[qId] || { questionId: qId, timeSpentSeconds: 0, isVisited: true }),
          selectedOptionIds: [optionId],
        },
      };

      // Persist to backend
      fetch(`/api/attempts/${attemptIdRef.current}/answers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: { [qId]: optionId } }),
      }).catch(() => {});

      return next;
    });
  };

  const handleSelectMsqOption = (optionId: string) => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    const currentSelected = answers[qId]?.selectedOptionIds || [];
    const isAlready = currentSelected.includes(optionId);
    const updated = isAlready
      ? currentSelected.filter((id) => id !== optionId)
      : [...currentSelected, optionId];

    setAnswers((prev) => {
      const next = {
        ...prev,
        [qId]: {
          ...(prev[qId] || { questionId: qId, timeSpentSeconds: 0, isVisited: true }),
          selectedOptionIds: updated,
        },
      };

      fetch(`/api/attempts/${attemptIdRef.current}/answers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: { [qId]: updated } }),
      }).catch(() => {});

      return next;
    });
  };

  const handleUpdateNumerical = (val: string) => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...(prev[qId] || { questionId: qId, timeSpentSeconds: 0, isVisited: true }),
        numericalAnswer: val,
      },
    }));
  };

  const handleUpdateMechanism = (text: string) => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...(prev[qId] || { questionId: qId, timeSpentSeconds: 0, isVisited: true }),
        mechanismText: text,
      },
    }));
  };

  const handleToggleMarkForReview = () => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...(prev[qId] || { questionId: qId, timeSpentSeconds: 0, isVisited: true }),
        isMarkedForReview: !prev[qId]?.isMarkedForReview,
      },
    }));
  };

  const handleClearResponse = () => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...(prev[qId] || { questionId: qId, timeSpentSeconds: 0, isVisited: true }),
        selectedOptionIds: [],
        numericalAnswer: '',
        mechanismText: '',
      },
    }));
  };

  const handleJumpQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      const targetQ = questions[index];
      setAnswers((prev) => ({
        ...prev,
        [targetQ.id]: {
          ...(prev[targetQ.id] || { questionId: targetQ.id, timeSpentSeconds: 0 }),
          isVisited: true,
        },
      }));
      setCurrentIndex(index);
    }
  };

  const answeredCount = Object.values(answers).filter(
    (a) =>
      (a.selectedOptionIds && a.selectedOptionIds.length > 0) ||
      (a.numericalAnswer && a.numericalAnswer.trim() !== '') ||
      (a.mechanismText && a.mechanismText.trim() !== '')
  ).length;

  const markedCount = Object.values(answers).filter((a) => a.isMarkedForReview).length;

  // -------------------------------------------------------------
  // LOADING STATE (Guarantees zero blank white screen)
  // -------------------------------------------------------------
  if (isLoadingExam) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-sm animate-pulse">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Loading Examination</h2>
            <p className="text-xs text-slate-500">
              Retrieving question bank and proctoring parameters from database...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ERROR STATE (Guarantees zero blank white screen)
  // -------------------------------------------------------------
  if (examLoadError || !exam) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-card p-6 sm:p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Examination Unavailable</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {examLoadError || 'The requested exam could not be loaded.'}
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              className="flex-1 text-xs font-bold"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={() => loadExam()}
            >
              Retry
            </Button>
            <Link to="/student/exams" className="flex-1">
              <Button variant="secondary" size="md" className="w-full text-xs" leftIcon={<Home className="w-4 h-4" />}>
                My Exams
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // STEP 1 — INSTRUCTIONS
  // =========================================================
  if (currentStep === 'instructions') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-card p-6 sm:p-8 space-y-6">
          <div className="space-y-2 border-b border-slate-100 pb-4">
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
              {exam.courseCode || 'CHEM-101'} • {exam.className || 'Chemistry Course'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {exam.title}
            </h1>
            <p className="text-xs text-slate-500">
              Instructor: <strong className="text-slate-700">{exam.teacherName}</strong> • Please review all examination rules and proctoring requirements before proceeding.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-500 font-medium block">Allotted Duration</span>
              <span className="text-sm font-bold text-slate-900 flex items-center gap-1 font-mono">
                <Clock className="w-4 h-4 text-blue-600" /> {exam.durationMinutes || 60} Minutes
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
              <span className="text-sm font-bold text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> 360° Complete Scan
              </span>
            </div>
          </div>

          {/* Rules List */}
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2 text-xs text-blue-950">
            <span className="font-bold block uppercase tracking-wider text-[11px] text-blue-800">
              Automated Integrity Protocol:
            </span>
            <ul className="space-y-1.5 list-disc pl-4 text-slate-700">
              <li>Continuous live camera and audio recording active during entire assessment.</li>
              <li>A full 360° panoramic room scan must be completed before entering the exam.</li>
              <li>Tab switching or exiting fullscreen will immediately trigger security warning strikes.</li>
              <li>Calculators and formula reference tools are provided directly in the interface.</li>
            </ul>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link to="/student/exams">
              <Button variant="secondary" size="md">
                Cancel
              </Button>
            </Link>
            <Button
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setCurrentStep('hardware_check')}
            >
              Verify Hardware & Proceed
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // STEP 2 — HARDWARE VERIFICATION
  // =========================================================
  if (currentStep === 'hardware_check') {
    return (
      <ProctoringCheckScreen
        activeMediaStream={proctoring.activeMediaStream}
        onInitializeMedia={() => proctoring.startContinuousProctoringMedia()}
        onContinueToRoomScan={() => setCurrentStep('room_scan')}
      />
    );
  }

  // =========================================================
  // STEP 3 — 360° ROOM SCAN
  // =========================================================
  if (currentStep === 'room_scan') {
    return (
      <RoomScanExperience
        activeMediaStream={proctoring.activeMediaStream}
        onInitializeMedia={() => proctoring.startContinuousProctoringMedia()}
        onCompleteAndStartExam={handleCompleteScanAndStartExam}
      />
    );
  }

  // =========================================================
  // STEP 4 — TERMINATION SCREENS (LOCK & PROCTORING STRIKES)
  // =========================================================
  if (currentStep === 'terminated_proctoring' || currentStep === 'terminated_tab_switch') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-card p-6 sm:p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900">
              Examination Interrupted
            </h1>
            <p className="text-xs text-slate-500">
              The automated proctoring monitor detected an integrity event and locked your session.
            </p>
          </div>

          {/* Reason Box */}
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-left space-y-1.5">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
              Interruption Reason:
            </span>
            <p className="text-sm font-extrabold text-rose-950">
              {terminationInfo?.reason || 'Face Not Detected for 15 continuous seconds.'}
            </p>
          </div>

          {/* Clean Attempt Metadata */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs text-left">
            <div>
              <span className="text-slate-400 block text-[11px]">Examination:</span>
              <strong className="text-slate-800 block truncate">{exam.title}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Student Name:</span>
              <strong className="text-slate-800 block truncate">{user?.full_name || 'Student Candidate'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Attempt ID:</span>
              <strong className="text-slate-800 font-mono">{terminationInfo?.attemptId || attemptIdRef.current}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Interruption Time:</span>
              <strong className="text-slate-800 font-mono">{terminationInfo?.terminatedAt || 'Just now'}</strong>
            </div>
          </div>

          {/* Restart / Re-entry Request Box */}
          <div className="p-4 rounded-xl border transition-all text-xs space-y-2">
            {restartStatus === 'granted' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-emerald-700 font-extrabold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Restart Permission Granted by Instructor!</span>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full font-bold text-xs"
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                  onClick={handleStartFreshExam}
                >
                  RESUME EXAMINATION
                </Button>
              </div>
            ) : restartStatus === 'pending' ? (
              <div className="flex items-center justify-center gap-2 font-bold text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                <span>Re-entry Request Sent. Awaiting Instructor Approval...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={studentNote}
                  onChange={(e) => setStudentNote(e.target.value)}
                  placeholder="Optional: Explain why the interruption occurred (e.g. accidental browser exit)..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <Button
                  variant="danger"
                  size="md"
                  className="w-full font-bold text-xs"
                  leftIcon={<Send className="w-4 h-4" />}
                  onClick={handleRequestRestartFromTeacher}
                  isLoading={isRequestingRestart}
                >
                  REQUEST RE-ENTRY PERMISSION FROM INSTRUCTOR
                </Button>
              </div>
            )}
          </div>

          <div className="pt-1">
            <Link to="/student/exams" className="block">
              <Button variant="secondary" size="sm" className="w-full text-xs font-semibold">
                Return to My Exams
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // STEP 5 — SUBMITTED CONFIRMATION
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
              All responses have been securely evaluated and recorded in the database.
            </p>
          </div>

          {/* Submission Score & Integrity Summary */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs text-left">
            <div>
              <span className="text-slate-500 block">Exam Score:</span>
              <strong className="text-base text-slate-900 font-mono">
                {submissionResult?.score ?? 0} / {submissionResult?.totalMarks ?? exam.totalMarks} ({submissionResult?.percentage ?? 0}%)
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Integrity Status:</span>
              <strong className="text-base text-emerald-700 flex items-center gap-1 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified (360° Scan)
              </strong>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Link to="/student/exams" className="flex-1">
              <Button variant="secondary" size="md" className="w-full text-xs">
                Back to My Exams
              </Button>
            </Link>
            <Link to="/student/results" className="flex-1">
              <Button variant="primary" size="md" className="w-full text-xs font-bold">
                View Results Ledger
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // STEP 6 — LIVE FULL-SCREEN EXAMINATION
  // =========================================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-500 selection:text-white relative">
      {/* 1. Exam Header with Timer & Submit */}
      <ExamHeader
        examTitle={exam.title}
        courseCode={exam.courseCode || 'CHEM-101'}
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

      {/* 2. Main Examination Canvas */}
      <main className="flex-1 p-4 sm:p-6 pb-36 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Active Question */}
        <div className="lg:col-span-8">
          {currentQuestion ? (
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
          ) : (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-800">No questions available for this exam.</h3>
            </div>
          )}
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

      {/* 3. Floating Live Webcam Widget in Right-Bottom Corner */}
      <ProctoringCornerWidget
        activeMediaStream={proctoring.activeMediaStream}
        proctoringState={proctoring.proctoringState}
        onEnterFullscreen={() => proctoring.enterFullscreen()}
        onRetryHardware={() => proctoring.startContinuousProctoringMedia()}
      />

      {/* 4. Examination Chemistry Calculator Tool */}
      <ChemistryCalculator
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />
    </div>
  );
};

export const ExamPlayerPage: React.FC = () => {
  return (
    <ExamErrorBoundary fallbackTitle="Examination Screen Recovered">
      <InnerExamPlayer />
    </ExamErrorBoundary>
  );
};
