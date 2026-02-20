import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 6191,
    proxy: {
      '/api': {
        target: 'http://localhost:6190',
        changeOrigin: true,
      },
    },
  },
});
