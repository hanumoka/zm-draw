import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom', 'zustand', 'yjs', 'y-websocket', 'y-indexeddb'],
  treeshake: true,
  splitting: false,
  outputOptions: {
    entryFileNames: '[name].js',
  },
});
