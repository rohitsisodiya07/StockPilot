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
            validate: {
                isInt: true,
                min: 1,
            },
        },

        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        customerName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 255],
            },
        },

        customerEmail: {
            type: DataTypes.STRING(255),
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
        indexes: [
            {
                name: "idx_sales_orders_status_warehouse",
                fields: ["status", "warehouseId"],
            },
            {
                name: "idx_sales_orders_created_at",
                fields: ["createdAt"],
            },
            {
                name: "idx_sales_orders_warehouse_id",
                fields: ["warehouseId"],
            },
            {
                name: "idx_sales_orders_created_by",
                fields: ["createdBy"],
            },
        ],
    }
);

export default SalesOrder;