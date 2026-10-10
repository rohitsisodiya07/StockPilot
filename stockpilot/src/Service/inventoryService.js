import * as inventoryRepository from "@/Repository/inventoryRepository";
import * as productRepository from "@/Repository/productRepository";
import * as warehouseRepository from "@/Repository/warehouseRepository";
import * as userWarehouseService from "@/Service/userWarehouseService";


// Validates product, warehouse, access permission, quantity and duplicate inventory before creating a record.
const createInventory = async (userId, roleId, data) => {
    const { productId, warehouseId, quantity, reorderLevel } = data;

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

    if (quantity < 0 || !Number.isInteger(quantity)) {
        throw new Error("Quantity Must Be A Non-Negative Integer");
    }

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
    const inventory = await inventoryRepository.getOneInventory(id);

    if (!inventory) {
        throw new Error("Inventory Not Found");
    }

    await userWarehouseService.checkWarehouseAccess(
        userId,
        roleId,
        inventory.warehouseId
    );

    const updateData = {};

    if (data.quantity !== undefined) {
        if (!Number.isInteger(data.quantity) || data.quantity < 0) {
            throw new Error("Quantity Must Be A Non-Negative Integer");
        }

        updateData.quantity = data.quantity;
    }

    if (data.reorderLevel !== undefined) {
        if (!Number.isInteger(data.reorderLevel) || data.reorderLevel < 0) {
            throw new Error("Reorder Level Must Be A Non-Negative Integer");
        }

        updateData.reorderLevel = data.reorderLevel;
    }

    if (Object.keys(updateData).length === 0) {
        throw new Error("Quantity or Reorder Level Is Required");
    }

    return await inventoryRepository.updateInventory(id, updateData);
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



export {
    createInventory,
    getWarehouseInventory,
    updateInventory,
    deleteInventory,
    getLowStockInventory
};
