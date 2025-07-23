import React, { useState, useEffect, useCallback } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';

function DistribusiLink() {
  console.log("Component: Rendering DistribusiLink page");

  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  const fetchDevices = useCallback(async () => {
    console.log("DistribusiLink.jsx: Fetching devices.");
    try {
      const { data, error } = await supabase.from('devices').select('id, device_name');
      if (error) throw error;
      setDevices(data);
    } catch (error) {
      console.error("DistribusiLink.jsx: Error fetching devices:", error.message);
      setError("Gagal memuat daftar perangkat.");
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleSend = async (e) => {
    e.preventDefault();
    console.log("DistribusiLink.jsx: handleSend started.");
    
    if (!selectedDevice || !message.trim()) {
      setError("Silakan pilih perangkat dan isi pesan terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess('');

    try {
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          device_id: selectedDevice,
          content: message.trim(),
        });

      if (insertError) throw insertError;

      console.log("DistribusiLink.jsx: Message sent successfully.");
      setSuccess(`Pesan berhasil dikirim ke perangkat yang dipilih!`);
      setMessage(''); // Kosongkan textarea setelah berhasil
    } catch (error) {
      console.error("DistribusiLink.jsx: Error sending message:", error.message);
      setError("Gagal mengirim pesan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 text-white">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-100 mb-2">Distribusi Link</h1>
        <p className="text-gray-400 mb-8">Kirim pesan atau link ke perangkat terdaftar secara real-time.</p>

        <div className="p-8 bg-gray-800/50 rounded-lg shadow-lg">
          <form onSubmit={handleSend} className="space-y-6">
            <div>
              <label htmlFor="device-select" className="block mb-2 text-sm font-medium text-gray-300">
                Kirim Ke Perangkat
              </label>
              <select
                id="device-select"
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full px-4 py-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="" disabled>-- Pilih HP --</option>
                {devices.map(device => (
                  <option key={device.id} value={device.id}>
                    {device.device_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="message-content" className="block mb-2 text-sm font-medium text-gray-300">
                Isi Pesan / Link
              </label>
              <textarea
                id="message-content"
                rows="4"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://google.com"
              ></textarea>
            </div>
            
            {error && <p className="text-sm text-center text-red-400">{error}</p>}
            {success && <p className="text-sm text-center text-green-400">{success}</p>}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3 px-4 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed"
              >
                <FaPaperPlane className="mr-2" />
                {loading ? 'Mengirim...' : 'Kirim Pesan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default DistribusiLink;
