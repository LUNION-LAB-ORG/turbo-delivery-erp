/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    images:{
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'images.unsplash.com',
            // port: '',
            // pathname: '/demos/images/**',
          },
        ],
    },
};

module.exports = nextConfig;
