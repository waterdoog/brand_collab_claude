/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Fix for imap module
    if (isServer) {
      config.externals.push({
        'imap': 'commonjs imap',
        'encoding': 'commonjs encoding'
      });
    }
    return config;
  },
}

module.exports = nextConfig
