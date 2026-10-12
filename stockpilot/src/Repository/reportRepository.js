import * as model from "@/Model/index";
import { Op } from "sequelize";

const getSalesOrdersForReport = async (
    warehouseIds = null,
    startDate = null,
    endDate = null
) => {
    const where = {};

    if (warehouseIds !== null) {
        where.warehouseId = {
            [Op.in]: warehouseIds,
        };
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


const getWarehouseSalesReport = async (
    warehouseIds = null,
    startDate = null,
    endDate = null
) => {
    const where = {};

    if (warehouseIds !== null) {
        where.warehouseId = {
            [Op.in]: warehouseIds,
        };
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

    return await model.SalesOrder.findAll({
        where,
        include: [
            {
                model: model.Warehouse,
                as: "warehouse",
                attributes: ["id", "name", "location"],
            },
            {
                model: model.SalesOrderItem,
                as: "items",
                attributes: ["quantity", "unitPrice"],
            },
        ],
        order: [["createdAt", "DESC"]],
    });
};


const getInventoryReport = async (warehouseIds = null) => {
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



const getStockMovementReport = async (
    warehouseIds = null,
    warehouseId = null,
    movementType = null,
    startDate = null,
    endDate = null
) => {
    const where = {};

    if (movementType !== null) {
        where.type = movementType;
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

    const inventoryWhere = {};

    if (warehouseIds !== null) {
        inventoryWhere.warehouseId = {
            [Op.in]: warehouseIds,
        };
    }

    if (warehouseId !== null) {
        inventoryWhere.warehouseId = warehouseId;
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


const getPurchaseReport = async (
    warehouseIds = null,
    warehouseId = null,
    status = null,
    startDate = null,
    endDate = null
) => {
    const where = {};

    // Filter by assigned warehouses
    if (warehouseIds !== null) {
        where.warehouseId = {
            [Op.in]: warehouseIds,
        };
    }

    // Filter by a specific warehouse
    if (warehouseId !== null) {
        where.warehouseId = warehouseId;
    }

    // Filter by purchase order status
    if (status !== null) {
        where.status = status;
    }

    // Filter by date range
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





export { getSalesOrdersForReport, getWarehouseSalesReport, getInventoryReport, getStockMovementReport, getPurchaseReport };
