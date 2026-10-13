import * as purchaseOrderService from "@/Service/purchaseOrderService";

const sendErrorResponse = (error, action) => {
    console.error(`${action} Error:`, error);

    const message = error.message || "";

    let status = 500;
    let responseMessage = "Internal Server Error";

    if (message.includes("Access Denied")) {
        status = 403;
        responseMessage = message;
    } else if (message.includes("Not Found")) {
        status = 404;
        responseMessage = message;
    } else if (
        message.includes("Required") ||
        message.includes("Invalid") ||
        message.includes("Must") ||
        message.includes("Only") ||
        message.includes("Already") ||
        message.includes("Cannot") ||
        message.includes("Insufficient") ||
        message.includes("Exists")
    ) {
        status = 400;
        responseMessage = message;
    }

    return Response.json(
        {
            success: false,
            message: responseMessage,
        },
        { status }
    );
};

const parseOrderId = (id) => {
    const orderId = Number(id);

    return Number.isInteger(orderId) && orderId > 0
        ? orderId
        : null;
};

const createPurchaseOrder = async (request, user) => {
    try {
        const body = await request.json();

        if (!body || typeof body !== "object" || Array.isArray(body)) {
            return Response.json(
                { success: false, message: "Invalid Request Body" },
                { status: 400 }
            );
        }

        const supplierId = Number(body.supplierId);
        const warehouseId = Number(body.warehouseId);

        if (
            body.supplierId === undefined ||
            body.supplierId === null ||
            body.supplierId === "" ||
            body.warehouseId === undefined ||
            body.warehouseId === null ||
            body.warehouseId === ""
        ) {
            return Response.json(
                {
                    success: false,
                    message: "Supplier ID and Warehouse ID Are Required",
                },
                { status: 400 }
            );
        }

        if (
            !Number.isInteger(supplierId) || supplierId <= 0 ||
            !Number.isInteger(warehouseId) || warehouseId <= 0
        ) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid Supplier ID or Warehouse ID",
                },
                { status: 400 }
            );
        }

        const data = await purchaseOrderService.createPurchaseOrder(
            user.id,
            user.roleId,
            {
                supplierId,
                warehouseId,
                expectedDeliveryDate: body.expectedDeliveryDate || null,
            }
        );

        return Response.json(
            {
                success: true,
                message: "Purchase Order Created Successfully",
                data,
            },
            { status: 201 }
        );
    } catch (error) {
        return sendErrorResponse(error, "Create Purchase Order");
    }
};

const getAllPurchaseOrders = async (user) => {
    try {
        const data = await purchaseOrderService.getAllPurchaseOrders(
            user.id,
            user.roleId
        );

        return Response.json(
            {
                success: true,
                message: "Purchase Orders Fetched Successfully",
                data,
            },
            { status: 200 }
        );
    } catch (error) {
        return sendErrorResponse(error, "Get Purchase Orders");
    }
};

const getOnePurchaseOrder = async (user, id) => {
    const orderId = parseOrderId(id);

    if (orderId === null) {
        return Response.json(
            { success: false, message: "Invalid Purchase Order ID" },
            { status: 400 }
        );
    }

    try {
        const data = await purchaseOrderService.getOnePurchaseOrder(
            user.id,
            user.roleId,
            orderId
        );

        return Response.json(
            {
                success: true,
                message: "Purchase Order Fetched Successfully",
                data,
            },
            { status: 200 }
        );
    } catch (error) {
        return sendErrorResponse(error, "Get Purchase Order");
    }
};

const updatePurchaseOrderStatus = async (request, user, id) => {
    const orderId = parseOrderId(id);

    if (orderId === null) {
        return Response.json(
            { success: false, message: "Invalid Purchase Order ID" },
            { status: 400 }
        );
    }

    try {
        const body = await request.json();

        if (
            !body ||
            typeof body !== "object" ||
            Array.isArray(body) ||
            typeof body.status !== "string" ||
            !body.status.trim()
        ) {
            return Response.json(
                { success: false, message: "Valid Status Is Required" },
                { status: 400 }
            );
        }

        const data = await purchaseOrderService.updatePurchaseOrderStatus(
            user.id,
            user.roleId,
            orderId,
            body.status.trim()
        );

        return Response.json(
            {
                success: true,
                message: "Purchase Order Status Updated Successfully",
                data,
            },
            { status: 200 }
        );
    } catch (error) {
        return sendErrorResponse(error, "Update Purchase Order Status");
    }
};

const receivePurchaseOrder = async (user, id) => {
    const orderId = parseOrderId(id);

    if (orderId === null) {
        return Response.json(
            { success: false, message: "Invalid Purchase Order ID" },
            { status: 400 }
        );
    }

    try {
        const data = await purchaseOrderService.receivePurchaseOrder(
            user.id,
            user.roleId,
            orderId
        );

        return Response.json(
            {
                success: true,
                message: "Purchase Order Received Successfully",
                data,
            },
            { status: 200 }
        );
    } catch (error) {
        return sendErrorResponse(error, "Receive Purchase Order");
    }
};

export {
    createPurchaseOrder,
    getAllPurchaseOrders,
    getOnePurchaseOrder,
    updatePurchaseOrderStatus,
    receivePurchaseOrder,
};
