import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/src/data/passages')) return 'data-passages';
          if (id.includes('/src/data/allExams')) return 'data-exams';
          if (id.includes('node_modules')) {
            if (/[\\/]node_modules[\\/](\.pnpm[\\/])?(@firebase|firebase)/.test(id)) return 'vendor-firebase';
            if (/[\\/]node_modules[\\/](\.pnpm[\\/])?(react|react-dom|scheduler)@?[^\\/]*[\\/]/.test(id)) return 'vendor-react';
          }
          return undefined;
        }
      }
    }
  }
});
