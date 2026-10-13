import * as salesOrderService from "@/Service/salesOrderService";

// -------------------- Common Helpers --------------------

const parseOrderId = (id) => {
    const orderId = Number(id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
        throw new Error("Invalid Sales Order ID");
    }

    return orderId;
};

const handleError = (error, action) => {
    console.error(`${action} Error:`, error);

    const message = error?.message || "";

    let status = 500;

    if (
        message === "Invalid Sales Order ID" ||
        message.includes("Invalid") ||
        message.includes("Required") ||
        message.includes("Only") ||
        message.includes("Without Items") ||
        message.includes("Insufficient Stock") ||
        message.includes("Cannot") ||
        message.includes("Must")
    ) {
        status = 400;
    } else if (message.includes("Access Denied")) {
        status = 403;
    } else if (message.includes("Not Found")) {
        status = 404;
    }

    return Response.json(
        {
            success: false,
            message:
                status === 500
                    ? "Internal Server Error"
                    : message,
        },
        { status }
    );
};

// -------------------- Create Sales Order --------------------

const createSalesOrder = async (request, user) => {
    try {
        const body = await request.json();

        if (!body || typeof body !== "object" || Array.isArray(body)) {
            throw new Error("Invalid Request Body");
        }

        if (
            body.warehouseId === undefined ||
            body.warehouseId === null ||
            body.warehouseId === ""
        ) {
            throw new Error("Warehouse ID Is Required");
        }

        const warehouseId = Number(body.warehouseId);

        if (!Number.isInteger(warehouseId) || warehouseId <= 0) {
            throw new Error("Invalid Warehouse ID");
        }

        const data = await salesOrderService.createSalesOrder(
            user.id,
            user.roleId,
            {
                warehouseId,
                customerName: body.customerName,
                customerEmail: body.customerEmail,
            }
        );

        return Response.json(
            {
                success: true,
                message: "Sales Order Created Successfully",
                data,
            },
            { status: 201 }
        );
    } catch (error) {
        return handleError(error, "Create Sales Order");
    }
};

// -------------------- Get All Sales Orders --------------------

const getAllSalesOrders = async (request, user) => {
    try {
        const { searchParams } = new URL(request.url);

        const result = await salesOrderService.getAllSalesOrders(
            user.id,
            user.roleId,
            searchParams.get("status"),
            searchParams.get("search"),
            searchParams.get("page") ?? 1,
            searchParams.get("limit") ?? 10,
            searchParams.get("startDate"),
            searchParams.get("endDate"),
            searchParams.get("sortBy") || "createdAt",
            searchParams.get("sortOrder") || "DESC",
            searchParams.get("warehouseId")
        );

        return Response.json({
            success: true,
            message: "Sales Orders Fetched Successfully",
            data: result.data,
            pagination: result.pagination,
        });
    } catch (error) {
        return handleError(error, "Get Sales Orders");
    }
};

// -------------------- Get One Sales Order --------------------

const getOneSalesOrder = async (user, id) => {
    try {
        const orderId = parseOrderId(id);

        const data = await salesOrderService.getOneSalesOrder(
            user.id,
            user.roleId,
            orderId
        );

        return Response.json({
            success: true,
            message: "Sales Order Fetched Successfully",
            data,
        });
    } catch (error) {
        return handleError(error, "Get Sales Order");
    }
};

// -------------------- Update Sales Order Status --------------------

const updateSalesOrderStatus = async (request, user, id) => {
    try {
        const orderId = parseOrderId(id);
        const body = await request.json();

        if (
            !body ||
            typeof body.status !== "string" ||
            !body.status.trim()
        ) {
            throw new Error("Sales Order Status Is Required");
        }

        const data = await salesOrderService.updateSalesOrderStatus(
            user.id,
            user.roleId,
            orderId,
            body.status.trim().toUpperCase()
        );

        return Response.json({
            success: true,
            message: "Sales Order Status Updated Successfully",
            data,
        });
    } catch (error) {
        return handleError(error, "Update Sales Order Status");
    }
};

// -------------------- Dispatch Sales Order --------------------

const dispatchSalesOrder = async (user, id) => {
    try {
        const orderId = parseOrderId(id);

        const data = await salesOrderService.dispatchSalesOrder(
            user.id,
            user.roleId,
            orderId
        );

        return Response.json({
            success: true,
            message: "Sales Order Dispatched Successfully",
            data,
        });
    } catch (error) {
        return handleError(error, "Dispatch Sales Order");
    }
};

export {
    createSalesOrder,
    getAllSalesOrders,
    getOneSalesOrder,
    updateSalesOrderStatus,
    dispatchSalesOrder,
};
