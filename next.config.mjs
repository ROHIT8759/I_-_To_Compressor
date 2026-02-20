/** @type {import('next').NextConfig} */
const nextConfig = {
    // Allow images from Cloudinary
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
        ],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '110mb',
        },
    },
};

export default nextConfig;
