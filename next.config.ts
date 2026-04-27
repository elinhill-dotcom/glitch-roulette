import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // OneDrive/Windows can aggressively lock/sync `.next`, which may corrupt Turbopack's
    // persistent filesystem cache. Disabling it is more stable for local dev.
    turbopackFileSystemCacheForDev: false,
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
