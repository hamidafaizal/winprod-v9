import React, { useState } from 'react';
import Papa from 'papaparse';
import { FaClipboard, FaSpinner } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';

// Komponen untuk menampilkan notifikasi "Berhasil disalin/disimpan"
const Feedback = ({ show, message }) => {
  if (!show) return null;
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg text-white bg-green-600 shadow-lg z-50">
      {message}
    </div>
  );
};

// Komponen untuk menampilkan semua hasil link dalam satu wadah
const ResultDisplay = ({ links, onCopy }) => {
  const handleCopy = () => {
    if (links.length === 0) return;
    const textToCopy = links.join('\n');
    navigator.clipboard.writeText(textToCopy);
    onCopy();
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700/50 mt-8">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
        <h3 className="font-semibold text-lg text-white">
          Hasil Riset ({links.length} Link Ditemukan)
        </h3>
        <button
          onClick={handleCopy}
          className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 font-semibold text-sm"
          title="Salin Semua Link"
        >
          <FaClipboard className="mr-2" />
          Salin Semua
        </button>
      </div>
      {/* Mengganti textarea dengan div yang bisa di-scroll untuk penomoran */}
      <div className="w-full bg-gray-900 rounded-lg p-4 h-96 text-sm text-gray-400 font-mono overflow-y-auto">
        {links.map((link, index) => (
          <div key={index} className="flex">
            <span className="text-gray-500 mr-2 select-none">{index + 1}.</span>
            <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{link}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

function Riset() {
  const [rankInput, setRankInput] = useState(30);
  const [loading, setLoading] = useState(false);
  const [processedLinks, setProcessedLinks] = useState([]);
  const [feedback, setFeedback] = useState({ show: false, message: '' });

  const showFeedback = (message) => {
    setFeedback({ show: true, message });
    setTimeout(() => {
      setFeedback({ show: false, message: '' });
    }, 2500);
  };

  const handleSaveToGudang = async (links) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [
      { data: cachedLinksData, error: cacheError },
      { data: gudangData, error: gudangError }
    ] = await Promise.all([
      supabase.from('cache_links').select('link'),
      supabase.from('gudang_links').select('links').single()
    ]);

    if (gudangError && gudangError.code !== 'PGRST116') {
      alert(`Gagal mengambil data: ${cacheError?.message || gudangError?.message}`);
      return;
    }

    const cachedLinksSet = new Set(cachedLinksData.map(item => item.link));
    const existingGudangLinks = gudangData?.links || [];
    
    const newUniqueLinks = links.filter(link => {
      const trimmedLink = link.trim();
      return trimmedLink !== '' && !cachedLinksSet.has(trimmedLink) && !existingGudangLinks.includes(trimmedLink);
    });

    if (newUniqueLinks.length === 0) {
      showFeedback('Tidak ada link baru untuk ditambahkan ke Gudang.');
      return;
    }

    const combinedLinks = [...existingGudangLinks, ...newUniqueLinks];
    const { error: upsertError } = await supabase
      .from('gudang_links')
      .upsert({ user_id: user.id, links: combinedLinks, updated_at: new Date() });

    if (upsertError) {
      alert(`Gagal menyimpan ke gudang: ${upsertError.message}`);
    } else {
      showFeedback(`${newUniqueLinks.length} link baru berhasil ditambahkan ke Gudang!`);
    }
  };
  
  const handleFileProcess = (event) => {
    event.preventDefault();
    const files = event.target.elements.csvFiles.files;
    if (files.length === 0) {
      alert("Silakan pilih setidaknya satu file CSV.");
      return;
    }
    setLoading(true);
    setProcessedLinks([]);

    const fileReadPromises = Array.from(files).map(file => {
      return new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => resolve(results.data),
          error: (error) => reject(error),
        });
      });
    });

    Promise.all(fileReadPromises)
      .then(allFilesData => {
        const allLinks = new Set();
        const rankToTake = parseInt(rankInput, 10);
        allFilesData.forEach(data => {
          const nonTurun = data.filter(r => r.Tren && r.Tren.toUpperCase() !== 'TURUN');
          const adLinks = nonTurun.filter(r => r.isAd && r.isAd.toUpperCase() === 'YES').map(r => r.productLink);
          const organikLinks = nonTurun
            .filter(r => r.isAd && r.isAd.toUpperCase() === 'NO' && r.Tren && r.Tren.toUpperCase() === 'NAIK')
            .sort((a, b) => (parseInt(b['Penjualan (30 Hari)'] || '0', 10) - parseInt(a['Penjualan (30 Hari)'] || '0', 10)))
            .slice(0, rankToTake)
            .map(r => r.productLink);
          
          adLinks.forEach(link => allLinks.add(link));
          organikLinks.forEach(link => allLinks.add(link));
        });

        const finalLinks = Array.from(allLinks).sort(() => 0.5 - Math.random());
        setProcessedLinks(finalLinks);

        if (finalLinks.length > 0) {
          handleSaveToGudang(finalLinks);
        }
      })
      .catch(error => {
        console.error("Gagal memproses file:", error);
        alert("Terjadi kesalahan saat memproses file CSV.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto text-white">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white">Filter & Batch Link Produk</h1>
        <p className="text-gray-400 mt-2">Unggah file CSV, filter, dan simpan hasilnya ke gudang data Anda.</p>
      </header>

      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg mb-8">
        <form id="upload-form" onSubmit={handleFileProcess} className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-full md:w-auto flex-grow">
            <label htmlFor="csvFiles" className="block mb-2 text-sm font-medium text-gray-300">Pilih File CSV</label>
            <input type="file" id="csvFiles" accept=".csv" multiple required className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer" />
          </div>
          <div className="w-full md:w-auto">
            <label htmlFor="rankInput" className="block mb-2 text-sm font-medium text-gray-300">Rank Organik</label>
            <input type="number" id="rankInput" value={rankInput} onChange={(e) => setRankInput(e.target.value)} min="1" className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 text-center" />
          </div>
          <div className="w-full md:w-auto self-end">
            <button type="submit" id="prosesBtn" disabled={loading} className="w-full md:w-auto text-white bg-indigo-700 hover:bg-indigo-800 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-8 py-2.5 disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center justify-center">
              {loading && <FaSpinner className="animate-spin mr-2" />}
              {loading ? 'Memproses...' : 'Proses'}
            </button>
          </div>
        </form>
      </div>

      {loading ? (
         <div className="flex justify-center items-center p-16"><FaSpinner className="animate-spin text-4xl text-gray-400" /></div>
      ) : processedLinks.length > 0 ? (
        <ResultDisplay links={processedLinks} onCopy={() => showFeedback('Berhasil disalin!')} />
      ) : (
        <p className="text-center text-gray-500">Hasil akan ditampilkan di sini setelah file diproses.</p>
      )}

      <Feedback show={feedback.show} message={feedback.message} />
    </div>
  );
}

export default Riset;
