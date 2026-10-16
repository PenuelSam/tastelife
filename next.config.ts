import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  redirects() {
    // /talent was renamed to /work; keep old links working.
    return [{ source: "/talent", destination: "/work", permanent: true }];
  },
};

export default nextConfig;
