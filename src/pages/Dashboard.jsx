import React from 'react';

// Komponen untuk halaman Dashboard dengan tema gelap permanen.
function Dashboard() {
  console.log("Component: Rendering Dashboard page");
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-100">Dashboard</h1>
      <p className="mt-2 text-gray-400">Selamat datang di halaman utama aplikasi Anda.</p>
    </div>
  );
}

export default Dashboard;
