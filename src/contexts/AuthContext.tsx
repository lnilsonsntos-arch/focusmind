import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, Profile, getProfilePhotoUrl } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>;
  uploadProfilePhoto: (file: File) => Promise<{ url: string | null; error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch profile from database
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error.message);
      return null;
    }

    if (data) {
      const profileWithPhoto = {
        ...data,
        foto_perfil: getProfilePhotoUrl(data.foto_perfil)
      };
      setProfile(profileWithPhoto);
      return profileWithPhoto;
    }

    return null;
  };

  // Create profile if it doesn't exist
  const createProfile = async (userId: string, email: string, nome: string): Promise<boolean> => {
    const { error } = await supabase.from('profiles').insert({
      id: userId,
      nome,
      email
    });

    if (error) {
      console.error('Error creating profile:', error.message);
      return false;
    }

    return true;
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Get existing session from storage
        const { data: { session: existingSession } } = await supabase.auth.getSession();

        if (mounted && existingSession) {
          setSession(existingSession);
          setUser(existingSession.user);
          await fetchProfile(existingSession.user.id);
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mounted) return;

        // Update session and user
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch profile whenever user changes
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const loadProfile = async () => {
      let existingProfile = await fetchProfile(user.id);

      // Create profile if missing
      if (!existingProfile) {
        const nome = user.user_metadata?.nome ||
                     user.user_metadata?.full_name ||
                     user.user_metadata?.name ||
                     user.email?.split('@')[0] ||
                     'Usuario';

        const created = await createProfile(user.id, user.email || '', nome);
        if (created) {
          await fetchProfile(user.id);
        }
      }
    };

    loadProfile();
  }, [user?.id]);

  const signUp = async (email: string, password: string, nome: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nome }
        }
      });

      if (error) {
        return { error: error.message };
      }

      // User created but needs email confirmation
      if (data.user && !data.session) {
        return { error: null };
      }

      return { error: null };
    } catch (err) {
      return { error: 'Erro inesperado ao criar conta' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          return { error: 'Email ou senha incorretos' };
        }
        return { error: error.message };
      }

      // Session is automatically set by onAuthStateChange
      return { error: null };
    } catch (err) {
      return { error: 'Erro inesperado ao fazer login' };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      return { error: 'Erro ao iniciar login com Google' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      return { error: 'Erro ao enviar email de recuperacao' };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: 'Usuario nao autenticado' };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        return { error: error.message };
      }

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return { error: null };
    } catch (err) {
      return { error: 'Erro ao atualizar perfil' };
    }
  };

  const uploadProfilePhoto = async (file: File) => {
    if (!user) {
      return { url: null, error: 'Usuario nao autenticado' };
    }

    try {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        return { url: null, error: 'Tipo de arquivo nao suportado. Use JPG, PNG, GIF ou WebP.' };
      }

      if (file.size > 2 * 1024 * 1024) {
        return { url: null, error: 'Arquivo muito grande. Maximo 2MB.' };
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Delete existing photos
      const { data: existingFiles } = await supabase.storage
        .from('profiles')
        .list(user.id);

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `${user.id}/${f.name}`);
        await supabase.storage.from('profiles').remove(filesToDelete);
      }

      // Upload new photo
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        return { url: null, error: uploadError.message };
      }

      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);

      await updateProfile({ foto_perfil: urlData.publicUrl });

      return { url: urlData.publicUrl, error: null };
    } catch (err) {
      return { url: null, error: 'Erro ao fazer upload da foto' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      isLoading,
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
