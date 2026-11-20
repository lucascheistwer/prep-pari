import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La imagen Docker setea NEXT_STANDALONE=1. Sin eso, `next start` sigue sirviendo el build local.
  ...(process.env.NEXT_STANDALONE === "1" ? { output: "standalone" as const } : {}),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
