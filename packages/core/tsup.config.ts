import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'shapes/index': 'src/shapes/index.ts',
    'connectors/index': 'src/connectors/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['konva'],
  treeshake: true,
  splitting: false,
});
