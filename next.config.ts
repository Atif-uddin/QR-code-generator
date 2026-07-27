import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ['@napi-rs/canvas'],
};

export default nextConfig;
