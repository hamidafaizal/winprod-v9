import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

function PwaLogin() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("PwaLogin.jsx: Checking for existing session on component mount.");
    const deviceId = localStorage.getItem('pwa_device_id');
    if (deviceId) {
      console.log("PwaLogin.jsx: Found existing deviceId, navigating to /chat.");
      navigate('/chat');
    } else {
      console.log("PwaLogin.jsx: No existing deviceId found, staying on login page.");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("PwaLogin.jsx: handleLogin started.");
    setLoading(true);
    setError(null);

    if (!code.trim() || code.trim().length !== 6) {
      setError("Kode verifikasi harus 6 digit angka.");
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('devices')
        .select('id, device_name')
        .eq('verification_code', code.trim())
        .single();

      if (fetchError || !data) {
        throw new Error("Kode verifikasi tidak valid atau tidak ditemukan.");
      }

      localStorage.setItem('pwa_device_id', data.id);
      localStorage.setItem('pwa_device_name', data.device_name);
      console.log("PwaLogin.jsx: Login successful for device:", data.device_name);

      navigate('/chat'); // Arahkan ke /chat setelah login

    } catch (error) {
      console.error("PwaLogin.jsx: Error during PWA login:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-sm p-8 space-y-6 bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-white">Verifikasi Perangkat</h1>
        <p className="text-center text-sm text-gray-400">
          Masukkan 6 digit kode verifikasi dari dashboard Anda.
        </p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="verificationCode" className="sr-only">Kode Verifikasi</label>
            <input
              // Menggunakan type="tel" untuk memunculkan keypad numerik di HP
              type="tel"
              id="verificationCode"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))} // Hanya izinkan angka
              maxLength="6"
              className="w-full px-4 py-3 text-center text-3xl font-semibold tracking-[.2em] text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="123456"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Memverifikasi...' : 'Hubungkan Perangkat'}
          </button>
          {error && <p className="text-sm text-center text-red-400">{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default PwaLogin;