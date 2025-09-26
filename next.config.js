/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Enable remote images from NewsAPI sources
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.aljazeera.com',
      },
      {
        protocol: 'https',
        hostname: 'media.zenfs.com',
      },
      {
        protocol: 'https',
        hostname: '**.cnn.com',
      },
      {
        protocol: 'https',
        hostname: '**.reuters.com',
      },
      {
        protocol: 'https',
        hostname: '**.bbc.com',
      },
      {
        protocol: 'https',
        hostname: '**.bbc.co.uk',
      },
      {
        protocol: 'https',
        hostname: '**.abcnews.com',
      },
      {
        protocol: 'https',
        hostname: 'i.abcnewsfe.com',
      },
      {
        protocol: 'https',
        hostname: '**.ap.org',
      },
      {
        protocol: 'https',
        hostname: '**.apnews.com',
      },
      {
        protocol: 'https',
        hostname: '**.npr.org',
      },
      {
        protocol: 'https',
        hostname: '**.bloomberg.com',
      },
      {
        protocol: 'https',
        hostname: '**.ft.com',
      },
      {
        protocol: 'https',
        hostname: '**.theguardian.com',
      },
      {
        protocol: 'https',
        hostname: 'bl-i.thgim.com',
      },
      // GNews additional sources
      {
        protocol: 'https',
        hostname: 'd32r1sh890xpii.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'assets.newsweek.com',
      },
      {
        protocol: 'https',
        hostname: 'foreignpolicy.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.bwbx.io',
      },
      {
        protocol: 'https',
        hostname: 'www.readingeagle.com',
      },
      {
        protocol: 'https',
        hostname: '**.newsmax.com',
      },
      {
        protocol: 'https',
        hostname: 'livenews.foxnews.com',
      },
      {
        protocol: 'https',
        hostname: '**.foxnews.com',
      },
      {
        protocol: 'https',
        hostname: 'wtop.com',
      },
      {
        protocol: 'https',
        hostname: 'www.adn.com',
      },
      {
        protocol: 'https',
        hostname: 'arc.stimg.co',
      },
      {
        protocol: 'https',
        hostname: '**.usnews.com',
      },
      // Catch additional news domains
      {
        protocol: 'https',
        hostname: '**.oilprice.com',
      },
      {
        protocol: 'https',
        hostname: '**.politico.com',
      },
      {
        protocol: 'https',
        hostname: '**.washingtonpost.com',
      },
      {
        protocol: 'https',
        hostname: '**.nytimes.com',
      },
      {
        protocol: 'https',
        hostname: '**.wsj.com',
      },
      {
        protocol: 'https',
        hostname: '**.washingtonexaminer.com',
      },
      {
        protocol: 'https',
        hostname: '**.inquirer.com',
      },
    ],
  },
  
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