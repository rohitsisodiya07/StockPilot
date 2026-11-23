import { DataTypes } from "sequelize";
import sequelize from "@/lib/db/sequelize";

const AuditLog = sequelize.define(
    "AuditLog",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        action: {
            type: DataTypes.ENUM(
                "CREATE",
                "UPDATE",
                "DELETE",
                "TRANSFER",
                "RECEIVE",
                "DISPATCH",
                "LOGIN",
                "REORDER"
            ),
            allowNull: false,
        },
        entity: {
            type: DataTypes.STRING(64),
            allowNull: false,
        },
        entityId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        details: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        ipAddress: {
            type: DataTypes.STRING(45),
            allowNull: true,
        },
    },
    {
        tableName: "audit_logs",
        timestamps: true,
        indexes: [
            {
                name: "idx_audit_logs_user_id",
                fields: ["userId"],
            },
            {
                name: "idx_audit_logs_entity",
                fields: ["entity", "entityId"],
            },
            {
                name: "idx_audit_logs_created_at",
                fields: ["createdAt"],
            },
        ],
    }
);

export default AuditLog;
