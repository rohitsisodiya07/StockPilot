import { DataTypes } from "sequelize";
import sequelize from "@/lib/db/sequelize";

const UserWarehouse = sequelize.define(
    "UserWarehouse",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isInt: true,
                min: 1,
            },
        },

        warehouseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isInt: true,
                min: 1,
            },
        },
    },
    {
        tableName: "user_warehouses",
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ["userId", "warehouseId"],
            },
        ],
    }
);

export default UserWarehouse;