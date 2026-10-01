import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  skipTrailingSlashRedirect: true,
  serverExternalPackages: ["yt-search", "cheerio"],
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
      {
        source: '/engine/:path*',
        destination: 'http://127.0.0.1:3005/:path*',
      },
    ];
  },
};

export default nextConfig;
