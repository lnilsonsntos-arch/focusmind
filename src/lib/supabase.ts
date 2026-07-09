import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

export type Profile = {
  id: string;
  nome: string;
  email: string;
  foto_perfil: string | null;
  plano: 'free' | 'premium';
  data_criacao: string;
};

export type Task = {
  id: string;
  user_id: string;
  titulo: string;
  descricao: string | null;
  prioridade: 'baixa' | 'media' | 'alta';
  status: 'pendente' | 'em_progresso' | 'concluida';
  categoria: 'trabalho' | 'pessoal' | 'saude' | 'financeiro' | 'estudo' | 'lazer' | 'outro';
  data_limite: string | null;
  hora: string | null;
  criado_em: string;
};

export type Habit = {
  id: string;
  user_id: string;
  nome: string;
  frequencia: 'diario' | 'semanal';
  sequencia_atual: number;
  ultima_conclusao: string | null;
  criado_em: string;
};

export type HabitCompletion = {
  id: string;
  habit_id: string;
  user_id: string;
  data: string;
  completado: boolean;
  criado_em: string;
};

export type Goal = {
  id: string;
  user_id: string;
  titulo: string;
  descricao: string | null;
  progresso: number;
  prazo: string | null;
  criado_em: string;
};

export type Note = {
  id: string;
  user_id: string;
  conteudo: string;
  criado_em: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plano: 'free' | 'premium';
  status: 'active' | 'expired' | 'cancelled';
  data_inicio: string;
  data_expiracao: string | null;
};

// Helper to get public URL for profile photo
export const getProfilePhotoUrl = (path: string | null) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${supabaseUrl}/storage/v1/object/public/profiles/${path}`;
};
