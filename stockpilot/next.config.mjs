/** @type {import('next').NextConfig} */
const nextConfig = {
    devIndicators: false,
    serverExternalPackages: ["sequelize", "mysql2", "ioredis", "nodemailer"],
    experimental: {
        optimizePackageImports: ["lucide-react", "recharts"],
    },
};

export default nextConfig;