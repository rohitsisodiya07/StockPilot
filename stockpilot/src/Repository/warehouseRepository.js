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

const getAllWarehouses = async () => {
    return await model.Warehouse.findAll();
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