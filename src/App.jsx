import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';

// Halaman Dashboard Utama
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ManajemenPerangkat from './pages/ManajemenPerangkat';
import DistribusiLink from './pages/DistribusiLink'; // Impor halaman baru

// Halaman PWA
import PwaLayout from './pwa/PwaLayout';
import PwaLogin from './pwa/PwaLogin';
import PwaChat from './pwa/PwaChat';

// Layout utama yang mencakup Sidebar dan konten utama
function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error.message);
    } else {
      navigate('/login');
    }
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
    <div className="flex w-full min-h-screen bg-gray-900">
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggle={toggleSidebar}
        onLogout={handleLogout}
      />
      <main className="flex-1 transition-all duration-300">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/devices" element={<ManajemenPerangkat />} />
          <Route path="/links" element={<DistribusiLink />} /> {/* Daftarkan rute baru */}
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const isPwaRoute = location.pathname.startsWith('/pwa');
    if (isPwaRoute) {
      return; 
    }

    if (!session && !['/login', '/register'].includes(location.pathname)) {
      navigate('/login');
    } else if (session && ['/login', '/register'].includes(location.pathname)) {
      navigate('/');
    }
  }, [session, navigate, location.pathname]);

  if (session === null && !['/login', '/register'].includes(location.pathname) && !location.pathname.startsWith('/pwa')) {
    return null;
  }

  return (
    <Routes>
      {/* Rute untuk PWA (tidak memerlukan sesi user) */}
      <Route path="/pwa" element={<PwaLayout />}>
        <Route path="login" element={<PwaLogin />} />
        <Route path="chat" element={<PwaChat />} />
      </Route>

      {/* Rute untuk Dashboard Utama */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/*" element={session ? <MainLayout /> : null} />
    </Routes>
  );
}

export default App;
