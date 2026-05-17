/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // react-markdown v9+ is ESM-only; Next.js needs to transpile it
  transpilePackages: ['react-markdown'],
  // Required for PDF.js (react-pdf) — canvas and encoding are Node-only modules
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

module.exports = nextConfig;
