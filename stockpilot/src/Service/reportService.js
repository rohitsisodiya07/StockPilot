import * as reportRepository from "@/Repository/reportRepository";
import * as userWarehouseService from "@/Service/userWarehouseService";
import * as warehouseRepository from "@/Repository/warehouseRepository";

const getSalesSummary = async (
    userId,
    roleId,
    startDate = null,
    endDate = null,
    warehouseId = null
) => {
    const isValidDate = (value) =>
        /^\d{4}-\d{2}-\d{2}$/.test(value) &&
        !Number.isNaN(Date.parse(value)) &&
        new Date(value).toISOString().slice(0, 10) === value;

    if (startDate && !isValidDate(startDate)) {
        throw new Error("Invalid Start Date");
    }

    if (endDate && !isValidDate(endDate)) {
        throw new Error("Invalid End Date");
    }

    if (startDate && endDate && startDate > endDate) {
        throw new Error("Start Date Cannot Be After End Date");
    }

    let warehouseIds = null;

    if (roleId !== 1) {
        const warehouses =
            await userWarehouseService.getUserWarehouses(userId);

        warehouseIds = warehouses.map((item) => item.warehouseId);
    }

    if (warehouseId !== null) {
        warehouseId = Number(warehouseId);

        if (!Number.isInteger(warehouseId) || warehouseId <= 0) {
            throw new Error("Invalid Warehouse ID");
        }

        const warehouse =
            await warehouseRepository.getOneWarehouse(warehouseId);

        if (!warehouse) {
            throw new Error("Warehouse Not Found");
        }

        await userWarehouseService.checkWarehouseAccess(
            userId,
            roleId,
            warehouseId
        );

        warehouseIds = [warehouseId];
    }


    const orders = await reportRepository.getSalesOrdersForReport(
        warehouseIds,
        startDate,
        endDate
    );

    const totalOrders = orders.length;
    const statusCounts = {
        DRAFT: orders.filter((order) => order.status === "DRAFT").length,
        CONFIRMED: orders.filter((order) => order.status === "CONFIRMED").length,
        DISPATCHED: orders.filter((order) => order.status === "DISPATCHED").length,
        CANCELLED: orders.filter((order) => order.status === "CANCELLED").length,
    };

    const dispatchedOrders = orders.filter(
        (order) => order.status === "DISPATCHED"
    );

    const totalRevenue = dispatchedOrders.reduce(
        (total, order) =>
            total +
            order.items.reduce(
                (orderTotal, item) =>
                    orderTotal +
                    Number(item.quantity) * Number(item.unitPrice),
                0
            ),
        0
    );

    const averageOrderValue = dispatchedOrders.length
        ? totalRevenue / dispatchedOrders.length
        : 0;

    return {
        totalOrders,
        statusCounts,
        dispatchedOrders: dispatchedOrders.length,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
    };
};



const getWarehouseSalesSummary = async (
    userId,
    roleId,
    startDate = null,
    endDate = null,
    warehouseId = null
) => {
    const isValidDate = (value) =>
        /^\d{4}-\d{2}-\d{2}$/.test(value) &&
        !Number.isNaN(Date.parse(value)) &&
        new Date(value).toISOString().slice(0, 10) === value;

    // Validate dates
    if (startDate && !isValidDate(startDate)) {
        throw new Error("Invalid Start Date");
    }

    if (endDate && !isValidDate(endDate)) {
        throw new Error("Invalid End Date");
    }

    if (startDate && endDate && startDate > endDate) {
        throw new Error("Start Date Cannot Be After End Date");
    }

    // Get assigned warehouses for non-admin users
    let warehouseIds = null;

    if (roleId !== 1) {
        const warehouses =
            await userWarehouseService.getUserWarehouses(userId);

        warehouseIds = warehouses.map(
            (item) => item.warehouseId
        );
    }

    // Validate and authorize the requested warehouse
    if (warehouseId !== null) {
        warehouseId = Number(warehouseId);

        if (!Number.isInteger(warehouseId) || warehouseId <= 0) {
            throw new Error("Invalid Warehouse ID");
        }

        const warehouse =
            await warehouseRepository.getOneWarehouse(warehouseId);

        if (!warehouse) {
            throw new Error("Warehouse Not Found");
        }

        await userWarehouseService.checkWarehouseAccess(
            userId,
            roleId,
            warehouseId
        );

        warehouseIds = [warehouseId];
    }

    // Fetch sales orders
    const orders = await reportRepository.getWarehouseSalesReport(
        warehouseIds,
        startDate,
        endDate
    );

    const warehouseMap = new Map();

    // Calculate warehouse-wise statistics
    for (const order of orders) {
        const warehouse = order.warehouse;

        if (!warehouse) continue;

        if (!warehouseMap.has(warehouse.id)) {
            warehouseMap.set(warehouse.id, {
                warehouseId: warehouse.id,
                warehouseName: warehouse.name,
                location: warehouse.location,
                totalOrders: 0,
                dispatchedOrders: 0,
                totalRevenue: 0,
            });
        }

        const report = warehouseMap.get(warehouse.id);

        report.totalOrders += 1;

        if (order.status === "DISPATCHED") {
            report.dispatchedOrders += 1;

            report.totalRevenue += order.items.reduce(
                (total, item) =>
                    total +
                    Number(item.quantity) * Number(item.unitPrice),
                0
            );
        }
    }

    return Array.from(warehouseMap.values()).map((report) => ({
        ...report,
        totalRevenue: Number(report.totalRevenue.toFixed(2)),
    }));
};


const getInventoryReport = async (
    userId,
    roleId,
    warehouseId = null,
    lowStockOnly = false
) => {
    // Get assigned warehouses for non-admin users
    let warehouseIds = null;

    if (roleId !== 1) {
        const warehouses =
            await userWarehouseService.getUserWarehouses(userId);

        warehouseIds = warehouses.map(
            (item) => item.warehouseId
        );
    }

    // Validate and authorize a specific warehouse
    if (warehouseId !== null) {
        warehouseId = Number(warehouseId);

        if (!Number.isInteger(warehouseId) || warehouseId <= 0) {
            throw new Error("Invalid Warehouse ID");
        }

        const warehouse =
            await warehouseRepository.getOneWarehouse(warehouseId);

        if (!warehouse) {
            throw new Error("Warehouse Not Found");
        }

        await userWarehouseService.checkWarehouseAccess(
            userId,
            roleId,
            warehouseId
        );

        warehouseIds = [warehouseId];
    }

    // Fetch inventory records
    const inventoryRecords =
        await reportRepository.getInventoryReport(warehouseIds);

    // Calculate low-stock status
    const report = inventoryRecords
        .filter((item) => {
            if (lowStockOnly === true || lowStockOnly === "true") {
                return Number(item.quantity) <= Number(item.reorderLevel);
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



const getStockMovementSummary = async (
    userId,
    roleId,
    warehouseId = null,
    movementType = null,
    startDate = null,
    endDate = null
) => {
    const isValidDate = (value) =>
        /^\d{4}-\d{2}-\d{2}$/.test(value) &&
        !Number.isNaN(Date.parse(value)) &&
        new Date(value).toISOString().slice(0, 10) === value;

    // Validate dates
    if (startDate && !isValidDate(startDate)) {
        throw new Error("Invalid Start Date");
    }

    if (endDate && !isValidDate(endDate)) {
        throw new Error("Invalid End Date");
    }

    if (startDate && endDate && startDate > endDate) {
        throw new Error("Start Date Cannot Be After End Date");
    }

    // Validate movement type
    if (
        movementType !== null &&
        !["IN", "OUT"].includes(movementType)
    ) {
        throw new Error("Invalid Movement Type");
    }

    // Get assigned warehouses for non-admin users
    let warehouseIds = null;

    if (roleId !== 1) {
        const warehouses =
            await userWarehouseService.getUserWarehouses(userId);

        warehouseIds = warehouses.map(
            (item) => item.warehouseId
        );
    }

    // Validate and authorize a specific warehouse
    if (warehouseId !== null) {
        warehouseId = Number(warehouseId);

        if (!Number.isInteger(warehouseId) || warehouseId <= 0) {
            throw new Error("Invalid Warehouse ID");
        }

        const warehouse =
            await warehouseRepository.getOneWarehouse(warehouseId);

        if (!warehouse) {
            throw new Error("Warehouse Not Found");
        }

        await userWarehouseService.checkWarehouseAccess(
            userId,
            roleId,
            warehouseId
        );

        warehouseIds = [warehouseId];
    }

    // Fetch stock movements
    const movements =
        await reportRepository.getStockMovementReport(
            warehouseIds,
            warehouseId,
            movementType,
            startDate,
            endDate
        );

    // Format response
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

    const totalIn = data
        .filter((item) => item.type === "IN")
        .reduce((total, item) => total + item.quantity, 0);

    const totalOut = data
        .filter((item) => item.type === "OUT")
        .reduce((total, item) => total + item.quantity, 0);

    return {
        totalMovements: data.length,
        totalIn,
        totalOut,
        data,
    };
};


const getPurchaseSummary = async (
    userId,
    roleId,
    warehouseId = null,
    status = null,
    startDate = null,
    endDate = null
) => {
    const isValidDate = (value) =>
        /^\d{4}-\d{2}-\d{2}$/.test(value) &&
        !Number.isNaN(Date.parse(value)) &&
        new Date(value).toISOString().slice(0, 10) === value;

    // Validate dates
    if (startDate && !isValidDate(startDate)) {
        throw new Error("Invalid Start Date");
    }

    if (endDate && !isValidDate(endDate)) {
        throw new Error("Invalid End Date");
    }

    if (startDate && endDate && startDate > endDate) {
        throw new Error("Start Date Cannot Be After End Date");
    }

    // Validate purchase order status
    const validStatuses = [
        "DRAFT",
        "ORDERED",
        "RECEIVED",
        "CANCELLED",
    ];

    if (status !== null && !validStatuses.includes(status)) {
        throw new Error("Invalid Purchase Order Status");
    }

    // Get assigned warehouses for non-admin users
    let warehouseIds = null;

    if (roleId !== 1) {
        const warehouses =
            await userWarehouseService.getUserWarehouses(userId);

        warehouseIds = warehouses.map(
            (item) => item.warehouseId
        );
    }

    // Validate and authorize a specific warehouse
    if (warehouseId !== null) {
        warehouseId = Number(warehouseId);

        if (!Number.isInteger(warehouseId) || warehouseId <= 0) {
            throw new Error("Invalid Warehouse ID");
        }

        const warehouse =
            await warehouseRepository.getOneWarehouse(warehouseId);

        if (!warehouse) {
            throw new Error("Warehouse Not Found");
        }

        await userWarehouseService.checkWarehouseAccess(
            userId,
            roleId,
            warehouseId
        );

        warehouseIds = [warehouseId];
    }

    // Fetch purchase orders
    const orders = await reportRepository.getPurchaseReport(
        warehouseIds,
        warehouseId,
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
        statusCounts[order.status]++;

        const items = (order.items || []).map((item) => ({
            productId: item.product?.id ?? item.productId,
            productName: item.product?.name ?? null,
            sku: item.product?.sku ?? null,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            subtotal:
                Number(item.quantity) * Number(item.unitPrice),
        }));

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



export { getSalesSummary, getWarehouseSalesSummary, getInventoryReport, getStockMovementSummary, getPurchaseSummary };
