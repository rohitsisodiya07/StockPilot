import * as model from "@/Model/index";

//Check karta hai user already warehouse se assigned hai ya nahi
const findAssignment = async (userId, warehouseId) => {
    return await model.UserWarehouse.findOne({
        where: {
            userId,
            warehouseId,
        },
    });
};

//User ko warehouse assign karta hai
const createAssignment = async (data) => {
    return await model.UserWarehouse.create(data);
};

//Kisi user ke saare assigned warehouses
const getUserWarehouses = async (userId) => {
    const result = await model.UserWarehouse.findAll({
        where: {
            userId,
        },
        attributes: ["userId", "warehouseId"],
        include: [
            {
                model: model.Warehouse,
                as: "warehouse",
                attributes: {
                    exclude: ["createdAt", "updatedAt", "deletedAt"],
                },
            },
        ],
    });

    return result;
};

//Kisi warehouse mein assigned users
const getWarehouseUsers = async (warehouseId) => {
    return await model.UserWarehouse.findAll({
        where: {
            warehouseId,
        },
    });
};

// User ko warehouse se unassign karta hai
const deleteAssignment = async (userId, warehouseId) => {
    const assignment = await model.UserWarehouse.findOne({
        where: {
            userId,
            warehouseId,
        },
    });

    if (!assignment) {
        return null;
    }

    await assignment.destroy();

    return assignment;
};

export {
    findAssignment,
    createAssignment,
    getUserWarehouses,
    getWarehouseUsers,
    deleteAssignment,
};