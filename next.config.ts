import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Admin product photos are uploaded through a server action (max 5 MB, see lib/images.ts).
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
