
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...config.externals, "handlebars"];
    }
    return config;
  },
  experimental: {
    allowedDevOrigins: [
        "https://6000-firebase-studio-1757941805991.cluster-zumahodzirciuujpqvsniawo3o.cloudworkstations.dev",
        "https://9000-firebase-studio-1757941805991.cluster-zumahodzirciuujpqvsniawo3o.cloudworkstations.dev"
    ],
  },
};

module.exports = nextConfig;
