// src/lib/requestService.ts
// Client service for Student Requests and Teacher Request Management
import { ExamRequest, RequestType, RequestStatus } from '../types/request';

const API_BASE = '/api';

export async function fetchTeacherRequests(teacherId: string, status?: string): Promise<ExamRequest[]> {
  try {
    let url = `${API_BASE}/requests?teacherId=${encodeURIComponent(teacherId)}`;
    if (status && status !== 'ALL') {
      url += `&status=${encodeURIComponent(status)}`;
    }
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.requests || [];
  } catch (err) {
    console.error('fetchTeacherRequests error:', err);
    return [];
  }
}

export async function fetchStudentRequests(studentId: string): Promise<ExamRequest[]> {
  try {
    const res = await fetch(`${API_BASE}/requests?studentId=${encodeURIComponent(studentId)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.requests || [];
  } catch (err) {
    console.error('fetchStudentRequests error:', err);
    return [];
  }
}

export async function createStudentRequest(payload: {
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  examId: string;
  attemptId?: string | null;
  requestType: RequestType;
  message: string;
}): Promise<{ success: boolean; request?: ExamRequest; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to submit request.' };
    }
    return { success: true, request: data.request };
  } catch (err) {
    console.error('createStudentRequest error:', err);
    return { success: false, error: 'Network connection failed.' };
  }
}

export async function updateTeacherRequestAction(
  requestId: string,
  teacherId: string,
  status: RequestStatus,
  teacherResponse?: string
): Promise<{ success: boolean; request?: ExamRequest; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/requests/${encodeURIComponent(requestId)}/action`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId, status, teacherResponse })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to update request.' };
    }
    return { success: true, request: data.request };
  } catch (err) {
    console.error('updateTeacherRequestAction error:', err);
    return { success: false, error: 'Network connection failed.' };
  }
}
