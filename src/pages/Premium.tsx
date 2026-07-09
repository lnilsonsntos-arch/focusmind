import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  Infinity,
  Sparkles,
  TrendingUp,
  Target,
  Check,
  ArrowLeft,
  Zap,
  Brain
} from 'lucide-react';
import { Logo } from '../components/Logo';

const pricing = {
  monthly: {
    price: 14.90,
    period: 'mês'
  },
  yearly: {
    price: 14.90 * 10 / 12, // 2 months free
    period: 'mês',
    yearlyPrice: 149.00,
    discount: 'Economize 2 meses'
  }
};

const features = [
  {
    free: true,
    premium: true,
    text: 'Até 10 tarefas'
  },
  {
    free: true,
    premium: true,
    text: 'Até 3 hábitos'
  },
  {
    free: false,
    premium: true,
    text: 'Tarefas ilimitadas'
  },
  {
    free: false,
    premium: true,
    text: 'Hábitos ilimitados'
  },
  {
    free: false,
    premium: true,
    text: 'Estatísticas avançadas'
  },
  {
    free: false,
    premium: true,
    text: 'Insights personalizados da Nova'
  },
  {
    free: false,
    premium: true,
    text: 'Backup automático'
  },
  {
    free: false,
    premium: true,
    text: 'Suporte prioritário'
  },
];

export function Premium() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const isPremium = profile?.plano === 'premium';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="p-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 pb-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-700 rounded-2xl mb-6 shadow-xl">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
            {isPremium ? 'Você é Premium!' : 'Desbloqueie o Poder Total'}
          </h1>
          <p className="text-slate-600 text-lg max-w-md mx-auto">
            {isPremium
              ? 'Aproveite todos os recursos exclusivos e alcance seus objetivos mais rápido.'
              : 'Tarefas ilimitadas, insights avançados e muito mais com o Premium.'}
          </p>
        </div>

        {/* Feature Comparison */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left p-6 font-medium text-slate-600">Recursos</th>
                  <th className="p-6 text-center">
                    <div>
                      <p className="font-semibold text-slate-800">Gratuito</p>
                      <p className="text-sm text-slate-500">Para sempre</p>
                    </div>
                  </th>
                  <th className="p-6 text-center bg-gradient-to-br from-purple-50 to-blue-50">
                    <div>
                      <div className="inline-flex items-center gap-1 text-purple-700 font-semibold">
                        <Crown className="w-4 h-4" />
                        Premium
                      </div>
                      <p className="text-sm text-purple-600">Por R$14,90/mês</p>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0">
                    <td className="p-4 text-slate-800">{feature.text}</td>
                    <td className="p-4 text-center">
                      {feature.free ? (
                        <Check className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="p-4 text-center bg-gradient-to-br from-purple-50/50 to-blue-50/50">
                      <Check className="w-5 h-5 text-purple-600 mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Premium Benefits */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Infinity className="w-6 h-6 text-purple-700" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Ilimitado</h3>
                <p className="text-sm text-slate-600 mt-1">Crie quantas tarefas e hábitos quiser, sem restrições.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Nova Premium</h3>
                <p className="text-sm text-slate-600 mt-1">Insights personalizados e sugestões inteligentes da sua mentora.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Análises Avançadas</h3>
                <p className="text-sm text-slate-600 mt-1">Relatórios detalhados sobre sua produtividade e evolução.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-orange-700" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Metas Ilimitadas</h3>
                <p className="text-sm text-slate-600 mt-1">Defina e acompanhe quantos objetivos quiser alcançar.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        {!isPremium ? (
          <div className="bg-gradient-to-r from-purple-700 to-blue-800 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-2">Comece sua jornada Premium</h2>
            <p className="text-white/80 mb-6">Cancele quando quiser, sem compromisso.</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-white text-purple-700 rounded-xl font-semibold hover:bg-slate-100 transition-colors">
                Mensal - R$14,90/mês
              </button>
              <button className="px-8 py-4 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-colors border border-white/30">
                Anual - R$149,00
                <span className="block text-xs text-white/70">(Economize R$29,80)</span>
              </button>
            </div>

            <p className="text-xs text-white/60 mt-6">
              * Pagamento processado de forma segura. Integração Stripe em breve.
            </p>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-8 text-white text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              <Zap className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Parabéns! Você já é Premium</h2>
            <p className="text-white/80">Aproveite todos os recursos exclusivos do FocusMind.</p>
          </div>
        )}

        {/* Nova Message */}
        <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-purple-200">
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-blue-700 flex items-center justify-center shadow-lg">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <p className="font-semibold text-purple-700">Nova diz:</p>
              <p className="text-slate-600 mt-1">
                "O Premium é um investimento em você mesmo. Quando desbloqueia recursos ilimitados, está mostrando que está comprometido com seus objetivos. E isso é metade da batalha!"
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
