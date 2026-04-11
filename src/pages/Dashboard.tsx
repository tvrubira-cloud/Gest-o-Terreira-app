import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Sparkles, ArrowRight, Megaphone, Bell, Trash2 } from 'lucide-react';
import logo from '../assets/logo.png';

export default function Dashboard() {
  const currentUser = useStore(state => state.currentUser);
  const currentTerreiroId = useStore(state => state.currentTerreiroId);
  const getCurrentTerreiro = useStore(state => state.getCurrentTerreiro);
  const getFilteredEvents = useStore(state => state.getFilteredEvents);
  const getFilteredUsers = useStore(state => state.getFilteredUsers);
  const getFilteredBroadcasts = useStore(state => state.getFilteredBroadcasts);
  const fetchBroadcasts = useStore(state => state.fetchBroadcasts);
  const subscribeToBroadcasts = useStore(state => state.subscribeToBroadcasts);
  const deleteBroadcast = useStore(state => state.deleteBroadcast);

  const [showAllBroadcasts, setShowAllBroadcasts] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteBroadcast(id);
    } catch (err: any) {
      console.error('[Dashboard] Erro ao excluir comunicado:', err.message);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
    const unsubscribe = subscribeToBroadcasts();
    return () => unsubscribe();
  }, [fetchBroadcasts, subscribeToBroadcasts]);

  if (!currentUser) return null;

  const currentTerreiro = getCurrentTerreiro();
  const users = getFilteredUsers();
  const events = getFilteredEvents();
  const broadcasts = getFilteredBroadcasts();
  const isMaster = !!currentUser.isMaster || !!currentUser.isPanelAdmin;
  const role = currentUser.role?.toUpperCase();
  const isAdmin = role === 'ADMIN' || isMaster;
  const isStaff = isAdmin || role === 'FINANCEIRO' || role === 'SECRETARIA';

  // Retorna true se o usuário atual pode excluir determinado comunicado
  const canDeleteBroadcast = (b: typeof broadcasts[0]) => {
    // Comunicados globais ou sem terreiro (criados pelo master): só master exclui
    if (b.isGlobal || !b.terreiroId) return isMaster;
    // Comunicados de terreiro: só staff do próprio terreiro exclui
    const isLocalStaff = (role === 'ADMIN' || role === 'FINANCEIRO' || role === 'SECRETARIA');
    return isMaster || (isLocalStaff && b.terreiroId === currentTerreiroId);
  };
  const navigate = useNavigate();

  const displayedBroadcasts = showAllBroadcasts ? broadcasts : broadcasts.slice(0, 3);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      <motion.div 
        variants={itemVariants}
        className="welcome-banner glass-panel holo-card" 
        style={{ borderRadius: 'var(--panel-radius)', padding: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div className="banner-text">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <div style={{ position: 'relative' }}>
              <img src={logo} alt="ORUM.app" style={{ width: 80, height: 80, borderRadius: 16, filter: 'url(#remove-black-bg) drop-shadow(0 0 15px rgba(0, 240, 255, 0.5))' }} />
              <Sparkles size={24} color="var(--neon-cyan)" style={{ position: 'absolute', top: -12, right: -12 }} className="glow-icon" />
            </div>
            <h2 className="text-gradient" style={{ fontSize: '2.2rem' }}>Bem-vindo(a), <span>{currentUser.nomeCompleto}</span></h2>
          </div>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Você está acessando o painel de <strong><span>{currentTerreiro?.name || 'Terreiro'}</span></strong>.</p>
        </div>
        
        {isStaff && (
          <div className="banner-stats" style={{ display: 'flex', gap: '3rem' }}>
            <div className="stat-card" style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                <Users size={16} />
                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Membros</h4>
              </div>
              <span className="stat-value text-gradient" style={{ fontSize: '2.5rem', fontWeight: 800 }}>{users.filter(u => (u.spiritual?.situacaoCadastro ?? 'ativo') === 'ativo').length}</span>
            </div>
            <div className="stat-card" style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                <Calendar size={16} />
                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Eventos</h4>
              </div>
              <span className="stat-value text-gradient" style={{ fontSize: '2.5rem', fontWeight: 800 }}>{events.length}</span>
            </div>
          </div>
        )}
      </motion.div>

      <div className="grid-panels" style={{ 
        display: 'grid', 
        gridTemplateColumns: !isStaff ? 'minmax(0, 1.2fr) minmax(0, 0.8fr)' : '1fr', 
        gap: '2rem' 
      }}>
        <motion.div variants={itemVariants} className="panel glass-panel holo-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.4rem' }}>Avisos e Comunicados</h3>
            <Bell size={20} color="var(--neon-purple)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
                <Megaphone size={18} color="var(--neon-purple)" />
                <h4 style={{ fontSize: '1.1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Comunicados Recentes</h4>
              </div>

              {broadcasts.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
                  <Megaphone size={40} style={{ marginBottom: '1rem' }} />
                  <p>Nenhuma notificação recente.</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    {displayedBroadcasts.map(broadcast => (
                      <motion.div 
                        key={broadcast.id} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="broadcast-item glass-panel" 
                        style={{ 
                          padding: '1.5rem', 
                          borderLeft: `4px solid ${broadcast.isGlobal ? 'var(--neon-purple)' : 'var(--neon-cyan)'}`,
                          background: 'rgba(255,255,255,0.02)',
                          cursor: broadcast.url ? 'pointer' : 'default',
                          transition: 'all 0.3s'
                        }}
                        onClick={() => broadcast.url && window.open(broadcast.url, '_blank')}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                          <span style={{ fontSize: '0.8rem', color: broadcast.isGlobal ? 'var(--neon-purple)' : 'var(--neon-cyan)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {broadcast.isGlobal ? '🌍 Global' : '🏠 Local'}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {new Date(broadcast.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                            {canDeleteBroadcast(broadcast) && (
                              <button
                                onClick={e => { e.stopPropagation(); handleDelete(broadcast.id); }}
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
                        <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#fff' }}>{broadcast.title}</h4>
                        <p style={{ color: 'var(--text-muted)', lineHeight: '1.5' }}>{broadcast.body}</p>
                        <div style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.6, display: 'flex', justifyContent: 'flex-end' }}>
                          Por: {broadcast.createdBy}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {broadcasts.length > 3 && (
                    <button 
                      onClick={() => setShowAllBroadcasts(!showAllBroadcasts)}
                      className="glass-panel"
                      style={{ 
                        padding: '1rem', 
                        marginTop: '1.2rem',
                        width: '100%', 
                        background: 'rgba(255,255,255,0.03)', 
                        border: '1px solid var(--glass-border)',
                        color: 'var(--neon-cyan)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)';
                        e.currentTarget.style.borderColor = 'var(--neon-cyan)';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                        e.currentTarget.style.borderColor = 'var(--glass-border)';
                      }}
                    >
                      {showAllBroadcasts ? 'Ver Menos' : `Ver Mais (${broadcasts.length - 3})`}
                    </button>
                  )}
                </>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
                <Calendar size={18} color="var(--neon-cyan)" />
                <h4 style={{ fontSize: '1.1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Próximos Eventos</h4>
              </div>
          
          {events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Calendar size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
              <p>Nenhum evento agendado para esta casa.</p>
            </div>
          ) : (
            <ul className="activity-list" style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {events.slice(0, 5).map(evt => (
                <li key={evt.id} className="glow-fx" style={{ display: 'flex', gap: '1.5rem', padding: '1.2rem', background: 'rgba(255,255,255,0.02)', borderRadius: 15, border: '1px solid transparent' }}>
                  <div style={{ width: 50, height: 50, borderRadius: 12, background: 'rgba(0, 240, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-cyan)' }}>
                    {new Date(evt.date).getDate()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '1.1rem' }}>{evt.title}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--neon-cyan)' }}>{new Date(evt.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{evt.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
        </motion.div>

        {isStaff ? null : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <motion.div variants={itemVariants} className="panel glass-panel holo-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.4rem' }}>Meu Perfil Espiritual</h3>
                <Sparkles size={20} color="var(--neon-cyan)" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: 15, border: '1px solid rgba(0, 240, 255, 0.1)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Nome de Santo</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--neon-cyan)' }}>{currentUser.nomeDeSanto || 'Não informado'}</div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 12 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Orixá de Frente</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600 }}>{currentUser.spiritual.orixaFrente}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 12 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tempo de Casa</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600 }}>{currentUser.spiritual.tempoUmbanda}</div>
                  </div>
                </div>
                
                <button onClick={() => navigate('/members')} className="glass-panel glow-fx" style={{ marginTop: '1rem', padding: '1.2rem', background: 'var(--neon-cyan)', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 800, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  Acessar Ficha Completa <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>

          </div>
        )}
      </div>
    </motion.div>
  );
}
