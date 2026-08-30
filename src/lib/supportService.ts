// src/lib/supportService.ts
// Real backend & REST API Service for support tickets and student/faculty complaints

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
    console.error('Error loading complaints from localStorage:', err);
    return [];
  }
};

export const saveStoredComplaints = (complaints: SupportComplaint[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
  } catch (err) {
    console.error('Error saving complaints to localStorage:', err);
  }
};

export const fetchComplaintsFromDB = async (): Promise<SupportComplaint[]> => {
  try {
    const res = await fetch('/api/complaints');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.complaints)) {
        saveStoredComplaints(data.complaints);
        return data.complaints;
      }
    }
  } catch (err) {
    console.warn('Backend fetchComplaintsFromDB error:', err);
  }
  return getStoredComplaints();
};

export const submitComplaint = async (data: {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: 'student' | 'teacher' | 'admin' | 'guest';
  category: SupportComplaint['category'];
  subject: string;
  description: string;
  screenshotUrl?: string | null;
}): Promise<SupportComplaint> => {
  try {
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const respData = await res.json();
      if (respData.complaint) {
        const current = getStoredComplaints();
        const updated = [respData.complaint, ...current.filter(c => c.id !== respData.complaint.id)];
        saveStoredComplaints(updated);
        return respData.complaint;
      }
    }
  } catch (err) {
    console.warn('Backend submitComplaint error:', err);
  }

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

export const updateComplaintStatus = async (
  complaintId: string,
  status: 'Open' | 'In Progress' | 'Resolved',
  resolutionNotes?: string
): Promise<SupportComplaint | null> => {
  try {
    const res = await fetch(`/api/complaints/${encodeURIComponent(complaintId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, resolutionNotes }),
    });
    if (res.ok) {
      const respData = await res.json();
      if (respData.complaint) {
        const current = getStoredComplaints();
        const updated = current.map(c => c.id === complaintId ? respData.complaint : c);
        saveStoredComplaints(updated);
        return respData.complaint;
      }
    }
  } catch (err) {
    console.warn('Backend updateComplaintStatus error:', err);
  }

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

export const deleteComplaint = async (complaintId: string): Promise<boolean> => {
  try {
    await fetch(`/api/complaints/${encodeURIComponent(complaintId)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('Backend deleteComplaint error:', err);
  }

  const complaints = getStoredComplaints();
  const filtered = complaints.filter((c) => c.id !== complaintId);
  if (filtered.length === complaints.length) return false;
  saveStoredComplaints(filtered);
  return true;
};
