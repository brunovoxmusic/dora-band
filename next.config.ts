import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel handles the build output automatically — no standalone needed.
  typescript: {
    ignoreBuildErrors: false,
  },
  // Sharp is used for image processing (upload thumbnails).
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // External server-side packages (sharp needs native bindings)
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
