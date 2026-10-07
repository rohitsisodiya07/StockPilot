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

export {
    findByName,
    createWarehouse,
    getAllWarehouses,
    getOneWarehouse,
    updateWarehouse,
    deleteWarehouse,
};