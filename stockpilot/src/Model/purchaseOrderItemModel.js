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
            references: {
                model: "purchase_orders",
                key: "id",
            },
            validate: {
                min: 1,
            },
        },

        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "products",
                key: "id",
            },
            validate: {
                min: 1,
            },
        },

        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                isInt: true,
            },
        },

        unitPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0,
                isDecimal: true,
            },
        },
    },
    {
        tableName: "purchase_order_items",
        timestamps: true,
    }
);

export default PurchaseOrderItem;
