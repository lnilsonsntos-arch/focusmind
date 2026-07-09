import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePremium } from '../contexts/PremiumContext';
import { supabase, Habit, HabitCompletion } from '../lib/supabase';
import { Loading } from '../components/Loading';
import { EmptyState } from '../components/EmptyState';
import {
  Plus,
  Trash2,
  Edit3,
  X,
  AlertCircle,
  Flame,
  Calendar,
  Check,
  Crown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function Habits() {
  const { canAddHabit, isPremium, maxHabits } = usePremium();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Form state
  const [nome, setNome] = useState('');
  const [frequencia, setFrequencia] = useState<'diario' | 'semanal'>('diario');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    setLoading(true);

    const { data: habitsData } = await supabase
      .from('habits')
      .select('*')
      .order('criado_em', { ascending: false });

    if (habitsData) {
      setHabits(habitsData);

      // Fetch completions for current month + previous month
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data: completionsData } = await supabase
        .from('habit_completions')
        .select('*')
        .gte('data', startDate)
        .lte('data', endDate);

      if (completionsData) setCompletions(completionsData);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (habits.length > 0) {
      fetchCompletions();
    }
  }, [currentMonth]);

  const fetchCompletions = async () => {
    const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data } = await supabase
      .from('habit_completions')
      .select('*')
      .gte('data', startDate)
      .lte('data', endDate);

    if (data) setCompletions(data);
  };

  const isCompletedToday = (habitId: string) => {
    return completions.some(c => c.habit_id === habitId && c.data === today && c.completado);
  };

  const openModal = (habit?: Habit) => {
    if (habit) {
      setEditHabit(habit);
      setNome(habit.nome);
      setFrequencia(habit.frequencia);
    } else {
      setEditHabit(null);
      setNome('');
      setFrequencia('diario');
    }
    setError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditHabit(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (!editHabit && !canAddHabit(habits.length)) {
      setError(`Limite de ${maxHabits === Infinity ? '∞' : maxHabits} hábitos atingido no plano gratuito`);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editHabit) {
        await supabase
          .from('habits')
          .update({ nome, frequencia })
          .eq('id', editHabit.id);
      } else {
        await supabase.from('habits').insert({ nome, frequencia });
      }
      await fetchHabits();
      closeModal();
    } catch (err) {
      setError('Erro ao salvar hábito');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCompletion = async (habitId: string) => {
    const existing = completions.find(c => c.habit_id === habitId && c.data === today);

    if (existing) {
      await supabase
        .from('habit_completions')
        .update({ completado: !existing.completado })
        .eq('id', existing.id);

      setCompletions(prev =>
        prev.map(c => c.id === existing.id ? { ...c, completado: !existing.completado } : c)
      );
    } else {
      await supabase.from('habit_completions').insert({
        habit_id: habitId,
        data: today,
        completado: true
      });

      const { data: newCompletion } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('habit_id', habitId)
        .eq('data', today)
        .maybeSingle();

      if (newCompletion) {
        setCompletions(prev => [...prev, newCompletion]);
      }
    }

    // Update streak
    await updateStreak(habitId);
  };

  const updateStreak = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    // Count consecutive days from today backwards
    let streak = 0;
    let checkDate = new Date();

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const completed = completions.some(
        c => c.habit_id === habitId && c.data === dateStr && c.completado
      );

      if (completed) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    await supabase
      .from('habits')
      .update({
        sequencia_atual: streak,
        ultima_conclusao: streak > 0 ? today : null
      })
      .eq('id', habitId);

    setHabits(prev =>
      prev.map(h =>
        h.id === habitId
          ? { ...h, sequencia_atual: streak, ultima_conclusao: streak > 0 ? today : null }
          : h
      )
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este hábito e todo seu histórico?')) return;

    await supabase.from('habit_completions').delete().eq('habit_id', id);
    await supabase.from('habits').delete().eq('id', id);

    setHabits(prev => prev.filter(h => h.id !== id));
    setCompletions(prev => prev.filter(c => c.habit_id !== id));
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    return { daysInMonth, startDayOfWeek };
  };

  const { daysInMonth, startDayOfWeek } = getDaysInMonth(currentMonth);

  if (loading) return <Loading message="Carregando hábitos..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Hábitos</h1>
          <p className="text-slate-600 mt-1">
            {habits.length} hábitos ativos
            {!isPremium && ` (${maxHabits - habits.length} restantes)`}
          </p>
        </div>
        <button
          onClick={() => openModal()}
          disabled={!canAddHabit(habits.length)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-900 to-purple-700 text-white rounded-xl font-medium hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          Novo hábito
        </button>
      </div>

      {/* Premium banner */}
      {!isPremium && habits.length >= maxHabits && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200 flex items-center gap-3">
          <Crown className="w-8 h-8 text-purple-600" />
          <div className="flex-1">
            <p className="font-medium text-slate-800">Limite de hábitos atingido</p>
            <p className="text-sm text-slate-600">Desbloqueie hábitos ilimitados com o Premium</p>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-700 text-white rounded-lg text-sm font-medium">
            Upgrade
          </button>
        </div>
      )}

      {/* Habits List */}
      {habits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8">
          <EmptyState
            icon={<Flame className="w-8 h-8 text-slate-400" />}
            title="Nenhum hábito ainda"
            description="Comece a construir consistência criando seu primeiro hábito"
            action={
              <button
                onClick={() => openModal()}
                className="px-4 py-2 bg-purple-700 text-white rounded-lg text-sm font-medium"
              >
                Criar hábito
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {habits.map(habit => {
            const completed = isCompletedToday(habit.id);

            return (
              <div
                key={habit.id}
                className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Completion button */}
                    <button
                      onClick={() => handleToggleCompletion(habit.id)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        completed
                          ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg scale-105'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      <Check className="w-6 h-6" />
                    </button>

                    <div>
                      <h3 className="font-semibold text-slate-800">{habit.nome}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Flame className={`w-4 h-4 ${habit.sequencia_atual >= 7 ? 'text-orange-500' : ''}`} />
                          {habit.sequencia_atual} dias
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{habit.frequencia === 'diario' ? 'Diário' : 'Semanal'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openModal(habit)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(habit.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Mini calendar view */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-7 gap-1">
                    {Array(7).fill(0).map((_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() - (6 - i));
                      const dateStr = d.toISOString().split('T')[0];
                      const dayCompleted = completions.some(
                        c => c.habit_id === habit.id && c.data === dateStr && c.completado
                      );
                      const isToday = dateStr === today;

                      return (
                        <div
                          key={i}
                          className={`h-2 rounded-full ${
                            dayCompleted
                              ? 'bg-green-500'
                              : isToday
                              ? 'bg-slate-300'
                              : 'bg-slate-200'
                          }`}
                          title={d.toLocaleDateString('pt-BR')}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Calendar */}
      {habits.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h3 className="font-semibold text-slate-800">
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map(day => (
              <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells before first day */}
            {Array(startDayOfWeek).fill(0).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Days */}
            {Array(daysInMonth).fill(0).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const completedCount = habits.filter(h =>
                completions.some(c => c.habit_id === h.id && c.data === dateStr && c.completado)
              ).length;
              const isToday = dateStr === today;
              const isFullyComplete = completedCount === habits.length;

              return (
                <div
                  key={dayNum}
                  className={`aspect-square rounded-lg flex items-center justify-center text-sm relative ${
                    isToday
                      ? 'bg-blue-100 text-blue-900 font-bold ring-2 ring-blue-300'
                      : isFullyComplete && completedCount > 0
                      ? 'bg-green-100 text-green-800'
                      : completedCount > 0
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {dayNum}
                  {completedCount > 0 && (
                    <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5`}>
                      {Array(Math.min(completedCount, 3)).fill(0).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1 h-1 rounded-full ${isFullyComplete ? 'bg-green-500' : 'bg-purple-500'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">
                {editHabit ? 'Editar hábito' : 'Novo hábito'}
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
                  Nome do hábito *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Ler 30 minutos, Meditar..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Frequência
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFrequencia('diario')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      frequencia === 'diario'
                        ? 'bg-gradient-to-r from-blue-900 to-purple-700 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Diário
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrequencia('semanal')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      frequencia === 'semanal'
                        ? 'bg-gradient-to-r from-blue-900 to-purple-700 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Semanal
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-gradient-to-r from-blue-900 to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow disabled:opacity-50"
              >
                {saving ? 'Salvando...' : editHabit ? 'Salvar alterações' : 'Criar hábito'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
