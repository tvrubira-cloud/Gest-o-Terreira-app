import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import NotificationGate from './components/NotificationGate';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Events from './pages/Events';
import Members from './pages/Members';
import RegisterTerreiro from './pages/RegisterTerreiro';
import Terreiros from './pages/Terreiros';
import Financial from './pages/Financial';
import SpiritualHub from './pages/SpiritualHub';
import { useStore, dbToUser } from './store/useStore';
import { supabase } from './lib/supabase';

function App() {
  const theme = useStore((state) => state.theme);
  const initializeData = useStore((state) => state.initializeData);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Initialize Supabase data and restore session on startup
  useEffect(() => {
    const init = async () => {
      // Register Service Worker for Web Push support
      // NotificationGate handles service worker registration for FCM

      await initializeData();

      // Restore session from localStorage
      const session = localStorage.getItem('terreiro-session');
      if (session) {
        try {
          const { userId, terreiroId } = JSON.parse(session);
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .limit(1);

          if (!error && data?.[0]) {
            const user = dbToUser(data[0]);
            useStore.setState({
              currentUser: user,
              currentTerreiroId: terreiroId || user.terreiroId,
            });
          } else {
            if (error) console.error('❌ Erro ao restaurar sessão:', error.message);
            localStorage.removeItem('terreiro-session');
          }
        } catch {
          localStorage.removeItem('terreiro-session');
        }
      }
      setRestoring(false);
    };
    init();
  }, []);

  if (restoring) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#05050A', 
        color: '#00f0ff',
        fontFamily: 'Inter, sans-serif',
        fontSize: '1.2rem',
        gap: '1rem'
      }}>
        <div style={{
          width: 40, height: 40, border: '3px solid rgba(0,240,255,0.2)',
          borderTop: '3px solid #00f0ff', borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <span>Carregando sistema...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <NotificationGate>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="admin/new-terreiro" element={<RegisterTerreiro />} />
            <Route path="settings" element={<Settings />} />
            <Route path="terreiros" element={<Terreiros />} />
            <Route path="financeiro" element={<Financial />} />
            <Route path="events" element={<Events />} />
            <Route path="members" element={<Members />} />
            <Route path="hub-ia" element={<SpiritualHub />} />
          </Route>
        </Routes>
      </NotificationGate>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <filter id="remove-black-bg" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="
            1 0 0 0 0
            0 1 0 0 0
            0 0 1 0 0
            1 1 1 0 -0.1
          " />
        </filter>
      </svg>
    </BrowserRouter>
  );
}

export default App;
