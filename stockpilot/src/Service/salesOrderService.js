import * as salesOrderRepository from "@/Repository/salesOrderRepository";
import * as warehouseRepository from "@/Repository/warehouseRepository";
import * as userWarehouseService from "@/Service/userWarehouseService";
import sequelize from "@/lib/db/sequelize";
import * as model from "@/Model/index";

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
    if (startDate && !isValidDate(startDate)) {
        throw new Error("Invalid Start Date");
    }

    if (endDate && !isValidDate(endDate)) {
        throw new Error("Invalid End Date");
    }

    if (startDate && endDate && startDate > endDate) {
        throw new Error("Start Date Cannot Be After End Date");
    }
};

const validateOrderId = (id) => {
    const orderId = Number(id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
        throw new Error("Invalid Sales Order ID");
    }

    return orderId;
};

const calculateTotalAmount = (items = []) => {
    const total = items.reduce(
        (sum, item) =>
            sum +
            Number(item.quantity) * Number(item.unitPrice),
        0
    );

    return Number(total.toFixed(2));
};

// -------------------- Create Sales Order --------------------

const createSalesOrder = async (userId, roleId, data) => {
    const { warehouseId, customerName, customerEmail } = data;

    const parsedWarehouseId = Number(warehouseId);

    if (
        warehouseId === undefined ||
        warehouseId === null ||
        warehouseId === "" ||
        !Number.isInteger(parsedWarehouseId) ||
        parsedWarehouseId <= 0
    ) {
        throw new Error("Valid Warehouse ID Is Required");
    }

    if (
        typeof customerName !== "string" ||
        !customerName.trim()
    ) {
        throw new Error("Customer Name Is Required");
    }

    if (
        customerEmail !== undefined &&
        customerEmail !== null &&
        typeof customerEmail !== "string"
    ) {
        throw new Error("Invalid Customer Email");
    }

    const warehouse = await warehouseRepository.getOneWarehouse(
        parsedWarehouseId
    );

    if (!warehouse) {
        throw new Error("Warehouse Not Found");
    }

    await userWarehouseService.checkWarehouseAccess(
        userId,
        roleId,
        parsedWarehouseId
    );

    return await salesOrderRepository.createSalesOrder({
        warehouseId: parsedWarehouseId,
        createdBy: userId,
        customerName: customerName.trim(),
        customerEmail: customerEmail?.trim() || null,
        status: "DRAFT",
    });
};

// -------------------- Get All Sales Orders --------------------

const getAllSalesOrders = async (
    userId,
    roleId,
    status = null,
    search = null,
    page = 1,
    limit = 10,
    startDate = null,
    endDate = null,
    sortBy = "createdAt",
    sortOrder = "DESC",
    warehouseId = null
) => {
    const allowedStatuses = [
        "DRAFT",
        "CONFIRMED",
        "DISPATCHED",
        "CANCELLED",
    ];

    if (status && !allowedStatuses.includes(status)) {
        throw new Error("Invalid Sales Order Status");
    }

    validateDateRange(startDate, endDate);

    if (
        typeof sortOrder !== "string" ||
        !["ASC", "DESC"].includes(sortOrder.toUpperCase())
    ) {
        throw new Error("Invalid Sort Order");
    }

    const allowedSortFields = [
        "createdAt",
        "customerName",
        "status",
    ];

    if (!allowedSortFields.includes(sortBy)) {
        throw new Error("Invalid Sort Field");
    }

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    if (
        !Number.isInteger(parsedPage) ||
        parsedPage < 1 ||
        !Number.isInteger(parsedLimit) ||
        parsedLimit < 1
    ) {
        throw new Error("Invalid Pagination");
    }

    page = parsedPage;
    limit = Math.min(parsedLimit, 100);
    sortOrder = sortOrder.toUpperCase();

    const offset = (page - 1) * limit;

    // Determine which warehouses the user can access.
    let warehouseIds = null;

    if (Number(roleId) !== 1) {
        const warehouses =
            await userWarehouseService.getUserWarehouses(userId);

        warehouseIds = warehouses.map(
            (item) => Number(item.warehouseId)
        );
    }

    // Validate a requested warehouse and enforce access.
    if (warehouseId !== null) {
        const parsedWarehouseId = Number(warehouseId);

        if (
            !Number.isInteger(parsedWarehouseId) ||
            parsedWarehouseId <= 0
        ) {
            throw new Error("Invalid Warehouse ID");
        }

        const warehouse = await warehouseRepository.getOneWarehouse(
            parsedWarehouseId
        );

        if (!warehouse) {
            throw new Error("Warehouse Not Found");
        }

        await userWarehouseService.checkWarehouseAccess(
            userId,
            roleId,
            parsedWarehouseId
        );

        warehouseId = parsedWarehouseId;
    }

    // Never query all orders for a non-admin without assignments.
    if (
        Array.isArray(warehouseIds) &&
        warehouseIds.length === 0
    ) {
        return {
            data: [],
            pagination: {
                page,
                limit,
                totalRecords: 0,
                totalPages: 0,
            },
        };
    }

    const result = await salesOrderRepository.getAllSalesOrders(
        warehouseIds,
        warehouseId,
        status,
        search,
        limit,
        offset,
        startDate,
        endDate,
        sortBy,
        sortOrder
    );

    const rows = result.rows || [];

    const data = rows.map((order) => {
        const orderData = order.toJSON();

        return {
            ...orderData,
            totalAmount: calculateTotalAmount(
                orderData.items || []
            ),
        };
    });

    return {
        data,
        pagination: {
            page,
            limit,
            totalRecords: result.count,
            totalPages: Math.ceil(result.count / limit),
        },
    };
};

// -------------------- Get One Sales Order --------------------

const getOneSalesOrder = async (userId, roleId, id) => {
    const orderId = validateOrderId(id);

    const salesOrder = await salesOrderRepository.getOneSalesOrder(
        orderId
    );

    if (!salesOrder) {
        throw new Error("Sales Order Not Found");
    }

    await userWarehouseService.checkWarehouseAccess(
        userId,
        roleId,
        salesOrder.warehouseId
    );

    const data = salesOrder.toJSON();

    return {
        ...data,
        totalAmount: calculateTotalAmount(data.items || []),
    };
};

// -------------------- Update Sales Order Status --------------------

const updateSalesOrderStatus = async (
    userId,
    roleId,
    id,
    status
) => {
    const orderId = validateOrderId(id);

    const allowedStatuses = [
        "CONFIRMED",
        "CANCELLED",
        "DISPATCHED",
    ];

    if (
        typeof status !== "string" ||
        !allowedStatuses.includes(status)
    ) {
        throw new Error("Invalid Sales Order Status");
    }

    // Lock the order to prevent simultaneous status transitions.
    const transaction = await sequelize.transaction();

    try {
        const salesOrder = await model.SalesOrder.findByPk(
            orderId,
            {
                include: [
                    {
                        model: model.SalesOrderItem,
                        as: "items",
                    },
                ],
                transaction,
                lock: transaction.LOCK.UPDATE,
            }
        );

        if (!salesOrder) {
            throw new Error("Sales Order Not Found");
        }

        await userWarehouseService.checkWarehouseAccess(
            userId,
            roleId,
            salesOrder.warehouseId
        );

        if (status === "CONFIRMED") {
            if (salesOrder.status !== "DRAFT") {
                throw new Error(
                    "Only Draft Orders Can Be Confirmed"
                );
            }

            if (!salesOrder.items || salesOrder.items.length === 0) {
                throw new Error(
                    "Cannot Confirm Order Without Items"
                );
            }
        }

        if (status === "CANCELLED") {
            if (
                !["DRAFT", "CONFIRMED"].includes(
                    salesOrder.status
                )
            ) {
                throw new Error(
                    "Only Draft or Confirmed Orders Can Be Cancelled"
                );
            }
        }

        // Dispatch must use dispatchSalesOrder so stock deduction
        // and movement creation happen in the same transaction.
        if (status === "DISPATCHED") {
            throw new Error(
                "Use Dispatch Endpoint to Dispatch Sales Orders"
            );
        }

        await salesOrder.update(
            { status },
            { transaction }
        );

        await transaction.commit();

        return salesOrder;
    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }

        throw error;
    }
};

// -------------------- Dispatch Sales Order --------------------

const dispatchSalesOrder = async (userId, roleId, id) => {
    const orderId = validateOrderId(id);
    const transaction = await sequelize.transaction();

    try {
        const salesOrder = await model.SalesOrder.findByPk(
            orderId,
            {
                include: [
                    {
                        model: model.SalesOrderItem,
                        as: "items",
                    },
                ],
                transaction,
                lock: transaction.LOCK.UPDATE,
            }
        );

        if (!salesOrder) {
            throw new Error("Sales Order Not Found");
        }

        await userWarehouseService.checkWarehouseAccess(
            userId,
            roleId,
            salesOrder.warehouseId
        );

        if (salesOrder.status !== "CONFIRMED") {
            throw new Error(
                "Only Confirmed Orders Can Be Dispatched"
            );
        }

        if (!salesOrder.items || salesOrder.items.length === 0) {
            throw new Error(
                "Cannot Dispatch Order Without Items"
            );
        }

        for (const item of salesOrder.items) {
            const inventory = await model.Inventory.findOne({
                where: {
                    productId: item.productId,
                    warehouseId: salesOrder.warehouseId,
                },
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            if (
                !inventory ||
                Number(inventory.quantity) < Number(item.quantity)
            ) {
                throw new Error(
                    `Insufficient Stock for Product ID ${item.productId}`
                );
            }

            await inventory.update(
                {
                    quantity:
                        Number(inventory.quantity) -
                        Number(item.quantity),
                },
                { transaction }
            );

            await model.StockMovement.create(
                {
                    inventoryId: inventory.id,
                    type: "OUT",
                    quantity: item.quantity,
                    note: `Sales Order #${orderId} dispatched`,
                    userId,
                },
                { transaction }
            );
        }

        await salesOrder.update(
            { status: "DISPATCHED" },
            { transaction }
        );

        await transaction.commit();

        return salesOrder;
    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }

        throw error;
    }
};

export {
    createSalesOrder,
    getAllSalesOrders,
    getOneSalesOrder,
    updateSalesOrderStatus,
    dispatchSalesOrder,
};
