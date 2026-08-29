import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["deviant-pancreas-stinking.ngrok-free.dev"],
  output: "standalone",
  images: {
    deviceSizes: [640, 750, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/webp"],
    minimumCacheTTL: 3600,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.agroastery.com",
        port: "",
        pathname: "/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
      },
    ],
  },
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
