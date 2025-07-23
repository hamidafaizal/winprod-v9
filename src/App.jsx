import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';

// Komponen utama aplikasi dengan tema gelap permanen.
function App() {
  // State untuk sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Fungsi untuk toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    console.log("App.jsx: Sidebar toggled, new state:", !isSidebarOpen);
  };

  // Logika responsif untuk sidebar
  useEffect(() => {
    console.log("App.jsx: useEffect for resize listener is running");
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
      console.log("App.jsx: Cleaning up resize listener");
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    // Latar belakang diatur ke gelap secara permanen.
    <div className="flex w-full min-h-screen bg-gray-900">
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggle={toggleSidebar}
      />
      <main className="flex-1 transition-all duration-300">
        <Dashboard />
      </main>
      {/* Tombol mode gelap/terang telah dihapus. */}
    </div>
  );
}

export default App;
