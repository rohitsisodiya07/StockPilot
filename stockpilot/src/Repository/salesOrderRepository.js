import * as model from "@/Model/index";
import { Op } from "sequelize";

const createSalesOrder = async (data) => {
    return await model.SalesOrder.create(data);
};


const getAllSalesOrders = async (warehouseIds = null, status = null) => {
    const where = {};

    if (warehouseIds !== null) {
        where.warehouseId = {
            [Op.in]: warehouseIds,
        };
    }

    if (status) {
        where.status = status;
    }

    return await model.SalesOrder.findAll({
        where,
        include: [
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
                model: model.SalesOrderItem,
                as: "items",
                attributes: ["id", "quantity", "unitPrice"],
            }

        ],
        order: [["createdAt", "DESC"]],
    });
};


const getOneSalesOrder = async (id) => {
    return await model.SalesOrder.findByPk(id, {
        include: [
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
                model: model.SalesOrderItem,
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

const updateSalesOrder = async (id, data) => {
    const salesOrder = await model.SalesOrder.findByPk(id);

    if (!salesOrder) return null;

    return await salesOrder.update(data);
};

const deleteSalesOrder = async (id) => {
    const salesOrder = await model.SalesOrder.findByPk(id);

    if (!salesOrder) return null;

    return await salesOrder.destroy();
};

export {
    createSalesOrder,
    getAllSalesOrders,
    getOneSalesOrder,
    updateSalesOrder,
    deleteSalesOrder,
};
