import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, Profile, getProfilePhotoUrl } from '../lib/supabase';

// Debug logging - always on for diagnosis
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
  isInitializing: boolean;
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
  const [isInitializing, setIsInitializing] = useState(true);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    log('>>> fetchProfile START for user:', userId);
    try {
      log('>>> fetchProfile: calling supabase.from(profiles).select()...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      log('>>> fetchProfile: supabase query returned', { hasData: !!data, error: error?.message });

      if (error) {
        logError('fetchProfile error:', error);
        return null;
      }

      if (data) {
        log('>>> fetchProfile: found profile, returning...');
        const profileWithPhotoUrl = {
          ...data,
          foto_perfil: getProfilePhotoUrl(data.foto_perfil)
        };
        setProfile(profileWithPhotoUrl);
        log('>>> fetchProfile DONE - profile set');
        return profileWithPhotoUrl;
      }

      log('>>> fetchProfile: no profile found, returning null');
      return null;
    } catch (err) {
      logError('>>> fetchProfile EXCEPTION:', err);
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
        log('>>> initializeAuth START');
        log('>>> calling supabase.auth.getSession()...');
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        log('>>> getSession returned:', { hasSession: !!currentSession, error: error?.message });

        if (error) {
          logError('getSession error:', error);
        }

        if (mounted) {
          if (currentSession && currentSession.user) {
            log('>>> setting session/user from initial session');
            setSession(currentSession);
            setUser(currentSession.user);
            log('>>> fetching profile for existing session...');
            await fetchProfile(currentSession.user.id);
          }
          setLoading(false);
          setIsInitializing(false);
          log('>>> initializeAuth DONE - loading=false, isInitializing=false');
        }
      } catch (error) {
        logError('>>> initializeAuth EXCEPTION:', error);
        if (mounted) {
          setLoading(false);
          setIsInitializing(false);
        }
      }
    };

    initializeAuth();

    log('>>> Setting up onAuthStateChange listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        log('>>> onAuthStateChange EVENT:', event, 'hasSession:', !!newSession);

        if (!mounted) {
          log('>>> onAuthStateChange: component unmounted, skipping');
          return;
        }

        if (event === 'INITIAL_SESSION') {
          log('>>> INITIAL_SESSION event - skipping (handled by initializeAuth)');
          return;
        }

        if (event === 'SIGNED_IN' && newSession?.user) {
          log('>>> SIGNED_IN event - updating state');
          setSession(newSession);
          setUser(newSession.user);
          log('>>> SIGNED_IN: calling fetchProfile...');
          await fetchProfile(newSession.user.id);
          log('>>> SIGNED_IN: fetchProfile done, setting loading=false');
          setLoading(false);
          return;
        }

        if (event === 'SIGNED_OUT') {
          log('>>> SIGNED_OUT event');
          setProfile(null);
          setUser(null);
          setSession(null);
          setLoading(false);
          return;
        }

        if (event === 'TOKEN_REFRESHED') {
          log('>>> TOKEN_REFRESHED event');
          setSession(newSession);
          setUser(newSession?.user ?? null);
          return;
        }

        if (newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);
        }
      }
    );

    return () => {
      log('>>> AuthProvider cleanup');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, nome: string) => {
    log('>>> signUp called:', email);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nome } }
      });

      if (error) {
        logError('>>> signUp error:', error);
        return { error };
      }

      if (data.user && !data.session) {
        log('>>> signUp: email confirmation required');
        return { error: null };
      }

      return { error: null };
    } catch (err) {
      logError('>>> signUp EXCEPTION:', err);
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    log('========================================');
    log('>>> signIn START for:', email);

    try {
      log('>>> (1) Calling supabase.auth.signInWithPassword...');

      // Add timeout wrapper to detect hanging
      const signInPromise = supabase.auth.signInWithPassword({ email, password });
      const timeoutPromise = new Promise<{ error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error('signInWithPassword TIMEOUT after 15s')), 15000)
      );

      const { data, error } = await Promise.race([signInPromise, timeoutPromise])
        .catch(err => ({ data: null, error: err })) as any;

      log('>>> (2) signInWithPassword RETURNED');
      log('>>>     - hasUser:', !!data?.user);
      log('>>>     - hasSession:', !!data?.session);
      log('>>>     - error:', error?.message || 'none');

      if (error) {
        logError('>>> (2a) signInWithPassword ERROR:', error);
        return { error };
      }

      if (!data.session || !data.user) {
        logError('>>> (2b) No session/user in response');
        return { error: new Error('Login falhou - sessao nao criada') };
      }

      log('>>> (3) Setting session and user state...');
      setSession(data.session);
      setUser(data.user);
      log('>>> (3) State updated');

      log('>>> (4) Calling fetchProfile...');
      const profileResult = await fetchProfile(data.user.id);
      log('>>> (4) fetchProfile returned:', profileResult ? 'found' : 'not found');

      if (!profileResult) {
        log('>>> (5) Profile not found, creating new...');
        const nome = data.user.user_metadata?.nome ||
                    data.user.user_metadata?.full_name ||
                    data.user.user_metadata?.name ||
                    data.user.email?.split('@')[0] || 'Usuario';

        const { error: insertError } = await supabase.from('profiles').insert({
          id: data.user.id,
          nome,
          email: data.user.email
        });

        if (insertError) {
          logError('>>> (5) Profile insert error:', insertError);
        } else {
          log('>>> (5) Profile created, fetching...');
          await fetchProfile(data.user.id);
        }
      }

      log('>>> signIn COMPLETE - returning { error: null }');
      log('========================================');
      return { error: null };

    } catch (err) {
      logError('>>> signIn EXCEPTION:', err);
      return { error: err as Error };
    }
  };

  const signInWithGoogle = async () => {
    log('>>> signInWithGoogle called');
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
        logError('>>> signInWithGoogle error:', error);
        return { error };
      }

      return { error: null };
    } catch (err) {
      logError('>>> signInWithGoogle EXCEPTION:', err);
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    log('>>> signOut called');
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setLoading(false);
  };

  const resetPassword = async (email: string) => {
    log('>>> resetPassword called:', email);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      return { error };
    } catch (err) {
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
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

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

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      isInitializing,
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
