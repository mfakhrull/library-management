import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['marketplace.canva.com', 'template.canva.com', 'res.cloudinary.com'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
