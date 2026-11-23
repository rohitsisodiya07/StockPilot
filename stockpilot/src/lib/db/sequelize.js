import { Sequelize } from "sequelize";
import dns from "dns";

// 1. Prefer IPv4 and configure ultra-reliable public DNS (Google + Cloudflare)
try {
    dns.setDefaultResultOrder("ipv4first");
    dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch {
    // Unsupported in older environments
}

const isDev = process.env.NODE_ENV !== "production";

// Aiven direct IPv4 mapping to completely eliminate Windows/ISP DNS packet drops
const KNOWN_HOST_IPS = {
    "stockpilot-stockpilot.i.aivencloud.com": "143.198.220.16",
};

const createSequelizeInstance = () => {
    const rawHost = process.env.DB_HOST || "127.0.0.1";
    const isRemote = rawHost !== "127.0.0.1" && rawHost !== "localhost";
    const targetHost = KNOWN_HOST_IPS[rawHost] || rawHost;

    return new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
            host: targetHost,
            port: Number(process.env.DB_PORT) || 3306,
            dialect: "mysql",
            logging: false,
            benchmark: false,
            retry: {
                max: 3,
                timeout: 2000,
                match: [
                    /SequelizeHostNotFoundError/,
                    /SequelizeConnectionError/,
                    /SequelizeConnectionRefusedError/,
                    /SequelizeConnectionTimedOutError/,
                    /SequelizeTimeoutError/,
                    /TimeoutError/,
                    /timed out/,
                    /getaddrinfo ENOTFOUND/,
                    /EAI_AGAIN/,
                    /ECONNRESET/,
                    /ETIMEDOUT/,
                    /PROTOCOL_CONNECTION_LOST/,
                ],
            },
            dialectOptions: isRemote
                ? {
                      ssl: {
                          require: true,
                          rejectUnauthorized: false,
                          servername: rawHost, // TLS SNI matches Aiven hostname certificate
                      },
                      connectTimeout: 10000,
                      enableKeepAlive: true,
                      keepAliveInitialDelay: 5000,
                  }
                : {},
            pool: {
                max: 10,
                min: 0, // Never hold dead/stale sockets indefinitely
                acquire: 20000,
                idle: 10000, // Reclaim idle connections after 10s
                evict: 5000, // Evict dead sockets every 5s
            },
        }
    );
};

// Global singleton pattern for Sequelize in both Dev & Prod (prevents connection leaks across hot-reloads)
if (!globalThis.sequelizeGlobal) {
    globalThis.sequelizeGlobal = createSequelizeInstance();
    // Warm up connection pool in background to eliminate first-request cold start
    globalThis.sequelizeGlobal.authenticate().catch(() => {});
}

const sequelize = globalThis.sequelizeGlobal;

export default sequelize;