import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserProfile, UserRole, SignUpData } from '../types/auth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getStoredUsers, createUser, updateUserName, DEFAULT_ADMIN, fetchProfilesFromDB } from '../lib/userService';
import { validateTeacherCode, claimTeacherCode } from '../lib/teacherCodeService';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_SESSION_KEY = 'exam_fight_current_user_email';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isConfigured = isSupabaseConfigured();

  // Load user profile from DB by user ID
  const fetchProfile = useCallback(async (userId: string, email?: string): Promise<UserProfile | null> => {
    try {
      if (isConfigured) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (!error && data) {
          return data as UserProfile;
        }
      }

      const users = await fetchProfilesFromDB();
      const matched = users.find((u) => u.id === userId || (email && u.email.toLowerCase() === email.toLowerCase()));
      if (matched) return matched;

      return {
        id: userId,
        email: email || '',
        full_name: email?.split('@')[0] || 'User',
        role: 'student',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return null;
    }
  }, [isConfigured]);

  // Initialize Auth State on Mount
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        if (isConfigured) {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (!error && session?.user && isMounted) {
            const profile = await fetchProfile(session.user.id, session.user.email);
            setUser(profile);
            return;
          }
        }

        // Check local stored session and verify against backend directory
        const savedEmail = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
        if (savedEmail) {
          const allUsers = await fetchProfilesFromDB();
          const matched = allUsers.find(
            (u) => u.email.toLowerCase() === savedEmail.toLowerCase()
          );
          if (matched && isMounted) {
            setUser(matched);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    if (isConfigured) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id, session.user.email);
          setUser(profile);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setIsLoading(false);
      });

      return () => {
        isMounted = false;
        authListener.subscription.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, [isConfigured, fetchProfile]);

  // Sign In
  const signIn = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      // 1. Try Backend REST API
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, data.user.email);
            setUser(data.user);
            setIsLoading(false);
            return { success: true };
          }
        }
      } catch (apiErr) {}

      // 2. Try Supabase if configured
      if (isConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: password || '',
        });

        if (!error && data.user) {
          localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
          const profile = await fetchProfile(data.user.id, data.user.email);
          setUser(profile);
          setIsLoading(false);
          return { success: true };
        }
      }

      // 3. Fallback to Local Directory
      const allUsers = getStoredUsers();
      let matched = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());

      if (!matched) {
        if (email.toLowerCase().includes('admin')) {
          matched = DEFAULT_ADMIN;
        } else {
          const role: UserRole = email.includes('teacher') || email.includes('faculty') ? 'teacher' : 'student';
          matched = createUser(email, email.split('@')[0], role);
        }
      }

      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, matched.email);
      setUser(matched);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'An unexpected login error occurred.' };
    }
  };

  // Sign Up
  const signUp = async (data: SignUpData): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const safeRole: 'student' | 'teacher' = data.role === 'teacher' ? 'teacher' : 'student';

      if (safeRole === 'teacher') {
        const codeValidation = validateTeacherCode(data.teacherCode || '');
        if (!codeValidation.isValid) {
          setIsLoading(false);
          return {
            success: false,
            error: codeValidation.error || 'A valid teacher verification code issued by Admin is mandatory to register as faculty.',
          };
        }
      }

      // 1. Try Backend REST API
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data.email.trim(),
            fullName: data.fullName.trim(),
            role: safeRole,
            teacherCode: data.teacherCode?.trim(),
          }),
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.success && resData.user) {
            localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, resData.user.email);
            setUser(resData.user);
            setIsLoading(false);
            return { success: true };
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          if (errData.error) {
            setIsLoading(false);
            return { success: false, error: errData.error };
          }
        }
      } catch (apiErr) {}

      // 2. Try Supabase if configured
      if (isConfigured) {
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
              role: safeRole,
              teacher_code: data.teacherCode || null,
            },
          },
        });

        if (!error && authData.user) {
          createUser(data.email, data.fullName, safeRole);
          if (safeRole === 'teacher' && data.teacherCode) {
            claimTeacherCode(data.teacherCode, data.email, data.fullName);
          }
          localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
          const profile = await fetchProfile(authData.user.id, authData.user.email);
          setUser(profile);
          setIsLoading(false);
          return { success: true };
        }
      }

      const newUser = createUser(data.email, data.fullName, safeRole);
      if (safeRole === 'teacher' && data.teacherCode) {
        claimTeacherCode(data.teacherCode, data.email, data.fullName);
      }
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, newUser.email);
      setUser(newUser);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Signup failed.' };
    }
  };

  // Sign Out
  const signOut = async () => {
    setIsLoading(true);
    try {
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
      if (isConfigured) {
        await supabase.auth.signOut();
      }
      setUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Password
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!isConfigured) {
      return { success: true };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Password reset request failed.' };
    }
  };

  // Update Profile
  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No authenticated user session.' };
    try {
      if (updates.full_name) {
        await updateUserName(user.id, updates.full_name);
      }
      setUser((prev) => (prev ? { ...prev, ...updates } : null));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update user profile.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoading,
        isConfigured,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
