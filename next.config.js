/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,  // still fine
  images: {
    unoptimized: true,    // leave this if you want to avoid Next image optimization
  },
  async redirects() {
    return [
      {
        source: "/old-url",
        destination: "/new-url",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
