import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Enable standalone output for optimized Docker production builds
  output: 'standalone',
  // Disable telemetry
  telemetry: false,
  experimental: {
    reactCompiler: true,
    // Turbopack config (for dev mode with --turbopack flag)
    turbo: {
      // Add turbopack-specific config here if needed
    },
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
  transpilePackages: ['@appname/contracts'],
};

export default nextConfig;
