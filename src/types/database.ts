import { UserRole } from './auth';

export interface DbProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbClass {
  id: string;
  name: string;
  code: string;
  teacher_id: string;
  subject: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbClassMember {
  id: string;
  class_id: string;
  student_id: string;
  joined_at: string;
}

export interface DbTeacherVerificationCode {
  id: string;
  code: string;
  created_by: string | null;
  used_by: string | null;
  is_used: boolean;
  expires_at: string | null;
  created_at: string;
}

export type ExamStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'archived';

export interface DbExam {
  id: string;
  title: string;
  description: string | null;
  teacher_id: string;
  class_id: string | null;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  status: ExamStatus;
  scheduled_start: string | null;
  scheduled_end: string | null;
  created_at: string;
  updated_at: string;
}
