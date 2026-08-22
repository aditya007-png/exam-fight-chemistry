// src/types/academic.ts
// Relational models for Classes, Sections, and Student Enrollments

export interface AcademicClass {
  id: string;
  teacherId: string;
  teacherName: string;
  name: string; // e.g. "B.Tech CSE"
  classCode: string; // e.g. "CSE2026"
  academicYear: string; // e.g. "2026-27"
  description?: string;
  createdAt: string;
}

export interface AcademicSection {
  id: string;
  classId: string;
  className: string;
  name: string; // e.g. "Section A"
  enrollmentCode: string; // e.g. "CSE-A7K29"
  createdAt: string;
}

export interface ClassEnrollment {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  teacherId: string;
  teacherName: string;
  joinedAt: string;
  status: 'active' | 'dropped';
}
