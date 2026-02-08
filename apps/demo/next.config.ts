import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: ['@zm-draw/core', '@zm-draw/react', '@zm-draw/collaboration'],
  webpack: (config, { isServer }) => {
    // Konva requires browser environment, exclude from server build
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas', 'konva'];
    }

    // Resolve workspace packages directly (workaround for MSYS2 symlink issues)
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@zm-draw/core': path.resolve(__dirname, '../../packages/core/dist'),
      '@zm-draw/react': path.resolve(__dirname, '../../packages/react/dist'),
      '@zm-draw/react/styles.css': path.resolve(__dirname, '../../packages/react/dist/styles.css'),
      '@zm-draw/collaboration': path.resolve(__dirname, '../../packages/collaboration/dist'),
    };

    return config;
  },
};

export default nextConfig;
