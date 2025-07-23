import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';

// Layout utama yang mencakup Sidebar dan konten utama
function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    console.log("App.jsx (MainLayout): Sidebar toggled, new state:", !isSidebarOpen);
  };
  
  const handleLogout = async () => {
    console.log("App.jsx (MainLayout): handleLogout initiated.");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error.message);
    } else {
      console.log("App.jsx (MainLayout): Logout successful.");
      navigate('/login'); // Arahkan ke halaman login setelah logout
    }
  };

  useEffect(() => {
    console.log("App.jsx (MainLayout): useEffect for resize listener is running");
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      console.log("App.jsx (MainLayout): Cleaning up resize listener");
      window.removeEventListener('resize', handleResize);
    };
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
          {/* Tambahkan rute lain untuk layout utama di sini */}
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
    console.log("App.jsx: useEffect for auth state change is running.");
    // Cek sesi yang sudah ada
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      console.log("App.jsx: Initial session check:", session);
    });

    // Dengarkan perubahan status otentikasi
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("App.jsx: Auth state changed, new session:", session);
      setSession(session);
    });

    return () => {
      console.log("App.jsx: Cleaning up auth state change subscription.");
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    console.log("App.jsx: useEffect for navigation is running. Session:", session);
    if (!session && !['/login', '/register'].includes(location.pathname)) {
      console.log("App.jsx: No session, navigating to /login");
      navigate('/login');
    } else if (session && ['/login', '/register'].includes(location.pathname)) {
      console.log("App.jsx: Session found, navigating to /");
      navigate('/');
    }
  }, [session, navigate, location.pathname]);

  // Tampilkan loading atau null selama sesi sedang diperiksa untuk pertama kali
  if (session === null && !['/login', '/register'].includes(location.pathname)) {
    return null; // Atau tampilkan komponen loading
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/*" element={session ? <MainLayout /> : null} />
    </Routes>
  );
}

export default App;
