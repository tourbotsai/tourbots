/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs');
const firebaseAuthHost = process.env.FIREBASE_AUTH_HOST || 'tourbots-ai.firebaseapp.com';
const isProduction = process.env.NODE_ENV === 'production';

function buildCsp({ embed = false } = {}) {
  const scriptSrc = isProduction
    ? "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://static.matterport.com https://api.matterport.com https://www.gstatic.com"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://static.matterport.com https://api.matterport.com https://www.gstatic.com";

  const connectSrc = isProduction
    ? "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://*.googleapis.com https://*.gstatic.com https://*.firebaseio.com https://*.supabase.co wss://*.supabase.co https://my.matterport.com https://api.matterport.com https://api.stripe.com https://*.sentry.io https://*.ingest.sentry.io"
    : "connect-src 'self' http://localhost:* ws://localhost:* https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://*.googleapis.com https://*.gstatic.com https://*.firebaseio.com https://*.supabase.co wss://*.supabase.co https://my.matterport.com https://api.matterport.com https://api.stripe.com https://*.sentry.io https://*.ingest.sentry.io";

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    "frame-src 'self' https://my.matterport.com https://api.matterport.com https://js.stripe.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    scriptSrc,
    connectSrc,
    "worker-src 'self' blob:",
    embed ? "frame-ancestors *" : "frame-ancestors 'self'",
  ];

  if (isProduction) {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
}

const baselineSecurityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(self)',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
];

const nextConfig = {
  reactStrictMode: true,
  // CRITICAL: Prevent Vercel redirects that break CORS preflight
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  images: {
    domains: [
      'mcnpbpwsqebihnxzhssu.supabase.co', // Your Supabase storage domain
      'ahljbtlrwboixvcyepkn.supabase.co', // New Supabase storage domain
      // Add other domains as needed
    ],
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.tourbots.ai' }],
        destination: 'https://tourbots.ai/:path*',
        permanent: true,
      },
    ];
  },
  // Add Firebase auth proxy rewrites
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: `https://${firebaseAuthHost}/__/auth/:path*`,
      },
    ];
  },
  // Add headers to prevent redirects on API routes
  async headers() {
    return [
      // Baseline security headers for all non-embed routes
      {
        source: '/((?!embed(?:/|$)).*)',
        headers: [
          ...baselineSecurityHeaders,
          {
            key: 'Content-Security-Policy',
            value: buildCsp({ embed: false }),
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
      // Embed-safe policy for chatbot + agency embeds
      {
        source: '/embed/:path*',
        headers: [
          ...baselineSecurityHeaders,
          {
            key: 'Content-Security-Policy',
            value: buildCsp({ embed: true }),
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    // Suppress the specific Supabase realtime warnings
    config.ignoreWarnings = [
      { module: /node_modules\/@supabase\/realtime-js/ },
      /Critical dependency: the request of a dependency is an expression/,
    ];
    return config;
  },
}

module.exports = withSentryConfig(nextConfig, {
  org: 'tourbots-ai',
  project: 'javascript-nextjs',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  tunnelRoute: '/monitoring',
  widenClientFileUpload: true,
});
