import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    // Assets 3D : cache CDN d’une semaine, revalidé en arrière-plan.
    const assetCache = [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }];
    return [
      { source: "/models/:path*", headers: assetCache },
      { source: "/textures/:path*", headers: assetCache },
      { source: "/hdri/:path*", headers: assetCache },
    ];
  },
};

export default nextConfig;
