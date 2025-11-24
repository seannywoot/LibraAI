/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure body size limit for file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Adjust based on your needs
    },
  },
  // Turbopack configuration for Next.js 16+
  turbopack: {
    resolveAlias: {
      canvas: './empty-module.js',
    },
  },
  // Webpack fallback for when not using Turbopack
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
      };
    }
    
    // PDF.js configuration for serverless
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
