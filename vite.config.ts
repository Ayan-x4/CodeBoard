import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: { '/api': 'http://localhost:3001' },
    // Mounted Windows folders under WSL may not emit reliable filesystem events.
    watch: { usePolling: process.platform === 'linux' && process.cwd().startsWith('/mnt/'), interval: 300 },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: { output: { manualChunks: { fabric: ['fabric'], react: ['react', 'react-dom'] } } },
  },
});
