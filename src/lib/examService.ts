// src/lib/examService.ts
// Real Persistent Examination, Question, and Attempt Management Service
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

export const createOrUpdateExam = (
  examData: {
    id?: string;
    title: string;
    courseCode: string;
    courseName?: string;
    topic?: string;
    className: string;
    teacherName?: string;
    durationMinutes: number;
    totalMarks?: number;
    status?: 'active' | 'scheduled' | 'completed' | 'draft';
  },
  questions: ChemQuestion[] = []
): ExamItem => {
  const exams = getStoredExams();
  const id = examData.id || `exam-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const totalMarks =
    examData.totalMarks ||
    questions.reduce((sum, q) => sum + (q.marks || 1), 0) ||
    100;

  const newExam: ExamItem = {
    id,
    title: examData.title.trim(),
    topic: examData.topic || 'General Chemistry',
    courseCode: examData.courseCode.trim().toUpperCase(),
    courseName: examData.courseName || `${examData.courseCode} — Class ${examData.className}`,
    teacherName: examData.teacherName || 'Faculty Instructor',
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

export const deleteExam = (examId: string): boolean => {
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

export const createOrUpdateAttempt = (attempt: ExamAttempt): void => {
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

export const saveAttemptEvidence = (attemptId: string, evidence: ExamEvidence): void => {
  try {
    localStorage.setItem(`${EVIDENCE_STORAGE_KEY}_${attemptId}`, JSON.stringify(evidence));
  } catch (err) {
    console.error(`Error saving evidence for attempt ${attemptId}:`, err);
  }
};
