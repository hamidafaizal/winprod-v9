import React, { useState, useEffect } from 'react';
import { FaTimes, FaCopy } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';

// Fungsi untuk menghasilkan kode verifikasi acak
const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Komponen Modal untuk menambah perangkat baru
function TambahPerangkatModal({ isOpen, onClose, onSaveSuccess }) {
  console.log("Component: Rendering TambahPerangkatModal, isOpen:", isOpen);

  const [deviceName, setDeviceName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generate kode baru setiap kali modal dibuka
  useEffect(() => {
    if (isOpen) {
      const newCode = `${generateCode()}-${generateCode()}-${generateCode()}-${generateCode()}`;
      setVerificationCode(newCode);
      console.log("TambahPerangkatModal.jsx: New verification code generated:", newCode);
    }
  }, [isOpen]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(verificationCode);
    console.log("Copied to clipboard:", verificationCode);
  };

  const handleSave = async () => {
    console.log("TambahPerangkatModal.jsx: handleSave started.");
    setError(null);

    if (!deviceName.trim()) {
      setError("Nama perangkat tidak boleh kosong.");
      return;
    }

    setLoading(true);

    try {
      // 1. Dapatkan user yang sedang login
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("User tidak ditemukan. Silakan login kembali.");

      // 2. Simpan data ke tabel 'devices'
      const { error: insertError } = await supabase
        .from('devices')
        .insert({
          device_name: deviceName,
          verification_code: verificationCode,
          user_id: user.id,
        });

      if (insertError) {
        // Cek jika error karena kode verifikasi duplikat
        if (insertError.code === '23505') { // Kode error untuk unique violation
          throw new Error("Gagal menyimpan: Kode verifikasi sudah ada. Coba lagi.");
        }
        throw insertError;
      }

      console.log("TambahPerangkatModal.jsx: Device saved successfully.");
      onSaveSuccess(); // Panggil fungsi untuk refresh data di halaman utama
      onClose(); // Tutup modal

    } catch (error) {
      console.error("TambahPerangkatModal.jsx: Error saving device:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-lg p-8 bg-gray-800 border border-gray-700 rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()} 
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <FaTimes size={20} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">Tambah Perangkat Baru</h2>
        <div className="space-y-6">
          <div>
            <label htmlFor="deviceName" className="block mb-2 text-sm font-medium text-gray-300">
              Nama Perangkat
            </label>
            <input
              type="text"
              id="deviceName"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="w-full px-4 py-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Masukkan nama HP"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">
              Kode Verifikasi
            </label>
            <div className="flex items-center justify-between p-4 bg-gray-900 rounded-md">
              <span className="font-mono text-lg tracking-widest text-green-400">
                {verificationCode}
              </span>
              <button onClick={handleCopyCode} className="text-gray-400 hover:text-white" title="Salin Kode">
                <FaCopy size={18} />
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Masukkan kode ini di aplikasi pada perangkat HP Anda untuk menghubungkannya.
            </p>
          </div>
          {error && <p className="text-sm text-center text-red-400 mt-4">{error}</p>}
        </div>
        <div className="flex justify-end mt-8 space-x-4">
          <button onClick={onClose} className="px-6 py-2 font-semibold text-gray-300 bg-gray-600 rounded-lg hover:bg-gray-500">
            Batal
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="px-6 py-2 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TambahPerangkatModal;
