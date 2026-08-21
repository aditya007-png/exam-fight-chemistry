export interface CertificateData {
  certificateId: string;
  resultId: string;
  studentId: string;
  studentName: string;
  examId: string;
  examTitle: string;
  courseCode: string;
  institutionName: string;
  scorePercentage: number;
  grade: string;
  percentileRank: number;
  issueDate: string;
  completionTimestamp: string;
  verificationHash: string; // SHA-256 verification hash
  instructorSignatureName: string;
  instructorTitle: string;
  academicHonors?: 'Summa Cum Laude' | 'Magna Cum Laude' | 'Distinction' | 'Pass';
}

export interface VerificationResult {
  isValid: boolean;
  certificate?: CertificateData;
  verifiedAt: string;
  tamperDetected: boolean;
  institutionTrustScore: number;
}
