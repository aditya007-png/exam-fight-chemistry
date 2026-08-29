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
      if (teacherId && !teacherId.startsWith('user-')) {
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
          academicYear: d.academic_year || '2026-27',
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
  let newClassId = `cls-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  // 1. Write to PostgreSQL Database via Supabase if configured
  if (isSupabaseConfigured() && teacherId && !teacherId.startsWith('user-')) {
    try {
      const { data, error } = await supabase.from('classes').insert({
        name: name.trim(),
        code: cleanCode,
        teacher_id: teacherId,
        subject: 'Chemistry',
        academic_year: academicYear.trim() || '2026-27',
        description: description?.trim() || '',
      }).select().single();

      if (!error && data) {
        newClassId = data.id;
      }
    } catch (err) {
      console.warn('DB createClass fallback:', err);
    }
  }

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

  // 2. Update persistent cache
  const classes = getStoredClasses();
  classes.unshift(newClass);
  saveStoredClasses(classes);

  // 3. Automatically create initial Section A with database persistence
  await createSection(newClass.id, newClass.name, 'Section A', newClass.classCode);

  return newClass;
};

export const deleteClass = async (classId: string): Promise<void> => {
  if (isSupabaseConfigured() && !classId.startsWith('cls-')) {
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

export const fetchSectionsFromDB = async (classId?: string): Promise<AcademicSection[]> => {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase.from('sections').select('*, classes:class_id(name, code)');
      if (classId && !classId.startsWith('cls-')) {
        query = query.eq('class_id', classId);
      }
      const { data, error } = await query;
      if (!error && data) {
        const mapped: AcademicSection[] = data.map((d: any) => ({
          id: d.id,
          classId: d.class_id,
          className: d.classes?.name || 'Class',
          name: d.name,
          enrollmentCode: d.enrollment_code,
          createdAt: d.created_at,
        }));
        saveStoredSections(mapped);
        return mapped;
      }
    }
  } catch (err) {
    console.warn('DB fetch sections fallback:', err);
  }
  return getStoredSections(classId);
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

  // 1. Exact match or stripped match on section enrollmentCode
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

  // 2. Also match against Class Code directly
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
  const enrollmentCode = generateEnrollmentCode(codePrefix, name.trim());
  let newSectionId = `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  // 1. Insert into Supabase sections table if configured
  if (isSupabaseConfigured() && !classId.startsWith('cls-')) {
    try {
      const { data, error } = await supabase.from('sections').insert({
        class_id: classId,
        name: name.trim(),
        enrollment_code: enrollmentCode,
      }).select().single();

      if (!error && data) {
        newSectionId = data.id;
      }
    } catch (err) {
      console.warn('DB createSection error:', err);
    }
  }

  const newSection: AcademicSection = {
    id: newSectionId,
    classId,
    className: className || cls?.name || 'Class',
    name: name.trim(),
    enrollmentCode,
    createdAt: new Date().toISOString(),
  };

  sections.push(newSection);
  saveStoredSections(sections);
  return newSection;
};

export const regenerateSectionCode = async (sectionId: string): Promise<string> => {
  const sections = getStoredSections();
  const idx = sections.findIndex((s) => s.id === sectionId);
  if (idx < 0) return '';

  const cls = getClassById(sections[idx].classId);
  const newCode = generateEnrollmentCode(cls?.classCode || 'CHEM', sections[idx].name);
  sections[idx].enrollmentCode = newCode;

  if (isSupabaseConfigured() && !sectionId.startsWith('sec-')) {
    try {
      await supabase.from('sections').update({ enrollment_code: newCode }).eq('id', sectionId);
    } catch (err) {
      console.warn('DB regenerateSectionCode error:', err);
    }
  }

  saveStoredSections(sections);
  return newCode;
};

export const deleteSection = async (sectionId: string): Promise<void> => {
  if (isSupabaseConfigured() && !sectionId.startsWith('sec-')) {
    try {
      await supabase.from('sections').delete().eq('id', sectionId);
    } catch (err) {
      console.warn('DB deleteSection error:', err);
    }
  }

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
      let query = supabase.from('class_members').select('*, classes:class_id(*, profiles:teacher_id(*)), sections:section_id(*), profiles:student_id(*)');
      if (studentId && !studentId.startsWith('user-')) {
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
          sectionId: d.section_id || `sec-${d.class_id}`,
          sectionName: d.sections?.name || 'Section A',
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
  if (!enrollmentCode || !enrollmentCode.trim()) {
    return { success: false, error: 'Please enter a valid section enrollment code (e.g. XYZ-STUQ9).' };
  }

  const cleanCode = enrollmentCode.trim().toUpperCase();

  // 1. Direct PostgreSQL / Supabase Database Lookups
  let section: AcademicSection | null = null;
  let cls: AcademicClass | null = null;

  if (isSupabaseConfigured()) {
    try {
      // Step A: Search sections table by enrollment_code
      const { data: dbSection, error: secErr } = await supabase
        .from('sections')
        .select('*, classes:class_id(*, profiles:teacher_id(id, full_name, email))')
        .ilike('enrollment_code', cleanCode)
        .maybeSingle();

      if (!secErr && dbSection) {
        const parentClass = dbSection.classes;
        cls = {
          id: parentClass.id,
          teacherId: parentClass.teacher_id,
          teacherName: parentClass.profiles?.full_name || 'Faculty Member',
          name: parentClass.name,
          classCode: parentClass.code,
          academicYear: parentClass.academic_year || '2026-27',
          description: parentClass.description || '',
          createdAt: parentClass.created_at,
        };
        section = {
          id: dbSection.id,
          classId: dbSection.class_id,
          className: parentClass.name,
          name: dbSection.name,
          enrollmentCode: dbSection.enrollment_code,
          createdAt: dbSection.created_at,
        };
      }

      // Step B: If not matched in sections, search classes table by code
      if (!section || !cls) {
        const { data: dbClass } = await supabase
          .from('classes')
          .select('*, profiles:teacher_id(id, full_name, email), sections(*)')
          .ilike('code', cleanCode)
          .maybeSingle();

        if (dbClass) {
          cls = {
            id: dbClass.id,
            teacherId: dbClass.teacher_id,
            teacherName: dbClass.profiles?.full_name || 'Faculty Member',
            name: dbClass.name,
            classCode: dbClass.code,
            academicYear: dbClass.academic_year || '2026-27',
            description: dbClass.description || '',
            createdAt: dbClass.created_at,
          };
          const firstSec = dbClass.sections?.[0];
          section = {
            id: firstSec?.id || `sec-${dbClass.id}`,
            classId: dbClass.id,
            className: dbClass.name,
            name: firstSec?.name || 'Section A',
            enrollmentCode: firstSec?.enrollment_code || dbClass.code,
            createdAt: dbClass.created_at,
          };
        }
      }
    } catch (err) {
      console.warn('DB joinClass query error:', err);
    }
  }

  // 2. Fallback to Local Persistent Cache if not resolved from DB
  if (!section || !cls) {
    section = getSectionByCode(cleanCode);
    cls = section ? getClassById(section.classId) : null;
  }

  if (!section || !cls) {
    return {
      success: false,
      error: `Invalid or expired enrollment code "${enrollmentCode.trim()}". Please verify the code with your teacher.`,
    };
  }

  // Synchronize found class & section into local cache
  const allCls = getStoredClasses();
  if (!allCls.some((c) => c.id === cls!.id)) {
    allCls.unshift(cls);
    saveStoredClasses(allCls);
  }
  const allSec = getStoredSections();
  if (!allSec.some((s) => s.id === section!.id)) {
    allSec.unshift(section);
    saveStoredSections(allSec);
  }

  // 3. Check Duplicate Enrollment
  const existing = getStoredEnrollments({ sectionId: section.id }).filter(
    (e) =>
      (studentId && e.studentId === studentId) ||
      (studentEmail && e.studentEmail && e.studentEmail.toLowerCase() === studentEmail.toLowerCase())
  );
  if (existing.length > 0 && existing.some((e) => e.status === 'active')) {
    return { success: false, error: `You are already enrolled in ${cls.name} (${section.name}).` };
  }

  // 4. Insert into PostgreSQL Database if configured
  const effectiveStudentId = studentId || `stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  let enrollmentId = `enr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  if (isSupabaseConfigured() && studentId && !studentId.startsWith('user-')) {
    try {
      const { data: memberData, error: memberErr } = await supabase.from('class_members').insert({
        class_id: cls.id,
        section_id: section.id.startsWith('sec-') ? null : section.id,
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
  if (isSupabaseConfigured() && !enrollmentId.startsWith('enr-')) {
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
