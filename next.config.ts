import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.agroastery.com",
        port: "",
        pathname: "/produk/**",
        search: "",
      },
    ],
  },
  // Cloudflare Pages compatibility - Note: output: 'export' disables API routes
  // Remove output: 'export' to keep API routes working
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
