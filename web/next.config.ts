import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["yt-search", "cheerio"],
};

export default nextConfig;
