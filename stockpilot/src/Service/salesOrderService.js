import * as salesOrderRepository from "@/Repository/salesOrderRepository";
import * as warehouseRepository from "@/Repository/warehouseRepository";
import * as userWarehouseService from "@/Service/userWarehouseService";
import sequelize from "@/lib/db/sequelize";
import * as model from "@/Model/index";

const createSalesOrder = async (userId, roleId, data) => {
    const { warehouseId, customerName, customerEmail } = data;

    if (!warehouseId || !customerName?.trim()) {
        throw new Error("Warehouse and Customer Name Are Required");
    }

    const warehouse = await warehouseRepository.getOneWarehouse(warehouseId);

    if (!warehouse) {
        throw new Error("Warehouse Not Found");
    }

    await userWarehouseService.checkWarehouseAccess(
        userId,
        roleId,
        warehouseId
    );

    return await salesOrderRepository.createSalesOrder({
        warehouseId,
        createdBy: userId,
        customerName: customerName.trim(),
        customerEmail: customerEmail || null,
        status: "DRAFT",
    });
};


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
    if (!["ASC", "DESC"].includes(sortOrder.toUpperCase())) {
        throw new Error("Invalid Sort Order");
    }

    const allowedSortFields = ["createdAt", "customerName", "status"];

    if (!allowedSortFields.includes(sortBy)) {
        throw new Error("Invalid Sort Field");
    }
    sortOrder = sortOrder.toUpperCase();

    page = Math.max(1, Number(page) || 1);
    limit = Math.min(100, Math.max(1, Number(limit) || 10));

    const offset = (page - 1) * limit;

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

        const warehouse = await warehouseRepository.getOneWarehouse(warehouseId);

        if (!warehouse) {
            throw new Error("Warehouse Not Found");
        }

        await userWarehouseService.checkWarehouseAccess(
            userId,
            roleId,
            warehouseId
        );
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

    const data = result.rows.map((order) => {
        const orderData = order.toJSON();

        const totalAmount = orderData.items.reduce(
            (total, item) =>
                total + item.quantity * Number(item.unitPrice),
            0
        );

        return {
            ...orderData,
            totalAmount: Number(totalAmount.toFixed(2)),
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



const getOneSalesOrder = async (userId, roleId, id) => {
    const salesOrder = await salesOrderRepository.getOneSalesOrder(id);

    if (!salesOrder) {
        throw new Error("Sales Order Not Found");
    }

    await userWarehouseService.checkWarehouseAccess(
        userId,
        roleId,
        salesOrder.warehouseId
    );

    const data = salesOrder.toJSON();

    const totalAmount = data.items.reduce(
        (total, item) =>
            total + item.quantity * Number(item.unitPrice),
        0
    );

    return {
        ...data,
        totalAmount: Number(totalAmount.toFixed(2)),
    };
};


const updateSalesOrderStatus = async (
    userId,
    roleId,
    id,
    status
) => {
    const salesOrder = await salesOrderRepository.getOneSalesOrder(id);

    if (!salesOrder) {
        throw new Error("Sales Order Not Found");
    }

    await userWarehouseService.checkWarehouseAccess(
        userId,
        roleId,
        salesOrder.warehouseId
    );

    if (!["CONFIRMED", "CANCELLED"].includes(status)) {
        throw new Error("Invalid Sales Order Status");
    }

    if (status === "CONFIRMED") {
        if (salesOrder.status !== "DRAFT") {
            throw new Error("Only Draft Orders Can Be Confirmed");
        }

        if (salesOrder.items.length === 0) {
            throw new Error("Cannot Confirm Order Without Items");
        }
    }

    if (status === "CANCELLED") {
        if (!["DRAFT", "CONFIRMED"].includes(salesOrder.status)) {
            throw new Error(
                "Only Draft or Confirmed Orders Can Be Cancelled"
            );
        }
    }

    return await salesOrderRepository.updateSalesOrder(id, {
        status,
    });
};


const dispatchSalesOrder = async (userId, roleId, id) => {
    const transaction = await sequelize.transaction();

    try {
        const salesOrder = await model.SalesOrder.findByPk(id, {
            include: [{ model: model.SalesOrderItem, as: "items" }],
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (!salesOrder) {
            throw new Error("Sales Order Not Found");
        }

        await userWarehouseService.checkWarehouseAccess(
            userId,
            roleId,
            salesOrder.warehouseId
        );

        if (salesOrder.status !== "CONFIRMED") {
            throw new Error("Only Confirmed Orders Can Be Dispatched");
        }

        if (salesOrder.items.length === 0) {
            throw new Error("Cannot Dispatch Order Without Items");
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

            if (!inventory || inventory.quantity < item.quantity) {
                throw new Error(
                    `Insufficient Stock for Product ID ${item.productId}`
                );
            }

            await inventory.update(
                { quantity: inventory.quantity - item.quantity },
                { transaction }
            );

            await model.StockMovement.create(
                {
                    inventoryId: inventory.id,
                    type: "OUT",
                    quantity: item.quantity,
                    note: `Sales Order #${id} dispatched`,
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
        await transaction.rollback();
        throw error;
    }
};



export {
    createSalesOrder,
    getAllSalesOrders,
    getOneSalesOrder,
    updateSalesOrderStatus,
    dispatchSalesOrder
};
