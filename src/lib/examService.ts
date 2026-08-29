// src/lib/examService.ts
// Real PostgreSQL & REST Backend Service for Examinations, Questions, Attempts, and Proctoring Records
import { supabase, isSupabaseConfigured } from './supabase';
import { ExamItem } from '../types/dashboard';
import { ChemQuestion } from '../types/question';
import { ExamAttempt } from '../types/evidence';

const EXAMS_STORAGE_KEY = 'exam_fight_exams_v2';
const QUESTIONS_STORAGE_KEY = 'exam_fight_exam_questions_v2';
const ATTEMPTS_STORAGE_KEY = 'exam_fight_attempts_v2';
const EVIDENCE_STORAGE_KEY = 'exam_fight_evidence_v2';

// ── 1. Exams API ─────────────────────────────────────────────────────────────

export const getStoredExams = (): ExamItem[] => {
  try {
    const raw = localStorage.getItem(EXAMS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading stored exams:', err);
    return [];
  }
};

export const saveStoredExams = (exams: ExamItem[]): void => {
  try {
    localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(exams));
  } catch (err) {
    console.error('Error saving exams:', err);
  }
};

export const fetchExamsFromDB = async (teacherId?: string): Promise<ExamItem[]> => {
  try {
    const res = await fetch(`/api/exams${teacherId ? `?teacherId=${teacherId}` : ''}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.exams)) {
        const mapped: ExamItem[] = data.exams.map((d: any) => ({
          id: d.id,
          title: d.title,
          topic: d.topic || 'General Chemistry',
          courseCode: d.courseCode || 'CHEM101',
          courseName: d.courseName || `${d.courseCode || 'CHEM101'} — Chemistry`,
          teacherName: d.teacherName || 'Faculty Instructor',
          teacherId: d.teacherId,
          classId: d.classId,
          className: d.className,
          sectionId: d.sectionId,
          sectionName: d.sectionName || 'Section A',
          durationMinutes: d.durationMinutes || 60,
          totalQuestions: d.totalQuestions || (d.questions ? d.questions.length : 10),
          totalMarks: d.totalMarks || 100,
          passingMarks: d.passingMarks || 40,
          status: d.status || 'active',
          scheduledStart: d.scheduledStart || new Date().toISOString(),
          scheduledEnd: d.scheduledEnd || new Date(Date.now() + 3600000).toISOString(),
          proctoringActive: true,
        }));
        saveStoredExams(mapped);

        // Also cache questions for each exam
        data.exams.forEach((ex: any) => {
          if (Array.isArray(ex.questions) && ex.questions.length > 0) {
            saveExamQuestions(ex.id, ex.questions);
          }
        });

        return mapped;
      }
    }
  } catch (err) {}

  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('exams').select('*, profiles:teacher_id(full_name), classes:class_id(name, code)');
      if (teacherId) {
        query = query.eq('teacher_id', teacherId);
      }
      const { data, error } = await query;
      if (!error && data) {
        const mapped: ExamItem[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          topic: 'General Chemistry',
          courseCode: d.classes?.code || 'CHEM-101',
          courseName: `${d.classes?.code || 'CHEM-101'} — ${d.classes?.name || 'Class'}`,
          teacherName: d.profiles?.full_name || 'Faculty Member',
          teacherId: d.teacher_id,
          classId: d.class_id,
          className: d.classes?.name,
          sectionId: `sec-${d.class_id}`,
          sectionName: 'Section A',
          durationMinutes: d.duration_minutes || 60,
          totalQuestions: 10,
          totalMarks: d.total_marks || 100,
          passingMarks: d.passing_marks || 40,
          status: d.status || 'active',
          scheduledStart: d.scheduled_start || new Date().toISOString(),
          scheduledEnd: d.scheduled_end || new Date(Date.now() + 3600000).toISOString(),
          proctoringActive: true,
        }));
        saveStoredExams(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('DB fetchExams error:', err);
    }
  }
  return getStoredExams();
};

export const getExamById = (examId: string): ExamItem | null => {
  const exams = getStoredExams();
  return exams.find((e) => e.id === examId) || null;
};

export const getExamQuestions = (examId: string): ChemQuestion[] => {
  try {
    const raw = localStorage.getItem(`${QUESTIONS_STORAGE_KEY}_${examId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error(`Error reading questions for exam ${examId}:`, err);
    return [];
  }
};

export const saveExamQuestions = (examId: string, questions: ChemQuestion[]): void => {
  try {
    localStorage.setItem(`${QUESTIONS_STORAGE_KEY}_${examId}`, JSON.stringify(questions));
  } catch (err) {
    console.error(`Error saving questions for exam ${examId}:`, err);
  }
};

export const getExamsForTeacher = (teacherId?: string): ExamItem[] => {
  const exams = getStoredExams();
  if (teacherId) {
    return exams.filter((e) => !e.teacherId || e.teacherId === teacherId);
  }
  return exams;
};

export const getExamsForStudent = (enrolledSectionIds: string[]): ExamItem[] => {
  const exams = getStoredExams();
  if (enrolledSectionIds.length === 0) {
    return exams.filter((e) => !e.sectionId && !e.classId);
  }
  return exams.filter(
    (e) =>
      (!e.sectionId && !e.classId) ||
      (e.sectionId && enrolledSectionIds.includes(e.sectionId)) ||
      (e.classId && enrolledSectionIds.some((s) => s.includes(e.classId!)))
  );
};

export const createOrUpdateExam = async (
  examData: {
    id?: string;
    title: string;
    courseCode: string;
    courseName?: string;
    topic?: string;
    className: string;
    teacherName?: string;
    teacherId?: string;
    classId?: string;
    sectionId?: string;
    sectionName?: string;
    durationMinutes: number;
    totalMarks?: number;
    status?: 'active' | 'scheduled' | 'completed' | 'draft';
  },
  questions: ChemQuestion[] = []
): Promise<ExamItem> => {
  const exams = getStoredExams();
  let id = examData.id || `exam-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const totalMarks =
    examData.totalMarks ||
    questions.reduce((sum, q) => sum + (q.marks || 1), 0) ||
    100;

  // 1. Try Backend REST API
  try {
    const res = await fetch('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...examData,
        id,
        totalMarks,
        questions,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.exam) {
        id = data.exam.id;
      }
    }
  } catch (err) {}

  // 2. Insert into PostgreSQL Supabase DB if configured
  if (isSupabaseConfigured() && examData.teacherId) {
    try {
      const { data: dbExam, error: dbErr } = await supabase.from('exams').upsert({
        title: examData.title.trim(),
        description: examData.topic || 'Chemistry Examination',
        teacher_id: examData.teacherId,
        class_id: examData.classId || null,
        duration_minutes: examData.durationMinutes || 60,
        total_marks: totalMarks,
        passing_marks: Math.ceil(totalMarks * 0.4),
        status: examData.status || 'active',
      }).select().single();

      if (!dbErr && dbExam) {
        id = dbExam.id;
      }
    } catch (err) {
      console.warn('DB createOrUpdateExam error:', err);
    }
  }

  const newExam: ExamItem = {
    id,
    title: examData.title.trim(),
    topic: examData.topic || 'General Chemistry',
    courseCode: examData.courseCode.trim().toUpperCase(),
    courseName: examData.courseName || `${examData.courseCode} — ${examData.className || 'Chemistry Class'}`,
    teacherName: examData.teacherName || 'Faculty Instructor',
    teacherId: examData.teacherId,
    classId: examData.classId,
    className: examData.className,
    sectionId: examData.sectionId,
    sectionName: examData.sectionName,
    durationMinutes: examData.durationMinutes || 60,
    totalQuestions: questions.length,
    totalMarks,
    passingMarks: Math.ceil(totalMarks * 0.4),
    status: examData.status || 'active',
    scheduledStart: new Date().toISOString(),
    scheduledEnd: new Date(Date.now() + (examData.durationMinutes || 60) * 60000).toISOString(),
    proctoringActive: true,
  };

  const existingIndex = exams.findIndex((e) => e.id === id);
  if (existingIndex >= 0) {
    exams[existingIndex] = newExam;
  } else {
    exams.unshift(newExam);
  }

  saveStoredExams(exams);
  if (questions.length > 0) {
    saveExamQuestions(id, questions);
  }

  return newExam;
};

export const deleteExam = async (examId: string): Promise<boolean> => {
  try {
    await fetch(`/api/exams/${examId}`, { method: 'DELETE' });
  } catch {}

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('exams').delete().eq('id', examId);
    } catch (err) {
      console.warn('DB deleteExam error:', err);
    }
  }

  const exams = getStoredExams();
  const filtered = exams.filter((e) => e.id !== examId);
  if (filtered.length === exams.length) return false;
  saveStoredExams(filtered);
  try {
    localStorage.removeItem(`${QUESTIONS_STORAGE_KEY}_${examId}`);
  } catch {}
  return true;
};

// ── 2. Attempts & Proctoring Evidence API ──────────────────────────────────────

export const getAllStoredAttempts = (): ExamAttempt[] => {
  try {
    const raw = localStorage.getItem(ATTEMPTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading stored attempts:', err);
    return [];
  }
};

export const saveStoredAttempts = (attempts: ExamAttempt[]): void => {
  try {
    localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(attempts));
  } catch (err) {
    console.error('Error saving attempts:', err);
  }
};

export const fetchAttemptsFromDB = async (): Promise<ExamAttempt[]> => {
  try {
    const res = await fetch('/api/attempts');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.attempts)) {
        saveStoredAttempts(data.attempts);
        return data.attempts;
      }
    }
  } catch (err) {}

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('*, exams:exam_id(title, classes:class_id(name, code)), profiles:student_id(full_name, email)');
      if (!error && data) {
        const mapped: ExamAttempt[] = data.map((d: any) => ({
          id: d.id,
          examId: d.exam_id,
          examTitle: d.exams?.title || 'Chemistry Examination',
          courseCode: d.exams?.classes?.code || 'CHEM-101',
          className: d.exams?.classes?.name || 'Class',
          studentId: d.student_id,
          studentName: d.profiles?.full_name || 'Student',
          studentEmail: d.profiles?.email || '',
          status: d.status,
          roomScanCompleted: d.room_scan_completed,
          startedAt: d.started_at,
          submittedAt: d.submitted_at,
          score: d.score,
          totalMarks: d.total_marks || 100,
          integrityScore: d.integrity_score || 100,
          riskLevel: d.integrity_score < 70 ? 'HIGH' : d.integrity_score < 85 ? 'MEDIUM' : 'LOW',
          totalViolations: 0,
          evidenceCount: 1,
          durationMinutes: 45,
          createdAt: d.created_at,
        }));
        saveStoredAttempts(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('DB fetchAttempts error:', err);
    }
  }

  return getAllStoredAttempts();
};

export const getAttemptsForStudent = (studentId: string): ExamAttempt[] => {
  const attempts = getAllStoredAttempts();
  return attempts.filter(
    (a) => a.studentId === studentId || a.studentEmail?.toLowerCase() === studentId.toLowerCase()
  );
};

export const getAttemptsForExam = (examId: string): ExamAttempt[] => {
  const attempts = getAllStoredAttempts();
  return attempts.filter((a) => a.examId === examId);
};

export const getAttemptById = (attemptId: string): ExamAttempt | null => {
  const attempts = getAllStoredAttempts();
  return attempts.find((a) => a.id === attemptId) || null;
};

export const saveExamAttempt = (attempt: Partial<ExamAttempt> & { examId: string; studentId: string }): ExamAttempt => {
  const attempts = getAllStoredAttempts();
  const id = attempt.id || `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const exam = getExamById(attempt.examId);

  const newAttempt: ExamAttempt = {
    id,
    examId: attempt.examId,
    examTitle: attempt.examTitle || exam?.title || 'Chemistry Examination',
    courseCode: attempt.courseCode || exam?.courseCode || 'CHEM-101',
    className: attempt.className || exam?.className || 'Class',
    studentId: attempt.studentId,
    studentName: attempt.studentName || 'Student Candidate',
    studentEmail: attempt.studentEmail || '',
    sectionId: attempt.sectionId || exam?.sectionId,
    status: attempt.status || 'in_progress',
    roomScanCompleted: attempt.roomScanCompleted || false,
    startedAt: attempt.startedAt || new Date().toISOString(),
    submittedAt: attempt.submittedAt || null,
    score: attempt.score,
    totalMarks: attempt.totalMarks || exam?.totalMarks || 100,
    integrityScore: attempt.integrityScore !== undefined ? attempt.integrityScore : 100,
    riskLevel:
      attempt.integrityScore !== undefined && attempt.integrityScore < 70
        ? 'HIGH'
        : attempt.integrityScore !== undefined && attempt.integrityScore < 85
        ? 'MEDIUM'
        : 'LOW',
    totalViolations: attempt.totalViolations || 0,
    evidenceCount: attempt.evidenceCount || 1,
    durationMinutes: attempt.durationMinutes || exam?.durationMinutes || 60,
    createdAt: attempt.createdAt || new Date().toISOString(),
  };

  try {
    fetch('/api/attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAttempt),
    });
  } catch {}

  const index = attempts.findIndex((a) => a.id === id);
  if (index >= 0) {
    attempts[index] = newAttempt;
  } else {
    attempts.unshift(newAttempt);
  }

  saveStoredAttempts(attempts);
  return newAttempt;
};

export const createOrUpdateAttempt = (attempt: ExamAttempt): ExamAttempt => {
  return saveExamAttempt(attempt);
};

export const getAttemptEvidence = (attemptId: string): any => {
  try {
    const raw = localStorage.getItem(`${EVIDENCE_STORAGE_KEY}_${attemptId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveAttemptEvidence = (attemptId: string, evidenceData: any): void => {
  try {
    localStorage.setItem(`${EVIDENCE_STORAGE_KEY}_${attemptId}`, JSON.stringify(evidenceData));
    fetch('/api/evidence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attemptId, ...evidenceData }),
    }).catch(() => {});
  } catch (err) {
    console.error('Error saving evidence:', err);
  }
};
