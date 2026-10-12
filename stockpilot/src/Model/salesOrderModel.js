
import { DataTypes } from "sequelize";
import sequelize from "@/lib/db/sequelize";

const SalesOrder = sequelize.define(
    "SalesOrder",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        warehouseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        customerName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        customerEmail: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isEmail: true,
            },
        },
        status: {
            type: DataTypes.ENUM(
                "DRAFT",
                "CONFIRMED",
                "DISPATCHED",
                "CANCELLED"
            ),
            allowNull: false,
            defaultValue: "DRAFT",
        },
    },
    {
        tableName: "sales_orders",
        timestamps: true,
    }
);

export default SalesOrder;
