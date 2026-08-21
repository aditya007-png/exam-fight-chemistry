import { supabase, isSupabaseConfigured } from './supabase';
import {
  ExamAttempt,
  ExamEvidence,
  StudentAttemptEvidenceSummary,
  LiveMonitoringStudent,
  EvidenceSnapshot,
  IntegrityTimelineEvent,
  ExamActivityLog,
} from '../types/evidence';

// Mock storage registry for local demo mode
const LOCAL_BLOB_STORE = new Map<string, Blob>();

export const MOCK_ATTEMPTS: Record<string, ExamAttempt> = {
  'att-rahul': {
    id: 'att-rahul',
    examId: 'exam-act-001',
    examTitle: 'Organic Chemistry — Unit Test',
    courseCode: 'CHEM-302',
    className: '12-A',
    studentId: 'stu-rahul-01',
    studentName: 'Rahul Sharma',
    studentEmail: 'rahul.sharma@university.edu',
    status: 'in_progress',
    roomScanCompleted: true,
    startedAt: '2026-08-22T10:24:00Z',
    submittedAt: null,
    score: 72,
    totalMarks: 100,
    integrityScore: 94,
    riskLevel: 'LOW',
    totalViolations: 0,
    evidenceCount: 6,
    durationMinutes: 60,
    createdAt: '2026-08-22T10:20:00Z',
  },
  'att-priya': {
    id: 'att-priya',
    examId: 'exam-act-001',
    examTitle: 'Organic Chemistry — Unit Test',
    courseCode: 'CHEM-302',
    className: '12-A',
    studentId: 'stu-priya-02',
    studentName: 'Priya Patel',
    studentEmail: 'priya.patel@university.edu',
    status: 'in_progress',
    roomScanCompleted: true,
    startedAt: '2026-08-22T10:15:00Z',
    submittedAt: null,
    score: 88,
    totalMarks: 100,
    integrityScore: 99,
    riskLevel: 'LOW',
    totalViolations: 0,
    evidenceCount: 5,
    durationMinutes: 60,
    createdAt: '2026-08-22T10:10:00Z',
  },
  'att-arjun': {
    id: 'att-arjun',
    examId: 'exam-act-001',
    examTitle: 'Organic Chemistry — Unit Test',
    courseCode: 'CHEM-302',
    className: '12-A',
    studentId: 'stu-arjun-03',
    studentName: 'Arjun Mehta',
    studentEmail: 'arjun.mehta@university.edu',
    status: 'flagged',
    roomScanCompleted: true,
    startedAt: '2026-08-22T08:58:00Z',
    submittedAt: '2026-08-22T09:41:18Z',
    score: 58,
    totalMarks: 100,
    integrityScore: 61,
    riskLevel: 'HIGH',
    totalViolations: 4,
    evidenceCount: 8,
    durationMinutes: 43,
    createdAt: '2026-08-22T08:55:00Z',
  },
  'att-vikram': {
    id: 'att-vikram',
    examId: 'exam-act-001',
    examTitle: 'Organic Chemistry — Unit Test',
    courseCode: 'CHEM-302',
    className: '12-A',
    studentId: 'stu-vikram-05',
    studentName: 'Vikram Malhotra',
    studentEmail: 'vikram.malhotra@university.edu',
    status: 'terminated_tab_switch',
    roomScanCompleted: true,
    startedAt: '2026-08-22T10:05:00Z',
    submittedAt: '2026-08-22T10:22:15Z',
    score: 34,
    totalMarks: 100,
    integrityScore: 40,
    riskLevel: 'HIGH',
    totalViolations: 3,
    evidenceCount: 4,
    durationMinutes: 17,
    createdAt: '2026-08-22T10:00:00Z',
  },
  'att-001': {
    id: 'att-001',
    examId: 'exam-act-001',
    examTitle: 'Organic Chemistry — Unit Test',
    courseCode: 'CHEM-302',
    className: '12-A',
    studentId: 'demo-student-001',
    studentName: 'Alex Chen',
    studentEmail: 'alex.chen@university.edu',
    status: 'submitted',
    roomScanCompleted: true,
    startedAt: '2026-08-22T10:00:00Z',
    submittedAt: '2026-08-22T10:57:00Z',
    score: 92,
    totalMarks: 100,
    integrityScore: 98,
    riskLevel: 'LOW',
    totalViolations: 0,
    evidenceCount: 4,
    durationMinutes: 57,
    createdAt: '2026-08-22T09:55:00Z',
  },
  'att-sneha': {
    id: 'att-sneha',
    examId: 'exam-act-002',
    examTitle: 'Inorganic Chemistry — Mid Term',
    courseCode: 'CHEM-301',
    className: '12-B',
    studentId: 'stu-sneha-04',
    studentName: 'Sneha Reddy',
    studentEmail: 'sneha.reddy@university.edu',
    status: 'in_progress',
    roomScanCompleted: true,
    startedAt: '2026-08-22T11:00:00Z',
    submittedAt: null,
    score: 81,
    totalMarks: 100,
    integrityScore: 95,
    riskLevel: 'LOW',
    totalViolations: 0,
    evidenceCount: 4,
    durationMinutes: 90,
    createdAt: '2026-08-22T10:55:00Z',
  },
};

export const MOCK_LIVE_MONITORING_STUDENTS: LiveMonitoringStudent[] = [
  {
    id: 'live-1',
    studentName: 'Rahul Sharma',
    studentEmail: 'rahul.sharma@university.edu',
    examTitle: 'Organic Chemistry — Unit Test',
    cameraStatus: 'active',
    micStatus: 'active',
    faceStatus: 'detected',
    progressPercent: 68,
    timeRemaining: '34:21',
    status: 'normal',
    recentEvent: 'Answering Question 4 (Stereochemistry Mechanism)',
  },
  {
    id: 'live-2',
    studentName: 'Priya Patel',
    studentEmail: 'priya.patel@university.edu',
    examTitle: 'Organic Chemistry — Unit Test',
    cameraStatus: 'active',
    micStatus: 'active',
    faceStatus: 'detected',
    progressPercent: 74,
    timeRemaining: '31:40',
    status: 'normal',
    recentEvent: 'Opened Scientific Calculator',
  },
  {
    id: 'live-3',
    studentName: 'Arjun Mehta',
    studentEmail: 'arjun.mehta@university.edu',
    examTitle: 'Organic Chemistry — Unit Test',
    cameraStatus: 'interrupted',
    micStatus: 'active',
    faceStatus: 'missing',
    progressPercent: 51,
    timeRemaining: '28:15',
    status: 'review',
    recentEvent: 'Camera stream interrupted for 8 seconds',
  },
  {
    id: 'live-4',
    studentName: 'Sneha Rao',
    studentEmail: 'sneha.rao@university.edu',
    examTitle: 'Organic Chemistry — Unit Test',
    cameraStatus: 'active',
    micStatus: 'active',
    faceStatus: 'detected',
    progressPercent: 82,
    timeRemaining: '24:05',
    status: 'normal',
    recentEvent: 'Answered Question 5 (Thermodynamics)',
  },
  {
    id: 'live-5',
    studentName: 'Kavita Roy',
    studentEmail: 'kavita.roy@university.edu',
    examTitle: 'Organic Chemistry — Unit Test',
    cameraStatus: 'active',
    micStatus: 'active',
    faceStatus: 'detected',
    progressPercent: 90,
    timeRemaining: '19:50',
    status: 'normal',
    recentEvent: 'Reviewing flagged questions in palette',
  },
];

export const MOCK_SNAPSHOTS: Record<string, EvidenceSnapshot[]> = {
  'att-rahul': [
    {
      id: 'snap-r1',
      img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
      timestamp: '10:24:00 AM',
      studentName: 'Rahul Sharma',
      triggerEvent: 'Pre-Flight Environmental Face Alignment',
      evidenceType: 'Pre-Flight Alignment',
      severity: 'normal',
    },
    {
      id: 'snap-r2',
      img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
      timestamp: '10:35:10 AM',
      studentName: 'Rahul Sharma',
      triggerEvent: 'Candidate Looking Away / Gaze Diverted',
      evidenceType: 'Gaze Diverted',
      severity: 'warning',
    },
    {
      id: 'snap-r3',
      img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
      timestamp: '10:43:21 AM',
      studentName: 'Rahul Sharma',
      triggerEvent: 'Multiple Faces Detected in Camera Frame',
      evidenceType: 'Multiple Face Detected',
      severity: 'critical',
    },
    {
      id: 'snap-r4',
      img: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=500&auto=format&fit=crop&q=80',
      timestamp: '11:15:00 AM',
      studentName: 'Rahul Sharma',
      triggerEvent: 'Periodic Integrity Verification Check',
      evidenceType: 'Automated Periodic',
      severity: 'normal',
    },
  ],
  'att-priya': [
    {
      id: 'snap-p1',
      img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
      timestamp: '09:15:00 AM',
      studentName: 'Priya Patel',
      triggerEvent: 'Pre-Exam Verification Check',
      evidenceType: 'Pre-Flight Alignment',
      severity: 'normal',
    },
    {
      id: 'snap-p2',
      img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
      timestamp: '09:45:00 AM',
      studentName: 'Priya Patel',
      triggerEvent: 'Automated Routine Check',
      evidenceType: 'Automated Periodic',
      severity: 'normal',
    },
  ],
  'att-arjun': [
    {
      id: 'snap-a1',
      img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
      timestamp: '08:58:00 AM',
      studentName: 'Arjun Mehta',
      triggerEvent: 'Pre-Flight Alignment',
      evidenceType: 'Pre-Flight Alignment',
      severity: 'normal',
    },
    {
      id: 'snap-a2',
      img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
      timestamp: '09:12:18 AM',
      studentName: 'Arjun Mehta',
      triggerEvent: 'Face Absent from Camera Frame',
      evidenceType: 'Head Pose Anomaly',
      severity: 'critical',
    },
  ],
};

export const MOCK_TIMELINE_EVENTS: Record<string, IntegrityTimelineEvent[]> = {
  'att-rahul': [
    {
      id: 'ev-r1',
      timestamp: '10:24:00 AM',
      relativeTime: '00:00:00',
      eventType: 'ROOM_SCAN_VERIFIED',
      title: 'Pre-Exam 360° Room Scan Completed',
      description: 'Candidate performed 360° environmental scan (Duration: 42s). Perimeter verified clear.',
      severity: 'success',
      hasEvidence: true,
      evidenceTabTarget: 'room_scan',
    },
    {
      id: 'ev-r2',
      timestamp: '10:25:00 AM',
      relativeTime: '00:01:00',
      eventType: 'EXAM_STARTED',
      title: 'Examination Session Initiated',
      description: 'Candidate entered locked fullscreen examination mode.',
      severity: 'info',
      hasEvidence: false,
    },
    {
      id: 'ev-r3',
      timestamp: '10:35:10 AM',
      relativeTime: '00:11:10',
      eventType: 'EYES_CLOSED',
      title: 'Sustained Eyes Closed (4s)',
      description: 'Candidate eyes were closed for 4 seconds. Non-blocking alert shown.',
      severity: 'warning',
      durationSeconds: 4,
      hasEvidence: false,
    },
    {
      id: 'ev-r3b',
      timestamp: '10:38:40 AM',
      relativeTime: '00:14:40',
      eventType: 'FACE_NOT_DETECTED',
      title: 'Face Not Detected (5s)',
      description: 'Candidate moved out of camera frame for 5 seconds.',
      severity: 'warning',
      durationSeconds: 5,
      hasEvidence: true,
      evidenceTabTarget: 'snapshots',
    },
    {
      id: 'ev-r4',
      timestamp: '10:42:18 AM',
      relativeTime: '00:18:18',
      eventType: 'CAMERA_DISCONNECTED',
      title: 'Camera Stream Disconnected',
      description: 'Webcam video stream dropped or was interrupted.',
      severity: 'warning',
      durationSeconds: 8,
      hasEvidence: true,
      evidenceTabTarget: 'video',
    },
    {
      id: 'ev-r5',
      timestamp: '10:42:26 AM',
      relativeTime: '00:18:26',
      eventType: 'CAMERA_RESTORED',
      title: 'Camera Stream Restored',
      description: 'Candidate webcam successfully reconnected and stream resumed.',
      severity: 'success',
      hasEvidence: false,
    },
    {
      id: 'ev-r5',
      timestamp: '10:44:32 AM',
      relativeTime: '00:20:32',
      eventType: 'TAB_SWITCH',
      title: 'Tab Switch / Blur Detected',
      description: 'Browser tab lost focus for 3 seconds. Strike #1 issued.',
      severity: 'warning',
      durationSeconds: 3,
      hasEvidence: false,
    },
    {
      id: 'ev-r6',
      timestamp: '10:51:21 AM',
      relativeTime: '00:27:21',
      eventType: 'MULTIPLE_FACES_DETECTED',
      title: 'Multiple Faces Detected',
      description: 'Second person detected near examination desk perimeter.',
      severity: 'critical',
      hasEvidence: true,
      evidenceTabTarget: 'snapshots',
    },
    {
      id: 'ev-r7',
      timestamp: '11:20:34 AM',
      relativeTime: '00:56:34',
      eventType: 'EXAM_SUBMITTED',
      title: 'Examination Submitted & Finalized',
      description: 'Candidate submitted exam responses. Hardware camera and mic streams closed.',
      severity: 'success',
      hasEvidence: false,
    },
  ],
  'att-priya': [
    {
      id: 'ev-p1',
      timestamp: '09:15:00 AM',
      relativeTime: '00:00:00',
      eventType: 'ROOM_SCAN_VERIFIED',
      title: '360° Environmental Scan Verified',
      description: '360° room scan completed (Duration: 38s). Environment verified compliant.',
      severity: 'success',
      hasEvidence: true,
      evidenceTabTarget: 'room_scan',
    },
    {
      id: 'ev-p2',
      timestamp: '09:16:00 AM',
      relativeTime: '00:01:00',
      eventType: 'EXAM_STARTED',
      title: 'Examination Session Started',
      description: 'Continuous proctoring armed. 0 integrity flags logged.',
      severity: 'info',
      hasEvidence: false,
    },
    {
      id: 'ev-p3',
      timestamp: '10:45:12 AM',
      relativeTime: '01:30:12',
      eventType: 'EXAM_SUBMITTED',
      title: 'Examination Submitted',
      description: 'All 30 questions answered and successfully graded.',
      severity: 'success',
      hasEvidence: false,
    },
  ],
  'att-arjun': [
    {
      id: 'ev-a1',
      timestamp: '08:58:00 AM',
      relativeTime: '00:00:00',
      eventType: 'ROOM_SCAN_VERIFIED',
      title: '360° Room Scan Completed',
      description: 'Scan duration: 21s (Required minimum 300° cleared).',
      severity: 'info',
      hasEvidence: true,
      evidenceTabTarget: 'room_scan',
    },
    {
      id: 'ev-a2',
      timestamp: '09:12:18 AM',
      relativeTime: '00:14:18',
      eventType: 'TAB_SWITCH',
      title: 'Tab Switch Detected',
      description: 'Browser tab lost focus for 12 seconds.',
      severity: 'warning',
      durationSeconds: 12,
      hasEvidence: false,
    },
    {
      id: 'ev-a3',
      timestamp: '09:28:40 AM',
      relativeTime: '00:30:40',
      eventType: 'CAMERA_DISCONNECTED',
      title: 'Webcam Stream Interrupted',
      description: 'Camera disconnected for 18 seconds.',
      severity: 'critical',
      durationSeconds: 18,
      hasEvidence: true,
      evidenceTabTarget: 'video',
    },
    {
      id: 'ev-a4',
      timestamp: '09:41:18 AM',
      relativeTime: '00:43:18',
      eventType: 'EXAM_SUBMITTED',
      title: 'Exam Automatically Terminated (15s Timeout)',
      description: 'Critical condition: Face not detected for 15.2 continuous seconds. Attempt automatically terminated under institutional proctoring policy.',
      severity: 'critical',
      durationSeconds: 15,
      hasEvidence: false,
    },
  ],
};

export const MOCK_ACTIVITY_LOGS: Record<string, ExamActivityLog[]> = {
  'att-rahul': [
    { id: 'act-1', timestamp: '10:24:00 AM', action: 'Room Scan', detail: '360° rotational scan completed and encrypted', category: 'proctoring' },
    { id: 'act-2', timestamp: '10:25:00 AM', action: 'Exam Start', detail: 'Fullscreen locked mode engaged', category: 'auth' },
    { id: 'act-3', timestamp: '10:26:15 AM', action: 'Question 1', detail: 'Answered Option A (ΔG° = +6.70 kJ/mol)', category: 'answer' },
    { id: 'act-4', timestamp: '10:31:40 AM', action: 'Tool Used', detail: 'Periodic table overlay viewed for 45 seconds', category: 'tool' },
    { id: 'act-5', timestamp: '10:35:10 AM', action: 'Question 2', detail: 'Numerical value 1.10 V entered', category: 'answer' },
    { id: 'act-6', timestamp: '10:42:18 AM', action: 'Stream Drop', detail: 'Camera disconnected for 8 seconds', category: 'proctoring' },
    { id: 'act-7', timestamp: '10:44:32 AM', action: 'Tab Switch', detail: 'Navigated away from tab for 3s (Strike #1)', category: 'proctoring' },
    { id: 'act-8', timestamp: '10:48:00 AM', action: 'Question 5', detail: '2D Mechanism Sketcher launched; carbocation drawn', category: 'answer' },
    { id: 'act-9', timestamp: '10:51:21 AM', action: 'Face Alert', detail: 'Multiple faces captured in camera frame', category: 'proctoring' },
    { id: 'act-10', timestamp: '11:20:34 AM', action: 'Exam Finalized', detail: 'All answers saved and submitted', category: 'auth' },
  ],
  'att-priya': [
    { id: 'act-p1', timestamp: '09:15:00 AM', action: 'Room Scan', detail: '360° scan uploaded', category: 'proctoring' },
    { id: 'act-p2', timestamp: '09:16:00 AM', action: 'Exam Start', detail: 'Locked exam window started', category: 'auth' },
    { id: 'act-p3', timestamp: '10:45:12 AM', action: 'Exam Finalized', detail: 'All 30 questions submitted', category: 'auth' },
  ],
  'att-arjun': [
    { id: 'act-a1', timestamp: '08:58:00 AM', action: 'Room Scan', detail: 'Pre-flight scan recorded', category: 'proctoring' },
    { id: 'act-a2', timestamp: '09:12:18 AM', action: 'Tab Switch', detail: 'Lost focus for 12 seconds', category: 'proctoring' },
  ],
};

export const MOCK_EVIDENCE: Record<string, ExamEvidence[]> = {
  'att-rahul': [
    {
      id: 'evi-r1',
      examId: 'exam-act-001',
      attemptId: 'att-rahul',
      studentId: 'stu-rahul-01',
      studentName: 'Rahul Sharma',
      evidenceType: 'room_scan',
      filePath: 'room-scans/exam-act-001/att-rahul/room-scan.webm',
      fileSize: 5120000,
      durationSeconds: 42.0,
      signedUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      metadata: {
        resolution: '1920x1080',
        mimeType: 'video/webm;codecs=vp9',
        rotationAnglesDetected: '360° Complete Perimeter Verified',
        aiInspectionScore: 'CLEAN_ENVIRONMENT',
      },
      recordedAt: '2026-08-22T10:24:00Z',
      createdAt: '2026-08-22T10:24:45Z',
    },
    {
      id: 'evi-r2',
      examId: 'exam-act-001',
      attemptId: 'att-rahul',
      studentId: 'stu-rahul-01',
      studentName: 'Rahul Sharma',
      evidenceType: 'webcam_video',
      filePath: 'proctoring-videos/exam-act-001/att-rahul/stream.webm',
      fileSize: 48200000,
      durationSeconds: 3360.0,
      signedUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      metadata: {
        resolution: '1280x720',
        mimeType: 'video/webm',
        frameRate: '30 fps',
        audioCodec: 'Opus 48kHz Stereo',
      },
      recordedAt: '2026-08-22T10:25:00Z',
      createdAt: '2026-08-22T11:20:40Z',
    },
  ],
  'att-priya': [
    {
      id: 'evi-p1',
      examId: 'exam-act-002',
      attemptId: 'att-priya',
      studentId: 'stu-priya-02',
      studentName: 'Priya Patel',
      evidenceType: 'room_scan',
      filePath: 'room-scans/exam-act-002/att-priya/room-scan.webm',
      fileSize: 4200000,
      durationSeconds: 38.0,
      signedUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
      metadata: {
        resolution: '1920x1080',
        rotationAnglesDetected: '360° Complete',
        aiInspectionScore: 'CLEAN_ENVIRONMENT',
      },
      recordedAt: '2026-08-22T09:15:00Z',
      createdAt: '2026-08-22T09:15:40Z',
    },
  ],
  'att-arjun': [
    {
      id: 'evi-a1',
      examId: 'exam-act-003',
      attemptId: 'att-arjun',
      studentId: 'stu-arjun-03',
      studentName: 'Arjun Mehta',
      evidenceType: 'room_scan',
      filePath: 'room-scans/exam-act-003/att-arjun/room-scan.webm',
      fileSize: 3100000,
      durationSeconds: 21.0,
      signedUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      metadata: {
        resolution: '1280x720',
        rotationAnglesDetected: '300° Minimum Passed',
        aiInspectionScore: 'SUSPICIOUS_DESK_ITEM',
      },
      recordedAt: '2026-08-22T08:58:00Z',
      createdAt: '2026-08-22T08:58:25Z',
    },
  ],
};

/**
 * Upload room-scan video recording to Supabase Storage and record metadata
 */
export async function uploadRoomScanVideo(params: {
  examId: string;
  attemptId: string;
  studentId: string;
  studentName: string;
  videoBlob: Blob;
  durationSeconds: number;
  coverageDegrees?: number;
}): Promise<{ evidence: ExamEvidence; error: string | null }> {
  const { examId, attemptId, studentId, studentName, videoBlob, durationSeconds, coverageDegrees = 300 } = params;
  const filePath = `room-scans/${examId}/${attemptId}/room-scan.webm`;

  try {
    let signedUrl = '';

    if (isSupabaseConfigured()) {
      const { error: uploadError } = await supabase.storage
        .from('exam-evidence')
        .upload(filePath, videoBlob, {
          contentType: 'video/webm',
          upsert: true,
        });

      if (uploadError) {
        console.warn('Supabase storage upload error:', uploadError);
      }

      const { data: signedData } = await supabase.storage
        .from('exam-evidence')
        .createSignedUrl(filePath, 3600);

      signedUrl = signedData?.signedUrl || URL.createObjectURL(videoBlob);

      await supabase.from('exam_evidence').insert({
        exam_id: examId,
        attempt_id: attemptId,
        student_id: studentId,
        evidence_type: 'room_scan',
        file_path: filePath,
        file_size: videoBlob.size,
        duration_seconds: durationSeconds,
        metadata: {
          mimeType: videoBlob.type,
          capturedVia: 'Webcam MediaRecorder',
          coverageDegrees,
        },
      });

      await supabase
        .from('exam_attempts')
        .update({
          room_scan_completed: true,
          status: 'room_scan_completed',
        })
        .eq('id', attemptId);
    } else {
      LOCAL_BLOB_STORE.set(filePath, videoBlob);
      signedUrl = URL.createObjectURL(videoBlob);
    }

    const newEvidence: ExamEvidence = {
      id: `evi-${Date.now()}`,
      examId,
      attemptId,
      studentId,
      studentName,
      evidenceType: 'room_scan',
      filePath,
      fileSize: videoBlob.size,
      durationSeconds,
      signedUrl,
      metadata: {
        mimeType: videoBlob.type || 'video/webm',
        capturedVia: 'Webcam MediaRecorder',
        coverageDegrees,
        roomScanAngle: `${coverageDegrees}° Minimum Passed`,
      },
      recordedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    if (!MOCK_EVIDENCE[attemptId]) {
      MOCK_EVIDENCE[attemptId] = [];
    }
    MOCK_EVIDENCE[attemptId].unshift(newEvidence);

    if (MOCK_ATTEMPTS[attemptId]) {
      MOCK_ATTEMPTS[attemptId].roomScanCompleted = true;
      MOCK_ATTEMPTS[attemptId].status = 'room_scan_completed';
    }

    return { evidence: newEvidence, error: null };
  } catch (err: any) {
    console.error('Failed to upload room-scan video:', err);
    return { evidence: {} as ExamEvidence, error: err.message || 'Upload failed' };
  }
}

/**
 * Fetch student attempt and associated video evidence for Centralized Evidence Review
 */
export async function getStudentAttemptEvidence(
  attemptId: string
): Promise<StudentAttemptEvidenceSummary | null> {
  const attempt = MOCK_ATTEMPTS[attemptId] || MOCK_ATTEMPTS['att-rahul'] || MOCK_ATTEMPTS['att-001'];
  const key = MOCK_ATTEMPTS[attemptId] ? attemptId : 'att-rahul';

  const evidenceList = MOCK_EVIDENCE[key] || [];
  const roomScan = evidenceList.find((e) => e.evidenceType === 'room_scan') || null;
  const webcamVideo = evidenceList.find((e) => e.evidenceType === 'webcam_video') || null;
  const snapshots = MOCK_SNAPSHOTS[key] || MOCK_SNAPSHOTS['att-rahul'] || [];
  const integrityEvents = MOCK_TIMELINE_EVENTS[key] || MOCK_TIMELINE_EVENTS['att-rahul'] || [];
  const activityLogs = MOCK_ACTIVITY_LOGS[key] || MOCK_ACTIVITY_LOGS['att-rahul'] || [];

  return {
    attempt,
    evidenceList,
    roomScanVideo: roomScan,
    webcamVideo,
    snapshots,
    integrityEvents,
    activityLogs,
    proctoringFlagsCount: attempt.totalViolations || 0,
  };
}

/**
 * Fetch all student attempts for Evidence Review list
 */
export async function getExamAttemptsList(examId?: string): Promise<ExamAttempt[]> {
  const all = Object.values(MOCK_ATTEMPTS);
  if (!examId || examId === 'all') return all;
  return all.filter((att) => att.examId === examId);
}

/**
 * Fetch live monitoring active candidate telemetry
 */
export async function getLiveMonitoringStudents(): Promise<LiveMonitoringStudent[]> {
  return MOCK_LIVE_MONITORING_STUDENTS;
}

// -------------------------------------------------------------------
// TEACHER RESTART PERMISSION & UNLOCK REGISTRY
// -------------------------------------------------------------------
export interface StudentTeacherRequest {
  id: string;
  attemptId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  className?: string;
  examId: string;
  examTitle: string;
  requestType: 'restart_exam' | 'unlock_attempt' | 'hardware_appeal' | 'general_query';
  reason: string;
  studentNote?: string;
  violationContext: string;
  status: 'pending' | 'granted' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  teacherNote?: string;
}

const INITIAL_REQUESTS: StudentTeacherRequest[] = [
  {
    id: 'req-001',
    attemptId: 'att-arjun',
    studentId: 'stu-arjun-03',
    studentName: 'Arjun Mehta',
    studentEmail: 'arjun.mehta@university.edu',
    className: '12-A',
    examId: 'exam-act-001',
    examTitle: 'Organic Chemistry — Unit Test',
    requestType: 'restart_exam',
    reason: 'Tab Switch Violation',
    studentNote: 'My anti-virus popup accidentally triggered a window blur during question 14. Please permit me to restart.',
    violationContext: 'Terminated: Tab Switch / Window Blur',
    status: 'pending',
    requestedAt: '2026-08-22T10:48:10Z',
  },
  {
    id: 'req-002',
    attemptId: 'att-sneha',
    studentId: 'stu-sneha-04',
    studentName: 'Sneha Reddy',
    studentEmail: 'sneha.reddy@university.edu',
    className: '12-B',
    examId: 'exam-act-002',
    examTitle: 'Inorganic Chemistry — Mid Term',
    requestType: 'restart_exam',
    reason: '15-Second Face Detection Timeout',
    studentNote: 'I leaned down to pick up a fallen pen and exceeded the 15-second proctoring timeout. Requesting permission to retake.',
    violationContext: 'Terminated: Face missing for 15.0 continuous seconds',
    status: 'pending',
    requestedAt: '2026-08-22T11:15:30Z',
  },
  {
    id: 'req-003',
    attemptId: 'att-rahul',
    studentId: 'stu-rahul-01',
    studentName: 'Rahul Sharma',
    studentEmail: 'rahul.sharma@university.edu',
    className: '12-A',
    examId: 'exam-act-001',
    examTitle: 'Organic Chemistry — Unit Test',
    requestType: 'unlock_attempt',
    reason: 'Camera Disconnected During Scan',
    studentNote: 'Webcam cord slipped during 360 scan, fixed now.',
    violationContext: 'Pre-Exam Room Scan Invalidation',
    status: 'granted',
    requestedAt: '2026-08-22T09:30:00Z',
    reviewedAt: '2026-08-22T09:32:15Z',
    teacherNote: 'Approved. Hardware verified normal.',
  },
];

const RESTART_PERMISSIONS_STORE = new Map<string, StudentTeacherRequest>();

// Populate initial mock requests
INITIAL_REQUESTS.forEach((req) => {
  RESTART_PERMISSIONS_STORE.set(req.attemptId, req);
  if (MOCK_ATTEMPTS[req.attemptId]) {
    MOCK_ATTEMPTS[req.attemptId].restartPermission = {
      attemptId: req.attemptId,
      studentId: req.studentId,
      studentName: req.studentName,
      examId: req.examId,
      reason: req.reason,
      status: req.status,
      requestedAt: req.requestedAt,
      grantedAt: req.reviewedAt,
      teacherNote: req.teacherNote,
    };
  }
});

/**
 * Fetch all student requests for the Teacher Requests Center
 */
export async function getAllStudentRequests(): Promise<StudentTeacherRequest[]> {
  return Array.from(RESTART_PERMISSIONS_STORE.values()).sort(
    (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
  );
}

/**
 * Fetch count of pending requests for badges
 */
export function getPendingRequestsCount(): number {
  return Array.from(RESTART_PERMISSIONS_STORE.values()).filter((r) => r.status === 'pending').length;
}

/**
 * Student requests restart permission from teacher after tab-switch or critical termination
 */
export async function requestExamRestart(params: {
  attemptId: string;
  studentId: string;
  studentName: string;
  examId: string;
  reason: string;
  studentNote?: string;
}) {
  const req: StudentTeacherRequest = {
    id: `req-${Date.now()}`,
    attemptId: params.attemptId,
    studentId: params.studentId,
    studentName: params.studentName,
    studentEmail: `${params.studentName.toLowerCase().replace(/\s+/g, '.')}@university.edu`,
    examId: params.examId,
    examTitle: 'Organic Chemistry — Unit Test',
    className: '12-A',
    requestType: 'restart_exam',
    reason: params.reason,
    studentNote: params.studentNote || 'Student requested restart after exam termination.',
    violationContext: params.reason,
    status: 'pending',
    requestedAt: new Date().toISOString(),
  };

  RESTART_PERMISSIONS_STORE.set(params.attemptId, req);

  if (MOCK_ATTEMPTS[params.attemptId]) {
    MOCK_ATTEMPTS[params.attemptId].restartPermission = {
      attemptId: req.attemptId,
      studentId: req.studentId,
      studentName: req.studentName,
      examId: req.examId,
      reason: req.reason,
      status: 'pending',
      requestedAt: req.requestedAt,
      teacherNote: req.studentNote,
    };
  }

  return req;
}

/**
 * Teacher grants restart permission to student
 */
export async function grantExamRestart(attemptId: string, teacherNote?: string) {
  const existing = RESTART_PERMISSIONS_STORE.get(attemptId) || {
    id: `req-${Date.now()}`,
    attemptId,
    studentId: 'student-demo',
    studentName: 'Student',
    studentEmail: 'student@university.edu',
    examId: 'exam-act-001',
    examTitle: 'Organic Chemistry — Unit Test',
    requestType: 'restart_exam' as const,
    reason: 'Tab Switch Violation',
    violationContext: 'Tab Switch Detected',
    status: 'pending' as const,
    requestedAt: new Date().toISOString(),
  };

  const updated: StudentTeacherRequest = {
    ...existing,
    status: 'granted',
    reviewedAt: new Date().toISOString(),
    teacherNote: teacherNote || 'Restart approved by instructor.',
  };

  RESTART_PERMISSIONS_STORE.set(attemptId, updated);

  if (MOCK_ATTEMPTS[attemptId]) {
    MOCK_ATTEMPTS[attemptId].restartPermission = {
      attemptId: updated.attemptId,
      studentId: updated.studentId,
      studentName: updated.studentName,
      examId: updated.examId,
      reason: updated.reason,
      status: 'granted',
      requestedAt: updated.requestedAt,
      grantedAt: updated.reviewedAt,
      teacherNote: updated.teacherNote,
    };
    MOCK_ATTEMPTS[attemptId].status = 'not_started';
  }

  return updated;
}

/**
 * Teacher rejects student restart request
 */
export async function rejectExamRestart(attemptId: string, teacherNote?: string) {
  const existing = RESTART_PERMISSIONS_STORE.get(attemptId);
  if (!existing) return null;

  const updated: StudentTeacherRequest = {
    ...existing,
    status: 'rejected',
    reviewedAt: new Date().toISOString(),
    teacherNote: teacherNote || 'Restart request declined following academic integrity review.',
  };

  RESTART_PERMISSIONS_STORE.set(attemptId, updated);

  if (MOCK_ATTEMPTS[attemptId] && MOCK_ATTEMPTS[attemptId].restartPermission) {
    MOCK_ATTEMPTS[attemptId].restartPermission!.status = 'rejected';
    MOCK_ATTEMPTS[attemptId].restartPermission!.teacherNote = updated.teacherNote;
  }

  return updated;
}

/**
 * Check if teacher granted restart permission
 */
export function checkExamRestartStatus(attemptId: string) {
  return RESTART_PERMISSIONS_STORE.get(attemptId) || null;
}


