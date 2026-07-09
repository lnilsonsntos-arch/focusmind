import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from './Logo';
import {
  Home,
  CheckSquare,
  Calendar,
  Target,
  FileText,
  User,
  Menu,
  X,
  LogOut,
  Crown,
  Sparkles
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/dashboard', label: 'Início', icon: Home },
  { path: '/tasks', label: 'Tarefas', icon: CheckSquare },
  { path: '/habits', label: 'Hábitos', icon: Calendar },
  { path: '/goals', label: 'Metas', icon: Target },
  { path: '/notes', label: 'Notas', icon: FileText },
  { path: '/profile', label: 'Perfil', icon: User },
];

const NovaButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 bg-gradient-to-r from-purple-600 to-blue-900 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
    aria-label="Abrir Nova"
  >
    <Sparkles className="w-6 h-6" />
    <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
      Falar com Nova
    </span>
  </button>
);

export function Layout({ children }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [novaOpen, setNovaOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/50 h-16 px-4 flex items-center justify-between">
        <Logo size="sm" />
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-slate-600 hover:text-slate-900"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 z-50 bg-white border-r border-slate-200/50 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <Logo size="md" />
              <button
                className="md:hidden p-2 text-slate-500 hover:text-slate-700"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-900 to-purple-700 flex items-center justify-center text-white font-semibold">
                {profile?.nome?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">{profile?.nome}</p>
                <div className="flex items-center gap-1">
                  {profile?.plano === 'premium' ? (
                    <span className="text-xs text-purple-600 font-medium flex items-center gap-1">
                      <Crown className="w-3 h-3" /> Premium
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">Plano Gratuito</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-blue-900 to-purple-700 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Sign Out */}
          <div className="p-4 border-t border-slate-100">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-72 pt-16 md:pt-0 min-h-screen">
        <div className="p-4 md:p-8 pb-24">
          {children}
        </div>
      </main>

      {/* Nova Floating Button */}
      <NovaButton onClick={() => setNovaOpen(true)} />

      {/* Nova Chat Modal */}
      {novaOpen && (
        <NovaChat onClose={() => setNovaOpen(false)} profile={profile} />
      )}
    </div>
  );
}

import { Profile } from '../lib/supabase';

interface NovaChatProps {
  onClose: () => void;
  profile: Profile | null;
}

const novaMessages = [
  { role: 'assistant', content: 'Olá! Eu sou a Nova, sua mentora de produtividade. Estou aqui para ajudar você a alcançar seus objetivos! Como posso te ajudar hoje?' }
];

const motivationalMessages = [
  'Cada pequeno passo conta. Continue assim!',
  'A consistência é o segredo do sucesso. Você está no caminho certo!',
  'Lembre-se: progresso, não perfeição.',
  'Você é capaz de conquistar tudo o que sonha!',
  'Celebre cada vitória, por menor que pareça.',
  'O impossível é apenas uma opinião. Vamos provar que você consegue!',
  'Seu potencial é ilimitado. Não se limite!',
  'Grandes jornadas começam com um único passo.',
];

function NovaChat({ onClose, profile }: NovaChatProps) {
  const [messages, setMessages] = useState(novaMessages);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    setTimeout(() => {
      const randomMotivation = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `${randomMotivation}\n\nQue tal definirmos suas prioridades para hoje? Me conte o que você gostaria de alcançar!`
      }]);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md h-[500px] max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-100 bg-gradient-to-r from-blue-900 to-purple-700 text-white">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Nova</h3>
            <p className="text-xs text-white/80">Sua mentora de produtividade</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-blue-900 text-white rounded-br-md'
                    : 'bg-slate-100 text-slate-800 rounded-bl-md'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <button
              onClick={handleSend}
              className="px-4 py-2 bg-gradient-to-r from-blue-900 to-purple-700 text-white rounded-xl font-medium hover:shadow-lg transition-shadow"
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
