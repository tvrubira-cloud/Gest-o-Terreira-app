import { useState } from 'react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { Send, Users, Globe, AlertTriangle, CheckCircle2, Loader2, Megaphone } from 'lucide-react';

export default function Broadcast() {
  const currentUser = useStore(state => state.currentUser);
  const currentTerreiroId = useStore(state => state.currentTerreiroId);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [isGlobal, setIsGlobal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const isMaster = currentUser?.isMaster || currentUser?.isPanelAdmin;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;

    setLoading(true);
    setStatus(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-push', {
        body: {
          title,
          body,
          url: url || undefined,
          isBroadcast: isGlobal && isMaster, // Global só se for Master
          terreiroId: isGlobal ? undefined : currentTerreiroId
        }
      });

      if (error) throw error;

      setStatus({
        type: 'success',
        msg: `Notificação enviada com sucesso para ${data.sent} dispositivos!`
      });
      setTitle('');
      setBody('');
      setUrl('');
    } catch (err: any) {
      console.error('Erro ao enviar broadcast:', err);
      setStatus({
        type: 'error',
        msg: `Erro ao enviar: ${err.message || 'Erro desconhecido'}`
      });
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

      <div className="grid-container" style={{ maxWidth: 800 }}>
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
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
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem', 
                  padding: '1rem', 
                  background: isGlobal ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  border: isGlobal ? '1px solid var(--neon-purple)' : '1px solid var(--glass-border)',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
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
                padding: '1rem', 
                borderRadius: 8, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.8rem',
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
                <>
                  <Loader2 className="spin" size={20} />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send size={20} />
                  <span>Enviar Notificações</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
