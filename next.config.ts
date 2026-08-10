import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Allow images from Vercel Blob storage and localhost (dev uploads)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "blob.vercel-storage.com",
      },
    ],
  },
  serverExternalPackages: ["sharp"],
  // Allow the sandbox preview gateway to access Next.js dev resources (_next/*)
  allowedDevOrigins: [
    "*.space-z.ai",
    "preview-chat-*.space-z.ai",
  ],
};

export default nextConfig;
