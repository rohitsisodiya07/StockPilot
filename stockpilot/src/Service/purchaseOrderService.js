import * as purchaseOrderRepository from "@/Repository/purchaseOrderRepository";
import * as supplierRepository from "@/Repository/supplierRepository";
import * as warehouseRepository from "@/Repository/warehouseRepository";
import * as userWarehouseService from "@/Service/userWarehouseService";

import sequelize from "@/lib/db/sequelize";
import * as model from "@/Model/index";


const createPurchaseOrder = async (userId, roleId, data) => {
    const { supplierId, warehouseId, expectedDeliveryDate } = data;

    if (!supplierId || !warehouseId) {
        throw new Error("Supplier and Warehouse Are Required");
    }

    const supplier = await supplierRepository.getOneSupplier(supplierId);

    if (!supplier) {
        throw new Error("Supplier Not Found");
    }

    if (supplier.status !== "ACTIVE") {
        throw new Error("Supplier Is Inactive");
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

    return await purchaseOrderRepository.createPurchaseOrder({
        supplierId,
        warehouseId,
        createdBy: userId,
        expectedDeliveryDate,
        status: "DRAFT",
    });
};


const getAllPurchaseOrders = async (userId, roleId) => {
    let warehouseIds = null;

    if (roleId !== 1) {
        const warehouses = await userWarehouseService.getUserWarehouses(userId);

        warehouseIds = warehouses.map((item) => item.warehouseId);
    }

    return await purchaseOrderRepository.getAllPurchaseOrders(warehouseIds);
};



const getOnePurchaseOrder = async (userId, roleId, id) => {
    const purchaseOrder = await purchaseOrderRepository.getOnePurchaseOrder(id);

    if (!purchaseOrder) {
        throw new Error("Purchase Order Not Found");
    }

    await userWarehouseService.checkWarehouseAccess(
        userId,
        roleId,
        purchaseOrder.warehouseId
    );

    return purchaseOrder;
};



const updatePurchaseOrderStatus = async (
    userId,
    roleId,
    id,
    status
) => {
    const purchaseOrder = await purchaseOrderRepository.getOnePurchaseOrder(id);

    if (!purchaseOrder) {
        throw new Error("Purchase Order Not Found");
    }

    await userWarehouseService.checkWarehouseAccess(
        userId,
        roleId,
        purchaseOrder.warehouseId
    );

    const allowedStatuses = ["ORDERED", "CANCELLED"];

    if (!allowedStatuses.includes(status)) {
        throw new Error("Invalid Purchase Order Status");
    }

    if (purchaseOrder.status !== "DRAFT") {
        throw new Error("Only Draft Orders Can Be Updated");
    }

    if (status === "ORDERED") {
        const items = await import("@/Repository/purchaseOrderItemRepository")
            .then((module) => module.getPurchaseOrderItems(id));

        if (items.length === 0) {
            throw new Error("Cannot Order Without Items");
        }
    }

    return await purchaseOrderRepository.updatePurchaseOrder(id, { status });
};


const receivePurchaseOrder = async (userId, roleId, id) => {
    const purchaseOrder =
        await purchaseOrderRepository.getOnePurchaseOrder(id);

    if (!purchaseOrder) {
        throw new Error("Purchase Order Not Found");
    }

    await userWarehouseService.checkWarehouseAccess(
        userId,
        roleId,
        purchaseOrder.warehouseId
    );

    return await sequelize.transaction(async (transaction) => {
        const order = await model.PurchaseOrder.findByPk(id, {
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (!order) {
            throw new Error("Purchase Order Not Found");
        }

        if (order.status !== "ORDERED") {
            throw new Error("Only Ordered Purchases Can Be Received");
        }

        const items = await model.PurchaseOrderItem.findAll({
            where: { purchaseOrderId: id },
            transaction,
        });

        if (items.length === 0) {
            throw new Error("Purchase Order Has No Items");
        }

        for (const item of items) {
            let inventory = await model.Inventory.findOne({
                where: {
                    productId: item.productId,
                    warehouseId: order.warehouseId,
                },
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            if (inventory) {
                await inventory.increment("quantity", {
                    by: item.quantity,
                    transaction,
                });
            } else {
                inventory = await model.Inventory.create(
                    {
                        productId: item.productId,
                        warehouseId: order.warehouseId,
                        quantity: item.quantity,
                    },
                    { transaction }
                );
            }

            await model.StockMovement.create(
                {
                    inventoryId: inventory.id,
                    type: "IN",
                    quantity: item.quantity,
                    note: `Purchase Order #${id} received`,
                    userId,
                },
                { transaction }
            );
        }

        await order.update(
            { status: "RECEIVED" },
            { transaction }
        );

        return order;
    });
};


export {
    createPurchaseOrder,
    getAllPurchaseOrders,
    getOnePurchaseOrder,
    updatePurchaseOrderStatus,
    receivePurchaseOrder
};
