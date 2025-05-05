/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow builds to succeed even with ESLint errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Skip trailing slash redirects to prevent 308 redirects
  skipTrailingSlashRedirect: true,
  
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