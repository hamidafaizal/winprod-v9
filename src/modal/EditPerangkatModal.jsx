import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';

function EditPerangkatModal({ isOpen, onClose, device, onSaveSuccess }) {
  const [deviceName, setDeviceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Isi nama perangkat saat ini ketika modal dibuka
    if (device) {
      setDeviceName(device.device_name);
    }
  }, [device]);

  const handleSave = async () => {
    console.log("EditPerangkatModal.jsx: handleSave started.");
    setError(null);
    if (!deviceName.trim()) {
      setError("Nama perangkat tidak boleh kosong.");
      return;
    }
    setLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('devices')
        .update({ device_name: deviceName.trim() })
        .eq('id', device.id);

      if (updateError) throw updateError;

      console.log("EditPerangkatModal.jsx: Device updated successfully.");
      onSaveSuccess(); // Refresh data di halaman utama
      onClose(); // Tutup modal
    } catch (error) {
      console.error("EditPerangkatModal.jsx: Error updating device:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg p-8 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <FaTimes size={20} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">Edit Nama Perangkat</h2>
        <div>
          <label htmlFor="editDeviceName" className="block mb-2 text-sm font-medium text-gray-300">
            Nama Perangkat
          </label>
          <input
            type="text"
            id="editDeviceName"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            className="w-full px-4 py-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Masukkan nama HP baru"
          />
          {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
        </div>
        <div className="flex justify-end mt-8 space-x-4">
          <button onClick={onClose} className="px-6 py-2 font-semibold text-gray-300 bg-gray-600 rounded-lg hover:bg-gray-500">
            Batal
          </button>
          <button onClick={handleSave} disabled={loading} className="px-6 py-2 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400">
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditPerangkatModal;
