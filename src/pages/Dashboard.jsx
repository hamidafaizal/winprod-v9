import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FaServer, FaDatabase, FaTrash, FaSpinner } from 'react-icons/fa';

// Komponen untuk kartu statistik
const StatCard = ({ icon, title, value, loading }) => (
  <div className="bg-gray-800/50 p-6 rounded-lg flex items-center space-x-4 border border-gray-700/50">
    <div className="p-3 bg-gray-700/50 rounded-lg">{icon}</div>
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      {loading ? (
        <div className="h-7 w-12 bg-gray-700 rounded animate-pulse mt-1"></div>
      ) : (
        <p className="text-2xl font-bold text-white">{value}</p>
      )}
    </div>
  </div>
);

function Dashboard() {
  const [stats, setStats] = useState({ deviceCount: 0, gudangCount: 0, cacheCount: 0 });
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      // Mengambil data secara paralel untuk efisiensi
      const [
        { count: deviceCount, error: deviceError },
        { data: gudangData, error: gudangError },
        { count: cacheCount, error: cacheError }
      ] = await Promise.all([
        supabase.from('devices').select('*', { count: 'exact', head: true }),
        supabase.from('gudang_links').select('links').single(),
        supabase.from('cache_links').select('*', { count: 'exact', head: true })
      ]);

      if (deviceError) throw deviceError;
      if (cacheError) throw cacheError;
      // Abaikan error gudang jika itu karena tidak ada baris (PGRST116)
      if (gudangError && gudangError.code !== 'PGRST116') throw gudangError;

      setStats({
        deviceCount: deviceCount || 0,
        gudangCount: gudangData?.links?.length || 0,
        cacheCount: cacheCount || 0,
      });

    } catch (error) {
      console.error("Error fetching dashboard stats:", error.message);
      alert("Gagal memuat statistik dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleDeleteAllRisetData = async () => {
    const confirmation = window.confirm(
      "PERINGATAN: Anda akan menghapus SEMUA data di Gudang dan Cache.\n\n" +
      "Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin melanjutkan?"
    );

    if (confirmation) {
      setIsDeleting(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User tidak ditemukan.");

        // Hapus data dari gudang dan cache secara paralel
        const [gudangResult, cacheResult] = await Promise.all([
          supabase.from('gudang_links').delete().eq('user_id', user.id),
          supabase.from('cache_links').delete().eq('user_id', user.id)
        ]);

        if (gudangResult.error) throw gudangResult.error;
        if (cacheResult.error) throw cacheResult.error;

        alert("Semua data riset (Gudang dan Cache) berhasil dihapus.");
        await fetchStats(); // Refresh statistik setelah hapus

      } catch (error) {
        console.error("Error deleting riset data:", error.message);
        alert(`Gagal menghapus data riset: ${error.message}`);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="p-8 text-white">
      <h1 className="text-3xl font-bold text-gray-100">Dashboard</h1>
      <p className="mt-2 text-gray-400 mb-8">Selamat datang di halaman utama aplikasi Anda.</p>

      {/* Grid untuk Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          icon={<FaServer className="h-6 w-6 text-indigo-400" />}
          title="Perangkat Aktif"
          value={stats.deviceCount}
          loading={loading}
        />
        <StatCard 
          icon={<FaDatabase className="h-6 w-6 text-teal-400" />}
          title="Link di Gudang"
          value={stats.gudangCount}
          loading={loading}
        />
        <StatCard 
          icon={<FaTrash className="h-6 w-6 text-amber-400" />}
          title="Link di Cache (Terpakai)"
          value={stats.cacheCount}
          loading={loading}
        />
      </div>

      {/* Panel Aksi Berbahaya */}
      <div className="bg-gray-800/50 p-6 rounded-lg border border-red-500/30">
        <h2 className="text-xl font-bold text-red-400">Zona Berbahaya</h2>
        <p className="text-gray-400 mt-2 mb-4 text-sm">
          Tindakan di bawah ini bersifat permanen dan tidak dapat dibatalkan. Lakukan dengan hati-hati.
        </p>
        <button
          onClick={handleDeleteAllRisetData}
          disabled={isDeleting}
          className="flex items-center justify-center px-4 py-2 font-semibold text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-red-800/50 disabled:cursor-not-allowed"
        >
          {isDeleting ? (
            <FaSpinner className="animate-spin mr-2" />
          ) : (
            <FaTrash className="mr-2" />
          )}
          {isDeleting ? 'Menghapus...' : 'Hapus Semua Data Riset'}
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
