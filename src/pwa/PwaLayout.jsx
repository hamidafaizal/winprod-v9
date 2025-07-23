import React from 'react';
import { Outlet } from 'react-router-dom';
import PwaInstallPrompt from './PwaInstallPrompt';

// Layout ini sebagai pembungkus untuk rute-rute PWA
function PwaLayout() {
  console.log("PwaLayout.jsx: Rendering PWA layout with install prompt.");
  return (
    <>
      <Outlet />
      <PwaInstallPrompt />
    </>
  );
}

export default PwaLayout;
