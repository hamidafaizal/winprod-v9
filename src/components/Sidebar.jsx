import React from 'react';

// Sidebar dengan tema gelap permanen.
function Sidebar({ isOpen, toggle }) {
  console.log("Component: Rendering Sidebar, isOpen:", isOpen);

  return (
    <aside className={`
      relative
      h-screen 
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

      {/* Judul Aplikasi */}
      <div className={`mb-10 flex items-center h-[52px]`}>
        <h2 className={`text-2xl font-bold text-gray-100 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          App
        </h2>
      </div>

      {/* Menu Navigasi */}
      <nav>
        <ul>
          <li>
            <a 
              href="#" 
              className={`
                flex items-center p-3 rounded-lg font-semibold 
                text-gray-200
                bg-gray-700/50
                hover:bg-gray-600/60
                transition-colors duration-200 overflow-hidden
                ${!isOpen && 'justify-center'}
              `}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className={`
                transition-all duration-200
                ${isOpen ? 'ml-4' : 'w-0 opacity-0'}
              `}>
                Dashboard
              </span>
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
