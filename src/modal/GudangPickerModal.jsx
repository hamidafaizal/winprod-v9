import React, { useState, useEffect } from 'react';
import { FaTimes, FaDatabase, FaSpinner } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';

function GudangPickerModal({ isOpen, onClose, onSelect }) {
  const [gudangList, setGudangList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGudangLinks = async () => {
      if (!isOpen) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('gudang_links')
        .select('id, nama_gudang, links')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching gudang list:", error);
        alert("Gagal memuat daftar gudang.");
      } else {
        setGudangList(data);
      }
      setLoading(false);
    };

    fetchGudangLinks();
  }, [isOpen]);

  const handleSelect = (gudang) => {
    onSelect(gudang);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl p-8 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <FaTimes size={20} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">Pilih Gudang untuk Dibagikan</h2>
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <FaSpinner className="animate-spin text-3xl text-gray-400" />
            </div>
          ) : gudangList.length === 0 ? (
            <p className="text-center text-gray-500">Gudang kosong.</p>
          ) : (
            <ul className="space-y-3">
              {gudangList.map(gudang => (
                <li key={gudang.id}>
                  <button
                    onClick={() => handleSelect(gudang)}
                    className="w-full flex justify-between items-center text-left p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors duration-200"
                  >
                    <div className="flex items-center">
                      <FaDatabase className="text-teal-400 mr-4" />
                      <div>
                        <p className="font-semibold text-white">{gudang.nama_gudang}</p>
                        <p className="text-sm text-gray-400">{gudang.links.length} link</p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default GudangPickerModal;
