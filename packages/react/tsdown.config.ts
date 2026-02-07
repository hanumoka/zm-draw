import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  external: [
    'react', 'react-dom', 'konva', 'zustand',
    '@zm-draw/collaboration',
    '@radix-ui/react-popover', '@radix-ui/react-tooltip', 'react-colorful',
  ],
  treeshake: true,
  splitting: false,
  outputOptions: {
    entryFileNames: '[name].js',
  },
});
