import * as model from "@/Model/index";
import { Op } from "sequelize";

const createSalesOrder = async (data) => {
    return await model.SalesOrder.create(data);
};


const getAllSalesOrders = async (
    warehouseIds = null,
    warehouseId = null,
    status = null,
    search = null,
    limit = 10,
    offset = 0,
    startDate = null,
    endDate = null,
    sortBy = "createdAt",
    sortOrder = "DESC",
) => {
    const where = {};

    if (warehouseIds !== null) {
        where.warehouseId = {
            [Op.in]: warehouseIds,
        };
    }
    if (warehouseId !== null) {
        where.warehouseId = warehouseId;
    }

    if (status) {
        where.status = status;
    }

    if (search) {
        where[Op.or] = [
            {
                customerName: {
                    [Op.like]: `%${search}%`,
                },
            },
            {
                customerEmail: {
                    [Op.like]: `%${search}%`,
                },
            },
        ];
    }
    if (startDate || endDate) {
        where.createdAt = {};

        if (startDate) {
            where.createdAt[Op.gte] = new Date(startDate);
        }

        if (endDate) {
            const nextDay = new Date(endDate);
            nextDay.setDate(nextDay.getDate() + 1);

            where.createdAt[Op.lt] = nextDay;
        }
    }

    return await model.SalesOrder.findAndCountAll({
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
            },
        ],
        distinct: true,
        order: [[sortBy, sortOrder]],
        limit,
        offset,
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
