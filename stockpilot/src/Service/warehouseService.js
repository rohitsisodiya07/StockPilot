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

export {
    createWarehouse,
    getAllWarehouses,
    getOneWarehouse,
    updateWarehouse,
    deleteWarehouse,
};