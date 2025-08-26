import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    reactCompiler: true,
    serverComponentsExternalPackages: ['@opentelemetry/*', '@grpc/grpc-js'],
  },
  transpilePackages: ['@miglee/contracts'],
};

export default nextConfig;
