/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets a verification build run in another folder without disturbing a running `next dev` (which uses .next)
  distDir: process.env.NEXT_DIST_DIR || '.next',
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
    // Signatures are sent as PNG data URLs; files go straight to storage and do not count here
    serverActions: { bodySizeLimit: '2mb' },
    // The PDF font files are read from disk at runtime, so ship them with every server function
    outputFileTracingIncludes: { '/**': ['./lib/pdf/fonts/**'] },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
