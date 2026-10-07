import { DataTypes } from "sequelize";
import sequelize from '@/lib/db/sequelize';


const Role = sequelize.define(
    'Role',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: false
        }
    },
    {
        tableName: 'roles',
        timestamps: true,
        deleatedAt: true
    }
);

export default Role;