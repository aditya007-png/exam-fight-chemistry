// src/lib/classService.ts
// Real PostgreSQL & Supabase Database Service for Classes, Sections, and Student Enrollments
import { supabase, isSupabaseConfigured } from './supabase';
import { AcademicClass, AcademicSection, ClassEnrollment } from '../types/academic';

const CLASSES_STORAGE_KEY = 'efc_academic_classes_v1';
const SECTIONS_STORAGE_KEY = 'efc_academic_sections_v1';
const ENROLLMENTS_STORAGE_KEY = 'efc_class_enrollments_v1';

// ── 1. Helper Functions ──────────────────────────────────────────────────────

export const generateEnrollmentCode = (classCode: string, sectionName: string): string => {
  const prefix = (classCode || 'CHEM').replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
  const secLetter = sectionName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 1).toUpperCase() || 'A';
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${secLetter}${randomSuffix}`;
};

// ── 2. Classes Database Layer ────────────────────────────────────────────────

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
    console.error('Error saving classes to storage:', err);
  }
};

export const fetchClassesFromDB = async (teacherId?: string): Promise<AcademicClass[]> => {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase.from('classes').select('*, profiles:teacher_id(full_name, email)');
      if (teacherId) {
        query = query.eq('teacher_id', teacherId);
      }
      const { data, error } = await query;
      if (!error && data) {
        const mapped: AcademicClass[] = data.map((d: any) => ({
          id: d.id,
          teacherId: d.teacher_id,
          teacherName: d.profiles?.full_name || 'Faculty Member',
          name: d.name,
          classCode: d.code,
          academicYear: '2026-27',
          description: d.description || '',
          createdAt: d.created_at,
        }));
        saveStoredClasses(mapped);
        return mapped;
      }
    }
  } catch (err) {
    console.warn('DB fetch classes fallback:', err);
  }
  return getStoredClasses(teacherId);
};

export const getClassById = (classId: string): AcademicClass | null => {
  const classes = getStoredClasses();
  return classes.find((c) => c.id === classId) || null;
};

export const createClass = async (
  teacherId: string,
  teacherName: string,
  name: string,
  classCode: string,
  academicYear: string,
  description?: string
): Promise<AcademicClass> => {
  const cleanCode = classCode.trim().toUpperCase();
  const newClassId = `cls-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const newClass: AcademicClass = {
    id: newClassId,
    teacherId,
    teacherName,
    name: name.trim(),
    classCode: cleanCode,
    academicYear: academicYear.trim() || '2026-27',
    description: description?.trim() || '',
    createdAt: new Date().toISOString(),
  };

  // 1. Write to PostgreSQL Database via Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('classes').insert({
        name: newClass.name,
        code: newClass.classCode,
        teacher_id: teacherId,
        subject: 'Chemistry',
        description: newClass.description,
      }).select().single();

      if (!error && data) {
        newClass.id = data.id;
      }
    } catch (err) {
      console.warn('DB createClass fallback:', err);
    }
  }

  // 2. Update persistent cache
  const classes = getStoredClasses();
  classes.unshift(newClass);
  saveStoredClasses(classes);

  // 3. Automatically create initial Section A
  await createSection(newClass.id, newClass.name, 'Section A', newClass.classCode);

  return newClass;
};

export const deleteClass = async (classId: string): Promise<void> => {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('classes').delete().eq('id', classId);
    } catch (err) {
      console.warn('DB deleteClass error:', err);
    }
  }

  const classes = getStoredClasses().filter((c) => c.id !== classId);
  saveStoredClasses(classes);

  const sections = getStoredSections().filter((s) => s.classId !== classId);
  saveStoredSections(sections);

  const enrollments = getStoredEnrollments().filter((e) => e.classId !== classId);
  saveStoredEnrollments(enrollments);
};

// ── 3. Sections Database Layer ───────────────────────────────────────────────

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
  if (!code || !code.trim()) return null;
  const clean = code.trim().toUpperCase();
  const stripped = clean.replace(/[^A-Z0-9]/g, '');
  const sections = getStoredSections();

  // First check sections
  const foundSec = sections.find((s) => {
    const secClean = s.enrollmentCode.toUpperCase();
    const secStripped = secClean.replace(/[^A-Z0-9]/g, '');
    return (
      secClean === clean ||
      secStripped === stripped ||
      (clean.length >= 3 && secClean.endsWith(clean)) ||
      (stripped.length >= 3 && secStripped.endsWith(stripped))
    );
  });

  if (foundSec) return foundSec;

  // Also match against Class Code directly
  const classes = getStoredClasses();
  const foundClass = classes.find((c) => {
    const clsClean = c.classCode.toUpperCase();
    const clsStripped = clsClean.replace(/[^A-Z0-9]/g, '');
    return clsClean === clean || clsStripped === stripped;
  });

  if (foundClass) {
    const sec = sections.find((s) => s.classId === foundClass.id);
    if (sec) return sec;
  }

  return null;
};

export const createSection = async (
  classId: string,
  className: string,
  name: string,
  classCode?: string
): Promise<AcademicSection> => {
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

// ── 4. Enrollments Database Layer ────────────────────────────────────────────

export const getStoredEnrollments = (filters?: {
  sectionId?: string;
  studentId?: string;
  studentEmail?: string;
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
    if (filters?.studentId || filters?.studentEmail) {
      list = list.filter((e) =>
        (filters.studentId && e.studentId === filters.studentId) ||
        (filters.studentEmail && e.studentEmail.toLowerCase() === filters.studentEmail.toLowerCase())
      );
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

export const fetchEnrollmentsFromDB = async (studentId?: string): Promise<ClassEnrollment[]> => {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase.from('class_members').select('*, classes:class_id(*, profiles:teacher_id(*)), profiles:student_id(*)');
      if (studentId) {
        query = query.eq('student_id', studentId);
      }
      const { data, error } = await query;
      if (!error && data) {
        const mapped: ClassEnrollment[] = data.map((d: any) => ({
          id: d.id,
          studentId: d.student_id,
          studentName: d.profiles?.full_name || 'Student',
          studentEmail: d.profiles?.email || '',
          classId: d.class_id,
          className: d.classes?.name || 'Class',
          sectionId: `sec-${d.class_id}`,
          sectionName: 'Section A',
          teacherId: d.classes?.teacher_id || '',
          teacherName: d.classes?.profiles?.full_name || 'Faculty Member',
          joinedAt: d.joined_at,
          status: 'active',
        }));
        saveStoredEnrollments(mapped);
        return mapped;
      }
    }
  } catch (err) {
    console.warn('DB fetch enrollments fallback:', err);
  }
  return getStoredEnrollments({ studentId });
};

export const joinClassByCode = async (
  studentId: string,
  studentName: string,
  studentEmail: string,
  enrollmentCode: string
): Promise<{ success: boolean; error?: string; enrollment?: ClassEnrollment; className?: string; sectionName?: string }> => {
  const code = enrollmentCode.trim().toUpperCase();
  if (!code) {
    return { success: false, error: 'Please enter a valid section enrollment code.' };
  }

  // 1. Resolve Section & Class from DB / Cache
  let section = getSectionByCode(code);
  let cls: AcademicClass | null = section ? getClassById(section.classId) : null;

  if (isSupabaseConfigured() && (!section || !cls)) {
    try {
      const { data: dbClass } = await supabase
        .from('classes')
        .select('*, profiles:teacher_id(full_name, email)')
        .eq('code', code)
        .single();

      if (dbClass) {
        cls = {
          id: dbClass.id,
          teacherId: dbClass.teacher_id,
          teacherName: dbClass.profiles?.full_name || 'Faculty Member',
          name: dbClass.name,
          classCode: dbClass.code,
          academicYear: '2026-27',
          description: dbClass.description || '',
          createdAt: dbClass.created_at,
        };
        section = {
          id: `sec-${dbClass.id}`,
          classId: dbClass.id,
          className: dbClass.name,
          name: 'Section A',
          enrollmentCode: dbClass.code,
          createdAt: dbClass.created_at,
        };
        const allCls = getStoredClasses();
        allCls.unshift(cls);
        saveStoredClasses(allCls);
        const allSec = getStoredSections();
        allSec.unshift(section);
        saveStoredSections(allSec);
      }
    } catch (err) {
      console.warn('DB joinClass check:', err);
    }
  }

  if (!section || !cls) {
    return {
      success: false,
      error: `Invalid or expired enrollment code "${enrollmentCode.trim()}". Please verify the code with your teacher.`,
    };
  }

  // 2. Check Duplicate Enrollment
  const existing = getStoredEnrollments({ sectionId: section.id }).filter(
    (e) =>
      (studentId && e.studentId === studentId) ||
      (studentEmail && e.studentEmail && e.studentEmail.toLowerCase() === studentEmail.toLowerCase())
  );
  if (existing.length > 0 && existing.some((e) => e.status === 'active')) {
    return { success: false, error: `You are already enrolled in ${cls.name} (${section.name}).` };
  }

  // 3. Insert into PostgreSQL Database if configured
  const effectiveStudentId = studentId || `stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  let enrollmentId = `enr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  if (isSupabaseConfigured() && studentId) {
    try {
      const { data: memberData, error: memberErr } = await supabase.from('class_members').insert({
        class_id: cls.id,
        student_id: studentId,
      }).select().single();

      if (!memberErr && memberData) {
        enrollmentId = memberData.id;
      }
    } catch (err) {
      console.warn('DB class_members insert:', err);
    }
  }

  const newEnrollment: ClassEnrollment = {
    id: enrollmentId,
    studentId: effectiveStudentId,
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

  const allEnrollments = getStoredEnrollments();
  allEnrollments.unshift(newEnrollment);
  saveStoredEnrollments(allEnrollments);

  return {
    success: true,
    enrollment: newEnrollment,
    className: cls.name,
    sectionName: section.name,
  };
};

export const removeStudentFromSection = async (enrollmentId: string): Promise<void> => {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('class_members').delete().eq('id', enrollmentId);
    } catch (err) {
      console.warn('DB remove student error:', err);
    }
  }

  const enrollments = getStoredEnrollments().filter((e) => e.id !== enrollmentId);
  saveStoredEnrollments(enrollments);
};

export const getStudentEnrolledSectionIds = (studentId: string, studentEmail?: string): string[] => {
  const allEnrollments = getStoredEnrollments();
  return allEnrollments
    .filter(
      (e) =>
        e.status === 'active' &&
        ((studentId && e.studentId === studentId) ||
         (studentEmail && e.studentEmail && e.studentEmail.toLowerCase() === studentEmail.toLowerCase()))
    )
    .map((e) => e.sectionId);
};

export const getStudentEnrolledClasses = (studentId: string, studentEmail?: string): Array<{
  class: AcademicClass;
  section: AcademicSection;
  enrollment: ClassEnrollment;
}> => {
  const allEnrollments = getStoredEnrollments();
  const enrollments = allEnrollments.filter(
    (e) =>
      e.status === 'active' &&
      ((studentId && e.studentId === studentId) ||
       (studentEmail && e.studentEmail && e.studentEmail.toLowerCase() === studentEmail.toLowerCase()))
  );
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
