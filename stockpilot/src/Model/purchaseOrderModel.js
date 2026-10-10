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
            allowNull: false,
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
    }
);

export default PurchaseOrder;
