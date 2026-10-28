import { DataTypes } from "sequelize";
import sequelize from "@/lib/db/sequelize";

const Warehouse = sequelize.define(
    "Warehouse",
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
                len: [2, 255],
            },
        },

        location: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },

        address: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
    },
    {
        tableName: "warehouses",
        timestamps: true,
        paranoid: true,
        deletedAt: "deletedAt",
    }
);

export default Warehouse;