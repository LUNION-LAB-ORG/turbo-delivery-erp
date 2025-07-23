/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: process.env.NEXT_PUBLIC_BACKEND_PROTOCOL,
                hostname: 'erp-prod.turbodeliveryapp.com',
            },
            {
                protocol: process.env.NEXT_PUBLIC_BACKEND_PROTOCOL,
                hostname: 'resto-prod.turbodeliveryapp.com',
            },
            {
                protocol: process.env.NEXT_PUBLIC_BACKEND_PROTOCOL,
                hostname: 'customer-prod.turbodeliveryapp.com',
            },
            {
                protocol: process.env.NEXT_PUBLIC_BACKEND_PROTOCOL,
                hostname: 'delivery-prod.turbodeliveryapp.com',
            },
            {
                protocol: process.env.NEXT_PUBLIC_BACKEND_PROTOCOL,
                hostname: 'backend-prod.turbodeliveryapp.com',
            },
        ],
    },
};

module.exports = nextConfig;
