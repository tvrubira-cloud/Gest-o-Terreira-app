import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Calendar as CalendarIcon, Plus, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Events() {
  const { addEvent, updateEvent, deleteEvent, currentUser, getFilteredEvents, getCurrentTerreiro } = useStore();
  const role = currentUser?.role?.toUpperCase();
  const isAdmin = role === 'ADMIN' || currentUser?.isMaster || currentUser?.isPanelAdmin;
  const events = getFilteredEvents();
  const currentTerreiro = getCurrentTerreiro();

  const [showForm, setShowForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;
    
    if (editingEventId) {
      await updateEvent(editingEventId, {
        title,
        date,
        description,
      });
    } else {
      await addEvent({
        title,
        date,
        description,
        createdBy: currentUser!.id
      });
    }
    
    handleCloseForm();
  };

  const handleEdit = (event: any) => {
    setEditingEventId(event.id);
    setTitle(event.title);
    setDate(new Date(event.date).toISOString().slice(0, 16));
    setDescription(event.description || '');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este evento?')) {
      await deleteEvent(id);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingEventId(null);
    setTitle('');
    setDate('');
    setDescription('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <CalendarIcon size={28} /> Agenda e Compromissos
          </h2>
          {currentTerreiro && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
              {currentTerreiro.name}
            </p>
          )}
        </div>
        
        {isAdmin && !showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="glass-panel glow-fx"
            style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(176, 0, 255, 0.15)', color: '#fff', border: '1px solid var(--neon-purple)', cursor: 'pointer' }}
          >
            <Plus size={18} /> Novo Evento / Obrigação
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <div className="panel glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--panel-radius)', border: '1px solid var(--neon-cyan)' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>
            {editingEventId ? 'Editar Evento' : 'Programar Evento'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ color: 'var(--text-muted)' }}>Título</label>
                <input required type="text" className="search-input glass-panel" style={{ padding: '0.8rem', border: '1px solid var(--glass-border)' }} value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ color: 'var(--text-muted)' }}>Data e Hora</label>
                <input required type="datetime-local" className="search-input glass-panel" style={{ padding: '0.8rem', border: '1px solid var(--glass-border)', color: 'var(--text-main)', fontFamily: 'inherit' }} value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ color: 'var(--text-muted)' }}>Descrição (Opcional)</label>
              <textarea className="search-input glass-panel" rows={3} style={{ padding: '0.8rem', border: '1px solid var(--glass-border)', resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="glass-panel glow-fx" style={{ padding: '0.8rem 2rem', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--neon-cyan)', border: '1px solid var(--neon-cyan)', cursor: 'pointer' }}>
                {editingEventId ? 'Atualizar Evento' : 'Salvar Evento'}
              </button>
              <button type="button" onClick={handleCloseForm} className="glass-panel glow-fx" style={{ padding: '0.8rem 2rem', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--glass-border)', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid-panels" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1rem' }}>
        {events.length === 0 ? (
          <div className="panel glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Nenhum evento programado para esta casa.
          </div>
        ) : (
          events.map(evt => (
            <div key={evt.id} className="panel glass-panel glow-fx" style={{ padding: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderRadius: 'var(--panel-radius)' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', color: 'var(--neon-cyan)', marginBottom: '0.5rem' }}>{evt.title}</h3>
                <p style={{ color: 'var(--text-muted)' }}>{evt.description}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginRight: '1rem' }}>
                    <button 
                      onClick={() => handleEdit(evt)}
                      title="Editar"
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }}
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(evt.id)}
                      title="Excluir"
                      style={{ background: 'none', border: 'none', color: 'rgba(255, 100, 100, 0.7)', cursor: 'pointer', padding: '0.5rem' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.8rem 1.2rem', borderRadius: 8, textAlign: 'center', minWidth: '80px' }}>
                  <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {new Date(evt.date).toLocaleDateString('pt-BR', { month: 'short' })}
                  </span>
                  <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {new Date(evt.date).getDate()}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {new Date(evt.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
