import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // All images are local uploads served from /public/uploads — no
    // remote CDN in the self-hosted setup, so no remotePatterns needed.
    qualities: [75, 90],
  },
};

export default nextConfig;
