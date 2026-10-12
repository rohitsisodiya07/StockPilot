import * as model from "@/Model/index";

const createSalesOrderItem = async (data, transaction) => {
    return await model.SalesOrderItem.create(data, { transaction });
};

const getSalesOrderItems = async (salesOrderId) => {
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
    });
};

const getOneSalesOrderItem = async (id) => {
    return await model.SalesOrderItem.findByPk(id, {
        include: [
            {
                model: model.Product,
                as: "product",
                attributes: ["id", "name", "sku", "price"],
            },
        ],
    });
};

const deleteSalesOrderItem = async (id) => {
    const item = await model.SalesOrderItem.findByPk(id);

    if (!item) return null;

    return await item.destroy();
};

export {
    createSalesOrderItem,
    getSalesOrderItems,
    getOneSalesOrderItem,
    deleteSalesOrderItem,
};
