/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets a verification build run in another folder without disturbing a running `next dev` (which uses .next)
  distDir: process.env.NEXT_DIST_DIR || '.next',
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
    // Signatures and AI attachments are sent inside server actions; customer files go straight to storage.
    // Vercel accepts at most 4.5MB per request.
    serverActions: { bodySizeLimit: '4mb' },
    // The PDF font files are read from disk at runtime, so ship them with every server function
    outputFileTracingIncludes: { '/**': ['./lib/pdf/fonts/**'], '/**/*': ['./lib/pdf/fonts/**'] },
  },
  // Basic security headers on every page
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' }, // no embedding in other sites (clickjacking)
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
