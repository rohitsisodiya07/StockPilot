import * as model from "@/Model/index";

const findByName = async (name) => {
    return await model.Warehouse.findOne({
        where: {
            name,
        },
    });
};

const createWarehouse = async (data) => {
    return await model.Warehouse.create(data);
};

// Get All Warehouses
// Get All Warehouses
const getAllWarehouses = async (userId, roleId) => {
    // Admin: all warehouses
    if (Number(roleId) === 1) {
        return await model.Warehouse.findAll();
    }

    // Inventory Manager / Warehouse Staff:
    // only assigned warehouses
    if ([4, 5].includes(Number(roleId))) {
        return await model.Warehouse.findAll({
            include: [
                {
                    model: model.UserWarehouse,
                    as: "userAssignments",
                    where: {
                        userId: userId,
                    },
                    attributes: [],
                    required: true,
                },
            ],
            distinct: true,
        });
    }

    throw new Error("You are not authorized to view warehouses");
};

const getOneWarehouse = async (id) => {
    return await model.Warehouse.findByPk(id);
};

const updateWarehouse = async (id, data) => {
    const warehouse = await model.Warehouse.findByPk(id);

    if (!warehouse) {
        return null;
    }

    return await warehouse.update(data);
};

const deleteWarehouse = async (id) => {
    const warehouse = await model.Warehouse.findByPk(id);

    if (!warehouse) {
        return null;
    }

    await warehouse.destroy();

    return warehouse;
};

const getWarehouseDetails = async (id) => {
    const warehouse = await model.Warehouse.findByPk(id, {
        include: [
            {
                model: model.Inventory,
                as: "inventory",
                attributes: [
                    "id",
                    "productId",
                    "quantity",
                    "reorderLevel",
                ],
                include: [
                    {
                        model: model.Product,
                        as: "product",
                        attributes: ["id", "name", "sku", "price"],
                    },
                ],
            },
            {
                model: model.UserWarehouse,
                as: "userAssignments",
                attributes: ["id", "userId", "warehouseId"],
                include: [
                    {
                        model: model.User,
                        as: "user",
                        attributes: ["id", "name", "email", "roleId"],
                        include: [
                            {
                                model: model.Role,
                                as: "role",
                                attributes: ["id", "name"],
                            },
                        ],
                    },
                ],
            },
        ],
    });

    return warehouse;
};

export {
    findByName,
    createWarehouse,
    getAllWarehouses,
    getOneWarehouse,
    updateWarehouse,
    deleteWarehouse,
    getWarehouseDetails
};