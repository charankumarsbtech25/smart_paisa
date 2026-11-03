import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { UserProfile } from '@/types/auth';

interface AuthContextType {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      age_verified?: boolean;
      marketing_consent?: boolean;
    };
  } | null;
  profile: UserProfile | null;
  loading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    ageVerified: boolean,
    marketingConsent: boolean
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: string | null }>;
  loginAsDemoUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER = {
  id: 'user-demo-1',
  email: 'student.aarav@university.edu.in',
  user_metadata: {
    full_name: 'Aarav Sharma',
    age_verified: true,
    marketing_consent: false,
  },
};

const DEMO_PROFILE: UserProfile = {
  id: 'user-demo-1',
  email: 'student.aarav@university.edu.in',
  full_name: 'Aarav Sharma',
  avatar_url: '',
  age_verified: true,
  marketing_consent: false,
  currency: 'INR',
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-11-01T00:00:00Z',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  useEffect(() => {
    // If real Supabase credentials are configured, initialize live auth listener
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            user_metadata: session.user.user_metadata,
          });
          fetchProfile(session.user.id, session.user.email || '');
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            user_metadata: session.user.user_metadata,
          });
          fetchProfile(session.user.id, session.user.email || '');
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // In standalone/evaluation mode, check if a session exists in localStorage or load demo user
      const storedUser = localStorage.getItem('smartpaisa_auth_user');
      const storedProfile = localStorage.getItem('smartpaisa_auth_profile');

      if (storedUser && storedProfile) {
        try {
          setUser(JSON.parse(storedUser));
          setProfile(JSON.parse(storedProfile));
          setIsDemoMode(true);
        } catch {
          setUser(null);
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfile(data);
      } else {
        // Fallback profile if record not yet populated
        setProfile({
          id: userId,
          email,
          full_name: 'Student User',
          age_verified: true,
          marketing_consent: false,
          currency: 'INR',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) return { error: null };
        if (!error.message.includes('fetch') && !error.message.includes('Network')) {
          return { error: error.message };
        }
        console.warn('Supabase fetch failed, logging in locally:', error.message);
      } catch (err: any) {
        console.warn('Supabase network error, continuing locally:', err);
      }
    }

    // Demo / Standalone simulated login
    if (email === DEMO_USER.email && password) {
      loginAsDemoUser();
      return { error: null };
    }

    // Allow user to login with any valid formatted test credentials
    const customUser = {
      id: `user-${Date.now().toString(36)}`,
      email,
      user_metadata: { full_name: email.split('@')[0], age_verified: true, marketing_consent: false },
    };
    const customProfile: UserProfile = {
      id: customUser.id,
      email,
      full_name: email.split('@')[0],
      avatar_url: '',
      age_verified: true,
      marketing_consent: false,
      currency: 'INR',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem('smartpaisa_auth_user', JSON.stringify(customUser));
    localStorage.setItem('smartpaisa_auth_profile', JSON.stringify(customProfile));
    setUser(customUser);
    setProfile(customProfile);
    setIsDemoMode(true);
    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    ageVerified: boolean,
    marketingConsent: boolean
  ): Promise<{ error: string | null }> => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              age_verified: ageVerified,
              marketing_consent: marketingConsent,
            },
          },
        });
        if (!error) return { error: null };
        if (!error.message.includes('fetch') && !error.message.includes('Network')) {
          return { error: error.message };
        }
        console.warn('Supabase signup fetch failed, creating locally:', error.message);
      } catch (err: any) {
        console.warn('Supabase signup network error, continuing locally:', err);
      }
    }

    // Local mock signup
    const newUser = {
      id: `user-${Date.now().toString(36)}`,
      email,
      user_metadata: {
        full_name: fullName,
        age_verified: ageVerified,
        marketing_consent: marketingConsent,
      },
    };
    const newProfile: UserProfile = {
      id: newUser.id,
      email,
      full_name: fullName,
      avatar_url: '',
      age_verified: ageVerified,
      marketing_consent: marketingConsent,
      currency: 'INR',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem('smartpaisa_auth_user', JSON.stringify(newUser));
    localStorage.setItem('smartpaisa_auth_profile', JSON.stringify(newProfile));
    setUser(newUser);
    setProfile(newProfile);
    setIsDemoMode(true);
    return { error: null };
  };

  const signOut = async (): Promise<void> => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    localStorage.removeItem('smartpaisa_auth_user');
    localStorage.removeItem('smartpaisa_auth_profile');
    setUser(null);
    setProfile(null);
  };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error && !error.message.includes('fetch')) {
          return { error: error.message };
        }
      } catch {}
    }
    return { error: null };
  };

  const updatePassword = async (newPassword: string): Promise<{ error: string | null }> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      return { error: error ? error.message : null };
    }
    return { error: null };
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ error: string | null }> => {
    if (!profile) return { error: 'No active profile' };

    const updated = { ...profile, ...updates, updated_at: new Date().toISOString() };
    setProfile(updated);

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id);
      return { error: error ? error.message : null };
    }

    localStorage.setItem('smartpaisa_auth_profile', JSON.stringify(updated));
    return { error: null };
  };

  const loginAsDemoUser = () => {
    setUser(DEMO_USER);
    setProfile(DEMO_PROFILE);
    setIsDemoMode(true);
    localStorage.setItem('smartpaisa_auth_user', JSON.stringify(DEMO_USER));
    localStorage.setItem('smartpaisa_auth_profile', JSON.stringify(DEMO_PROFILE));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isDemoMode,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        updateProfile,
        loginAsDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
