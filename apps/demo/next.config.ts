import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@zm-draw/core', '@zm-draw/react'],
  webpack: (config, { isServer }) => {
    // Konva requires browser environment, exclude from server build
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas', 'konva'];
    }
    return config;
  },
};

export default nextConfig;
