import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Capacitor serves the built app from a local file:// / capacitor:// origin,
  // so assets must be referenced with relative paths, not absolute ones.
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    // pdf.js + tesseract.js ship worker bundles that are already large;
    // raise the warning limit instead of fighting it with premature splitting.
    chunkSizeWarningLimit: 2000,
  },
  worker: {
    format: 'es',
  },
})
