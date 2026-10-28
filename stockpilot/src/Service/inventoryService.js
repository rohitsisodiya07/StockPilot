import * as inventoryRepository from "@/Repository/inventoryRepository";
import * as productRepository from "@/Repository/productRepository";
import * as warehouseRepository from "@/Repository/warehouseRepository";
import * as userWarehouseService from "@/Service/userWarehouseService";


// Validates product, warehouse, access permission, quantity and duplicate inventory before creating a record.

const createInventory = async (userId, roleId, data) => {
    const { productId, warehouseId, quantity, reorderLevel } = data;

    if (!Number.isInteger(productId) || productId <= 0) {
        throw new Error("Invalid Product ID");
    }

    if (!Number.isInteger(warehouseId) || warehouseId <= 0) {
        throw new Error("Invalid Warehouse ID");
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
        throw new Error("Quantity Must Be A Non-Negative Integer");
    }

    if (!Number.isInteger(reorderLevel) || reorderLevel < 0) {
        throw new Error("Reorder Level Must Be A Non-Negative Integer");
    }

    const product = await productRepository.getOneProduct(productId);

    if (!product) {
        throw new Error("Product Not Found");
    }

    const warehouse = await warehouseRepository.getOneWarehouse(warehouseId);

    if (!warehouse) {
        throw new Error("Warehouse Not Found");
    }

    await userWarehouseService.checkWarehouseAccess(
        userId,
        roleId,
        warehouseId
    );

    const existingInventory = await inventoryRepository.findInventory(
        productId,
        warehouseId
    );

    if (existingInventory) {
        throw new Error("Inventory Already Exists For This Warehouse");
    }

    return await inventoryRepository.createInventory({
        productId,
        warehouseId,
        quantity,
        reorderLevel,
    });
};


const getWarehouseInventory = async (userId, roleId, warehouseId) => {
    if (!Number.isInteger(warehouseId) || warehouseId <= 0) {
        throw new Error("Invalid Warehouse ID");
    }

    const warehouse = await warehouseRepository.getOneWarehouse(warehouseId);

    if (!warehouse) {
        throw new Error("Warehouse Not Found");
    }

    await userWarehouseService.checkWarehouseAccess(
        userId,
        roleId,
        warehouseId
    );

    return await inventoryRepository.getWarehouseInventory(warehouseId);
};


const updateInventory = async (userId, roleId, id, data) => {
    const inventoryId = Number(id);

    if (!Number.isInteger(inventoryId) || inventoryId <= 0) {
        throw new Error("Invalid Inventory ID");
    }

    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {
        throw new Error("Invalid Update Data");
    }

    // Quantity changes must go through stockMovementService.
    if (data.quantity !== undefined) {
        throw new Error(
            "Quantity Must Be Updated Through Stock Movement"
        );
    }

    if (data.reorderLevel === undefined) {
        throw new Error("Reorder Level Is Required");
    }

    if (
        !Number.isInteger(data.reorderLevel) ||
        data.reorderLevel < 0
    ) {
        throw new Error(
            "Reorder Level Must Be A Non-Negative Integer"
        );
    }

    const inventory = await inventoryRepository.getOneInventory(
        inventoryId
    );

    if (!inventory) {
        throw new Error("Inventory Not Found");
    }

    await userWarehouseService.checkWarehouseAccess(
        userId,
        roleId,
        inventory.warehouseId
    );

    return await inventoryRepository.updateInventory(
        inventoryId,
        {
            reorderLevel: data.reorderLevel,
        }
    );
};


const deleteInventory = async (userId, roleId, id) => {
    const inventory = await inventoryRepository.getOneInventory(id);

    if (!inventory) {
        throw new Error("Inventory Not Found");
    }

    await userWarehouseService.checkWarehouseAccess(
        userId,
        roleId,
        inventory.warehouseId
    );

    return await inventoryRepository.deleteInventory(id);
};


const getLowStockInventory = async (userId, roleId, warehouseId) => {
    if (!Number.isInteger(warehouseId) || warehouseId <= 0) {
        throw new Error("Invalid Warehouse ID");
    }

    const warehouse = await warehouseRepository.getOneWarehouse(warehouseId);

    if (!warehouse) {
        throw new Error("Warehouse Not Found");
    }

    await userWarehouseService.checkWarehouseAccess(
        userId,
        roleId,
        warehouseId
    );

    return await inventoryRepository.getLowStockInventory(warehouseId);
};

const getAllInventory = async (userId, roleId) => {
    const parsedUserId = Number(userId);
    const parsedRoleId = Number(roleId);

    if (
        !Number.isInteger(parsedUserId) ||
        parsedUserId <= 0 ||
        !Number.isInteger(parsedRoleId) ||
        parsedRoleId <= 0
    ) {
        throw new Error("Invalid User or Role ID");
    }

    // Admin can view inventory from all warehouses.
    if (parsedRoleId === 1) {
        return await inventoryRepository.getAllInventory();
    }

    // Only Inventory Manager and Warehouse Staff are allowed.
    if (![4, 5].includes(parsedRoleId)) {
        throw new Error("Access Denied: Role Not Allowed");
    }

    const assignments =
        await userWarehouseService.getUserWarehouses(parsedUserId);

    const warehouseIds = assignments.map(
        (assignment) => Number(assignment.warehouseId)
    );

    if (warehouseIds.length === 0) {
        return [];
    }

    const inventoryRecords = await Promise.all(
        warehouseIds.map((warehouseId) =>
            inventoryRepository.getWarehouseInventory(warehouseId)
        )
    );

    return inventoryRecords.flat();
};

const getInventoryById = async (userId, roleId, inventoryId) => {
    if (!Number.isInteger(inventoryId) || inventoryId <= 0) {
        throw new Error("Invalid Inventory ID");
    }

    const inventory = await inventoryRepository.getOneInventory(
        inventoryId
    );

    if (!inventory) {
        throw new Error("Inventory Not Found");
    }

    await userWarehouseService.checkWarehouseAccess(
        userId,
        roleId,
        inventory.warehouseId
    );

    return inventory;
};

export {
    createInventory,
    getAllInventory,
    getInventoryById,
    getWarehouseInventory,
    updateInventory,
    deleteInventory,
    getLowStockInventory
};
