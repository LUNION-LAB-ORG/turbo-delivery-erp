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
                protocol: "https",
                hostname: 'erp.turbodeliveryapp.com',
            },
            {
                protocol: "https",
                hostname: 'resto.turbodeliveryapp.com',
            },
            {
                protocol: "https",
                hostname: 'customer.turbodeliveryapp.com',
            },
            {
                protocol: "https",
                hostname: 'delivery.turbodeliveryapp.com',
            },
            {
                protocol: "https",
                hostname: 'backend.turbodeliveryapp.com',
            },
        ],
    },
};

module.exports = nextConfig;
