import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.agroastery.com",
        port: "",
        pathname: "/produk/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
