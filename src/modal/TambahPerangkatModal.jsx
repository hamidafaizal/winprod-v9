import React, { useState, useEffect } from 'react';
import { FaTimes, FaCopy } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';

// Fungsi untuk menghasilkan kode verifikasi 6 digit angka
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
      const newCode = generateCode();
      setVerificationCode(newCode);
      setDeviceName(''); // Reset nama perangkat
      setError(null); // Reset error
      console.log("TambahPerangkatModal.jsx: New 6-digit verification code generated:", newCode);
    }
  }, [isOpen]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(verificationCode);
    console.log("Copied to clipboard:", verificationCode);
    // Anda bisa menambahkan notifikasi "Tersalin!" di sini
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User tidak ditemukan. Silakan login kembali.");

      const { error: insertError } = await supabase
        .from('devices')
        .insert({
          device_name: deviceName,
          verification_code: verificationCode,
          user_id: user.id,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error("Gagal menyimpan: Kode verifikasi sudah ada. Coba buat lagi.");
        }
        throw insertError;
      }

      console.log("TambahPerangkatModal.jsx: Device saved successfully.");
      onSaveSuccess();
      onClose();

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
              placeholder="Contoh: HP Samsung A52"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">
              Kode Verifikasi (6 Digit)
            </label>
            <div className="flex items-center justify-between p-4 bg-gray-900 rounded-md">
              <span className="font-mono text-2xl tracking-widest text-green-400">
                {verificationCode}
              </span>
              <button onClick={handleCopyCode} className="text-gray-400 hover:text-white" title="Salin Kode">
                <FaCopy size={18} />
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Masukkan 6 digit kode ini di aplikasi pada perangkat HP Anda.
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
