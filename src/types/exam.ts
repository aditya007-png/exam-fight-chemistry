export type QuestionType = 'mcq' | 'msq' | 'numerical' | 'mechanism';

export type ChemistryDomain =
  | 'Organic Chemistry'
  | 'Physical Chemistry'
  | 'Inorganic Chemistry'
  | 'Analytical Chemistry'
  | 'Biochemistry';

export type QuestionDifficulty = 'Foundation' | 'Intermediate' | 'Advanced' | 'Olympiad';

export interface QuestionOption {
  id: string;
  label: string; // A, B, C, D
  text: string;
  formula?: string;
  isCorrect?: boolean;
}

export interface ExamQuestion {
  id: string;
  questionNumber: number;
  type: QuestionType;
  domain: ChemistryDomain;
  topic: string;
  difficulty: QuestionDifficulty;
  marks: number;
  negativeMarks?: number;
  questionText: string;
  chemicalEquation?: string;
  reactionSchemeUrl?: string;
  options?: QuestionOption[];
  correctNumericalAnswer?: number;
  numericalTolerance?: number; // e.g. ±0.05
  numericalUnit?: string; // e.g. "kJ/mol", "M", "atm"
  acceptableUnits?: string[];
  explanation: string;
  stepByStepRubric?: string[];
}

export interface StudentAnswerState {
  questionId: string;
  selectedOptionIds?: string[];
  numericalAnswer?: string;
  mechanismText?: string;
  isMarkedForReview: boolean;
  timeSpentSeconds: number;
  isVisited: boolean;
}

export interface ExamSession {
  examId: string;
  examTitle: string;
  courseCode: string;
  courseName: string;
  teacherName: string;
  totalDurationSeconds: number;
  startedAt: string;
  questions: ExamQuestion[];
  answers: Record<string, StudentAnswerState>;
  isSubmitted: boolean;
  proctoringStrikes: number;
  maxAllowedStrikes: number;
}

export interface ExamSubmissionResult {
  id: string;
  examId: string;
  examTitle: string;
  courseCode: string;
  studentId: string;
  studentName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  passed: boolean;
  submittedAt: string;
  totalTimeSpentSeconds: number;
  questionsCorrect: number;
  questionsIncorrect: number;
  questionsUnattempted: number;
  integrityScore: number; // 0 - 100
  proctoringFlagsCount: number;
  domainBreakdown: {
    domain: ChemistryDomain;
    score: number;
    total: number;
    percentage: number;
  }[];
  questionResults: {
    question: ExamQuestion;
    userAnswer: StudentAnswerState;
    isCorrect: boolean;
    marksAwarded: number;
  }[];
}
