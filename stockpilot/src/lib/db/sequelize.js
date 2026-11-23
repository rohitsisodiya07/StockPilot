import { Sequelize } from "sequelize";

const isDev = process.env.NODE_ENV !== "production";

const createSequelizeInstance = () => {
    const host = process.env.DB_HOST || "127.0.0.1";
    const isRemote = host !== "127.0.0.1" && host !== "localhost";

    return new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
            host,
            port: Number(process.env.DB_PORT) || 3306,
            dialect: "mysql",
            logging: false,
            benchmark: false,
            dialectOptions: isRemote
                ? {
                      ssl: {
                          require: true,
                          rejectUnauthorized: false,
                      },
                      connectTimeout: 20000,
                      enableKeepAlive: true,
                      keepAliveInitialDelay: 10000,
                  }
                : {},
            pool: {
                max: 15,
                min: isDev ? 1 : 0,
                acquire: 30000,
                idle: 60000,
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