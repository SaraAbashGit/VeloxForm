// Server-side base URL for links in emails and auth redirects.
// On Vercel the production domain is provided automatically; locally it comes from .env.local.
export const APP_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
