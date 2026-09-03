import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 blocks /_next/* dev resources from origins other than localhost,
  // which leaves pages server-rendered but unhydrated when opened on the loopback
  // IP. Dev-only setting; it has no effect on a production build.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
