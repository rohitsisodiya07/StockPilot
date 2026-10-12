
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
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
            },
        },
        unitPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0,
            },
        },
    },
    {
        tableName: "sales_order_items",
        timestamps: true,
    }
);

export default SalesOrderItem;
