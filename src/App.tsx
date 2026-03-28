import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Events from './pages/Events';
import Members from './pages/Members';
import RegisterTerreiro from './pages/RegisterTerreiro';
import Terreiros from './pages/Terreiros';
import Financial from './pages/Financial';
import SpiritualHub from './pages/SpiritualHub';
import { useStore } from './store/useStore';

function App() {
  const theme = useStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
