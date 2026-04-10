import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "pg",
    "prisma",
  ],
  images: {
    // Allow unoptimized local images for development
    unoptimized: true,
  },
};

export default nextConfig;
