import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  User,
  Mail,
  Camera,
  Crown,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Shield,
  Bell,
  HelpCircle,
  AlertCircle,
  Loader2,
  Upload,
  X,
  Check
} from 'lucide-react';

export function Profile() {
  const navigate = useNavigate();
  const { profile, user, updateProfile, uploadProfilePhoto, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editMode, setEditMode] = useState(false);
  const [nome, setNome] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  // Initialize nome when profile changes
  useEffect(() => {
    if (profile?.nome) {
      setNome(profile.nome);
    }
  }, [profile?.nome]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoUploading(true);
    setError(null);

    const result = await uploadProfilePhoto(file);

    if (result.error) {
      setError(result.error.message);
    }

    setPhotoUploading(false);

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      setError('Nome e obrigatorio');
      return;
    }

    setSaving(true);
    setError(null);

    const result = await updateProfile({ nome });

    if (result.error) {
      setError(result.error.message || 'Erro ao atualizar perfil');
    } else {
      setSuccess(true);
      setEditMode(false);
      setTimeout(() => setSuccess(false), 2000);
    }

    setSaving(false);
  };

  const handleSignOut = async () => {
    if (!confirm('Deseja sair da sua conta?')) return;
    await signOut();
    navigate('/login');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-900 to-purple-700 h-32 relative">
          {/* Cover gradient effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-end -mt-12 gap-4">
            {/* Avatar with upload */}
            <div className="relative group">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploading}
                className="relative cursor-pointer"
              >
                <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                  {profile?.foto_perfil ? (
                    <img
                      src={profile.foto_perfil}
                      alt={profile.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-blue-900">
                      {profile?.nome?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>

                {/* Overlay on hover */}
                <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {photoUploading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </div>
              </button>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>

            <div className="flex-1 pb-2">
              <h1 className="text-xl font-bold text-slate-800">
                {profile?.nome || 'Usuario'}
              </h1>
              <p className="text-slate-500">{profile?.email || user?.email}</p>
            </div>
          </div>

          {/* Photo upload hint */}
          <p className="text-xs text-slate-400 mt-2 text-center sm:text-right">
            Clique na foto para alterar
          </p>
        </div>
      </div>

      {/* Edit Profile */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <User className="w-5 h-5 text-purple-600" />
            Informacoes pessoais
          </h2>
        </div>
        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              Perfil atualizado com sucesso!
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
            {editMode ? (
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            ) : (
              <p className="px-4 py-2.5 bg-slate-50 rounded-xl text-slate-800">{profile?.nome}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <p className="px-4 py-2.5 bg-slate-50 rounded-xl text-slate-600">{profile?.email || user?.email}</p>
            <p className="text-xs text-slate-400 mt-1">Email gerenciado pelo sistema de autenticacao</p>
          </div>

          <div className="flex gap-3 pt-2">
            {editMode ? (
              <>
                <button
                  onClick={() => {
                    setEditMode(false);
                    setNome(profile?.nome || '');
                    setError(null);
                  }}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-900 to-purple-700 text-white rounded-xl font-medium hover:shadow-lg transition-shadow disabled:opacity-50 flex items-center justify-center"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="w-full py-2.5 border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Editar perfil
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Premium Card */}
      <button
        onClick={() => navigate('/premium')}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {profile?.plano === 'premium' ? 'Plano Premium Ativo' : 'Upgrade para Premium'}
              </h3>
              <p className="text-sm text-white/80">
                {profile?.plano === 'premium' ? 'Aproveite todos os recursos exclusivos' : 'Desbloqueie recursos ilimitados'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5" />
        </div>
      </button>

      {/* Settings */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Configuracoes
          </h2>
        </div>

        <div className="divide-y divide-slate-100">
          {/* Dark Mode */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="w-5 h-5 text-slate-600" /> : <Sun className="w-5 h-5 text-yellow-500" />}
              <span className="font-medium text-slate-800">Modo escuro</span>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-11 h-6 rounded-full transition-colors ${darkMode ? 'bg-purple-600' : 'bg-slate-200'} relative`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="font-medium text-slate-800">Notificacoes</span>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`w-11 h-6 rounded-full transition-colors ${notifications ? 'bg-purple-600' : 'bg-slate-200'} relative`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow transition-transform ${notifications ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Help */}
          <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-slate-600" />
              <span className="font-medium text-slate-800">Ajuda e suporte</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 p-4 bg-white border border-slate-100 rounded-2xl text-red-600 font-medium hover:bg-red-50 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        Sair da conta
      </button>

      {/* Version */}
      <p className="text-center text-xs text-slate-400 pb-4">
        FocusMind v1.0.0
      </p>
    </div>
  );
}
