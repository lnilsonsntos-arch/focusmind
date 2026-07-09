import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, Profile, getProfilePhotoUrl } from '../lib/supabase';

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
  const [initialized, setInitialized] = useState(false);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      const profileWithPhotoUrl = {
        ...data,
        foto_perfil: getProfilePhotoUrl(data.foto_perfil)
      };
      setProfile(profileWithPhotoUrl);
      return profileWithPhotoUrl;
    }
    return null;
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (mounted) {
          if (currentSession) {
            setSession(currentSession);
            setUser(currentSession.user);
            await fetchProfile(currentSession.user.id);
          }
          setLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        if (!mounted) return;

        console.log('Auth state changed:', event);

        // Update session and user
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_IN' && newSession?.user) {
          setLoading(true);

          // Try to fetch profile with retries
          let profileFound = false;
          let retries = 0;

          while (!profileFound && retries < 5 && mounted) {
            const fetchedProfile = await fetchProfile(newSession.user.id);

            if (fetchedProfile) {
              profileFound = true;
            } else {
              // Profile doesn't exist, create it
              const nome = newSession.user.user_metadata?.nome ||
                          newSession.user.user_metadata?.full_name ||
                          newSession.user.user_metadata?.name ||
                          newSession.user.email?.split('@')[0] || 'Usuario';

              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: newSession.user.id,
                  nome,
                  email: newSession.user.email,
                  foto_perfil: newSession.user.user_metadata?.avatar_url || null
                });

              if (!insertError) {
                // Fetch the newly created profile
                await fetchProfile(newSession.user.id);
                profileFound = true;
              }
            }

            if (!profileFound) {
              retries++;
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          }

          if (mounted) {
            setLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED') {
          // Just update session, no need to fetch profile again
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, nome: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nome }
        }
      });

      if (error) return { error };
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) return { error };

      // Immediately update state with the session
      if (data.session && data.user) {
        setSession(data.session);
        setUser(data.user);
        setLoading(true);

        // Fetch profile
        let profileFound = await fetchProfile(data.user.id);

        if (!profileFound) {
          // Create profile if it doesn't exist (edge case)
          const nome = data.user.user_metadata?.nome ||
                      data.user.user_metadata?.full_name ||
                      data.user.email?.split('@')[0] || 'Usuario';

          await supabase.from('profiles').insert({
            id: data.user.id,
            nome,
            email: data.user.email
          });

          await fetchProfile(data.user.id);
        }

        setLoading(false);
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
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
            prompt: 'consent',
          }
        }
      });

      if (error) return { error };
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setLoading(false);
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) return { error };
      return { error: null };
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
        return { url: null, error: new Error('Tipo de arquivo nao suportado. Use JPG, PNG, GIF ou WebP.') };
      }

      if (file.size > 2 * 1024 * 1024) {
        return { url: null, error: new Error('Arquivo muito grande. Maximo 2MB.') };
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
