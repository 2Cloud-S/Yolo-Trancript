/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow builds to succeed even with ESLint errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Skip trailing slash redirects to prevent 308 redirects
  skipTrailingSlashRedirect: true,
  
  // Increase static page generation timeout to 180 seconds (3 minutes)
  staticPageGenerationTimeout: 180,
  
  // Configure CORS headers for all API routes
  async headers() {
    return [
      {
        // Apply to all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ]
      }
    ];
  },
  
  // Define explicit rewrites to handle both webhook URL patterns
  async rewrites() {
    return [
      {
        source: '/api/webhook',
        destination: '/api/webhook',
      },
      {
        source: '/api/webhook/',
        destination: '/api/webhook',
      }
    ];
  },
  
  // Add redirects for webhook handling
  async redirects() {
    return [
      // Diagnostic endpoint for webhook testing
      {
        source: '/webhook-test',
        destination: '/api/webhook/diagnostic',
        permanent: false
      }
    ];
  },
};

module.exports = nextConfig; 