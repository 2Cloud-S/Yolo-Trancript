/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow builds to succeed even with ESLint errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Add redirects for webhook handling
  async redirects() {
    return [
      // Ensure webhook requests are handled properly by explicitly defining the route
      {
        source: '/api/webhook',
        destination: '/api/webhook',
        permanent: true,
        has: [
          {
            type: 'header',
            key: 'paddle-signature'
          }
        ]
      },
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