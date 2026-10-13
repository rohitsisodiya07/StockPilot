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

    // Validate purchase order ID
    if (!Number.isInteger(purchaseOrderId) || purchaseOrderId <= 0) {
        throw new Error("Valid Purchase Order ID Is Required");
    }

    // Validate product ID
    if (!Number.isInteger(productId) || productId <= 0) {
        throw new Error("Valid Product ID Is Required");
    }

    // Validate quantity
    if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error("Quantity Must Be A Positive Integer");
    }

    // Validate unit price
    const parsedUnitPrice = Number(unitPrice);

    if (
        unitPrice === undefined ||
        unitPrice === null ||
        unitPrice === "" ||
        !Number.isFinite(parsedUnitPrice) ||
        parsedUnitPrice < 0
    ) {
        throw new Error("Valid Unit Price Is Required");
    }

    // Check purchase order
    const purchaseOrder =
        await purchaseOrderRepository.getOnePurchaseOrder(
            purchaseOrderId
        );

    if (!purchaseOrder) {
        throw new Error("Purchase Order Not Found");
    }

    // Items can only be added to draft orders
    if (purchaseOrder.status !== "DRAFT") {
        throw new Error("Items Can Only Be Added To Draft Orders");
    }

    // Check warehouse access
    await userWarehouseService.checkWarehouseAccess(
        userId,
        roleId,
        purchaseOrder.warehouseId
    );

    // Check product
    const product = await productRepository.getOneProduct(productId);

    if (!product) {
        throw new Error("Product Not Found");
    }

    // Create purchase order item
    return await purchaseOrderItemRepository.createPurchaseOrderItem({
        purchaseOrderId,
        productId,
        quantity,
        unitPrice: parsedUnitPrice,
    });
};

const getPurchaseOrderItems = async (
    userId,
    roleId,
    purchaseOrderId
) => {
    // Validate purchase order ID
    if (!Number.isInteger(purchaseOrderId) || purchaseOrderId <= 0) {
        throw new Error("Valid Purchase Order ID Is Required");
    }

    // Check purchase order
    const purchaseOrder =
        await purchaseOrderRepository.getOnePurchaseOrder(
            purchaseOrderId
        );

    if (!purchaseOrder) {
        throw new Error("Purchase Order Not Found");
    }

    // Check warehouse access
    await userWarehouseService.checkWarehouseAccess(
        userId,
        roleId,
        purchaseOrder.warehouseId
    );

    // Fetch purchase order items
    return await purchaseOrderItemRepository.getPurchaseOrderItems(
        purchaseOrderId
    );
};

export {
    createPurchaseOrderItem,
    getPurchaseOrderItems,
};
