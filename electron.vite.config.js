import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist-electron',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'electron/main.js',
        preload: 'electron/preload.js'
      },
      output: {
        format: 'es',
        entryFileNames: '[name].js',
      }
    }
  }
});