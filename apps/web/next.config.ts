import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/api-client", "@repo/tokens", "@repo/utils"],
  images: {
    // All images are local uploads served from /public/uploads — no
    // remote CDN in the self-hosted setup, so no remotePatterns needed.
    qualities: [75, 90],
  },
};

export default nextConfig;
