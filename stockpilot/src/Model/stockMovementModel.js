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
        inventoryId: {//Identifies the inventory record whose stock is changing.
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM("IN", "OUT"),
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
            },
        },
        note: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        userId: {//Identifies the user who performed the stock movement.
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        tableName: "stock_movements",
        timestamps: true,
    }
);

export default StockMovement;
