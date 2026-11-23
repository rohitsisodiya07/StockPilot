import { Sequelize } from "sequelize";

const isDev = process.env.NODE_ENV !== "production";

const createSequelizeInstance = () => {
    return new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
            host: process.env.DB_HOST || "127.0.0.1",
            port: Number(process.env.DB_PORT) || 3306,
            dialect: "mysql",
            logging: false,
            benchmark: false,
            pool: {
                max: 10,
                min: 2,
                acquire: 30000,
                idle: 10000,
            },
        }
    );
};

// Global singleton pattern for Sequelize in both Dev & Prod (prevents connection leaks across hot-reloads)
if (!globalThis.sequelizeGlobal) {
    globalThis.sequelizeGlobal = createSequelizeInstance();
}

const sequelize = globalThis.sequelizeGlobal;

export default sequelize;