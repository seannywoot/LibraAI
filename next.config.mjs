/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure body size limit for file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Adjust based on your needs
    },
  },
};

export default nextConfig;
