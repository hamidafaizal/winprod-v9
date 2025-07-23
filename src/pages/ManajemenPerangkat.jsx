import React, { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';
import TambahPerangkatModal from '../modal/TambahPerangkatModal';
import EditPerangkatModal from '../modal/EditPerangkatModal';
import HapusPerangkatModal from '../modal/HapusPerangkatModal';

function ManajemenPerangkat() {
  console.log("Component: Rendering ManajemenPerangkat page");
  
  // State untuk modals
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  
  // State untuk data
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDevices = useCallback(async () => {
    console.log("ManajemenPerangkat.jsx: Fetching devices from Supabase.");
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDevices(data);
    } catch (error) {
      console.error("ManajemenPerangkat.jsx: Error fetching devices:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleEditClick = (device) => {
    setSelectedDevice(device);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (device) => {
    setSelectedDevice(device);
    setDeleteModalOpen(true);
  };

  return (
    <>
      <div className="p-8 text-white">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-100">Manajemen Perangkat</h1>
          <button 
            onClick={() => setAddModalOpen(true)}
            className="flex items-center px-4 py-2 font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            <FaPlus className="mr-2" />
            Tambah Hp
          </button>
        </div>

        <div className="bg-gray-800/50 rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                <tr>
                  <th scope="col" className="px-6 py-3">Nama Perangkat</th>
                  <th scope="col" className="px-6 py-3">Kode Verifikasi</th>
                  <th scope="col" className="px-6 py-3">Tanggal Dibuat</th>
                  <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className="text-center p-8 text-gray-400">Memuat data...</td></tr>
                ) : error ? (
                  <tr><td colSpan="4" className="text-center p-8 text-red-400">Gagal memuat data: {error}</td></tr>
                ) : devices.length === 0 ? (
                  <tr><td colSpan="4" className="text-center p-8 text-gray-500">Belum ada perangkat.</td></tr>
                ) : (
                  devices.map((device) => (
                    <tr key={device.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                      <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{device.device_name}</td>
                      <td className="px-6 py-4 font-mono">{device.verification_code}</td>
                      <td className="px-6 py-4">{new Date(device.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center items-center space-x-3">
                          <button onClick={() => handleEditClick(device)} className="text-blue-400 hover:text-blue-300" title="Edit">
                            <FaEdit size={16} />
                          </button>
                          <button onClick={() => handleDeleteClick(device)} className="text-red-400 hover:text-red-300" title="Hapus">
                            <FaTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <TambahPerangkatModal 
        isOpen={isAddModalOpen} 
        onClose={() => setAddModalOpen(false)}
        onSaveSuccess={fetchDevices}
      />
      <EditPerangkatModal 
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        device={selectedDevice}
        onSaveSuccess={fetchDevices}
      />
      <HapusPerangkatModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        device={selectedDevice}
        onDeleteSuccess={fetchDevices}
      />
    </>
  );
}

export default ManajemenPerangkat;
