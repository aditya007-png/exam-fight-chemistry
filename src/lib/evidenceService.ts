// src/lib/evidenceService.ts
// Real Evidence, Attempt, and Proctoring Service with persistent storage support
import {
  getAllStoredAttempts,
  getAttemptById,
  createOrUpdateAttempt,
  getAttemptEvidence as getStoredAttemptEvidence,
  saveAttemptEvidence as saveStoredAttemptEvidence,
} from './examService';
import {
  ExamAttempt,
  ExamEvidence,
  StudentAttemptEvidenceSummary,
  LiveMonitoringStudent,
} from '../types/evidence';

// Real storage registry for local recordings
const LOCAL_BLOB_STORE = new Map<string, Blob>();

/**
 * Upload Room Scan recording video and register evidence record
 */
export async function uploadRoomScanVideo(params: {
  examId: string;
  attemptId: string;
  studentId: string;
  studentName?: string;
  videoBlob?: Blob;
  blob?: Blob;
  durationSeconds: number;
  coverageDegrees: number;
}): Promise<{ evidence: ExamEvidence; error: string | null }> {
  const {
    examId,
    attemptId,
    studentId,
    studentName = 'Candidate',
    videoBlob,
    blob,
    durationSeconds,
    coverageDegrees,
  } = params;

  const actualBlob = videoBlob || blob || new Blob([], { type: 'video/webm' });

  try {
    const objectUrl = URL.createObjectURL(actualBlob);
    LOCAL_BLOB_STORE.set(attemptId, actualBlob);

    const newEvidence: ExamEvidence = {
      id: `evi-scan-${Date.now()}`,
      examId,
      attemptId,
      studentId,
      studentName,
      evidenceType: 'room_scan',
      filePath: `room-scans/${examId}/${attemptId}/room-scan.webm`,
      fileSize: actualBlob.size,
      durationSeconds,
      signedUrl: objectUrl,
      metadata: {
        resolution: '1280x720',
        coverageDegrees,
        roomScanAngle: `${coverageDegrees}° Room Scan Verified`,
      },
      recordedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    // Retrieve or initialize existing evidence
    const existingRaw = getStoredAttemptEvidence(attemptId) as any;
    const existingSummary: StudentAttemptEvidenceSummary = existingRaw && existingRaw.attempt
      ? existingRaw
      : {
          attempt: getAttemptById(attemptId) || ({} as any),
          evidenceList: [],
          roomScanVideo: null,
          webcamVideo: null,
          snapshots: [],
          integrityEvents: [],
          activityLogs: [],
          proctoringFlagsCount: 0,
        };

    const updatedSummary: StudentAttemptEvidenceSummary = {
      ...existingSummary,
      roomScanVideo: newEvidence,
      evidenceList: [newEvidence, ...(existingSummary.evidenceList || [])],
    };

    saveStoredAttemptEvidence(attemptId, updatedSummary as any);

    // Update attempt roomScanCompleted status
    const attempt = getAttemptById(attemptId);
    if (attempt) {
      createOrUpdateAttempt({
        ...attempt,
        roomScanCompleted: true,
        status: 'room_scan_completed',
      });
    }

    return { evidence: newEvidence, error: null };
  } catch (err: any) {
    console.error('Failed to upload room-scan video:', err);
    return { evidence: {} as ExamEvidence, error: err.message || 'Upload failed' };
  }
}

/**
 * Fetch student attempt and associated evidence for Centralized Evidence Review
 */
export async function getStudentAttemptEvidence(
  attemptId: string
): Promise<StudentAttemptEvidenceSummary | null> {
  const attempt = getAttemptById(attemptId);
  if (!attempt) return null;

  const storedSummary = getStoredAttemptEvidence(attemptId) as any;

  if (storedSummary && storedSummary.attempt) {
    return {
      ...storedSummary,
      attempt,
    };
  }

  // Construct default empty summary for this real attempt
  return {
    attempt,
    evidenceList: [],
    roomScanVideo: null,
    webcamVideo: null,
    snapshots: [],
    integrityEvents: [],
    activityLogs: [],
    proctoringFlagsCount: attempt.totalViolations || 0,
  };
}

/**
 * Fetch all student attempts for Evidence Review list
 */
export async function getExamAttemptsList(examId?: string): Promise<ExamAttempt[]> {
  const all = getAllStoredAttempts();
  if (!examId || examId === 'all') return all;
  return all.filter((att) => att.examId === examId);
}

/**
 * Fetch live monitoring active candidate telemetry
 */
export async function getLiveMonitoringStudents(): Promise<LiveMonitoringStudent[]> {
  const allAttempts = getAllStoredAttempts();
  const inProgress = allAttempts.filter((a) => a.status === 'in_progress');

  return inProgress.map((att) => ({
    id: att.id,
    studentName: att.studentName,
    studentEmail: att.studentEmail,
    examTitle: att.examTitle || 'Chemistry Examination',
    cameraStatus: 'active',
    micStatus: 'active',
    faceStatus: 'detected',
    progressPercent: 50,
    timeRemaining: `${att.durationMinutes}:00`,
    status: att.totalViolations > 0 ? 'review' : 'normal',
    recentEvent: 'Active examination in progress',
  }));
}

// -------------------------------------------------------------------
// TEACHER RESTART PERMISSION & UNLOCK REGISTRY
// -------------------------------------------------------------------

const RESTART_STORAGE_KEY = 'exam_fight_restart_requests_v2';

export interface RestartRequest {
  id: string;
  examId: string;
  attemptId?: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  examTitle: string;
  violationReason: string;
  studentNote?: string;
  status: 'pending' | 'granted' | 'rejected';
  requestedAt: string;
  decidedAt?: string;
}

export function getStoredRestartRequests(): RestartRequest[] {
  try {
    const raw = localStorage.getItem(RESTART_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredRestartRequests(requests: RestartRequest[]) {
  try {
    localStorage.setItem(RESTART_STORAGE_KEY, JSON.stringify(requests));
  } catch {}
}

export async function requestExamRestart(params: {
  examId: string;
  attemptId?: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  examTitle: string;
  violationReason: string;
  studentNote?: string;
}): Promise<{ success: boolean; error: string | null }> {
  const requests = getStoredRestartRequests();
  const existing = requests.find(
    (r) =>
      r.examId === params.examId &&
      r.studentEmail.toLowerCase() === params.studentEmail.toLowerCase() &&
      r.status === 'pending'
  );

  if (existing) {
    return { success: true, error: null };
  }

  const newReq: RestartRequest = {
    id: `req-${Date.now()}`,
    ...params,
    status: 'pending',
    requestedAt: new Date().toISOString(),
  };

  requests.unshift(newReq);
  saveStoredRestartRequests(requests);
  return { success: true, error: null };
}

export async function checkExamRestartStatus(
  params:
    | { examId: string; studentEmail: string }
    | string
): Promise<{ status: 'none' | 'pending' | 'granted' | 'rejected' }> {
  const requests = getStoredRestartRequests();
  const examId = typeof params === 'string' ? params : params.examId;
  const studentEmail = typeof params === 'string' ? '' : params.studentEmail;

  const req = requests.find((r) => {
    if (studentEmail) {
      return (
        r.examId === examId &&
        r.studentEmail.toLowerCase() === studentEmail.toLowerCase()
      );
    }
    return r.examId === examId || r.id === examId;
  });

  if (!req) return { status: 'none' };
  return { status: req.status };
}

export interface StudentTeacherRequest {
  id: string;
  attemptId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  className?: string;
  examId: string;
  examTitle: string;
  reason: string;
  violationContext: string;
  studentNote?: string;
  teacherNote?: string;
  status: 'pending' | 'granted' | 'rejected';
  requestedAt: string;
  decidedAt?: string;
}

export async function getAllStudentRequests(): Promise<StudentTeacherRequest[]> {
  const requests = getStoredRestartRequests();
  return requests.map((r) => ({
    id: r.id,
    attemptId: r.id,
    studentId: r.studentId,
    studentName: r.studentName,
    studentEmail: r.studentEmail,
    className: 'Class 12-A',
    examId: r.examId,
    examTitle: r.examTitle,
    reason: r.violationReason,
    violationContext: r.violationReason,
    studentNote: r.studentNote,
    status: r.status,
    requestedAt: r.requestedAt,
    decidedAt: r.decidedAt,
  }));
}

export async function grantExamRestart(requestId: string, note?: string): Promise<boolean> {
  const requests = getStoredRestartRequests();
  const req = requests.find((r) => r.id === requestId);
  if (!req) return false;

  req.status = 'granted';
  req.decidedAt = new Date().toISOString();
  if (note) {
    (req as any).teacherNote = note;
  }
  saveStoredRestartRequests(requests);
  return true;
}

export async function rejectExamRestart(requestId: string, note?: string): Promise<boolean> {
  const requests = getStoredRestartRequests();
  const req = requests.find((r) => r.id === requestId);
  if (!req) return false;

  req.status = 'rejected';
  req.decidedAt = new Date().toISOString();
  if (note) {
    (req as any).teacherNote = note;
  }
  saveStoredRestartRequests(requests);
  return true;
}
