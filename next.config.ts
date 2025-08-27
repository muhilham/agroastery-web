import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ag-cdn.fiqry.dev",
        port: "",
        pathname: "/produk/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
