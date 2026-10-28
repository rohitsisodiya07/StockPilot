import { Op, col } from "sequelize";
import * as model from "@/Model/index";

const ADMIN_ROLE_ID = 1;
const INVENTORY_MANAGER_ROLE_ID = 4;
const WAREHOUSE_STAFF_ROLE_ID = 5;

const buildDateWhere = (startDate, endDate, field = "createdAt") => {
    const where = {};

    if (startDate || endDate) {
        where[field] = {};

        if (startDate) {
            where[field][Op.gte] = new Date(
                `${startDate}T00:00:00.000Z`
            );
        }

        if (endDate) {
            where[field][Op.lte] = new Date(
                `${endDate}T23:59:59.999Z`
            );
        }
    }

    return where;
};

const getTotalProducts = async (warehouseIds = null) => {
    if (warehouseIds === null) {
        return model.Product.count();
    }

    if (!warehouseIds.length) return 0;

    return model.Inventory.count({
        where: {
            warehouseId: { [Op.in]: warehouseIds },
        },
        distinct: true,
        col: "productId",
    });
};

const getTotalWarehouses = async (warehouseIds = null) => {
    const where = warehouseIds === null
        ? {}
        : { id: { [Op.in]: warehouseIds } };

    return model.Warehouse.count({ where });
};

const getTotalInventoryUnits = async (warehouseIds = null) => {
    const where = warehouseIds === null
        ? {}
        : { warehouseId: { [Op.in]: warehouseIds } };

    if (warehouseIds !== null && !warehouseIds.length) return 0;

    return (await model.Inventory.sum("quantity", { where })) || 0;
};

const getLowStockCount = async (warehouseIds = null) => {
    const where = {
        quantity: { [Op.lte]: col("reorderLevel") },
    };

    if (warehouseIds !== null) {
        if (!warehouseIds.length) return 0;
        where.warehouseId = { [Op.in]: warehouseIds };
    }

    return model.Inventory.count({ where });
};

const getRecentStockMovements = async ({
    warehouseIds = null,
    warehouseId = null,
    userId = null,
    roleId = null,
    startDate = null,
    endDate = null,
    limit = 10,
    offset = 0,
} = {}) => {
    const inventoryWhere = {};

    if (warehouseIds !== null) {
        if (!warehouseIds.length) {
            return { rows: [], count: 0 };
        }

        inventoryWhere.warehouseId = { [Op.in]: warehouseIds };
    }

    if (warehouseId !== null) {
        inventoryWhere.warehouseId = warehouseId;
    }

    const movementWhere = buildDateWhere(startDate, endDate);

    if (userId !== null) {
        movementWhere.userId = userId;
    }

    const userInclude = {
        model: model.User,
        as: "user",
        attributes: ["id", "name", "roleId"],
        required: roleId !== null,
    };

    if (roleId !== null) {
        userInclude.where = { roleId };
    }

    const result = await model.StockMovement.findAndCountAll({
        where: movementWhere,
        limit,
        offset,
        distinct: true,
        order: [
            ["createdAt", "DESC"],
            ["id", "DESC"],
        ],
        attributes: [
            "id",
            "inventoryId",
            "type",
            "quantity",
            "note",
            "userId",
            "createdAt",
        ],
        include: [
            {
                model: model.Inventory,
                as: "inventory",
                attributes: [
                    "id",
                    "warehouseId",
                    "productId",
                    "quantity",
                ],
                where: inventoryWhere,
                required: true,
                include: [
                    {
                        model: model.Warehouse,
                        as: "warehouse",
                        attributes: ["id", "name"],
                    },
                    {
                        model: model.Product,
                        as: "product",
                        attributes: ["id", "name", "sku"],
                    },
                ],
            },
            userInclude,
        ],
    });

    return {
        rows: result.rows,
        count: result.count,
    };
};

const getStockMovementsForChart = async ({
    warehouseIds = null,
    warehouseId = null,
    userId = null,
    roleId = null,
    startDate = null,
    endDate = null,
} = {}) => {
    const inventoryWhere = {};

    if (warehouseIds !== null) {
        if (!warehouseIds.length) return [];
        inventoryWhere.warehouseId = { [Op.in]: warehouseIds };
    }

    if (warehouseId !== null) {
        inventoryWhere.warehouseId = warehouseId;
    }

    const movementWhere = buildDateWhere(startDate, endDate);

    if (userId !== null) {
        movementWhere.userId = userId;
    }

    const userInclude = {
        model: model.User,
        as: "user",
        attributes: [],
        required: roleId !== null,
    };

    if (roleId !== null) {
        userInclude.where = { roleId };
    }

    return model.StockMovement.findAll({
        where: movementWhere,
        attributes: ["type", "quantity", "createdAt"],
        include: [
            {
                model: model.Inventory,
                as: "inventory",
                attributes: [],
                where: inventoryWhere,
                required: true,
            },
            userInclude,
        ],
        order: [["createdAt", "ASC"]],
    });
};

const getWarehouseStockSummary = async (warehouseIds = null) => {
    const warehouseWhere = {};

    if (warehouseIds !== null) {
        if (!warehouseIds.length) return [];
        warehouseWhere.id = { [Op.in]: warehouseIds };
    }

    const warehouses = await model.Warehouse.findAll({
        where: warehouseWhere,
        attributes: ["id", "name", "location"],
        include: [
            {
                model: model.Inventory,
                as: "inventory",
                attributes: ["id", "quantity", "productId"],
                required: false,
            },
        ],
        order: [["name", "ASC"]],
    });

    return warehouses.map((warehouse) => {
        const inventory = warehouse.inventory || [];

        return {
            warehouseId: warehouse.id,
            warehouseName: warehouse.name,
            location: warehouse.location,
            inventoryRecords: inventory.length,
            uniqueProducts: new Set(
                inventory.map((item) => item.productId)
            ).size,
            totalUnits: inventory.reduce(
                (total, item) =>
                    total + (Number(item.quantity) || 0),
                0
            ),
        };
    });
};

const getWarehouseOptions = async (warehouseIds = null) => {
    const where = {};

    if (warehouseIds !== null) {
        if (!warehouseIds.length) return [];
        where.id = { [Op.in]: warehouseIds };
    }

    return model.Warehouse.findAll({
        where,
        attributes: ["id", "name", "location"],
        order: [["name", "ASC"]],
    });
};

const getUserOptions = async ({ roleId = null } = {}) => {
    const where = {};

    if (roleId !== null) {
        where.roleId = roleId;
    }

    return model.User.findAll({
        where,
        attributes: ["id", "name", "roleId"],
        order: [["name", "ASC"]],
    });
};

const getOrderSummary = async (warehouseIds = null) => {
    const purchaseWhere = {};
    const salesWhere = {};

    if (warehouseIds !== null) {
        if (!warehouseIds.length) {
            return {
                purchaseOrders: {
                    total: 0,
                    draft: 0,
                    ordered: 0,
                    received: 0,
                    cancelled: 0,
                    pending: 0,
                    overdue: 0,
                },
                salesOrders: {
                    total: 0,
                    draft: 0,
                    confirmed: 0,
                    dispatched: 0,
                    cancelled: 0,
                    pending: 0,
                },
            };
        }

        purchaseWhere.warehouseId = { [Op.in]: warehouseIds };
        salesWhere.warehouseId = { [Op.in]: warehouseIds };
    }

    const [
        purchaseTotal,
        purchaseDraft,
        purchaseOrdered,
        purchaseReceived,
        purchaseCancelled,
        purchaseOverdue,
        salesTotal,
        salesDraft,
        salesConfirmed,
        salesDispatched,
        salesCancelled,
    ] = await Promise.all([
        model.PurchaseOrder.count({ where: purchaseWhere }),
        model.PurchaseOrder.count({
            where: { ...purchaseWhere, status: "DRAFT" },
        }),
        model.PurchaseOrder.count({
            where: { ...purchaseWhere, status: "ORDERED" },
        }),
        model.PurchaseOrder.count({
            where: { ...purchaseWhere, status: "RECEIVED" },
        }),
        model.PurchaseOrder.count({
            where: { ...purchaseWhere, status: "CANCELLED" },
        }),
        model.PurchaseOrder.count({
            where: {
                ...purchaseWhere,
                status: "ORDERED",
                expectedDeliveryDate: {
                    [Op.lt]: new Date().toISOString().slice(0, 10),
                },
            },
        }),
        model.SalesOrder.count({ where: salesWhere }),
        model.SalesOrder.count({
            where: { ...salesWhere, status: "DRAFT" },
        }),
        model.SalesOrder.count({
            where: { ...salesWhere, status: "CONFIRMED" },
        }),
        model.SalesOrder.count({
            where: { ...salesWhere, status: "DISPATCHED" },
        }),
        model.SalesOrder.count({
            where: { ...salesWhere, status: "CANCELLED" },
        }),
    ]);

    return {
        purchaseOrders: {
            total: purchaseTotal,
            draft: purchaseDraft,
            ordered: purchaseOrdered,
            received: purchaseReceived,
            cancelled: purchaseCancelled,
            pending: purchaseDraft + purchaseOrdered,
            overdue: purchaseOverdue,
        },
        salesOrders: {
            total: salesTotal,
            draft: salesDraft,
            confirmed: salesConfirmed,
            dispatched: salesDispatched,
            cancelled: salesCancelled,
            pending: salesDraft + salesConfirmed,
        },
    };
};

const getLowStockItems = async (warehouseIds = null) => {
    const where = {
        quantity: { [Op.lte]: col("reorderLevel") },
    };

    if (warehouseIds !== null) {
        if (!warehouseIds.length) return [];
        where.warehouseId = { [Op.in]: warehouseIds };
    }

    return model.Inventory.findAll({
        where,
        attributes: [
            "id",
            "productId",
            "warehouseId",
            "quantity",
            "reorderLevel",
        ],
        include: [
            {
                model: model.Product,
                as: "product",
            },
            {
                model: model.Warehouse,
                as: "warehouse",
                attributes: ["id", "name"],
            },
        ],
        order: [["quantity", "ASC"]],
    });
};

/**
 * Admin is global and does not depend on warehouse assignment.
 * Managers and staff are limited to the selected warehouse.
 */
const getWarehouseUsers = async (warehouseId = null) => {
    const [admin, assignments] = await Promise.all([
        model.User.findOne({
            where: { roleId: ADMIN_ROLE_ID },
            attributes: ["id", "name", "email", "roleId"],
            order: [["id", "ASC"]],
        }),

        warehouseId
            ? model.UserWarehouse.findAll({
                where: {
                    warehouseId: Number(warehouseId),
                },
                attributes: ["userId", "warehouseId"],
                include: [
                    {
                        model: model.User,
                        as: "user",
                        attributes: [
                            "id",
                            "name",
                            "email",
                            "roleId",
                        ],
                        required: true,
                        where: {
                            roleId: {
                                [Op.in]: [
                                    INVENTORY_MANAGER_ROLE_ID,
                                    WAREHOUSE_STAFF_ROLE_ID,
                                ],
                            },
                        },
                    },
                ],
                order: [["userId", "ASC"]],
            })
            : Promise.resolve([]),
    ]);

    const users = assignments
        .map((assignment) => assignment.user)
        .filter(Boolean);

    return {
        admin: admin || null,
        managers: users.filter(
            (user) =>
                Number(user.roleId) === INVENTORY_MANAGER_ROLE_ID
        ),
        staff: users.filter(
            (user) =>
                Number(user.roleId) === WAREHOUSE_STAFF_ROLE_ID
        ),
    };
};

export {
    ADMIN_ROLE_ID,
    INVENTORY_MANAGER_ROLE_ID,
    WAREHOUSE_STAFF_ROLE_ID,
    getTotalProducts,
    getTotalWarehouses,
    getTotalInventoryUnits,
    getLowStockCount,
    getRecentStockMovements,
    getStockMovementsForChart,
    getWarehouseStockSummary,
    getWarehouseOptions,
    getUserOptions,
    getOrderSummary,
    getLowStockItems,
    getWarehouseUsers,
};