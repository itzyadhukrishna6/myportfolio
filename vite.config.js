import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    // Use esbuild (default) for fast minification
    minify: 'esbuild',
    // Increase inline threshold for small assets (fonts, small icons)
    assetsInlineLimit: 4096,
    // Split chunks for better caching
    rollupOptions: {
      input: {
        main:         resolve(__dirname, 'index.html'),
        'case-study':  resolve(__dirname, 'case-study.html'),
        'case-study0': resolve(__dirname, 'case-study0.html'),
        'case-study1': resolve(__dirname, 'case-study1.html'),
        'case-study2': resolve(__dirname, 'case-study2.html'),
        'case-study3': resolve(__dirname, 'case-study3.html'),
      },
      output: {
        manualChunks: {
          // Vendor chunk — cached separately across deploys
          vendor: ['gsap', 'lenis'],
        },
        // Content-hash filenames for long-term caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    // Increase warning threshold (large images are expected in portfolio)
    chunkSizeWarningLimit: 600,
    // Enable source maps for production debugging (disable for smallest bundle)
    sourcemap: false,
    // Target modern browsers for smaller output
    target: 'es2020',
  },
  // Pre-bundle dependencies for faster dev start
  optimizeDeps: {
    include: ['gsap', 'lenis'],
  },
});
