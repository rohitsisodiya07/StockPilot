import * as model from "@/Model/index";

// Find user by email
const findByEmail = async (email) => {
    return await model.User.findOne({
        where: {
            email,
        },
        attributes: ["id", "name", "email", "password", "roleId", "status"],
        include: [
            {
                model: model.UserWarehouse,
                as: "warehouseAssignments",
                attributes: ["warehouseId"],
                required: false,
            },
        ],
    });
};

// Find user by ID
const getOneUser = async (id) => {
    return await model.User.findByPk(id, {
        include: [
            {
                model: model.UserWarehouse,
                as: "warehouseAssignments",
                include: [
                    {
                        model: model.Warehouse,
                        as: "warehouse",
                        attributes: ["id", "name", "location"],
                    },
                ],
                required: false,
            },
        ],
    });
};

// Create user
const createUser = async (data, transaction = undefined) => {
    return await model.User.create(data, {
        ...(transaction ? { transaction } : {})
    });
};

// Get all users
const getAllUsers = async () => {
    return await model.User.findAll({
        attributes: {
            exclude: ["password"],
        },
        include: [
            {
                model: model.UserWarehouse,
                as: "warehouseAssignments",
                include: [
                    {
                        model: model.Warehouse,
                        as: "warehouse",
                        attributes: ["id", "name", "location"],
                    },
                ],
                required: false,
            },
        ],
        order: [["id", "DESC"]],
    });
};

// Update user
const updateUser = async (id, data) => {
    const user = await model.User.findByPk(id);

    if (!user) {
        return null;
    }

    return await user.update(data);
};

// Delete user directly and permanently (Hard Delete)
const deleteUser = async (id) => {
    const user = await model.User.findByPk(id, { paranoid: false });

    if (!user) {
        return null;
    }

    // Clean up warehouse assignments and remove user permanently in parallel
    await Promise.all([
        model.UserWarehouse.destroy({
            where: { userId: id },
        }),
        model.User.destroy({
            where: { id },
            force: true,
        }),
    ]);

    return user;
};

const getStaffByWarehouse = async (warehouseIds) => {
    return await model.User.findAll({
        where: {
            roleId: 5,
        },
        attributes: {
            exclude: ["password"],
        },
        include: [
            {
                model: model.UserWarehouse,
                as: "warehouseAssignments",
                where: {
                    warehouseId: warehouseIds,
                },
                attributes: ["warehouseId"],
                required: true,
            },
        ],
        order: [["id", "DESC"]],
    });
};

const findStaffInWarehouse = async (staffId, warehouseIds) => {
    return await model.User.findOne({
        where: {
            id: staffId,
            roleId: 5,
        },
        attributes: {
            exclude: ["password"],
        },
        include: [
            {
                model: model.UserWarehouse,
                as: "warehouseAssignments",
                where: {
                    warehouseId: warehouseIds,
                },
                attributes: ["warehouseId"],
                required: true,
            },
        ],
    });
};

const getUserWithDeleted = async (userId) => {
    return await model.User.findByPk(userId, {
        paranoid: false,
        attributes: {
            exclude: ["password"],
        },
    });
};

export {
    findByEmail,
    getOneUser,
    createUser,
    getAllUsers,
    updateUser,
    deleteUser,
    getStaffByWarehouse,
    findStaffInWarehouse,
    getUserWithDeleted
};