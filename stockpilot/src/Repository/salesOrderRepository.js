import * as model from "@/Model/index";
import { Op } from "sequelize";

// -------------------- Create Sales Order --------------------

const createSalesOrder = async (data, transaction = undefined) => {
    return await model.SalesOrder.create(data, {
        ...(transaction ? { transaction } : {}),
    });
};

// -------------------- Get All Sales Orders --------------------

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
    sortOrder = "DESC"
) => {
    // Empty assignments must never return global results.
    if (Array.isArray(warehouseIds) && warehouseIds.length === 0) {
        return {
            rows: [],
            count: 0,
        };
    }

    const allowedSortFields = [
        "createdAt",
        "customerName",
        "status",
    ];

    if (!allowedSortFields.includes(sortBy)) {
        throw new Error("Invalid Sort Field");
    }

    if (
        typeof sortOrder !== "string" ||
        !["ASC", "DESC"].includes(sortOrder.toUpperCase())
    ) {
        throw new Error("Invalid Sort Order");
    }

    const where = {};

    if (warehouseIds !== null) {
        where.warehouseId = {
            [Op.in]: warehouseIds,
        };
    }

    if (warehouseId !== null) {
        const requestedWarehouseId = Number(warehouseId);

        if (
            !Number.isInteger(requestedWarehouseId) ||
            requestedWarehouseId <= 0
        ) {
            throw new Error("Invalid Warehouse ID");
        }

        if (
            Array.isArray(warehouseIds) &&
            !warehouseIds.includes(requestedWarehouseId)
        ) {
            return {
                rows: [],
                count: 0,
            };
        }

        where.warehouseId = requestedWarehouseId;
    }

    if (status !== null && status !== "") {
        where.status = status;
    }

    if (typeof search === "string" && search.trim()) {
        const searchValue = search.trim();

        where[Op.or] = [
            {
                customerName: {
                    [Op.like]: `%${searchValue}%`,
                },
            },
            {
                customerEmail: {
                    [Op.like]: `%${searchValue}%`,
                },
            },
        ];
    }

    if (startDate || endDate) {
        where.createdAt = {};

        if (startDate) {
            where.createdAt[Op.gte] = new Date(
                `${startDate}T00:00:00.000Z`
            );
        }

        if (endDate) {
            const nextDay = new Date(
                `${endDate}T00:00:00.000Z`
            );

            nextDay.setUTCDate(nextDay.getUTCDate() + 1);

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
                attributes: ["id", "productId", "quantity", "unitPrice"],
            },
        ],
        distinct: true,
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit,
        offset,
    });
};

// -------------------- Get One Sales Order --------------------

const getOneSalesOrder = async (id, transaction = undefined) => {
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
        ...(transaction ? { transaction } : {}),
    });
};

// -------------------- Update Sales Order --------------------

const updateSalesOrder = async (
    id,
    data,
    transaction = undefined
) => {
    const salesOrder = await model.SalesOrder.findByPk(id, {
        ...(transaction ? { transaction } : {}),
    });

    if (!salesOrder) {
        return null;
    }

    return await salesOrder.update(data, {
        ...(transaction ? { transaction } : {}),
    });
};

// -------------------- Delete Sales Order --------------------

const deleteSalesOrder = async (id, transaction = undefined) => {
    const salesOrder = await model.SalesOrder.findByPk(id, {
        ...(transaction ? { transaction } : {}),
    });

    if (!salesOrder) {
        return null;
    }

    await salesOrder.destroy({
        ...(transaction ? { transaction } : {}),
    });

    return salesOrder;
};

export {
    createSalesOrder,
    getAllSalesOrders,
    getOneSalesOrder,
    updateSalesOrder,
    deleteSalesOrder,
};