import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom', 'konva', 'react-konva'],
  treeshake: true,
  splitting: false,
  injectStyle: false,
});
