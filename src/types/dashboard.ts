import { ExamStatus } from './database';

export interface ExamItem {
  id: string;
  title: string;
  topic: string;
  courseCode: string;
  courseName: string;
  teacherName: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  passingMarks: number;
  status: ExamStatus;
  scheduledStart: string;
  scheduledEnd: string;
  studentScore?: number;
  studentGrade?: string;
  proctoringActive?: boolean;
  classId?: string;
  className?: string;
  sectionId?: string;
  sectionName?: string;
  teacherId?: string;
}

export interface RecentResult {
  id: string;
  examTitle: string;
  topic: string;
  score: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  completedAt: string;
  rank?: string;
  status: 'passed' | 'failed';
}

export interface ClassItem {
  id: string;
  name: string;
  code: string;
  subject: string;
  studentCount: number;
  activeExamsCount: number;
  createdAt: string;
  description?: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  userEmail: string;
  userRole: string;
  action: string;
  ipAddress: string;
  status: 'success' | 'warning' | 'error';
}

export interface AdminStats {
  totalStudents: number;
  totalTeachers: number;
  totalExams: number;
  activeUsers: number;
  systemHealth: string;
  activeSessions: number;
}
