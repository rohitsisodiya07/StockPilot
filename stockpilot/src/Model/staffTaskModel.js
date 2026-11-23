import { DataTypes } from "sequelize";
import sequelize from "@/lib/db/sequelize";

const StaffTask = sequelize.define(
    "StaffTask",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        assignedTo: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        warehouseId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        priority: {
            type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH", "URGENT"),
            allowNull: false,
            defaultValue: "MEDIUM",
        },
        status: {
            type: DataTypes.ENUM("PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"),
            allowNull: false,
            defaultValue: "PENDING",
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        dueAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        completedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        completionNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        tableName: "staff_tasks",
        timestamps: true,
        indexes: [
            {
                name: "idx_staff_tasks_assigned_status",
                fields: ["assignedTo", "status"],
            },
            {
                name: "idx_staff_tasks_warehouse",
                fields: ["warehouseId"],
            },
            {
                name: "idx_staff_tasks_created_at",
                fields: ["createdAt"],
            },
        ],
    }
);

export default StaffTask;
