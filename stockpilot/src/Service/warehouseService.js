import * as warehouseRepository from "@/Repository/warehouseRepository";

// Create Warehouse
const createWarehouse = async (data) => {
    const existingWarehouse = await warehouseRepository.findByName(data.name);

    if (existingWarehouse) {
        throw new Error("Warehouse Already Exists");
    }

    return await warehouseRepository.createWarehouse(data);
};

// Get All Warehouses
const getAllWarehouses = async () => {
    return await warehouseRepository.getAllWarehouses();
};

// Get One Warehouse
const getOneWarehouse = async (id) => {
    const warehouse = await warehouseRepository.getOneWarehouse(id);

    if (!warehouse) {
        throw new Error("Warehouse Not Found");
    }

    return warehouse;
};

// Update Warehouse
const updateWarehouse = async (id, data) => {
    const warehouse = await warehouseRepository.getOneWarehouse(id);

    if (!warehouse) {
        throw new Error("Warehouse Not Found");
    }

    if (data.name) {
        const existingWarehouse = await warehouseRepository.findByName(data.name);

        if (
            existingWarehouse &&
            existingWarehouse.id !== Number(id)
        ) {
            throw new Error("Warehouse Already Exists");
        }
    }

    return await warehouseRepository.updateWarehouse(id, data);
};

// Delete Warehouse
const deleteWarehouse = async (id) => {
    const warehouse = await warehouseRepository.getOneWarehouse(id);

    if (!warehouse) {
        throw new Error("Warehouse Not Found");
    }

    await warehouseRepository.deleteWarehouse(id);

    return true;
};

const getWarehouseDetails = async (id) => {
    const warehouse = await warehouseRepository.getWarehouseDetails(id);

    if (!warehouse) {
        throw new Error("Warehouse Not Found");
    }

    const warehouseData = warehouse.toJSON();

    const inventory = warehouseData.inventory || [];
    const assignments = warehouseData.userAssignments || [];

    const lowStockItems = inventory.filter(
        (item) => item.quantity <= item.reorderLevel
    );

    const totalProducts = inventory.length;

    const totalInventoryUnits = inventory.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
    );

    return {
        ...warehouseData,

        inventorySummary: {
            totalProducts,
            totalInventoryUnits,
            lowStockCount: lowStockItems.length,
        },

        lowStockItems,

        assignedUsers: assignments
            .filter((assignment) => assignment.user)
            .map((assignment) => ({
                id: assignment.user.id,
                name: assignment.user.name,
                email: assignment.user.email,
                roleId: assignment.user.roleId,
                role: assignment.user.role?.name || "Unknown",
            })),
    };
};


export {
    createWarehouse,
    getAllWarehouses,
    getOneWarehouse,
    updateWarehouse,
    deleteWarehouse,
    getWarehouseDetails
};