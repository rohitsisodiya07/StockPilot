import * as model from "@/Model/index";

const createPurchaseOrder = async (data) => {
    return await model.PurchaseOrder.create(data);
};

const getAllPurchaseOrders = async () => {
    return await model.PurchaseOrder.findAll({
        order: [["createdAt", "DESC"]],
    });
};

const getOnePurchaseOrder = async (id) => {
    return await model.PurchaseOrder.findByPk(id);
};

const updatePurchaseOrder = async (id, data) => {
    const purchaseOrder = await model.PurchaseOrder.findByPk(id);

    if (!purchaseOrder) return null;

    return await purchaseOrder.update(data);
};

const deletePurchaseOrder = async (id) => {
    const purchaseOrder = await model.PurchaseOrder.findByPk(id);

    if (!purchaseOrder) return null;

    return await purchaseOrder.destroy();
};

export {
    createPurchaseOrder,
    getAllPurchaseOrders,
    getOnePurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
};
