import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaPaperPlane, FaCog, FaSpinner, FaTrash, FaShareAlt } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';
import GudangPickerModal from '../modal/GudangPickerModal';

// Komponen untuk satu kartu Batch
const BatchCard = ({ batch, devices, onUpdate, onSend, onDelete, isSending }) => {
  const debounceTimeout = useRef(null);

  // Fungsi untuk menambahkan nomor pada tampilan
  const formatLinksForDisplay = (linksString) => {
    if (!linksString) return '';
    return linksString
      .split('\n')
      .map((link, index) => `${index + 1}. ${link}`)
      .join('\n');
  };

  // Fungsi untuk menghapus nomor dari input pengguna
  const cleanLinksFromInput = (inputString) => {
    return inputString
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, ''))
      .join('\n');
  };

  const debouncedUpdate = (updatedValue) => {
    clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      onUpdate(batch.id, updatedValue);
    }, 750);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    // Jika yang diubah adalah textarea links, bersihkan penomorannya
    if (name === 'links') {
      finalValue = cleanLinksFromInput(value);
    }
    
    const updatedBatch = { ...batch, [name]: finalValue };
    onUpdate(batch.id, updatedBatch, true); // Update state lokal
    debouncedUpdate({ [name]: finalValue }); // Kirim data bersih ke database
  };
  
  return (
    <div className="bg-gray-800/50 rounded-lg shadow-lg p-6 border border-gray-700/50 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-100">Batch #{batch.batch_index}</h3>
        <button 
          onClick={() => onDelete(batch.id)}
          className="p-2 text-gray-400 hover:text-red-400"
          title="Hapus Batch"
        >
          <FaTrash />
        </button>
      </div>
      <div className="space-y-4 flex-grow">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-300">Kirim Ke Perangkat</label>
          <select
            name="selected_device_id"
            value={batch.selected_device_id || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="" disabled>-- Pilih HP --</option>
            {devices.map(device => (
              <option key={device.id} value={device.id}>{device.device_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-300">Kapasitas Link</label>
          <input
            type="number"
            name="capacity"
            value={batch.capacity}
            onChange={handleInputChange}
            className="w-full px-4 py-3 text-white bg-gray-700 border border-gray-600 rounded-md"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-300">Daftar Link</label>
          <textarea
            name="links"
            rows="8"
            value={formatLinksForDisplay(batch.links || '')}
            onChange={handleInputChange}
            className="w-full px-4 py-3 text-white bg-gray-700 border border-gray-600 rounded-md font-mono text-sm"
            placeholder="1. https://link-pertama.com..."
          ></textarea>
        </div>
      </div>
      <button
        onClick={() => onSend(batch)}
        disabled={isSending || !batch.selected_device_id || !batch.links}
        className="mt-4 w-full flex items-center justify-center py-3 px-4 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-500/50 disabled:cursor-not-allowed"
      >
        {isSending ? <FaSpinner className="animate-spin mr-2" /> : <FaPaperPlane className="mr-2" />}
        {isSending ? 'Mengirim...' : 'Kirim Batch Ini'}
      </button>
    </div>
  );
};

function DistribusiLink() {
  const [devices, setDevices] = useState([]);
  const [batchCountInput, setBatchCountInput] = useState('');
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSettingCount, setIsSettingCount] = useState(false);
  const [sendingStatus, setSendingStatus] = useState({});
  const [isGudangModalOpen, setIsGudangModalOpen] = useState(false);
  const [error, setError] = useState(null);

  const fetchDevices = useCallback(async () => {
    const { data, error } = await supabase.from('devices').select('id, device_name');
    if (error) setError("Gagal memuat daftar perangkat.");
    else setDevices(data);
  }, []);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('batches').select('*').order('batch_index', { ascending: true });
    if (error) {
      setError("Gagal memuat data batch.");
      setBatches([]);
    } else {
      setBatches(data);
      setBatchCountInput(data.length.toString());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDevices();
    fetchBatches();
  }, [fetchDevices, fetchBatches]);

  const handleSetBatchCount = async () => {
    const targetCount = parseInt(batchCountInput, 10);
    if (isNaN(targetCount) || targetCount < 0) {
      alert("Masukkan jumlah batch yang valid.");
      return;
    }
    const currentCount = batches.length;
    if (targetCount === currentCount) return;

    setIsSettingCount(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsSettingCount(false);
      return;
    }

    if (targetCount > currentCount) {
      const numToAdd = targetCount - currentCount;
      const highestIndex = batches.reduce((max, b) => Math.max(max, b.batch_index), 0);
      const newBatches = Array.from({ length: numToAdd }, (_, i) => ({
        user_id: user.id,
        batch_index: highestIndex + i + 1,
      }));
      const { error } = await supabase.from('batches').insert(newBatches);
      if (error) alert(`Gagal menambah batch: ${error.message}`);
    } else {
      const numToRemove = currentCount - targetCount;
      const batchesToRemove = [...batches].sort((a, b) => b.batch_index - a.batch_index).slice(0, numToRemove);
      const idsToRemove = batchesToRemove.map(b => b.id);
      const { error } = await supabase.from('batches').delete().in('id', idsToRemove);
      if (error) alert(`Gagal menghapus batch: ${error.message}`);
    }
    await fetchBatches();
    setIsSettingCount(false);
  };

  const handleUpdateBatch = async (batchId, updatedValues, isLocal = false) => {
    setBatches(current => current.map(b => b.id === batchId ? { ...b, ...updatedValues } : b));
    if (isLocal) return;
    const { error } = await supabase.from('batches').update(updatedValues).eq('id', batchId);
    if (error) console.error(`Gagal auto-save batch #${batchId}:`, error.message);
  };

  const handleDeleteBatch = async (batchId) => {
    if (!window.confirm("Yakin hapus batch ini?")) return;
    const { error } = await supabase.from('batches').delete().eq('id', batchId);
    if (error) alert(`Gagal menghapus batch: ${error.message}`);
    await fetchBatches();
  };

  const handleSendBatch = async (batch) => {
    setSendingStatus(prev => ({ ...prev, [batch.id]: true }));
    try {
      const { error: msgError } = await supabase.from('messages').insert({
        device_id: batch.selected_device_id,
        content: batch.links, // Data bersih tanpa nomor dikirim
      });
      if (msgError) throw msgError;

      const linksToCache = batch.links.split('\n').filter(link => link.trim() !== '');
      if (linksToCache.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        const cacheObjects = linksToCache.map(link => ({ user_id: user.id, link: link.trim() }));
        
        await supabase.from('cache_links').upsert(cacheObjects, { onConflict: 'user_id,link' });
      }

      alert(`Batch #${batch.batch_index} berhasil dikirim!`);
      await handleUpdateBatch(batch.id, { links: '' });

    } catch (error) {
      alert(`Gagal mengirim Batch #${batch.batch_index}: ${error.message}`);
    } finally {
      setSendingStatus(prev => ({ ...prev, [batch.id]: false }));
    }
  };

  const handleDistributeFromGudang = async () => {
    if (batches.length === 0) {
      alert("Tidak ada batch aktif. Silakan atur jumlah batch terlebih dahulu.");
      return;
    }
    setLoading(true);

    const { data: gudangData, error: gudangError } = await supabase.from('gudang_links').select('links').single();
    if (gudangError || !gudangData || gudangData.links.length === 0) {
      alert("Gudang kosong atau gagal diakses.");
      setLoading(false);
      return;
    }

    const linksToDistribute = [...gudangData.links];
    const updatePromises = [];

    for (const batch of batches) {
      if (linksToDistribute.length === 0) break;
      const linksForThisBatch = linksToDistribute.splice(0, batch.capacity);
      const newLinksString = linksForThisBatch.join('\n');
      updatePromises.push(
        supabase.from('batches').update({ links: newLinksString }).eq('id', batch.id)
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    updatePromises.push(
      supabase.from('gudang_links').upsert({ user_id: user.id, links: linksToDistribute, updated_at: new Date() })
    );

    await Promise.all(updatePromises);
    alert(`Berhasil memindahkan ${gudangData.links.length - linksToDistribute.length} link dari Gudang ke Batch.`);
    await fetchBatches();
  };

  return (
    <>
      <div className="p-8 text-white">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Distribusi Link (Batch)</h1>
          <p className="text-gray-400 mb-8">Data batch tersimpan otomatis. Atur jumlah batch dan bagikan link dari gudang.</p>

          <div className="mb-8 p-6 bg-gray-800/50 rounded-lg shadow-lg flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <input
              type="number"
              value={batchCountInput}
              onChange={(e) => setBatchCountInput(e.target.value)}
              min="0"
              placeholder="Jumlah batch"
              className="flex-grow w-full sm:w-auto px-4 py-3 text-white bg-gray-700 border border-gray-600 rounded-md"
            />
            <button 
              onClick={handleSetBatchCount} 
              disabled={isSettingCount}
              className="w-full sm:w-auto flex items-center justify-center px-6 py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-800/50"
            >
              {isSettingCount ? <FaSpinner className="animate-spin mr-2" /> : <FaCog className="mr-2" />}
              Atur
            </button>
            <button 
              onClick={handleDistributeFromGudang}
              className="w-full sm:w-auto flex items-center justify-center px-6 py-3 font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700"
            >
              <FaShareAlt className="mr-2" />
              Bagikan dari Gudang
            </button>
          </div>
          
          {error && <p className="text-center text-red-400 mb-4">{error}</p>}

          {loading ? (
            <div className="flex justify-center items-center p-16"><FaSpinner className="animate-spin text-4xl" /></div>
          ) : batches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {batches.map(batch => (
                <BatchCard
                  key={batch.id}
                  batch={batch}
                  devices={devices}
                  onUpdate={handleUpdateBatch}
                  onSend={handleSendBatch}
                  onDelete={handleDeleteBatch}
                  isSending={sendingStatus[batch.id] || false}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-16">Belum ada batch. Silakan atur jumlah batch di atas.</p>
          )}
        </div>
      </div>
      <GudangPickerModal 
        isOpen={isGudangModalOpen}
        onClose={() => setIsGudangModalOpen(false)}
        onSelect={() => {}}
      />
    </>
  );
}

export default DistribusiLink;
