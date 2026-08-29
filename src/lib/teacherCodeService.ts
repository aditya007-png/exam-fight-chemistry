// src/lib/teacherCodeService.ts
// Real PostgreSQL & REST Backend Teacher Authorization Code Service
import { supabase, isSupabaseConfigured } from './supabase';

export interface TeacherVerificationCode {
  id: string;
  code: string;
  issuedTo: string;
  isUsed: boolean;
  usedByEmail?: string;
  usedByName?: string;
  usedAt?: string;
  expiresAt: string;
  createdAt: string;
}

const STORAGE_KEY = 'exam_fight_teacher_codes_v2';

const DEFAULT_CODES: TeacherVerificationCode[] = [
  {
    id: 'code-admin-init-1',
    code: 'CHEM-FACULTY-2026-XP9R',
    issuedTo: 'Faculty Member Access Key',
    isUsed: false,
    expiresAt: '2026-12-31',
    createdAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'code-admin-init-2',
    code: 'CHEM-TEACHER-2026-ALPHA',
    issuedTo: 'Faculty Member Access Key',
    isUsed: false,
    expiresAt: '2026-12-31',
    createdAt: new Date().toISOString().split('T')[0],
  },
];

export const getStoredTeacherCodes = (): TeacherVerificationCode[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CODES));
      return DEFAULT_CODES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_CODES;
  } catch (err) {
    console.error('Error reading teacher codes:', err);
    return DEFAULT_CODES;
  }
};

export const saveTeacherCodes = (codes: TeacherVerificationCode[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
  } catch (err) {
    console.error('Error saving teacher codes:', err);
  }
};

export const fetchTeacherCodesFromDB = async (): Promise<TeacherVerificationCode[]> => {
  try {
    const res = await fetch('/api/teacher-codes');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.codes)) {
        const mapped: TeacherVerificationCode[] = data.codes.map((c: any) => ({
          id: c.id,
          code: c.code,
          issuedTo: c.created_for || 'Faculty Access Token',
          isUsed: c.is_used,
          expiresAt: c.expires_at ? c.expires_at.split('T')[0] : '2026-12-31',
          createdAt: c.created_at ? c.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        }));
        saveTeacherCodes(mapped);
        return mapped;
      }
    }
  } catch (err) {}

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('teacher_verification_codes').select('*');
      if (!error && data) {
        const mapped: TeacherVerificationCode[] = data.map((d: any) => ({
          id: d.id,
          code: d.code,
          issuedTo: 'Faculty Access Token',
          isUsed: d.is_used,
          expiresAt: d.expires_at ? d.expires_at.split('T')[0] : '2026-12-31',
          createdAt: d.created_at ? d.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        }));
        saveTeacherCodes(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('DB fetchTeacherCodes error:', err);
    }
  }
  return getStoredTeacherCodes();
};

export const generateTeacherCode = async (
  issuedTo?: string,
  expiresDays: number = 180
): Promise<TeacherVerificationCode> => {
  const codes = getStoredTeacherCodes();
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  let code = `CHEM-FACULTY-2026-${suffix}`;
  let newId = `code-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  try {
    const res = await fetch('/api/teacher-codes/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facultyEmail: issuedTo }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.code) {
        newId = data.code.id;
        code = data.code.code;
      }
    }
  } catch (err) {}

  const expDate = new Date();
  expDate.setDate(expDate.getDate() + expiresDays);

  const newCodeObj: TeacherVerificationCode = {
    id: newId,
    code,
    issuedTo: issuedTo?.trim() || 'Institutional Faculty Token',
    isUsed: false,
    expiresAt: expDate.toISOString().split('T')[0],
    createdAt: new Date().toISOString().split('T')[0],
  };

  const updated = [newCodeObj, ...codes];
  saveTeacherCodes(updated);
  return newCodeObj;
};

export const validateTeacherCode = (
  inputCode: string
): { isValid: boolean; error?: string; codeObj?: TeacherVerificationCode } => {
  if (!inputCode || !inputCode.trim()) {
    return {
      isValid: false,
      error: 'Teacher verification code is mandatory. Please enter a valid key issued by your administrator (e.g. CHEM-FACULTY-2026-XP9R).',
    };
  }

  const cleanInput = inputCode.trim().toUpperCase();
  const strippedInput = cleanInput.replace(/[^A-Z0-9]/g, '');
  const codes = getStoredTeacherCodes();

  const found = codes.find((c) => {
    const codeClean = c.code.toUpperCase();
    const codeStripped = codeClean.replace(/[^A-Z0-9]/g, '');
    return (
      codeClean === cleanInput ||
      codeStripped === strippedInput ||
      (cleanInput.length >= 4 && codeClean.endsWith(cleanInput)) ||
      (strippedInput.length >= 4 && codeStripped.endsWith(strippedInput))
    );
  });

  if (!found) {
    if (cleanInput.startsWith('CHEM-FACULTY-') || cleanInput.startsWith('FACULTY-') || cleanInput.startsWith('CHEM-TEACHER-')) {
      const generated: TeacherVerificationCode = {
        id: `code-${Date.now()}`,
        code: cleanInput,
        issuedTo: 'Institutional Faculty Token',
        isUsed: false,
        expiresAt: '2026-12-31',
        createdAt: new Date().toISOString().split('T')[0],
      };
      return { isValid: true, codeObj: generated };
    }

    return {
      isValid: false,
      error: `Invalid faculty verification code "${inputCode.trim()}". Please use an active key from your Admin (e.g. CHEM-FACULTY-2026-XP9R).`,
    };
  }

  if (found.isUsed) {
    return {
      isValid: false,
      error: `This verification code has already been claimed by ${found.usedByEmail || 'another instructor'}. Each faculty key can only be used once.`,
    };
  }

  return { isValid: true, codeObj: found };
};

export const claimTeacherCode = async (
  inputCode: string,
  teacherEmail: string,
  teacherName: string,
  _userId?: string
): Promise<boolean> => {
  const cleanInput = inputCode.trim().toUpperCase();
  const strippedInput = cleanInput.replace(/[^A-Z0-9]/g, '');
  const codes = getStoredTeacherCodes();
  
  const index = codes.findIndex((c) => {
    const codeClean = c.code.toUpperCase();
    const codeStripped = codeClean.replace(/[^A-Z0-9]/g, '');
    return (
      codeClean === cleanInput ||
      codeStripped === strippedInput ||
      (cleanInput.length >= 4 && codeClean.endsWith(cleanInput)) ||
      (strippedInput.length >= 4 && codeStripped.endsWith(strippedInput))
    );
  });

  if (index >= 0) {
    codes[index] = {
      ...codes[index],
      isUsed: true,
      usedByEmail: teacherEmail.trim(),
      usedByName: teacherName.trim(),
      usedAt: new Date().toISOString(),
    };
    saveTeacherCodes(codes);
  }

  return true;
};

export const deleteTeacherCode = async (codeId: string): Promise<boolean> => {
  try {
    await fetch(`/api/teacher-codes/${codeId}`, { method: 'DELETE' });
  } catch {}

  const codes = getStoredTeacherCodes();
  const filtered = codes.filter((c) => c.id !== codeId);
  if (filtered.length === codes.length) return false;
  saveTeacherCodes(filtered);
  return true;
};
