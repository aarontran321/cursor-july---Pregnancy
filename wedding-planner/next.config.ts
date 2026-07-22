import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this app. A second lockfile at the repo root
  // (the Marrymap Vite app) makes Turbopack infer the wrong root and resolve
  // the wrong node_modules, which breaks the RSC client manifest.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
