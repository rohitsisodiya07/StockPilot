import * as userWarehouseRepository from "@/Repository/userWarehouseRepository";
import * as userRepository from "@/Repository/userRepository";
import * as warehouseRepository from "@/Repository/warehouseRepository";

// Assign Warehouse
const assignWarehouse = async (userId, warehouseId) => {
    const user = await userRepository.getOneUser(userId);

    if (!user) {
        throw new Error("User Not Found");
    }

    if (user.roleId !== 4) {
        throw new Error("Only Inventory Manager Can Be Assigned");
    }

    const warehouse = await warehouseRepository.getOneWarehouse(warehouseId);

    if (!warehouse) {
        throw new Error("Warehouse Not Found");
    }

    const existingAssignment =
        await userWarehouseRepository.findAssignment(
            userId,
            warehouseId
        );

    if (existingAssignment) {
        throw new Error("Warehouse Already Assigned");
    }

    return await userWarehouseRepository.createAssignment({
        userId,
        warehouseId,
    });
};

// Get User Warehouses
const getUserWarehouses = async (userId) => {
    const user = await userRepository.getOneUser(userId);

    if (!user) {
        throw new Error("User Not Found");
    }

    return await userWarehouseRepository.getUserWarehouses(userId);
};

const getWarehouseUsers = async (warehouseId) => {
    const warehouse =
        await warehouseRepository.getOneWarehouse(warehouseId);

    if (!warehouse) {
        throw new Error("Warehouse Not Found");
    }

    return await userWarehouseRepository.getWarehouseUsers(warehouseId);
};

const removeAssignment = async (userId, warehouseId) => {
    const user = await userRepository.getOneUser(userId);

    if (!user) {
        throw new Error("User Not Found");
    }

    const warehouse =
        await warehouseRepository.getOneWarehouse(warehouseId);

    if (!warehouse) {
        throw new Error("Warehouse Not Found");
    }

    const assignment =
        await userWarehouseRepository.deleteAssignment(
            userId,
            warehouseId
        );

    if (!assignment) {
        throw new Error("Assignment Not Found");
    }

    return true;
};

const assignStaff = async (managerId, staffId, warehouseId) => {
    const manager = await userRepository.getOneUser(managerId);

    if (!manager) {
        throw new Error("Manager Not Found");
    }

    if (manager.roleId !== 4) {
        throw new Error("Only Inventory Manager Can Assign Staff");
    }

    const staff = await userRepository.getOneUser(staffId);

    if (!staff) {
        throw new Error("Staff Not Found");
    }

    if (staff.roleId !== 5) {
        throw new Error("Only Warehouse Staff Can Be Assigned");
    }

    const warehouse =
        await warehouseRepository.getOneWarehouse(warehouseId);

    if (!warehouse) {
        throw new Error("Warehouse Not Found");
    }

    const managerAssignment =
        await userWarehouseRepository.findAssignment(
            managerId,
            warehouseId
        );

    if (!managerAssignment) {
        throw new Error("Manager Is Not Assigned To This Warehouse");
    }

    const existingAssignment =
        await userWarehouseRepository.findAssignment(
            staffId,
            warehouseId
        );

    if (existingAssignment) {
        throw new Error("Staff Already Assigned To This Warehouse");
    }

    return await userWarehouseRepository.createAssignment({
        userId: staffId,
        warehouseId,
    });
};


const checkWarehouseAccess = async (userId, roleId, warehouseId) => {
    if (roleId === 1) {
        return true;
    }

    const assignment =
        await userWarehouseRepository.findAssignment(
            userId,
            warehouseId
        );

    if (!assignment) {
        throw new Error("Access Denied: Warehouse Not Assigned");
    }

    return true;
};


export {
    assignWarehouse,
    getUserWarehouses,
    getWarehouseUsers,
    removeAssignment,
    assignStaff,
    checkWarehouseAccess
};