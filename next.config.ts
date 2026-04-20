import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async redirects() {
    return [
      {
        source: "/insights",
        destination: "/info",
        permanent: true,
      },
      {
        source: "/insights/:path*",
        destination: "/info/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
