import { DataTypes } from "sequelize";
import sequelize from "@/lib/db/sequelize";

const StockMovement = sequelize.define(
    "StockMovement",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        inventoryId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isInt: true,
                min: 1,
            },
        },

        type: {
            type: DataTypes.ENUM("IN", "OUT"),
            allowNull: false,
        },

        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isInt: true,
                min: 1,
            },
        },

        note: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                len: [0, 255],
            },
        },

        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isInt: true,
                min: 1,
            },
        },
    },
    {
        tableName: "stock_movements",
        timestamps: true,
    }
);

export default StockMovement;