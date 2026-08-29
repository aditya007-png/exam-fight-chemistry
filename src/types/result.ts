// src/types/result.ts
// Result & Question-wise Scoring Types

export interface QuestionResult {
  questionId: string;
  questionNumber: number;
  questionText: string;
  type: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  marks: number;
  obtainedMarks: number;
}

export interface ExamResult {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  teacherId: string;
  teacherName?: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  examId: string;
  examTitle: string;
  attemptId: string;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  status: 'SUBMITTED' | 'EVALUATED';
  questionResults: QuestionResult[];
  submittedAt: string;
  createdAt: string;
  updatedAt?: string;
}
