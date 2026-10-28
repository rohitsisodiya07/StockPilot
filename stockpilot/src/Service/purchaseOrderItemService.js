
import * as purchaseOrderItemRepository from "@/Repository/purchaseOrderItemRepository";
import * as purchaseOrderRepository from "@/Repository/purchaseOrderRepository";
import * as productRepository from "@/Repository/productRepository";
import * as userWarehouseService from "@/Service/userWarehouseService";

const MAX_UNIT_PRICE = 99999999.99;

const ALLOWED_SORT_FIELDS = [
    "id",
    "quantity",
    "unitPrice",
    "createdAt",
];

const ALLOWED_SORT_ORDERS = ["ASC", "DESC"];

// Validate positive integer IDs
const validatePositiveId = (value, fieldName) => {
    if (!Number.isSafeInteger(value) || value <= 0) {
        throw new Error(`Valid ${fieldName} Is Required`);
    }
};

// Validate item input
const validateItemData = ({ productId, quantity, unitPrice }) => {
    validatePositiveId(productId, "Product ID");

    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
        throw new Error("Quantity Must Be A Positive Integer");
    }

    if (
        typeof unitPrice !== "number" ||
        !Number.isFinite(unitPrice) ||
        unitPrice < 0 ||
        unitPrice > MAX_UNIT_PRICE ||
        Math.round(unitPrice * 100) !== unitPrice * 100
    ) {
        throw new Error(
            "Unit Price Must Be Between 0 and 99999999.99 With At Most Two Decimal Places"
        );
    }
};

// Create purchase order item
const createPurchaseOrderItem = async (
    userId,
    roleId,
    purchaseOrderId,
    data
) => {
    validatePositiveId(purchaseOrderId, "Purchase Order ID");

    const { productId, quantity, unitPrice } = data;

    validateItemData({ productId, quantity, unitPrice });

    // Check purchase order exists
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

    // Verify user can access this warehouse
    await userWarehouseService.checkWarehouseAccess(
        userId,
        roleId,
        purchaseOrder.warehouseId
    );

    // Check product exists
    const product = await productRepository.getOneProduct(productId);

    if (!product) {
        throw new Error("Product Not Found");
    }

    // Create item
    return purchaseOrderItemRepository.createPurchaseOrderItem({
        purchaseOrderId,
        productId,
        quantity,
        unitPrice,
    });
};

// Get purchase order items with search, sorting and pagination
const getPurchaseOrderItems = async (
    userId,
    roleId,
    purchaseOrderId,
    options = {}
) => {
    validatePositiveId(purchaseOrderId, "Purchase Order ID");

    const {
        search = "",
        sortBy = "id",
        sortOrder = "ASC",
        limit = 10,
        offset = 0,
    } = options;

    if (typeof search !== "string" || search.length > 100) {
        throw new Error("Invalid Search Value");
    }

    if (!ALLOWED_SORT_FIELDS.includes(sortBy)) {
        throw new Error("Invalid Purchase Order Item Sort Field");
    }

    if (!ALLOWED_SORT_ORDERS.includes(sortOrder)) {
        throw new Error("Invalid Purchase Order Item Sort Order");
    }

    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
        throw new Error("Limit Must Be Between 1 and 100");
    }

    if (!Number.isSafeInteger(offset) || offset < 0) {
        throw new Error("Invalid Offset");
    }

    // Check order exists
    const purchaseOrder =
        await purchaseOrderRepository.getOnePurchaseOrder(
            purchaseOrderId
        );

    if (!purchaseOrder) {
        throw new Error("Purchase Order Not Found");
    }

    // Check warehouse access before returning items
    await userWarehouseService.checkWarehouseAccess(
        userId,
        roleId,
        purchaseOrder.warehouseId
    );

    // Repository must return { rows, count }
    const result =
        await purchaseOrderItemRepository.getPurchaseOrderItems(
            purchaseOrderId,
            {
                search: search.trim(),
                sortBy,
                sortOrder,
                limit,
                offset,
            }
        );

    return {
        items: result.rows,
        total: result.count,
    };
};


const deletePurchaseOrderItem = async (
    userId,
    roleId,
    purchaseOrderId,
    itemId
) => {
    if (
        !Number.isSafeInteger(purchaseOrderId) ||
        purchaseOrderId <= 0
    ) {
        throw new Error("Valid Purchase Order ID Is Required");
    }

    if (!Number.isSafeInteger(itemId) || itemId <= 0) {
        throw new Error("Valid Purchase Order Item ID Is Required");
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
        Number(roleId),
        purchaseOrder.warehouseId
    );

    if (Number(roleId) !== 1 && Number(roleId) !== 4) {
        throw new Error("Access Denied");
    }

    if (purchaseOrder.status !== "DRAFT") {
        throw new Error("Only Draft Order Items Can Be Deleted");
    }

    const item =
        await purchaseOrderItemRepository.getOnePurchaseOrderItem(
            itemId
        );

    if (!item || item.purchaseOrderId !== purchaseOrderId) {
        throw new Error("Purchase Order Item Not Found");
    }

    return purchaseOrderItemRepository.deletePurchaseOrderItem(
        itemId
    );
};


export {
    createPurchaseOrderItem,
    getPurchaseOrderItems,
    deletePurchaseOrderItem
};
