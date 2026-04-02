import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Sparkles, UserPlus, CalendarPlus, Settings as SettingsIcon, Building, ArrowRight } from 'lucide-react';
import logo from '../assets/logo.png';

export default function Dashboard() {
  const currentUser = useStore(state => state.currentUser);
  const getCurrentTerreiro = useStore(state => state.getCurrentTerreiro);
  const getFilteredEvents = useStore(state => state.getFilteredEvents);
  const getFilteredUsers = useStore(state => state.getFilteredUsers);

  if (!currentUser) return null;

  const currentTerreiro = getCurrentTerreiro();
  const users = getFilteredUsers();
  const events = getFilteredEvents();
  const isMaster = !!currentUser.isMaster || !!currentUser.isPanelAdmin;
  const role = currentUser.role?.toUpperCase();
  const isAdmin = role === 'ADMIN' || isMaster;
  const isStaff = isAdmin || role === 'FINANCEIRO' || role === 'SECRETARIA';
  const navigate = useNavigate();

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
              <span className="stat-value text-gradient" style={{ fontSize: '2.5rem', fontWeight: 800 }}>{users.length}</span>
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

      <div className="grid-panels" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '2rem' }}>
        <motion.div variants={itemVariants} className="panel glass-panel holo-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.4rem' }}>Avisos e Próximos Eventos</h3>
            <Calendar size={20} color="var(--neon-cyan)" />
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
        </motion.div>

        {isStaff ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <motion.div variants={itemVariants} className="panel glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.4rem' }}>Acesso Rápido</h3>
                <Sparkles size={20} color="var(--neon-purple)" />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                 {isStaff && (
                   <button onClick={() => navigate('/terreiros')} className="glass-panel glow-fx" style={{ padding: '1.5rem', textAlign: 'left', background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.1), transparent)', border: '1px solid var(--neon-cyan)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', borderRadius: 15 }}>
                     <div style={{ background: 'var(--neon-cyan)', padding: '0.5rem', borderRadius: 8 }}><Building size={24} color="#000" /></div>
                     <div style={{ flex: 1 }}>
                       <div style={{ fontWeight: 800, fontSize: '1rem' }}>Gerenciar Casas</div>
                       <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Administração de terreiros</div>
                     </div>
                     <ArrowRight size={18} />
                   </button>
                 )}
                 <button className="glass-panel glow-fx" style={{ padding: '1.2rem', textAlign: 'left', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', borderRadius: 15 }}>
                   <div style={{ background: 'rgba(157, 78, 221, 0.2)', padding: '0.5rem', borderRadius: 8 }}><UserPlus size={24} color="var(--neon-purple)" /></div>
                   <div style={{ flex: 1 }}>
                     <div style={{ fontWeight: 600 }}>Cadrastar Membro</div>
                     <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Adicionar novo integrante à casa</div>
                   </div>
                 </button>
                 <button className="glass-panel glow-fx" style={{ padding: '1.2rem', textAlign: 'left', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', borderRadius: 15 }}>
                   <div style={{ background: 'rgba(0, 240, 255, 0.1)', padding: '0.5rem', borderRadius: 8 }}><CalendarPlus size={24} color="var(--neon-cyan)" /></div>
                   <div style={{ flex: 1 }}>
                     <div style={{ fontWeight: 600 }}>Nova Gira/Evento</div>
                     <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Agendar atividades no calendário</div>
                   </div>
                 </button>
                 {isAdmin && (
                   <button onClick={() => navigate('/settings')} className="glass-panel glow-fx" style={{ padding: '1.2rem', textAlign: 'left', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', borderRadius: 15 }}>
                     <div style={{ background: 'rgba(255, 215, 0, 0.1)', padding: '0.5rem', borderRadius: 8 }}><SettingsIcon size={24} color="var(--accent-gold)" /></div>
                     <div style={{ flex: 1 }}>
                       <div style={{ fontWeight: 600 }}>Configurações</div>
                       <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ajustes do sistema e integrações</div>
                     </div>
                   </button>
                 )}
              </div>
            </motion.div>

            {(isAdmin || role === 'FINANCEIRO') && (
              <motion.div 
                variants={itemVariants} 
                className="glass-panel holo-card" 
                style={{ padding: '2rem', cursor: 'pointer', background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1), rgba(176, 0, 255, 0.1))', border: '1px solid var(--neon-cyan)' }}
                onClick={() => navigate('/hub-ia')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <Sparkles size={28} color="var(--neon-cyan)" className="glow-icon" />
                  <h3 style={{ fontSize: '1.4rem', margin: 0 }}>Centro de IA Espiritual</h3>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Acesse conhecimentos ancestrais, pontos e ervas com o poder da nossa IA especializada.</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--neon-cyan)', borderRadius: '20px', border: '1px solid var(--neon-cyan)' }}>PONTOS</span>
                  <span style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', background: 'rgba(176, 0, 255, 0.1)', color: 'var(--neon-purple)', borderRadius: '20px', border: '1px solid var(--neon-purple)' }}>ERVAS</span>
                  <span style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-main)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>ESTUDOS</span>
                </div>
              </motion.div>
            )}
          </div>
        ) : (
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
