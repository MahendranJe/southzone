import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-mssql",
    "tedious",
    "prisma",
  ],
  images: {
    // Allow unoptimized local images for development
    unoptimized: true,
  },
};

export default nextConfig;
