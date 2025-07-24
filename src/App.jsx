import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';

// Halaman Dashboard Utama
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ManajemenPerangkat from './pages/ManajemenPerangkat';
import DistribusiLink from './pages/DistribusiLink';
import Riset from './pages/Riset';

// Halaman PWA
import PwaLayout from './pwa/PwaLayout';
import PwaLogin from './pwa/PwaLogin';
import PwaChat from './pwa/PwaChat';

// --- Komponen Baru untuk Routing Berdasarkan Domain ---
function AppRouter() {
  const hostname = window.location.hostname;

  if (hostname.startsWith('pwa.')) {
    return (
      <Routes>
        <Route path="/" element={<PwaLayout />}>
          <Route index element={<PwaLogin />} />
          <Route path="login" element={<PwaLogin />} />
          <Route path="chat" element={<PwaChat />} />
        </Route>
      </Routes>
    );
  }

  return <DashboardApp />;
}


// --- Layout Dashboard Utama ---
function MainLayout({ onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    // Perubahan di sini: Mengatur tinggi layar penuh dan menyembunyikan overflow
    <div className="flex w-full h-screen bg-gray-900 overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggle={toggleSidebar}
        onLogout={onLogout}
      />
      {/* Perubahan di sini: Menambahkan overflow-y-auto agar hanya area ini yang scroll */}
      <main className="flex-1 transition-all duration-300 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/devices" element={<ManajemenPerangkat />} />
          <Route path="/links" element={<DistribusiLink />} />
          <Route path="/riset" element={<Riset />} />
        </Routes>
      </main>
    </div>
  );
}


// --- Aplikasi Dashboard (Logika Sesi) ---
function DashboardApp() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const authRoutes = ['/login', '/register'];
    const isAuthRoute = authRoutes.includes(location.pathname);

    if (!session && !isAuthRoute) {
      navigate('/login');
    } else if (session && isAuthRoute) {
      navigate('/');
    }
  }, [session, loading, navigate, location.pathname]);

  if (loading) {
    return null;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/*" element={session ? <MainLayout onLogout={handleLogout} /> : null} />
    </Routes>
  );
}


// --- Komponen App Utama ---
function App() {
  return <AppRouter />;
}

export default App;
