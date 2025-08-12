/*
  Next.js configuration file.
  - Place framework-level settings here (images, redirects, headers, etc.)
  - Currently using default options for a minimal setup
*/
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "riqqtffbmifrtuwtvqil.supabase.co",
        pathname: "/storage/v1/object/public/content/**",
      },
    ],
  },
};

export default nextConfig;
