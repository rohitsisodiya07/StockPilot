import Role from "./roleModel";
import User from "./userModel";
import Warehouse from "./warehouseModel";

Role.hasMany(User, { foreignKey: "roleId", as: "users", });

User.belongsTo(Role, { foreignKey: "roleId", as: "role", });

export {
    Role,
    User,
    Warehouse
};