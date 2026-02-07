import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: {
    root: path.resolve("./"),
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
