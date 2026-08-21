export type ProctoringEventType =
  | 'TAB_SWITCH_BLUR'
  | 'TAB_SWITCH_FOCUS'
  | 'TAB_SWITCH'
  | 'WINDOW_BLUR'
  | 'WINDOW_RESIZED'
  | 'FULLSCREEN_EXIT'
  | 'FULLSCREEN_ENTER'
  | 'FULLSCREEN_TIMEOUT'
  | 'CAMERA_DISCONNECTED'
  | 'CAMERA_RESTORED'
  | 'CAMERA_PERMISSION_REVOKED'
  | 'MICROPHONE_DISCONNECTED'
  | 'MICROPHONE_RESTORED'
  | 'MICROPHONE_PERMISSION_REVOKED'
  | 'FACE_DETECTED'
  | 'FACE_NOT_DETECTED'
  | 'MULTIPLE_FACES_DETECTED'
  | 'LOOKING_AWAY'
  | 'LOOKING_FORWARD'
  | 'GAZE_DIVERTED'
  | 'EYES_OPEN'
  | 'EYES_CLOSED'
  | 'EYE_DETECTION_UNCLEAR'
  | 'GLASSES_DETECTED'
  | 'EXAM_STARTED'
  | 'EXAM_SUBMITTED'
  | 'EXAM_TERMINATED'
  | 'AUDIO_ANOMALY'
  | 'COPY_ATTEMPT'
  | 'PASTE_ATTEMPT'
  | 'CONTEXT_MENU_BLOCKED'
  | 'DEV_TOOLS_DETECTED'
  | 'MULTI_MONITOR_ANOMALY';

export type EventSeverity = 'info' | 'warning' | 'critical' | 'success';

export type CameraStatus = 'active' | 'offline' | 'permission_required';
export type FaceDetectionStatus = 'detected' | 'not_detected' | 'multiple_faces';
export type GazeStatus = 'forward' | 'looking_away';
export type EyeTrackingStatus = 'open' | 'closed' | 'unclear';

export interface HeadPoseData {
  yaw: number;
  pitch: number;
  roll?: number;
}

export interface UnifiedProctoringState {
  status: 'normal' | 'warning' | 'critical' | 'terminated';
  cameraStatus: CameraStatus;
  microphoneStatus: 'active' | 'offline';
  faceStatus: FaceDetectionStatus;
  eyeStatus: EyeTrackingStatus;
  gazeStatus: GazeStatus;
  headPose: HeadPoseData;
  faceCount: number;
  glassesDetected: boolean;
  confidence: number;
  // Unified Single 15-Second Timer
  activeViolation: {
    type: 'camera_disconnected' | 'face_not_detected' | 'multiple_faces' | 'fullscreen_exit' | 'mic_disconnected' | 'window_inactive' | null;
    title: string;
    description: string;
    isCritical: boolean;
  } | null;
  violationStartedAt: number | null;
  remainingSeconds: number;
  elapsedSeconds: number;
  strikeCount: number;
}

export interface ProctoringLogEntry {
  id: string;
  attemptId?: string;
  studentId?: string;
  examId?: string;
  timestamp: string;
  relativeTimeFormatted: string;
  eventType: ProctoringEventType;
  severity: EventSeverity;
  description: string;
  durationSeconds?: number;
  metadata?: Record<string, any>;
}

export interface StudentIntegrityReport {
  studentId: string;
  studentName: string;
  studentEmail: string;
  examId: string;
  examTitle: string;
  submittedAt: string;
  integrityScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  totalStrikes: number;
  events: ProctoringLogEntry[];
}
