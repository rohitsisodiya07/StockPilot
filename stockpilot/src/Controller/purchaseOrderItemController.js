import * as purchaseOrderItemService from "@/Service/purchaseOrderItemService";

const createPurchaseOrderItem = async (request, user, purchaseOrderId) => {
    try {
        const body = await request.json();

        const data = await purchaseOrderItemService.createPurchaseOrderItem(
            user.id,
            user.roleId,
            Number(purchaseOrderId),
            {
                productId: Number(body.productId),
                quantity: Number(body.quantity),
                unitPrice: Number(body.unitPrice),
            }
        );

        return Response.json({
            success: true,
            message: "Purchase Order Item Created Successfully",
            data,
        }, { status: 201 });
    } catch (error) {
        const status = error.message.includes("Access Denied")
            ? 403
            : error.message.includes("Not Found")
                ? 404
                : 400;

        return Response.json({
            success: false,
            message: error.message,
        }, { status });
    }
};

const getPurchaseOrderItems = async (user, purchaseOrderId) => {
    try {
        const data = await purchaseOrderItemService.getPurchaseOrderItems(
            user.id,
            user.roleId,
            Number(purchaseOrderId)
        );

        return Response.json({
            success: true,
            message: "Purchase Order Items Fetched Successfully",
            data,
        });
    } catch (error) {
        const status = error.message.includes("Access Denied")
            ? 403
            : error.message.includes("Not Found")
                ? 404
                : 400;

        return Response.json({
            success: false,
            message: error.message,
        }, { status });
    }
};

export {
    createPurchaseOrderItem,
    getPurchaseOrderItems,
};
