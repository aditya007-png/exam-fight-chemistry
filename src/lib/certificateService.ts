import { CertificateData, VerificationResult } from '../types/certificate';

const CERTIFICATES_STORAGE_KEY = 'efc_academic_certificates_v1';

export const getStoredCertificates = (): Record<string, CertificateData> => {
  try {
    const raw = localStorage.getItem(CERTIFICATES_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

export const saveCertificate = (cert: CertificateData): void => {
  const store = getStoredCertificates();
  store[cert.certificateId] = cert;
  localStorage.setItem(CERTIFICATES_STORAGE_KEY, JSON.stringify(store));
};

export const getCertificateByResultId = async (resultId: string): Promise<CertificateData | null> => {
  const store = getStoredCertificates();
  const cert = Object.values(store).find((c) => c.resultId === resultId);
  return cert || null;
};

export const verifyCertificateById = async (certificateId: string): Promise<VerificationResult> => {
  const normalizedId = certificateId.trim().toUpperCase();
  const store = getStoredCertificates();
  const cert = Object.values(store).find(
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

  return {
    isValid: false,
    verifiedAt: new Date().toISOString(),
    tamperDetected: true,
    institutionTrustScore: 0,
  };
};
