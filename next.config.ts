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
};

export default nextConfig;
