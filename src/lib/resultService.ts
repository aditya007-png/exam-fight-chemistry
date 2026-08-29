// src/lib/resultService.ts
// REST Client Service for Results and Evaluation
import { ExamResult } from '../types/result';

export async function fetchTeacherResults(filters: {
  teacherId: string;
  examId?: string;
  classId?: string;
  sectionId?: string;
}): Promise<ExamResult[]> {
  try {
    const params = new URLSearchParams();
    params.append('teacherId', filters.teacherId);
    if (filters.examId && filters.examId !== 'all') params.append('examId', filters.examId);
    if (filters.classId && filters.classId !== 'all') params.append('classId', filters.classId);
    if (filters.sectionId && filters.sectionId !== 'all') params.append('sectionId', filters.sectionId);

    const res = await fetch(`/api/results?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.error('Error fetching teacher results:', err);
    return [];
  }
}

export async function fetchStudentResults(studentId: string): Promise<ExamResult[]> {
  try {
    const res = await fetch(`/api/results?studentId=${encodeURIComponent(studentId)}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.error('Error fetching student results:', err);
    return [];
  }
}

export async function fetchResultDetail(resultId: string, authUser: { studentId?: string; teacherId?: string }): Promise<ExamResult | null> {
  try {
    const params = new URLSearchParams();
    if (authUser.studentId) params.append('studentId', authUser.studentId);
    if (authUser.teacherId) params.append('teacherId', authUser.teacherId);

    const res = await fetch(`/api/results/${encodeURIComponent(resultId)}?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.result || null;
  } catch (err) {
    console.error('Error fetching result detail:', err);
    return null;
  }
}
