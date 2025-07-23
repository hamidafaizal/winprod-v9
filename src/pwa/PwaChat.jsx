import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCopy, FaSignOutAlt, FaTrash } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';

function PwaChat() {
  const [deviceName, setDeviceName] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const mainContentRef = useRef(null);
  const pollIntervalRef = useRef(null); // Ref untuk menyimpan ID interval

  const handleLogout = useCallback(() => {
    console.log("PwaChat.jsx: Logging out.");
    localStorage.removeItem('pwa_device_id');
    localStorage.removeItem('pwa_device_name');
    navigate('/pwa/login');
  }, [navigate]);

  const scrollToBottom = () => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = mainContentRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const deviceId = localStorage.getItem('pwa_device_id');
    const name = localStorage.getItem('pwa_device_name');

    if (!deviceId || !name) {
      handleLogout();
      return;
    }
    
    setDeviceName(name);

    const fetchMessages = async () => {
      console.log("PwaChat.jsx: Polling for messages for device ID:", deviceId);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("PwaChat.jsx: Error polling messages:", error.message);
      } else {
        setMessages(prevMessages => {
          const prevIds = new Set(prevMessages.map(m => m.id));
          const newIds = new Set(data.map(m => m.id));
          
          if (prevIds.size === newIds.size && [...prevIds].every(id => newIds.has(id))) {
            return prevMessages;
          }
          return data;
        });
      }
      if (loading) setLoading(false);
    };

    fetchMessages();
    // Simpan ID interval ke ref agar bisa diakses di fungsi lain
    pollIntervalRef.current = setInterval(fetchMessages, 3000);

    const deleteChannel = supabase.channel('device-deletions')
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'devices', filter: `id=eq.${deviceId}` },
        () => handleLogout()
      )
      .subscribe();

    return () => {
      console.log("PwaChat.jsx: Clearing poll interval and unsubscribing.");
      clearInterval(pollIntervalRef.current);
      supabase.removeChannel(deleteChannel);
    };
  }, [handleLogout, loading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleDeleteMessage = async (messageId) => {
    console.log("PwaChat.jsx: Deleting message with ID:", messageId);
    
    // 1. Hentikan polling sementara
    clearInterval(pollIntervalRef.current);
    console.log("PwaChat.jsx: Polling paused.");

    // 2. Update UI secara optimis
    setMessages(currentMessages => currentMessages.filter(msg => msg.id !== messageId));

    // 3. Hapus dari DB
    const { error } = await supabase.from('messages').delete().eq('id', messageId);

    if (error) {
      console.error("PwaChat.jsx: Error deleting message:", error.message);
      alert("Gagal menghapus pesan. Memuat ulang daftar pesan.");
      // Jika gagal, fetch ulang untuk sinkronisasi
      const deviceId = localStorage.getItem('pwa_device_id');
      const { data } = await supabase.from('messages').select('*').eq('device_id', deviceId).order('created_at', { ascending: true });
      setMessages(data || []);
    } else {
      console.log("PwaChat.jsx: Message successfully deleted from DB.");
    }

    // 4. Mulai lagi polling setelah proses selesai
    const deviceId = localStorage.getItem('pwa_device_id');
    const fetchMessages = async () => {
        const { data } = await supabase.from('messages').select('*').eq('device_id', deviceId).order('created_at', { ascending: true });
        setMessages(data || []);
    };
    pollIntervalRef.current = setInterval(fetchMessages, 3000);
    console.log("PwaChat.jsx: Polling resumed.");
  };
  
  const handleDeleteAll = async () => {
    const deviceId = localStorage.getItem('pwa_device_id');
    if (!window.confirm("Apakah Anda yakin ingin menghapus semua pesan?")) return;
    
    // Hentikan polling sementara
    clearInterval(pollIntervalRef.current);
    console.log("PwaChat.jsx: Polling paused for Delete All.");

    console.log("PwaChat.jsx: Deleting all messages for device ID:", deviceId);
    const { error } = await supabase.from('messages').delete().eq('device_id', deviceId);
    
    if (error) {
      console.error("PwaChat.jsx: Error deleting messages:", error.message);
      alert("Gagal menghapus pesan.");
    } else {
      setMessages([]);
    }

    // Mulai lagi polling
    const fetchMessages = async () => {
        const { data } = await supabase.from('messages').select('*').eq('device_id', deviceId).order('created_at', { ascending: true });
        setMessages(data || []);
    };
    pollIntervalRef.current = setInterval(fetchMessages, 3000);
    console.log("PwaChat.jsx: Polling resumed after Delete All.");
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
        {loading ? (
          <p className="text-center text-gray-400">Memuat pesan...</p>
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
                    className="p-1 rounded-full bg-gray-600 text-gray-300"
                    title="Salin Pesan"
                  >
                    <FaCopy size={12} />
                  </button>
                  <button 
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="p-1 rounded-full bg-red-800/70 text-red-300"
                    title="Hapus Pesan"
                  >
                    <FaTrash size={12} />
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
          className="w-full flex items-center justify-center py-2 px-4 font-semibold text-white bg-red-600/80 rounded-lg hover:bg-red-700/80"
        >
          <FaTrash className="mr-2" />
          Hapus Semua Pesan
        </button>
      </footer>
    </div>
  );
}

export default PwaChat;
