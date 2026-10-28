import { DataTypes } from "sequelize";
import sequelize from "@/lib/db/sequelize";

const SalesOrderItem = sequelize.define(
    "SalesOrderItem",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        salesOrderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isInt: true,
                min: 1,
            },
        },

        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isInt: true,
                min: 1,
            },
        },

        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isInt: true,
                min: 1,
            },
        },

        unitPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0,
                isDecimal: true,
                max: 99999999.99,
            },
        },
    },
    {
        tableName: "sales_order_items",
        timestamps: true,
    }
);

export default SalesOrderItem;