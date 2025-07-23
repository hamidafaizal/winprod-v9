import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCopy, FaSignOutAlt, FaTrash, FaSpinner } from 'react-icons/fa'; // FaSpinner ditambahkan
import { supabase } from '../lib/supabaseClient';

function PwaChat() {
  const [deviceName, setDeviceName] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null); // State untuk melacak pesan yang sedang dihapus
  const navigate = useNavigate();
  const mainContentRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const handleLogout = useCallback(() => {
    console.log("PwaChat.jsx: Logging out.");
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    localStorage.removeItem('pwa_device_id');
    localStorage.removeItem('pwa_device_name');
    navigate('/pwa/login');
  }, [navigate]);

  const scrollToBottom = () => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = mainContentRef.current.scrollHeight;
    }
  };

  const fetchMessages = useCallback(async () => {
    const deviceId = localStorage.getItem('pwa_device_id');
    if (!deviceId) return;

    console.log("PwaChat.jsx: Polling for messages for device ID:", deviceId);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("PwaChat.jsx: Error polling messages:", error.message);
    } else if (data) {
      setMessages(data);
    }
    
    if (loading) setLoading(false);
  }, [loading]);

  const startPolling = useCallback(() => {
    // Pastikan tidak ada interval ganda
    clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(fetchMessages, 3000);
    console.log("PwaChat.jsx: Polling resumed.");
  }, [fetchMessages]);

  const stopPolling = () => {
    clearInterval(pollIntervalRef.current);
    console.log("PwaChat.jsx: Polling paused.");
  };

  useEffect(() => {
    const deviceId = localStorage.getItem('pwa_device_id');
    const name = localStorage.getItem('pwa_device_name');

    if (!deviceId || !name) {
      handleLogout();
      return;
    }
    
    setDeviceName(name);

    fetchMessages();
    startPolling();

    const deleteChannel = supabase.channel('device-deletions')
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'devices', filter: `id=eq.${deviceId}` },
        () => {
          console.log("PwaChat.jsx: Device deleted event received, logging out.");
          alert('Perangkat ini telah dihapus dari dashboard. Anda akan dikeluarkan.');
          handleLogout();
        }
      )
      .subscribe();

    return () => {
      console.log("PwaChat.jsx: Cleanup on unmount.");
      clearInterval(pollIntervalRef.current);
      supabase.removeChannel(deleteChannel);
    };
  }, [fetchMessages, handleLogout, startPolling]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    // Anda bisa menambahkan notifikasi "Tersalin!" di sini jika mau
  };

  const handleDeleteMessage = async (messageId) => {
    // Konfirmasi sebelum menghapus
    if (!window.confirm("Apakah Anda yakin ingin menghapus pesan ini?")) {
      return;
    }
    
    stopPolling();
    setDeletingId(messageId); // Tampilkan indikator loading untuk pesan spesifik

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    setDeletingId(null); // Hentikan loading

    if (error) {
      console.error("PwaChat.jsx: Error deleting message:", error.message);
      alert(`Gagal menghapus pesan: ${error.message}`);
    } else {
      console.log("PwaChat.jsx: Message successfully deleted from DB.");
      // Hapus pesan dari state secara manual agar UI update lebih cepat
      setMessages(currentMessages => currentMessages.filter(msg => msg.id !== messageId));
    }

    startPolling();
  };
  
  const handleDeleteAll = async () => {
    const deviceId = localStorage.getItem('pwa_device_id');
    if (!deviceId) return;

    if (!window.confirm("Apakah Anda yakin ingin menghapus SEMUA pesan? Tindakan ini tidak dapat dibatalkan.")) {
      return;
    }
    
    stopPolling();
    setLoading(true); // Gunakan loading global untuk proses ini

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('device_id', deviceId);
    
    if (error) {
      console.error("PwaChat.jsx: Error deleting all messages:", error.message);
      alert(`Gagal menghapus semua pesan: ${error.message}`);
      // Jika gagal, fetch ulang data untuk sinkronisasi
      await fetchMessages();
    } else {
      console.log("PwaChat.jsx: All messages deleted successfully.");
      setMessages([]);
    }

    setLoading(false);
    startPolling();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="flex items-center justify-between p-4 bg-gray-800 shadow-md">
        <h1 className="text-xl font-bold">{deviceName || 'Memuat...'}</h1>
        <button onClick={handleLogout} className="text-gray-300 hover:text-white" title="Logout">
          <FaSignOutAlt size={20} />
        </button>
      </header>

      <main ref={mainContentRef} className="flex-1 p-4 overflow-y-auto space-y-4">
        {loading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <FaSpinner className="animate-spin text-4xl text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-500">Belum ada pesan.</p>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className="flex">
              <div className="group relative max-w-xs lg:max-w-md p-3 rounded-lg bg-gray-700">
                <p className="break-words">{msg.content}</p>
                <div className="absolute top-1 right-1 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleCopy(msg.content)}
                    className="p-1 rounded-full bg-gray-600 hover:bg-gray-500 text-gray-300"
                    title="Salin Pesan"
                  >
                    <FaCopy size={12} />
                  </button>
                  <button 
                    onClick={() => handleDeleteMessage(msg.id)}
                    disabled={deletingId === msg.id}
                    className="p-1 rounded-full bg-red-800/70 hover:bg-red-700/70 text-red-300 disabled:opacity-50"
                    title="Hapus Pesan"
                  >
                    {deletingId === msg.id ? <FaSpinner className="animate-spin" size={12} /> : <FaTrash size={12} />}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      <footer className="p-4 bg-gray-800">
        <button 
          onClick={handleDeleteAll}
          disabled={loading || messages.length === 0}
          className="w-full flex items-center justify-center py-2 px-4 font-semibold text-white bg-red-600/80 rounded-lg hover:bg-red-700/80 disabled:bg-red-800/50 disabled:cursor-not-allowed"
        >
          {loading ? <FaSpinner className="animate-spin mr-2" /> : <FaTrash className="mr-2" />}
          Hapus Semua Pesan
        </button>
      </footer>
    </div>
  );
}

export default PwaChat;
