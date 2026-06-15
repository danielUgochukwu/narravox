import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
      },
      {
        protocol: "https",
        hostname: "d7xrpaomm5tb2boe.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
