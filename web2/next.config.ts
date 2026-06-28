import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["yt-search", "cheerio"],
  async rewrites() {
    return [
      {
        source: '/engine/:path*',
        destination: (process.env.ENGINE_URL || 'http://localhost:3005') + '/:path*',
      },
    ];
  },
};

export default nextConfig;
