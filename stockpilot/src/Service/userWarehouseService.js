import * as userWarehouseRepository from "@/Repository/userWarehouseRepository";
import * as userRepository from "@/Repository/userRepository";
import * as warehouseRepository from "@/Repository/warehouseRepository";

// Role constants
const ADMIN = 1;
const INVENTORY_MANAGER = 4;
const WAREHOUSE_STAFF = 5;

const ASSIGNABLE_ROLES = [
    INVENTORY_MANAGER,
    WAREHOUSE_STAFF,
];

// Validate positive integer IDs
const validateId = (id, fieldName = "ID") => {
    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
        throw new Error(`Invalid ${fieldName}`);
    }

    return parsedId;
};

// Get user
const getUserOrThrow = async (
    userId,
    message = "User Not Found"
) => {
    const parsedUserId = validateId(userId, "User ID");

    const user = await userRepository.getOneUser(parsedUserId);

    if (!user) {
        throw new Error(message);
    }

    return user;
};

// Get warehouse
const getWarehouseOrThrow = async (warehouseId) => {
    const parsedWarehouseId = validateId(
        warehouseId,
        "Warehouse ID"
    );

    const warehouse =
        await warehouseRepository.getOneWarehouse(parsedWarehouseId);

    if (!warehouse) {
        throw new Error("Warehouse Not Found");
    }

    return warehouse;
};

// Assign Warehouse - Admin
const assignWarehouse = async (userId, warehouseId) => {
    const parsedUserId = validateId(userId, "User ID");
    const parsedWarehouseId = validateId(
        warehouseId,
        "Warehouse ID"
    );

    const user = await getUserOrThrow(parsedUserId);
    const roleId = Number(user.roleId);

    if (!ASSIGNABLE_ROLES.includes(roleId)) {
        throw new Error(
            "Only Inventory Manager and Warehouse Staff Can Be Assigned"
        );
    }

    await getWarehouseOrThrow(parsedWarehouseId);

    const existingAssignment =
        await userWarehouseRepository.findAssignment(
            parsedUserId,
            parsedWarehouseId
        );

    if (existingAssignment) {
        throw new Error(
            "User Already Assigned To This Warehouse"
        );
    }

    // Only one Inventory Manager per warehouse
    if (roleId === INVENTORY_MANAGER) {
        const warehouseUsers =
            await userWarehouseRepository.getWarehouseUsers(
                parsedWarehouseId
            );

        const existingManager = warehouseUsers.some(
            (assignment) =>
                Number(assignment.user?.roleId) === INVENTORY_MANAGER
        );

        if (existingManager) {
            throw new Error(
                "This Warehouse Already Has An Inventory Manager"
            );
        }
    }

    return await userWarehouseRepository.createAssignment({
        userId: parsedUserId,
        warehouseId: parsedWarehouseId,
    });
};

// Get User Warehouses
const getUserWarehouses = async (userId) => {
    const parsedUserId = validateId(userId, "User ID");

    await getUserOrThrow(parsedUserId);

    return await userWarehouseRepository.getUserWarehouses(
        parsedUserId
    );
};

// Check Warehouse Access
const checkWarehouseAccess = async (
    userId,
    roleId,
    warehouseId
) => {
    const parsedUserId = validateId(userId, "User ID");
    const parsedRoleId = validateId(roleId, "Role ID");
    const parsedWarehouseId = validateId(
        warehouseId,
        "Warehouse ID"
    );

    await getWarehouseOrThrow(parsedWarehouseId);

    // Admin can access all warehouses
    if (parsedRoleId === ADMIN) {
        return true;
    }

    if (
        ![INVENTORY_MANAGER, WAREHOUSE_STAFF].includes(parsedRoleId)
    ) {
        throw new Error("Access Denied: Role Not Allowed");
    }

    const assignment =
        await userWarehouseRepository.findAssignment(
            parsedUserId,
            parsedWarehouseId
        );

    if (!assignment) {
        throw new Error(
            "Access Denied: Warehouse Not Assigned"
        );
    }

    return true;
};

// Get Warehouse Users
const getWarehouseUsers = async (
    userId,
    roleId,
    warehouseId
) => {
    const parsedWarehouseId = validateId(
        warehouseId,
        "Warehouse ID"
    );

    await checkWarehouseAccess(
        userId,
        roleId,
        parsedWarehouseId
    );

    return await userWarehouseRepository.getWarehouseUsers(
        parsedWarehouseId
    );
};

// Remove Warehouse Assignment
const removeAssignment = async (
    actorId,
    actorRoleId,
    targetUserId,
    warehouseId
) => {
    const parsedActorId = validateId(actorId, "Actor ID");
    const parsedActorRoleId = validateId(
        actorRoleId,
        "Actor Role ID"
    );
    const parsedTargetUserId = validateId(
        targetUserId,
        "User ID"
    );
    const parsedWarehouseId = validateId(
        warehouseId,
        "Warehouse ID"
    );

    const targetUser = await getUserOrThrow(parsedTargetUserId);

    const targetRoleId = Number(targetUser.roleId);

    // Only Manager and Staff assignments can be removed
    if (!ASSIGNABLE_ROLES.includes(targetRoleId)) {
        throw new Error(
            "This User Cannot Be Removed From Warehouse"
        );
    }

    // Admin can remove Manager or Staff
    if (parsedActorRoleId === ADMIN) {
        // Admin permission allowed
    }

    // Inventory Manager can remove only Staff from own warehouse
    else if (parsedActorRoleId === INVENTORY_MANAGER) {
        if (targetRoleId !== WAREHOUSE_STAFF) {
            throw new Error(
                "Manager Can Only Remove Warehouse Staff"
            );
        }

        await checkWarehouseAccess(
            parsedActorId,
            parsedActorRoleId,
            parsedWarehouseId
        );
    } else {
        throw new Error(
            "Forbidden: You do not have permission"
        );
    }

    await getWarehouseOrThrow(parsedWarehouseId);

    const assignment =
        await userWarehouseRepository.deleteAssignment(
            parsedTargetUserId,
            parsedWarehouseId
        );

    if (!assignment) {
        throw new Error("Assignment Not Found");
    }

    return true;
};

// Assign Staff By Inventory Manager
const assignStaff = async (
    managerId,
    staffId,
    warehouseId
) => {
    const parsedManagerId = validateId(
        managerId,
        "Manager ID"
    );

    const parsedStaffId = validateId(
        staffId,
        "Staff ID"
    );

    const parsedWarehouseId = validateId(
        warehouseId,
        "Warehouse ID"
    );

    const manager = await getUserOrThrow(
        parsedManagerId,
        "Manager Not Found"
    );

    if (Number(manager.roleId) !== INVENTORY_MANAGER) {
        throw new Error(
            "Only Inventory Manager Can Assign Staff"
        );
    }

    const staff = await getUserOrThrow(
        parsedStaffId,
        "Staff Not Found"
    );

    if (Number(staff.roleId) !== WAREHOUSE_STAFF) {
        throw new Error(
            "Only Warehouse Staff Can Be Assigned"
        );
    }

    // Verify manager's warehouse access
    await checkWarehouseAccess(
        parsedManagerId,
        manager.roleId,
        parsedWarehouseId
    );

    const existingAssignment =
        await userWarehouseRepository.findAssignment(
            parsedStaffId,
            parsedWarehouseId
        );

    if (existingAssignment) {
        throw new Error(
            "Staff Already Assigned To This Warehouse"
        );
    }

    return await userWarehouseRepository.createAssignment({
        userId: parsedStaffId,
        warehouseId: parsedWarehouseId,
    });
};

export {
    assignWarehouse,
    getUserWarehouses,
    getWarehouseUsers,
    removeAssignment,
    assignStaff,
    checkWarehouseAccess,
};