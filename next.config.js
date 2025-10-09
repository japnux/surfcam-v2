/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: ['lucide-react'], // Tree-shake lucide icons
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Retire les console.log en prod
  },
  // Optimisation du bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Optimisations côté client
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
      }
    }
    return config
  },
}

module.exports = nextConfig
