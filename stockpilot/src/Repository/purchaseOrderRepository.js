import { Op } from "sequelize";
import * as model from "@/Model/index";

const createPurchaseOrder = async (data) => {
    return await model.PurchaseOrder.create(data);
};

const getAllPurchaseOrders = async (warehouseIds = null) => {
    const where = {};

    if (warehouseIds !== null) {
        where.warehouseId = {
            [Op.in]: warehouseIds,
        };
    }

    return await model.PurchaseOrder.findAll({
        where,
        include: [
            {
                model: model.Supplier,
                as: "supplier",
                attributes: ["id", "name"],
            },
            {
                model: model.Warehouse,
                as: "warehouse",
                attributes: ["id", "name", "location"],
            },
        ],
        order: [["createdAt", "DESC"]],
    });
};

const getOnePurchaseOrder = async (id) => {
    return await model.PurchaseOrder.findByPk(id, {
        include: [
            {
                model: model.Supplier,
                as: "supplier",
                attributes: ["id", "name", "email", "phone"],
            },
            {
                model: model.Warehouse,
                as: "warehouse",
                attributes: ["id", "name", "location"],
            },
            {
                model: model.User,
                as: "creator",
                attributes: ["id", "name", "email"],
            },
            {
                model: model.PurchaseOrderItem,
                as: "items",
                include: [
                    {
                        model: model.Product,
                        as: "product",
                        attributes: ["id", "name", "sku"],
                    },
                ],
            },
        ],
    });
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
