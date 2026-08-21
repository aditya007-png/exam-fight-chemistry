export type EvidenceType =
  | 'room_scan'
  | 'webcam_video'
  | 'audio'
  | 'screenshot'
  | 'webcam_snapshot'
  | 'proctoring_event'
  | 'tab_switch'
  | 'fullscreen_event'
  | 'face_detection'
  | 'multiple_face_detection'
  | 'camera_event'
  | 'microphone_event';

export type ExamAttemptStatus =
  | 'not_started'
  | 'room_scan_pending'
  | 'room_scan_completed'
  | 'in_progress'
  | 'submitted'
  | 'flagged'
  | 'terminated_proctoring'
  | 'terminated_tab_switch';

export type IntegrityRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RestartPermissionRequest {
  attemptId: string;
  studentId: string;
  studentName: string;
  examId: string;
  reason: string;
  status: 'pending' | 'granted' | 'rejected';
  requestedAt: string;
  grantedAt?: string;
  teacherNote?: string;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  examTitle?: string;
  courseCode?: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  className?: string;
  status: ExamAttemptStatus;
  roomScanCompleted: boolean;
  startedAt: string | null;
  submittedAt: string | null;
  score?: number;
  totalMarks?: number;
  integrityScore: number;
  riskLevel: IntegrityRiskLevel;
  totalViolations: number;
  evidenceCount: number;
  durationMinutes: number;
  createdAt: string;
  restartPermission?: RestartPermissionRequest;
}

export interface ExamEvidence {
  id: string;
  examId: string;
  attemptId: string;
  studentId: string;
  studentName?: string;
  evidenceType: EvidenceType;
  filePath: string;
  fileSize?: number; // In bytes
  durationSeconds?: number; // In seconds for video/audio
  signedUrl?: string; // Secure time-limited signed URL
  metadata?: Record<string, any>;
  recordedAt: string;
  createdAt: string;
}

export interface EvidenceSnapshot {
  id: string;
  img: string;
  timestamp: string;
  studentName: string;
  triggerEvent: string;
  evidenceType: 'Automated Periodic' | 'Multiple Face Detected' | 'Gaze Diverted' | 'Head Pose Anomaly' | 'Pre-Flight Alignment';
  severity: 'normal' | 'warning' | 'critical';
}

export interface IntegrityTimelineEvent {
  id: string;
  timestamp: string;
  relativeTime: string;
  eventType: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  durationSeconds?: number;
  hasEvidence: boolean;
  evidenceTabTarget?: 'room_scan' | 'video' | 'audio' | 'snapshots';
}

export interface ExamActivityLog {
  id: string;
  timestamp: string;
  action: string;
  detail: string;
  category: 'auth' | 'navigation' | 'answer' | 'tool' | 'proctoring';
}

export interface LiveMonitoringStudent {
  id: string;
  studentName: string;
  studentEmail: string;
  examTitle: string;
  cameraStatus: 'active' | 'interrupted' | 'disconnected';
  micStatus: 'active' | 'muted' | 'interrupted';
  faceStatus: 'detected' | 'missing' | 'multiple';
  progressPercent: number;
  timeRemaining: string;
  status: 'normal' | 'review' | 'flagged';
  recentEvent: string;
}

export interface StudentAttemptEvidenceSummary {
  attempt: ExamAttempt;
  evidenceList: ExamEvidence[];
  roomScanVideo: ExamEvidence | null;
  webcamVideo: ExamEvidence | null;
  snapshots: EvidenceSnapshot[];
  integrityEvents: IntegrityTimelineEvent[];
  activityLogs: ExamActivityLog[];
  proctoringFlagsCount: number;
}
