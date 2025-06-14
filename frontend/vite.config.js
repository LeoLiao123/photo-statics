import { resolve } from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  root: resolve(__dirname), // frontend/ directory
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        photo_rankings: resolve(__dirname, 'photo_rankings.html'),
        user_votes_details: resolve(__dirname, 'user_votes_details.html'),
      },
    },
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000', // Your backend server
        changeOrigin: true,
      },
      '/images': { // Proxy for images served by the backend
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    },
  },
});
