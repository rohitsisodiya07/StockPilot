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



const getAllSalesOrders = async (userId, roleId, status = null) => {
    const allowedStatuses = [
        "DRAFT",
        "CONFIRMED",
        "DISPATCHED",
        "CANCELLED",
    ];

    if (status && !allowedStatuses.includes(status)) {
        throw new Error("Invalid Sales Order Status");
    }

    let warehouseIds = null;

    if (roleId !== 1) {
        const warehouses = await userWarehouseService.getUserWarehouses(userId);
        warehouseIds = warehouses.map((item) => item.warehouseId);
    }

    const salesOrders = await salesOrderRepository.getAllSalesOrders(
        warehouseIds,
        status
    );

    return salesOrders.map((order) => {
        const data = order.toJSON();

        const totalAmount = data.items.reduce(
            (total, item) =>
                total + item.quantity * Number(item.unitPrice),
            0
        );

        return {
            ...data,
            totalAmount: Number(totalAmount.toFixed(2)),
        };
    });
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
