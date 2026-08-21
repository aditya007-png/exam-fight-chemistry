export type LiveCandidateStatus = 'writing' | 'idle' | 'flagged' | 'submitted';

export interface LiveCandidateSession {
  studentId: string;
  studentName: string;
  studentEmail: string;
  avatarUrl?: string;
  status: LiveCandidateStatus;
  currentQuestionIndex: number;
  totalQuestions: number;
  answeredCount: number;
  timeRemainingSeconds: number;
  strikeCount: number;
  lastActiveTimestamp: string;
  isFlaggedSuspicious: boolean;
  ipAddress: string;
  deviceInfo: string;
}

export interface BroadcastAnnouncement {
  id: string;
  examId: string;
  instructorName: string;
  message: string;
  severity: 'info' | 'important' | 'correction';
  sentAt: string;
}

export interface CohortAnalyticsSummary {
  examId: string;
  examTitle: string;
  courseCode: string;
  totalEnrolled: number;
  totalSubmissions: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  standardDeviation: number;
  passingPercentage: number;
  gradeHistogram: {
    grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    count: number;
    percentage: number;
  }[];
  topicWeaknesses: {
    topic: string;
    domain: string;
    averageAccuracy: number;
    needsRemediation: boolean;
  }[];
}
