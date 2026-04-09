import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { LayoutDashboard, Users, Calendar, Settings, LogOut, Hexagon, Search, Bell, ChevronDown, Building2, DollarSign, Lock, Sparkles, Sun, Moon, Menu, X, Megaphone } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import bgImage from '../assets/bg.png';
import logo from '../assets/logo.png';
import '../App.css';
import NotificationGate from './NotificationGate';

export default function Layout() {
  const currentUser = useStore(state => state.currentUser);
  const logout = useStore(state => state.logout);
  const terreiros = useStore(state => state.terreiros);
  const currentTerreiroId = useStore(state => state.currentTerreiroId);
  const getUserTerreiros = useStore(state => state.getUserTerreiros);
  const switchTerreiro = useStore(state => state.switchTerreiro);
  const theme = useStore(state => state.theme);
  const toggleTheme = useStore(state => state.toggleTheme);
  const navigate = useNavigate();
  const location = useLocation();
  const [showTerreiroDropdown, setShowTerreiroDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hooks must be called at the top, before any conditional returns
  const broadcasts = useStore(state => state.broadcasts);
  const currentTerreiro = terreiros.find(t => t.id === currentTerreiroId);

  const isMaster = !!currentUser?.isMaster || !!currentUser?.isPanelAdmin;

  // Filter broadcasts like in Dashboard
  const filteredBroadcasts = broadcasts
    .filter(b => isMaster || b.isGlobal || b.terreiroId === currentTerreiroId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const unreadCount = filteredBroadcasts.length;

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const userTerreiros = getUserTerreiros();
  const role = currentUser.role?.toUpperCase();
  const isAdmin = role === 'ADMIN' || isMaster;
  const isStaff = isAdmin || role === 'FINANCEIRO' || role === 'SECRETARIA';

  const menuItems = [
    { id: 'dashboard', path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', adminOnly: false },
    { id: 'hub-ia', path: '/hub-ia', icon: Sparkles, label: 'Centro de IA', adminOnly: false },
    { id: 'members', path: '/members', icon: Users, label: isStaff ? 'Membros da Casa' : 'Meu Perfil', adminOnly: false },
    { id: 'events', path: '/events', icon: Calendar, label: 'Agenda e Eventos', adminOnly: false },
    { id: 'financial', path: '/financeiro', icon: DollarSign, label: 'Financeiro', adminOnly: false },
    { id: 'broadcast', path: '/broadcast', icon: Megaphone, label: 'Comunicados', adminOnly: true },
    { id: 'terreiros', path: '/terreiros', icon: Building2, label: 'Minhas Casas', adminOnly: true },
    { id: 'settings', path: '/settings', icon: Settings, label: 'Configurações', adminOnly: true },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (currentTerreiro?.isBlocked && !currentUser.isMaster && !currentUser.isPanelAdmin) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="bg-container">
          <img src={bgImage} alt="Background" className="bg-image" />
          <div className="bg-overlay" style={{ background: 'rgba(0,0,0,0.85)' }}></div>
        </div>
        <div className="glass-panel glow-fx" style={{ padding: '3rem', textAlign: 'center', maxWidth: 500, border: '1px solid #ff4c4c', background: 'rgba(255, 76, 76, 0.1)', zIndex: 10 }}>
          <Lock size={64} color="#ff4c4c" style={{ marginBottom: '1.5rem', display: 'inline-block' }} />
          <h1 style={{ color: '#ff4c4c', marginBottom: '1rem', fontSize: '1.8rem' }}>Acesso Interrompido</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6, fontSize: '1.1rem' }}>
            O sistema do seu terreiro encontra-se temporariamente bloqueado.<br/>
            Por favor, entre em contato com a administração da plataforma.
          </p>
          <button onClick={handleLogout} className="glass-panel glow-fx" style={{ padding: '1rem 3rem', background: '#ff4c4c', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
            Sair do Sistema
          </button>
        </div>
      </div>
    );
  }

  const isMember = !isStaff;

  const layoutContent = (
    <div className="app-container">
      <div className="bg-container">
        <img src={bgImage} alt="Background" className="bg-image" />
        <div className="bg-overlay"></div>
      </div>

      <div className="app-layout">
        {/* Mobile Overlay */}
        {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />}

        {/* Sidebar */}
        <aside className={`sidebar glass-panel ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
          <div className="logo-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <img src={logo} alt="ORUM.app" style={{ width: 60, height: 60, objectFit: 'contain', filter: 'url(#remove-black-bg)' }} />
              <div style={{ width: '1px', height: '32px', background: 'var(--glass-border)' }}></div>
              {currentTerreiro?.logoUrl ? (
                 <img src={currentTerreiro.logoUrl} alt="Logo" style={{ width: 40, height: 40, borderRadius: 8 }} />
              ) : (
                 <Hexagon size={32} className="logo-icon glow-icon" color="var(--neon-cyan)" />
              )}
            </div>
            <h1 className="logo-text text-gradient" style={{ fontSize: '1.1rem', lineHeight: '1.2', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              <span>{currentTerreiro?.name || 'Terreiro'}</span>
            </h1>
          </div>

          {/* ── Terreiro Switcher ── */}
          {isAdmin && userTerreiros.length > 0 && (
            <div style={{ position: 'relative', margin: '0.5rem 0.8rem' }}>
              <button
                onClick={() => setShowTerreiroDropdown(!showTerreiroDropdown)}
                style={{
                  width: '100%',
                  padding: '0.7rem 0.8rem',
                  background: 'var(--bg-grad-1)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 10,
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  transition: 'all 0.3s'
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--neon-cyan)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
              >
                <Building2 size={16} color="var(--neon-cyan)" />
                <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span>{currentTerreiro?.name || 'Selecionar Casa'}</span>
                </span>
                <ChevronDown size={14} style={{ transform: showTerreiroDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {showTerreiroDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: 4,
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  zIndex: 100,
                  boxShadow: '0 8px 24px var(--glass-shadow)'
                }}>
                  <div style={{ padding: '0.5rem 0.8rem', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--glass-border)' }}>
                    Trocar de Casa
                  </div>
                  {currentUser?.isMaster && (
                     <button
                       onClick={() => {
                         switchTerreiro('');
                         setShowTerreiroDropdown(false);
                       }}
                       style={{
                         width: '100%',
                         padding: '0.7rem 0.8rem',
                         background: !currentTerreiro ? 'var(--bg-grad-1)' : 'transparent',
                         border: 'none',
                         color: !currentTerreiro ? 'var(--neon-cyan)' : 'var(--text-muted)',
                         cursor: 'pointer',
                         textAlign: 'left',
                         fontSize: '0.85rem',
                         display: 'flex',
                         alignItems: 'center',
                         gap: '0.5rem',
                         borderBottom: '1px solid rgba(255,255,255,0.05)'
                       }}
                       onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                       onMouseOut={e => e.currentTarget.style.background = !currentTerreiro ? 'var(--bg-grad-1)' : 'transparent'}
                     >
                       <Building2 size={16} />
                       Visualização Geral (Master)
                     </button>
                   )}
                  {userTerreiros.map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        switchTerreiro(t.id);
                        setShowTerreiroDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.7rem 0.8rem',
                        background: t.id === currentTerreiro?.id ? 'var(--bg-grad-1)' : 'transparent',
                        border: 'none',
                        color: t.id === currentTerreiro?.id ? 'var(--neon-cyan)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                      onMouseOut={e => e.currentTarget.style.background = t.id === currentTerreiro?.id ? 'var(--bg-grad-1)' : 'transparent'}
                    >
                      <Hexagon size={14} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <nav className="nav-menu" style={{ flex: 1 }}>
            {menuItems.filter(item => {
              // Now uses the outer 'role' and 'isMaster' variables defined at lines 29-30

              // Master and Panel Admin see everything
              if (isMaster) return true;

              // Local Admin ('Administrador') sees everything
              if (role === 'ADMIN') {
                return true;
              }

              // Financeiro (Tudo menos Configurações)
              if (role === 'FINANCEIRO') {
                return ['dashboard', 'hub-ia', 'members', 'events', 'financial', 'terreiros', 'broadcast'].includes(item.id);
              }

              // Secretaria (Dashboard, Membros, Agenda/Eventos, Minhas Casas)
              if (role === 'SECRETARIA') {
                return ['dashboard', 'members', 'events', 'terreiros'].includes(item.id);
              }

              // Membro (USER) - Sees Dashboard, AI Hub, Profile, Events, and Financial
              if (role === 'USER') {
                return ['dashboard', 'hub-ia', 'members', 'events', 'financial'].includes(item.id);
              }

              return false;
            }).map((item) => {
              // Now uses the outer 'role' and 'isMaster' and 'isStaff' variables defined at lines 29-32
              
              // Dynamic label for members and terreiros pages
              let label = item.label;
              if (item.id === 'members') {
                label = isStaff ? 'Membros da Casa' : 'Meu Perfil';
              } else if (item.id === 'terreiros') {
                label = isMaster ? 'Gerenciar Casas' : 'Minhas Casas';
              }

              return (
                <button
                  key={item.id}
                  className={`nav-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
                  onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                >
                  <item.icon size={22} className="nav-icon" />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          <button className="nav-item" onClick={() => { handleLogout(); setMobileMenuOpen(false); }} style={{ color: '#ff4c4c', marginTop: 'auto' }}>
            <LogOut size={20} className="nav-icon" />
            <span>Sair</span>
          </button>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <header className="header glass-panel">
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="search-bar">
              <Search size={18} className="search-icon" />
              <input type="text" placeholder="Buscar..." className="search-input" />
            </div>
            
            <div className="header-actions">
              <button className="icon-btn glow-fx" onClick={toggleTheme} title="Alternar Tema Claro/Escuro" style={{ color: theme === 'dark' ? 'var(--accent-gold)' : 'var(--neon-purple)' }}>
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              <div style={{ position: 'relative' }}>
                <button 
                  className="icon-btn glow-fx" 
                  title="Notificações"
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{ color: showNotifications ? 'var(--neon-cyan)' : 'var(--text-main)' }}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: -5,
                      right: -5,
                      background: 'var(--neon-purple)',
                      color: 'white',
                      fontSize: '0.65rem',
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      border: '2px solid var(--bg-primary)'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="glass-panel" style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '1rem',
                    width: '320px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    padding: '1rem',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    border: '1px solid var(--glass-border)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                      <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Bell size={16} color="var(--neon-purple)" /> Notificações
                      </span>
                      <button 
                        onClick={() => setShowNotifications(false)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {filteredBroadcasts.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>Sem notificações.</p>
                      ) : (
                        filteredBroadcasts.slice(0, 5).map(b => (
                          <div 
                            key={b.id} 
                            style={{ 
                              padding: '0.8rem', 
                              borderRadius: '8px', 
                              background: 'rgba(255,255,255,0.03)',
                              cursor: 'pointer',
                              borderLeft: `3px solid ${b.isGlobal ? 'var(--neon-purple)' : 'var(--neon-cyan)'}`
                            }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                            onClick={() => {
                              navigate('/dashboard');
                              setShowNotifications(false);
                            }}
                          >
                            <h5 style={{ fontSize: '0.9rem', marginBottom: '0.2rem', color: '#fff' }}>{b.title}</h5>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {b.body}
                            </p>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.6 }}>
                              {new Date(b.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        ))
                      )}
                      {filteredBroadcasts.length > 0 && (
                        <button 
                          onClick={() => { navigate('/dashboard'); setShowNotifications(false); }}
                          style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            color: 'var(--neon-cyan)', 
                            fontSize: '0.8rem', 
                            cursor: 'pointer',
                            marginTop: '0.5rem',
                            fontWeight: 600
                          }}
                        >
                          Ver todas no Dashboard
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="user-profile">
                {currentUser.photoUrl ? (
                  <img src={currentUser.photoUrl} alt="Avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--neon-cyan)' }} />
                ) : (
                  <div className="avatar" style={{ width: 40, height: 40, fontSize: '1.2rem' }}>{currentUser.nomeCompleto.charAt(0)}</div>
                )}
                <span>{currentUser.nomeDeSanto || currentUser.nomeCompleto}</span>
              </div>
            </div>
          </header>

          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '2rem' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );

  return isMember ? (
    <NotificationGate>{layoutContent}</NotificationGate>
  ) : layoutContent;
}
