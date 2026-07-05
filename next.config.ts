import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // mind-ar ships a couple of large pre-bundled workers/wasm-ish chunks that
    // rely on being loaded as plain scripts in the browser only.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    return config;
  },
};

export default nextConfig;
