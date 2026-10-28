import * as salesOrderItemRepository from "@/Repository/salesOrderItemRepository";
import * as salesOrderRepository from "@/Repository/salesOrderRepository";
import * as productRepository from "@/Repository/productRepository";
import * as userWarehouseService from "@/Service/userWarehouseService";
import sequelize from "@/lib/db/sequelize";
import * as model from "@/Model/index";

// -------------------- Helpers --------------------

const validatePositiveInteger = (value, fieldName) => {
    const number = Number(value);

    if (
        value === undefined ||
        value === null ||
        value === "" ||
        !Number.isSafeInteger(number) ||
        number <= 0
    ) {
        throw new Error(`Valid ${fieldName} Is Required`);
    }

    return number;
};

// -------------------- Create Sales Order Item --------------------

const createSalesOrderItem = async (
    userId,
    roleId,
    salesOrderId,
    data
) => {
    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {
        throw new Error("Invalid Sales Order Item Data");
    }

    const orderId = validatePositiveInteger(
        salesOrderId,
        "Sales Order ID"
    );

    const productId = validatePositiveInteger(
        data.productId,
        "Product ID"
    );

    const quantity = validatePositiveInteger(
        data.quantity,
        "Quantity"
    );

    const transaction = await sequelize.transaction();

    try {
        // Lock the sales order to prevent concurrent item additions
        // while the order is being confirmed.
        const salesOrder = await model.SalesOrder.findByPk(
            orderId,
            {
                transaction,
                lock: transaction.LOCK.UPDATE,
            }
        );

        if (!salesOrder) {
            throw new Error("Sales Order Not Found");
        }

        if (salesOrder.status !== "DRAFT") {
            throw new Error(
                "Items Can Only Be Added to Draft Orders"
            );
        }

        // Verify that the user can access this order's warehouse.
        await userWarehouseService.checkWarehouseAccess(
            userId,
            roleId,
            salesOrder.warehouseId
        );

        // Fetch the product and use its database price.
        const product = await productRepository.getOneProduct(
            productId
        );

        if (!product) {
            throw new Error("Product Not Found");
        }

        if (product.status !== "ACTIVE") {
            throw new Error("Product Is Inactive");
        }

        const unitPrice = Number(product.price);

        if (
            !Number.isFinite(unitPrice) ||
            unitPrice < 0 ||
            unitPrice > 99999999.99
        ) {
            throw new Error("Invalid Product Price");
        }

        // Save a snapshot of the product price with the order item.
        // Later product price changes will not change this order item.
        const item = await salesOrderItemRepository.createSalesOrderItem(
            {
                salesOrderId: orderId,
                productId,
                quantity,
                unitPrice: unitPrice.toFixed(2),
            },
            transaction
        );

        await transaction.commit();

        return item;
    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }

        throw error;
    }
};

// -------------------- Get Sales Order Items --------------------

const getSalesOrderItems = async (
    userId,
    roleId,
    salesOrderId
) => {
    const orderId = validatePositiveInteger(
        salesOrderId,
        "Sales Order ID"
    );

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

    const items = await salesOrderItemRepository.getSalesOrderItems(
        orderId
    );

    return items;
};

export {
    createSalesOrderItem,
    getSalesOrderItems,
};