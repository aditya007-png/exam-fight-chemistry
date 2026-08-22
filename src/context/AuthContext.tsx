import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserProfile, UserRole, SignUpData } from '../types/auth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getStoredUsers, createUser, updateUserName, DEFAULT_ADMIN } from '../lib/userService';
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

  // Load user profile from Supabase DB by user ID
  const fetchProfile = useCallback(async (userId: string, email?: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return {
          id: userId,
          email: email || '',
          full_name: email?.split('@')[0] || 'User',
          role: 'student',
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      return data as UserProfile;
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return null;
    }
  }, []);

  // Initialize Auth State on Mount
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        if (isConfigured) {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) throw error;

          if (session?.user && isMounted) {
            const profile = await fetchProfile(session.user.id, session.user.email);
            setUser(profile);
          }
        } else {
          // Check local stored session
          const savedEmail = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
          const allUsers = getStoredUsers();

          if (savedEmail) {
            const matched = allUsers.find(
              (u) => u.email.toLowerCase() === savedEmail.toLowerCase()
            );
            if (matched && isMounted) {
              setUser(matched);
            }
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

    // Listen to Supabase Auth State Changes if configured
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
      if (!isConfigured) {
        const allUsers = getStoredUsers();
        let matched = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());

        if (!matched) {
          // If admin email
          if (email.toLowerCase().includes('admin')) {
            matched = DEFAULT_ADMIN;
          } else {
            // Determine role and create user
            const role: UserRole = email.includes('teacher') || email.includes('faculty') ? 'teacher' : 'student';
            matched = createUser(email, email.split('@')[0], role);
          }
        }

        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, matched.email);
        setUser(matched);
        setIsLoading(false);
        return { success: true };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: password || '',
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
        const profile = await fetchProfile(data.user.id, data.user.email);
        setUser(profile);
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'An unexpected login error occurred.' };
    }
  };

  // Sign Up (Strictly prevents admin role creation)
  const signUp = async (data: SignUpData): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const safeRole: 'student' | 'teacher' = data.role === 'teacher' ? 'teacher' : 'student';

      // Strictly enforce mandatory teacher verification code
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

      if (!isConfigured) {
        const newUser = createUser(data.email, data.fullName, safeRole);
        if (safeRole === 'teacher' && data.teacherCode) {
          claimTeacherCode(data.teacherCode, data.email, data.fullName);
        }
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, newUser.email);
        setUser(newUser);
        setIsLoading(false);
        return { success: true };
      }

      // Live Supabase signup with user metadata
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

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (authData.user) {
        createUser(data.email, data.fullName, safeRole);
        if (safeRole === 'teacher' && data.teacherCode) {
          claimTeacherCode(data.teacherCode, data.email, data.fullName);
        }
        localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
        const profile = await fetchProfile(authData.user.id, authData.user.email);
        setUser(profile);
      }

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
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Password reset failed.' };
    }
  };

  // Update Profile (Admin, Teacher, Student updating their own name)
  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const { role, ...safeUpdates } = updates;

    if (safeUpdates.full_name) {
      updateUserName(user.id, safeUpdates.full_name);
    }

    if (!isConfigured) {
      setUser({ ...user, ...safeUpdates });
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(safeUpdates)
        .eq('id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      setUser({ ...user, ...safeUpdates });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Profile update failed.' };
    }
  };

  const value: AuthContextType = {
    user,
    role: user?.role || null,
    isLoading,
    isConfigured,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
