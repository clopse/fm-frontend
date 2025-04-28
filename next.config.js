/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,  // Still helpful for dev
  swcMinify: true,        // Also good to keep
  images: {
    unoptimized: true,    // ✅ Disable Next.js image optimization
  },
  async redirects() {
    return [
      {
        source: '/old-url',
        destination: '/new-url',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
