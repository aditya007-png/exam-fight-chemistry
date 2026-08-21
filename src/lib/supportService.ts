// src/lib/supportService.ts
// Persistent complaint and support ticket service for students, teachers, and admins

export interface SupportComplaint {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: 'student' | 'teacher' | 'admin' | 'guest';
  category:
    | 'Proctoring / Camera Issue'
    | 'Question / KaTeX Notation Bug'
    | 'Exam Submission Issue'
    | 'Room Scan Difficulty'
    | 'Account / Profile Assistance'
    | 'General Feedback';
  subject: string;
  description: string;
  screenshotUrl?: string | null;
  status: 'Open' | 'In Progress' | 'Resolved';
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
}

const STORAGE_KEY = 'exam_fight_complaints_v1';

export const getStoredComplaints = (): SupportComplaint[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error loading complaints:', err);
    return [];
  }
};

export const saveStoredComplaints = (complaints: SupportComplaint[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
  } catch (err) {
    console.error('Error saving complaints:', err);
  }
};

export const submitComplaint = (data: {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: 'student' | 'teacher' | 'admin' | 'guest';
  category: SupportComplaint['category'];
  subject: string;
  description: string;
  screenshotUrl?: string | null;
}): SupportComplaint => {
  const complaints = getStoredComplaints();
  const ticketSuffix = Math.floor(1000 + Math.random() * 9000);
  const ticketNumber = `TKT-2026-${ticketSuffix}`;

  const newComplaint: SupportComplaint = {
    id: `comp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    ticketNumber,
    userId: data.userId,
    userName: data.userName,
    userEmail: data.userEmail,
    userRole: data.userRole,
    category: data.category,
    subject: data.subject,
    description: data.description,
    screenshotUrl: data.screenshotUrl || null,
    status: 'Open',
    createdAt: new Date().toISOString(),
  };

  const updated = [newComplaint, ...complaints];
  saveStoredComplaints(updated);
  return newComplaint;
};

export const updateComplaintStatus = (
  complaintId: string,
  status: 'Open' | 'In Progress' | 'Resolved',
  resolutionNotes?: string
): SupportComplaint | null => {
  const complaints = getStoredComplaints();
  const index = complaints.findIndex((c) => c.id === complaintId);
  if (index === -1) return null;

  const updated: SupportComplaint = {
    ...complaints[index],
    status,
    resolutionNotes: resolutionNotes !== undefined ? resolutionNotes : complaints[index].resolutionNotes,
    resolvedAt: status === 'Resolved' ? new Date().toISOString() : complaints[index].resolvedAt,
  };

  complaints[index] = updated;
  saveStoredComplaints(complaints);
  return updated;
};

export const deleteComplaint = (complaintId: string): boolean => {
  const complaints = getStoredComplaints();
  const filtered = complaints.filter((c) => c.id !== complaintId);
  if (filtered.length === complaints.length) return false;
  saveStoredComplaints(filtered);
  return true;
};
