import { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Calendar as CalendarIcon, Plus, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import ConfirmationModal from '../components/ConfirmationModal';

function DateTimeInputField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const dtRef = useRef<HTMLInputElement>(null);

  const toDisplay = (v: string) => {
    if (!v) return '';
    const [datePart, timePart = '00:00'] = v.split('T');
    const [y, m, d] = datePart.split('-');
    return `${d}/${m}/${y} ${timePart}`;
  };

  const [text, setText] = useState(() => toDisplay(value));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
    let fmt = digits;
    if (digits.length > 8) {
      fmt = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)} ${digits.slice(8, 10)}:${digits.slice(10)}`;
    } else if (digits.length > 4) {
      fmt = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      fmt = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    setText(fmt);
    if (digits.length === 12) {
      const storage = `${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}T${digits.slice(8, 10)}:${digits.slice(10)}`;
      onChange(storage);
    }
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setText(toDisplay(e.target.value));
  };

  const openPicker = () => {
    if (dtRef.current) {
      try { dtRef.current.showPicker(); } catch { dtRef.current.click(); }
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label style={{ color: 'var(--text-muted)' }}>Data e Hora</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          required
          placeholder="DD/MM/AAAA HH:MM"
          className="search-input glass-panel"
          style={{ padding: '0.8rem', paddingRight: '2.8rem', border: '1px solid var(--glass-border)', color: 'var(--text-main)', fontFamily: 'inherit', width: '100%' }}
          value={text}
          onChange={handleChange}
        />
        <button type="button" onClick={openPicker}
          style={{ position: 'absolute', right: '0.6rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem', display: 'flex', alignItems: 'center' }}>
          <CalendarIcon size={16} />
        </button>
        <input ref={dtRef} type="datetime-local"
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
          value={value} onChange={handlePickerChange}
        />
      </div>
    </div>
  );
}

export default function Events() {
  const { addEvent, updateEvent, deleteEvent, currentUser, getFilteredEvents, getCurrentTerreiro, terreiros } = useStore();
  const role = currentUser?.role?.toUpperCase();
  const isMaster = !!currentUser?.isMaster || !!currentUser?.isPanelAdmin;
  const isAdmin = role === 'ADMIN' || isMaster;
  const events = getFilteredEvents();
  const currentTerreiro = getCurrentTerreiro();

  const [showForm, setShowForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [deleteEventModal, setDeleteEventModal] = useState<{ isOpen: boolean; eventId: string; eventTitle: string }>({ isOpen: false, eventId: '', eventTitle: '' });

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

  const handleDelete = (id: string, eventTitle: string) => {
    setDeleteEventModal({ isOpen: true, eventId: id, eventTitle });
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
              <DateTimeInputField value={date} onChange={setDate} />
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
                 <h3 style={{ fontSize: '1.3rem', color: 'var(--neon-cyan)', marginBottom: '0.2rem' }}>{evt.title}</h3>
                 {isMaster && (
                   <div style={{ fontSize: '0.75rem', color: 'var(--neon-purple)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                     {terreiros.find(t => t.id === evt.terreiroId)?.name || 'Geral'}
                   </div>
                 )}
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
                      onClick={() => handleDelete(evt.id, evt.title)}
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

      <ConfirmationModal
        isOpen={deleteEventModal.isOpen}
        onClose={() => setDeleteEventModal({ isOpen: false, eventId: '', eventTitle: '' })}
        onConfirm={async () => {
          try {
            await deleteEvent(deleteEventModal.eventId);
          } catch {
            alert('Erro ao excluir o evento. Verifique sua conexão e tente novamente.');
          }
        }}
        title="Excluir Evento"
        message={`Tem certeza que deseja excluir o evento "${deleteEventModal.eventTitle}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="danger"
      />
    </motion.div>
  );
}
