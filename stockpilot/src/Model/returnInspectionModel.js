import { DataTypes } from "sequelize";
import sequelize from "@/lib/db/sequelize";

const ReturnInspection = sequelize.define(
    "ReturnInspection",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        referenceNumber: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        customerName: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        warehouseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        condition: {
            type: DataTypes.ENUM("GOOD", "DAMAGED"),
            allowNull: false,
            defaultValue: "GOOD",
        },
        action: {
            type: DataTypes.ENUM("RESTOCK", "SCRAP"),
            allowNull: false,
            defaultValue: "RESTOCK",
        },
        reason: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        inspectedBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        tableName: "return_inspections",
        timestamps: true,
        indexes: [
            {
                name: "idx_return_inspections_wh",
                fields: ["warehouseId"],
            },
            {
                name: "idx_return_inspections_prod",
                fields: ["productId"],
            },
            {
                name: "idx_return_inspections_user",
                fields: ["inspectedBy"],
            },
            {
                name: "idx_return_inspections_date",
                fields: ["createdAt"],
            },
        ],
    }
);

export default ReturnInspection;
