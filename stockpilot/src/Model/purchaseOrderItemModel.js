import { DataTypes } from "sequelize";
import sequelize from "@/lib/db/sequelize";

const PurchaseOrderItem = sequelize.define(
    "PurchaseOrderItem",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        purchaseOrderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1 },
        },
        unitPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: { min: 0 },
        },
    },
    {
        tableName: "purchase_order_items",
        timestamps: true,
    }
);

export default PurchaseOrderItem;
