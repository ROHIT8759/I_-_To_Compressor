import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from Cloudinary
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  // Increase API body size limit for file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: "110mb",
    },
  },
};

export default nextConfig;
