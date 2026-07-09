import { useState, useEffect } from 'react';
import { supabase, Goal } from '../lib/supabase';
import { Loading } from '../components/Loading';
import { EmptyState } from '../components/EmptyState';
import {
  Plus,
  Trash2,
  Edit3,
  X,
  AlertCircle,
  Target,
  Calendar,
  Trophy,
  TrendingUp,
  ChevronDown
} from 'lucide-react';

export function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);

  // Form state
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [progresso, setProgresso] = useState(0);
  const [prazo, setPrazo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('goals')
      .select('*')
      .order('progresso', { ascending: true });
    if (data) setGoals(data);
    setLoading(false);
  };

  const openModal = (goal?: Goal) => {
    if (goal) {
      setEditGoal(goal);
      setTitulo(goal.titulo);
      setDescricao(goal.descricao || '');
      setProgresso(goal.progresso);
      setPrazo(goal.prazo || '');
    } else {
      setEditGoal(null);
      setTitulo('');
      setDescricao('');
      setProgresso(0);
      setPrazo('');
    }
    setError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditGoal(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!titulo.trim()) {
      setError('Título é obrigatório');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editGoal) {
        await supabase
          .from('goals')
          .update({
            titulo,
            descricao: descricao || null,
            progresso,
            prazo: prazo || null
          })
          .eq('id', editGoal.id);
      } else {
        await supabase.from('goals').insert({
          titulo,
          descricao: descricao || null,
          progresso: 0,
          prazo: prazo || null
        });
      }
      await fetchGoals();
      closeModal();
    } catch (err) {
      setError('Erro ao salvar meta');
    } finally {
      setSaving(false);
    }
  };

  const handleProgressUpdate = async (id: string, newProgress: number) => {
    const clampedProgress = Math.max(0, Math.min(100, newProgress));
    await supabase
      .from('goals')
      .update({ progresso: clampedProgress })
      .eq('id', id);
    setGoals(prev =>
      prev.map(g => g.id === id ? { ...g, progresso: clampedProgress } : g)
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta meta?')) return;
    await supabase.from('goals').delete().eq('id', id);
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const activeGoals = goals.filter(g => g.progresso < 100);
  const completedGoals = goals.filter(g => g.progresso === 100);

  const getDaysRemaining = (prazo: string | null) => {
    if (!prazo) return null;
    const diff = Math.ceil((new Date(prazo).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) return <Loading message="Carregando metas..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Metas</h1>
          <p className="text-slate-600 mt-1">
            {activeGoals.length} metas em andamento
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-900 to-purple-700 text-white rounded-xl font-medium hover:shadow-lg transition-shadow"
        >
          <Plus className="w-5 h-5" />
          Nova meta
        </button>
      </div>

      {/* Active Goals */}
      {activeGoals.length === 0 && completedGoals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8">
          <EmptyState
            icon={<Target className="w-8 h-8 text-slate-400" />}
            title="Nenhuma meta definida"
            description="Defina suas metas e acompanhe seu progresso até a conquista"
            action={
              <button
                onClick={() => openModal()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium"
              >
                Criar meta
              </button>
            }
          />
        </div>
      ) : (
        <>
          {/* Active */}
          {activeGoals.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                Em andamento
              </h2>
              <div className="space-y-4">
                {activeGoals.map(goal => {
                  const daysRemaining = getDaysRemaining(goal.prazo);
                  const isOverdue = daysRemaining !== null && daysRemaining < 0;
                  const isUrgent = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 7;

                  return (
                    <div
                      key={goal.id}
                      className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-800 text-lg">{goal.titulo}</h3>
                          {goal.descricao && (
                            <p className="text-slate-500 text-sm mt-1">{goal.descricao}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openModal(goal)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(goal.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-slate-600">Progresso</span>
                          <span className="font-bold text-purple-700">{goal.progresso}%</span>
                        </div>
                        <div className="relative">
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-700 to-purple-600 rounded-full transition-all duration-500"
                              style={{ width: `${goal.progresso}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Quick progress updates */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs text-slate-500">Atualizar:</span>
                        {[25, 50, 75, 100].map(val => (
                          <button
                            key={val}
                            onClick={() => handleProgressUpdate(goal.id, val)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                              goal.progresso === val
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {val}%
                          </button>
                        ))}
                      </div>

                      {/* Progress slider */}
                      <input
                        type="range"
                        value={goal.progresso}
                        onChange={(e) => handleProgressUpdate(goal.id, parseInt(e.target.value))}
                        min={0}
                        max={100}
                        step={5}
                        className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600"
                      />

                      {/* Status */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                        {goal.prazo ? (
                          <div className={`flex items-center gap-1.5 text-sm ${
                            isOverdue ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-slate-600'
                          }`}>
                            <Calendar className="w-4 h-4" />
                            {isOverdue
                              ? `${Math.abs(daysRemaining!)} dias atrasado`
                              : daysRemaining === 0
                              ? 'Vence hoje'
                              : `${daysRemaining} dias restantes`}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">Sem prazo</span>
                        )}
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {100 - goal.progresso}% para completar
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Completed */}
          {completedGoals.length > 0 && (
            <section className="space-y-4 mt-8">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Conquistadas ({completedGoals.length})
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {completedGoals.map(goal => (
                  <div
                    key={goal.id}
                    className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <Trophy className="w-6 h-6 text-green-600" />
                      <div>
                        <h4 className="font-medium text-slate-800">{goal.titulo}</h4>
                        <p className="text-xs text-slate-500">100% completado</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">
                {editGoal ? 'Editar meta' : 'Nova meta'}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Título da meta *
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Aprender um novo idioma"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Detalhes sobre esta meta..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>

              {editGoal && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Progresso atual: {progresso}%
                  </label>
                  <input
                    type="range"
                    value={progresso}
                    onChange={(e) => setProgresso(parseInt(e.target.value))}
                    min={0}
                    max={100}
                    className="w-full"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Prazo
                </label>
                <input
                  type="date"
                  value={prazo}
                  onChange={(e) => setPrazo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-gradient-to-r from-blue-900 to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow disabled:opacity-50"
              >
                {saving ? 'Salvando...' : editGoal ? 'Salvar alterações' : 'Criar meta'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
