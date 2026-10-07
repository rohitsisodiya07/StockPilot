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
        },
        location: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        address: {
            type: DataTypes.STRING,
            allowNull: false,
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