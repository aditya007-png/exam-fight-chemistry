// src/lib/userService.ts
// Centralized persistent user management service for Admin and Teachers
import { UserProfile, UserRole } from '../types/auth';

const STORAGE_KEY = 'exam_fight_user_directory_v2';

export const DEFAULT_ADMIN: UserProfile = {
  id: 'admin-001',
  email: 'admin@examfight.chem',
  full_name: 'Administrator',
  role: 'admin',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: new Date().toISOString(),
};

// Retrieve all users from storage (or initialize with clean Admin)
export const getStoredUsers = (): UserProfile[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initialUsers = [DEFAULT_ADMIN];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialUsers));
      return initialUsers;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initialUsers = [DEFAULT_ADMIN];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialUsers));
      return initialUsers;
    }
    return parsed;
  } catch (err) {
    console.error('Error loading users from storage:', err);
    return [DEFAULT_ADMIN];
  }
};

// Save users to storage
export const saveStoredUsers = (users: UserProfile[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Error saving users to storage:', err);
  }
};

// Update name of any user (by Admin, Teacher, or self)
export const updateUserName = (userId: string, newName: string): UserProfile | null => {
  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  const updated: UserProfile = {
    ...users[index],
    full_name: newName.trim(),
    updated_at: new Date().toISOString(),
  };

  users[index] = updated;
  saveStoredUsers(users);
  return updated;
};

// Delete a user (Admin capability)
export const deleteUser = (userId: string): boolean => {
  const users = getStoredUsers();
  const filtered = users.filter((u) => u.id !== userId);
  if (filtered.length === users.length) return false;
  saveStoredUsers(filtered);
  return true;
};

// Create a new user (by Admin, Signup, or Teacher)
export const createUser = (
  email: string,
  full_name: string,
  role: UserRole
): UserProfile => {
  const users = getStoredUsers();
  
  // Check if user already exists
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return existing;
  }

  const newUser: UserProfile = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    email: email.trim().toLowerCase(),
    full_name: full_name.trim(),
    role,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  users.push(newUser);
  saveStoredUsers(users);
  return newUser;
};

// Get students only
export const getStudents = (): UserProfile[] => {
  return getStoredUsers().filter((u) => u.role === 'student');
};

// Get teachers only
export const getTeachers = (): UserProfile[] => {
  return getStoredUsers().filter((u) => u.role === 'teacher');
};
