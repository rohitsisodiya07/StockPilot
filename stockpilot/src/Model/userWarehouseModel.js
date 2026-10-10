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
        },
        warehouseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        tableName: "user_warehouses",
        timestamps: true,
    }
);

export default UserWarehouse;