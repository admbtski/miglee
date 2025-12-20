import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    reactCompiler: true,
  },
  // Moved from experimental.serverComponentsExternalPackages in Next.js 15
  serverExternalPackages: ['require-in-the-middle'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 3a) wycisz warning
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        { module: /require-in-the-middle/ },
      ];

      // 3b) opcjonalnie oznacz moduł jako external (żeby webpack go nie analizował)
      config.externals = config.externals || [];
      config.externals.push('require-in-the-middle'); // commonjs external
    }
    return config;
  },
  transpilePackages: ['@miglee/contracts'],
};

export default nextConfig;
