import { DataTypes } from "sequelize";
import sequelize from "@/lib/db/sequelize";

const Notification = sequelize.define(
    "Notification",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        roleId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        type: {
            type: DataTypes.ENUM(
                "LOW_STOCK",
                "PO_CREATED",
                "PO_RECEIVED",
                "SO_DISPATCHED",
                "TRANSFER",
                "INFO",
                "WARNING"
            ),
            allowNull: false,
            defaultValue: "INFO",
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        link: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        tableName: "notifications",
        timestamps: true,
        indexes: [
            {
                name: "idx_notifications_user_role",
                fields: ["userId", "roleId", "isRead"],
            },
            {
                name: "idx_notifications_created_at",
                fields: ["createdAt"],
            },
        ],
    }
);

export default Notification;
