import * as purchaseOrderService from "@/Service/purchaseOrderService";

const createPurchaseOrder = async (request, user) => {
    try {
        const body = await request.json();

        const data = await purchaseOrderService.createPurchaseOrder(
            user.id,
            user.roleId,
            {
                supplierId: Number(body.supplierId),
                warehouseId: Number(body.warehouseId),
                expectedDeliveryDate: body.expectedDeliveryDate || null,
            }
        );

        return Response.json({
            success: true,
            message: "Purchase Order Created Successfully",
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


const getAllPurchaseOrders = async (user) => {
    try {
        const data = await purchaseOrderService.getAllPurchaseOrders(
            user.id,
            user.roleId
        );

        return Response.json({
            success: true,
            message: "Purchase Orders Fetched Successfully",
            data,
        });
    } catch (error) {
        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 500 }
        );
    }
};



const getOnePurchaseOrder = async (user, id) => {
    try {
        const data = await purchaseOrderService.getOnePurchaseOrder(
            user.id,
            user.roleId,
            id
        );

        return Response.json({
            success: true,
            message: "Purchase Order Fetched Successfully",
            data,
        });
    } catch (error) {
        const status = error.message === "Purchase Order Not Found"
            ? 404
            : error.message.includes("Access Denied")
                ? 403
                : 500;

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status }
        );
    }
};



const updatePurchaseOrderStatus = async (request, user, id) => {
    try {
        const body = await request.json();

        const data = await purchaseOrderService.updatePurchaseOrderStatus(
            user.id,
            user.roleId,
            Number(id),
            body.status
        );

        return Response.json({
            success: true,
            message: "Purchase Order Status Updated Successfully",
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


const receivePurchaseOrder = async (user, id) => {
    try {
        const data = await purchaseOrderService.receivePurchaseOrder(
            user.id,
            user.roleId,
            Number(id)
        );

        return Response.json({
            success: true,
            message: "Purchase Order Received Successfully",
            data,
        });
    } catch (error) {
        const status = error.message.includes("Access Denied")
            ? 403
            : error.message.includes("Not Found")
                ? 404
                : 400;

        return Response.json(
            { success: false, message: error.message },
            { status }
        );
    }
};


export {
    createPurchaseOrder,
    getAllPurchaseOrders,
    getOnePurchaseOrder,
    updatePurchaseOrderStatus,
    receivePurchaseOrder
};
