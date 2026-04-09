import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Send, Users, Globe, AlertTriangle, CheckCircle2, Loader2, Megaphone, Trash2 } from 'lucide-react';

export default function Broadcast() {
  const currentUser = useStore(state => state.currentUser);
  const currentTerreiroId = useStore(state => state.currentTerreiroId);
  const addBroadcast = useStore(state => state.addBroadcast);
  const deleteBroadcast = useStore(state => state.deleteBroadcast);
  const getFilteredBroadcasts = useStore(state => state.getFilteredBroadcasts);
  const fetchBroadcasts = useStore(state => state.fetchBroadcasts);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [isGlobal, setIsGlobal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => {
    fetchBroadcasts();
  }, [fetchBroadcasts]);

  const isMaster = currentUser?.isMaster || currentUser?.isPanelAdmin;
  const role = currentUser?.role?.toUpperCase();

  const canDeleteBroadcast = (b: ReturnType<typeof getFilteredBroadcasts>[0]) => {
    if (b.isGlobal || !b.terreiroId) return isMaster;
    const isLocalStaff = role === 'ADMIN' || role === 'FINANCEIRO' || role === 'SECRETARIA';
    return isMaster || (isLocalStaff && b.terreiroId === currentTerreiroId);
  };

  const broadcasts = getFilteredBroadcasts();

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteBroadcast(id);
    } catch (err: any) {
      setStatus({ type: 'error', msg: `Erro ao excluir: ${err.message || 'Tente novamente'}` });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;

    setLoading(true);
    setStatus(null);

    try {
      await addBroadcast({
        title,
        body,
        url: url || undefined,
        isGlobal: !!(isGlobal && isMaster),
        createdBy: currentUser?.nomeDeSanto || currentUser?.nomeCompleto || ''
      });

      setStatus({ type: 'success', msg: 'Comunicado enviado e salvo com sucesso!' });
      setTitle('');
      setBody('');
      setUrl('');
    } catch (err: any) {
      setStatus({ type: 'error', msg: `Erro ao enviar: ${err.message || 'Erro desconhecido'}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <div className="icon-box" style={{ background: 'var(--bg-grad-1)', padding: '0.8rem', borderRadius: 12 }}>
            <Megaphone size={28} color="var(--neon-purple)" />
          </div>
          <div>
            <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.2rem' }}>Comunicados</h1>
            <p style={{ color: 'var(--text-muted)' }}>Envie notificações em massa para os membros.</p>
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Formulário de criação */}
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Novo Comunicado</h3>
          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Título da Notificação</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Comunicado Importante"
                className="glass-input"
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Mensagem</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="O que você deseja comunicar?"
                className="glass-input"
                style={{ minHeight: 120, resize: 'vertical' }}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>URL de Destino (Opcional)</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://orum.app/dashboard"
                className="glass-input"
              />
            </div>

            {isMaster && (
              <div
                className="glass-panel"
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                  background: isGlobal ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  border: isGlobal ? '1px solid var(--neon-purple)' : '1px solid var(--glass-border)',
                  cursor: 'pointer', transition: 'all 0.3s'
                }}
                onClick={() => setIsGlobal(!isGlobal)}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: 6, border: '2px solid var(--neon-purple)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isGlobal ? 'var(--neon-purple)' : 'transparent'
                }}>
                  {isGlobal && <CheckCircle2 size={16} color="#fff" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Globe size={16} color="var(--neon-purple)" />
                    <span style={{ fontWeight: 600 }}>Envio Global (Todos os Terreiros)</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Se marcado, todos os membros cadastrados na plataforma receberão esta mensagem.
                  </p>
                </div>
              </div>
            )}

            {!isGlobal && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--neon-cyan)', fontSize: '0.9rem', padding: '0.5rem' }}>
                <Users size={16} />
                <span>Esta mensagem será enviada apenas para membros da casa atual.</span>
              </div>
            )}

            {status && (
              <div style={{
                padding: '1rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.8rem',
                background: status.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${status.type === 'success' ? '#22c55e' : '#ef4444'}`,
                color: status.type === 'success' ? '#4ade80' : '#f87171'
              }}>
                {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                <span>{status.msg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`glass-btn glow-fx ${loading ? 'loading' : ''}`}
              style={{ padding: '1.2rem', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}
            >
              {loading ? (
                <><Loader2 className="spin" size={20} /><span>Enviando...</span></>
              ) : (
                <><Send size={20} /><span>Enviar Notificações</span></>
              )}
            </button>
          </form>
        </div>

        {/* Lista de comunicados existentes */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Comunicados Enviados</h3>
          {broadcasts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
              <Megaphone size={40} style={{ marginBottom: '1rem' }} />
              <p>Nenhum comunicado enviado ainda.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: 600, overflowY: 'auto' }}>
              {broadcasts.map(broadcast => (
                <div
                  key={broadcast.id}
                  style={{
                    padding: '1.2rem',
                    borderRadius: 12,
                    borderLeft: `4px solid ${broadcast.isGlobal ? 'var(--neon-purple)' : 'var(--neon-cyan)'}`,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--glass-border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: broadcast.isGlobal ? 'var(--neon-purple)' : 'var(--neon-cyan)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {broadcast.isGlobal ? '🌍 Global' : '🏠 Local'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(broadcast.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                      {canDeleteBroadcast(broadcast) && (
                        <button
                          onClick={() => handleDelete(broadcast.id)}
                          disabled={deletingId === broadcast.id}
                          title="Excluir comunicado"
                          style={{ background: 'none', border: 'none', cursor: deletingId === broadcast.id ? 'wait' : 'pointer', color: 'var(--text-muted)', padding: '0.2rem', display: 'flex', alignItems: 'center', transition: 'color 0.2s', opacity: deletingId === broadcast.id ? 0.4 : 1 }}
                          onMouseOver={e => (e.currentTarget.style.color = '#ef4444')}
                          onMouseOut={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                  <strong style={{ fontSize: '1rem', display: 'block', marginBottom: '0.3rem' }}>{broadcast.title}</strong>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{broadcast.body}</p>
                  <div style={{ marginTop: '0.8rem', fontSize: '0.75rem', opacity: 0.5, textAlign: 'right' }}>
                    Por: {broadcast.createdBy}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
