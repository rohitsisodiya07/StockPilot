import sequelize from "./sequelize";
import "@/Model";

let connectionPromise = null;

const connectDB = async () => {
    if (globalThis.dbIsConnected) {
        return sequelize;
    }

    if (!connectionPromise) {
        connectionPromise = (async () => {
            try {
                await sequelize.authenticate();

                // Only sync models during initial setup or when explicitly enabled
                if (process.env.SYNC_DB === "true") {
                    await sequelize.sync();
                    console.log("All Models Synced Successfully");
                }

                globalThis.dbIsConnected = true;
                return sequelize;
            } catch (error) {
                connectionPromise = null;
                console.error("Database Connection Failed:", error.message);
                throw error;
            }
        })();
    }

    return await connectionPromise;
};

export default connectDB;