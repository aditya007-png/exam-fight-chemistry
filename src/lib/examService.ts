// src/lib/examService.ts
// Real PostgreSQL & Supabase Database Service for Examinations, Questions, Attempts, and Proctoring Records
import { supabase, isSupabaseConfigured } from './supabase';
import { ExamItem } from '../types/dashboard';
import { ChemQuestion } from '../types/question';
import { ExamAttempt, ExamEvidence } from '../types/evidence';

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
    if (isSupabaseConfigured()) {
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
    }
  } catch (err) {
    console.warn('DB fetchExams error:', err);
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

  // 1. Insert into PostgreSQL Supabase DB if configured
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
    if (isSupabaseConfigured()) {
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
    }
  } catch (err) {
    console.warn('DB fetchAttempts error:', err);
  }
  return getAllStoredAttempts();
};

export const getAttemptById = (attemptId: string): ExamAttempt | null => {
  const attempts = getAllStoredAttempts();
  return attempts.find((a) => a.id === attemptId) || null;
};

export const getAttemptsForExam = (examId: string): ExamAttempt[] => {
  return getAllStoredAttempts().filter((a) => a.examId === examId);
};

export const getAttemptsForStudent = (studentEmailOrId: string): ExamAttempt[] => {
  return getAllStoredAttempts().filter(
    (a) =>
      a.studentId === studentEmailOrId ||
      a.studentEmail.toLowerCase() === studentEmailOrId.toLowerCase()
  );
};

export const createOrUpdateAttempt = async (attempt: ExamAttempt): Promise<void> => {
  if (isSupabaseConfigured() && attempt.studentId && !attempt.studentId.startsWith('user-')) {
    try {
      await supabase.from('exam_attempts').upsert({
        id: attempt.id.length === 36 ? attempt.id : undefined,
        exam_id: attempt.examId,
        student_id: attempt.studentId,
        status: attempt.status,
        room_scan_completed: attempt.roomScanCompleted,
        started_at: attempt.startedAt,
        submitted_at: attempt.submittedAt,
        score: attempt.score,
        total_marks: attempt.totalMarks,
        integrity_score: attempt.integrityScore,
      });
    } catch (err) {
      console.warn('DB createOrUpdateAttempt error:', err);
    }
  }

  const attempts = getAllStoredAttempts();
  const existingIndex = attempts.findIndex((a) => a.id === attempt.id);
  if (existingIndex >= 0) {
    attempts[existingIndex] = attempt;
  } else {
    attempts.unshift(attempt);
  }
  saveStoredAttempts(attempts);
};

export const getAttemptEvidence = (attemptId: string): ExamEvidence | null => {
  try {
    const raw = localStorage.getItem(`${EVIDENCE_STORAGE_KEY}_${attemptId}`);
    if (!raw) return null;
    return JSON.parse(raw) as ExamEvidence;
  } catch (err) {
    console.error(`Error reading evidence for attempt ${attemptId}:`, err);
    return null;
  }
};

export const saveAttemptEvidence = async (attemptId: string, evidence: ExamEvidence): Promise<void> => {
  if (isSupabaseConfigured() && evidence.studentId && !evidence.studentId.startsWith('user-')) {
    try {
      await supabase.from('exam_evidence').insert({
        exam_id: evidence.examId,
        attempt_id: attemptId,
        student_id: evidence.studentId,
        evidence_type: evidence.evidenceType || 'proctoring_event',
        file_path: evidence.filePath || 'evidence/log.json',
        duration_seconds: evidence.durationSeconds || 0,
        metadata: evidence.metadata || {},
      });
    } catch (err) {
      console.warn('DB saveAttemptEvidence error:', err);
    }
  }

  try {
    localStorage.setItem(`${EVIDENCE_STORAGE_KEY}_${attemptId}`, JSON.stringify(evidence));
  } catch (err) {
    console.error(`Error saving evidence for attempt ${attemptId}:`, err);
  }
};
