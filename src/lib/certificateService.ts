import { CertificateData, VerificationResult } from '../types/certificate';

export const MOCK_CERTIFICATES: Record<string, CertificateData> = {
  'cert-chem-302-001': {
    certificateId: 'EFC-2026-984217-CHEM',
    resultId: 'res-001',
    studentId: 'usr-student-001',
    studentName: 'Alex Chen',
    examId: 'exam-act-001',
    examTitle: 'Advanced Organic Chemistry & Reaction Kinetics (CHEM-302)',
    courseCode: 'CHEM-302',
    institutionName: 'Department of Chemistry, Harvard Academic Faculty of Physical Sciences',
    scorePercentage: 92.5,
    grade: 'A+',
    percentileRank: 98,
    issueDate: 'August 22, 2026',
    completionTimestamp: '2026-08-21T18:45:00.000Z',
    verificationHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    instructorSignatureName: 'Dr. Evelyn Vance, Ph.D.',
    instructorTitle: 'Chair of Organic Synthesis & Chemical Examination Board',
    academicHonors: 'Summa Cum Laude',
  },
  'cert-chem-101-002': {
    certificateId: 'EFC-2026-731904-GEN',
    resultId: 'res-002',
    studentId: 'usr-student-001',
    studentName: 'Alex Chen',
    examId: 'exam-act-002',
    examTitle: 'General Chemistry & Stoichiometry (CHEM-101)',
    courseCode: 'CHEM-101',
    institutionName: 'Department of Chemistry, Harvard Academic Faculty of Physical Sciences',
    scorePercentage: 88.0,
    grade: 'A',
    percentileRank: 92,
    issueDate: 'August 15, 2026',
    completionTimestamp: '2026-08-15T14:30:00.000Z',
    verificationHash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    instructorSignatureName: 'Dr. Evelyn Vance, Ph.D.',
    instructorTitle: 'Chair of Organic Synthesis & Chemical Examination Board',
    academicHonors: 'Distinction',
  },
};

export const getCertificateByResultId = async (resultId: string): Promise<CertificateData | null> => {
  const cert = Object.values(MOCK_CERTIFICATES).find((c) => c.resultId === resultId);
  return cert || MOCK_CERTIFICATES['cert-chem-302-001'];
};

export const verifyCertificateById = async (certificateId: string): Promise<VerificationResult> => {
  const normalizedId = certificateId.trim().toUpperCase();
  const cert = Object.values(MOCK_CERTIFICATES).find(
    (c) => c.certificateId.toUpperCase() === normalizedId || c.resultId === certificateId
  );

  if (cert) {
    return {
      isValid: true,
      certificate: cert,
      verifiedAt: new Date().toISOString(),
      tamperDetected: false,
      institutionTrustScore: 100,
    };
  }

  // Fallback demo certificate if query matches pattern
  if (normalizedId.startsWith('EFC-') || normalizedId.startsWith('CERT-')) {
    return {
      isValid: true,
      certificate: {
        ...MOCK_CERTIFICATES['cert-chem-302-001'],
        certificateId: normalizedId,
      },
      verifiedAt: new Date().toISOString(),
      tamperDetected: false,
      institutionTrustScore: 99,
    };
  }

  return {
    isValid: false,
    verifiedAt: new Date().toISOString(),
    tamperDetected: true,
    institutionTrustScore: 0,
  };
};
