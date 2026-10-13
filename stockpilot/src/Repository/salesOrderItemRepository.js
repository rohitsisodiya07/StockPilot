import * as model from "@/Model/index";

// -------------------- Create Sales Order Item --------------------

const createSalesOrderItem = async (
    data,
    transaction = undefined
) => {
    return await model.SalesOrderItem.create(data, {
        ...(transaction ? { transaction } : {}),
    });
};

// -------------------- Get All Items for an Order --------------------

const getSalesOrderItems = async (
    salesOrderId,
    transaction = undefined
) => {
    return await model.SalesOrderItem.findAll({
        where: { salesOrderId },
        include: [
            {
                model: model.Product,
                as: "product",
                attributes: ["id", "name", "sku", "price"],
            },
        ],
        order: [["createdAt", "ASC"]],
        ...(transaction ? { transaction } : {}),
    });
};

// -------------------- Get One Sales Order Item --------------------

const getOneSalesOrderItem = async (
    id,
    transaction = undefined
) => {
    return await model.SalesOrderItem.findByPk(id, {
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

// -------------------- Delete Sales Order Item --------------------

const deleteSalesOrderItem = async (
    id,
    transaction = undefined
) => {
    const item = await model.SalesOrderItem.findByPk(id, {
        ...(transaction ? { transaction } : {}),
    });

    if (!item) {
        return null;
    }

    await item.destroy({
        ...(transaction ? { transaction } : {}),
    });

    return item;
};

export {
    createSalesOrderItem,
    getSalesOrderItems,
    getOneSalesOrderItem,
    deleteSalesOrderItem,
};