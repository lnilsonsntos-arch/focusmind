import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, Profile, getProfilePhotoUrl } from '../lib/supabase';

// Debug logging
const DEBUG_AUTH = true;
const log = (...args: any[]) => {
  if (DEBUG_AUTH) {
    console.log('[AUTH]', new Date().toISOString().split('T')[1], ...args);
  }
};
const logError = (...args: any[]) => {
  console.error('[AUTH ERROR]', new Date().toISOString().split('T')[1], ...args);
};

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  uploadProfilePhoto: (file: File) => Promise<{ url: string | null; error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    log('fetchProfile called for user:', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        logError('fetchProfile error:', error);
        return null;
      }

      if (data) {
        log('fetchProfile found profile:', data.email);
        const profileWithPhotoUrl = {
          ...data,
          foto_perfil: getProfilePhotoUrl(data.foto_perfil)
        };
        setProfile(profileWithPhotoUrl);
        return profileWithPhotoUrl;
      }

      log('fetchProfile: no profile found');
      return null;
    } catch (err) {
      logError('fetchProfile exception:', err);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;
    log('AuthProvider mounted, initializing...');

    const initializeAuth = async () => {
      try {
        log('Getting initial session...');
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error) {
          logError('getSession error:', error);
        }

        log('Initial session:', currentSession ? 'found' : 'not found');

        if (mounted) {
          if (currentSession) {
            setSession(currentSession);
            setUser(currentSession.user);
            await fetchProfile(currentSession.user.id);
          }
          setLoading(false);
          log('Initialization complete, loading set to false');
        }
      } catch (error) {
        logError('initializeAuth exception:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    log('Setting up onAuthStateChange listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        log('auth state change event:', event, 'session:', newSession ? 'exists' : 'null');

        if (!mounted) {
          log('Component unmounted, skipping');
          return;
        }

        // For SIGNED_IN, we already handle this in signIn() directly
        // So we skip it here to avoid race conditions
        if (event === 'SIGNED_IN') {
          log('SIGNED_IN event - skipping (handled in signIn())');
          // Just update session/user state, don't fetch profile again
          setSession(newSession);
          setUser(newSession?.user ?? null);
          return;
        }

        if (event === 'SIGNED_OUT') {
          log('SIGNED_OUT event');
          setProfile(null);
          setUser(null);
          setSession(null);
          setLoading(false);
          return;
        }

        if (event === 'TOKEN_REFRESHED') {
          log('TOKEN_REFRESHED event');
          setSession(newSession);
          setUser(newSession?.user ?? null);
          return;
        }

        // Handle other events
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }
    );

    return () => {
      log('AuthProvider unmounting, cleaning up...');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, nome: string) => {
    log('signUp called for:', email);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nome }
        }
      });

      log('signUp response:', { data: data ? 'exists' : 'null', error: error?.message });

      if (error) {
        logError('signUp error:', error);
        return { error };
      }

      // Check if user needs to confirm email
      if (data.user && !data.session) {
        log('signUp: user created, email confirmation required');
        return { error: null };
      }

      return { error: null };
    } catch (err) {
      logError('signUp exception:', err);
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    log('signIn called for:', email);

    try {
      log('Calling supabase.auth.signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      log('signInWithPassword response:', {
        user: data.user ? data.user.email : 'null',
        session: data.session ? 'exists' : 'null',
        error: error?.message
      });

      if (error) {
        logError('signInWithPassword error:', error);
        return { error };
      }

      // Update state immediately with the session
      if (data.session && data.user) {
        log('Session received, updating state...');
        setSession(data.session);
        setUser(data.user);

        // Fetch or create profile
        log('Fetching profile for user:', data.user.id);
        let profileFound = await fetchProfile(data.user.id);

        if (!profileFound) {
          log('Profile not found, creating...');
          const nome = data.user.user_metadata?.nome ||
                      data.user.user_metadata?.full_name ||
                      data.user.user_metadata?.name ||
                      data.user.email?.split('@')[0] || 'Usuario';

          log('Creating profile with nome:', nome);

          const { error: insertError } = await supabase.from('profiles').insert({
            id: data.user.id,
            nome,
            email: data.user.email
          });

          if (insertError) {
            logError('Error creating profile:', insertError);
            // Try to fetch again anyway
          } else {
            log('Profile created, fetching...');
            profileFound = await fetchProfile(data.user.id);
          }
        }

        log('signIn complete, profile:', profileFound ? 'found' : 'not found');
        return { error: null };
      } else {
        logError('No session/user in signIn response');
        return { error: new Error('Login falhou - sessao nao criada') };
      }
    } catch (err) {
      logError('signIn exception:', err);
      return { error: err as Error };
    }
  };

  const signInWithGoogle = async () => {
    log('signInWithGoogle called');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        logError('signInWithGoogle error:', error);
        return { error };
      }

      log('signInWithGoogle initiated, redirecting...');
      return { error: null };
    } catch (err) {
      logError('signInWithGoogle exception:', err);
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    log('signOut called');
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setLoading(false);
    log('signOut complete');
  };

  const resetPassword = async (email: string) => {
    log('resetPassword called for:', email);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        logError('resetPassword error:', error);
        return { error };
      }

      log('resetPassword email sent');
      return { error: null };
    } catch (err) {
      logError('resetPassword exception:', err);
      return { error: err as Error };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (!error) {
        setProfile(prev => prev ? { ...prev, ...updates } : null);
      }

      return { error };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const uploadProfilePhoto = async (file: File) => {
    if (!user) return { url: null, error: new Error('No user logged in') };

    try {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        return { url: null, error: new Error('Tipo de arquivo nao suportado') };
      }

      if (file.size > 2 * 1024 * 1024) {
        return { url: null, error: new Error('Arquivo muito grande') };
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { data: existingFiles } = await supabase.storage
        .from('profiles')
        .list(user.id);

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `${user.id}/${f.name}`);
        await supabase.storage.from('profiles').remove(filesToDelete);
      }

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        return { url: null, error: uploadError };
      }

      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      await updateProfile({ foto_perfil: publicUrl });

      return { url: publicUrl, error: null };
    } catch (err) {
      return { url: null, error: err as Error };
    }
  };

  log('Current state:', { user: user?.email, profile: profile?.nome, session: !!session, loading });

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      resetPassword,
      updateProfile,
      uploadProfilePhoto,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
