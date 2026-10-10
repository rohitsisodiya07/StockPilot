
import { DataTypes } from "sequelize";
import sequelize from "@/lib/db/sequelize";

const Inventory = sequelize.define(
    "Inventory",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        warehouseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0,
            },
        },
        reorderLevel: {//Minimum stock threshold
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 10,
            validate: {
                min: 0,
            },
        },
    },
    {
        tableName: "inventory",
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ["productId", "warehouseId"],
            },
        ],
    }
);

export default Inventory;
