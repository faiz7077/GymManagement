import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173, // Default Vite port for Electron compatibility
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: './', // Simple relative path
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1000kb
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries into separate chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'radix-ui': [
            '@radix-ui/react-accordion', 
            '@radix-ui/react-avatar', 
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-popover',
            '@radix-ui/react-toast',
            '@radix-ui/react-slot',
            '@radix-ui/react-label',
            '@radix-ui/react-checkbox'
          ],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'pdf-vendor': ['html2canvas', 'jspdf', 'jspdf-autotable'],
          'chart-vendor': ['recharts'],
          'date-vendor': ['date-fns'],
          'ui-utils': ['clsx', 'class-variance-authority', 'tailwind-merge', 'lucide-react']
        }
      }
    }
  },
}));
