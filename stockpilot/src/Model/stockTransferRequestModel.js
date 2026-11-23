import { DataTypes } from "sequelize";
import sequelize from "@/lib/db/sequelize";

const StockTransferRequest = sequelize.define(
    "StockTransferRequest",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        fromWarehouseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        toWarehouseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        requestedBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        priority: {
            type: DataTypes.ENUM("LOW", "NORMAL", "HIGH", "URGENT"),
            allowNull: false,
            defaultValue: "NORMAL",
        },
        status: {
            type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED", "COMPLETED"),
            allowNull: false,
            defaultValue: "PENDING",
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        reviewedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        reviewNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        tableName: "stock_transfer_requests",
        timestamps: true,
        indexes: [
            {
                name: "idx_transfer_req_status",
                fields: ["status"],
            },
            {
                name: "idx_transfer_req_from_wh",
                fields: ["fromWarehouseId"],
            },
            {
                name: "idx_transfer_req_to_wh",
                fields: ["toWarehouseId"],
            },
            {
                name: "idx_transfer_req_user",
                fields: ["requestedBy"],
            },
        ],
    }
);

export default StockTransferRequest;
