
import * as purchaseOrderService from "@/Service/purchaseOrderService";

const sendErrorResponse = (error) => {
    const message = error?.message || "Internal Server Error";

    let status = 500;

    if (
        message === "Invalid or Expired Token" ||
        message === "Unauthorized"
    ) {
        status = 401;
    } else if (
        message.includes("Access Denied") ||
        message.includes("Forbidden")
    ) {
        status = 403;
    } else if (message.includes("Not Found")) {
        status = 404;
    } else if (
        message.includes("Only ") ||
        message.includes("Cannot ") ||
        message.includes("Already ") ||
        message.includes("Conflict")
    ) {
        status = 409;
    } else if (
        message.includes("Required") ||
        message.includes("Invalid") ||
        message.includes("Must ") ||
        message.includes("Cannot Be") ||
        message.includes("Inactive") ||
        message.includes("Between") ||
        message.includes("After End Date")
    ) {
        status = 400;
    }

    // Avoid exposing unexpected internal errors to clients
    const safeMessage =
        status === 500 ? "Internal Server Error" : message;

    console.error("Purchase Order Controller Error:", error);

    return Response.json(
        {
            success: false,
            message: safeMessage,
        },
        { status }
    );
};

const parsePositiveId = (value, fieldName = "ID") => {
    const parsed = Number(value);

    if (
        value === undefined ||
        value === null ||
        String(value).trim() === "" ||
        !Number.isSafeInteger(parsed) ||
        parsed <= 0
    ) {
        throw new Error(`Valid ${fieldName} Is Required`);
    }

    return parsed;
};

const parseJsonBody = async (request) => {
    let body;

    try {
        body = await request.json();
    } catch {
        throw new Error("Invalid JSON Request Body");
    }

    if (
        body === null ||
        typeof body !== "object" ||
        Array.isArray(body)
    ) {
        throw new Error("Request Body Must Be A JSON Object");
    }

    return body;
};

const getUserDetails = (user) => {
    const userId = Number(user?.id);
    const roleId = Number(user?.roleId);

    if (
        !Number.isSafeInteger(userId) ||
        userId <= 0 ||
        !Number.isSafeInteger(roleId)
    ) {
        throw new Error("Unauthorized");
    }

    return { userId, roleId };
};

const parseListQuery = (request) => {
    const params = new URL(request.url).searchParams;

    const getOptionalPositiveInt = (key) => {
        const value = params.get(key);

        if (value === null) {
            return undefined;
        }

        return parsePositiveId(value, key);
    };

    const limitValue = params.get("limit");
    const offsetValue = params.get("offset");

    const limit =
        limitValue === null ? 10 : Number(limitValue);

    const offset =
        offsetValue === null ? 0 : Number(offsetValue);

    if (
        !Number.isSafeInteger(limit) ||
        limit < 1 ||
        limit > 100
    ) {
        throw new Error("Limit Must Be Between 1 and 100");
    }

    if (!Number.isSafeInteger(offset) || offset < 0) {
        throw new Error("Invalid Offset");
    }

    const search = params.get("search") ?? "";
    const status = params.get("status") || undefined;
    const sortBy = params.get("sortBy") || "createdAt";
    const sortOrder = (
        params.get("sortOrder") || "DESC"
    ).toUpperCase();

    if (search.length > 100) {
        throw new Error("Invalid Search Value");
    }

    const allowedStatuses = [
        "DRAFT",
        "ORDERED",
        "RECEIVED",
        "CANCELLED",
    ];

    if (status && !allowedStatuses.includes(status)) {
        throw new Error("Invalid Purchase Order Status");
    }

    const allowedSortFields = [
        "id",
        "status",
        "expectedDeliveryDate",
        "createdAt",
        "updatedAt",
    ];

    if (!allowedSortFields.includes(sortBy)) {
        throw new Error("Invalid Purchase Order Sort Field");
    }

    if (!["ASC", "DESC"].includes(sortOrder)) {
        throw new Error("Invalid Purchase Order Sort Order");
    }


    const startDate = params.get("startDate") || undefined;
    const endDate = params.get("endDate") || undefined;

    const isValidDate = (value) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return false;
        }

        const date = new Date(`${value}T00:00:00.000Z`);

        return (
            !Number.isNaN(date.getTime()) &&
            date.toISOString().slice(0, 10) === value
        );
    };

    if (startDate && !isValidDate(startDate)) {
        throw new Error("Invalid Start Date");
    }

    if (endDate && !isValidDate(endDate)) {
        throw new Error("Invalid End Date");
    }

    if (startDate && endDate && startDate > endDate) {
        throw new Error("Start Date Cannot Be After End Date");
    }


    return {
        search,
        status,
        supplierId: getOptionalPositiveInt("supplierId"),
        warehouseId: getOptionalPositiveInt("warehouseId"),
        startDate,
        endDate,
        sortBy,
        sortOrder,
        limit,
        offset,
    };
};

// POST /api/purchase-order
const createPurchaseOrder = async (request, user) => {
    try {
        const { userId, roleId } = getUserDetails(user);
        const body = await parseJsonBody(request);

        const allowedFields = [
            "supplierId",
            "warehouseId",
            "expectedDeliveryDate",
        ];

        const unknownFields = Object.keys(body).filter(
            (key) => !allowedFields.includes(key)
        );

        if (unknownFields.length > 0) {
            throw new Error(
                `Invalid Fields: ${unknownFields.join(", ")}`
            );
        }

        const supplierId = parsePositiveId(
            body.supplierId,
            "Supplier ID"
        );

        const warehouseId = parsePositiveId(
            body.warehouseId,
            "Warehouse ID"
        );

        const result =
            await purchaseOrderService.createPurchaseOrder(
                userId,
                roleId,
                {
                    supplierId,
                    warehouseId,
                    expectedDeliveryDate:
                        body.expectedDeliveryDate ?? null,
                }
            );

        return Response.json(
            {
                success: true,
                message: "Purchase Order Created Successfully",
                data: result,
            },
            { status: 201 }
        );
    } catch (error) {
        return sendErrorResponse(error);
    }
};

// GET /api/purchase-order
const getAllPurchaseOrders = async (request, user) => {
    try {
        const { userId, roleId } = getUserDetails(user);
        const options = parseListQuery(request);

        const result =
            await purchaseOrderService.getAllPurchaseOrders(
                userId,
                roleId,
                options
            );

        return Response.json(
            {
                success: true,
                message: "Purchase Orders Fetched Successfully",
                data: result.items,
                pagination: result.pagination,
            },
            { status: 200 }
        );
    } catch (error) {
        return sendErrorResponse(error);
    }
};

// GET /api/purchase-order/:id
const getOnePurchaseOrder = async (user, id) => {
    try {
        const { userId, roleId } = getUserDetails(user);
        const purchaseOrderId = parsePositiveId(
            id,
            "Purchase Order ID"
        );

        const result =
            await purchaseOrderService.getOnePurchaseOrder(
                userId,
                roleId,
                purchaseOrderId
            );

        return Response.json(
            {
                success: true,
                message: "Purchase Order Fetched Successfully",
                data: result,
            },
            { status: 200 }
        );
    } catch (error) {
        return sendErrorResponse(error);
    }
};

// PUT /api/purchase-order/:id
// Only expectedDeliveryDate is editable through this endpoint
const updatePurchaseOrder = async (request, user, id) => {
    try {
        const { userId, roleId } = getUserDetails(user);
        const purchaseOrderId = parsePositiveId(
            id,
            "Purchase Order ID"
        );

        const body = await parseJsonBody(request);
        const allowedFields = ["expectedDeliveryDate"];

        const fields = Object.keys(body);

        if (
            fields.length !== 1 ||
            fields.some((field) => !allowedFields.includes(field))
        ) {
            throw new Error(
                "Only Expected Delivery Date Can Be Updated"
            );
        }

        const result =
            await purchaseOrderService.updatePurchaseOrder(
                userId,
                roleId,
                purchaseOrderId,
                {
                    expectedDeliveryDate:
                        body.expectedDeliveryDate,
                }
            );

        return Response.json(
            {
                success: true,
                message: "Purchase Order Updated Successfully",
                data: result,
            },
            { status: 200 }
        );
    } catch (error) {
        return sendErrorResponse(error);
    }
};

// PATCH /api/purchase-order/:id
const updatePurchaseOrderStatus = async (
    request,
    user,
    id
) => {
    try {
        const { userId, roleId } = getUserDetails(user);
        const purchaseOrderId = parsePositiveId(
            id,
            "Purchase Order ID"
        );

        const body = await parseJsonBody(request);

        if (
            Object.keys(body).length !== 1 ||
            typeof body.status !== "string"
        ) {
            throw new Error(
                "Request Body Must Contain Only Status"
            );
        }

        const result =
            await purchaseOrderService.updatePurchaseOrderStatus(
                userId,
                roleId,
                purchaseOrderId,
                body.status
            );

        return Response.json(
            {
                success: true,
                message: "Purchase Order Status Updated Successfully",
                data: result,
            },
            { status: 200 }
        );
    } catch (error) {
        return sendErrorResponse(error);
    }
};

// POST /api/purchase-order/:id/receive
const receivePurchaseOrder = async (user, id) => {
    try {
        const { userId, roleId } = getUserDetails(user);
        const purchaseOrderId = parsePositiveId(
            id,
            "Purchase Order ID"
        );

        const result =
            await purchaseOrderService.receivePurchaseOrder(
                userId,
                roleId,
                purchaseOrderId
            );

        return Response.json(
            {
                success: true,
                message: "Purchase Order Received Successfully",
                data: result,
            },
            { status: 200 }
        );
    } catch (error) {
        return sendErrorResponse(error);
    }
};

export {
    createPurchaseOrder,
    getAllPurchaseOrders,
    getOnePurchaseOrder,
    updatePurchaseOrder,
    updatePurchaseOrderStatus,
    receivePurchaseOrder,
};
