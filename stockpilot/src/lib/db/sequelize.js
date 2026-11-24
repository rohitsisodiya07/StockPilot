import { Sequelize } from "sequelize";
import mysql2 from "mysql2";
import dns from "dns";

const isDev = process.env.NODE_ENV !== "production";

// Only customize DNS for local development (Windows/ISP fixes), never in Vercel/production
if (isDev) {
    try {
        dns.setDefaultResultOrder("ipv4first");
        dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch {}
}

// Aiven direct IPv4 mapping to prevent transient local Windows/ISP DNS packet drops
const KNOWN_HOST_IPS = {
    "stockpilot-stockpilot.i.aivencloud.com": "143.198.220.16",
};

const createSequelizeInstance = () => {
    const rawHost = process.env.DB_HOST;
    const dbName = process.env.DB_NAME;
    const dbUser = process.env.DB_USER;
    const dbPassword = process.env.DB_PASSWORD;
    const dbPort = Number(process.env.DB_PORT) || 25639;

    // Fail early with clear message if environment variables are missing on Vercel
    if (!rawHost || !dbPassword || !dbName || !dbUser) {
        const missing = [
            !rawHost && "DB_HOST",
            !dbName && "DB_NAME",
            !dbUser && "DB_USER",
            !dbPassword && "DB_PASSWORD",
        ].filter(Boolean).join(", ");

        console.error(`[DB Config Error] Missing required database environment variables on Vercel: ${missing}`);
        throw new Error(`Database connection cannot be established: Missing environment variables (${missing}) in Vercel project settings.`);
    }

    const isRemote = rawHost !== "127.0.0.1" && rawHost !== "localhost";
    // In local dev on Windows, use direct IP to avoid Wi-Fi DNS drops; in Vercel production, use rawHost directly
    const targetHost = isDev && KNOWN_HOST_IPS[rawHost] ? KNOWN_HOST_IPS[rawHost] : rawHost;

    return new Sequelize(
        dbName,
        dbUser,
        dbPassword,
        {
            host: targetHost,
            port: dbPort,
            dialect: "mysql",
            dialectModule: mysql2,
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
                          ...(targetHost !== rawHost ? { servername: rawHost } : {}),
                      },
                      connectTimeout: 15000,
                      enableKeepAlive: true,
                      keepAliveInitialDelay: 5000,
                  }
                : {},
            pool: {
                max: 5,
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
    // Warm up connection pool only in local development, not during serverless cold starts
    if (isDev) {
        globalThis.sequelizeGlobal.authenticate().catch(() => {});
    }
}

const sequelize = globalThis.sequelizeGlobal;

export default sequelize;