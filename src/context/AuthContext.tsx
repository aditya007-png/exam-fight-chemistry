import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserProfile, UserRole, SignUpData } from '../types/auth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DEMO_PROFILES } from '../lib/mockData';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isDemo: boolean;
  isConfigured: boolean;
  signIn: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  demoLogin: (role: UserRole) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_DEMO_KEY = 'exam_fight_demo_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemo, setIsDemo] = useState<boolean>(false);
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
        // Fallback: If trigger was delayed, construct temporary profile
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
      setIsLoading(true);

      // Check if there is an active demo session saved in localStorage
      const savedDemoRole = localStorage.getItem(LOCAL_STORAGE_DEMO_KEY) as UserRole | null;
      if (savedDemoRole && DEMO_PROFILES[savedDemoRole]) {
        if (isMounted) {
          setUser(DEMO_PROFILES[savedDemoRole]);
          setIsDemo(true);
          setIsLoading(false);
        }
        return;
      }

      if (!isConfigured) {
        // Supabase keys are not configured yet, default to idle demo-ready state
        if (isMounted) {
          setUser(null);
          setIsDemo(true);
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          const profile = await fetchProfile(session.user.id, session.user.email);
          setUser(profile);
          setIsDemo(false);
        }
      } catch (err) {
        console.error('Session retrieval error:', err);
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
          setIsDemo(false);
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

  // Demo Login Handler for instant multi-role testing
  const demoLogin = (selectedRole: UserRole) => {
    const demoProfile = DEMO_PROFILES[selectedRole];
    if (demoProfile) {
      localStorage.setItem(LOCAL_STORAGE_DEMO_KEY, selectedRole);
      setUser(demoProfile);
      setIsDemo(true);
    }
  };

  // Sign In
  const signIn = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      // Check if user is logging in with demo credentials or in demo mode
      const matchedDemo = Object.values(DEMO_PROFILES).find(p => p.email.toLowerCase() === email.toLowerCase());
      if (matchedDemo && (!isConfigured || !password)) {
        demoLogin(matchedDemo.role);
        setIsLoading(false);
        return { success: true };
      }

      if (!isConfigured) {
        // If not configured and unknown email, match role heuristically or default to student
        const role: UserRole = email.includes('teacher') ? 'teacher' : email.includes('admin') ? 'admin' : 'student';
        demoLogin(role);
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
        localStorage.removeItem(LOCAL_STORAGE_DEMO_KEY);
        const profile = await fetchProfile(data.user.id, data.user.email);
        setUser(profile);
        setIsDemo(false);
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
      // SECURITY ENFORCEMENT: Never allow admin role via public signup
      const safeRole: 'student' | 'teacher' = data.role === 'teacher' ? 'teacher' : 'student';

      if (!isConfigured) {
        // Demo mode simulated registration
        const newDemoProfile: UserProfile = {
          id: `demo-${safeRole}-${Date.now()}`,
          email: data.email,
          full_name: data.fullName,
          role: safeRole,
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem(LOCAL_STORAGE_DEMO_KEY, safeRole);
        setUser(newDemoProfile);
        setIsDemo(true);
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
            role: safeRole, // Trigger will sanitize this on server-side
            teacher_code: data.teacherCode || null,
          },
        },
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (authData.user) {
        localStorage.removeItem(LOCAL_STORAGE_DEMO_KEY);
        const profile = await fetchProfile(authData.user.id, authData.user.email);
        setUser(profile);
        setIsDemo(false);
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
      localStorage.removeItem(LOCAL_STORAGE_DEMO_KEY);
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

  // Update Profile
  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    // Prevent changing role via client update
    const { role, ...safeUpdates } = updates;

    if (isDemo || !isConfigured) {
      setUser({ ...user, ...safeUpdates });
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(safeUpdates)
        .eq('id', user.id);

      if (error) return { success: false, error: error.message };
      setUser({ ...user, ...safeUpdates });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoading,
        isDemo,
        isConfigured,
        signIn,
        signUp,
        signOut,
        resetPassword,
        demoLogin,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
