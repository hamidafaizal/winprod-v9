import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'WinProd PWA',
        short_name: 'WinProd',
        description: 'Aplikasi klien untuk menerima pesan dan link.',
        theme_color: '#1f2937',
        background_color: '#1f2937',
        display: 'standalone',
        // Mengubah scope dan start_url untuk subdomain
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png', // Pastikan ikon ada di folder /public
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', // Pastikan ikon ada di folder /public
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
