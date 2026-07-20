/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'http',  hostname: 'localhost' },
    ],
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL:    process.env.NEXT_PUBLIC_API_URL    || 'http://localhost:5001/api',
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001',
  },
};
module.exports = nextConfig;
