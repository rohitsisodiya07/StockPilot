import Role from "./roleModel";
import User from "./userModel";

Role.hasMany(User, { foreignKey: "roleId", as: "users", });

User.belongsTo(Role, { foreignKey: "roleId", as: "role", });

export {
    Role,
    User,
};