import { DataTypes } from "sequelize";
import sequelize from "@/lib/db/sequelize";

const Role = sequelize.define(
    "Role",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true,
                len: [2, 100],
            },
        },
    },
    {
        tableName: "roles",
        timestamps: true,
    }
);

export default Role;