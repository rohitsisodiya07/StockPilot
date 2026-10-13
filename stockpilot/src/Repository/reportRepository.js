import * as model from "@/Model/index";
import { Op } from "sequelize";

// -------------------- Common Helpers --------------------

const buildDateFilter = (startDate, endDate) => {
    if (!startDate && !endDate) {
        return {};
    }

    const createdAt = {};

    if (startDate) {
        createdAt[Op.gte] = new Date(
            `${startDate}T00:00:00.000Z`
        );
    }

    if (endDate) {
        const nextDay = new Date(
            `${endDate}T00:00:00.000Z`
        );

        nextDay.setUTCDate(nextDay.getUTCDate() + 1);
        createdAt[Op.lt] = nextDay;
    }

    return { createdAt };
};

const emptyWarehouseList = (warehouseIds) =>
    Array.isArray(warehouseIds) && warehouseIds.length === 0;

// -------------------- Sales Orders Report --------------------

const getSalesOrdersForReport = async (
    warehouseIds = null,
    startDate = null,
    endDate = null
) => {
    if (emptyWarehouseList(warehouseIds)) {
        return [];
    }

    const where = {
        ...buildDateFilter(startDate, endDate),
    };

    if (warehouseIds !== null) {
        where.warehouseId = {
            [Op.in]: warehouseIds,
        };
    }

    return await model.SalesOrder.findAll({
        where,
        include: [
            {
                model: model.SalesOrderItem,
                as: "items",
                attributes: ["quantity", "unitPrice"],
            },
        ],
        order: [["createdAt", "DESC"]],
    });
};

// -------------------- Warehouse Sales Report --------------------

const getWarehouseSalesReport = async (
    warehouseIds = null,
    startDate = null,
    endDate = null
) => {
    if (emptyWarehouseList(warehouseIds)) {
        return [];
    }

    const warehouseWhere = {};

    if (warehouseIds !== null) {
        warehouseWhere.id = {
            [Op.in]: warehouseIds,
        };
    }

    const orderWhere = {
        ...buildDateFilter(startDate, endDate),
    };

    return await model.Warehouse.findAll({
        where: warehouseWhere,
        include: [
            {
                model: model.SalesOrder,
                as: "salesOrders",
                where: orderWhere,
                required: false,
                attributes: ["id", "status", "createdAt"],
                include: [
                    {
                        model: model.SalesOrderItem,
                        as: "items",
                        attributes: ["quantity", "unitPrice"],
                    },
                ],
            },
        ],
        order: [["id", "ASC"]],
    });
};

// -------------------- Inventory Report --------------------

const getInventoryReport = async (warehouseIds = null) => {
    if (emptyWarehouseList(warehouseIds)) {
        return [];
    }

    const where = {};

    if (warehouseIds !== null) {
        where.warehouseId = {
            [Op.in]: warehouseIds,
        };
    }

    return await model.Inventory.findAll({
        where,
        include: [
            {
                model: model.Product,
                as: "product",
            },
            {
                model: model.Warehouse,
                as: "warehouse",
                attributes: ["id", "name", "location"],
            },
        ],
        order: [["warehouseId", "ASC"]],
    });
};

// -------------------- Stock Movement Report --------------------

const getStockMovementReport = async (
    warehouseIds = null,
    warehouseId = null,
    movementType = null,
    startDate = null,
    endDate = null
) => {
    if (emptyWarehouseList(warehouseIds)) {
        return [];
    }

    const where = {
        ...buildDateFilter(startDate, endDate),
    };

    if (movementType !== null) {
        where.type = movementType;
    }

    const inventoryWhere = {};

    if (warehouseIds !== null) {
        inventoryWhere.warehouseId = {
            [Op.in]: warehouseIds,
        };
    }

    if (warehouseId !== null) {
        // Intersect the requested warehouse with assigned warehouses.
        if (
            warehouseIds !== null &&
            !warehouseIds.includes(Number(warehouseId))
        ) {
            return [];
        }

        inventoryWhere.warehouseId = Number(warehouseId);
    }

    return await model.StockMovement.findAll({
        where,
        include: [
            {
                model: model.Inventory,
                as: "inventory",
                where: inventoryWhere,
                required: true,
                include: [
                    {
                        model: model.Product,
                        as: "product",
                        attributes: ["id", "name", "sku"],
                    },
                    {
                        model: model.Warehouse,
                        as: "warehouse",
                        attributes: ["id", "name", "location"],
                    },
                ],
            },
            {
                model: model.User,
                as: "user",
                attributes: ["id", "name", "email"],
            },
        ],
        order: [["createdAt", "DESC"]],
    });
};

// -------------------- Purchase Report --------------------

const getPurchaseReport = async (
    warehouseIds = null,
    warehouseId = null,
    status = null,
    startDate = null,
    endDate = null
) => {
    if (emptyWarehouseList(warehouseIds)) {
        return [];
    }

    const where = {
        ...buildDateFilter(startDate, endDate),
    };

    if (warehouseIds !== null) {
        where.warehouseId = {
            [Op.in]: warehouseIds,
        };
    }

    if (warehouseId !== null) {
        const requestedWarehouseId = Number(warehouseId);

        if (
            warehouseIds !== null &&
            !warehouseIds.includes(requestedWarehouseId)
        ) {
            return [];
        }

        where.warehouseId = requestedWarehouseId;
    }

    if (status !== null) {
        where.status = status;
    }

    return await model.PurchaseOrder.findAll({
        where,
        include: [
            {
                model: model.Supplier,
                as: "supplier",
            },
            {
                model: model.Warehouse,
                as: "warehouse",
                attributes: ["id", "name", "location"],
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
        order: [["createdAt", "DESC"]],
    });
};

export {
    getSalesOrdersForReport,
    getWarehouseSalesReport,
    getInventoryReport,
    getStockMovementReport,
    getPurchaseReport,
};
