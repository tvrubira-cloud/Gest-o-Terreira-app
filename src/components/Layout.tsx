import { Navigate, Outlet } from 'react-router-dom';
import { useStore, canAccess, PLAN_LABELS } from '../store/useStore';
import { LayoutDashboard, Users, Calendar, Settings, LogOut, Hexagon, Search, Bell, ChevronDown, Building2, DollarSign, Lock, Sparkles, Sun, Moon, Menu, X, Megaphone, Crown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import bgImage from '../assets/bg.png';
import logo from '../assets/nova-logo.png';
import '../App.css';
import NotificationGate from './NotificationGate';
import ChatWidget from './ChatWidget';

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
  const getCurrentTerreiroPlan = useStore(state => state.getCurrentTerreiroPlan);
  const broadcasts = useStore(state => state.broadcasts);
  const currentTerreiro = terreiros.find(t => t.id === currentTerreiroId);
  const currentPlan = getCurrentTerreiroPlan();

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
    { id: 'planos', path: '/planos', icon: Crown, label: 'Planos', adminOnly: false },
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
              <img src={logo} alt="ORUNAPP" style={{ width: 60, height: 60, objectFit: 'contain', filter: 'url(#remove-black-bg)' }} />
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
            {currentPlan && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: 20,
                background: currentPlan === 'orun' ? 'rgba(201,168,76,0.15)' : currentPlan === 'axe' ? 'rgba(0,200,200,0.12)' : 'rgba(255,255,255,0.06)',
                border: `0.5px solid ${currentPlan === 'orun' ? 'rgba(201,168,76,0.3)' : currentPlan === 'axe' ? 'rgba(0,200,200,0.3)' : 'rgba(255,255,255,0.1)'}`,
                color: currentPlan === 'orun' ? '#C9A84C' : currentPlan === 'axe' ? '#00C8C8' : 'rgba(255,255,255,0.4)',
                marginTop: 4,
              }}>
                <Crown size={10} />
                {PLAN_LABELS[currentPlan] || 'Trial'}
              </div>
            )}
          </div>

          {/* ── Terreiro Switcher ── */}
          {userTerreiros.length > 1 && (
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

              // ── Plan-based feature gating ──
              // Financial só disponível nos planos Axé e Orun
              if (item.id === 'financial' && !canAccess('financial', currentPlan)) return false;

              // Multi-Casas (terreiros) só no plano Orun
              if (item.id === 'terreiros' && !canAccess('multi_casas', currentPlan)) return false;

              // Comunicados (broadcast) disponível em todos os planos
              // (já tem controle por adminOnly)

              // Local Admin ('Administrador') sees everything (respeitando plano)
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

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 4, padding: '0.8rem', borderTop: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              <a href="https://www.facebook.com/ORUNapp.oficial" target="_blank" rel="noopener noreferrer" title="Facebook" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', transition: 'all 0.25s', textDecoration: 'none' }}
                onMouseOver={e => { e.currentTarget.style.background = '#1877f2'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.transform = 'none'; }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://www.instagram.com/orunapp.oficial/" target="_blank" rel="noopener noreferrer" title="Instagram" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', transition: 'all 0.25s', textDecoration: 'none' }}
                onMouseOver={e => { e.currentTarget.style.background = '#E1306C'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.transform = 'none'; }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="https://wa.me/554898237206" target="_blank" rel="noopener noreferrer" title="WhatsApp" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', transition: 'all 0.25s', textDecoration: 'none' }}
                onMouseOver={e => { e.currentTarget.style.background = '#25d366'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.transform = 'none'; }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            </div>
          </div>
          <button className="nav-item" onClick={() => { handleLogout(); setMobileMenuOpen(false); }} style={{ color: '#ff4c4c' }}>
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

      {/* ASSISTENTE DE IA (Apenas Admins) */}
      {isAdmin && <ChatWidget />}

      {/* BOTAO WHATSAPP SUPORTE */}
      <a href="https://wa.me/554898237206" target="_blank" rel="noopener noreferrer" style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#25d366', color: '#fff', borderRadius: '50px', padding: '12px 20px', textDecoration: 'none', fontWeight: 'bold', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
        Suporte
      </a>
    </div>
  );

  return isMember ? (
    <NotificationGate>{layoutContent}</NotificationGate>
  ) : layoutContent;
}
