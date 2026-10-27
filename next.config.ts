import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  redirects() {
    return [{ source: "/talent", destination: "/work", permanent: true }];
  },
};

export default nextConfig;
