import * as model from "@/Model/index";

const createSupplier = async (data) => {
    return await model.Supplier.create(data);
};

const getAllSuppliers = async () => {
    return await model.Supplier.findAll({
        order: [["createdAt", "DESC"]],
    });
};

const getOneSupplier = async (id) => {
    return await model.Supplier.findByPk(id);
};

const updateSupplier = async (id, data) => {
    const supplier = await model.Supplier.findByPk(id);

    if (!supplier) return null;

    return await supplier.update(data);
};

const deleteSupplier = async (id) => {
    const supplier = await model.Supplier.findByPk(id);

    if (!supplier) return null;

    return await supplier.destroy();
};

export {
    createSupplier,
    getAllSuppliers,
    getOneSupplier,
    updateSupplier,
    deleteSupplier,
};
