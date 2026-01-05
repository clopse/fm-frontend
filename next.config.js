/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Required for PDF.js (react-pdf)
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
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
