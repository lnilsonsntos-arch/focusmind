import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePremium } from '../contexts/PremiumContext';
import { supabase, Task, Habit, Goal } from '../lib/supabase';
import { Loading } from '../components/Loading';
import { EmptyState } from '../components/EmptyState';
import {
  CheckSquare,
  Calendar,
  Target,
  TrendingUp,
  Sparkles,
  Plus,
  ChevronRight,
  Flame,
  Clock,
  Award,
  Crown,
  CheckCircle2,
  Circle,
  Play,
  AlertCircle
} from 'lucide-react';

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

const novaTips = [
  'Concentre-se nas tarefas importantes primeiro!',
  'Facas pausas curtas a cada 45 minutos.',
  'Celebre cada pequena vitoria!',
  'Lembre-se: progresso, nao perfeicao.',
  'Seus habitos constroem seu futuro.',
  'Um passo de cada vez leva a grandes conquistas.',
];

const categoryConfig: Record<string, { color: string; bg: string }> = {
  trabalho: { color: 'text-blue-700', bg: 'bg-blue-100' },
  pessoal: { color: 'text-purple-700', bg: 'bg-purple-100' },
  saude: { color: 'text-red-700', bg: 'bg-red-100' },
  financeiro: { color: 'text-green-700', bg: 'bg-green-100' },
  estudo: { color: 'text-orange-700', bg: 'bg-orange-100' },
  lazer: { color: 'text-pink-700', bg: 'bg-pink-100' },
  outro: { color: 'text-slate-700', bg: 'bg-slate-100' },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  alta: { color: 'bg-red-500', label: 'Alta' },
  media: { color: 'bg-yellow-500', label: 'Media' },
  baixa: { color: 'bg-green-500', label: 'Baixa' },
};

export function Dashboard() {
  const { profile } = useAuth();
  const { isPremium } = usePremium();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [novaTip] = useState(() => novaTips[Math.floor(Math.random() * novaTips.length)]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    const today = new Date().toISOString().split('T')[0];

    const [tasksRes, habitsRes, goalsRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('*')
        .neq('status', 'concluida')
        .order('data_limite', { nullsFirst: false })
        .limit(10),
      supabase.from('habits').select('*').limit(5),
      supabase.from('goals').select('*').order('prazo', { nullsFirst: false }).limit(5),
    ]);

    if (tasksRes.data) setTasks(tasksRes.data);
    if (habitsRes.data) setHabits(habitsRes.data);
    if (goalsRes.data) setGoals(goalsRes.data);

    setLoading(false);
  };

  const today = new Date().toISOString().split('T')[0];

  // Calculate task stats
  const taskStats = {
    today: tasks.filter(t => t.data_limite === today).length,
    pending: tasks.filter(t => t.status === 'pendente').length,
    inProgress: tasks.filter(t => t.status === 'em_progresso').length,
    nextTask: tasks
      .filter(t => t.status !== 'concluida' && t.data_limite)
      .sort((a, b) => new Date(a.data_limite!).getTime() - new Date(b.data_limite!).getTime())[0],
    overdue: tasks.filter(t => t.data_limite && t.data_limite < today && t.status !== 'concluida').length,
  };

  const habitStats = {
    bestStreak: habits.reduce((acc, h) => Math.max(acc, h.sequencia_atual), 0),
    total: habits.length,
  };

  const goalStats = {
    inProgress: goals.filter(g => g.progresso < 100).length,
    completed: goals.filter(g => g.progresso === 100).length,
  };

  if (loading) return <Loading message="Carregando seu painel..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Greeting Header */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              {greeting()}, {profile?.nome?.split(' ')[0]}!
            </h1>
            <p className="text-white/80">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
          {!isPremium && (
            <button
              onClick={() => navigate('/premium')}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl text-sm font-medium hover:bg-white/30 transition-colors"
            >
              <Crown className="w-4 h-4" />
              <span className="hidden md:inline">Premium</span>
            </button>
          )}
        </div>

        {/* Nova's tip */}
        <div className="mt-4 p-4 bg-white/10 rounded-xl flex items-start gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium">Nova diz:</p>
            <p className="text-sm text-white/90">{novaTip}</p>
          </div>
        </div>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/tasks')}
          className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5 text-blue-700" />
            </div>
            <span className="text-2xl font-bold text-slate-800">{taskStats.today}</span>
          </div>
          <p className="text-sm text-slate-600">Tarefas hoje</p>
        </div>

        <div
          onClick={() => navigate('/tasks')}
          className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Circle className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-2xl font-bold text-slate-800">{taskStats.pending}</span>
          </div>
          <p className="text-sm text-slate-600">Pendentes</p>
        </div>

        <div
          onClick={() => navigate('/tasks')}
          className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 text-purple-700" />
            </div>
            <span className="text-2xl font-bold text-slate-800">{taskStats.inProgress}</span>
          </div>
          <p className="text-sm text-slate-600">Em progresso</p>
        </div>

        <div
          onClick={() => navigate('/habits')}
          className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Flame className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-2xl font-bold text-slate-800">{habitStats.bestStreak}</span>
          </div>
          <p className="text-sm text-slate-600">Maior sequencia</p>
        </div>
      </div>

      {/* Next Task Card */}
      {taskStats.nextTask && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-700 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-white/80" />
            <span className="text-sm font-medium text-white/90">Proxima tarefa</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{taskStats.nextTask.titulo}</h3>
              <div className="flex items-center gap-3 mt-1 text-sm text-white/80">
                {taskStats.nextTask.data_limite && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(taskStats.nextTask.data_limite + 'T00:00:00').toLocaleDateString('pt-BR')}
                    {taskStats.nextTask.hora && ` as ${taskStats.nextTask.hora}`}
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-xs ${categoryConfig[taskStats.nextTask.categoria]?.bg || 'bg-white/20'}`}>
                  {taskStats.nextTask.categoria}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate('/tasks')}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Overdue Alert */}
      {taskStats.overdue > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-red-800">{taskStats.overdue} tarefa{taskStats.overdue > 1 ? 's' : ''} atrasada{taskStats.overdue > 1 ? 's' : ''}</p>
            <p className="text-sm text-red-600">Revise suas tarefas e redefina os prazos</p>
          </div>
          <button
            onClick={() => navigate('/tasks')}
            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Ver tarefas
          </button>
        </div>
      )}

      {/* Tasks Section */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-700" />
            Tarefas de Hoje
          </h2>
          <button
            onClick={() => navigate('/tasks')}
            className="text-sm text-purple-700 font-medium flex items-center gap-1 hover:text-purple-800 transition-colors"
          >
            Ver todas <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {tasks.length === 0 ? (
            <EmptyState
              icon={<CheckSquare className="w-6 h-6 text-slate-400" />}
              title="Nenhuma tarefa pendente"
              description="Voce esta em dia! Adicione novas tarefas para organizar seu dia."
              action={
                <button
                  onClick={() => navigate('/tasks')}
                  className="px-4 py-2 bg-gradient-to-r from-blue-900 to-purple-700 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar tarefa
                </button>
              }
            />
          ) : (
            tasks.slice(0, 5).map((task, index) => (
              <div
                key={task.id}
                onClick={() => navigate('/tasks')}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all cursor-pointer group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  task.status === 'em_progresso' ? 'bg-purple-200' : 'bg-slate-200'
                }`}>
                  {task.status === 'em_progresso' ? (
                    <Play className="w-4 h-4 text-purple-700" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-slate-800 group-hover:text-purple-700 transition-colors block truncate">
                    {task.titulo}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {task.data_limite && (
                      <span className="text-xs text-slate-500">
                        {new Date(task.data_limite + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${categoryConfig[task.categoria]?.bg || 'bg-slate-100'} ${categoryConfig[task.categoria]?.color || 'text-slate-600'}`}>
                      {task.categoria}
                    </span>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${priorityConfig[task.prioridade]?.color || 'bg-slate-300'} opacity-60`} />
              </div>
            ))
          )}
        </div>
      </section>

      {/* Habits & Goals Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Habits Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-700" />
              Habitos
            </h2>
            <button
              onClick={() => navigate('/habits')}
              className="text-sm text-purple-700 font-medium flex items-center gap-1 hover:text-purple-800"
            >
              Ver <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {habits.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-slate-500 text-sm">Nenhum habito ainda</p>
                <button
                  onClick={() => navigate('/habits')}
                  className="mt-2 text-sm text-purple-700 font-medium"
                >
                  Criar habito
                </button>
              </div>
            ) : (
              habits.slice(0, 4).map((habit) => (
                <div
                  key={habit.id}
                  onClick={() => navigate('/habits')}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {habit.sequencia_atual}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-slate-800 block truncate">{habit.nome}</span>
                    <p className="text-xs text-slate-500">
                      {habit.sequencia_atual} dias de sequencia
                    </p>
                  </div>
                  {habit.sequencia_atual >= 7 && (
                    <Flame className="w-5 h-5 text-orange-500" />
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Goals Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Metas
            </h2>
            <button
              onClick={() => navigate('/goals')}
              className="text-sm text-purple-700 font-medium flex items-center gap-1 hover:text-purple-800"
            >
              Ver <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {goals.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-slate-500 text-sm">Nenhuma meta definida</p>
                <button
                  onClick={() => navigate('/goals')}
                  className="mt-2 text-sm text-purple-700 font-medium"
                >
                  Criar meta
                </button>
              </div>
            ) : (
              goals.slice(0, 3).map((goal) => (
                <div
                  key={goal.id}
                  onClick={() => navigate('/goals')}
                  className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-800 text-sm truncate flex-1">{goal.titulo}</span>
                    <span className="text-sm font-bold text-purple-700 ml-2">{goal.progresso}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-700 to-purple-600 rounded-full transition-all duration-500"
                      style={{ width: `${goal.progresso}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Quick Stats */}
      <div className="bg-gradient-to-r from-slate-100 to-purple-50 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-700">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          <span className="font-medium">Estatisticas da semana</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-xl font-bold text-slate-800">{taskStats.pending + taskStats.inProgress}</p>
            <p className="text-xs text-slate-500">Ativas</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-green-600">{goalStats.completed}</p>
            <p className="text-xs text-slate-500">Metas</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-purple-700">{habitStats.total}</p>
            <p className="text-xs text-slate-500">Habitos</p>
          </div>
        </div>
      </div>
    </div>
  );
}
