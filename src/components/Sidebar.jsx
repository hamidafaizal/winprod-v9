import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { FaHome, FaServer, FaLink } from 'react-icons/fa'; // Menambahkan FaLink

// Sidebar dengan tema gelap permanen.
function Sidebar({ isOpen, toggle, onLogout }) {
  console.log("Component: Rendering Sidebar, isOpen:", isOpen);
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    {
      href: '/',
      label: 'Dashboard',
      icon: <FaHome className="h-6 w-6 flex-shrink-0" />,
    },
    {
      href: '/devices',
      label: 'Manajemen Perangkat',
      icon: <FaServer className="h-6 w-6 flex-shrink-0" />,
    },
    {
      href: '/links', // URL untuk halaman baru
      label: 'Distribusi Link',
      icon: <FaLink className="h-6 w-6 flex-shrink-0" />, // Ikon baru
    },
  ];

  return (
    <aside className={`
      relative
      h-screen 
      flex
      flex-col
      flex-shrink-0 
      bg-gray-800/30
      backdrop-blur-xl 
      border-r 
      border-gray-700/50
      transition-all 
      duration-300
      ${isOpen ? 'w-72 p-6' : 'w-20 p-3'} 
    `}>
      
      {/* Tombol Toggle Sidebar */}
      <button 
        onClick={toggle} 
        className="
          absolute 
          -right-4 
          top-8 
          bg-gray-700
          hover:bg-gray-600
          p-2 
          rounded-full 
          shadow-md 
          transition-all
          duration-300
          z-10
        ">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-5 w-5 text-gray-300 transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Konten Atas (Judul & Navigasi) */}
      <div className="flex-grow">
        {/* Judul Aplikasi */}
        <div className={`mb-10 flex items-center h-[52px]`}>
          <h2 className={`text-2xl font-bold text-gray-100 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            App
          </h2>
        </div>

        {/* Menu Navigasi */}
        <nav>
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link 
                  to={item.href} 
                  className={`
                    flex items-center p-3 rounded-lg font-semibold 
                    transition-colors duration-200 overflow-hidden
                    ${currentPath === item.href 
                      ? 'bg-gray-700/50 text-white' 
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                    }
                    ${!isOpen && 'justify-center'}
                  `}>
                  {item.icon}
                  <span className={`
                    transition-all duration-200
                    ${isOpen ? 'ml-4' : 'w-0 opacity-0'}
                  `}>
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      {/* Konten Bawah (Tombol Logout) */}
      <div>
        <button 
          onClick={onLogout}
          className={`
            flex items-center p-3 rounded-lg font-semibold w-full
            text-gray-200
            hover:bg-red-500/30
            transition-colors duration-200 overflow-hidden
            ${!isOpen && 'justify-center'}
          `}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className={`
            transition-all duration-200
            ${isOpen ? 'ml-4' : 'w-0 opacity-0'}
          `}>
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
