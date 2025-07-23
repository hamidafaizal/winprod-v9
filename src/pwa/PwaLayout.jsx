import React from 'react';
import { Outlet } from 'react-router-dom';

// Layout ini hanya sebagai pembungkus untuk rute-rute PWA
function PwaLayout() {
  console.log("PwaLayout.jsx: Rendering PWA layout.");
  return <Outlet />;
}

export default PwaLayout;
