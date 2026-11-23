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
            allowNull: true,
        },
    },
    {
        tableName: "stock_movements",
        timestamps: true,
        indexes: [
            {
                name: "idx_stock_movements_inventory_id",
                fields: ["inventoryId"],
            },
            {
                name: "idx_stock_movements_user_id",
                fields: ["userId"],
            },
            {
                name: "idx_stock_movements_created_at",
                fields: ["createdAt"],
            },
            {
                name: "idx_stock_movements_inv_created",
                fields: ["inventoryId", "createdAt"],
            },
            {
                name: "idx_stock_movements_type_created",
                fields: ["type", "createdAt"],
            },
        ],
    }
);

export default StockMovement;