// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Backpacker Budget',
        short_name: 'Budget',
        theme_color: '#166534',
        background_color: '#ffffff',
        display: 'standalone',
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackAllowlist: [/^\/app/],
        navigateFallbackDenylist: [
          /^\/\.well-known\//,
          /^\/about/,
          /^\/landing/,
          /^\/$/,
        ],
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
});