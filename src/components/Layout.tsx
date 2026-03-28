import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { LayoutDashboard, Users, Calendar, Settings, LogOut, Hexagon, Search, Bell, ChevronDown, Building2, DollarSign, Lock, Sparkles, Sun, Moon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import bgImage from '../assets/bg.png';
import '../App.css';

export default function Layout() {
  const currentUser = useStore(state => state.currentUser);
  const logout = useStore(state => state.logout);
  const getCurrentTerreiro = useStore(state => state.getCurrentTerreiro);
  const getUserTerreiros = useStore(state => state.getUserTerreiros);
  const switchTerreiro = useStore(state => state.switchTerreiro);
  const theme = useStore(state => state.theme);
  const toggleTheme = useStore(state => state.toggleTheme);
  const navigate = useNavigate();
  const location = useLocation();
  const [showTerreiroDropdown, setShowTerreiroDropdown] = useState(false);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const currentTerreiro = getCurrentTerreiro();
  const userTerreiros = getUserTerreiros();
  const isAdmin = currentUser.role === 'ADMIN';

  const menuItems = [
    { id: 'dashboard', path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', adminOnly: false },
    { id: 'hub-ia', path: '/hub-ia', icon: Sparkles, label: 'Centro de IA', adminOnly: false },
    { id: 'members', path: '/members', icon: Users, label: isAdmin ? 'Membros da Casa' : 'Meu Perfil', adminOnly: false },
    { id: 'events', path: '/events', icon: Calendar, label: 'Agenda e Eventos', adminOnly: false },
    { id: 'financial', path: '/financeiro', icon: DollarSign, label: 'Financeiro', adminOnly: false },
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

  return (
    <div className="app-container">
      <div className="bg-container">
        <img src={bgImage} alt="Background" className="bg-image" />
        <div className="bg-overlay"></div>
      </div>

      <div className="app-layout">
        {/* Sidebar */}
        <aside className="sidebar glass-panel">
          <div className="logo-container">
            {currentTerreiro?.logoUrl ? (
               <img src={currentTerreiro.logoUrl} alt="Logo" style={{ width: 32, height: 32, borderRadius: 8 }} />
            ) : (
               <Hexagon size={32} className="logo-icon glow-icon" color="var(--neon-cyan)" />
            )}
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
            {menuItems.filter(item => !item.adminOnly || isAdmin).map((item) => (
              <button
                key={item.id}
                className={`nav-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <item.icon size={20} className="nav-icon" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <button className="nav-item" onClick={handleLogout} style={{ color: '#ff4c4c', marginTop: 'auto' }}>
            <LogOut size={20} className="nav-icon" />
            <span>Sair</span>
          </button>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <header className="header glass-panel">
            <div className="search-bar">
              <Search size={18} className="search-icon" />
              <input type="text" placeholder="Buscar..." className="search-input" />
            </div>
            
            <div className="header-actions">
              <button className="icon-btn glow-fx" onClick={toggleTheme} title="Alternar Tema Claro/Escuro" style={{ color: theme === 'dark' ? 'var(--accent-gold)' : 'var(--neon-purple)' }}>
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button className="icon-btn glow-fx" title="Notificações">
                <Bell size={20} />
              </button>
              <div className="user-profile">
                {currentUser.photoUrl ? (
                  <img src={currentUser.photoUrl} alt="Avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--neon-cyan)' }} />
                ) : (
                  <div className="avatar">{currentUser.nomeCompleto.charAt(0)}</div>
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
}
