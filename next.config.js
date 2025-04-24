/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Enables React Strict Mode, which helps in detecting potential problems in your app
  swcMinify: true, // Enables SWC-based minification for better performance
  images: {
    domains: ['example.com'], // Add any domains that host images used in your app (e.g., external image sources)
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
