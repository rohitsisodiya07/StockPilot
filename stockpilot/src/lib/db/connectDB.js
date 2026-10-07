import sequelize from "./sequelize"
import '@/Model'

let isConnected = false;

const connectDB = async () => {
    if (isConnected) {
        return sequelize;
    }

    try {
        await sequelize.authenticate();

        console.log("MySQL Connected Successfully");

        await sequelize.sync();

        console.log("All Models Synced Successfully");

        isConnected = true;

        return sequelize;
    } catch (error) {
        console.error("Database Connection Failed:", error.message);

        throw error;
    }
};

export default connectDB;