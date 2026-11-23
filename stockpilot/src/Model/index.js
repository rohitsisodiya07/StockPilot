import Role from "./roleModel";
import User from "./userModel";
import Warehouse from "./warehouseModel";
import UserWarehouse from "./userWarehouseModel";
import Product from "./productModel";
import Inventory from "./inventoryModel";
import StockMovement from "./stockMovementModel";
import Supplier from "./supplierModel";
import PurchaseOrder from "./purchaseOrderModel";
import PurchaseOrderItem from "./purchaseOrderItemModel";
import SalesOrder from "./salesOrderModel";
import SalesOrderItem from "./salesOrderItemModel";
import Category from "./categoryModel";
import Notification from "./notificationModel";
import AuditLog from "./auditLogModel";
import StaffTask from "./staffTaskModel";
import StaffShift from "./staffShiftModel";
import StockTransferRequest from "./stockTransferRequestModel";
import ReturnInspection from "./returnInspectionModel";

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


//Allows one inventory record to have multiple stock movement records.
Inventory.hasMany(StockMovement, { foreignKey: "inventoryId", as: "stockMovements", });

//Links each stock movement to its inventory record.
StockMovement.belongsTo(Inventory, { foreignKey: "inventoryId", as: "inventory", });

//Allows one user to perform multiple stock movements.
User.hasMany(StockMovement, { foreignKey: "userId", as: "stockMovements", });

//Identifies the user who performed a stock movement.
StockMovement.belongsTo(User, { foreignKey: "userId", as: "user", });

// One purchase order can contain multiple items.
PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: "purchaseOrderId", as: "items", });

//Links an item to its purchase order.
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: "purchaseOrderId", as: "purchaseOrder", });

//One product can appear in multiple purchase orders.
Product.hasMany(PurchaseOrderItem, { foreignKey: "productId", as: "purchaseOrderItems", });

//Retrieves product details for an order item.
PurchaseOrderItem.belongsTo(Product, { foreignKey: "productId", as: "product", });

//Current model belongs to another model
PurchaseOrder.belongsTo(Supplier, { foreignKey: "supplierId", as: "supplier", });

//One record can have multiple related records
Supplier.hasMany(PurchaseOrder, { foreignKey: "supplierId", as: "purchaseOrders", });

//One record has one related record
PurchaseOrder.belongsTo(Warehouse, { foreignKey: "warehouseId", as: "warehouse", });

//Models relate through a junction table
PurchaseOrder.belongsTo(User, { foreignKey: "createdBy", as: "creator", });

User.hasMany(PurchaseOrder, { foreignKey: "createdBy", as: "purchaseOrders", });

//Har Sales Order ek particular warehouse se belong karta hai
SalesOrder.belongsTo(Warehouse, { foreignKey: "warehouseId", as: "warehouse", });

//Ek warehouse mein multiple Sales Orders ho sakte hain.
Warehouse.hasMany(SalesOrder, { foreignKey: "warehouseId", as: "salesOrders", });

//Pata chalta hai ki Sales Order kis user ne create kiya.
SalesOrder.belongsTo(User, { foreignKey: "createdBy", as: "creator", });

//k record ke multiple related records ho sakte hain
User.hasMany(SalesOrder, { foreignKey: "createdBy", as: "salesOrders", });

//One order can contain multiple products.
SalesOrder.hasMany(SalesOrderItem, { foreignKey: "salesOrderId", as: "items", });

//Each item belongs to one order.
SalesOrderItem.belongsTo(SalesOrder, { foreignKey: "salesOrderId", as: "salesOrder", });

//A product can appear in multiple orders
Product.hasMany(SalesOrderItem, { foreignKey: "productId", as: "salesOrderItems", });

//Each order item refers to one product
SalesOrderItem.belongsTo(Product, { foreignKey: "productId", as: "product", });

// One category can contain multiple products.
Category.hasMany(Product, { foreignKey: "categoryId", as: "products", });

// Each product belongs to one category.
Product.belongsTo(Category, { foreignKey: "categoryId", as: "category", });

// Notifications
User.hasMany(Notification, { foreignKey: "userId", as: "notifications" });
Notification.belongsTo(User, { foreignKey: "userId", as: "user" });

// Audit Logs
User.hasMany(AuditLog, { foreignKey: "userId", as: "auditLogs" });
AuditLog.belongsTo(User, { foreignKey: "userId", as: "user" });

// Staff Tasks
User.hasMany(StaffTask, { foreignKey: "assignedTo", as: "assignedTasks" });
StaffTask.belongsTo(User, { foreignKey: "assignedTo", as: "assignee" });
StaffTask.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
StaffTask.belongsTo(Warehouse, { foreignKey: "warehouseId", as: "warehouse" });

// Staff Shifts
User.hasMany(StaffShift, { foreignKey: "userId", as: "shifts" });
StaffShift.belongsTo(User, { foreignKey: "userId", as: "user" });
StaffShift.belongsTo(Warehouse, { foreignKey: "warehouseId", as: "warehouse" });

// Stock Transfer Requests
StockTransferRequest.belongsTo(Product, { foreignKey: "productId", as: "product" });
StockTransferRequest.belongsTo(Warehouse, { foreignKey: "fromWarehouseId", as: "fromWarehouse" });
StockTransferRequest.belongsTo(Warehouse, { foreignKey: "toWarehouseId", as: "toWarehouse" });
StockTransferRequest.belongsTo(User, { foreignKey: "requestedBy", as: "requester" });

// Return Inspections
ReturnInspection.belongsTo(Product, { foreignKey: "productId", as: "product" });
ReturnInspection.belongsTo(Warehouse, { foreignKey: "warehouseId", as: "warehouse" });
ReturnInspection.belongsTo(User, { foreignKey: "inspectedBy", as: "inspector" });

export {
    Role,
    User,
    Warehouse,
    UserWarehouse,
    Product,
    Inventory,
    StockMovement,
    Supplier,
    PurchaseOrder,
    PurchaseOrderItem,
    SalesOrder,
    SalesOrderItem,
    Category,
    Notification,
    AuditLog,
    StaffTask,
    StaffShift,
    StockTransferRequest,
    ReturnInspection,
};