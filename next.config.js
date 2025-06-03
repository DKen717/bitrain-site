// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    reactRemoveProperties: false,
    removeConsole: false,
  }
}

module.exports = nextConfig

