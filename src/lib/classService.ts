// src/lib/classService.ts
// Service for managing Classes, Sections, and Student Enrollments
import { AcademicClass, AcademicSection, ClassEnrollment } from '../types/academic';

const CLASSES_STORAGE_KEY = 'efc_academic_classes_v1';
const SECTIONS_STORAGE_KEY = 'efc_academic_sections_v1';
const ENROLLMENTS_STORAGE_KEY = 'efc_class_enrollments_v1';

// ── 1. Helper Functions ──────────────────────────────────────────────────────

const generateEnrollmentCode = (classCode: string, sectionName: string): string => {
  const prefix = (classCode || 'CHEM').replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
  const secLetter = sectionName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 1).toUpperCase() || 'A';
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${secLetter}${randomSuffix}`;
};

// ── 2. Classes API ───────────────────────────────────────────────────────────

export const getStoredClasses = (teacherId?: string): AcademicClass[] => {
  try {
    const raw = localStorage.getItem(CLASSES_STORAGE_KEY);
    if (!raw) return [];
    const list: AcademicClass[] = JSON.parse(raw);
    if (teacherId) {
      return list.filter((c) => c.teacherId === teacherId);
    }
    return list;
  } catch {
    return [];
  }
};

export const saveStoredClasses = (classes: AcademicClass[]): void => {
  try {
    localStorage.setItem(CLASSES_STORAGE_KEY, JSON.stringify(classes));
  } catch (err) {
    console.error('Error saving classes:', err);
  }
};

export const getClassById = (classId: string): AcademicClass | null => {
  const classes = getStoredClasses();
  return classes.find((c) => c.id === classId) || null;
};

export const createClass = (
  teacherId: string,
  teacherName: string,
  name: string,
  classCode: string,
  academicYear: string,
  description?: string
): AcademicClass => {
  const classes = getStoredClasses();
  const newClass: AcademicClass = {
    id: `cls-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    teacherId,
    teacherName,
    name: name.trim(),
    classCode: classCode.trim().toUpperCase(),
    academicYear: academicYear.trim(),
    description: description?.trim() || '',
    createdAt: new Date().toISOString(),
  };

  classes.unshift(newClass);
  saveStoredClasses(classes);

  // Automatically create "Section A" by default for convenience
  createSection(newClass.id, newClass.name, 'Section A', newClass.classCode);

  return newClass;
};

export const deleteClass = (classId: string): void => {
  const classes = getStoredClasses().filter((c) => c.id !== classId);
  saveStoredClasses(classes);

  // Also remove all associated sections and enrollments
  const sections = getStoredSections().filter((s) => s.classId !== classId);
  saveStoredSections(sections);

  const enrollments = getStoredEnrollments().filter((e) => e.classId !== classId);
  saveStoredEnrollments(enrollments);
};

// ── 3. Sections API ──────────────────────────────────────────────────────────

export const getStoredSections = (classId?: string): AcademicSection[] => {
  try {
    const raw = localStorage.getItem(SECTIONS_STORAGE_KEY);
    if (!raw) return [];
    const list: AcademicSection[] = JSON.parse(raw);
    if (classId) {
      return list.filter((s) => s.classId === classId);
    }
    return list;
  } catch {
    return [];
  }
};

export const saveStoredSections = (sections: AcademicSection[]): void => {
  try {
    localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(sections));
  } catch (err) {
    console.error('Error saving sections:', err);
  }
};

export const getSectionById = (sectionId: string): AcademicSection | null => {
  const sections = getStoredSections();
  return sections.find((s) => s.id === sectionId) || null;
};

export const getSectionByCode = (code: string): AcademicSection | null => {
  const normalized = code.trim().toUpperCase();
  const sections = getStoredSections();
  return sections.find((s) => s.enrollmentCode.toUpperCase() === normalized) || null;
};

export const createSection = (
  classId: string,
  className: string,
  name: string,
  classCode?: string
): AcademicSection => {
  const sections = getStoredSections();
  const cls = getClassById(classId);
  const codePrefix = classCode || cls?.classCode || 'CHEM';

  const newSection: AcademicSection = {
    id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    classId,
    className: className || cls?.name || 'Class',
    name: name.trim(),
    enrollmentCode: generateEnrollmentCode(codePrefix, name.trim()),
    createdAt: new Date().toISOString(),
  };

  sections.push(newSection);
  saveStoredSections(sections);
  return newSection;
};

export const regenerateSectionCode = (sectionId: string): string => {
  const sections = getStoredSections();
  const idx = sections.findIndex((s) => s.id === sectionId);
  if (idx < 0) return '';

  const cls = getClassById(sections[idx].classId);
  const newCode = generateEnrollmentCode(cls?.classCode || 'CHEM', sections[idx].name);
  sections[idx].enrollmentCode = newCode;
  saveStoredSections(sections);
  return newCode;
};

export const deleteSection = (sectionId: string): void => {
  const sections = getStoredSections().filter((s) => s.id !== sectionId);
  saveStoredSections(sections);

  const enrollments = getStoredEnrollments().filter((e) => e.sectionId !== sectionId);
  saveStoredEnrollments(enrollments);
};

// ── 4. Enrollments API ───────────────────────────────────────────────────────

export const getStoredEnrollments = (filters?: {
  sectionId?: string;
  studentId?: string;
  teacherId?: string;
  classId?: string;
}): ClassEnrollment[] => {
  try {
    const raw = localStorage.getItem(ENROLLMENTS_STORAGE_KEY);
    if (!raw) return [];
    let list: ClassEnrollment[] = JSON.parse(raw);

    if (filters?.sectionId) {
      list = list.filter((e) => e.sectionId === filters.sectionId);
    }
    if (filters?.studentId) {
      list = list.filter((e) => e.studentId === filters.studentId);
    }
    if (filters?.teacherId) {
      list = list.filter((e) => e.teacherId === filters.teacherId);
    }
    if (filters?.classId) {
      list = list.filter((e) => e.classId === filters.classId);
    }

    return list;
  } catch {
    return [];
  }
};

export const saveStoredEnrollments = (enrollments: ClassEnrollment[]): void => {
  try {
    localStorage.setItem(ENROLLMENTS_STORAGE_KEY, JSON.stringify(enrollments));
  } catch (err) {
    console.error('Error saving enrollments:', err);
  }
};

export const joinClassByCode = (
  studentId: string,
  studentName: string,
  studentEmail: string,
  enrollmentCode: string
): { success: boolean; error?: string; enrollment?: ClassEnrollment; className?: string; sectionName?: string } => {
  const code = enrollmentCode.trim().toUpperCase();
  if (!code) {
    return { success: false, error: 'Please enter a valid section enrollment code.' };
  }

  const section = getSectionByCode(code);
  if (!section) {
    return { success: false, error: 'Invalid or expired enrollment code.' };
  }

  const cls = getClassById(section.classId);
  if (!cls) {
    return { success: false, error: 'Class not found for this enrollment code.' };
  }

  // Check if student is already enrolled in this section
  const existing = getStoredEnrollments({ sectionId: section.id, studentId });
  if (existing.length > 0 && existing.some((e) => e.status === 'active')) {
    return { success: false, error: 'You are already enrolled in this section.' };
  }

  const allEnrollments = getStoredEnrollments();
  const newEnrollment: ClassEnrollment = {
    id: `enr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    studentId,
    studentName: studentName || 'Student',
    studentEmail: studentEmail || '',
    classId: cls.id,
    className: cls.name,
    sectionId: section.id,
    sectionName: section.name,
    teacherId: cls.teacherId,
    teacherName: cls.teacherName,
    joinedAt: new Date().toISOString(),
    status: 'active',
  };

  allEnrollments.unshift(newEnrollment);
  saveStoredEnrollments(allEnrollments);

  return {
    success: true,
    enrollment: newEnrollment,
    className: cls.name,
    sectionName: section.name,
  };
};

export const removeStudentFromSection = (enrollmentId: string): void => {
  const enrollments = getStoredEnrollments().filter((e) => e.id !== enrollmentId);
  saveStoredEnrollments(enrollments);
};

export const getStudentEnrolledSectionIds = (studentId: string): string[] => {
  const enrollments = getStoredEnrollments({ studentId });
  return enrollments.filter((e) => e.status === 'active').map((e) => e.sectionId);
};

export const getStudentEnrolledClasses = (studentId: string): Array<{
  class: AcademicClass;
  section: AcademicSection;
  enrollment: ClassEnrollment;
}> => {
  const enrollments = getStoredEnrollments({ studentId }).filter((e) => e.status === 'active');
  const result: Array<{
    class: AcademicClass;
    section: AcademicSection;
    enrollment: ClassEnrollment;
  }> = [];

  for (const enr of enrollments) {
    const cls = getClassById(enr.classId);
    const sec = getSectionById(enr.sectionId);
    if (cls && sec) {
      result.push({
        class: cls,
        section: sec,
        enrollment: enr,
      });
    }
  }

  return result;
};
