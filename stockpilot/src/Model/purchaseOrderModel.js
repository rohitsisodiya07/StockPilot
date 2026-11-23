import { DataTypes } from "sequelize";
import sequelize from "@/lib/db/sequelize";

const PurchaseOrder = sequelize.define(
    "PurchaseOrder",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        supplierId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        warehouseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM(
                "DRAFT",
                "ORDERED",
                "RECEIVED",
                "CANCELLED"
            ),
            allowNull: false,
            defaultValue: "DRAFT",
        },
        expectedDeliveryDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
    },
    {
        tableName: "purchase_orders",
        timestamps: true,
        indexes: [
            {
                name: "idx_purchase_orders_status_warehouse",
                fields: ["status", "warehouseId"],
            },
            {
                name: "idx_purchase_orders_supplier_id",
                fields: ["supplierId"],
            },
            {
                name: "idx_purchase_orders_created_at",
                fields: ["createdAt"],
            },
        ],
    }
);

export default PurchaseOrder;
