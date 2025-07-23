import React, { useState } from 'react';
import { FaTimes, FaTrash } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';

function HapusPerangkatModal({ isOpen, onClose, device, onDeleteSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    console.log("HapusPerangkatModal.jsx: handleDelete started for device ID:", device?.id);
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('devices')
        .delete()
        .eq('id', device.id);

      if (deleteError) throw deleteError;

      console.log("HapusPerangkatModal.jsx: Device deleted successfully.");
      onDeleteSuccess(); // Refresh data di halaman utama
      onClose(); // Tutup modal
    } catch (error) {
      console.error("HapusPerangkatModal.jsx: Error deleting device:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="relative w-full max-w-md p-8 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <FaTimes size={20} />
        </button>
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900/50 mb-4">
            <FaTrash className="h-6 w-6 text-red-400" />
          </div>
          <h3 className="text-lg font-medium leading-6 text-white">Hapus Perangkat</h3>
          <div className="mt-2 px-7 py-3">
            <p className="text-sm text-gray-400">
              Apakah Anda yakin ingin menghapus perangkat <strong className="text-white">{device?.device_name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
        </div>
        <div className="flex justify-center mt-8 space-x-4">
          <button onClick={onClose} className="px-6 py-2 font-semibold text-gray-300 bg-gray-600 rounded-lg hover:bg-gray-500">
            Batal
          </button>
          <button onClick={handleDelete} disabled={loading} className="px-6 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-400">
            {loading ? 'Menghapus...' : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default HapusPerangkatModal;
