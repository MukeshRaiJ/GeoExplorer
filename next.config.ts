import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/a/**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // Keep your existing experimental config if you have any
  experimental: {
    turbo: {
      rules: {
        // Add any specific turbo rules if needed
      },
    },
  },
};

export default nextConfig;
