import * as reportRepository from "@/Repository/reportRepository";
import * as userWarehouseService from "@/Service/userWarehouseService";
import * as warehouseRepository from "@/Repository/warehouseRepository";

// -------------------- Common Helpers --------------------

const isValidDate = (value) => {
    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
    );
};

const validateDateRange = (startDate, endDate) => {
    if (startDate !== null && !isValidDate(startDate)) {
        throw new Error("Invalid Start Date");
    }

    if (endDate !== null && !isValidDate(endDate)) {
        throw new Error("Invalid End Date");
    }

    if (startDate && endDate && startDate > endDate) {
        throw new Error("Start Date Cannot Be After End Date");
    }
};

const getWarehouseFilter = async (
    userId,
    roleId,
    warehouseId = null
) => {
    // Admin can access all warehouses.
    // Other users can access only their assigned warehouses.
    let warehouseIds = null;

    if (Number(roleId) !== 1) {
        const warehouses =
            await userWarehouseService.getUserWarehouses(userId);

        warehouseIds = warehouses.map(
            (item) => Number(item.warehouseId)
        );

        // Explicitly return no results for users with no assignments.
        if (warehouseIds.length === 0) {
            if (warehouseId !== null) {
                const requestedId = Number(warehouseId);

                if (
                    !Number.isInteger(requestedId) ||
                    requestedId <= 0
                ) {
                    throw new Error("Invalid Warehouse ID");
                }

                const warehouse =
                    await warehouseRepository.getOneWarehouse(
                        requestedId
                    );

                if (!warehouse) {
                    throw new Error("Warehouse Not Found");
                }

                throw new Error("Access Denied: Warehouse Access");
            }

            return [];
        }
    }

    if (warehouseId !== null) {
        const requestedId = Number(warehouseId);

        if (
            !Number.isInteger(requestedId) ||
            requestedId <= 0
        ) {
            throw new Error("Invalid Warehouse ID");
        }

        const warehouse =
            await warehouseRepository.getOneWarehouse(requestedId);

        if (!warehouse) {
            throw new Error("Warehouse Not Found");
        }

        await userWarehouseService.checkWarehouseAccess(
            userId,
            roleId,
            requestedId
        );

        warehouseIds = [requestedId];
    }

    return warehouseIds;
};

// -------------------- Sales Summary --------------------

const getSalesSummary = async (
    userId,
    roleId,
    startDate = null,
    endDate = null,
    warehouseId = null
) => {
    validateDateRange(startDate, endDate);

    const warehouseIds = await getWarehouseFilter(
        userId,
        roleId,
        warehouseId
    );

    if (Array.isArray(warehouseIds) && warehouseIds.length === 0) {
        return {
            totalOrders: 0,
            statusCounts: {
                DRAFT: 0,
                CONFIRMED: 0,
                DISPATCHED: 0,
                CANCELLED: 0,
            },
            dispatchedOrders: 0,
            totalRevenue: 0,
            averageOrderValue: 0,
        };
    }

    const orders = await reportRepository.getSalesOrdersForReport(
        warehouseIds,
        startDate,
        endDate
    );

    const statusCounts = {
        DRAFT: 0,
        CONFIRMED: 0,
        DISPATCHED: 0,
        CANCELLED: 0,
    };

    for (const order of orders) {
        if (Object.hasOwn(statusCounts, order.status)) {
            statusCounts[order.status]++;
        }
    }

    const dispatchedOrders = orders.filter(
        (order) => order.status === "DISPATCHED"
    );

    const totalRevenue = dispatchedOrders.reduce(
        (total, order) =>
            total +
            (order.items || []).reduce(
                (orderTotal, item) =>
                    orderTotal +
                    Number(item.quantity) * Number(item.unitPrice),
                0
            ),
        0
    );

    return {
        totalOrders: orders.length,
        statusCounts,
        dispatchedOrders: dispatchedOrders.length,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        averageOrderValue: Number(
            (
                dispatchedOrders.length
                    ? totalRevenue / dispatchedOrders.length
                    : 0
            ).toFixed(2)
        ),
    };
};

// -------------------- Warehouse Sales Summary --------------------

const getWarehouseSalesSummary = async (
    userId,
    roleId,
    startDate = null,
    endDate = null,
    warehouseId = null
) => {
    validateDateRange(startDate, endDate);

    const warehouseIds = await getWarehouseFilter(
        userId,
        roleId,
        warehouseId
    );

    if (Array.isArray(warehouseIds) && warehouseIds.length === 0) {
        return [];
    }

    const warehouses = await reportRepository.getWarehouseSalesReport(
        warehouseIds,
        startDate,
        endDate
    );

    return warehouses.map((warehouse) => {
        const orders = warehouse.salesOrders || [];

        const dispatchedOrders = orders.filter(
            (order) => order.status === "DISPATCHED"
        );

        const totalRevenue = dispatchedOrders.reduce(
            (total, order) =>
                total +
                (order.items || []).reduce(
                    (sum, item) =>
                        sum +
                        Number(item.quantity) * Number(item.unitPrice),
                    0
                ),
            0
        );

        return {
            warehouseId: warehouse.id,
            warehouseName: warehouse.name,
            location: warehouse.location,
            totalOrders: orders.length,
            dispatchedOrders: dispatchedOrders.length,
            totalRevenue: Number(totalRevenue.toFixed(2)),
        };
    });
};

// -------------------- Inventory Report --------------------

const getInventoryReport = async (
    userId,
    roleId,
    warehouseId = null,
    lowStockOnly = false
) => {
    const warehouseIds = await getWarehouseFilter(
        userId,
        roleId,
        warehouseId
    );

    if (Array.isArray(warehouseIds) && warehouseIds.length === 0) {
        return {
            totalItems: 0,
            lowStockItems: 0,
            data: [],
        };
    }

    const inventoryRecords =
        await reportRepository.getInventoryReport(warehouseIds);

    const report = inventoryRecords
        .filter((item) => {
            if (lowStockOnly === true || lowStockOnly === "true") {
                return (
                    Number(item.quantity) <=
                    Number(item.reorderLevel)
                );
            }

            return true;
        })
        .map((item) => ({
            inventoryId: item.id,
            warehouseId: item.warehouseId,
            warehouseName: item.warehouse?.name ?? null,
            location: item.warehouse?.location ?? null,
            productId: item.productId,
            productName: item.product?.name ?? null,
            sku: item.product?.sku ?? null,
            quantity: Number(item.quantity),
            reorderLevel: Number(item.reorderLevel),
            lowStock:
                Number(item.quantity) <= Number(item.reorderLevel),
        }));

    return {
        totalItems: report.length,
        lowStockItems: report.filter((item) => item.lowStock).length,
        data: report,
    };
};

// -------------------- Stock Movement Summary --------------------

const getStockMovementSummary = async (
    userId,
    roleId,
    warehouseId = null,
    movementType = null,
    startDate = null,
    endDate = null
) => {
    validateDateRange(startDate, endDate);

    if (
        movementType !== null &&
        !["IN", "OUT"].includes(movementType)
    ) {
        throw new Error("Invalid Movement Type");
    }

    const warehouseIds = await getWarehouseFilter(
        userId,
        roleId,
        warehouseId
    );

    if (Array.isArray(warehouseIds) && warehouseIds.length === 0) {
        return {
            totalMovements: 0,
            totalIn: 0,
            totalOut: 0,
            data: [],
        };
    }

    const movements =
        await reportRepository.getStockMovementReport(
            warehouseIds,
            warehouseId === null ? null : Number(warehouseId),
            movementType,
            startDate,
            endDate
        );

    const data = movements.map((movement) => ({
        movementId: movement.id,
        type: movement.type,
        quantity: Number(movement.quantity),
        note: movement.note,
        createdAt: movement.createdAt,
        product: {
            id: movement.inventory?.product?.id ?? null,
            name: movement.inventory?.product?.name ?? null,
            sku: movement.inventory?.product?.sku ?? null,
        },
        warehouse: {
            id: movement.inventory?.warehouse?.id ?? null,
            name: movement.inventory?.warehouse?.name ?? null,
            location: movement.inventory?.warehouse?.location ?? null,
        },
        performedBy: {
            id: movement.user?.id ?? null,
            name: movement.user?.name ?? null,
            email: movement.user?.email ?? null,
        },
    }));

    return {
        totalMovements: data.length,
        totalIn: data
            .filter((item) => item.type === "IN")
            .reduce((total, item) => total + item.quantity, 0),
        totalOut: data
            .filter((item) => item.type === "OUT")
            .reduce((total, item) => total + item.quantity, 0),
        data,
    };
};

// -------------------- Purchase Summary --------------------

const getPurchaseSummary = async (
    userId,
    roleId,
    warehouseId = null,
    status = null,
    startDate = null,
    endDate = null
) => {
    validateDateRange(startDate, endDate);

    const validStatuses = [
        "DRAFT",
        "ORDERED",
        "RECEIVED",
        "CANCELLED",
    ];

    if (status !== null && !validStatuses.includes(status)) {
        throw new Error("Invalid Purchase Order Status");
    }

    const warehouseIds = await getWarehouseFilter(
        userId,
        roleId,
        warehouseId
    );

    if (Array.isArray(warehouseIds) && warehouseIds.length === 0) {
        return {
            totalOrders: 0,
            statusCounts: {
                DRAFT: 0,
                ORDERED: 0,
                RECEIVED: 0,
                CANCELLED: 0,
            },
            receivedOrders: 0,
            receivedPurchaseValue: 0,
            data: [],
        };
    }

    const orders = await reportRepository.getPurchaseReport(
        warehouseIds,
        warehouseId === null ? null : Number(warehouseId),
        status,
        startDate,
        endDate
    );

    const statusCounts = {
        DRAFT: 0,
        ORDERED: 0,
        RECEIVED: 0,
        CANCELLED: 0,
    };

    let receivedPurchaseValue = 0;

    const data = orders.map((order) => {
        if (Object.hasOwn(statusCounts, order.status)) {
            statusCounts[order.status]++;
        }

        const items = (order.items || []).map((item) => {
            const quantity = Number(item.quantity);
            const unitPrice = Number(item.unitPrice);

            return {
                productId: item.product?.id ?? item.productId,
                productName: item.product?.name ?? null,
                sku: item.product?.sku ?? null,
                quantity,
                unitPrice,
                subtotal: Number((quantity * unitPrice).toFixed(2)),
            };
        });

        const totalValue = items.reduce(
            (total, item) => total + item.subtotal,
            0
        );

        if (order.status === "RECEIVED") {
            receivedPurchaseValue += totalValue;
        }

        return {
            purchaseOrderId: order.id,
            status: order.status,
            createdAt: order.createdAt,
            supplier: {
                id: order.supplier?.id ?? null,
                name: order.supplier?.name ?? null,
            },
            warehouse: {
                id: order.warehouse?.id ?? null,
                name: order.warehouse?.name ?? null,
                location: order.warehouse?.location ?? null,
            },
            totalItems: items.length,
            totalQuantity: items.reduce(
                (total, item) => total + item.quantity,
                0
            ),
            totalValue: Number(totalValue.toFixed(2)),
            items,
        };
    });

    return {
        totalOrders: data.length,
        statusCounts,
        receivedOrders: statusCounts.RECEIVED,
        receivedPurchaseValue: Number(
            receivedPurchaseValue.toFixed(2)
        ),
        data,
    };
};

export {
    getSalesSummary,
    getWarehouseSalesSummary,
    getInventoryReport,
    getStockMovementSummary,
    getPurchaseSummary,
};
