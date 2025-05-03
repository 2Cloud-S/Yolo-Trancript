/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow builds to succeed even with ESLint errors
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig; 