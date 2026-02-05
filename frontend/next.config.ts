import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile LiFi widget and its dependencies
  transpilePackages: [
    '@lifi/widget',
    '@lifi/sdk',
    '@lifi/wallet-management',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.iconify.design',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

