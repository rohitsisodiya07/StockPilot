import * as model from "@/Model/index";

const createPurchaseOrderItem = async (data, transaction = undefined) => {
    return await model.PurchaseOrderItem.create(data, {
        ...(transaction ? { transaction } : {}),
    });
};

const getPurchaseOrderItems = async (
    purchaseOrderId,
    transaction = undefined
) => {
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
        ...(transaction ? { transaction } : {}),
    });
};

const getOnePurchaseOrderItem = async (
    id,
    transaction = undefined
) => {
    return await model.PurchaseOrderItem.findByPk(id, {
        include: [
            {
                model: model.Product,
                as: "product",
                attributes: ["id", "name", "sku", "price"],
            },
        ],
        ...(transaction ? { transaction } : {}),
    });
};

const deletePurchaseOrderItem = async (id, transaction = undefined) => {
    const item = await model.PurchaseOrderItem.findByPk(id, {
        ...(transaction ? { transaction } : {}),
    });

    if (!item) {
        return null;
    }

    return await item.destroy({
        ...(transaction ? { transaction } : {}),
    });
};

export {
    createPurchaseOrderItem,
    getPurchaseOrderItems,
    getOnePurchaseOrderItem,
    deletePurchaseOrderItem,
};
