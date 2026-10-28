
import { DataTypes } from "sequelize";
import sequelize from "@/lib/db/sequelize";

const Supplier = sequelize.define(
    "Supplier",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        name: {
            type: DataTypes.STRING(150),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Supplier Name Is Required",
                },
                len: {
                    args: [2, 150],
                    msg: "Supplier Name Must Be 2-150 Characters",
                },
            },
        },

        email: {
            type: DataTypes.STRING(254),
            allowNull: true,
            unique: true,
            validate: {
                isEmail: {
                    msg: "Valid Supplier Email Is Required",
                },
            },
        },

        phone: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },

        address: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        status: {
            type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
            allowNull: false,
            defaultValue: "ACTIVE",
        },
    },
    {
        tableName: "suppliers",
        timestamps: true,
    }
);

export default Supplier;
