import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR and file watching can be disabled in AI Studio via DISABLE_HMR.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Persisted checkout data changes must not trigger a full-page reload.
      watch: process.env.DISABLE_HMR === 'true'
        ? null
        : { ignored: [path.resolve(__dirname, 'data', 'db.json')] },
    },
  };
});
