import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    // This is required for Next.js to work in a cross-origin environment like Firebase Studio.
    allowedDevOrigins: ['https://*.cluster-3gc7bglotjgwuxlqpiut7yyqt4.cloudworkstations.dev'],
  },
};

export default nextConfig;
