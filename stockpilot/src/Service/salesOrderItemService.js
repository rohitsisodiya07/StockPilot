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
        !Number.isInteger(number) ||
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
    const orderId = validatePositiveInteger(
        salesOrderId,
        "Sales Order ID"
    );

    const productId = validatePositiveInteger(
        data?.productId,
        "Product ID"
    );

    const quantity = validatePositiveInteger(
        data?.quantity,
        "Quantity"
    );

    if (
        data?.unitPrice === undefined ||
        data?.unitPrice === null ||
        data?.unitPrice === "" ||
        !Number.isFinite(Number(data.unitPrice)) ||
        Number(data.unitPrice) < 0
    ) {
        throw new Error("Valid Unit Price Is Required");
    }

    const unitPrice = Number(data.unitPrice);

    if (!Number.isFinite(unitPrice) || unitPrice > 99999999.99) {
        throw new Error("Valid Unit Price Is Required");
    }

    const transaction = await sequelize.transaction();

    try {
        // Lock the order so it cannot be confirmed concurrently
        // while an item is being added.
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

        await userWarehouseService.checkWarehouseAccess(
            userId,
            roleId,
            salesOrder.warehouseId
        );

        const product = await productRepository.getOneProduct(
            productId
        );

        if (!product) {
            throw new Error("Product Not Found");
        }

        if (product.status !== "ACTIVE") {
            throw new Error("Product Is Inactive");
        }

        const item = await salesOrderItemRepository.createSalesOrderItem(
            {
                salesOrderId: orderId,
                productId,
                quantity,
                unitPrice,
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

    return await salesOrderItemRepository.getSalesOrderItems(
        orderId
    );
};

export {
    createSalesOrderItem,
    getSalesOrderItems,
};
