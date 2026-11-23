import { DataTypes } from "sequelize";
import sequelize from "@/lib/db/sequelize";

const StaffShift = sequelize.define(
    "StaffShift",
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
        warehouseId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        clockIn: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        clockOut: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM("ACTIVE", "COMPLETED"),
            allowNull: false,
            defaultValue: "ACTIVE",
        },
        durationMinutes: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        tableName: "staff_shifts",
        timestamps: true,
        indexes: [
            {
                name: "idx_staff_shifts_user_status",
                fields: ["userId", "status"],
            },
            {
                name: "idx_staff_shifts_warehouse",
                fields: ["warehouseId"],
            },
            {
                name: "idx_staff_shifts_clock_in",
                fields: ["clockIn"],
            },
        ],
    }
);

export default StaffShift;
