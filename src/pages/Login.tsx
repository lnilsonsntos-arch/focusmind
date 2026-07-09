import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/Logo';
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

// Debug logging
const DEBUG_AUTH = true;
const log = (...args: any[]) => {
  if (DEBUG_AUTH) {
    console.log('[LOGIN]', new Date().toISOString().split('T')[1], ...args);
  }
};

export function Login() {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    log('========================================');
    log('>>> handleSubmit START for:', email);
    log('>>> (1) setError(null), setLoading(true)');

    try {
      log('>>> (2) About to call signIn...');
      const result = await signIn(email, password);
      log('>>> (3) signIn RETURNED to handleSubmit');
      log('>>>     result.error:', result.error?.message || 'null');

      if (result.error) {
        log('>>> (4a) Error path - setting error, setLoading(false)');
        setError(result.error.message === 'Invalid login credentials'
          ? 'Email ou senha incorretos'
          : result.error.message);
        setLoading(false);
        return;
      }

      log('>>> (4b) Success path - setLoading(false), navigate');
      setLoading(false);
      log('>>> (5) Calling navigate(/dashboard)...');
      navigate('/dashboard', { replace: true });
      log('>>> (6) navigate called');
      log('========================================');
    } catch (err) {
      logError('>>> handleSubmit EXCEPTION:', err);
      setError('Erro ao fazer login');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    log('handleGoogleSignIn called');

    const result = await signInWithGoogle();

    if (result.error) {
      setError(result.error.message);
      setGoogleLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Digite seu email para recuperar a senha');
      return;
    }

    setLoading(true);
    const result = await resetPassword(email);
    setLoading(false);

    if (result.error) {
      setError(result.error.message);
    } else {
      setResetSent(true);
    }
  };

  const logError = (...args: any[]) => {
    console.error('[LOGIN ERROR]', new Date().toISOString().split('T')[1], ...args);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Logo size="lg" />
            <h1 className="text-2xl font-bold text-slate-800 mt-6">
              Bem-vindo de volta!
            </h1>
            <p className="text-slate-600 mt-2">
              Entre na sua conta para continuar
            </p>
          </div>

          {!showReset ? (
            <div className="space-y-5">
              {/* Google Sign In */}
              <button
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {googleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continuar com Google
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500">ou</span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowReset(true)}
                    className="text-sm text-purple-700 hover:text-purple-800 font-medium"
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-900 to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-5">
              {resetSent ? (
                <div className="p-6 bg-green-50 border border-green-200 rounded-xl text-center">
                  <p className="text-green-700">
                    Se o email existir em nossa base, voce recebera instrucoes para redefinir sua senha.
                  </p>
                  <button
                    onClick={() => {
                      setShowReset(false);
                      setResetSent(false);
                    }}
                    className="mt-4 text-sm text-purple-700 font-medium hover:text-purple-800"
                  >
                    Voltar ao login
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Recuperar senha</h2>
                    <p className="text-slate-600 mt-1 text-sm">
                      Digite seu email para receber instrucoes
                    </p>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleResetPassword}
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-900 to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar instrucoes'
                    )}
                  </button>

                  <button
                    onClick={() => setShowReset(false)}
                    className="w-full text-center text-sm text-slate-600 hover:text-slate-800"
                  >
                    Voltar ao login
                  </button>
                </>
              )}
            </div>
          )}

          <p className="mt-8 text-center text-slate-600">
            Nao tem uma conta?{' '}
            <Link to="/signup" className="text-purple-700 font-medium hover:text-purple-800">
              Criar conta
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
