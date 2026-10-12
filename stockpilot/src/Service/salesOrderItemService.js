import * as salesOrderItemRepository from "@/Repository/salesOrderItemRepository";
import * as salesOrderRepository from "@/Repository/salesOrderRepository";
import * as productRepository from "@/Repository/productRepository";
import * as userWarehouseService from "@/Service/userWarehouseService";

const createSalesOrderItem = async (userId, roleId, salesOrderId, data) => {
    const { productId, quantity, unitPrice } = data;

    if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
        throw new Error("Valid Product and Quantity Are Required");
    }

    if (unitPrice === undefined || unitPrice === null || Number(unitPrice) < 0 || !Number.isFinite(Number(unitPrice))) {
        throw new Error("Valid Unit Price Is Required");
    }

    const salesOrder = await salesOrderRepository.getOneSalesOrder(salesOrderId);

    if (!salesOrder) {
        throw new Error("Sales Order Not Found");
    }

    if (salesOrder.status !== "DRAFT") {
        throw new Error("Items Can Only Be Added to Draft Orders");
    }

    await userWarehouseService.checkWarehouseAccess(
        userId,
        roleId,
        salesOrder.warehouseId
    );

    const product = await productRepository.getOneProduct(productId);

    if (!product) {
        throw new Error("Product Not Found");
    }

    if (product.status !== "ACTIVE") {
        throw new Error("Product Is Inactive");
    }

    return await salesOrderItemRepository.createSalesOrderItem({
        salesOrderId: Number(salesOrderId),
        productId: Number(productId),
        quantity,
        unitPrice: Number(unitPrice),
    });
};

const getSalesOrderItems = async (userId, roleId, salesOrderId) => {
    const salesOrder = await salesOrderRepository.getOneSalesOrder(salesOrderId);

    if (!salesOrder) {
        throw new Error("Sales Order Not Found");
    }

    await userWarehouseService.checkWarehouseAccess(
        userId,
        roleId,
        salesOrder.warehouseId
    );

    return await salesOrderItemRepository.getSalesOrderItems(salesOrderId);
};

export {
    createSalesOrderItem,
    getSalesOrderItems,
};
