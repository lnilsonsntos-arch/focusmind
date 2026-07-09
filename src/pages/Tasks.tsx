import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePremium } from '../contexts/PremiumContext';
import { supabase, Task } from '../lib/supabase';
import { Loading } from '../components/Loading';
import { EmptyState } from '../components/EmptyState';
import {
  Plus,
  Check,
  Trash2,
  Edit3,
  Filter,
  X,
  AlertCircle,
  Calendar,
  Clock,
  ChevronDown,
  Crown,
  CheckCircle2,
  Circle,
  Search,
  SortAsc,
  SortDesc,
  Briefcase,
  User,
  Heart,
  DollarSign,
  BookOpen,
  Gamepad2,
  Tag,
  Sparkles
} from 'lucide-react';

const priorityConfig = {
  baixa: { color: 'bg-green-500', bgLight: 'bg-green-100', textColor: 'text-green-700', label: 'Baixa' },
  media: { color: 'bg-yellow-500', bgLight: 'bg-yellow-100', textColor: 'text-yellow-700', label: 'Media' },
  alta: { color: 'bg-red-500', bgLight: 'bg-red-100', textColor: 'text-red-700', label: 'Alta' }
};

const categoryConfig = {
  trabalho: { icon: Briefcase, color: 'bg-blue-500', bgLight: 'bg-blue-100', textColor: 'text-blue-700', label: 'Trabalho' },
  pessoal: { icon: User, color: 'bg-purple-500', bgLight: 'bg-purple-100', textColor: 'text-purple-700', label: 'Pessoal' },
  saude: { icon: Heart, color: 'bg-red-500', bgLight: 'bg-red-100', textColor: 'text-red-700', label: 'Saude' },
  financeiro: { icon: DollarSign, color: 'bg-green-500', bgLight: 'bg-green-100', textColor: 'text-green-700', label: 'Financeiro' },
  estudo: { icon: BookOpen, color: 'bg-orange-500', bgLight: 'bg-orange-100', textColor: 'text-orange-700', label: 'Estudo' },
  lazer: { icon: Gamepad2, color: 'bg-pink-500', bgLight: 'bg-pink-100', textColor: 'text-pink-700', label: 'Lazer' },
  outro: { icon: Tag, color: 'bg-slate-500', bgLight: 'bg-slate-100', textColor: 'text-slate-700', label: 'Outro' }
};

export function Tasks() {
  const { canAddTask, isPremium, maxTasks } = usePremium();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todas' | 'pendente' | 'em_progresso' | 'concluida'>('todas');
  const [filterPriority, setFilterPriority] = useState<'todas' | 'baixa' | 'media' | 'alta'>('todas');
  const [filterCategory, setFilterCategory] = useState<'todas' | Task['categoria']>('todas');
  const [sortBy, setSortBy] = useState<'data' | 'prioridade' | 'titulo'>('data');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Form state
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState<'baixa' | 'media' | 'alta'>('media');
  const [categoria, setCategoria] = useState<Task['categoria']>('pessoal');
  const [dataLimite, setDataLimite] = useState('');
  const [hora, setHora] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('criado_em', { ascending: false });
    if (data) setTasks(data);
    setLoading(false);
  };

  // Calculate stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => t.data_limite === today);
    const pending = tasks.filter(t => t.status !== 'concluida').length;
    const completed = tasks.filter(t => t.status === 'concluida').length;
    const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Next pending task with deadline
    const nextPending = tasks
      .filter(t => t.status !== 'concluida' && t.data_limite)
      .sort((a, b) => new Date(a.data_limite!).getTime() - new Date(b.data_limite!).getTime())[0];

    return { total, todayTasks, pending, completed, progressPercentage, nextPending };
  }, [tasks]);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let result = tasks.filter(task => {
      // Search filter
      if (searchQuery && !task.titulo.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Status filter
      if (filterStatus !== 'todas' && task.status !== filterStatus) return false;
      // Priority filter
      if (filterPriority !== 'todas' && task.prioridade !== filterPriority) return false;
      // Category filter
      if (filterCategory !== 'todas' && task.categoria !== filterCategory) return false;
      return true;
    });

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'data') {
        const dateA = a.data_limite ? new Date(a.data_limite).getTime() : Infinity;
        const dateB = b.data_limite ? new Date(b.data_limite).getTime() : Infinity;
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      if (sortBy === 'prioridade') {
        const order = { alta: 3, media: 2, baixa: 1 };
        return sortOrder === 'asc'
          ? order[b.prioridade] - order[a.prioridade]
          : order[a.prioridade] - order[b.prioridade];
      }
      if (sortBy === 'titulo') {
        return sortOrder === 'asc'
          ? a.titulo.localeCompare(b.titulo)
          : b.titulo.localeCompare(a.titulo);
      }
      return 0;
    });

    return result;
  }, [tasks, searchQuery, filterStatus, filterPriority, filterCategory, sortBy, sortOrder]);

  const openModal = (task?: Task) => {
    if (task) {
      setEditTask(task);
      setTitulo(task.titulo);
      setDescricao(task.descricao || '');
      setPrioridade(task.prioridade);
      setCategoria(task.categoria);
      setDataLimite(task.data_limite || '');
      setHora(task.hora || '');
    } else {
      setEditTask(null);
      setTitulo('');
      setDescricao('');
      setPrioridade('media');
      setCategoria('pessoal');
      setDataLimite('');
      setHora('');
    }
    setError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditTask(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!titulo.trim()) {
      setError('Titulo e obrigatorio');
      return;
    }

    if (!editTask && !canAddTask(tasks.filter(t => t.status !== 'concluida').length)) {
      setError(`Limite de ${maxTasks === Infinity ? '' : maxTasks} tarefas atingido no plano gratuito`);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editTask) {
        await supabase
          .from('tasks')
          .update({
            titulo,
            descricao: descricao || null,
            prioridade,
            categoria,
            data_limite: dataLimite || null,
            hora: hora || null
          })
          .eq('id', editTask.id);
      } else {
        await supabase.from('tasks').insert({
          titulo,
          descricao: descricao || null,
          prioridade,
          categoria,
          data_limite: dataLimite || null,
          hora: hora || null,
          status: 'pendente'
        });
      }
      await fetchTasks();
      closeModal();
    } catch (err) {
      setError('Erro ao salvar tarefa');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (task: Task, newStatus: 'pendente' | 'em_progresso' | 'concluida') => {
    if (newStatus === 'concluida') {
      setCompletingTaskId(task.id);
      // Add a small delay for animation
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', task.id);

    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    setCompletingTaskId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta tarefa?')) return;
    await supabase.from('tasks').delete().eq('id', id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const formatTime = (time: string | null) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  const isOverdue = (task: Task) => {
    if (task.status === 'concluida' || !task.data_limite) return false;
    const today = new Date().toISOString().split('T')[0];
    return task.data_limite < today;
  };

  if (loading) return <Loading message="Carregando tarefas..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Tarefas</h1>
            <p className="text-slate-600 mt-1">
              {stats.pending} pendentes, {stats.completed} concluidas
            </p>
          </div>
          <button
            onClick={() => openModal()}
            disabled={!canAddTask(tasks.filter(t => t.status !== 'concluida').length)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-900 to-purple-700 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Plus className="w-5 h-5" />
            Nova tarefa
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-600">Progresso geral</span>
            <span className="font-bold text-purple-700">{stats.progressPercentage}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${stats.progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.todayTasks.length}</p>
            <p className="text-xs text-blue-600">Hoje</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-orange-700">{stats.pending}</p>
            <p className="text-xs text-orange-600">Pendentes</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
            <p className="text-xs text-green-600">Concluidas</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-3 text-center">
            <p className="text-xs text-purple-600 font-medium">Proxima tarefa</p>
            <p className="text-sm text-purple-800 mt-1 truncate">
              {stats.nextPending ? stats.nextPending.titulo : 'Nenhuma'}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar tarefas..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showFilters ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>

          {/* Sort controls */}
          <div className="flex items-center gap-1 ml-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-lg text-sm border border-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="data">Data</option>
              <option value="prioridade">Prioridade</option>
              <option value="titulo">Titulo</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Status</label>
              <div className="flex flex-wrap gap-2">
                {(['todas', 'pendente', 'em_progresso', 'concluida'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filterStatus === s
                        ? 'bg-purple-700 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {s === 'todas' ? 'Todas' : s === 'em_progresso' ? 'Em progresso' : s === 'concluida' ? 'Concluidas' : 'Pendentes'}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Prioridade</label>
              <div className="flex flex-wrap gap-2">
                {(['todas', 'baixa', 'media', 'alta'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setFilterPriority(p)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      filterPriority === p
                        ? 'bg-purple-700 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {p !== 'todas' && <div className={`w-2 h-2 rounded-full ${priorityConfig[p].color}`} />}
                    {p === 'todas' ? 'Todas' : priorityConfig[p].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Categoria</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterCategory('todas')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filterCategory === 'todas'
                      ? 'bg-purple-700 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Todas
                </button>
                {(Object.keys(categoryConfig) as Task['categoria'][]).map(c => {
                  const cat = categoryConfig[c];
                  const Icon = cat.icon;
                  return (
                    <button
                      key={c}
                      onClick={() => setFilterCategory(c)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        filterCategory === c
                          ? 'bg-purple-700 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8">
          <EmptyState
            icon={<CheckCircle2 className="w-8 h-8 text-slate-400" />}
            title={tasks.length === 0 ? 'Nenhuma tarefa ainda' : 'Nenhuma tarefa encontrada'}
            description={tasks.length === 0 ? 'Comece adicionando suas tarefas para organizar o dia' : 'Tente ajustar os filtros ou buscar por outro termo'}
            action={
              tasks.length === 0 ? (
                <button
                  onClick={() => openModal()}
                  className="px-4 py-2 bg-gradient-to-r from-blue-900 to-purple-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar tarefa
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => {
            const isCategory = categoryConfig[task.categoria];
            const CategoryIcon = isCategory.icon;
            const isComplete = task.status === 'concluida';
            const isTaskOverdue = isOverdue(task);
            const isCompleting = completingTaskId === task.id;

            return (
              <div
                key={task.id}
                className={`bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-all duration-300 ${
                  isComplete ? 'opacity-60' : ''
                } ${isCompleting ? 'scale-95 opacity-50' : ''} ${
                  isTaskOverdue ? 'border-l-4 border-l-red-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Priority indicator */}
                  <div className={`w-1.5 h-full min-h-[60px] rounded-full ${priorityConfig[task.prioridade].color}`} />

                  {/* Complete button */}
                  <button
                    onClick={() => handleStatusChange(task, isComplete ? 'pendente' : 'concluida')}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 mt-1 ${
                      isComplete
                        ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg scale-110'
                        : 'border-2 border-slate-300 text-slate-300 hover:border-green-400 hover:text-green-400'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className={`font-semibold text-slate-800 ${isComplete ? 'line-through text-slate-500' : ''}`}>
                          {task.titulo}
                        </h3>
                        {task.descricao && (
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{task.descricao}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => openModal(task)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      {/* Category */}
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${isCategory.bgLight} ${isCategory.textColor}`}>
                        <CategoryIcon className="w-3 h-3" />
                        {isCategory.label}
                      </span>

                      {/* Priority */}
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${priorityConfig[task.prioridade].bgLight} ${priorityConfig[task.prioridade].textColor}`}>
                        <div className={`w-2 h-2 rounded-full ${priorityConfig[task.prioridade].color}`} />
                        {priorityConfig[task.prioridade].label}
                      </span>

                      {/* Date and Time */}
                      {task.data_limite && (
                        <span className={`flex items-center gap-1 text-xs ${isTaskOverdue ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(task.data_limite + 'T00:00:00').toLocaleDateString('pt-BR')}
                          {task.hora && (
                            <>
                              <Clock className="w-3.5 h-3.5 ml-1" />
                              {formatTime(task.hora)}
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Status change buttons */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-500">Status:</span>
                      {(['pendente', 'em_progresso', 'concluida'] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(task, s)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                            task.status === s
                              ? s === 'concluida'
                                ? 'bg-green-100 text-green-700'
                                : s === 'em_progresso'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-700'
                              : 'hover:bg-slate-50 text-slate-500'
                          }`}
                        >
                          {s === 'pendente' ? 'Pendente' : s === 'em_progresso' ? 'Em progresso' : 'Concluida'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Premium banner for free users */}
      {!isPremium && stats.pending >= maxTasks - 2 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200 flex items-center gap-4">
          <Crown className="w-8 h-8 text-purple-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-slate-800">Aproximando do limite de tarefas!</p>
            <p className="text-sm text-slate-600">Desbloqueie tarefas ilimitadas com o Premium</p>
          </div>
          <button
            onClick={() => window.location.href = '/premium'}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-700 text-white rounded-lg text-sm font-medium"
          >
            Upgrade
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">
                {editTask ? 'Editar tarefa' : 'Nova tarefa'}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Titulo *
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Revisar documento"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Descricao
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Detalhes adicionais..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Prioridade
                  </label>
                  <div className="space-y-2">
                    {(['baixa', 'media', 'alta'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPrioridade(p)}
                        className={`w-full py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                          prioridade === p
                            ? 'bg-purple-700 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${priorityConfig[p].color}`} />
                        {priorityConfig[p].label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Categoria
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as Task['categoria'])}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  >
                    {(Object.keys(categoryConfig) as Task['categoria'][]).map(c => (
                      <option key={c} value={c}>{categoryConfig[c].label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Data limite
                  </label>
                  <input
                    type="date"
                    value={dataLimite}
                    onChange={(e) => setDataLimite(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Horario
                  </label>
                  <input
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-gradient-to-r from-blue-900 to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin" />
                    Salvando...
                  </>
                ) : editTask ? 'Salvar alteracoes' : 'Criar tarefa'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
