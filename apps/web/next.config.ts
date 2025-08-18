import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    reactCompiler: true,
  },
  transpilePackages: ['@miglee/contracts'],
};

export default nextConfig;
