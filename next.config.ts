import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/rest/v1/:path*',
        destination: 'https://tclvquwsxbntvwvozeto.supabase.co/rest/v1/:path*',
      },
      {
        source: '/auth/v1/:path*',
        destination: 'https://tclvquwsxbntvwvozeto.supabase.co/auth/v1/:path*',
      },
      {
        source: '/storage/v1/:path*',
        destination: 'https://tclvquwsxbntvwvozeto.supabase.co/storage/v1/:path*',
      }
    ];
  },
};

export default nextConfig;
