import * as purchaseOrderItemRepository from "@/Repository/purchaseOrderItemRepository";
import * as purchaseOrderRepository from "@/Repository/purchaseOrderRepository";
import * as productRepository from "@/Repository/productRepository";
import * as userWarehouseService from "@/Service/userWarehouseService";

const createPurchaseOrderItem = async (
    userId,
    roleId,
    purchaseOrderId,
    data
) => {
    const { productId, quantity, unitPrice } = data;

    if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
        throw new Error("Valid Product and Quantity Are Required");
    }

    if (unitPrice === undefined || !Number.isFinite(Number(unitPrice)) || Number(unitPrice) < 0) {
        throw new Error("Valid Unit Price Is Required");
    }

    const purchaseOrder = await purchaseOrderRepository.getOnePurchaseOrder(
        purchaseOrderId
    );

    if (!purchaseOrder) {
        throw new Error("Purchase Order Not Found");
    }

    if (purchaseOrder.status !== "DRAFT") {
        throw new Error("Items Can Only Be Added To Draft Orders");
    }

    await userWarehouseService.checkWarehouseAccess(
        userId,
        roleId,
        purchaseOrder.warehouseId
    );

    const product = await productRepository.getOneProduct(productId);

    if (!product) {
        throw new Error("Product Not Found");
    }

    return await purchaseOrderItemRepository.createPurchaseOrderItem({
        purchaseOrderId,
        productId,
        quantity,
        unitPrice: Number(unitPrice),
    });
};

const getPurchaseOrderItems = async (userId, roleId, purchaseOrderId) => {
    const purchaseOrder = await purchaseOrderRepository.getOnePurchaseOrder(
        purchaseOrderId
    );

    if (!purchaseOrder) {
        throw new Error("Purchase Order Not Found");
    }

    await userWarehouseService.checkWarehouseAccess(
        userId,
        roleId,
        purchaseOrder.warehouseId
    );

    return await purchaseOrderItemRepository.getPurchaseOrderItems(
        purchaseOrderId
    );
};

export {
    createPurchaseOrderItem,
    getPurchaseOrderItems,
};
