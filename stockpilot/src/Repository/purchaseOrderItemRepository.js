import * as model from "@/Model/index";

const createPurchaseOrderItem = async (data, transaction) => {
    return await model.PurchaseOrderItem.create(data, { transaction });
};

const getPurchaseOrderItems = async (purchaseOrderId) => {
    return await model.PurchaseOrderItem.findAll({
        where: { purchaseOrderId },
        include: [
            {
                model: model.Product,
                as: "product",
                attributes: ["id", "name", "sku", "price"],
            },
        ],
        order: [["id", "ASC"]],
    });
};

const getOnePurchaseOrderItem = async (id) => {
    return await model.PurchaseOrderItem.findByPk(id, {
        include: [
            {
                model: model.Product,
                as: "product",
                attributes: ["id", "name", "sku", "price"],
            },
        ],
    });
};

const deletePurchaseOrderItem = async (id, transaction) => {
    const item = await model.PurchaseOrderItem.findByPk(id, { transaction });

    if (!item) return null;

    return await item.destroy({ transaction });
};

export {
    createPurchaseOrderItem,
    getPurchaseOrderItems,
    getOnePurchaseOrderItem,
    deletePurchaseOrderItem,
};
