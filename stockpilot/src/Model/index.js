import Role from "./roleModel";
import User from "./userModel";
import Warehouse from "./warehouseModel";
import UserWarehouse from "./userWarehouseModel";
import Product from "./productModel";
import Inventory from "./inventoryModel";

//Role->User
Role.hasMany(User, { foreignKey: "roleId", as: "users", });

//User->Role
User.belongsTo(Role, { foreignKey: "roleId", as: "role", });

//User->UserWarehouse
User.hasMany(UserWarehouse, { foreignKey: "userId", as: "warehouseAssignments", });

// UserWarehouse -> User
UserWarehouse.belongsTo(User, { foreignKey: "userId", as: "user", });

// Warehouse -> UserWarehouse
Warehouse.hasMany(UserWarehouse, { foreignKey: "warehouseId", as: "userAssignments", });

// UserWarehouse -> Warehouse
UserWarehouse.belongsTo(Warehouse, { foreignKey: "warehouseId", as: "warehouse", });

//ek product ke multiple warehouse inventory records ho sakte hain
Product.hasMany(Inventory, { foreignKey: "productId", as: "inventory", });

//har inventory record ek product se belong karta hai.
Inventory.belongsTo(Product, { foreignKey: "productId", as: "product", });

//ek warehouse mein multiple products ka stock ho sakta hai.
Warehouse.hasMany(Inventory, { foreignKey: "warehouseId", as: "inventory", });

// har inventory record ek warehouse se belong karta hai.
Inventory.belongsTo(Warehouse, { foreignKey: "warehouseId", as: "warehouse", });


export {
    Role,
    User,
    Warehouse,
    UserWarehouse,
    Product,
    Inventory
};