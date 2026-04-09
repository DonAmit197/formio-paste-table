/** @format */

import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  server: {
    port: 8000,
    strictPort: true,
  },

  preview: {
    port: 8080,
  },

  build: {
    target: 'es2018',
    outDir: 'dist',
    emptyOutDir: true,

    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'BCFormioPasteTable',
    },

    rollupOptions: {
      external: ['formiojs'],
      output: [
        {
          format: 'es',
          entryFileNames: 'formio-paste-table.js',
          globals: {
            formiojs: 'Formio',
          },
          exports: 'named',
        },
        {
          format: 'umd',
          name: 'BCFormioPasteTable',
          entryFileNames: 'formio-paste-table.umd.js',
          globals: {
            formiojs: 'Formio',
          },
          exports: 'named',
        },
        {
          format: 'iife',
          name: 'BCFormioPasteTable',
          entryFileNames: 'pega/formio-paste-table.iife.js',
          globals: {
            formiojs: 'Formio',
          },
          exports: 'named',
        },
      ],
    },
  },
});
