
import * as purchaseOrderRepository from "@/Repository/purchaseOrderRepository";
import * as supplierRepository from "@/Repository/supplierRepository";
import * as warehouseRepository from "@/Repository/warehouseRepository";
import * as userWarehouseService from "@/Service/userWarehouseService";

import sequelize from "@/lib/db/sequelize";
import * as model from "@/Model/index";

const ADMIN_ROLE = 1;
const MANAGER_ROLE = 4;
const STAFF_ROLE = 5;

const WRITE_ROLES = [ADMIN_ROLE, MANAGER_ROLE];

const VALID_STATUSES = [
    "DRAFT",
    "ORDERED",
    "RECEIVED",
    "CANCELLED",
];

const ALLOWED_SORT_FIELDS = [
    "id",
    "status",
    "expectedDeliveryDate",
    "createdAt",
    "updatedAt",
];

const normalizeRoleId = (roleId) => Number(roleId);

const validatePositiveId = (value, fieldName) => {
    if (!Number.isSafeInteger(value) || value <= 0) {
        throw new Error(`Valid ${fieldName} Is Required`);
    }
};

const validateWritePermission = (roleId) => {
    if (!WRITE_ROLES.includes(normalizeRoleId(roleId))) {
        throw new Error("Access Denied");
    }
};

const validateExpectedDeliveryDate = (value) => {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    if (typeof value !== "string") {
        throw new Error("Invalid Expected Delivery Date");
    }

    // Accept strict YYYY-MM-DD calendar dates only
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (!match) {
        throw new Error("Invalid Expected Delivery Date");
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(Date.UTC(year, month - 1, day));

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        throw new Error("Invalid Expected Delivery Date");
    }

    return value;
};

// CREATE PURCHASE ORDER
const createPurchaseOrder = async (userId, roleId, data) => {
    validateWritePermission(roleId);

    validatePositiveId(userId, "User ID");

    const { supplierId, warehouseId } = data;

    validatePositiveId(supplierId, "Supplier ID");
    validatePositiveId(warehouseId, "Warehouse ID");

    const expectedDeliveryDate = validateExpectedDeliveryDate(
        data.expectedDeliveryDate
    );

    // Supplier must exist and be active
    const supplier = await supplierRepository.getOneSupplier(
        supplierId
    );

    if (!supplier) {
        throw new Error("Supplier Not Found");
    }

    if (supplier.status !== "ACTIVE") {
        throw new Error("Supplier Is Inactive");
    }

    // Warehouse must exist
    const warehouse = await warehouseRepository.getOneWarehouse(
        warehouseId
    );

    if (!warehouse) {
        throw new Error("Warehouse Not Found");
    }

    // Admin access policy is handled by the warehouse service
    await userWarehouseService.checkWarehouseAccess(
        userId,
        normalizeRoleId(roleId),
        warehouseId
    );

    return purchaseOrderRepository.createPurchaseOrder({
        supplierId,
        warehouseId,
        createdBy: userId,
        expectedDeliveryDate,
        status: "DRAFT",
    });
};

// LIST PURCHASE ORDERS
const getAllPurchaseOrders = async (
    userId,
    roleId,
    options = {}
) => {
    const normalizedRoleId = normalizeRoleId(roleId);

    if (
        ![ADMIN_ROLE, MANAGER_ROLE, STAFF_ROLE].includes(
            normalizedRoleId
        )
    ) {
        throw new Error("Access Denied");
    }

    const {
        search = "",
        status,
        supplierId,
        warehouseId,
        startDate,
        endDate,
        sortBy = "createdAt",
        sortOrder = "DESC",
        limit = 10,
        offset = 0,
    } = options;

    if (typeof search !== "string" || search.length > 100) {
        throw new Error("Invalid Search Value");
    }

    if (status && !VALID_STATUSES.includes(status)) {
        throw new Error("Invalid Purchase Order Status");
    }

    if (supplierId !== undefined && supplierId !== null) {
        validatePositiveId(supplierId, "Supplier ID");
    }

    if (warehouseId !== undefined && warehouseId !== null) {
        validatePositiveId(warehouseId, "Warehouse ID");
    }

    if (!ALLOWED_SORT_FIELDS.includes(sortBy)) {
        throw new Error("Invalid Purchase Order Sort Field");
    }

    if (!["ASC", "DESC"].includes(sortOrder)) {
        throw new Error("Invalid Purchase Order Sort Order");
    }

    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
        throw new Error("Limit Must Be Between 1 and 100");
    }

    if (!Number.isSafeInteger(offset) || offset < 0) {
        throw new Error("Invalid Offset");
    }

    if (startDate) {
        validateExpectedDeliveryDate(startDate);
    }

    if (endDate) {
        validateExpectedDeliveryDate(endDate);
    }

    if (startDate && endDate && startDate > endDate) {
        throw new Error("Start Date Cannot Be After End Date");
    }

    let warehouseIds = null;

    if (normalizedRoleId !== ADMIN_ROLE) {
        const assignments =
            await userWarehouseService.getUserWarehouses(userId);

        warehouseIds = assignments.map(
            (assignment) => Number(assignment.warehouseId)
        );

        // Never return orders from unassigned warehouses
        if (warehouseIds.length === 0) {
            return {
                items: [],
                pagination: {
                    total: 0,
                    limit,
                    offset,
                },
            };
        }

        if (
            warehouseId !== undefined &&
            warehouseId !== null &&
            !warehouseIds.includes(warehouseId)
        ) {
            throw new Error("Access Denied");
        }
    }

    const result =
        await purchaseOrderRepository.getAllPurchaseOrders(
            warehouseIds,
            {
                search: search.trim(),
                status,
                supplierId,
                warehouseId,
                startDate,
                endDate,
                sortBy,
                sortOrder,
                limit,
                offset,
            }
        );

    return {
        items: result.rows,
        pagination: {
            total: result.count,
            limit,
            offset,
        },
    };
};

// GET ONE PURCHASE ORDER
const getOnePurchaseOrder = async (
    userId,
    roleId,
    purchaseOrderId
) => {
    validatePositiveId(purchaseOrderId, "Purchase Order ID");

    const normalizedRoleId = normalizeRoleId(roleId);

    if (
        ![ADMIN_ROLE, MANAGER_ROLE, STAFF_ROLE].includes(
            normalizedRoleId
        )
    ) {
        throw new Error("Access Denied");
    }

    const purchaseOrder =
        await purchaseOrderRepository.getOnePurchaseOrder(
            purchaseOrderId
        );

    if (!purchaseOrder) {
        throw new Error("Purchase Order Not Found");
    }

    await userWarehouseService.checkWarehouseAccess(
        userId,
        normalizedRoleId,
        purchaseOrder.warehouseId
    );

    return purchaseOrder;
};

// UPDATE EXPECTED DELIVERY DATE
const updatePurchaseOrder = async (
    userId,
    roleId,
    purchaseOrderId,
    data
) => {
    validateWritePermission(roleId);
    validatePositiveId(purchaseOrderId, "Purchase Order ID");

    const purchaseOrder =
        await purchaseOrderRepository.getOnePurchaseOrder(
            purchaseOrderId
        );

    if (!purchaseOrder) {
        throw new Error("Purchase Order Not Found");
    }

    await userWarehouseService.checkWarehouseAccess(
        userId,
        normalizeRoleId(roleId),
        purchaseOrder.warehouseId
    );

    if (purchaseOrder.status !== "DRAFT") {
        throw new Error("Only Draft Orders Can Be Updated");
    }

    const expectedDeliveryDate = validateExpectedDeliveryDate(
        data.expectedDeliveryDate
    );

    return purchaseOrderRepository.updatePurchaseOrder(
        purchaseOrderId,
        { expectedDeliveryDate }
    );
};

// UPDATE PURCHASE ORDER STATUS
const updatePurchaseOrderStatus = async (
    userId,
    roleId,
    purchaseOrderId,
    status
) => {
    validateWritePermission(roleId);
    validatePositiveId(purchaseOrderId, "Purchase Order ID");

    if (!["ORDERED", "CANCELLED"].includes(status)) {
        throw new Error("Invalid Purchase Order Status");
    }

    const purchaseOrder =
        await purchaseOrderRepository.getOnePurchaseOrder(
            purchaseOrderId
        );

    if (!purchaseOrder) {
        throw new Error("Purchase Order Not Found");
    }

    await userWarehouseService.checkWarehouseAccess(
        userId,
        normalizeRoleId(roleId),
        purchaseOrder.warehouseId
    );

    if (purchaseOrder.status !== "DRAFT") {
        throw new Error("Only Draft Orders Can Change Status");
    }

    if (status === "ORDERED") {
        const itemCount = await model.PurchaseOrderItem.count({
            where: { purchaseOrderId },
        });

        if (itemCount === 0) {
            throw new Error("Cannot Order Without Items");
        }
    }

    // Recheck and update while holding a row lock to reduce
    // conflicting status transitions.
    return sequelize.transaction(async (transaction) => {
        const lockedOrder = await model.PurchaseOrder.findByPk(
            purchaseOrderId,
            {
                transaction,
                lock: transaction.LOCK.UPDATE,
            }
        );

        if (!lockedOrder) {
            throw new Error("Purchase Order Not Found");
        }

        if (lockedOrder.status !== "DRAFT") {
            throw new Error("Only Draft Orders Can Change Status");
        }

        if (status === "ORDERED") {
            const itemCount = await model.PurchaseOrderItem.count({
                where: { purchaseOrderId },
                transaction,
            });

            if (itemCount === 0) {
                throw new Error("Cannot Order Without Items");
            }
        }

        await lockedOrder.update({ status }, { transaction });

        return lockedOrder;
    });
};

// RECEIVE PURCHASE ORDER AND UPDATE INVENTORY
const receivePurchaseOrder = async (
    userId,
    roleId,
    purchaseOrderId
) => {
    validateWritePermission(roleId);
    validatePositiveId(purchaseOrderId, "Purchase Order ID");
    validatePositiveId(userId, "User ID");

    // Check access before performing stock operations
    const existingOrder =
        await purchaseOrderRepository.getOnePurchaseOrder(
            purchaseOrderId
        );

    if (!existingOrder) {
        throw new Error("Purchase Order Not Found");
    }

    await userWarehouseService.checkWarehouseAccess(
        userId,
        normalizeRoleId(roleId),
        existingOrder.warehouseId
    );

    return sequelize.transaction(async (transaction) => {
        const purchaseOrder = await model.PurchaseOrder.findByPk(
            purchaseOrderId,
            {
                transaction,
                lock: transaction.LOCK.UPDATE,
            }
        );

        if (!purchaseOrder) {
            throw new Error("Purchase Order Not Found");
        }

        if (purchaseOrder.status !== "ORDERED") {
            throw new Error(
                "Only Ordered Purchases Can Be Received"
            );
        }

        const items = await model.PurchaseOrderItem.findAll({
            where: { purchaseOrderId },
            transaction,
        });

        if (items.length === 0) {
            throw new Error("Purchase Order Has No Items");
        }

        for (const item of items) {
            let inventory = await model.Inventory.findOne({
                where: {
                    productId: item.productId,
                    warehouseId: purchaseOrder.warehouseId,
                },
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            if (inventory) {
                await inventory.increment("quantity", {
                    by: item.quantity,
                    transaction,
                });

                await inventory.reload({ transaction });
            } else {
                inventory = await model.Inventory.create(
                    {
                        productId: item.productId,
                        warehouseId: purchaseOrder.warehouseId,
                        quantity: item.quantity,
                        reorderLevel: 10,
                    },
                    { transaction }
                );
            }

            await model.StockMovement.create(
                {
                    inventoryId: inventory.id,
                    type: "IN",
                    quantity: item.quantity,
                    note: `Purchase Order #${purchaseOrderId} received`,
                    userId,
                },
                { transaction }
            );
        }

        await purchaseOrder.update(
            { status: "RECEIVED" },
            { transaction }
        );

        return purchaseOrder;
    });
};

export {
    createPurchaseOrder,
    getAllPurchaseOrders,
    getOnePurchaseOrder,
    updatePurchaseOrder,
    updatePurchaseOrderStatus,
    receivePurchaseOrder,
};
