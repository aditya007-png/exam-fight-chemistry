// src/lib/classService.ts
// Real Database & REST API Service for Classes, Sections, and Student Enrollments
import { supabase, isSupabaseConfigured } from './supabase';
import { AcademicClass, AcademicSection, ClassEnrollment } from '../types/academic';
import { getStoredUsers } from './userService';

const CLASSES_STORAGE_KEY = 'efc_academic_classes_v1';
const SECTIONS_STORAGE_KEY = 'efc_academic_sections_v1';
const ENROLLMENTS_STORAGE_KEY = 'efc_class_enrollments_v1';

// ── 1. Helper Functions ──────────────────────────────────────────────────────

export const resolveTeacherName = (teacherId?: string, fallbackName?: string): string => {
  try {
    const users = getStoredUsers();
    if (teacherId) {
      const found = users.find((u) => u.id === teacherId);
      if (found && found.full_name && found.full_name.trim() !== '') {
        return found.full_name;
      }
    }
    if (
      fallbackName &&
      fallbackName !== 'Faculty Member' &&
      fallbackName !== 'Faculty Instructor' &&
      fallbackName.trim() !== ''
    ) {
      return fallbackName;
    }
    if (fallbackName && fallbackName.trim() !== '') {
      return fallbackName;
    }
  } catch (err) {
    console.warn('resolveTeacherName error:', err);
  }
  return fallbackName || 'Faculty Instructor';
};

export const generateEnrollmentCode = (classCode: string, sectionName: string): string => {
  const prefix = (classCode || 'CHEM').replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
  const secLetter = sectionName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 1).toUpperCase() || 'A';
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${secLetter}${randomSuffix}`;
};

const fuzzyNormalize = (str: string): string => {
  return (str || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
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

export const saveStoredClasses = (classesToMerge: AcademicClass[]): void => {
  try {
    const existing = getStoredClasses();
    const map = new Map<string, AcademicClass>();
    existing.forEach((c) => map.set(c.id, c));
    classesToMerge.forEach((c) => map.set(c.id, c));
    localStorage.setItem(CLASSES_STORAGE_KEY, JSON.stringify(Array.from(map.values())));
  } catch (err) {
    console.error('Error saving classes to storage:', err);
  }
};

export const fetchClassesFromDB = async (teacherId?: string): Promise<AcademicClass[]> => {
  const localClasses = getStoredClasses(teacherId);
  try {
    // 1. Try REST API server
    const apiRes = await fetch(`/api/classes${teacherId ? `?teacherId=${teacherId}` : ''}`);
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.success && Array.isArray(data.classes)) {
        const serverMapped: AcademicClass[] = data.classes.map((c: any) => {
          const classSections: AcademicSection[] | undefined = c.sections
            ? c.sections.map((s: any) => ({
                id: s.id,
                classId: s.class_id || c.id,
                className: s.className || c.name,
                name: s.name,
                enrollmentCode: s.enrollment_code,
                createdAt: s.created_at,
                studentsCount: s.studentsCount,
              }))
            : undefined;

          return {
            id: c.id,
            teacherId: c.teacher_id,
            teacherName: resolveTeacherName(c.teacher_id, c.teacher_name),
            name: c.name,
            classCode: c.code,
            academicYear: c.academic_year || '2026-27',
            description: c.description || '',
            createdAt: c.created_at,
            sectionsCount: c.sectionsCount ?? (classSections ? classSections.length : undefined),
            studentsCount: c.studentsCount,
            sections: classSections,
          };
        });

        // Merge local and server classes
        const classMap = new Map<string, AcademicClass>();
        localClasses.forEach((c) => classMap.set(c.id, c));
        serverMapped.forEach((c) => {
          const existing = classMap.get(c.id);
          classMap.set(c.id, {
            ...existing,
            ...c,
            sections: c.sections || existing?.sections,
            sectionsCount: c.sectionsCount ?? existing?.sectionsCount ?? (existing?.sections ? existing.sections.length : 1),
            studentsCount: c.studentsCount ?? existing?.studentsCount ?? 0,
          });
        });

        const merged = Array.from(classMap.values());
        saveStoredClasses(merged);
        const allSections = merged.flatMap((c) => c.sections || []);
        if (allSections.length > 0) {
          saveStoredSections(allSections);
        }

        // If local had classes that this serverless instance was missing, sync to server in background
        for (const localCls of localClasses) {
          if (!serverMapped.some((s) => s.id === localCls.id)) {
            fetch('/api/classes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: localCls.id,
                teacherId: localCls.teacherId,
                teacherName: localCls.teacherName,
                name: localCls.name,
                classCode: localCls.classCode,
                academicYear: localCls.academicYear,
                description: localCls.description,
              }),
            }).catch(() => {});
          }
        }

        return merged;
      }
    }
  } catch (err) {
    // Fallback to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('classes').select('*, profiles:teacher_id(full_name, email)');
        if (teacherId && !teacherId.startsWith('user-')) {
          query = query.eq('teacher_id', teacherId);
        }
        const { data, error } = await query;
        if (!error && data) {
          const mapped: AcademicClass[] = data.map((d: any) => ({
            id: d.id,
            teacherId: d.teacher_id,
            teacherName: resolveTeacherName(d.teacher_id, d.profiles?.full_name),
            name: d.name,
            classCode: d.code,
            academicYear: d.academic_year || '2026-27',
            description: d.description || '',
            createdAt: d.created_at,
          }));
          saveStoredClasses(mapped);
          return mapped;
        }
      } catch (dbErr) {
        console.warn('DB fetch classes fallback:', dbErr);
      }
    }
  }
  return localClasses;
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
  let sectionA: AcademicSection | null = null;

  // 1. Try Backend REST API
  try {
    const res = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teacherId,
        teacherName,
        name: name.trim(),
        classCode: cleanCode,
        academicYear: academicYear.trim() || '2026-27',
        description: description?.trim() || '',
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.class) {
        newClassId = data.class.id;
        if (data.section) {
          sectionA = {
            id: data.section.id,
            classId: data.section.class_id,
            className: data.section.className || name.trim(),
            name: data.section.name,
            enrollmentCode: data.section.enrollment_code,
            createdAt: data.section.created_at,
          };
        }
      }
    }
  } catch (apiErr) {
    // 2. Write to PostgreSQL Database via Supabase if configured
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
  }

  const newClass: AcademicClass = {
    id: newClassId,
    teacherId,
    teacherName: resolveTeacherName(teacherId, teacherName),
    name: name.trim(),
    classCode: cleanCode,
    academicYear: academicYear.trim() || '2026-27',
    description: description?.trim() || '',
    createdAt: new Date().toISOString(),
  };

  const classes = getStoredClasses();
  classes.unshift(newClass);
  saveStoredClasses(classes);

  if (sectionA) {
    const sections = getStoredSections();
    sections.unshift(sectionA);
    saveStoredSections(sections);
  } else {
    await createSection(newClass.id, newClass.name, 'Section A', newClass.classCode);
  }

  return newClass;
};

export const deleteClass = async (classId: string): Promise<void> => {
  try {
    await fetch(`/api/classes/${classId}`, { method: 'DELETE' });
  } catch {}

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

export const saveStoredSections = (sectionsToMerge: AcademicSection[]): void => {
  try {
    const existing = getStoredSections();
    const map = new Map<string, AcademicSection>();
    existing.forEach((s) => map.set(s.id, s));
    sectionsToMerge.forEach((s) => map.set(s.id, s));
    localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(Array.from(map.values())));
  } catch (err) {
    console.error('Error saving sections:', err);
  }
};

export const fetchSectionsFromDB = async (classId?: string): Promise<AcademicSection[]> => {
  try {
    // 1. Try REST API
    const res = await fetch(`/api/sections${classId ? `?classId=${classId}` : ''}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.sections)) {
        const mapped: AcademicSection[] = data.sections.map((s: any) => ({
          id: s.id,
          classId: s.class_id,
          className: s.className || 'Class',
          name: s.name,
          enrollmentCode: s.enrollment_code,
          createdAt: s.created_at,
          studentsCount: s.studentsCount,
        }));
        saveStoredSections(mapped);
        return mapped;
      }
    }
  } catch (apiErr) {
    if (isSupabaseConfigured()) {
      try {
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
      } catch (err) {
        console.warn('DB fetch sections fallback:', err);
      }
    }
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
  const fuzzy = fuzzyNormalize(clean);
  const sections = getStoredSections();

  const foundSec = sections.find((s) => {
    const secClean = s.enrollmentCode.toUpperCase();
    const secStripped = secClean.replace(/[^A-Z0-9]/g, '');
    const secFuzzy = fuzzyNormalize(secClean);
    return (
      secClean === clean ||
      secStripped === stripped ||
      secFuzzy === fuzzy ||
      (clean.length >= 3 && secClean.endsWith(clean)) ||
      (stripped.length >= 3 && secStripped.endsWith(stripped)) ||
      (fuzzy.length >= 3 && secFuzzy.endsWith(fuzzy))
    );
  });

  if (foundSec) return foundSec;

  const classes = getStoredClasses();
  const foundClass = classes.find((c) => {
    const clsClean = c.classCode.toUpperCase();
    const clsStripped = clsClean.replace(/[^A-Z0-9]/g, '');
    const clsFuzzy = fuzzyNormalize(clsClean);
    return clsClean === clean || clsStripped === stripped || clsFuzzy === fuzzy;
  });

  if (foundClass) {
    const classSections = getStoredSections(foundClass.id);
    if (classSections.length > 0) return classSections[0];
  }

  return null;
};

export const createSection = async (
  classId: string,
  className: string,
  name: string,
  classCode?: string
): Promise<AcademicSection> => {
  let enrollmentCode = generateEnrollmentCode(classCode || 'CHEM', name);
  let newSectionId = `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  try {
    const res = await fetch('/api/sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId, className, name: name.trim(), classCode }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.section) {
        newSectionId = data.section.id;
        enrollmentCode = data.section.enrollment_code;
      }
    }
  } catch (apiErr) {
    if (isSupabaseConfigured() && !classId.startsWith('cls-')) {
      try {
        const { data, error } = await supabase.from('sections').insert({
          class_id: classId,
          name: name.trim(),
          enrollment_code: enrollmentCode,
        }).select().single();

        if (!error && data) {
          newSectionId = data.id;
          enrollmentCode = data.enrollment_code;
        }
      } catch (err) {
        console.warn('DB createSection error:', err);
      }
    }
  }

  const newSection: AcademicSection = {
    id: newSectionId,
    classId,
    className,
    name: name.trim(),
    enrollmentCode,
    createdAt: new Date().toISOString(),
    studentsCount: 0,
  };

  const sections = getStoredSections();
  sections.unshift(newSection);
  saveStoredSections(sections);

  return newSection;
};

export const regenerateSectionCode = async (sectionId: string): Promise<string> => {
  const section = getSectionById(sectionId);
  const cls = section ? getClassById(section.classId) : null;
  const newCode = generateEnrollmentCode(cls?.classCode || 'CHEM', section?.name || 'A');

  try {
    await fetch(`/api/sections/${sectionId}/regenerate-code`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {}

  if (section) {
    section.enrollmentCode = newCode;
    const sections = getStoredSections();
    const idx = sections.findIndex((s) => s.id === sectionId);
    if (idx >= 0) {
      sections[idx] = section;
      saveStoredSections(sections);
    }
  }

  return newCode;
};

export const deleteSection = async (sectionId: string): Promise<void> => {
  try {
    await fetch(`/api/sections/${sectionId}`, { method: 'DELETE' });
  } catch {}

  const sections = getStoredSections().filter((s) => s.id !== sectionId);
  saveStoredSections(sections);

  const enrollments = getStoredEnrollments().filter((e) => e.sectionId !== sectionId);
  saveStoredEnrollments(enrollments);
};

// ── 4. Enrollments Database Layer ────────────────────────────────────────────

export const getStoredEnrollments = (filters?: {
  sectionId?: string;
  classId?: string;
  studentId?: string;
  studentEmail?: string;
  teacherId?: string;
}): ClassEnrollment[] => {
  try {
    const raw = localStorage.getItem(ENROLLMENTS_STORAGE_KEY);
    if (!raw) return [];
    let list: ClassEnrollment[] = JSON.parse(raw);

    const users = getStoredUsers();
    list = list.map((e) => {
      const studentProfile = users.find(
        (u) =>
          u.id === e.studentId ||
          (e.studentEmail && u.email?.toLowerCase() === e.studentEmail?.toLowerCase())
      );
      return {
        ...e,
        studentName: studentProfile?.full_name || e.studentName || 'Student Candidate',
        studentEmail: studentProfile?.email || e.studentEmail || '',
        teacherName: resolveTeacherName(e.teacherId, e.teacherName),
      };
    });

    if (filters?.sectionId) {
      const targetSec = getSectionById(filters.sectionId);
      list = list.filter(
        (e) =>
          e.sectionId === filters.sectionId ||
          (targetSec && e.classId === targetSec.classId)
      );
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

export const saveStoredEnrollments = (enrollmentsToMerge: ClassEnrollment[]): void => {
  try {
    const existing = getStoredEnrollments();
    const map = new Map<string, ClassEnrollment>();
    existing.forEach((e) => map.set(e.id, e));
    enrollmentsToMerge.forEach((e) => map.set(e.id, e));
    localStorage.setItem(ENROLLMENTS_STORAGE_KEY, JSON.stringify(Array.from(map.values())));
  } catch (err) {
    console.error('Error saving enrollments:', err);
  }
};

export const fetchEnrollmentsFromDB = async (
  filters?: { studentId?: string; classId?: string; sectionId?: string; teacherId?: string } | string
): Promise<ClassEnrollment[]> => {
  try {
    const params = new URLSearchParams();
    if (typeof filters === 'string' && filters) {
      params.set('studentId', filters);
    } else if (typeof filters === 'object' && filters) {
      if (filters.studentId) params.set('studentId', filters.studentId);
      if (filters.classId) params.set('classId', filters.classId);
      if (filters.sectionId) params.set('sectionId', filters.sectionId);
      if (filters.teacherId) params.set('teacherId', filters.teacherId);
    }

    const qs = params.toString();
    const res = await fetch(`/api/enrollments${qs ? `?${qs}` : ''}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.enrollments)) {
        saveStoredEnrollments(data.enrollments);
        return data.enrollments;
      }
    }
  } catch (err) {}

  const filterObj = typeof filters === 'string' ? { studentId: filters } : (filters || {});
  return getStoredEnrollments(filterObj);
};

export const joinClassByCode = async (
  studentId: string,
  studentName: string,
  studentEmail: string,
  enrollmentCode: string
): Promise<{ success: boolean; error?: string; enrollment?: ClassEnrollment; className?: string; sectionName?: string; teacherName?: string }> => {
  if (!enrollmentCode || !enrollmentCode.trim()) {
    return { success: false, error: 'Please enter a valid section enrollment code.' };
  }

  const cleanCode = enrollmentCode.trim().toUpperCase();

  // 1. Try Live REST Backend API
  try {
    const res = await fetch('/api/classes/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, studentName, studentEmail, enrollmentCode: cleanCode }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.enrollment) {
        const allEnrollments = getStoredEnrollments();
        allEnrollments.unshift(data.enrollment);
        saveStoredEnrollments(allEnrollments);
        return {
          success: true,
          enrollment: data.enrollment,
          className: data.className,
          sectionName: data.sectionName,
          teacherName: data.teacherName,
        };
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      if (errData.error) {
        return { success: false, error: errData.error };
      }
    }
  } catch (apiErr) {}

  // 2. Direct PostgreSQL / Supabase Database Lookups
  let section: AcademicSection | null = null;
  let cls: AcademicClass | null = null;

  if (isSupabaseConfigured()) {
    try {
      const { data: dbSection } = await supabase
        .from('sections')
        .select('*, classes:class_id(*, profiles:teacher_id(id, full_name, email))')
        .ilike('enrollment_code', cleanCode)
        .maybeSingle();

      if (dbSection) {
        const parentClass = dbSection.classes;
        cls = {
          id: parentClass.id,
          teacherId: parentClass.teacher_id,
          teacherName: resolveTeacherName(parentClass.teacher_id, parentClass.profiles?.full_name),
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
    } catch (err) {
      console.warn('DB joinClass query error:', err);
    }
  }

  // 3. Fallback to Local Persistent Cache
  if (!section || !cls) {
    section = getSectionByCode(cleanCode);
    cls = section ? getClassById(section.classId) : null;
  }

  // 4. If section or class not found
  if (!section || !cls) {
    return {
      success: false,
      error: 'Invalid section enrollment code. Please check the code provided by your instructor.',
    };
  }

  // 5. Check Duplicate Enrollment
  const existing = getStoredEnrollments({ sectionId: section.id }).filter(
    (e) =>
      (studentId && e.studentId === studentId) ||
      (studentEmail && e.studentEmail && e.studentEmail.toLowerCase() === studentEmail.toLowerCase())
  );
  if (existing.length > 0 && existing.some((e) => e.status === 'active')) {
    return { success: false, error: `You are already enrolled in ${cls.name} (${section.name}).` };
  }

  const effectiveStudentId = studentId || `stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  let enrollmentId = `enr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const finalTeacherName = resolveTeacherName(cls.teacherId, cls.teacherName);

  const newEnrollment: ClassEnrollment = {
    id: enrollmentId,
    studentId: effectiveStudentId,
    studentName: studentName || 'Student Candidate',
    studentEmail: studentEmail || '',
    classId: cls.id,
    className: cls.name,
    sectionId: section.id,
    sectionName: section.name,
    teacherId: cls.teacherId,
    teacherName: finalTeacherName,
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
    teacherName: finalTeacherName,
  };
};

export const removeStudentFromSection = async (enrollmentId: string): Promise<void> => {
  try {
    await fetch(`/api/enrollments/${enrollmentId}`, { method: 'DELETE' });
  } catch {}

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
    let cls = getClassById(enr.classId);
    let sec = getSectionById(enr.sectionId);

    const actualTeacherName = resolveTeacherName(
      cls?.teacherId || enr.teacherId,
      cls?.teacherName || enr.teacherName
    );

    if (!cls) {
      cls = {
        id: enr.classId,
        teacherId: enr.teacherId,
        teacherName: actualTeacherName,
        name: enr.className || 'Chemistry Class',
        classCode: 'CHEM',
        academicYear: '2026-27',
        description: '',
        createdAt: enr.joinedAt,
      };
    } else {
      cls.teacherName = actualTeacherName;
    }

    if (!sec) {
      sec = {
        id: enr.sectionId,
        classId: enr.classId,
        className: enr.className,
        name: enr.sectionName || 'Section A',
        enrollmentCode: 'ACTIVE',
        createdAt: enr.joinedAt,
      };
    }

    enr.teacherName = actualTeacherName;

    result.push({
      class: cls,
      section: sec,
      enrollment: enr,
    });
  }

  return result;
};
