import * as model from "@/Model/index";

// Check whether a user is assigned to a warehouse
const findAssignment = async (userId, warehouseId) => {
    return await model.UserWarehouse.findOne({
        where: {
            userId,
            warehouseId,
        },
    });
};

// Assign a user to a warehouse
const createAssignment = async (data, transaction = undefined) => {
    return await model.UserWarehouse.create(data, {
        ...(transaction ? { transaction } : {}),
    });
};

// Get all warehouses assigned to a user
const getUserWarehouses = async (userId) => {
    return await model.UserWarehouse.findAll({
        where: {
            userId,
        },
        attributes: ["userId", "warehouseId"],
        include: [
            {
                model: model.Warehouse,
                as: "warehouse",
                attributes: {
                    exclude: [
                        "createdAt",
                        "updatedAt",
                        "deletedAt",
                    ],
                },
            },
        ],
        order: [["warehouseId", "ASC"]],
    });
};

// Get users assigned to a warehouse
const getWarehouseUsers = async (warehouseId) => {
    return await model.UserWarehouse.findAll({
        where: {
            warehouseId,
        },
        attributes: ["id", "userId", "warehouseId"],
        include: [
            {
                model: model.User,
                as: "user",
                attributes: ["id", "name", "email", "roleId"],
            },
        ],
        order: [["userId", "ASC"]],
    });
};

// Remove a user's warehouse assignment
const deleteAssignment = async (
    userId,
    warehouseId,
    transaction = undefined
) => {
    const assignment = await model.UserWarehouse.findOne({
        where: {
            userId,
            warehouseId,
        },
        ...(transaction ? { transaction } : {}),
    });

    if (!assignment) {
        return null;
    }

    await assignment.destroy({
        ...(transaction ? { transaction } : {}),
    });

    return assignment;
};

export {
    findAssignment,
    createAssignment,
    getUserWarehouses,
    getWarehouseUsers,
    deleteAssignment,
};