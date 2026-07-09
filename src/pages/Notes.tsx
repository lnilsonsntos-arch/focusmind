import { useState, useEffect } from 'react';
import { supabase, Note } from '../lib/supabase';
import { Loading } from '../components/Loading';
import { EmptyState } from '../components/EmptyState';
import {
  Plus,
  Trash2,
  Edit3,
  X,
  AlertCircle,
  FileText,
  Search,
  Clock
} from 'lucide-react';
import { format, isToday, isYesterday, isThisWeek, parseISO } from 'date-fns';

export function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [conteudo, setConteudo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('notes')
      .select('*')
      .order('criado_em', { ascending: false });
    if (data) setNotes(data);
    setLoading(false);
  };

  const filteredNotes = notes.filter(note =>
    note.conteudo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openModal = (note?: Note) => {
    if (note) {
      setEditNote(note);
      setConteudo(note.conteudo);
    } else {
      setEditNote(null);
      setConteudo('');
    }
    setError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditNote(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!conteudo.trim()) {
      setError('Conteúdo é obrigatório');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editNote) {
        await supabase
          .from('notes')
          .update({ conteudo })
          .eq('id', editNote.id);
      } else {
        await supabase.from('notes').insert({ conteudo });
      }
      await fetchNotes();
      closeModal();
    } catch (err) {
      setError('Erro ao salvar nota');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta nota?')) return;
    await supabase.from('notes').delete().eq('id', id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    if (isThisWeek(date)) return format(date, "EEEE");
    return format(date, "d 'de' MMMM");
  };

  const getPreview = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, text.lastIndexOf(' ', maxLength)) + '...';
  };

  if (loading) return <Loading message="Carregando notas..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notas</h1>
          <p className="text-slate-600 mt-1">{notes.length} anotações</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-900 to-purple-700 text-white rounded-xl font-medium hover:shadow-lg transition-shadow"
        >
          <Plus className="w-5 h-5" />
          Nova nota
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar nas notas..."
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8">
          <EmptyState
            icon={<FileText className="w-8 h-8 text-slate-400" />}
            title={notes.length === 0 ? 'Nenhuma nota' : 'Nenhuma nota encontrada'}
            description={notes.length === 0 ? 'Escreva suas ideias, anotações e pensamentos' : 'Tente outra busca'}
            action={
              notes.length === 0 ? (
                <button
                  onClick={() => openModal()}
                  className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium"
                >
                  Criar nota
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredNotes.map(note => (
            <div
              key={note.id}
              onClick={() => openModal(note)}
              className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-slate-800 flex-1 whitespace-pre-wrap">
                  {getPreview(note.conteudo)}
                </p>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); openModal(note); }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                {formatDate(note.criado_em)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">
                {editNote ? 'Editar nota' : 'Nova nota'}
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
                <textarea
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  placeholder="Escreva suas ideias, pensamentos, anotações..."
                  rows={12}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-gradient-to-r from-blue-900 to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow disabled:opacity-50"
              >
                {saving ? 'Salvando...' : editNote ? 'Salvar alterações' : 'Criar nota'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
