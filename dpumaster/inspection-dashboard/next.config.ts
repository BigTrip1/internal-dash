import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Corporate firewall-friendly configuration
  experimental: {
    // Disable Turbopack for better compatibility
    turbo: {
      // Set workspace root to avoid lockfile warnings
      root: process.cwd(),
    },
  },
  
  // Configure allowed development origins for cross-origin requests
  allowedDevOrigins: [
    '172.30.60.22', // Adam's network IP
    'localhost',
    '127.0.0.1',
  ],
  
  // Disable external font optimization for corporate environments
  optimizeFonts: false,
  
  // Configure for corporate proxy environments
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
