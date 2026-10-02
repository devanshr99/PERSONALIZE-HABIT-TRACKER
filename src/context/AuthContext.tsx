/**
 * AuthContext — handles all authentication state and actions.
 * Wraps the entire app. Uses Supabase Auth under the hood.
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode
} from 'react';
import { supabase } from '../services/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;

  signUp: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updateProfile: (updates: { name?: string; avatarUrl?: string }) => Promise<{ error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
  deleteAccount: () => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * For Google (or any OAuth) users, ensure a profile row exists.
   * The DB trigger handles email/password signups, but OAuth users
   * returning from a redirect may need their profile row created/updated.
   */
  const ensureProfileExists = useCallback(async (authUser: User) => {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .eq('id', authUser.id)
      .maybeSingle();

    const meta = authUser.user_metadata ?? {};
    const googleName = meta.full_name || meta.name || '';
    const googleAvatar = meta.avatar_url || meta.picture || '';

    if (!existing) {
      // Profile row doesn't exist yet — create it
      await supabase.from('profiles').insert({
        id: authUser.id,
        name: googleName,
        avatar_url: googleAvatar || null,
      });
    } else if (!existing.name && googleName) {
      // Profile exists but name is empty — update with Google info
      await supabase.from('profiles').update({
        name: googleName,
        avatar_url: existing.avatar_url || googleAvatar || null,
        updated_at: new Date().toISOString(),
      }).eq('id', authUser.id);
    }
  }, []);

  // Build a UserProfile from a Supabase user + profile row
  const buildProfile = useCallback(async (authUser: User): Promise<UserProfile> => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('id', authUser.id)
      .single();

    const meta = authUser.user_metadata ?? {};
    const googleName = meta.full_name || meta.name || '';
    const googleAvatar = meta.avatar_url || meta.picture || '';

    return {
      id: authUser.id,
      email: authUser.email ?? '',
      name: profile?.name || googleName || '',
      avatarUrl: profile?.avatar_url || googleAvatar || undefined,
    };
  }, []);

  // Initialize: check existing session
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();

        if (existingSession?.user && mounted) {
          setSession(existingSession);
          const profile = await buildProfile(existingSession.user);
          if (mounted) setUser(profile);
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        setSession(newSession);

        if (newSession?.user) {
          // For OAuth sign-ins, ensure the profile row exists
          if (event === 'SIGNED_IN') {
            try {
              await ensureProfileExists(newSession.user);
            } catch (err) {
              console.warn('Could not ensure profile for OAuth user:', err);
            }
          }

          const profile = await buildProfile(newSession.user);
          if (mounted) setUser(profile);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [buildProfile, ensureProfileExists]);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      return { error: friendlyAuthError(error.message) };
    }

    // If email confirmation is disabled, user is immediately available.
    // The session JWT is set asynchronously via onAuthStateChange.
    // Habit seeding is handled by AppContext once the session is fully active.
    if (data.user) {
      // Update the profile name (the trigger already created a row, so this update
      // will work once the auth listener fires — but it also works inline because
      // signUp returns a session that the client picks up)
      await supabase
        .from('profiles')
        .update({ name })
        .eq('id', data.user.id);

      const profile = await buildProfile(data.user);
      setUser(profile);
    }

    return {};
  }, [buildProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: friendlyAuthError(error.message) };
    }

    return {};
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const redirectTo = `${window.location.origin}/`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) {
      return { error: friendlyAuthError(error.message) };
    }

    return {};
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    // Clear any user-specific cached data
    localStorage.removeItem('streakly-install-dismissed');
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });

    if (error) {
      return { error: friendlyAuthError(error.message) };
    }

    return {};
  }, []);

  const updateProfile = useCallback(async (updates: { name?: string; avatarUrl?: string }) => {
    if (!user) return { error: 'Not authenticated' };

    const profileUpdate: Record<string, string> = {};
    if (updates.name !== undefined) profileUpdate.name = updates.name;
    if (updates.avatarUrl !== undefined) profileUpdate.avatar_url = updates.avatarUrl;

    const { error } = await supabase
      .from('profiles')
      .update({ ...profileUpdate, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      return { error: 'Failed to update profile. Please try again.' };
    }

    // Update local state
    setUser(prev => prev ? {
      ...prev,
      name: updates.name ?? prev.name,
      avatarUrl: updates.avatarUrl ?? prev.avatarUrl,
    } : null);

    return {};
  }, [user]);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { error: friendlyAuthError(error.message) };
    }
    return {};
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!user) return { error: 'Not authenticated' };

    try {
      // Delete all user data (cascading deletes handle habits/completions)
      await supabase.from('user_settings').delete().eq('user_id', user.id);
      await supabase.from('habit_completions').delete().eq('user_id', user.id);
      await supabase.from('habits').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);

      // Sign out
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);

      return {};
    } catch {
      return { error: 'Failed to delete account. Please try again.' };
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
        updateProfile,
        updatePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** Map Supabase error messages to user-friendly strings */
function friendlyAuthError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
    return 'Email or password is incorrect.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Please check your email and confirm your account.';
  }
  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return 'An account with this email already exists. Try logging in.';
  }
  if (lower.includes('password') && lower.includes('at least')) {
    return 'Password must be at least 6 characters.';
  }
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }
  if (lower.includes('oauth') || lower.includes('provider')) {
    return "Google sign-in couldn't be completed. Please try again.";
  }
  return msg;
}
