// src/types/request.ts
// Request data types for Student Issues and Teacher Approvals

export type RequestType =
  | 'EXAM_EXITED'
  | 'TECHNICAL_ISSUE'
  | 'CAMERA_ISSUE'
  | 'REATTEMPT_REQUEST'
  | 'OTHER';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESOLVED';

export interface ExamRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  examId: string;
  examTitle: string;
  attemptId?: string | null;
  requestType: RequestType;
  message: string;
  status: RequestStatus;
  teacherResponse?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
