import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/ws/:path*',
        destination: 'wss://productivity-island-backend-whqijrostq-uc.a.run.app/ws/:path*',
      },
    ];
  },
};

export default nextConfig;