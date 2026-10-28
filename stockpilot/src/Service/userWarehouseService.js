import * as userWarehouseRepository from "@/Repository/userWarehouseRepository";
import * as userRepository from "@/Repository/userRepository";
import * as warehouseRepository from "@/Repository/warehouseRepository";

// Assign Warehouse

const assignWarehouse = async (userId, warehouseId) => {
    // 1. Check user exists
    const user = await userRepository.getOneUser(userId);

    if (!user) {
        throw new Error("User Not Found");
    }

    // 2. Allow only Inventory Manager and Warehouse Staff
    if (![4, 5].includes(Number(user.roleId))) {
        throw new Error(
            "Only Inventory Manager and Warehouse Staff Can Be Assigned"
        );
    }

    // 3. Check warehouse exists
    const warehouse =
        await warehouseRepository.getOneWarehouse(warehouseId);

    if (!warehouse) {
        throw new Error("Warehouse Not Found");
    }

    // 4. Prevent duplicate assignment
    const existingAssignment =
        await userWarehouseRepository.findAssignment(
            userId,
            warehouseId
        );

    if (existingAssignment) {
        throw new Error("User Already Assigned To This Warehouse");
    }

    // 5. Allow only one Inventory Manager per warehouse
    if (Number(user.roleId) === 4) {
        const warehouseUsers =
            await userWarehouseRepository.getWarehouseUsers(
                warehouseId
            );

        const existingManager = warehouseUsers.find(
            (assignment) =>
                Number(assignment.user?.roleId) === 4
        );

        if (existingManager) {
            throw new Error(
                "This Warehouse Already Has An Inventory Manager"
            );
        }
    }

    // 6. Create assignment
    return await userWarehouseRepository.createAssignment({
        userId: Number(userId),
        warehouseId: Number(warehouseId),
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
    const parsedUserId = Number(userId);
    const parsedRoleId = Number(roleId);
    const parsedWarehouseId = Number(warehouseId);

    if (
        !Number.isInteger(parsedUserId) ||
        parsedUserId <= 0 ||
        !Number.isInteger(parsedRoleId) ||
        parsedRoleId <= 0 ||
        !Number.isInteger(parsedWarehouseId) ||
        parsedWarehouseId <= 0
    ) {
        throw new Error("Invalid User, Role or Warehouse ID");
    }

    // Admin can access all existing warehouses.
    if (parsedRoleId === 1) {
        const warehouse =
            await warehouseRepository.getOneWarehouse(parsedWarehouseId);

        if (!warehouse) {
            throw new Error("Warehouse Not Found");
        }

        return true;
    }

    // Only Inventory Manager and Warehouse Staff use assignments.
    if (![4, 5].includes(parsedRoleId)) {
        throw new Error("Access Denied: Role Not Allowed");
    }

    const assignment =
        await userWarehouseRepository.findAssignment(
            parsedUserId,
            parsedWarehouseId
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