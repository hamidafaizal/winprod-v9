import React, { useState, useEffect } from 'react';
import { FaDownload } from 'react-icons/fa';

function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Mencegah browser menampilkan prompt default
      e.preventDefault();
      // Simpan event agar bisa dipicu nanti
      setDeferredPrompt(e);
      console.log("PwaInstallPrompt: 'beforeinstallprompt' event fired.");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    // Tampilkan prompt instalasi
    deferredPrompt.prompt();
    // Tunggu pengguna merespons prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PwaInstallPrompt: User response to the install prompt: ${outcome}`);
    // Kita hanya bisa menggunakan prompt sekali, jadi kita reset state
    setDeferredPrompt(null);
  };

  if (!deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleInstallClick}
        className="flex items-center justify-center px-4 py-3 font-semibold text-white bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <FaDownload className="mr-2" />
        Install App
      </button>
    </div>
  );
}

export default PwaInstallPrompt;
