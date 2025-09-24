/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Production optimizations
  compress: true,
  generateEtags: false,
  poweredByHeader: false,
  
  // Environment variables for runtime
  env: {
    PORT: process.env.PORT || '5000',
    HOSTNAME: process.env.HOSTNAME || '0.0.0.0'
  },
  
  // Server runtime configuration
  serverRuntimeConfig: {
    port: parseInt(process.env.PORT) || 5000,
    hostname: process.env.HOSTNAME || '0.0.0.0'
  },
  
  // Required for Replit environment - allows all hosts for development proxy
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Cache-Control',
            value: process.env.NODE_ENV === 'production' 
              ? 'public, max-age=31536000, immutable'
              : 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ]
  },
  
  // Allow all hosts for Replit proxy - handled by -H 0.0.0.0 flag
  
  // Development server configuration
  ...(process.env.NODE_ENV === 'development' && {
    devIndicators: {
      buildActivity: false,
    },
  }),
}

module.exports = nextConfig