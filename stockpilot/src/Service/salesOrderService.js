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

    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
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
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Invalid Sales Order Data");
    }

    const { warehouseId, customerName, customerEmail } = data;
    const parsedWarehouseId = Number(warehouseId);

    if (
        warehouseId === undefined ||
        warehouseId === null ||
        warehouseId === "" ||
        !Number.isSafeInteger(parsedWarehouseId) ||
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

    if (customerName.trim().length > 255) {
        throw new Error("Customer Name Is Too Long");
    }

    if (
        customerEmail !== undefined &&
        customerEmail !== null &&
        typeof customerEmail !== "string"
    ) {
        throw new Error("Invalid Customer Email");
    }

    const normalizedEmail = customerEmail?.trim() || null;

    if (
        normalizedEmail &&
        (
            normalizedEmail.length > 255 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
        )
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
        customerEmail: normalizedEmail,
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
        !Number.isSafeInteger(parsedPage) ||
        parsedPage < 1 ||
        !Number.isSafeInteger(parsedLimit) ||
        parsedLimit < 1
    ) {
        throw new Error("Invalid Pagination");
    }

    page = parsedPage;
    limit = Math.min(parsedLimit, 100);
    sortOrder = sortOrder.toUpperCase();

    const offset = (page - 1) * limit;

    if (!Number.isSafeInteger(offset)) {
        throw new Error("Invalid Pagination");
    }

    let warehouseIds = null;

    if (Number(roleId) !== 1) {
        const warehouses =
            await userWarehouseService.getUserWarehouses(userId);

        warehouseIds = warehouses.map(
            (item) => Number(item.warehouseId)
        );
    }

    if (
        warehouseId !== null &&
        warehouseId !== undefined &&
        warehouseId !== ""
    ) {
        const parsedWarehouseId = Number(warehouseId);

        if (
            !Number.isSafeInteger(parsedWarehouseId) ||
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
                !["DRAFT", "CONFIRMED"].includes(salesOrder.status)
            ) {
                throw new Error(
                    "Only Draft or Confirmed Orders Can Be Cancelled"
                );
            }
        }

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

        // Combine repeated products to avoid processing the same
        // inventory record multiple times.
        const quantitiesByProduct = new Map();

        for (const item of salesOrder.items) {
            const productId = Number(item.productId);
            const quantity = Number(item.quantity);

            if (
                !Number.isSafeInteger(productId) ||
                productId <= 0 ||
                !Number.isSafeInteger(quantity) ||
                quantity <= 0
            ) {
                throw new Error("Invalid Sales Order Item");
            }

            const combinedQuantity =
                (quantitiesByProduct.get(productId) || 0) + quantity;

            if (!Number.isSafeInteger(combinedQuantity)) {
                throw new Error("Invalid Sales Order Item Quantity");
            }

            quantitiesByProduct.set(productId, combinedQuantity);
        }

        for (const [productId, requiredQuantity] of quantitiesByProduct) {
            const inventory = await model.Inventory.findOne({
                where: {
                    productId,
                    warehouseId: salesOrder.warehouseId,
                },
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            if (!inventory) {
                throw new Error(
                    `Inventory Not Found for Product ID ${productId}`
                );
            }

            const currentQuantity = Number(inventory.quantity);

            if (
                !Number.isSafeInteger(currentQuantity) ||
                currentQuantity < 0
            ) {
                throw new Error(
                    `Invalid Inventory Quantity for Product ID ${productId}`
                );
            }

            if (currentQuantity < requiredQuantity) {
                throw new Error(
                    `Insufficient Stock for Product ID ${productId}`
                );
            }

            const newQuantity = currentQuantity - requiredQuantity;

            await inventory.update(
                { quantity: newQuantity },
                { transaction }
            );

            await model.StockMovement.create(
                {
                    inventoryId: inventory.id,
                    type: "OUT",
                    quantity: requiredQuantity,
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