import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Sparkles, ArrowRight } from 'lucide-react';

export function Onboarding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center max-w-md">
          {/* Animated Logo */}
          <div className="mb-8 animate-fade-in">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-900 to-purple-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/20 mb-6">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <Logo size="lg" />
          </div>

          {/* Tagline */}
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 leading-tight">
            Organize sua mente.<br />
            <span className="bg-gradient-to-r from-blue-900 to-purple-700 bg-clip-text text-transparent">
              Alcance seus objetivos.
            </span>
          </h1>

          <p className="text-slate-600 mb-8">
            FocusMind é seu companheiro de produtividade pessoal.
            Tarefas, hábitos, metas e um mentor de IA para te guiar.
          </p>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/signup')}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-900 to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              Criar conta gratuita
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 px-6 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:border-blue-900 hover:text-blue-900 transition-all duration-300"
            >
              Entrar
            </button>
          </div>
        </div>
      </div>

      {/* Features Preview */}
      <div className="px-6 py-8 bg-white/50 backdrop-blur-sm border-t border-slate-100">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-4 text-center">
          <div className="p-4">
            <div className="text-2xl mb-1">📋</div>
            <p className="text-sm font-medium text-slate-700">Tarefas</p>
          </div>
          <div className="p-4">
            <div className="text-2xl mb-1">🔥</div>
            <p className="text-sm font-medium text-slate-700">Hábitos</p>
          </div>
          <div className="p-4">
            <div className="text-2xl mb-1">🎯</div>
            <p className="text-sm font-medium text-slate-700">Metas</p>
          </div>
          <div className="p-4">
            <div className="text-2xl mb-1">✨</div>
            <p className="text-sm font-medium text-slate-700">Nova (IA)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
