import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack config (Next.js 16 default)
  turbopack: {
    // Future: add turbopack-specific options here
  },

  // Webpack config (used with --webpack flag or when turbopack is disabled)
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/public/audio/**",
          "**/public/themes/**",
          "**/public/carousel/**",
          "**/public/music-player/**",
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
