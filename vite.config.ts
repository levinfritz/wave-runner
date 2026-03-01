import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2020',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Single JS chunk
        manualChunks: undefined,
        inlineDynamicImports: true,
      },
    },
    // Inline assets under 100KB (our entire game is smaller)
    assetsInlineLimit: 100000,
  },
  base: './', // Relative paths for portability
});
